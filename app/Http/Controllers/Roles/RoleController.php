<?php

namespace App\Http\Controllers\Roles;

use App\Models\Role;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin'])) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }

        $roles = Role::where('id', '>', $user->role_id)
        ->with('users.categoryBonus')
        ->get();

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

        return Inertia::render('Roles/index', $data);
    }
}