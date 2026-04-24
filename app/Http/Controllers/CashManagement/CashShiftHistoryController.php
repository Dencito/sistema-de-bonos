<?php

namespace App\Http\Controllers\CashManagement;

use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CashShiftHistoryController extends Controller
{
    /**
     * Display shift history page.
     * - role_id 1: sees all shifts, can filter by branch
     * - other roles: only shifts from their own branch
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Branches available for filter dropdown
        if ($user->role_id == 1) {
            $branches = Branch::select('id', 'name')->orderBy('name')->get();
        } else {
            // Others only see their branch
            $branches = $user->branch
                ? collect([['id' => $user->branch->id, 'name' => $user->branch->name]])
                : collect([]);
        }

        return Inertia::render('CashShiftHistory/Index', [
            'branches' => $branches,
            'userRole' => $user->role_id,
            'userBranchId' => $user->branch_id,
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
        if ($user->role_id != 1) {
            // Non-role-1 users only see their branch
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
            // Role 1 can filter by branch
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

        // Permission check: role != 1 can only see own branch
        if ($user->role_id != 1 && $shift->branch_id != $user->branch_id) {
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

        return response()->json([
            'success' => true,
            'data' => [
                'shift' => $shift,
                'type_breakdown' => $typeBreakdown,
                'expense_breakdown' => $expenseBreakdown,
            ],
        ]);
    }
}
