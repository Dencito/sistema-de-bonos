<?php

namespace App\Http\Controllers\CashManagement;

use App\Http\Controllers\Controller;
use App\Constants\RoleId;
use App\Models\CashShift;
use App\Models\Branch;
use App\Services\CashShiftReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CashShiftHistoryController extends Controller
{
    /**
     * Display shift history page.
     * - Roles superiores (dueño, super-admin, admin): ven todas las sucursales y filtran.
     * - El resto: solo los turnos de su propia sucursal.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $canSelectBranch = RoleId::canSelectBranch($user->role_id);

        if ($canSelectBranch) {
            $branches = Branch::select('id', 'name')->orderBy('name')->get();
        } else {
            $branches = $user->branch
                ? collect([['id' => $user->branch->id, 'name' => $user->branch->name]])
                : collect([]);
        }

        return Inertia::render('CashShiftHistory/Index', [
            'branches' => $branches,
            'userRole' => $user->role_id,
            'userBranchId' => $user->branch_id,
            'canSelectBranch' => $canSelectBranch,
        ]);
    }

    /**
     * Get paginated list of shifts with filters.
     */
    public function list(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'branch_id' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'nullable|in:0,1,all',
            'per_page' => 'nullable|integer|min:1|max:200',
        ]);

        $query = CashShift::with(['user:id,username,first_name,first_last_name', 'branch:id,name'])
            ->withCount('transactions')
            ->withCount('pasilleras');

        // Role-based branch filter
        if (!RoleId::canSelectBranch($user->role_id)) {
            // El resto solo ve su sucursal
            if (!$user->branch_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'data' => [],
                        'total' => 0,
                        'current_page' => 1,
                        'per_page' => 15,
                    ],
                ]);
            }
            $query->where('branch_id', $user->branch_id);
        } else {
            // Los roles superiores pueden filtrar por sucursal
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }
        }

        if ($request->filled('start_date')) {
            $query->where('started_at', '>=', $request->start_date . ' 00:00:00');
        }
        if ($request->filled('end_date')) {
            $query->where('started_at', '<=', $request->end_date . ' 23:59:59');
        }

        if ($request->is_active === '1' || $request->is_active === 1) {
            $query->where('is_active', true);
        } elseif ($request->is_active === '0' || $request->is_active === 0) {
            $query->where('is_active', false);
        }

        $shifts = $query->orderBy('started_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $shifts,
        ]);
    }

    /**
     * Reenvía por correo el reporte completo de un turno del historial.
     * Sirve tanto para un turno cerrado como para el que está abierto.
     */
    public function sendReport(Request $request, $shiftId)
    {
        $user = Auth::user();
        $shift = CashShift::find($shiftId);

        if (!$shift) {
            return response()->json(['success' => false, 'message' => 'Turno no encontrado'], 404);
        }

        // Misma regla que el detalle: quien no elige sucursal solo ve la suya
        if (!RoleId::canSelectBranch($user->role_id) && $shift->branch_id != $user->branch_id) {
            Log::warning('Unauthorized shift report attempt', [
                'user_id' => $user->id,
                'shift_id' => $shiftId,
            ]);
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $enviado = app(CashShiftReportService::class)->send(
            $shift,
            $shift->is_active
                ? 'Envío manual desde el historial: turno en curso'
                : 'Envío manual desde el historial',
            $user
        );

        return response()->json([
            'success' => $enviado,
            'message' => $enviado
                ? 'Reporte del turno #' . $shift->id . ' enviado a ' . CashShiftReportService::REPORT_EMAIL
                : 'No se pudo enviar el reporte. Revisá la configuración de correo.',
        ], $enviado ? 200 : 500);
    }

    /**
     * Get full detail of one shift: transactions, pasilleras, totals, differences.
     */
    public function show(Request $request, $shiftId)
    {
        $user = Auth::user();

        $shift = CashShift::with([
                'user:id,username,first_name,first_last_name,second_name,second_last_name',
                'branch:id,name',
                'transactions' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                },
                'transactions.pasillera.user:id,username,first_name,first_last_name',
                'transactions.adminUser:id,username,first_name,first_last_name',
                'pasilleras.user:id,username,first_name,first_last_name',
                'pasilleras.transactions' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                },
                'adminUser:id,username,first_name,first_last_name',
            ])
            ->find($shiftId);

        if (!$shift) {
            return response()->json(['success' => false, 'message' => 'Turno no encontrado'], 404);
        }

        // Permission check: quien no puede elegir sucursal solo ve la suya
        if (!RoleId::canSelectBranch($user->role_id) && $shift->branch_id != $user->branch_id) {
            Log::warning('Unauthorized shift access attempt', [
                'user_id' => $user->id,
                'shift_id' => $shiftId,
            ]);
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        // Compute summary breakdown by type and expense_type
        $typeBreakdown = $shift->transactions->groupBy('type')->map(function ($items, $type) {
            return [
                'type' => $type,
                'count' => $items->count(),
                'total' => $items->sum('amount'),
            ];
        })->values();

        $expenseBreakdown = $shift->transactions
            ->whereIn('type', ['other', 'payment'])
            ->filter(fn ($t) => !empty($t->expense_type) || !empty($t->machine))
            ->groupBy(fn ($t) => $t->expense_type ?: ('Máquina ' . $t->machine))
            ->map(function ($items, $key) {
                return [
                    'label' => $key,
                    'count' => $items->count(),
                    'total' => $items->sum('amount'),
                ];
            })->values();

        // Obtener tickets del turno (entre apertura y cierre)
        $shiftEnd = $shift->ended_at ?? now();
        $tickets = \App\Models\Ticket::where('branch_id', $shift->branch_id)
            ->where('created_at', '>=', $shift->started_at)
            ->where('created_at', '<=', $shiftEnd)
            ->with('user:id,first_name,first_last_name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calcular total de tickets
        $totalTickets = $tickets->sum('total_amount');

        return response()->json([
            'success' => true,
            'data' => [
                'shift' => $shift,
                'tickets' => $tickets,
                'total_tickets' => $totalTickets,
                'type_breakdown' => $typeBreakdown,
                'expense_breakdown' => $expenseBreakdown,
            ],
        ]);
    }
}
