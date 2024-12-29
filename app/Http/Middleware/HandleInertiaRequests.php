<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Company;
use App\Models\User;
use App\Models\Branch;
use App\Models\Role;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;


class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Obtener todas las compañías
        $companies = Company::all()->map(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'max_branches' => $company->max_branches,
            ];
        });

        $users = User::all();

        $user = $request->user();
        $user = !$user ? null : $user->load('branch');

        $roleId = !$user ? null : $user->role_id;

        $selectedCompany = null;

        if ($user) {
            // Cargar relaciones del usuario
            $user->load('branch.company', 'role', 'status', 'company', 'categoryBonus', 'branches.company', 'branches.shifts.schedules');

            // Verificar si el usuario tiene una empresa asignada
            $defaultCompany = $user->company ?: $user->branch->company ?? null;

            if ($defaultCompany) {
                // Almacenar la compañía seleccionada en la sesión
                $request->session()->put('selected_company', $defaultCompany->name);
                $selectedCompany = $defaultCompany;
            }
        }

        if(!$user) {
            return [
                ...parent::share($request),
                'auth' => [
                    'users' => $users->count(),
                ],
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'role' => $user ? Role::find($user->role_id)->name : null,
                'roles' => $user ? Role::where('id', '>', $user->role_id)->get() : [],
                'companies' => $companies,
                'create_more_branches' => $companies->first(),
                'branch' => $user->branch_id ? Branch::with(['shifts', 'shifts.schedules', 'status'])
                    ->where('id', $user->branch_id)
                    ->firstOrFail(): null,
                'users' => $users,
                'selected_company' => $selectedCompany ? $selectedCompany->name : null,
            ],
        ];
    }
}
