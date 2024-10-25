<?php

namespace App\Http\Controllers\States;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\State;
use Inertia\Inertia;

class StateController extends Controller
{
    public function index()
    {

        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }
        $states = State::with(['users' => function ($query) {
            $query->whereDoesntHave('roles', function ($q) {
                $q->where('id', 1);
            });
        }, 'branches', 'companies'])
        ->get();
        //$states = State::all();

        // Preparar datos para pasar a la vista
        $data = [
            'states' => $states,
            'total' => $states->count(),
        ];

        return Inertia::render('States/index', $data);
    }
}
