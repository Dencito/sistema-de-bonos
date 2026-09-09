<?php

namespace App\Http\Controllers\Machines;

use App\Constants\RoleId;
use App\Constants\TransactionType;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CashShift;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Consulta por maquina: se escribe un numero y se ve todo lo que paso con esa
 * maquina, agrupado por turno de caja.
 *
 * El numero de maquina es texto libre en cash_transactions, no hay catalogo, asi
 * que la busqueda es sobre lo que efectivamente se cargo. Para que no haya que
 * adivinar como lo escribieron, la pantalla ofrece la lista de valores ya
 * existentes en la sucursal.
 */
class MachineReportController extends Controller
{
    /** Tipos de movimiento que llevan maquina. */
    private const TIPOS_CON_MAQUINA = [
        TransactionType::PAYMENT,
        TransactionType::TRAGADOS,
        TransactionType::PASILLERA_PAYMENT,
    ];

    /**
     * Recaudadores y roles superiores.
     *
     * RECAUDADOR es un cargo, no un rol: un trabajador con ese cargo entra
     * igual, y opera siempre sobre su propia sucursal.
     */
    private function canAccess($user): bool
    {
        if (RoleId::canSelectBranch($user->role_id) || $user->role_id === RoleId::SUPERVISOR) {
            return true;
        }

        return in_array('RECAUDADOR', $user->cargo ?? [], true);
    }

    /**
     * Misma regla que el resto del sistema: los roles superiores no tienen
     * sucursal y eligen una; el resto opera sobre la suya.
     */
    private function resolveBranch(Request $request): ?Branch
    {
        $user = Auth::user();

        if (RoleId::canSelectBranch($user->role_id)) {
            $branchId = $request->input('branch_id');

            return $branchId ? Branch::find($branchId) : null;
        }

        return $user->branch;
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$this->canAccess($user)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }

        $puedeElegirSucursal = RoleId::canSelectBranch($user->role_id);
        $branch = $this->resolveBranch($request);

        return Inertia::render('Machines/Index', [
            'canSelectBranch' => $puedeElegirSucursal,
            'branches' => $puedeElegirSucursal
                ? Branch::select('id', 'name')->orderBy('name')->get()
                : [],
            'branch' => $branch ? ['id' => $branch->id, 'name' => $branch->name] : null,
            // Valores de maquina ya cargados, para elegir en vez de escribir a ciegas
            'machines' => $branch ? $this->machinesOf($branch->id) : [],
        ]);
    }

    /** Numeros de maquina que aparecen en los movimientos de la sucursal. */
    private function machinesOf(int $branchId): array
    {
        // Con modelos, no con join a nombre fijo: las tablas llevan prefijo de
        // tenant (ver el trait CompanyScope) y un nombre escrito a mano apuntaria
        // a la tabla sin prefijo.
        return CashTransaction::whereIn(
                'cash_shift_id',
                CashShift::where('branch_id', $branchId)->select('id')
            )
            ->whereNotNull('machine')
            ->where('machine', '<>', '')
            ->whereIn('type', self::TIPOS_CON_MAQUINA)
            ->distinct()
            ->orderBy('machine')
            ->pluck('machine')
            ->all();
    }

    /**
     * Movimientos de una maquina, agrupados por turno de caja.
     */
    public function search(Request $request)
    {
        $user = Auth::user();

        if (!$this->canAccess($user)) {
            return response()->json(['success' => false, 'message' => 'Sin permiso'], 403);
        }

        $request->validate([
            'machine' => 'required|string|max:100',
            'branch_id' => 'nullable|integer',
        ]);

        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Seleccioná una sucursal para buscar',
            ], 400);
        }

        $machine = trim($request->machine);

        $shifts = CashShift::with([
                'user:id,username,first_name,first_last_name',
                'transactions' => function ($q) use ($machine) {
                    $q->where('machine', $machine)
                        ->whereIn('type', self::TIPOS_CON_MAQUINA)
                        ->with([
                            'adminUser:id,first_name,first_last_name',
                            'pasillera.user:id,first_name,first_last_name',
                        ])
                        ->orderBy('created_at');
                },
            ])
            ->where('branch_id', $branch->id)
            ->whereHas('transactions', function ($q) use ($machine) {
                $q->where('machine', $machine)
                    ->whereIn('type', self::TIPOS_CON_MAQUINA);
            })
            ->orderByDesc('id')
            ->get();

        // Un subtotal por turno y el total general, que es lo que se controla
        $turnos = $shifts->map(function ($shift) {
            $movs = $shift->transactions;

            return [
                'shift_id' => $shift->id,
                'is_active' => (bool) $shift->is_active,
                'started_at' => $shift->started_at,
                'ended_at' => $shift->ended_at,
                'user' => $shift->user
                    ? trim($shift->user->first_name . ' ' . $shift->user->first_last_name)
                    : null,
                'total' => (float) $movs->sum('amount'),
                'por_tipo' => $movs->groupBy('type')->map(fn($g) => [
                    'cantidad' => $g->count(),
                    'total' => (float) $g->sum('amount'),
                ]),
                'movimientos' => $movs->map(fn($t) => [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'client' => $t->client,
                    'description' => $t->description,
                    'created_at' => $t->created_at,
                    'edit_history' => $t->edit_history,
                    'source' => $t->source,
                    'registrado_por' => $t->pasillera?->user
                        ? trim($t->pasillera->user->first_name . ' ' . $t->pasillera->user->first_last_name)
                        : ($t->adminUser
                            ? trim($t->adminUser->first_name . ' ' . $t->adminUser->first_last_name)
                            : null),
                ])->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'machine' => $machine,
                'branch' => ['id' => $branch->id, 'name' => $branch->name],
                'turnos' => $turnos,
                'total_general' => (float) $turnos->sum('total'),
                'cantidad_movimientos' => (int) $turnos->sum(fn($t) => count($t['movimientos'])),
            ],
        ]);
    }
}
