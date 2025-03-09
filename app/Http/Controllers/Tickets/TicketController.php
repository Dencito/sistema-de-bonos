<?php

namespace App\Http\Controllers\Tickets;

use App\Models\Ticket;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class TicketController extends Controller
{
    public function index()
    {
        return Ticket::all();
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