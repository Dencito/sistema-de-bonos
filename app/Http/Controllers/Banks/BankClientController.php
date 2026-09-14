<?php

namespace App\Http\Controllers\Banks;

use App\Constants\BankAccess;
use App\Http\Controllers\Controller;
use App\Services\BankStore;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Clientes online: alta, busqueda y fusion de duplicados.
 *
 * La fusion es lo importante. En la planilla el mismo ID llegaba a tener cinco
 * nombres y el mismo nombre dos IDs, asi que cualquier total por cliente estaba
 * partido. Aca las fichas repetidas se unen y los movimientos se reapuntan.
 */
class BankClientController extends Controller
{
    public function __construct(private BankStore $store)
    {
    }

    private function autorizado(): bool
    {
        return BankAccess::allows(Auth::user());
    }

    private function sinPermiso()
    {
        return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
    }

    public function index()
    {
        if (!$this->autorizado()) {
            abort(403, 'No tenés permiso para ver los bancos');
        }

        return Inertia::render('Banks/Clients');
    }

    public function list(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $request->validate([
            'search' => 'nullable|string|max:100',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:500',
        ]);

        $movsPorCliente = collect($this->store->all(BankStore::MOVEMENTS))
            ->groupBy('bank_client_id');

        $clientes = $this->activos()->map(function ($c) use ($movsPorCliente) {
            $movs = $movsPorCliente->get($c['id'], collect());

            return array_merge($c, [
                'movs' => $movs->count(),
                'total_cargado' => round($movs->filter(fn ($m) => $m['amount'] > 0)->sum('amount'), 2),
                'total_retirado' => round($movs->filter(fn ($m) => $m['amount'] < 0)->sum('amount'), 2),
            ]);
        });

        if ($request->filled('search')) {
            $texto = Str::lower($request->search);
            $clientes = $clientes->filter(
                fn ($c) => Str::contains(Str::lower($c['name']), $texto)
                    || Str::contains(Str::lower((string) ($c['external_id'] ?? '')), $texto)
            );
        }

        $ordenados = $clientes->sortByDesc('total_cargado')->values();
        $porPagina = (int) $request->input('per_page', 25);
        $pagina = (int) $request->input('page', 1);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $ordenados->slice(($pagina - 1) * $porPagina, $porPagina)->values(),
                'current_page' => $pagina,
                'per_page' => $porPagina,
                'total' => $ordenados->count(),
                'last_page' => max(1, (int) ceil($ordenados->count() / $porPagina)),
            ],
        ]);
    }

    /**
     * Fichas que probablemente sean la misma persona: mismo ID con nombres
     * distintos, mismo nombre con IDs distintos, o nombres casi iguales.
     */
    public function duplicates()
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $clientes = $this->activos()->map(fn ($c) => [
            'id' => $c['id'],
            'external_id' => $c['external_id'] ?? null,
            'name' => $c['name'],
            'normalized_name' => $c['normalized_name'] ?? BankStore::normalizeName($c['name']),
        ]);

        $grupos = [];

        // Mismo ID de planilla, fichas distintas
        foreach ($clientes->filter(fn ($c) => $c['external_id'])->groupBy('external_id') as $externalId => $items) {
            if ($items->count() > 1) {
                $grupos[] = ['motivo' => 'Mismo ID (' . $externalId . ')', 'clientes' => $items->values()];
            }
        }

        // Mismo nombre, IDs distintos
        foreach ($clientes->groupBy('normalized_name') as $nombre => $items) {
            if ($nombre !== '' && $items->count() > 1) {
                $grupos[] = ['motivo' => 'Mismo nombre', 'clientes' => $items->values()];
            }
        }

        // Nombres casi iguales: "cludia cabello" vs "claudia cabello"
        $lista = $clientes->filter(fn ($c) => mb_strlen($c['normalized_name']) > 6)->values();
        $yaVistos = [];

        for ($i = 0; $i < $lista->count(); $i++) {
            for ($j = $i + 1; $j < $lista->count(); $j++) {
                $a = $lista[$i];
                $b = $lista[$j];

                if ($a['normalized_name'] === $b['normalized_name']) {
                    continue;
                }

                similar_text($a['normalized_name'], $b['normalized_name'], $porcentaje);

                if ($porcentaje < 85) {
                    continue;
                }

                $clave = min($a['id'], $b['id']) . '-' . max($a['id'], $b['id']);
                if (isset($yaVistos[$clave])) {
                    continue;
                }
                $yaVistos[$clave] = true;

                $grupos[] = [
                    'motivo' => 'Nombres parecidos (' . round($porcentaje) . '%)',
                    'clientes' => collect([$a, $b]),
                ];
            }
        }

        return response()->json(['success' => true, 'data' => array_slice($grupos, 0, 120)]);
    }

    /**
     * Une varias fichas en una. Los movimientos se reapuntan a la que queda y
     * las otras no se borran: quedan marcadas con merged_into_id.
     */
    public function merge(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'keep_id' => 'required|integer',
            'merge_ids' => 'required|array|min:1',
            'merge_ids.*' => 'integer',
        ]);

        $principal = $this->store->find(BankStore::CLIENTS, $datos['keep_id']);

        if (!$principal) {
            return response()->json(['success' => false, 'message' => 'Cliente no encontrado'], 404);
        }

        $aFusionar = array_values(array_diff(
            array_map('intval', $datos['merge_ids']),
            [(int) $principal['id']]
        ));

        if (!$aFusionar) {
            return response()->json(['success' => false, 'message' => 'Elegí al menos otra ficha para unir'], 422);
        }

        $movidos = $this->store->transaction(function () use ($principal, $aFusionar) {
            $movidos = $this->store->updateWhere(
                BankStore::MOVEMENTS,
                fn ($m) => in_array((int) ($m['bank_client_id'] ?? 0), $aFusionar, true),
                ['bank_client_id' => (int) $principal['id']]
            );

            $this->store->updateWhere(
                BankStore::CLIENTS,
                fn ($c) => in_array((int) $c['id'], $aFusionar, true),
                ['merged_into_id' => (int) $principal['id'], 'is_active' => false]
            );

            // Si la ficha que queda no tenia ID de planilla, se hereda el primero
            if (empty($principal['external_id'])) {
                $heredado = collect($this->store->all(BankStore::CLIENTS))
                    ->first(fn ($c) => in_array((int) $c['id'], $aFusionar, true) && !empty($c['external_id']));

                if ($heredado) {
                    $this->store->update(BankStore::CLIENTS, $principal['id'], [
                        'external_id' => $heredado['external_id'],
                    ]);
                }
            }

            return $movidos;
        }, [BankStore::CLIENTS, BankStore::MOVEMENTS]);

        return response()->json([
            'success' => true,
            'message' => count($aFusionar) . ' ficha(s) unidas a ' . $principal['name']
                . '. Se reapuntaron ' . $movidos . ' movimiento(s).',
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        if (!$this->store->find(BankStore::CLIENTS, $id)) {
            return response()->json(['success' => false, 'message' => 'Cliente no encontrado'], 404);
        }

        $datos = $request->validate([
            'name' => 'required|string|max:150',
            'external_id' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $datos['normalized_name'] = BankStore::normalizeName($datos['name']);

        return response()->json([
            'success' => true,
            'message' => 'Cliente actualizado',
            'data' => $this->store->update(BankStore::CLIENTS, $id, $datos),
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'name' => 'required|string|max:150',
            'external_id' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:255',
        ]);

        $normalizado = BankStore::normalizeName($datos['name']);

        // Avisa antes de crear un duplicado, pero no bloquea: puede haber dos
        // personas que de verdad se llamen igual.
        $parecido = $this->activos()->first(fn ($c) => ($c['normalized_name'] ?? '') === $normalizado);

        $cliente = $this->store->insert(BankStore::CLIENTS, array_merge($datos, [
            'normalized_name' => $normalizado,
            'is_active' => true,
            'merged_into_id' => null,
        ]));

        return response()->json([
            'success' => true,
            'message' => $parecido
                ? 'Cliente creado. Ojo: ya existía "' . $parecido['name'] . '" con el mismo nombre.'
                : 'Cliente creado',
            'data' => $cliente,
        ]);
    }

    /** Las fichas que no fueron absorbidas por otra. */
    private function activos(): Collection
    {
        return collect($this->store->all(BankStore::CLIENTS))
            ->filter(fn ($c) => empty($c['merged_into_id']))
            ->values();
    }
}
