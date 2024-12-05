<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Company;
use App\Models\User;
use App\Models\Branch;
use Spatie\Permission\Models\Role;
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

        // Obtener todos los usuarios
        $users = User::all();

        // Obtener el usuario autenticado
        $user = $request->user();
        $user = !$user ? null : $user->load('branch');

        // Obtener los IDs de los roles del usuario
        $roleIds = !$user ? null : $user->roles->pluck('id')->toArray();
        $userRoleId = !$user ? null : $request->user()->roles->first()->id;

       /*  // Inicializar mapeo de días de la semana
        $dayOfWeekToNumber = [
            'Lunes' => 1,
            'Martes' => 2,
            'Miercoles' => 3,
            'Jueves' => 4,
            'Viernes' => 5,
            'Sabado' => 6,
            'Domingo' => 7
        ];

        // Verificar si el usuario tiene una sucursal asociada
        if ($user && $user->branch) {
            $branch = Branch::with(['shifts', 'shifts.schedules'])->find($user->branch->id);

            if ($branch && $branch->shifts) {
                // Verificar si el turno es válido
                $isShiftValid = $this->isShiftValid($branch->shifts->toArray(), $dayOfWeekToNumber);
                in_array(5, $roleIds) && dd($isShiftValid);
                if(!$isShiftValid) {
                    //Auth::logout();
                    abort(403, 'La sucursal finalizo su horario, contacte con un administrador');
                }
            } else {
                // Manejar caso cuando no haya turnos disponibles
                abort(403, 'No hay turnos asignados para tu sucursal, contacte con un administrador');
            }
        } else if($user !== null) {
            // Manejar caso cuando el usuario no tenga sucursal
            abort(403, 'No tienes una sucursal asignada, contacte con un administrador');
        } */

        // Inicializar variable de compañía seleccionada
        $selectedCompany = null;

        if ($user) {
            // Cargar relaciones del usuario
            $user->load('branch.company', 'roles', 'state', 'company', 'categoryBonus', 'branches.company', 'branches.shifts.schedules');
/* 
            // Si el usuario no tiene un rol con ID 1, 2 o 3, asignar una compañía por defecto
            if (!in_array(1, $roleIds) && !in_array(2, $roleIds) && !in_array(3, $roleIds)) {
                // Verificar si el usuario tiene una empresa asignada
                $defaultCompany = $user->company ?: $user->branch->company ?? null;

                if ($defaultCompany) {
                    // Almacenar la compañía seleccionada en la sesión
                    $request->session()->put('selected_company', $defaultCompany->name);
                    $selectedCompany = $defaultCompany;
                }
            } */

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
                'role' => $user->getRoleNames()->first(),
                'roles' => $roles = Role::where('id', '>', $userRoleId)->get(),
                'companies' => $companies,
                'create_more_branches' => $companies->first(),
                'branch' => $user->branch_id ? Branch::with(['shifts', 'shifts.schedules', 'state'])
                    ->where('id', $user->branch_id)
                    ->firstOrFail(): null,
                'users' => $users,
                'selected_company' => $selectedCompany ? $selectedCompany->name : null, // Devolver la empresa seleccionada
            ],
        ];
    }

/* 
    function isTimeInRange($currentTime, $startTime, $endTime)
    {
        $current = Carbon::parse($currentTime);
        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);

        // Si el horario pasa de un día a otro (por ejemplo de 19:00 a 00:00)
        if ($end->lessThan($start)) {
            return $current->greaterThanOrEqualTo($start) || $current->lessThanOrEqualTo($end);
        }

        return $current->greaterThanOrEqualTo($start) && $current->lessThanOrEqualTo($end);
    }
        
    // Función que valida si el día y la hora actuales están permitidos
    function isShiftValid($shifts, $dayOfWeekToNumber)
    {
        // Obtener el día y la hora actuales
        $now = Carbon::now();
        $currentDay = (int) $now->dayOfWeekIso; // Lunes = 1, Domingo = 7
        $currentTime = $now->format('H:i'); // "HH:MM" formato

        // Recorrer los turnos
        foreach ($shifts as $shift) {
            $dayInit = $dayOfWeekToNumber[$shift['day_init']];
            $dayEnd = $dayOfWeekToNumber[$shift['day_end']];

            // Verificar si el día actual está dentro del rango de días
            if (
                ($dayInit <= $currentDay && $currentDay <= $dayEnd) ||
                ($dayEnd < $dayInit && ($currentDay >= $dayInit || $currentDay <= $dayEnd)) // Días que cruzan de una semana a otra
            ) {
                // Verificar los horarios dentro del día
                foreach ($shift['schedules'] as $schedules) {
                    if ($this->isTimeInRange($currentTime, $schedules['start'], $schedules['end'])) {
                        return true; // Puede iniciar sesión
                    }
                }
            }
        }

        return false; // No puede iniciar sesión
    } */
}
