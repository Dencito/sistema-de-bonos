<?php

namespace App\Http\Controllers\Tickets;

use App\Models\Ticket;
use App\Models\User;
use App\Models\Branch;
use App\Models\Totem;
use App\Models\ShiftRecord;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Carbon\Carbon;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        // Log the received parameters for debugging
        \Log::info('Tickets index parameters:', $request->all());

        $user = auth()->user();
        
        $query = Ticket::with([
            'user:id,first_name,second_name,first_last_name,second_last_name,email,role_id',
            'totem:id,name,branch_id',
            'totem.branch:id,name,ticketNumber'
        ]);
        
        // Filtro por fecha de inicio
        if ($request->filled('start_date')) {
            // Use whereDate to compare only the date part, ignoring time
            $query->whereDate('created_at', '>=', $request->start_date);
            
            // Log for debugging
            \Log::info('Tickets - Start date filter applied (using whereDate):', [
                'start_date' => $request->start_date,
                'timezone' => config('app.timezone')
            ]);
        }
        
        // Filtro por fecha de fin
        if ($request->filled('end_date')) {
            // Use whereDate to compare only the date part, ignoring time
            $query->whereDate('created_at', '<=', $request->end_date);
            
            // Log for debugging
            \Log::info('Tickets - End date filter applied (using whereDate):', [
                'end_date' => $request->end_date,
                'timezone' => config('app.timezone')
            ]);
        }
        
        // Filtro por usuario
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filtro por tipo de ticket
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        
        // Filtro por totem/sucursal
        if ($request->filled('branch_id')) {
            $query->whereHas('totem', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        // Si el usuario tiene role_id 5 (jugador), filtrar por tickets generados durante su turno actual
        if ($user->role_id == 5) {
            // Buscar el último turno abierto del usuario
            $lastShift = ShiftRecord::where('opened_by_user_id', $user->id)
                ->orderBy('opening_time', 'desc')
                ->first();
                
            if ($lastShift) {
                $startTime = Carbon::parse($lastShift->opening_time);
                $endTime = $lastShift->closing_time ? Carbon::parse($lastShift->closing_time) : Carbon::now();
                
                // Filtrar tickets generados durante el turno
                $query->where('created_at', '>=', $startTime)
                      ->where('created_at', '<=', $endTime);
                      
                // Log para depuración
                \Log::info('Tickets - Filtro por turno del usuario aplicado:', [
                    'user_id' => $user->id,
                    'shift_id' => $lastShift->id,
                    'opening_time' => $startTime->toDateTimeString(),
                    'closing_time' => $endTime->toDateTimeString()
                ]);
            } else {
                // Si no tiene turno, mostrar solo sus tickets
                $query->where('user_id', $user->id);
                
                // Log para depuración
                \Log::info('Tickets - Usuario sin turno, mostrando solo sus tickets:', [
                    'user_id' => $user->id
                ]);
            }
        }
        
        // Implementar paginación para evitar problemas de memoria
        $perPage = $request->input('per_page', 25); // Por defecto 25 registros por página
        $tickets = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Cargar datos para los filtros de forma optimizada
        $users = User::select('id', 'first_name', 'second_name', 'first_last_name', 'second_last_name')
            ->limit(100) // Limitar cantidad para evitar problemas de memoria
            ->get();
            
        $branches = Branch::select('id', 'name')->get();
        
        // Cargar totems solo si es necesario
        $totems = [];
        if ($request->filled('branch_id')) {
            $totems = Totem::select('id', 'name', 'branch_id')
                ->where('branch_id', $request->branch_id)
                ->get();
        }
            
        return Inertia::render('Tickets/index', [
            'tickets' => $tickets,
            'users' => $users,
            'branches' => $branches,
            'totems' => $totems,
            'filters' => $request->only(['start_date', 'end_date', 'user_id', 'type', 'branch_id', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'totem_id' => 'required',
            'total_amount' => 'required|numeric',
            'active' => 'nullable|boolean'
        ]);

        $validated['active'] = $validated['active'] ?? true;

        return Ticket::create($validated);
    }

    public function show(Ticket $ticket)
    {
        return $ticket;
    }

    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'totem_id' => 'required',
            'total_amount' => 'required|numeric',
            'active' => 'nullable|boolean'
        ]);

        $validated['active'] = $validated['active'] ?? true;

        $ticket->update($validated);
        return $ticket;
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();
        return response()->noContent();
    }
    
    /**
     * Export tickets data for Excel export
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function export(Request $request)
    {
        // Log the received parameters for debugging
        \Log::info('Tickets export parameters:', $request->all());
        
        $query = Ticket::with([
            'user:id,first_name,second_name,first_last_name,second_last_name,email,role_id',
            'user.role:id,name',
            'totem:id,name,branch_id',
            'totem.branch:id,name'
        ]);
        
        // Filtro por fecha de inicio
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        
        // Filtro por fecha de fin
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        
        // Filtro por usuario
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filtro por tipo de ticket
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        
        // Filtro por totem/sucursal
        if ($request->filled('branch_id')) {
            $query->whereHas('totem', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }
        
        // Si el usuario tiene role_id 5 (jugador), filtrar por tickets generados durante su turno actual
        $user = auth()->user();
        if ($user->role_id == 5) {
            // Buscar el último turno abierto del usuario
            $lastShift = ShiftRecord::where('opened_by_user_id', $user->id)
                ->orderBy('opening_time', 'desc')
                ->first();
                
            if ($lastShift) {
                $startTime = Carbon::parse($lastShift->opening_time);
                $endTime = $lastShift->closing_time ? Carbon::parse($lastShift->closing_time) : Carbon::now();
                
                // Filtrar tickets generados durante el turno
                $query->where('created_at', '>=', $startTime)
                      ->where('created_at', '<=', $endTime);
                      
                // Log para depuración
                \Log::info('Tickets Export - Filtro por turno del usuario aplicado:', [
                    'user_id' => $user->id,
                    'shift_id' => $lastShift->id,
                    'opening_time' => $startTime->toDateTimeString(),
                    'closing_time' => $endTime->toDateTimeString()
                ]);
            } else {
                // Si no tiene turno, mostrar solo sus tickets
                $query->where('user_id', $user->id);
                
                // Log para depuración
                \Log::info('Tickets Export - Usuario sin turno, mostrando solo sus tickets:', [
                    'user_id' => $user->id
                ]);
            }
        }
        
        // Obtener todos los tickets sin paginación
        $tickets = $query->orderBy('created_at', 'desc')->get();
        
        // Calcular estadísticas para el resumen
        $totalAmount = $tickets->sum('total_amount');
        
        // Agrupar por tipo de ticket
        $ticketTypes = $tickets->groupBy('type')->map(function ($group) {
            return [
                'count' => $group->count(),
                'amount' => $group->sum('total_amount')
            ];
        });
        
        // Agrupar por sucursal
        $byBranch = $tickets->groupBy(function($ticket) {
            return $ticket->totem && $ticket->totem->branch ? $ticket->totem->branch->name : 'Sin sucursal';
        })->map(function ($group) {
            return [
                'total' => $group->count(),
                'amount' => $group->sum('total_amount')
            ];
        });
        
        // Preparar resumen
        $summary = [
            'total_tickets' => $tickets->count(),
            'total_amount' => $totalAmount,
            'ticket_types' => $ticketTypes,
            'by_branch' => $byBranch
        ];
        
        return response()->json([
            'tickets' => $tickets,
            'summary' => $summary,
            'filters' => $request->only(['start_date', 'end_date', 'user_id', 'type', 'branch_id'])
        ]);
    }
}