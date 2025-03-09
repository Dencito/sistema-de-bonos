<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Models\Bonus;
use App\Models\Branch;
use App\Models\CategoryBonus;
use App\Models\Company;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use App\Models\UserBranches;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $users = User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])
            ->when($request->username, function ($query, $username) {
                $query->where('username', 'like', "%{$username}%");
            })
            ->where('role_id', '>', 1)  // Exclude role ID 1 (duenio)
            ->when($request->role, function ($query, $role) {
                $query->whereHas('role', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->whereHas('status', function ($q) use ($status) {
                    $q->where('name', $status);
                });
            })
            ->get();

        $roles = Role::where('id', '>', $user->role_id)->get();
        $statuses = Status::where('name', '!=', 'En revisión')->get();
        $branches = Branch::with(['company'])->get()->map(function ($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'company' => $branch->company->id
            ];
        });

        $companies = Company::select('id', 'name')->get();
        $categories = CategoryBonus::select('id', 'name')->get();
        $bonuses = Bonus::select()->get();

        return Inertia::render('Users/index', [
            'users' => $users,
            'roles' => $roles,
            'statuses' => $statuses,
            'branches' => $branches,
            'companies' => $companies,
            'categories' => $categories,
            'bonuses' => $bonuses,
            'filters' => $request->only(['username', 'status', 'role']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            // Validar si 'username' no es null antes de la consulta
            if (!is_null($request->username)) {
                $existingUser = User::where('username', $request->username)->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El nombre de usuario ya existe', 'error' => true], 400);
                }
            }

            // Validar si 'email' no es null antes de la consulta
            if (!is_null($request->email)) {
                $existingUser = User::where('email', $request->email)->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El correo electrónico ya existe', 'error' => true], 400);
                }
            }

            if (!is_null($request->rutNumbers) && !is_null($request->rutDv)) {
                $existingUser = User::where('rutNumbers', $request->rutNumbers)
                    ->where('rutDv', $request->rutDv)
                    ->first();

                if ($existingUser) {
                    return response()->json(['message' => 'El RUT ya esta en uso.', 'error' => true], 400);
                }
            }

            if (!is_null($request->phone)) {
                $existingUser = User::where('phone', $request->phone)->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El telefono ya esta en uso.', 'error' => true], 400);
                }
            }
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error al verificar los datos del usuario', 'error' => true], 500);
        }
        $request->validate([
            'first_name' => 'nullable|string',
            'second_name' => 'nullable|string',
            'first_last_name' => 'nullable|string',
            'second_last_name' => 'nullable|string',
            'prefix' => 'nullable|string',
            'phone' => 'nullable|string',
            'rutNumbers' => 'nullable',
            'rutDv' => 'nullable|string',
            'code' => 'nullable',
            'birth_date' => 'nullable|date',
            'entry_date' => 'nullable|date',
            'has_fingerprint' => 'boolean',
            'email' => 'nullable|email',
            'nationality' => 'nullable|string',
            'address' => 'nullable|string',
            'marital_status' => 'nullable|string',
            'pension' => 'nullable|string',
            'health' => 'nullable|string',
            'afp' => 'nullable|string',
            'childrens' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'branch_id' => 'nullable',
            'status_id' => 'nullable',
            'category_bonus_id' => 'nullable',
            'role' => 'nullable|string',
            'branches' => 'nullable',
            'branches.*' => 'nullable',
        ]);

        DB::beginTransaction();
        try {
            // Get role_id from role name
            $role = Role::where('name', $request->role)->first();
            if (!$role) {
                DB::rollBack();
                return response()->json(['message' => 'Rol no válido', 'error' => true], 400);
            }

            $company = Company::first();
            // Comenzar una transacción para asegurar atomicidad
            $user = User::create([
                'first_name' => $request->first_name,
                'second_name' => $request->second_name,
                'first_last_name' => $request->first_last_name,
                'second_last_name' => $request->second_last_name,
                'prefix' => $request->prefix,
                'phone' => $request->phone,
                'rutNumbers' => $request->rutNumbers,
                'rutDv' => $request->rutDv,
                'code' => $this->generateUniqueCode(),
                'birth_date' => $request->birth_date,
                'entry_date' => $request->entry_date ? $request->entry_date : now(),
                'has_fingerprint' => false,
                'email' => $request->email,
                'nationality' => $request->nationality,
                'address' => $request->address,
                'marital_status' => $request->marital_status,
                'pension' => $request->pension,
                'health' => $request->health,
                'afp' => $request->afp,
                'childrens' => $request->childrens,
                'username' => $request->username,
                'password' => $request->password ? Hash::make($request->password) : null,
                'branch_id' => $request->branch_id,
                'status_id' => 1,
                'company_id' => $company ? $company->id : null,
                'category_bonus_id' => $request->category_bonus_id,
                'role_id' => $role->id,
            ]);

            $userId = $user->id;
            if ($request->branches) {
                $branchIds = $request->branches;
                // Iterar sobre los IDs de las sucursales para insertarlos en la tabla `user_branches`
                foreach ($branchIds as $branchId) {
                    // Verificar si la relación ya existe para evitar duplicados
                    $existingUserBranch = UserBranches::where('user_id', $userId)
                        ->where('branch_id', $branchId)
                        ->first();

                    if (!$existingUserBranch) {
                        // Crear una nueva relación en `user_branches`
                        UserBranches::create([
                            'user_id' => $userId,
                            'branch_id' => $branchId,
                        ]);
                    }
                }
            }
            // Confirmar la transacción
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error al crear usuario: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['error' => true, 'message' => 'Error al crear el usuario', 'details' => $e], 500);
        }

        return response()->json([
            'error' => false,
            'message' => 'Usuario creado exitosamente',
        ]);
    }

    private function generateUniqueCode()
    {
        do {
            // Generar un número de 9 dígitos
            $code = random_int(100000000, 999999999);
        } while (User::where('code', $code)->exists());

        return $code;
    }

    public function update(Request $request, User $user)
    {
        // Obtener el ID del rol del usuario autenticado
        $userRoleId = auth()->user()->role_id;

        // Verificar que el rol del usuario a eliminar no sea mayor o igual al rol del usuario autenticado
        $userRoleIdToUpdate = $user->role_id;

        if ($userRoleIdToUpdate <= $userRoleId) {
            return response()->json([
                'error' => true,
                'message' => 'No tienes permiso para editar usuarios con roles superiores o iguales.',
            ], 403);
        }

        try {
            // Validar si 'username' no es null antes de la consulta
            if (!is_null($request->username)) {
                $existingUser = User::where('username', $request->username)
                    ->where('id', '!=', $user->id)
                    ->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El nombre de usuario ya existe', 'error' => true], 400);
                }
            }

            // Validar si 'email' no es null antes de la consulta
            if (!is_null($request->email)) {
                $existingUser = User::where('email', $request->email)
                    ->where('id', '!=', $user->id)
                    ->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El correo electrónico ya existe', 'error' => true], 400);
                }
            }

            // Validar si 'phone' no es null antes de la consulta
            if (!is_null($request->phone)) {
                $existingUser = User::where('phone', $request->phone)
                    ->where('id', '!=', $user->id)
                    ->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El teléfono ya existe', 'error' => true], 400);
                }
            }

            // Validar si 'code' no es null antes de la consulta
            if (!is_null($request->code)) {
                $existingUser = User::where('code', $request->code)
                    ->where('id', '!=', $user->id)
                    ->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El codigo de usuario ya existe', 'error' => true], 400);
                }
            }

            if (!is_null($request->rutNumbers) && !is_null($request->rutDv)) {
                $existingUser = User::where('rutNumbers', $request->rutNumbers)
                    ->where('rutDv', $request->rutDv)
                    ->where('id', '!=', $user->id)
                    ->first();

                if ($existingUser) {
                    return response()->json(['message' => 'El RUT ya esta en uso.', 'error' => true], 400);
                }
            }
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error al verificar los datos del usuario', 'error' => true], 500);
        }

        $validatedData = $request->validate([
            'first_name' => 'nullable|string',
            'second_name' => 'nullable|string',
            'first_last_name' => 'nullable|string',
            'second_last_name' => 'nullable|string',
            'prefix' => 'nullable|string',
            'phone' => 'nullable|string',
            'rutNumbers' => 'nullable',
            'rutDv' => 'nullable|string',
            'code' => 'nullable',
            'birth_date' => 'nullable|date',
            'entry_date' => 'nullable',
            'has_fingerprint' => 'boolean',
            'email' => 'nullable|email',
            'nationality' => 'nullable|string',
            'address' => 'nullable|string',
            'marital_status' => 'nullable|string',
            'pension' => 'nullable|string',
            'health' => 'nullable|string',
            'afp' => 'nullable|string',
            'childrens' => 'nullable|integer',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'branch_id' => 'nullable',
            'status_id' => 'required',
            'company_id' => 'nullable',
            'category_bonus_id' => 'nullable',
            'role_id' => 'nullable',
            'branches' => 'nullable|array',
            'branches.*' => 'nullable',
        ]);

        $user->update([
            'first_name' => $request->first_name,
            'second_name' => $request->second_name,
            'first_last_name' => $request->first_last_name,
            'second_last_name' => $request->second_last_name,
            'prefix' => $request->prefix,
            'phone' => $request->phone,
            'rutNumbers' => $request->rutNumbers,
            'rutDv' => $request->rutDv,
            'code' => $request->code,
            'birth_date' => $request->birth_date,
            'entry_date' => $request->entry_date,
            'has_fingerprint' => $request->has_fingerprint,
            'email' => $request->email,
            'nationality' => $request->nationality,
            'address' => $request->address,
            'marital_status' => $request->marital_status,
            'pension' => $request->pension,
            'health' => $request->health,
            'afp' => $request->afp,
            'childrens' => $request->childrens,
            'username' => $request->username,
            'password' => $request->filled('password') ? Hash::make($validatedData['password']) : $user->password,
            'branch_id' => $request->branch_id,
            'status_id' => $request->status_id,
            'category_bonus_id' => $request->category_bonus_id,
            'role_id' => $request->role_id,
        ]);

        if ($request->has('branches')) {
            $user->branches()->sync($request->branches);
        }

        return response()->json([
            'error' => false,
            'message' => 'Usuario actualizado exitosamente',
        ]);
    }

    public function destroy(User $user)
    {
        // Obtener el ID del rol del usuario autenticado
        $userRoleId = auth()->user()->role_id;

        // Verificar que el usuario no se esté eliminando a sí mismo
        if ($user->id === auth()->id()) {
            return response()->json([
                'error' => true,
                'message' => 'No puedes eliminarte a ti mismo.',
            ], 403);
        }

        // Verificar que el rol del usuario a eliminar no sea mayor o igual al rol del usuario autenticado
        $userRoleIdToDelete = $user->role_id;

        if ($userRoleIdToDelete <= $userRoleId) {
            return response()->json([
                'error' => true,
                'message' => 'No tienes permiso para eliminar usuarios con roles superiores o iguales.',
            ], 403);
        }

        // Eliminar al usuario
        $user->delete();

        return response()->json([
            'error' => false,
            'message' => 'Usuario eliminado exitosamente',
        ]);
    }

    public function assignMultipleBranches(Request $request)
    {
        // Validar los datos de la solicitud
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'branches' => 'required|array',
            'branches.*' => 'exists:branches,id',
        ]);

        $bonusId = $validated['user_id'];
        $userIds = $validated['branches'];

        // Comenzar una transacción para asegurar atomicidad
        DB::beginTransaction();

        try {
            // Iterar sobre los IDs de los usuarios para insertarlos en la tabla `user_bonuses`
            foreach ($userIds as $userId) {
                // Verificar si la relación ya existe para evitar duplicados
                $existingUserBonus = UserBranches::where('user_id', $userId)
                    ->where('bonus_id', $bonusId)
                    ->first();

                if (!$existingUserBonus) {
                    // Crear una nueva relación en `user_bonuses`
                    UserBranches::create([
                        'user_id' => $userId,
                        'branch_id' => $bonusId,
                    ]);
                }
            }

            // Confirmar la transacción
            DB::commit();

            return response()->json([
                'error' => false,
                'message' => 'Usuarios asignados correctamente al bono',
            ]);
        } catch (\Exception $e) {
            // Revertir los cambios si ocurre un error
            DB::rollBack();
            return response()->json(['error' => true, 'message' => 'Error al asignar usuarios', 'details' => $e->getMessage()], 500);
        }
    }

    public function ValidateRut(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        Log::info($request->all());

        $user = User::where('username', $request->username)
            ->whereIn('role_id', [1, 2, 3, 4, 5])
            ->first();

        Log::info($user);

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw new \Exception('Las credenciales no son correctas');
        }

        return response()->json(['message' => 'usuario válido', 'user' => $user], 200);
    }

    public function enroll(Request $request)
    {
        $fingerprintsData = json_decode($request->input('fingerprints'), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['message' => 'Invalid JSON format for fingerprints.'], 400);
        }

        $request->merge(['fingerprints' => $fingerprintsData['fingerprints']]);

        $request->validate([
            'rutOrCode' => 'required|string',
            'fingerprints' => 'required|array|min:1|max:10',
            'fingerprints.*.data' => 'required|string',
        ]);

        $user = User::where('rutNumbers', $request->rutOrCode)
            ->orWhere('code', $request->rutOrCode)
            ->whereIn('role_id', [5, 6])
            ->first();

        if ($user) {
            $fingerprints = $request->input('fingerprints');
            $user->fingerprints = json_encode($fingerprints);
            $user->has_fingerprint = true;
            $user->save();
            return response()->json(['message' => 'User enrolled successfully.'], 200);
        }

        return response()->json(['message' => 'User not found.'], 404);
    }

    public function getFingerprintsByRole()
    {
        $users = User::with(['role', 'status'])
            ->whereIn('role_id', [5, 6])
            ->whereNotNull('fingerprints')
            ->where('fingerprints', '!=', '[]')
            ->where('has_fingerprint', true)
            ->get(['id', 'username', 'first_name', 'first_last_name', 'fingerprints', 'role_id', 'status_id']);

        return response()->json([
            'data' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'firstName' => $user->first_name,
                    'lastName' => $user->first_last_name,
                    'fingerprints' => json_decode($user->fingerprints, true),
                    'role' => $user->role->name,
                    'status' => $user->status->name
                ];
            })
        ]);
    }

    private function validateSchedules($branch)
    {
        $currentTime = now();
        $currentDay = strtolower($currentTime->format('l')); // Get current day name in lowercase
        $currentTimeStr = $currentTime->format('H:i');

        // If bonus_schedules is null, no bonuses are available
        if ($branch->bonus_schedules === null) {
            return false;
        }

        $bonusSchedules = json_decode($branch->bonus_schedules, true);
        
        // Check if current time falls within any of the bonus schedules
        foreach ($bonusSchedules as $schedule) {
            $daySchedules = collect($schedule['schedules'])
                ->firstWhere('day', ucfirst($currentDay));

            if ($daySchedules) {
                foreach ($daySchedules['ranges'] as $range) {
                    $startTime = $range['start_time'];
                    $endTime = $range['end_time'];

                    // Handle special case for midnight (24:00)
                    if ($endTime === '24:00') {
                        $endTime = '23:59';
                    }

                    if ($this->isTimeInRange($currentTimeStr, $startTime, $endTime)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function isTimeInRange($time, $start, $end)
    {
        $time = strtotime($time);
        $start = strtotime($start);
        $end = strtotime($end);

        // If end time is less than start time, it means the range crosses midnight
        if ($end < $start) {
            return $time >= $start || $time <= $end;
        }

        return $time >= $start && $time <= $end;
    }

    public function getBonusesAvailablesUserById($id)
    {
        try {
            $user = User::with([
                'bonuses',
                'categoryBonus',
                'branches:id,company_id',
                'branches.company',
                'branches.totem',
                'branches.shifts',
                'status',
                'role'
            ])->findOrFail($id);

            // Add schedule validation for each branch
            $user->branches->transform(function ($branch) {
                $branch->is_bonus_available = $this->validateSchedules($branch);
                return $branch;
            });

            return response()->json([
                'success' => true,
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los bonos del usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
