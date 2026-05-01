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
use App\Models\User;
use App\Models\UserBranches;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Construir la consulta base
        $query = User::with([
            'status', 
            'role', 
            'bonuses', 
            'categoryBonus', 
            'branches', 
            'branch',
            'fingerprintLogs' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(1);
            }
        ])
            ->when($request->search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    // Buscar en múltiples campos
                    $q->where('username', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('second_name', 'like', "%{$search}%")
                      ->orWhere('first_last_name', 'like', "%{$search}%")
                      ->orWhere('second_last_name', 'like', "%{$search}%")
                      ->orWhere('rutNumbers', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
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
            ->when($request->branch_id, function ($query, $branchId) {
                $query->where(function($q) use ($branchId) {
                    // Para usuarios con branch_id directo
                    $q->where('branch_id', $branchId)
                    // O para usuarios con relación many-to-many con branches
                    ->orWhereHas('branches', function($subq) use ($branchId) {
                        $subq->where('branch_id', $branchId);
                    });
                });
            })
            ->select(
                'id',
                'first_name',
                'second_name',
                'first_last_name',
                'second_last_name',
                'prefix',
                'phone',
                'rutNumbers',
                'rutDv',
                'code',
                'birth_date',
                'entry_date',
                'has_fingerprint',
                'email',
                'nationality',
                'address',
                'marital_status',
                'pension',
                'health',
                'afp',
                'childrens',
                'username',
                'password',
                'branch_id',
                'status_id',
                'company_id',
                'category_bonus_id',
                'role_id',
                'cargo',
                'levels',
                'fingerprints'
            )
            ->orderBy('created_at', 'desc');
        
        // Implementar paginación
        $perPage = $request->input('per_page', 10); // Por defecto 10 registros por página
        $users = $query->paginate($perPage);

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
            'filters' => $request->only(['username', 'status', 'role', 'branch_id', 'per_page', 'page']),
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
            'cargo' => 'nullable|string',
            'levels' => 'nullable',
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
                'cargo' => $request->cargo,
                'levels' => $request->levels,
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
            'cargo' => 'nullable|string',
            'levels' => 'nullable|array',
        ]);

        $user->update([
            'first_name' => $request->first_name ?? $user->first_name,
            'second_name' => $request->second_name ?? $user->second_name,
            'first_last_name' => $request->first_last_name ?? $user->first_last_name,
            'second_last_name' => $request->second_last_name ?? $user->second_last_name,
            'prefix' => $request->prefix ?? $user->prefix,
            'phone' => $request->phone ?? $user->phone,
            'rutNumbers' => $request->rutNumbers ?? $user->rutNumbers,
            'rutDv' => $request->rutDv ?? $user->rutDv,
            'code' => $request->code ?? $user->code,
            'birth_date' => $request->birth_date ?? $user->birth_date,
            'entry_date' => $request->entry_date ?? $user->entry_date,
            'has_fingerprint' => $request->filled('has_fingerprint') ? $request->has_fingerprint : $user->has_fingerprint,
            'email' => $request->email ?? $user->email,
            'nationality' => $request->nationality ?? $user->nationality,
            'address' => $request->address ?? $user->address,
            'marital_status' => $request->marital_status ?? $user->marital_status,
            'pension' => $request->pension ?? $user->pension,
            'health' => $request->health ?? $user->health,
            'afp' => $request->afp ?? $user->afp,
            'childrens' => $request->childrens ?? $user->childrens,
            'username' => $request->username ?? $user->username,
            'password' => $request->password ? $request->password : null,
            'branch_id' => $request->branch_id ?? $user->branch_id,
            'status_id' => $request->status_id ?? $user->status_id,
            'category_bonus_id' => $request->category_bonus_id ?? $user->category_bonus_id,
            'role_id' => $request->role_id ?? $user->role_id,
            'cargo' => $request->cargo ?? $user->cargo,
            'levels' => $request->levels ?? $user->levels,
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

    /**
     * Eliminar las huellas de un usuario y marcar has_fingerprint = false.
     */
    public function clearFingerprints(User $user)
    {
        $user->fingerprints = null;
        $user->has_fingerprint = false;
        $user->save();

        if (in_array($user->role_id, [5, 6])) {
            cache()->forget('fingerprints_by_role_' . implode('_', [5, 6]));
        }

        return response()->json([
            'error' => false,
            'message' => 'Huellas eliminadas correctamente',
            'data' => [
                'id' => $user->id,
                'has_fingerprint' => false,
                'fingerprints' => null,
            ],
        ]);
    }

    public function searchPlayers(Request $request)
    {
        $query = User::where('role_id', 6)->with(['role:id,name', 'status:id,name', 'branches', 'categoryBonus']);

        if ($request->filled('branch_id')) {
            $branchId = $request->branch_id;
            $query->whereHas('branches', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        if ($request->filled('category_bonus_id')) {
            $query->where('category_bonus_id', $request->category_bonus_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('username', 'LIKE', "%{$search}%")
                  ->orWhere('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('first_last_name', 'LIKE', "%{$search}%")
                  ->orWhere('rutNumbers', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->limit(100)->get();

        return response()->json([
            'success' => true,
            'users' => $users
        ]);
    }

    public function assignMultipleBranches(Request $request)
    {
        // Validar los datos de la solicitud
        $validated = $request->validate([
            'user_id' => 'required',
            'branches' => 'required|array',
            'branches.*' => 'required',
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
            'fingerprints' => 'required|array',
            'fingerprints.*.data' => 'required|string',
        ]);

        $updated = User::where(function ($query) use ($request) {
            $query
                ->where('rutNumbers', $request->rutOrCode)
                ->orWhere('code', $request->rutOrCode);
        })
            ->whereIn('role_id', [5, 6])
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

    public function getFingerprintsByRole($branchId)
    {

        $branch = Branch::find($branchId);

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
                    // Para trabajadores (role_id = 5) buscar en la relación branches
                    ->orWhere(function ($q) use ($branch) {
                        $q
                            ->where('role_id', 5)
                            ->whereHas('branches', function ($q) use ($branch) {
                                $q->where('branch_id', $branch->id);
                            });
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

    public function getBonusesAvailablesUserById($id, $branchId)
    {
        $user = User::with([
            'bonuses',
            'categoryBonus',
            'branches:id,company_id',
            'branches.company',
            'branches.shifts',
            'status',
            'role',
            'tickets',
            'bonuses',
            'fingerprintLogs',
        ])
        ->select(
            'id',
            'first_name',
            'second_name',
            'first_last_name',
            'second_last_name',
            'prefix',
            'phone',
            'rutNumbers',
            'rutDv',
            'code',
            'birth_date',
            'entry_date',
            'has_fingerprint',
            'email',
            'nationality',
            'address',
            'marital_status',
            'pension',
            'health',
            'afp',
            'childrens',
            'username',
            'password',
            'branch_id',
            'status_id',
            'company_id',
            'category_bonus_id',
            'role_id',
            'cargo',
            'levels',
        )
        ->find($id);


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

        // Obtener la sucursal directamente desde la BD
        $branch = Branch::find($branchId);

        if (!$branch) {
            return response()->json([
                'message' => 'La sucursal no fue encontrada en nuestros registros.'
            ], 404);
        }

        // Verificar que el usuario tenga acceso a la sucursal
        $userHasAccess = $user->branches()->where('branch_id', $branchId)->exists();
        
        if (!$userHasAccess) {
            return response()->json([
                'message' => 'El usuario no tiene acceso a esta sucursal.'
            ], 403);
        }

        // Validar available_schedules
        $available_schedules = null;
        if (isset($branch->available_schedules) && !empty($branch->available_schedules)) {
            $available_schedules = is_string($branch->available_schedules) ? json_decode($branch->available_schedules, true) : $branch->available_schedules;
        }

        $validateSchedules = $this->validateSchedules($available_schedules);
        if (!$validateSchedules) {
            return response()->json([
                'message' => 'La sucursal no se encuentra activa en este horario'
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

        $now = now();
        
        DB::beginTransaction();
        
        try {
        
        $bonusesAvailableAdditionals = $user->bonuses->filter(function($bonus) use ($now) {
            // Check if bonus is active
            if (!$bonus->active) {
                return false;
            }
            
            // Check if current time is after start_datetime (if set)
            if ($bonus->start_datetime && $now->lt($bonus->start_datetime)) {
                return false;
            }
            
            // Check if current time is before end_datetime (if set)
            if ($bonus->end_datetime && $now->gt($bonus->end_datetime)) {
                return false;
            }
            
            return true;
        });

        foreach ($bonusesAvailableAdditionals as $bonus) {
            $SumaBonosAdditionals += $bonus->amount;
        }

        if ($SumaBonosAdditionals > 0) {
            $branch->ticketNumber = $branch->ticketNumber + 1;
            $branch->save();
            
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'total_amount' => $SumaBonosAdditionals,
                'type' => 'Bono Extraordinario',
            ]);
            $ticket->ticket_number = $branch->ticketNumber;
            $tickets[] = $ticket;
        }

        // Desactivar los bonos utilizados
        $user->bonuses()->whereIn('id', $bonusesAvailableAdditionals->pluck('id'))->update([
            'active' => false
        ]);

        // Verificar bono diario (una vez al día, considerando turnos nocturnos)
        $currentHour = $now->hour;
        
        // Si es madrugada (00:00 - 06:00), verificar desde las 06:00 del día anterior
        // para evitar bonos del mismo turno nocturno
        if ($currentHour >= 0 && $currentHour < 6) {
            $startTime = $now->copy()->subDay()->setTime(6, 0, 0);
        } else {
            // Horario normal: verificar desde las 06:00 del día actual
            $startTime = $now->copy()->setTime(6, 0, 0);
        }
        
        $ticketsTypeBonusByUser = Ticket::where('user_id', $user->id)
            ->where('type', 'Bono Diario')
            ->where('created_at', '>=', $startTime)
            ->lockForUpdate()
            ->first();

        $bonusesAvailableCategoryBonus = $user->categoryBonus;
        
        if ($bonusesAvailableCategoryBonus && !$ticketsTypeBonusByUser) {
            $branch->ticketNumber = $branch->ticketNumber + 1;
            $branch->save();
                                                        
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'total_amount' => $bonusesAvailableCategoryBonus->base_amount,
                'type' => 'Bono Diario',
            ]);
            $ticket->ticket_number = $branch->ticketNumber;
            $tickets[] = $ticket;
        }

        // Verificar bono de cumpleaños (una vez al año)
        // FIXED: Consultar directamente a la BD en lugar de usar relación cargada
        // lockForUpdate() previene race conditions
        $ticketsTypeBirthdayByUser = Ticket::where('user_id', $user->id)
            ->where('type', 'Bono Cumpleaños')
            ->where('created_at', '>=', now()->startOfYear())
            ->where('created_at', '<=', now()->endOfYear())
            ->lockForUpdate()
            ->first();

        $isBirthday = false;
        if ($user->birth_date) {
            $birthDate = \Carbon\Carbon::parse($user->birth_date);
            $today = now();
            $isBirthday = ($birthDate->month == $today->month && $birthDate->day == $today->day);
        }


        if (!$ticketsTypeBirthdayByUser && $isBirthday) {
            $branch->ticketNumber = $branch->ticketNumber + 1;
            $branch->save();
            
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'total_amount' => $branch->birthday_amount,
                'type' => 'Bono Cumpleaños',
            ]);

            $ticket->ticket_number = $branch->ticketNumber;
            $tickets[] = $ticket;
        }

        // verifica si esta vacio
        if ($tickets === []) {
            DB::rollBack();
            return response()->json([
                'message' => 'No tienes bonos disponibles'
            ], 409);
        }

        Log::info('Llamando a markFingerprint para jugador', [
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'tickets_count' => count($tickets),
        ]);

        $fingerprintResult = $this->markFingerprint(new Request([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
        ]), true);

        Log::info('Resultado de markFingerprint', [
            'result' => $fingerprintResult ? $fingerprintResult->toArray() : null,
        ]);

        // Confirmar la transacción si todo salió bien
        DB::commit();

        return response()->json([
            'data' => [
                'tickets' => collect($tickets)->map(function ($ticket) {
                    return [
                        'totalAmount' => $ticket->total_amount,
                        'type' => $ticket->type,
                        'createdAt' => $ticket->created_at,
                        'ticketNumber' => $ticket->ticket_number,
                    ];
                }),
            ],
        ]);
        
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al generar tickets de bonos', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error al procesar los bonos. Por favor intente nuevamente.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markFingerprint(Request $request, $isMarkPlayer = false)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'branch_id' => 'required',
        ]);

        $user = User::select('id', 'first_name', 'second_name', 'first_last_name', 'second_last_name', 'email', 'role_id', 'branch_id', 'status_id', 'cargo', 'levels')
            ->find($validated['user_id']);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Obtener la sucursal desde el parámetro validado
        $branch = Branch::find($validated['branch_id']);

        if (!$branch) {
            return response()->json([
                'message' => 'La sucursal no fue encontrada'
            ], 404);
        }

        if ((string) $user->status_id !== '1') {
            return response()->json([
                'message' => 'El usuario no se encuentra activo'
            ], 409);
        }

        if ($isMarkPlayer === false) {
            // Validar que haya pasado al menos 1 hora desde el último registro en la misma sucursal
            $lastLog = FingerprintLog::query()
                ->where('branch_id', $branch->id)
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

        $totalLogs = FingerprintLog::where('user_id', $user->id)
            ->where('branch_id', $branch->id)
            ->count();
        $isEntry = ($totalLogs % 2 === 0);  // Si el total actual es par, el próximo será impar (entrada)

        // Validación para cajeros y pasilleras: no pueden registrar salida si tienen turno activo
        if (!$isEntry && in_array($user->cargo, ['CAJER@', 'PASILLER@'])) {
            if ($user->cargo === 'CAJER@') {
                // Verificar si tiene un turno de caja activo
                $activeCashShift = \App\Models\CashShift::where('user_id', $user->id)
                    ->where('branch_id', $branch->id)
                    ->where('is_active', true)
                    ->first();

                if ($activeCashShift) {
                    return response()->json([
                        'message' => 'No puedes registrar tu salida hasta que cierres tu caja. Por favor, finaliza tu turno primero.'
                    ], 400);
                }
            } elseif ($user->cargo === 'PASILLER@') {
                // Verificar si tiene una pasillera activa
                $activePasillera = \App\Models\Pasillera::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->first();

                if ($activePasillera) {
                    return response()->json([
                        'message' => 'No puedes registrar tu salida hasta que finalices tu turno como pasillera y devuelvas el saldo correspondiente.'
                    ], 400);
                }
            }
        }

        $fingerprintLog = FingerprintLog::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
        ]);

        Log::info('FingerprintLog creado', [
            'fingerprint_log_id' => $fingerprintLog->id,
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'isMarkPlayer' => $isMarkPlayer,
            'created_at' => $fingerprintLog->created_at,
        ]);

        if ($isMarkPlayer) {
            Log::info('Es jugador, retornando sin incrementar ticket');
            return $fingerprintLog;
        }

        $branch->ticketNumber = $branch->ticketNumber + 1;
        $branch->save();

        return response()->json([
            'message' => __('Huella registrada exitosamente como :attendanceType', ['attendanceType' => $isEntry ? 'Entrada' : 'Salida']),
            'data' => array_merge($fingerprintLog->toArray(), [
                'attendanceType' => $isEntry ? 'Entrada' : 'Salida',
                'ticketNumber' => $branch->ticketNumber,
            ])
        ], 201);
    }

    private function validateSchedules($schedules)
    {
        $currentTime = now()->setTimezone('America/Santiago');
        $currentDay = strtolower($currentTime->format('l'));
        $currentTimeStr = $currentTime->format('H:i');

        // Si no hay horarios, retornamos true (sin restricciones)
        if (empty($schedules)) {
            return true;
        }

        // Si es un string JSON, lo decodificamos
        if (is_string($schedules)) {
            $schedules = json_decode($schedules, true);
        }

        // Verificamos que sea un array válido
        if (!is_array($schedules)) {
            return true;
        }

        // Traducción de días de inglés a español
        $dayTranslation = [
            'monday' => 'lunes',
            'tuesday' => 'martes',
            'wednesday' => 'miercoles',
            'thursday' => 'jueves',
            'friday' => 'viernes',
            'saturday' => 'sabado',
            'sunday' => 'domingo'
        ];

        // Traducir el día actual a español si está en inglés
        if (isset($dayTranslation[$currentDay])) {
            $currentDay = $dayTranslation[$currentDay];
        }

        // Check if current time falls within any of the schedules
        foreach ($schedules as $scheduleIndex => $schedule) {
            if (!isset($schedule['schedules']) || !is_array($schedule['schedules'])) {
                continue;
            }

            // Buscar el horario para el día actual
            $daySchedules = null;
            foreach ($schedule['schedules'] as $ds) {
                if (isset($ds['day']) && strtolower($ds['day']) === strtolower($currentDay)) {
                    $daySchedules = $ds;
                    break;
                }
            }

            if (!$daySchedules) {
                continue;
            }

            // Verificar usando ranges (más eficiente y confiable)
            if (isset($daySchedules['ranges']) && is_array($daySchedules['ranges'])) {
                foreach ($daySchedules['ranges'] as $range) {
                    if (!isset($range['start_time']) || !isset($range['end_time'])) {
                        continue;
                    }

                    $startTime = $range['start_time'];
                    $endTime = $range['end_time'];

                    // Caso especial: 00:00 a 24:00 significa todo el día
                    if ($startTime === '00:00' && ($endTime === '24:00' || $endTime === '23:59')) {
                        return true;
                    }

                    // Normalizar 24:00 a 23:59
                    if ($endTime === '24:00') {
                        $endTime = '23:59';
                    }

                    // Verificar si el tiempo actual está en el rango
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
    
    /**
     * Obtiene los registros de huella filtrados por turno
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFingerprintLogsByShift(Request $request)
    {
        $request->validate([
            'shift_id' => 'nullable|exists:shifts,id',
            'branch_id' => 'nullable|exists:branches,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'user_id' => 'nullable|exists:users,id',
        ]);
        
        $user = auth()->user();
        
        // Verificar permisos - solo roles administrativos pueden ver todos los registros
        if (!in_array($user->role_id, [1, 2, 3, 4])) { // duenio, super-admin, admin, supervisor
            return response()->json([
                'message' => 'No tienes permisos para ver estos registros',
                'error' => true
            ], 403);
        }
        
        $query = FingerprintLog::with([
                'user' => function($q) {
                    $q->select('id', 'first_name', 'second_name', 'first_last_name', 'second_last_name', 'role_id');
                },
                'user.role:id,name',
                'branch:id,name'
            ]);
        
        // Filtrar por turno específico
        if ($request->filled('shift_id')) {
            $shift = ShiftRecord::findOrFail($request->shift_id);
            $query->whereBetween('created_at', [$shift->opening_time, $shift->closing_time ?? now()]);
        }
        
        // Filtrar por sucursal
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        // Filtrar por rango de fechas
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($request->filled('start_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $query->whereDate('created_at', '>=', $startDate);
        } elseif ($request->filled('end_date')) {
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $query->whereDate('created_at', '<=', $endDate);
        }
        
        // Filtrar por usuario específico
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Obtener los registros ordenados por fecha
        $fingerprintLogs = $query->orderBy('created_at', 'desc')->get();
        
        // Procesar los registros para determinar si son entradas o salidas
        $processedLogs = $fingerprintLogs->map(function ($log, $index) use ($fingerprintLogs) {
            $isEntry = true;
            
            // Contar registros anteriores del mismo usuario para determinar si es entrada o salida
            $previousLogs = $fingerprintLogs->where('user_id', $log->user_id)
                ->where('created_at', '<', $log->created_at)
                ->count();
            
            $isEntry = ($previousLogs % 2 === 0);
            
            return [
                'id' => $log->id,
                'user' => [
                    'id' => $log->user->id,
                    'name' => trim($log->user->first_name . ' ' . ($log->user->second_name ?? '') . ' ' . 
                           $log->user->first_last_name . ' ' . ($log->user->second_last_name ?? '')),
                    'role' => $log->user->role->name ?? null
                ],
                'branch' => $log->branch->name ?? 'N/A',
                'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                'type' => $isEntry ? 'Entrada' : 'Salida',
            ];
        });
        
        return response()->json([
            'error' => false,
            'data' => $processedLogs
        ]);
    }
    
    /**
     * Genera un reporte de trabajadores con sus datos personales y registros de entrada/salida
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getWorkersReport(Request $request)
    {
        $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'role_id' => 'nullable|exists:roles,id',
        ]);
        
        $user = auth()->user();
        
        // Verificar permisos - solo roles administrativos pueden ver todos los registros
        if (!in_array($user->role_id, [1, 2, 3, 4])) { // duenio, super-admin, admin, supervisor
            return response()->json([
                'message' => 'No tienes permisos para ver estos registros',
                'error' => true
            ], 403);
        }
        
        // Consulta base para obtener trabajadores
        $query = User::with(['role:id,name', 'branch:id,name'])
            ->where('role_id', $request->filled('role_id') ? $request->role_id : 5); // Por defecto, mostrar trabajadores (role_id = 5)
        
        // Filtrar por sucursal
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        // Obtener los trabajadores
        $workers = $query->get();
        
        // Preparar fechas para filtrar los registros de huella
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();
        
        // Procesar cada trabajador para incluir sus registros de entrada/salida
        $workersReport = $workers->map(function ($worker) use ($startDate, $endDate) {
            // Obtener registros de huella del trabajador en el rango de fechas
            $fingerprintLogs = FingerprintLog::with(['branch:id,name'])
                ->where('user_id', $worker->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'asc')
                ->get();
            
            // Procesar los registros para determinar entradas y salidas
            $attendanceRecords = [];
            $currentEntry = null;
            
            foreach ($fingerprintLogs as $index => $log) {
                $isEntry = ($index % 2 === 0);
                
                if ($isEntry) {
                    // Es una entrada
                    $currentEntry = [
                        'entry_time' => $log->created_at->format('Y-m-d H:i:s'),
                        'entry_branch' => $log->branch->name ?? 'N/A',
                        'exit_time' => null,
                        'exit_branch' => null,
                        'duration' => null
                    ];
                } else {
                    // Es una salida
                    if ($currentEntry) {
                        $currentEntry['exit_time'] = $log->created_at->format('Y-m-d H:i:s');
                        $currentEntry['exit_branch'] = $log->branch->name ?? 'N/A';
                        
                        // Calcular duración
                        $entryTime = Carbon::parse($currentEntry['entry_time']);
                        $exitTime = Carbon::parse($currentEntry['exit_time']);
                        $duration = $entryTime->diffInMinutes($exitTime);
                        $hours = floor($duration / 60);
                        $minutes = $duration % 60;
                        $currentEntry['duration'] = sprintf('%02d:%02d', $hours, $minutes);
                        
                        $attendanceRecords[] = $currentEntry;
                        $currentEntry = null;
                    }
                }
            }
            
            // Si hay una entrada sin salida correspondiente
            if ($currentEntry) {
                $attendanceRecords[] = $currentEntry;
            }
            
            return [
                'id' => $worker->id,
                'first_name' => $worker->first_name,
                'second_name' => $worker->second_name,
                'first_last_name' => $worker->first_last_name,
                'second_last_name' => $worker->second_last_name,
                'full_name' => trim($worker->first_name . ' ' . ($worker->second_name ?? '') . ' ' . 
                               $worker->first_last_name . ' ' . ($worker->second_last_name ?? '')),
                'role' => $worker->role->name ?? 'N/A',
                'branch' => $worker->branch->name ?? 'N/A',
                'attendance_records' => $attendanceRecords,
                'total_entries' => count($attendanceRecords),
                'total_hours' => $this->calculateTotalHours($attendanceRecords)
            ];
        });
        
        return response()->json([
            'error' => false,
            'data' => $workersReport,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'role_id' => $request->role_id ?? 5,
                'branch_id' => $request->branch_id ?? null
            ]
        ]);
    }
    
    /**
     * Calcula el total de horas trabajadas a partir de los registros de asistencia
     * 
     * @param array $attendanceRecords
     * @return string
     */
    private function calculateTotalHours($attendanceRecords)
    {
        $totalMinutes = 0;
        
        foreach ($attendanceRecords as $record) {
            if ($record['duration']) {
                list($hours, $minutes) = explode(':', $record['duration']);
                $totalMinutes += ($hours * 60) + $minutes;
            }
        }
        
        $hours = floor($totalMinutes / 60);
        $minutes = $totalMinutes % 60;
        
        return sprintf('%02d:%02d', $hours, $minutes);
    }
    
    /**
     * Export users data for Excel export
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function export(Request $request)
    {
        // Log the received parameters for debugging
        \Log::info('Users export parameters:', $request->all());
        
        $query = User::with(['status', 'role', 'bonuses', 'categoryBonus', 'branches', 'branch'])
            ->when($request->search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('username', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('second_name', 'like', "%{$search}%")
                      ->orWhere('first_last_name', 'like', "%{$search}%")
                      ->orWhere('second_last_name', 'like', "%{$search}%")
                      ->orWhere('rutNumbers', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
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
            ->when($request->branch_id, function ($query, $branchId) {
                $query->where(function($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                    ->orWhereHas('branches', function($subq) use ($branchId) {
                        $subq->where('branch_id', $branchId);
                    });
                });
            });
        
        // Obtener todos los usuarios sin paginación
        $users = $query->orderBy('created_at', 'desc')->get();
        
        // Calcular estadísticas para el resumen
        $totalUsers = $users->count();
        
        // Agrupar por rol
        $byRole = $users->groupBy(function($user) {
            return $user->role ? $user->role->name : 'Sin rol';
        })->map(function ($group) {
            return [
                'total' => $group->count()
            ];
        });
        
        // Agrupar por estado
        $byStatus = $users->groupBy(function($user) {
            return $user->status ? $user->status->name : 'Sin estado';
        })->map(function ($group) {
            return [
                'total' => $group->count()
            ];
        });
        
        // Agrupar por sucursal
        $byBranch = $users->groupBy(function($user) {
            return $user->branch ? $user->branch->name : 'Sin sucursal';
        })->map(function ($group) {
            return [
                'total' => $group->count()
            ];
        });
        
        // Preparar resumen
        $summary = [
            'total_users' => $totalUsers,
            'by_role' => $byRole,
            'by_status' => $byStatus,
            'by_branch' => $byBranch
        ];
        
        return response()->json([
            'users' => $users,
            'summary' => $summary,
            'filters' => $request->only(['search', 'role', 'status', 'branch_id'])
        ]);
    }

    public function filterUsersByBonus(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'bonus_count' => 'required|integer|min:1',
            'bonus_type' => 'required|in:daily,all'
        ]);
        
        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();
        $bonusCount = $request->bonus_count;
        $bonusType = $request->bonus_type;
        

        
        try {
            // Consulta base para obtener usuarios con rol de jugador
            $query = User::with([
                    'role:id,name', 
                    'status:id,name', 
                    'branches',
                    'tickets' => function($q) use ($startDate, $endDate, $bonusType) {
                        $q->whereBetween('created_at', [$startDate, $endDate]);
                        if ($bonusType === 'daily') {
                            $q->where('type', 'Bono Diario');
                        }
                    },
                    'fingerprintLogs' => function($q) {
                        $q->orderBy('created_at', 'desc')->limit(1);
                    }
                ])
                ->where('role_id', 6) // Jugadores
                ->where('status_id', 1); // Activos
            
            // Obtener usuarios
            $users = $query->get();
            
            // Filtrar usuarios que tengan la cantidad especificada de bonos o más
            $filteredUsers = $users->filter(function($user) use ($bonusCount) {
                return count($user->tickets) >= $bonusCount;
            });
            
            // Agregar contador de bonos diarios para cada usuario
            $usersWithBonusCount = $filteredUsers->map(function($user) {
                $user->daily_bonuses_count = count($user->tickets);
                return $user;
            });
            
            return response()->json([
                'success' => true,
                'error' => false,
                'users' => $usersWithBonusCount->values()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en filterUsersByBonus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => true,
                'message' => 'Error al filtrar usuarios: ' . $e->getMessage()
            ], 500);
        }
    }
}
