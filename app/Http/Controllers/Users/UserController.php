<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Models\Bonus;
use App\Models\Branch;
use App\Models\CategoryBonus;
use App\Models\Company;
use App\Models\FingerprintLog;
use App\Models\Role;
use App\Models\ShiftRecord;
use App\Models\Status;
use App\Models\Ticket;
use App\Models\Totem;
use App\Models\User;
use App\Models\UserBranches;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $users = User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch', 'fingerprintLogs'])
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
            ->orderBy('created_at', 'desc')
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
                'password' => $request->password,
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
            'has_fingerprint' => $request->filled('has_fingerprint') ? $request->has_fingerprint : $user->has_fingerprint,
            'email' => $request->email,
            'nationality' => $request->nationality,
            'address' => $request->address,
            'marital_status' => $request->marital_status,
            'pension' => $request->pension,
            'health' => $request->health,
            'afp' => $request->afp,
            'childrens' => $request->childrens,
            'username' => $request->username,
            'password' => $request->filled('password') ? $validatedData['password'] : $user->password,
            'branch_id' => $request->branch_id,
            'status_id' => $request->status_id,
            'category_bonus_id' => $request->category_bonus_id,
            'role_id' => $request->role_id,
        ]);

        if ($request->has('branches')) {
            $user->branches()->sync($request->branches);
        }

        if (in_array($user->role_id, [5, 6])) {
            cache()->forget('fingerprints_by_role_' . implode('_', [5, 6]));
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

        $user->delete();

        if (in_array($user->role_id, [5, 6])) {
            cache()->forget('fingerprints_by_role_' . implode('_', [5, 6]));
        }

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

    public function ValidateLoginTotem(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'rutOrCode' => 'required|string',
        ]);

        $user = User::where('username', $request->username)
            ->whereIn('role_id', [1, 2, 3, 4, 5])
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $userToEnroll = User::where(function ($query) use ($request) {
            $query
                ->where('rutNumbers', $request->rutOrCode)
                ->orWhere('code', $request->rutOrCode);
        })
            ->whereIn('role_id', [5, 6])
            ->where('has_fingerprint', false)
            ->first();

        if (!$userToEnroll) {
            return response()->json(['message' => 'user to enroll not found'], 404);
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

        $updated = User::where(function ($query) use ($request) {
            $query
                ->where('rutNumbers', $request->rutOrCode)
                ->orWhere('code', $request->rutOrCode);
        })
            ->whereIn('role_id', [5, 6])
            ->where('has_fingerprint', false)
            ->update([
                'fingerprints' => $request->input('fingerprints'),
                'has_fingerprint' => true,
            ]);

        if ($updated) {
            cache()->forget('fingerprints_by_role_' . implode('_', [5, 6]));

            return response()->json(['message' => 'User enrolled successfully.'], 200);
        }

        return response()->json(['message' => 'User not found with rutOrCode:' . $request->rutOrCode], 404);
    }

    public function getFingerprintsByRole($totemUUID)
    {
        $totem = Totem::with('branch')->where('code', $totemUUID)->first();
        if (!$totem) {
            return response()->json(['message' => 'Totem no encontrado'], 404);
        }

        $branch = $totem->branch;

        $users = User::with(['role:id,name', 'status:id,name', 'branches'])
            ->whereIn('role_id', [5, 6])
            ->whereNotNull('fingerprints')
            ->where('fingerprints', '!=', '[]')
            ->where('has_fingerprint', true)
            ->where(function ($query) use ($branch) {
                // Para jugadores (role_id = 6) buscar en la relación branches
                $query
                    ->where(function ($q) use ($branch) {
                        $q
                            ->where('role_id', 6)
                            ->whereHas('branches', function ($q) use ($branch) {
                                $q->where('branch_id', $branch->id);
                            });
                    })
                    // Para trabajadores (role_id = 5) buscar en branch_id
                    ->orWhere(function ($q) use ($branch) {
                        $q
                            ->where('role_id', 5)
                            ->where('branch_id', $branch->id);
                    });
            })
            ->get(['id', 'username', 'first_name', 'first_last_name', 'fingerprints', 'role_id', 'status_id', 'rutNumbers', 'rutDv']);

        return response()->json([
            'data' => $users->map(function ($user) use ($branch) {
                return [
                    'id' => $user->id,
                    'username' => $user->first_name . ' ' . $user->first_last_name,
                    'firstName' => $user->first_name,
                    'lastName' => $user->first_last_name,
                    'rut' => $user->rutNumbers . '-' . $user->rutDv,
                    'fingerprints' => $user->fingerprints,
                    'role' => $user->role->name,
                    'branch' => $branch->name,
                ];
            })
        ]);
    }

    public function getBonusesAvailablesUserById($id, $totemUUID)
    {
        $user = User::with([
            'bonuses',
            'categoryBonus',
            'branches:id,company_id',
            'branches.company',
            'branches.totem',
            'branches.shifts',
            'categoryBonus',
            'status',
            'role',
            'tickets',
            'bonuses',
            'fingerprintLogs',
        ])->find($id);

        if (!$user) {
            return response()->json([
                'message' => 'El usuario autenticado no fue encontrado en nuestros registros.'
            ], 404);
        }

        if ((string) $user->status_id !== '1') {
            return response()->json([
                'message' => 'El usuario autenticado no se encuentra activo.'
            ], 403);
        }

        $totem = Totem::with('branch')->where('code', $totemUUID)->first();
        if (!$totem || !$totem->branch) {
            return response()->json([
                'message' => 'El UUID del totem no fue encontrado en nuestros registros o no se encuentra configurado.'
            ], 404);
        }

        $branch = $user->branches->find($totem->branch_id)->first();

        if (!$branch) {
            return response()->json([
                'message' => 'La sucursal no fue encontrada en nuestros registros o no se encuentra configurada.'
            ], 404);
        }

        // Validar available_schedules
        $available_schedules = null;
        if (isset($branch->available_schedules) && !empty($branch->available_schedules)) {
            $available_schedules = is_string($branch->available_schedules) ? json_decode($branch->available_schedules, true) : $branch->available_schedules;
        }

        $validateSchedules = $this->validateSchedules($available_schedules);
        if (!$validateSchedules) {
            return response()->json([
                'message' => 'La sucursal no se encuentra activa en este horario.'
            ], 403);
        }

        // Validar bonus_schedules
        $bonus_schedules = null;
        if (isset($branch->bonus_schedules) && !empty($branch->bonus_schedules)) {
            $bonus_schedules = is_string($branch->bonus_schedules) ? json_decode($branch->bonus_schedules, true) : $branch->bonus_schedules;
        }

        $validateBonusSchedules = $this->validateSchedules($bonus_schedules);
        if (!$validateBonusSchedules) {
            return response()->json([
                'message' => 'La sucursal no tiene bonos disponibles en este horario.'
            ], 403);
        }
        if ((string) $branch->status_id !== '1') {
            return response()->json([
                'message' => 'La sucursal no se encuentra activa.'
            ], 403);
        }

        if (!$totem) {
            return response()->json([
                'message' => 'El UUID del totem no fue encontrado en nuestros registros o no se encuentra configurado.'
            ], 404);
        }

        $isOpenTurn = ShiftRecord::where('branch_id', $branch->id)
            ->where('status', 'open')
            ->first();

        if (!$isOpenTurn) {
            return response()->json([
                'message' => 'La sucursal no tiene turnos abiertos, comuniquese con un trabajador.'
            ], 409);
        }

        $SumaBonosAdditionals = 0;
        $bonusesAvailable = [];
        $tickets = [];

        $bonusesAvailableAdditionals = $user->bonuses->where('active', true);

        foreach ($bonusesAvailableAdditionals as $bonus) {
            $SumaBonosAdditionals += $bonus->amount;
        }

        if ($SumaBonosAdditionals > 0) {
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'totem_id' => $totem->id,
                'total_amount' => $SumaBonosAdditionals,
                'type' => 'Bono Extraordinario'
            ]);
            $tickets[] = $ticket;
        }

        // Desactivar los bonos utilizados
        $user->bonuses()->whereIn('id', $bonusesAvailableAdditionals->pluck('id'))->update([
            'active' => false
        ]);

        // Verificar bono por categoría (una vez al día)
        $ticketsTypeBonusByUser = $user
            ->tickets
            ->where('type', 'Bono Diario')
            ->where('created_at', '>=', now()->startOfDay())
            ->where('created_at', '<=', now()->endOfDay())
            ->first();

        $bonusesAvailableCategoryBonus = $user->categoryBonus;

        if ($bonusesAvailableCategoryBonus && !$ticketsTypeBonusByUser) {
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'totem_id' => $totem->id,
                'total_amount' => $bonusesAvailableCategoryBonus->base_amount,
                'type' => 'Bono Diario'
            ]);
            $tickets[] = $ticket;
        }

        // Verificar bono de cumpleaños (una vez al año)
        $ticketsTypeBirthdayByUser = $user
            ->tickets
            ->where('type', 'Bono Cumpleaños')
            ->where('created_at', '>=', now()->startOfYear())
            ->where('created_at', '<=', now()->endOfYear())
            ->first();

        $isBirthday = false;
        if ($user->birth_date) {
            $birthDate = \Carbon\Carbon::parse($user->birth_date);
            $today = now();
            $isBirthday = ($birthDate->month == $today->month && $birthDate->day == $today->day);
        }

        if (!$ticketsTypeBirthdayByUser && $isBirthday) {
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'totem_id' => $totem->id,
                'total_amount' => $branch->birthday_amount,
                'type' => 'Bono Cumpleaños'
            ]);
            $tickets[] = $ticket;
        }

        // verifica si esta vacio
        if ($tickets === []) {
            return response()->json([
                'message' => 'No tienes bonos disponibles'
            ], 404);
        }

        $this->markFingerprint(new Request([
            'user_id' => $user->id,
            'totem_uuid' => $totem->code,
        ]), true);

        $ticketNumber = Cache::increment('one_shift_ticket_counter', 1);

        return response()->json([
            'data' => [
                'tickets' => collect($tickets)->map(function ($ticket) use ($ticketNumber) {
                    return [
                        'number' => $ticketNumber,
                        'totalAmount' => $ticket->total_amount,
                        'bonusType' => $ticket->type,
                        'createdAt' => $ticket->created_at,
                    ];
                }),
            ],
        ]);
    }

    public function markFingerprint(Request $request, $isMarkPlayer = false)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'totem_uuid' => 'required',
        ]);

        $user = User::find($validated['user_id']);
        $totem = Totem::with('branch')->where('code', $validated['totem_uuid'])->first();
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        if ((string) $user->status_id !== '1') {
            return response()->json([
                'message' => 'El usuario no se encuentra activo'
            ], 409);
        }

        if (!$totem) {
            return response()->json([
                'message' => 'Totem no encontrado'
            ], 404);
        }

        if ($isMarkPlayer === false) {
            // Validar que haya pasado al menos 1 hora desde el último registro en la misma sucursal
            $lastLog = FingerprintLog::query()
                ->whereHas('totem', function ($query) use ($totem) {
                    $query->where('branch_id', $totem->branch_id);
                })
                ->where('user_id', $user->id)
                ->latest()
                ->first();

            if ($lastLog && $lastLog->created_at->diffInMinutes(now()) < 60) {
                $minutesToWait = 60 - $lastLog->created_at->diffInMinutes(now());
                $minutesToWait = intval($minutesToWait);  // Asegura que sea un entero

                return response()->json([
                    'message' => "Debes esperar {$minutesToWait} minutos más para registrar tu huella nuevamente en esta sucursal"
                ], 429);
            }
        }

        $totalLogs = FingerprintLog::where('user_id', $user->id)->count();
        $isEntry = ($totalLogs % 2 === 0);  // Si el total actual es par, el próximo será impar (entrada)

        $fingerprintLog = FingerprintLog::create([
            'user_id' => $user->id,
            'totem_id' => $totem->id,
        ]);

        if ($isMarkPlayer) {
            return;
        }

        return response()->json([
            'message' => __('Huella registrada exitosamente como :attendanceType', ['attendanceType' => $isEntry ? 'Entrada' : 'Salida']),
            'data' => array_merge($fingerprintLog->toArray(), [
                'attendanceType' => $isEntry ? 'Entrada' : 'Salida',
            ])
        ], 201);
    }

    private function validateSchedules($schedules)
    {
        $currentTime = now()->setTimezone('America/Santiago');
        $currentDay = strtolower($currentTime->format('l'));  // Get current day name in lowercase
        $currentTimeStr = $currentTime->format('H:i');

        // Si no hay horarios, retornamos false
        if (empty($schedules)) {
            return false;
        }

        // Si es un string JSON, lo decodificamos
        if (is_string($schedules)) {
            $schedules = json_decode($schedules, true);
        }

        // Verificamos que sea un array válido
        if (!is_array($schedules)) {
            return false;
        }

        // Traducción de días de inglés a español
        $dayTranslation = [
            'monday' => 'lunes',
            'tuesday' => 'martes',
            'wednesday' => 'miércoles',
            'thursday' => 'jueves',
            'friday' => 'viernes',
            'saturday' => 'sábado',
            'sunday' => 'domingo'
        ];

        // Traducir el día actual a español si está en inglés
        if (isset($dayTranslation[$currentDay])) {
            $currentDay = $dayTranslation[$currentDay];
        }

        // Check if current time falls within any of the schedules
        foreach ($schedules as $schedule) {
            if (!isset($schedule['schedules']) || !is_array($schedule['schedules'])) {
                continue;
            }

            // Buscar el horario para el día actual
            $daySchedules = null;
            foreach ($schedule['schedules'] as $ds) {
                if (isset($ds['day']) && strtolower($ds['day']) === $currentDay) {
                    $daySchedules = $ds;
                    break;
                }
            }

            // Verificar si hay times disponibles para el día actual
            if ($daySchedules && isset($daySchedules['times']) && is_array($daySchedules['times'])) {
                // Recorrer los times en lugar de los ranges
                foreach ($daySchedules['times'] as $time) {
                    // Comparar directamente con la hora actual
                    if ($currentTimeStr === $time) {
                        return true;
                    }
                }
            }
            // Si no hay times pero hay ranges, usar el método anterior como fallback
            else if ($daySchedules && isset($daySchedules['ranges']) && is_array($daySchedules['ranges'])) {
                foreach ($daySchedules['ranges'] as $range) {
                    // Ignorar rangos vacíos (00:00 a 00:00)
                    if ($range['start_time'] === '00:00' && $range['end_time'] === '00:00') {
                        continue;
                    }

                    $startTime = $range['start_time'];
                    $endTime = $range['end_time'];

                    // Para el caso de 24:00, usamos una comparación especial
                    if ($endTime === '24:00') {
                        // Si la hora actual es después de la hora de inicio o es 00:00
                        if ($this->isTimeInRange($currentTimeStr, $startTime, '23:59') || $currentTimeStr === '00:00') {
                            return true;
                        }
                    } else if ($this->isTimeInRange($currentTimeStr, $startTime, $endTime)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function isTimeInRange($time, $start, $end)
    {
        // Validar que los parámetros no sean nulos o vacíos
        if (empty($time) || empty($start) || empty($end)) {
            return false;
        }

        // Manejar caso especial de 00:00 (puede ser inicio o fin de día)
        if ($time === '00:00' && $end === '00:00') {
            return true;
        }

        $time = strtotime($time);
        $start = strtotime($start);
        $end = strtotime($end);

        // Si alguna conversión falló, retornar false
        if ($time === false || $start === false || $end === false) {
            return false;
        }

        // Si la hora de fin es menor que la hora de inicio, significa que el rango cruza la medianoche
        if ($end < $start) {
            return $time >= $start || $time <= $end;
        }

        return $time >= $start && $time <= $end;
    }
}
