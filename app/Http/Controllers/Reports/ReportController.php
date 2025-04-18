<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FingerprintLog;
use App\Models\ShiftRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $dataReport = match ($request->type) {
            'users' => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])
            ->where('role_id', '>', 1)
            ->get(),
            'users_by_branch' => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])
            ->where('role_id', '>', 1)
            ->where(function ($query) use ($request) {
                // Para jugadores (role_id = 6) buscar en la relación branches
                $query
                    ->where(function ($q) use ($request) {
                        $q
                            ->where('role_id', 6)
                            ->whereHas('branches', function ($q) use ($request) {
                                $q->where('branch_id', $request->branch_id);
                            });
                    })
                    // Para trabajadores (role_id = 5) buscar en branch_id
                    ->orWhere(function ($q) use ($request) {
                        $q
                            ->where('role_id', 5)
                            ->where('branch_id', $request->branch_id);
                    });
            })
            ->get(),
            'users_by_shift' => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])->where('role_id', '>', 1)->where('shift_id', $request->shiftId)->get(),
            'users_by_date' => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])->where('role_id', '>', 1)->whereBetween('created_at', [$request->startDate, $request->endDate])->get(),
            'top_users' => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])->where('role_id', '>', 1)->whereBetween('created_at', [$request->startDate, $request->endDate])->get(),
            'users_validation_fingerprint' => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])->where('role_id', '>', 1)->where('has_fingerprint', true)->get(),
            default => User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])->where('role_id', '>', 1)->get()
        };

        return Inertia::render('Reports/index', [
            'dataReport' => $dataReport,
            'filters' => $request->only(['type']),
        ]);
    }
}
