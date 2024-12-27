<?php

namespace App\Http\Controllers\Statuses;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Status;
use Inertia\Inertia;

class StatusController extends Controller
{
    public function index()
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }
        
        $statuses = Status::with(['users' => function ($query) {
            $query->whereDoesntHave('roles', function ($q) {
                $q->where('id', 1);
            });
        }, 'branches', 'companies'])
        ->get();

        // Preparar datos para pasar a la vista
        $data = [
            'statuses' => $statuses,
            'total' => $statuses->count(),
        ];

        return Inertia::render('Statuses/index', $data);
    }
}
