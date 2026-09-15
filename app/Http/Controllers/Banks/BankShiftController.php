<?php

namespace App\Http\Controllers\Banks;

use App\Constants\BankAccess;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BankStore;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Turnos de bancos online.
 *
 * Los movimientos no viven sueltos en el tiempo: pertenecen a un turno, que
 * alguien abre y alguien cierra. Queda registrado quien hizo cada cosa y cuando,
 * y el historial permite reconstruir cualquier turno pasado.
 *
 * Hay un solo turno abierto a la vez: las cuentas son de la empresa entera, asi
 * que dos turnos simultaneos se pisarian los movimientos.
 */
class BankShiftController extends Controller
{
    const ORIGEN_MANUAL = 'manual';
    const ORIGEN_IMPORT = 'import';

    public function __construct(private BankStore $store)
    {
    }

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

        return Inertia::render('Banks/Shifts');
    }

    /** El turno abierto, si hay. Es lo que mira la pantalla al cargar. */
    public function current()
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $abierto = $this->turnoAbierto();

        return response()->json([
            'success' => true,
            'data' => $abierto ? $this->conDetalle($abierto) : null,
        ]);
    }

    /**
     * Lo que el sistema propone como saldo de apertura: lo que hay ahora en cada
     * cuenta. Alimenta el modal de apertura para que se pueda corregir.
     */
    public function proposed()
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        return response()->json(['success' => true, 'data' => $this->saldosActuales()]);
    }

    public function open(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'opening_note' => 'nullable|string|max:255',
            // Saldo declarado por cuenta: { "<id de cuenta>": monto }
            'balances' => 'nullable|array',
            'balances.*' => 'numeric',
        ]);

        if ($abierto = $this->turnoAbierto()) {
            $quien = $this->nombre($this->usuarios()->get($abierto['opened_by'] ?? null));

            return response()->json([
                'success' => false,
                'message' => 'Ya hay un turno abierto (#' . $abierto['id'] . ')'
                    . ($quien ? ', lo abrió ' . $quien : '') . '. Cerralo antes de abrir otro.',
            ], 409);
        }

        // El saldo con el que arranca cada cuenta: se propone el que viene del
        // turno anterior y quien abre puede corregirlo. Guardamos los dos para
        // que la diferencia quede a la vista.
        $propuesto = $this->saldosActuales()->pluck('saldo', 'id');
        $declarado = collect($datos['balances'] ?? [])
            ->mapWithKeys(fn ($monto, $id) => [(int) $id => round((float) $monto, 2)]);

        $apertura = $propuesto
            ->mapWithKeys(fn ($saldo, $id) => [(int) $id => $declarado->get((int) $id, round((float) $saldo, 2))]);

        $turno = $this->store->insert(BankStore::SHIFTS, [
            'opened_by' => Auth::id(),
            'opened_at' => now()->toIso8601String(),
            'closed_by' => null,
            'closed_at' => null,
            'is_active' => true,
            'source' => self::ORIGEN_MANUAL,
            'opening_note' => $datos['opening_note'] ?? null,
            'closing_note' => null,
            'opening_balances' => $apertura->all(),
            'proposed_balances' => $propuesto->map(fn ($v) => round((float) $v, 2))->all(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Turno #' . $turno['id'] . ' abierto',
            'data' => $this->conDetalle($turno),
        ]);
    }

    public function close(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $datos = $request->validate([
            'closing_note' => 'nullable|string|max:255',
        ]);

        $abierto = $this->turnoAbierto();

        if (!$abierto) {
            return response()->json([
                'success' => false,
                'message' => 'No hay ningún turno abierto',
            ], 400);
        }

        $cerrado = $this->store->update(BankStore::SHIFTS, $abierto['id'], [
            'closed_by' => Auth::id(),
            'closed_at' => now()->toIso8601String(),
            'is_active' => false,
            'closing_note' => $datos['closing_note'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Turno #' . $cerrado['id'] . ' cerrado',
            'data' => $this->conDetalle($cerrado),
        ]);
    }

    /** Historial paginado, de lo más nuevo a lo más viejo. */
    public function list(Request $request)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'nullable|in:0,1,all',
            'user_id' => 'nullable|integer',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $turnos = collect($this->store->all(BankStore::SHIFTS));

        if ($request->filled('start_date')) {
            $desde = substr($request->start_date, 0, 10);
            $turnos = $turnos->filter(fn ($t) => substr((string) $t['opened_at'], 0, 10) >= $desde);
        }

        if ($request->filled('end_date')) {
            $hasta = substr($request->end_date, 0, 10);
            $turnos = $turnos->filter(fn ($t) => substr((string) $t['opened_at'], 0, 10) <= $hasta);
        }

        if ($request->filled('is_active') && $request->is_active !== 'all') {
            $activo = $request->is_active === '1' || $request->is_active === 1;
            $turnos = $turnos->filter(fn ($t) => (bool) $t['is_active'] === $activo);
        }

        // Filtra por quien participó: lo abrió o lo cerró
        if ($request->filled('user_id')) {
            $uid = (int) $request->user_id;
            $turnos = $turnos->filter(
                fn ($t) => (int) ($t['opened_by'] ?? 0) === $uid || (int) ($t['closed_by'] ?? 0) === $uid
            );
        }

        $ordenados = $turnos->sortByDesc('id')->values();
        $porPagina = (int) $request->input('per_page', 20);
        $pagina = (int) $request->input('page', 1);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $ordenados
                    ->slice(($pagina - 1) * $porPagina, $porPagina)
                    ->map(fn ($t) => $this->conDetalle($t))
                    ->values(),
                'current_page' => $pagina,
                'per_page' => $porPagina,
                'total' => $ordenados->count(),
                'last_page' => max(1, (int) ceil($ordenados->count() / $porPagina)),
            ],
        ]);
    }

    /** Un turno con todos sus movimientos, para revisarlo entero. */
    public function show($id)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $turno = $this->store->find(BankStore::SHIFTS, $id);

        if (!$turno) {
            return response()->json(['success' => false, 'message' => 'Turno no encontrado'], 404);
        }

        $cuentas = collect($this->store->all(BankStore::ACCOUNTS))->keyBy('id');
        $clientes = collect($this->store->all(BankStore::CLIENTS))->keyBy('id');
        $tipos = collect($this->store->all(BankStore::KINDS))->keyBy('slug');
        $usuarios = $this->usuarios();

        $movs = $this->movimientosDe($turno['id'])->sortBy('id')->values();

        return response()->json([
            'success' => true,
            'data' => [
                'turno' => $this->conDetalle($turno),
                'por_cuenta' => $movs->groupBy('bank_account_id')->map(fn ($items, $cid) => [
                    'cuenta' => $cuentas[$cid]['name'] ?? ('Cuenta ' . $cid),
                    'movs' => $items->count(),
                    'cargas' => $this->sumar($items->filter(fn ($m) => $m['amount'] > 0)),
                    'retiros' => $this->sumar($items->filter(fn ($m) => $m['amount'] < 0)),
                    'neto' => $this->sumar($items),
                ])->values(),
                'por_tipo' => $movs->groupBy('kind')->map(fn ($items, $slug) => [
                    'tipo' => $tipos[$slug]['name'] ?? $slug,
                    'movs' => $items->count(),
                    'neto' => $this->sumar($items),
                ])->values(),
                'movimientos' => $movs->map(fn ($m) => array_merge($m, [
                    'account' => $cuentas[$m['bank_account_id']] ?? null,
                    'client' => $clientes[$m['bank_client_id'] ?? null] ?? null,
                    'user' => ($u = $usuarios->get($m['user_id'] ?? null))
                        ? ['id' => $u->id, 'username' => $u->username, 'first_name' => $u->first_name, 'first_last_name' => $u->first_last_name]
                        : null,
                ]))->values(),
            ],
        ]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * El turno abierto. Público porque BankController lo necesita para saber
     * a qué turno atar cada movimiento nuevo.
     */
    public static function abiertoDe(BankStore $store): ?array
    {
        foreach ($store->all(BankStore::SHIFTS) as $turno) {
            if (!empty($turno['is_active'])) {
                return $turno;
            }
        }

        return null;
    }

    private function turnoAbierto(): ?array
    {
        return self::abiertoDe($this->store);
    }

    private function movimientosDe($shiftId): Collection
    {
        return collect($this->store->all(BankStore::MOVEMENTS))
            ->filter(fn ($m) => (int) ($m['bank_shift_id'] ?? 0) === (int) $shiftId)
            ->values();
    }

    /** El turno más los datos que se muestran: quién, cuánto, cuántos. */
    private function conDetalle(array $turno): array
    {
        $usuarios = $this->usuarios();
        $movs = $this->movimientosDe($turno['id']);

        $neto = $this->sumar($movs);

        // Los turnos anteriores a esta funcion no tienen saldo de apertura
        // guardado: se deduce restandole al saldo de hoy lo que movio el turno.
        $apertura = isset($turno['opening_balances'])
            ? round(array_sum($turno['opening_balances']), 2)
            : round($this->saldosActuales()->sum('saldo') - $neto, 2);

        $propuesto = round(array_sum($turno['proposed_balances'] ?? []), 2) ?: $apertura;

        return array_merge($turno, [
            'opened_by_name' => $this->nombre($usuarios->get($turno['opened_by'] ?? null)),
            'closed_by_name' => $this->nombre($usuarios->get($turno['closed_by'] ?? null)),
            'movs' => $movs->count(),
            'cargas' => $this->sumar($movs->filter(fn ($m) => $m['amount'] > 0)),
            'retiros' => $this->sumar($movs->filter(fn ($m) => $m['amount'] < 0)),
            'neto' => $neto,
            // Lo que importa del turno: con cuanto arranco, cuanto se movio y
            // con cuanto va. Cada turno empieza sus contadores en cero.
            'apertura' => $apertura,
            'saldo_actual' => round($apertura + $neto, 2),
            // Si quien abrio corrigio el saldo propuesto, la diferencia se ve
            'apertura_propuesta' => $propuesto,
            'apertura_diferencia' => round($apertura - $propuesto, 2),
        ]);
    }

    /**
     * Saldo de cada cuenta hoy. Nunca se guarda un total: siempre se recalcula.
     *
     * La plata arranca en el ultimo turno, no en initial_balance: quien abre
     * declara con cuanto arranca cada cuenta, y eso pisa lo que diga la ficha
     * de la cuenta. Sin esto, cerrar un turno y abrir el siguiente perdia los
     * saldos declarados y el turno nuevo arrancaba en cero.
     *
     * initial_balance queda como punto de partida del primer turno, cuando
     * todavia no hay ninguno del cual heredar.
     */
    private function saldosActuales(): Collection
    {
        $movimientos = collect($this->store->all(BankStore::MOVEMENTS));
        $ultimo = collect($this->store->all(BankStore::SHIFTS))->sortByDesc('id')->first();

        if ($ultimo && isset($ultimo['opening_balances'])) {
            // El turno mas nuevo ya trae adentro todo lo anterior: su apertura
            // fue el cierre del que vino antes.
            $base = collect($ultimo['opening_balances']);
            $desde = $movimientos
                ->filter(fn ($m) => (int) ($m['bank_shift_id'] ?? 0) === (int) $ultimo['id'])
                ->groupBy('bank_account_id')
                ->map(fn ($items) => $this->sumar($items));
        } else {
            $base = collect();
            $desde = $movimientos
                ->groupBy('bank_account_id')
                ->map(fn ($items) => $this->sumar($items));
        }

        return collect($this->store->all(BankStore::ACCOUNTS))
            ->sortBy([['sort_order', 'asc'], ['name', 'asc']])
            ->map(function ($c) use ($base, $desde, $ultimo) {
                // El JSON puede traer la clave como string o como int. Y una
                // cuenta creada despues de abrir el turno no esta en la
                // apertura: para esa vale su saldo inicial.
                $arranque = $ultimo && isset($ultimo['opening_balances'])
                    ? (float) $base->get(
                        (string) $c['id'],
                        $base->get($c['id'], (float) $c['initial_balance'])
                    )
                    : (float) $c['initial_balance'];

                return [
                    'id' => $c['id'],
                    'name' => $c['name'],
                    'slug' => $c['slug'],
                    'saldo' => round($arranque + (float) $desde->get($c['id'], 0), 2),
                ];
            })
            ->values();
    }

    private function sumar(Collection $movs): float
    {
        return round($movs->sum(fn ($m) => (float) $m['amount']), 2);
    }

    private function usuarios(): Collection
    {
        return User::get(['id', 'username', 'first_name', 'first_last_name'])->keyBy('id');
    }

    private function nombre($user): ?string
    {
        if (!$user) {
            return null;
        }

        $nombre = trim(($user->first_name ?? '') . ' ' . ($user->first_last_name ?? ''));

        return $nombre !== '' ? $nombre : $user->username;
    }
}
