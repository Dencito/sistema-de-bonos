<?php

namespace App\Http\Controllers\Banks;

use App\Constants\BankAccess;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BankStore;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Bancos online: las cuentas de la empresa, sus movimientos y sus saldos.
 *
 * Los datos viven en JSON (BankStore) hasta que se cierre el esquema. Los
 * saldos no se guardan en ningun lado: son saldo inicial + suma de movimientos,
 * siempre calculados.
 */
class BankController extends Controller
{
    public function __construct(private BankStore $store)
    {
    }

    /** Supervisor para arriba, mas los cargos CAJER@ y RECAUDADOR. */
    private function autorizado(): bool
    {
        return BankAccess::allows(Auth::user());
    }

    private function sinPermiso()
    {
        return response()->json([
            'success' => false,
            'message' => 'No tenés permiso para ver los bancos',
        ], 403);
    }

    public function index()
    {
        if (!$this->autorizado()) {
            abort(403, 'No tenés permiso para ver los bancos');
        }

        return Inertia::render('Banks/Index', [
            'accounts' => $this->cuentas()->values(),
            'kinds' => $this->tipos()->values(),
            'storage' => 'json',
        ]);
    }

    /**
     * Saldo por cuenta y totales del período. Es lo que en la planilla eran los
     * bloques "SALDO INICIAL", "RESUMEN" y "SALDO ACTUALIZADO", pero calculado.
     */
    public function summary(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $todos = collect($this->store->all(BankStore::MOVEMENTS));

        // Con un turno abierto, la tabla tiene que hablar del turno igual que
        // las tarjetas de arriba: el saldo de inicio es el que se declaro al
        // abrirlo, no el initial_balance de la cuenta. Si no, quien carga los
        // saldos en la apertura los ve en las tarjetas y en cero en la tabla.
        $turno = BankShiftController::abiertoDe($this->store);

        if ($turno) {
            $delTurno = $todos
                ->filter(fn ($m) => (int) ($m['bank_shift_id'] ?? 0) === (int) $turno['id'])
                ->groupBy('bank_account_id');

            $apertura = collect($turno['opening_balances'] ?? []);

            $filas = $this->cuentas()->map(function ($cuenta) use ($delTurno, $apertura) {
                $movs = $delTurno->get($cuenta['id'], collect());
                $neto = $this->sumar($movs);
                // Una cuenta creada despues de abrir el turno no figura en la
                // apertura: para esas vale su saldo inicial, si no se perderia.
                $inicio = (float) $apertura->get(
                    (string) $cuenta['id'],
                    $apertura->get($cuenta['id'], (float) $cuenta['initial_balance'])
                );

                return [
                    'id' => $cuenta['id'],
                    'name' => $cuenta['name'],
                    'slug' => $cuenta['slug'],
                    'initial_balance' => (float) $cuenta['initial_balance'],
                    'movs' => $movs->count(),
                    'cargas' => $this->sumar($movs->filter(fn ($m) => $m['amount'] > 0)),
                    'retiros' => $this->sumar($movs->filter(fn ($m) => $m['amount'] < 0)),
                    'neto' => $neto,
                    'saldo_inicio_periodo' => $inicio,
                    'saldo_actual' => round($inicio + $neto, 2),
                ];
            })->values();
        } else {
            $enPeriodo = $this->filtrarPorFecha($todos, $request)->groupBy('bank_account_id');

            // Lo acumulado hasta el final del periodo define el saldo de cierre
            $hasta = $todos
                ->when($request->filled('end_date'), fn ($c) => $c->filter(fn ($m) => $m['date'] <= $request->end_date))
                ->groupBy('bank_account_id')
                ->map(fn ($items) => $this->sumar($items));

            $filas = $this->cuentas()->map(function ($cuenta) use ($enPeriodo, $hasta) {
                $movs = $enPeriodo->get($cuenta['id'], collect());
                $neto = $this->sumar($movs);
                $saldoFinal = (float) $cuenta['initial_balance'] + (float) $hasta->get($cuenta['id'], 0);

                return [
                    'id' => $cuenta['id'],
                    'name' => $cuenta['name'],
                    'slug' => $cuenta['slug'],
                    'initial_balance' => (float) $cuenta['initial_balance'],
                    'movs' => $movs->count(),
                    'cargas' => $this->sumar($movs->filter(fn ($m) => $m['amount'] > 0)),
                    'retiros' => $this->sumar($movs->filter(fn ($m) => $m['amount'] < 0)),
                    'neto' => $neto,
                    'saldo_inicio_periodo' => $saldoFinal - $neto,
                    'saldo_actual' => $saldoFinal,
                ];
            })->values();
        }

        $porDia = $this->filtrarPorFecha($todos, $request)
            ->groupBy('date')
            ->map(fn ($items, $fecha) => [
                'date' => $fecha,
                'movs' => $items->count(),
                'cargas' => $this->sumar($items->filter(fn ($m) => $m['amount'] > 0)),
                'retiros' => $this->sumar($items->filter(fn ($m) => $m['amount'] < 0)),
                'neto' => $this->sumar($items),
            ])
            ->sortKeys()
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'cuentas' => $filas,
                'por_dia' => $porDia,
                'totales' => [
                    'saldo_inicio_periodo' => $filas->sum('saldo_inicio_periodo'),
                    'cargas' => $filas->sum('cargas'),
                    'retiros' => $filas->sum('retiros'),
                    'neto' => $filas->sum('neto'),
                    'saldo_actual' => $filas->sum('saldo_actual'),
                    'movs' => $filas->sum('movs'),
                ],
            ],
        ]);
    }

    /**
     * Alta de una cuenta desde el mismo selector del formulario, para no tener
     * que salir a otra pantalla cuando aparece un banco que no estaba.
     */
    public function storeAccount(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'name' => 'required|string|max:100',
            'initial_balance' => 'nullable|numeric',
        ]);

        $cuentas = $this->cuentas();
        $slug = $this->slugUnico($datos['name'], $cuentas);

        $repetida = $cuentas->first(
            fn ($c) => BankStore::normalizeName($c['name']) === BankStore::normalizeName($datos['name'])
        );

        if ($repetida) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe una cuenta llamada "' . $repetida['name'] . '"',
            ], 422);
        }

        $cuenta = $this->store->insert(BankStore::ACCOUNTS, [
            'name' => trim($datos['name']),
            'slug' => $slug,
            'initial_balance' => (float) ($datos['initial_balance'] ?? 0),
            'is_active' => true,
            'sort_order' => (int) $cuentas->max('sort_order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cuenta "' . $cuenta['name'] . '" creada',
            'data' => $cuenta,
        ]);
    }

    /**
     * Actualiza una cuenta. Sirve sobre todo para cargar el saldo inicial con
     * el que arranca el sistema.
     */
    public function updateAccount(Request $request, $id)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        if (!$this->store->find(BankStore::ACCOUNTS, $id)) {
            return response()->json(['success' => false, 'message' => 'Cuenta no encontrada'], 404);
        }

        $datos = $request->validate([
            'name' => 'required|string|max:100',
            'initial_balance' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cuenta actualizada',
            'data' => $this->store->update(BankStore::ACCOUNTS, $id, $datos),
        ]);
    }

    private function slugUnico(string $nombre, Collection $cuentas): string
    {
        $base = Str::slug($nombre, '_') ?: 'cuenta';
        $slug = $base;
        $n = 2;

        while ($cuentas->contains(fn ($c) => $c['slug'] === $slug)) {
            $slug = $base . '_' . $n++;
        }

        return $slug;
    }

    /**
     * Alta de un tipo de movimiento desde el propio selector.
     *
     * El signo es obligatorio: sin el, el sistema no sabria si el monto suma o
     * resta del saldo de la cuenta.
     */
    public function storeKind(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'name' => 'required|string|max:60',
            'sign' => 'required|in:' . implode(',', [
                BankStore::SIGNO_ENTRA,
                BankStore::SIGNO_SALE,
                BankStore::SIGNO_SEGUN_MONTO,
            ]),
        ]);

        $tipos = $this->tipos();

        $repetido = $tipos->first(
            fn ($t) => BankStore::normalizeName($t['name']) === BankStore::normalizeName($datos['name'])
        );

        if ($repetido) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe un tipo llamado "' . $repetido['name'] . '"',
            ], 422);
        }

        $tipo = $this->store->insert(BankStore::KINDS, [
            'name' => trim($datos['name']),
            'slug' => $this->slugUnico($datos['name'], $tipos),
            'sign' => $datos['sign'],
            'is_system' => false,
            'is_active' => true,
            'sort_order' => (int) $tipos->max('sort_order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo "' . $tipo['name'] . '" creado',
            'data' => $tipo,
        ]);
    }

    public function movements(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'bank_account_id' => 'nullable|integer',
            'bank_client_id' => 'nullable|integer',
            'user_id' => 'nullable|integer',
            'kind' => 'nullable|string',
            'bank_shift_id' => 'nullable|integer',
            'search' => 'nullable|string|max:100',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:200',
        ]);

        $movs = $this->filtrarPorFecha(collect($this->store->all(BankStore::MOVEMENTS)), $request);

        foreach (['bank_account_id', 'bank_client_id', 'user_id', 'kind', 'bank_shift_id'] as $campo) {
            if ($request->filled($campo)) {
                $valor = $request->input($campo);
                $movs = $movs->filter(fn ($m) => (string) ($m[$campo] ?? '') === (string) $valor);
            }
        }

        $cuentas = $this->cuentas()->keyBy('id');
        $clientes = collect($this->store->all(BankStore::CLIENTS))->keyBy('id');
        $usuarios = $this->usuarios();

        if ($request->filled('search')) {
            $texto = Str::lower($request->search);
            $movs = $movs->filter(function ($m) use ($texto, $clientes) {
                $cliente = $clientes->get($m['bank_client_id'] ?? null);

                return Str::contains(Str::lower($m['description'] ?? ''), $texto)
                    || Str::contains(Str::lower($cliente['name'] ?? ''), $texto)
                    || Str::contains(Str::lower((string) ($cliente['external_id'] ?? '')), $texto);
            });
        }

        $ordenados = $movs
            ->sortBy([['date', 'desc'], ['id', 'desc']])
            ->values();

        $porPagina = (int) $request->input('per_page', 25);
        $pagina = (int) $request->input('page', 1);

        $items = $ordenados
            ->slice(($pagina - 1) * $porPagina, $porPagina)
            ->map(fn ($m) => $this->conRelaciones($m, $cuentas, $clientes, $usuarios))
            ->values();

        return response()->json([
            'success' => true,
            // Mismo sobre que devuelve un paginate de Laravel: cuando esto pase
            // a la base, el front no cambia.
            'data' => [
                'data' => $items,
                'current_page' => $pagina,
                'per_page' => $porPagina,
                'total' => $ordenados->count(),
                'last_page' => max(1, (int) ceil($ordenados->count() / $porPagina)),
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'date' => 'required|date',
            'bank_account_id' => 'required|integer',
            'bank_client_id' => 'nullable|integer',
            'amount' => 'required|numeric|not_in:0',
            'kind' => 'required|string',
            'description' => 'nullable|string|max:255',
            'to_bank_account_id' => 'nullable|integer',
        ]);

        if (!$this->store->find(BankStore::ACCOUNTS, $datos['bank_account_id'])) {
            return response()->json(['success' => false, 'message' => 'La cuenta no existe'], 422);
        }

        $tipo = $this->tipos()->firstWhere('slug', $datos['kind']);

        if (!$tipo) {
            return response()->json(['success' => false, 'message' => 'El tipo de movimiento no existe'], 422);
        }

        // Sin turno abierto no se puede cargar nada: el movimiento no tendria
        // a quien atribuirse ni en que turno aparecer.
        $turno = BankShiftController::abiertoDe($this->store);

        if (!$turno) {
            return response()->json([
                'success' => false,
                'message' => 'No hay ningún turno abierto. Abrí uno antes de cargar movimientos.',
            ], 409);
        }

        $fecha = substr($datos['date'], 0, 10);

        // En un traspaso el monto se escribe en positivo y el sistema arma las
        // dos patas: sale de una cuenta y entra en la otra.
        if ($tipo['sign'] === BankStore::SIGNO_TRASPASO) {
            if (empty($datos['to_bank_account_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Elegí la cuenta de destino del traspaso',
                ], 422);
            }

            if ((int) $datos['to_bank_account_id'] === (int) $datos['bank_account_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'El traspaso tiene que ir a otra cuenta',
                ], 422);
            }

            if (!$this->store->find(BankStore::ACCOUNTS, $datos['to_bank_account_id'])) {
                return response()->json(['success' => false, 'message' => 'La cuenta de destino no existe'], 422);
            }

            $monto = abs($datos['amount']);
            $grupo = (string) Str::uuid();

            $this->store->insertMany(BankStore::MOVEMENTS, [
                $this->nuevoMovimiento($fecha, $datos['bank_account_id'], -$monto, $datos, $turno['id'], $grupo),
                $this->nuevoMovimiento($fecha, $datos['to_bank_account_id'], $monto, $datos, $turno['id'], $grupo),
            ]);

            return response()->json(['success' => true, 'message' => 'Traspaso registrado']);
        }

        // Para el resto manda el signo del tipo: un egreso siempre resta.
        $monto = match ($tipo['sign']) {
            BankStore::SIGNO_SALE => -abs($datos['amount']),
            BankStore::SIGNO_SEGUN_MONTO => (float) $datos['amount'],
            default => abs($datos['amount']),
        };

        $mov = $this->store->insert(
            BankStore::MOVEMENTS,
            $this->nuevoMovimiento($fecha, $datos['bank_account_id'], $monto, $datos, $turno['id'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Movimiento registrado',
            'data' => $mov,
        ]);
    }

    /**
     * Editar deja rastro: cada cambio se anota en edit_history, igual que las
     * correcciones de la pasillera.
     */
    public function update(Request $request, $id)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $mov = $this->store->find(BankStore::MOVEMENTS, $id);

        if (!$mov) {
            return response()->json(['success' => false, 'message' => 'Movimiento no encontrado'], 404);
        }

        $datos = $request->validate([
            'date' => 'required|date',
            'bank_account_id' => 'required|integer',
            'bank_client_id' => 'nullable|integer',
            'amount' => 'required|numeric|not_in:0',
            'description' => 'nullable|string|max:255',
        ]);

        $datos['date'] = substr($datos['date'], 0, 10);
        $datos['amount'] = (float) $datos['amount'];
        $datos['edit_history'] = $this->registrarEdicion($mov, $datos);

        $actualizado = $this->store->update(BankStore::MOVEMENTS, $id, $datos);

        return response()->json([
            'success' => true,
            'message' => 'Movimiento actualizado',
            'data' => $actualizado,
        ]);
    }

    public function destroy($id)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $mov = $this->store->find(BankStore::MOVEMENTS, $id);

        if (!$mov) {
            return response()->json(['success' => false, 'message' => 'Movimiento no encontrado'], 404);
        }

        // Borrar una pata de un traspaso dejaria la otra colgada y el saldo mal
        if (!empty($mov['transfer_group_id'])) {
            $this->store->deleteWhere(
                BankStore::MOVEMENTS,
                fn ($m) => ($m['transfer_group_id'] ?? null) === $mov['transfer_group_id']
            );

            return response()->json(['success' => true, 'message' => 'Traspaso eliminado (las dos patas)']);
        }

        $this->store->delete(BankStore::MOVEMENTS, $id);

        return response()->json(['success' => true, 'message' => 'Movimiento eliminado']);
    }

    private function tipos(): Collection
    {
        return collect($this->store->all(BankStore::KINDS))
            ->sortBy([['sort_order', 'asc'], ['name', 'asc']])
            ->values();
    }

    private function cuentas(): Collection
    {
        return collect($this->store->all(BankStore::ACCOUNTS))
            ->sortBy([['sort_order', 'asc'], ['name', 'asc']])
            ->values();
    }

    private function filtrarPorFecha(Collection $movs, Request $request): Collection
    {
        return $movs
            ->when(
                $request->filled('start_date'),
                fn ($c) => $c->filter(fn ($m) => $m['date'] >= substr($request->start_date, 0, 10))
            )
            ->when(
                $request->filled('end_date'),
                fn ($c) => $c->filter(fn ($m) => $m['date'] <= substr($request->end_date, 0, 10))
            );
    }

    private function sumar(Collection $movs): float
    {
        return round($movs->sum(fn ($m) => (float) $m['amount']), 2);
    }

    /** Los usuarios sí siguen en la base: el módulo se cuelga de los que ya hay. */
    private function usuarios(): Collection
    {
        return User::get(['id', 'username', 'first_name', 'first_last_name'])->keyBy('id');
    }

    /**
     * Arma el registro como lo espera el front, con la cuenta, el cliente y el
     * usuario embebidos (lo que en la base seria un with()).
     */
    private function conRelaciones(array $mov, Collection $cuentas, Collection $clientes, Collection $usuarios): array
    {
        $cuenta = $cuentas->get($mov['bank_account_id'] ?? null);
        $cliente = $clientes->get($mov['bank_client_id'] ?? null);
        $usuario = $usuarios->get($mov['user_id'] ?? null);

        return array_merge($mov, [
            'account' => $cuenta ? ['id' => $cuenta['id'], 'name' => $cuenta['name'], 'slug' => $cuenta['slug']] : null,
            'client' => $cliente ? ['id' => $cliente['id'], 'name' => $cliente['name'], 'external_id' => $cliente['external_id'] ?? null] : null,
            'user' => $usuario ? [
                'id' => $usuario->id,
                'username' => $usuario->username,
                'first_name' => $usuario->first_name,
                'first_last_name' => $usuario->first_last_name,
            ] : null,
        ]);
    }

    private function nuevoMovimiento(string $fecha, $cuentaId, float $monto, array $datos, $turnoId, ?string $grupo = null): array
    {
        return [
            'date' => $fecha,
            'bank_shift_id' => (int) $turnoId,
            'bank_account_id' => (int) $cuentaId,
            'bank_client_id' => $datos['bank_client_id'] ?? null,
            'user_id' => Auth::id(),
            'amount' => $monto,
            'kind' => $datos['kind'],
            'description' => $datos['description'] ?? null,
            'transfer_group_id' => $grupo,
            'bank_import_id' => null,
            'edit_history' => null,
        ];
    }

    /**
     * Mismo formato que usa la pasillera: { at, user_id, user, changes }.
     */
    private function registrarEdicion(array $mov, array $nuevos): array
    {
        $user = Auth::user();
        $historial = $mov['edit_history'] ?? [];
        $cambios = [];

        foreach (['date', 'bank_account_id', 'bank_client_id', 'amount', 'description'] as $campo) {
            $antes = $mov[$campo] ?? null;
            $despues = $nuevos[$campo] ?? null;

            if ($campo === 'amount') {
                if (abs((float) $antes - (float) $despues) < 0.01) {
                    continue;
                }
            } elseif ((string) $antes === (string) $despues) {
                continue;
            }

            $cambios[$campo] = ['from' => $antes, 'to' => $despues];
        }

        if (!$cambios) {
            return is_array($historial) ? $historial : [];
        }

        $historial[] = [
            'at' => now()->toIso8601String(),
            'user_id' => $user?->id,
            'user' => trim(($user->first_name ?? '') . ' ' . ($user->first_last_name ?? '')) ?: $user?->username,
            'changes' => $cambios,
        ];

        return $historial;
    }
}
