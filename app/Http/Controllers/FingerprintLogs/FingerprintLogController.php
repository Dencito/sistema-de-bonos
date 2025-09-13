<?php

namespace App\Http\Controllers\FingerprintLogs;

use App\Models\FingerprintLog;
use App\Models\User;
use App\Models\Totem;
use App\Models\Branch;
use App\Models\ShiftRecord;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Carbon\Carbon;

class FingerprintLogController extends Controller
{
    public function index(Request $request)
    {
        $query = FingerprintLog::with([
                'user:id,first_name,second_name,first_last_name,second_last_name,email,role_id,branch_id,status_id,role_id',
                'totem:id,name,branch_id', 
                'totem.branch:id,name', 
                'user.role:id,name'
            ]);
        
        // Filtro por fecha de inicio
        if ($request->filled('start_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $query->whereDate('created_at', '>=', $startDate);
        }
        
        // Filtro por fecha de fin
        if ($request->filled('end_date')) {
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $query->whereDate('created_at', '<=', $endDate);
        }
        
        // Filtro por usuario
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filtro por rol de usuario
        if ($request->filled('role_id')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('role_id', $request->role_id);
            });
        }
        
        // Filtro por sucursal
        if ($request->filled('branch_id')) {
            $query->whereHas('totem', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }
        
        // Filtro por turno
        if ($request->filled('shift_id')) {
            $shift = ShiftRecord::find($request->shift_id);
            if ($shift) {
                // Filtrar registros que ocurrieron durante el turno seleccionado
                $query->where('created_at', '>=', $shift->opening_time)
                      ->when($shift->closing_time, function($q) use ($shift) {
                          return $q->where('created_at', '<=', $shift->closing_time);
                      }, function($q) {
                          // Si el turno sigue abierto, filtrar hasta ahora
                          return $q->where('created_at', '<=', now());
                      });
                      
                // Si el turno tiene una sucursal asociada, filtrar por esa sucursal también
                if ($shift->branch_id) {
                    $query->whereHas('totem', function($q) use ($shift) {
                        $q->where('branch_id', $shift->branch_id);
                    });
                }
            }
        }
        
        // Implementar paginación para evitar problemas de memoria
        $perPage = $request->input('per_page', 25); // Por defecto 25 registros por página
        $fingerprintLogs = $query->orderBy('created_at', 'desc')->paginate($perPage);
            
        // Cargar selectivamente solo los datos necesarios para los filtros
        $users = User::select('id', 'first_name', 'second_name', 'first_last_name', 'second_last_name')
            ->when($request->filled('role_id'), function($q) use ($request) {
                return $q->where('role_id', $request->role_id);
            })
            ->limit(100) // Limitar cantidad de usuarios para evitar problemas de memoria
            ->get();
            
        $branches = Branch::select('id', 'name')->get();
        
        // Cargar totems solo si es necesario y limitar la cantidad
        $totems = [];
        if ($request->filled('branch_id')) {
            $totems = Totem::select('id', 'name', 'branch_id')
                ->where('branch_id', $request->branch_id)
                ->get();
        }
        
        // Cargar turnos para el filtro
        // Obtener los últimos 50 turnos (cerrados y abiertos) ordenados por fecha de apertura descendente
        $shifts = ShiftRecord::with(['branch:id,name', 'openedBy:id,first_name,first_last_name'])
            ->select('id', 'branch_id', 'opened_by_user_id', 'opening_time', 'closing_time', 'status')
            ->orderBy('opening_time', 'desc')
            ->limit(50)
            ->get()
            ->map(function($shift) {
                // Formatear la información del turno para el dropdown
                $status = $shift->status === 'open' ? 'Abierto' : 'Cerrado';
                $openingDate = Carbon::parse($shift->opening_time)->format('d/m/Y H:i');
                $closingDate = $shift->closing_time ? Carbon::parse($shift->closing_time)->format('d/m/Y H:i') : 'En curso';
                
                return [
                    'id' => $shift->id,
                    'branch' => $shift->branch->name ?? 'N/A',
                    'opened_by' => $shift->openedBy->first_name . ' ' . $shift->openedBy->first_last_name,
                    'opening_time' => $shift->opening_time,
                    'closing_time' => $shift->closing_time,
                    'status' => $shift->status,
                    'display_name' => "Turno #{$shift->id} - {$shift->branch->name} - {$openingDate} a {$closingDate} ({$status})"
                ];
            });
        
        return Inertia::render('FingerprintLogs/index', [
            'fingerprintLogs' => $fingerprintLogs,
            'users' => $users,
            'totems' => $totems,
            'branches' => $branches,
            'shifts' => $shifts,
            'filters' => $request->only(['start_date', 'end_date', 'user_id', 'role_id', 'branch_id', 'shift_id', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'totem_id' => 'required|exists:totems,id',
        ]);

        return FingerprintLog::create($validated);
    }

    public function show(FingerprintLog $fingerprintLog)
    {
        return $fingerprintLog->load(['user', 'totem', 'totem.branch']);
    }

    public function update(Request $request, FingerprintLog $fingerprintLog)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'totem_id' => 'required|exists:totems,id',
        ]);

        $fingerprintLog->update($validated);
        return $fingerprintLog;
    }

    public function destroy(FingerprintLog $fingerprintLog)
    {
        $fingerprintLog->delete();
        return response()->noContent();
    }
}
