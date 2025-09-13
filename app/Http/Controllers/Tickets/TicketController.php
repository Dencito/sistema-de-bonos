<?php

namespace App\Http\Controllers\Tickets;

use App\Models\Ticket;
use App\Models\User;
use App\Models\Branch;
use App\Models\Totem;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Carbon\Carbon;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $query = Ticket::with([
            'user:id,first_name,second_name,first_last_name,second_last_name,email,role_id',
            'totem:id,name,branch_id',
            'totem.branch:id,name'
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
}