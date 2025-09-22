<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\FingerprintLog;
use App\Models\ShiftRecord;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * Display the reports page
     */
    public function index(Request $request)
    {
        $branches = Branch::select('id', 'name')->get();
        $shifts = ShiftRecord::with(['branch:id,name'])
            ->select('id', 'branch_id', 'opened_by_user_id', 'opening_time', 'closing_time', 'status')
            ->orderBy('opening_time', 'desc')
            ->limit(50)
            ->get();
        
        $roles = [
            ['id' => 5, 'name' => 'Trabajador'],
            ['id' => 6, 'name' => 'Jugador']
        ];
        
        return Inertia::render('Reports/index', [
            'branches' => $branches,
            'shifts' => $shifts,
            'roles' => $roles,
            'filters' => $request->only(['type', 'branch_id', 'shift_id', 'start_date', 'end_date', 'user_identifier', 'role_id'])
        ]);
    }
    
    /**
     * Generate fingerprint logs report
     */
    public function getFingerprintLogsReport(Request $request)
    {
        // Log the received parameters for debugging
        \Log::info('Fingerprint logs report parameters:', $request->all());
        
        $query = FingerprintLog::with([
            'user:id,first_name,second_name,first_last_name,second_last_name,email,role_id,branch_id,status_id',
            'user.role:id,name',
            'totem:id,name,branch_id',
            'totem.branch:id,name'
        ]);
        
        // Filter by date range
        if ($request->filled('start_date')) {
            // Use whereDate to compare only the date part, ignoring time
            $query->whereDate('created_at', '>=', $request->start_date);
            
            // Log for debugging
            \Log::info('Start date filter applied (using whereDate):', [
                'start_date' => $request->start_date,
                'timezone' => config('app.timezone')
            ]);
        }
        
        if ($request->filled('end_date')) {
            // Use whereDate to compare only the date part, ignoring time
            $query->whereDate('created_at', '<=', $request->end_date);
            
            // Log for debugging
            \Log::info('End date filter applied (using whereDate):', [
                'end_date' => $request->end_date,
                'timezone' => config('app.timezone')
            ]);
        }
        
        // Filter by role (5 = worker, 6 = player)
        if ($request->filled('role_id')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('role_id', $request->role_id);
            });
        }
        
        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->whereHas('totem', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }
        
        // Filter by shift
        if ($request->filled('shift_id')) {
            $shift = ShiftRecord::find($request->shift_id);
            if ($shift) {
                $query->where('created_at', '>=', $shift->opening_time)
                      ->when($shift->closing_time, function($q) use ($shift) {
                          return $q->where('created_at', '<=', $shift->closing_time);
                      }, function($q) {
                          return $q->where('created_at', '<=', now());
                      });
                      
                if ($shift->branch_id) {
                    $query->whereHas('totem', function($q) use ($shift) {
                        $q->where('branch_id', $shift->branch_id);
                    });
                }
            }
        }
        
        // Filter by user identifier
        if ($request->filled('user_identifier')) {
            $userIdentifier = $request->user_identifier;
            $query->whereHas('user', function($q) use ($userIdentifier) {
                $q->where('username', 'like', "%{$userIdentifier}%")
                  ->orWhere('email', 'like', "%{$userIdentifier}%")
                  ->orWhere('first_name', 'like', "%{$userIdentifier}%")
                  ->orWhere('first_last_name', 'like', "%{$userIdentifier}%");
            });
        }
        
        // Get logs ordered by date with memory optimization
        ini_set('memory_limit', '512M'); // Increase memory limit for this request
        
        // Get all logs
        $logs = $query->orderBy('created_at', 'desc')->get();
        
        // Get total count for summary
        $totalCount = $logs->count();
        
        // Prepare summary data - use total count for summary
        $workerCount = FingerprintLog::whereHas('user', function($q) {
            $q->where('role_id', 5); // Worker role
        })->count();
        
        $playerCount = FingerprintLog::whereHas('user', function($q) {
            $q->where('role_id', 6); // Player role
        })->count();
        
        $summary = [
            'total_logs' => $totalCount,
            'worker_logs' => $workerCount,
            'player_logs' => $playerCount,
            'by_branch' => []
        ];
        
        // Group logs by branch
        $logsByBranch = $logs->groupBy(function($log) {
            return $log->totem && $log->totem->branch ? $log->totem->branch->name : 'Sin sucursal';
        });
        
        foreach ($logsByBranch as $branchName => $branchLogs) {
            $summary['by_branch'][$branchName] = [
                'total' => $branchLogs->count(),
                'workers' => $branchLogs->filter(function($log) {
                    return $log->user && $log->user->role_id == 5;
                })->count(),
                'players' => $branchLogs->filter(function($log) {
                    return $log->user && $log->user->role_id == 6;
                })->count()
            ];
        }
        
        // Transform logs for the response
        $transformedLogs = $logs->map(function($log) {
            return [
                'id' => $log->id,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->first_name . ' ' . $log->user->first_last_name,
                    'role_id' => $log->user->role_id,
                    'role_name' => $log->user->role ? $log->user->role->name : 'N/A'
                ] : null,
                'totem' => $log->totem ? [
                    'id' => $log->totem->id,
                    'name' => $log->totem->name,
                    'branch' => $log->totem->branch ? [
                        'id' => $log->totem->branch->id,
                        'name' => $log->totem->branch->name
                    ] : null
                ] : null,
                'created_at' => $log->created_at,
                'is_worker' => $log->user && $log->user->role_id == 5,
                'is_player' => $log->user && $log->user->role_id == 6
            ];
        });
        
        return response()->json([
            'logs' => $transformedLogs,
            'summary' => $summary,
            'filters' => $request->only(['start_date', 'end_date', 'role_id', 'branch_id', 'shift_id', 'user_identifier'])
        ]);
    }
}
