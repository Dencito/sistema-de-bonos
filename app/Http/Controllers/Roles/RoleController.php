<?php

namespace App\Http\Controllers\Roles;
use Spatie\Permission\Models\Role;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {

        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }
        $userRoleId = auth()->user()->roles->first()->id;
        $roles = Role::where('id', '>=', $userRoleId)->get();

        // Preparar datos para pasar a la vista
        $data = [
            'roles' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'users' => $role->users,
                ];
            }),
            'total' => $roles->count(),
        ];

        return Inertia::render('Roles/Index', $data);
    }
}
