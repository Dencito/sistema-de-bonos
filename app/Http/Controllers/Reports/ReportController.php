<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FingerprintLog;
use App\Models\ShiftRecord;
use App\Models\User;
use App\Models\Role;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get all branches for filtering
        $branches = Branch::all();
        
        // Get all shifts for filtering
        $shifts = ShiftRecord::with(['branch', 'openedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Get roles for filtering
        $roles = Role::where('id', '>', 1)->get();
        
        return Inertia::render('Reports/index', [
            'branches' => $branches,
            'shifts' => $shifts,
            'roles' => $roles,
            'filters' => $request->only(['type', 'branch_id', 'shift_id', 'start_date', 'end_date', 'user_identifier', 'role_id']),
        ]);
    }
    
    public function playersReport(Request $request)
    {
        $type = $request->input('type', 'all');
        $branchId = $request->input('branch_id');
        $shiftId = $request->input('shift_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $userIdentifier = $request->input('user_identifier');
        
        // Base query for fingerprint logs - incluye tanto jugadores como trabajadores
        $query = FingerprintLog::with([
                'user.categoryBonus', 
                'user.role', 
                'totem.branch'
            ]);
        
        // Apply filters based on report type
        switch ($type) {
            case 'branch':
                if ($branchId) {
                    $query->whereHas('totem', function($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
                }
                break;
                
            case 'shift':
                if ($shiftId) {
                    $shift = ShiftRecord::find($shiftId);
                    if ($shift) {
                        $query->whereBetween('created_at', [
                            $shift->opening_time, 
                            $shift->closing_time ?? now()
                        ]);
                        $query->whereHas('totem', function($q) use ($shift) {
                            $q->where('branch_id', $shift->branch_id);
                        });
                    }
                }
                break;
                
            case 'date':
                if ($startDate && $endDate) {
                    $query->whereDate('created_at', '>=', $startDate)
                          ->whereDate('created_at', '<=', $endDate);
                }
                break;
                
            case 'top':
                // We'll handle this differently below
                if ($startDate && $endDate) {
                    $query->whereDate('created_at', '>=', $startDate)
                          ->whereDate('created_at', '<=', $endDate);
                }
                break;
        }
        
        // Filter by user identifier if provided
        if ($userIdentifier) {
            $query->whereHas('user', function($q) use ($userIdentifier) {
                $q->where('username', 'like', "%{$userIdentifier}%")
                  ->orWhere('email', 'like', "%{$userIdentifier}%")
                  ->orWhere('first_name', 'like', "%{$userIdentifier}%")
                  ->orWhere('first_last_name', 'like', "%{$userIdentifier}%");
            });
        }
        
        // Get the data with memory optimization
        ini_set('memory_limit', '512M'); // Increase memory limit for this request
        $logs = $query->orderBy('created_at', 'desc')->get();
        
        // Buscar tickets relacionados para cada log
        $totalAmount = 0;
        foreach ($logs as $log) {
            // Buscar ticket creado en el mismo momento que el log de huella (dentro de un rango de 5 segundos)
            $ticket = Ticket::where('user_id', $log->user_id)
                ->where('created_at', '>=', $log->created_at->copy()->subSeconds(5))
                ->where('created_at', '<=', $log->created_at->copy()->addSeconds(5))
                ->first();
                
            if ($ticket) {
                $log->ticket = $ticket;
                $totalAmount += $ticket->total_amount;
            } else {
                $log->ticket = null;
            }
            
            // Determinar si es jugador o trabajador
            $log->is_player = $log->user->role_id == 6; // Asumiendo que 6 es el rol de jugador
        }
        
        // Prepare the response data
        $data = [
            'type' => $type,
            'logs' => $logs,
            'summary' => [
                'total_marks' => $logs->count(),
                'total_amount' => $totalAmount,
                'player_marks' => $logs->where('is_player', true)->count(),
                'worker_marks' => $logs->where('is_player', false)->count(),
                'tickets_count' => $logs->filter(function($log) {
                    return $log->ticket !== null;
                })->count()
            ]
        ];
        
        // Add ticket type summary
        $ticketTypes = [];
        foreach ($logs as $log) {
            if (!$log->ticket) continue; // Ignorar logs sin tickets
            
            $ticketType = $log->ticket->type;
            
            if (!isset($ticketTypes[$ticketType])) {
                $ticketTypes[$ticketType] = [
                    'count' => 0,
                    'amount' => 0
                ];
            }
            
            $ticketTypes[$ticketType]['count']++;
            $ticketTypes[$ticketType]['amount'] += $log->ticket->total_amount;
        }
        
        $data['summary']['ticket_types'] = $ticketTypes;
        
        // For top players report, group by user and calculate totals
        if ($type === 'top') {
            // Filtrar solo jugadores para el top
            $playerLogs = $logs->filter(function($log) {
                return $log->is_player;
            });
            
            $topPlayers = $playerLogs->groupBy('user_id')
                ->map(function($group) {
                    $user = $group->first()->user;
                    $totalAmount = 0;
                    $ticketCount = 0;
                    
                    // Calculate total amount from tickets
                    foreach ($group as $log) {
                        if ($log->ticket) {
                            $totalAmount += $log->ticket->total_amount;
                            $ticketCount++;
                        }
                    }
                    
                    return [
                        'user' => $user,
                        'total_marks' => $group->count(),
                        'ticket_count' => $ticketCount,
                        'total_amount' => $totalAmount,
                        'branch' => $group->first()->totem->branch ?? null,
                        'created_at' => now()->toDateTimeString()
                    ];
                })
                ->sortByDesc('total_marks')
                ->values()
                ->take(10);
                
            $data['top_players'] = $topPlayers;
        }
        
        return response()->json($data);
    }
    
    public function shiftReport(Request $request, $id)
    {
        $shift = ShiftRecord::with(['branch', 'openedBy', 'closedBy'])->findOrFail($id);
        $userIdentifier = $request->input('user_identifier');
        
        // Get all fingerprint logs for this shift - incluye tanto jugadores como trabajadores
        // Get the data with memory optimization
        ini_set('memory_limit', '512M'); // Increase memory limit for this request
        
        $logs = FingerprintLog::with(['user.categoryBonus', 'totem.branch'])
            ->whereHas('totem', function($q) use ($shift) {
                $q->where('branch_id', $shift->branch_id);
            })
            ->whereBetween('created_at', [
                $shift->opening_time, 
                $shift->closing_time ?? now()
            ])
            ->when($userIdentifier, function($query) use ($userIdentifier) {
                return $query->whereHas('user', function($q) use ($userIdentifier) {
                    $q->where('username', 'like', "%{$userIdentifier}%")
                      ->orWhere('email', 'like', "%{$userIdentifier}%")
                      ->orWhere('first_name', 'like', "%{$userIdentifier}%")
                      ->orWhere('first_last_name', 'like', "%{$userIdentifier}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Buscar tickets relacionados para cada log
        $totalAmount = 0;
        foreach ($logs as $log) {
            // Buscar ticket creado en el mismo momento que el log de huella (dentro de un rango de 5 segundos)
            $ticket = Ticket::where('user_id', $log->user_id)
                ->where('created_at', '>=', $log->created_at->copy()->subSeconds(5))
                ->where('created_at', '<=', $log->created_at->copy()->addSeconds(5))
                ->first();
                
            if ($ticket) {
                $log->ticket = $ticket;
                $totalAmount += $ticket->total_amount;
            } else {
                $log->ticket = null;
            }
            
            // Determinar si es jugador o trabajador
            $log->is_player = $log->user->role_id == 6; // Asumiendo que 6 es el rol de jugador
        }
        
        // Calculate summary data - solo contando los que tienen tickets
        $ticketTypes = [];
        foreach ($logs as $log) {
            if (!$log->ticket) continue; // Ignorar logs sin tickets
            
            $ticketType = $log->ticket->type;
            
            if (!isset($ticketTypes[$ticketType])) {
                $ticketTypes[$ticketType] = [
                    'count' => 0,
                    'amount' => 0
                ];
            }
            
            $ticketTypes[$ticketType]['count']++;
            $ticketTypes[$ticketType]['amount'] += $log->ticket->total_amount;
        }
        
        $summary = [
            'total_marks' => $logs->count(),
            'total_amount' => $totalAmount,
            'player_marks' => $logs->where('is_player', true)->count(),
            'worker_marks' => $logs->where('is_player', false)->count(),
            'tickets_count' => $logs->filter(function($log) {
                return $log->ticket !== null;
            })->count(),
            'ticket_types' => $ticketTypes
        ];
        
        return response()->json([
            'shift' => $shift,
            'logs' => $logs,
            'summary' => $summary
        ]);
    }
}
