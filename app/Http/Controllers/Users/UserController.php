<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use App\Models\State;
use App\Models\CategoryBonus;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Bonus;
use App\Models\UserBranches;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $userRoleId = auth()->user()->roles->first()->id;

        $users = User::with(['state', 'roles', 'bonuses', 'categoryBonus', 'branches'])
            ->when($request->username, function ($query, $username) {
                $query->where('username', 'like', "%{$username}%");
            })
            ->whereDoesntHave('roles', function ($query) {
                $query->where('id', 1);
            })
            ->when($request->role, function ($query, $role) {
                $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->when($request->state, function ($query, $state) {
                $query->whereHas('state', function ($q) use ($state) {
                    $q->where('name', $state);
                });
            })
            ->get();

        $roles = Role::where('id', '>', $userRoleId)->get();
        $states = State::where('name', '!=', 'En revisión')->get();
        $branches = Branch::with(['company'])->get()->map(function ($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'company' => $branch->company->id
            ];
        });

        $companies = Company::all()->map(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
            ];
        });

        if ($companies->isEmpty()) {
            abort(403, 'No tienes permiso para acceder a esta página. Debe existir al menos una empresa.');
        }

        $categories = CategoryBonus::all()->map(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
            ];
        });
        $bonuses = Bonus::all()->map(function ($bonus) {
            return [
                'id' => $bonus->id,
                'name' => $bonus->name,
            ];
        });

        if ($categories->isEmpty()) {
            abort(403, 'No tienes permiso para acceder a esta página. Debe existir al menos una categoria.');
        }

        return Inertia::render('Users/index', [
            'users' => $users,
            'roles' => $roles,
            'states' => $states,
            'branches' => $branches,
            'companies' => $companies,
            'categories' => $categories,
            'bonuses' => $bonuses,
            'filters' => $request->only(['username', 'role', 'state']),
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
        
            // Validar si 'phone' no es null antes de la consulta
            if (!is_null($request->phone)) {
                $existingUser = User::where('phone', $request->phone)->first();
                if ($existingUser) {
                    return response()->json(['message' => 'El Número de teléfono ya existe', 'error' => true], 400);
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
            'birth_date' => 'nullable|date',
            'email' => 'nullable|email',
            'nationality' => 'nullable|string',
            'address' => 'nullable|string',
            'marital_status' => 'nullable|string',
            'pension' => 'nullable|string',
            'health' => 'nullable|string',
            'afp' => 'nullable|string',
            'childrens' => 'nullable|string',
            'username' => 'nullable|string|unique:users,username',
            'password' => 'nullable|string',
            'branch_id' => 'nullable|exists:branches,id',
            'state_id' => 'nullable|exists:states,id',
            'category_bonus_id' => 'nullable|exists:category_bonuses,id',
            'role' => 'nullable|exists:roles,name',
            'branches' => 'nullable|array',
            'branches.*' => 'nullable|exists:branches,id',
        ]);


        
        DB::beginTransaction();
        try {
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
                'birth_date' => $request->birth_date,
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
                'state_id' => 1,
                'company_id' => $company ? $company->id : null,
                'category_bonus_id' => $request->category_bonus_id,
            ]);

            
            $user->assignRole($request->role);

            $userId = $user->id;
            if($request->branches) {
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
            return response()->json(['error' => true, 'message' => 'Error al crear el usuario', 'details' => $e], 500);
        }

        return response()->json([
            'error' => false,
            'message' => 'Usuario creado exitosamente',
        ]);
    }


    public function update(Request $request, User $user)
    {
        // Obtener el ID del rol del usuario autenticado
        $userRoleId = auth()->user()->roles->first()->id;

        // Verificar que el rol del usuario a eliminar no sea mayor o igual al rol del usuario autenticado
        $userRoleIdToUpdate = $user->roles->first()->id;

        if ($userRoleIdToUpdate <= $userRoleId) {
            return response()->json([
                'error' => true,
                'message' => 'No tienes permiso para editar usuarios con roles superiores o iguales.',
            ], 403);
        }

        try {
            $existingUser = User::where('username', $request->username)
                                ->where('id', '!=', $user->id)  // Aquí está la corrección
                                ->first();
            if ($existingUser) {
                return response()->json(['message' => 'El nombre de usuario ya existe', 'error' => true], 400);
            }
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error al verificar el nombre de usuario', 'error' => true], 500);
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
                    return response()->json(['message' => 'El Número de teléfono ya existe', 'error' => true], 400);
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
            'birth_date' => 'nullable|date',
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
            'branch_id' => 'nullable|exists:branches,id',
            'state_id' => 'required|exists:states,id',
            'company_id' => 'nullable|exists:companies,id',
            'category_bonus_id' => 'nullable|exists:category_bonuses,id',
            'role' => 'nullable|string|exists:roles,name',
            'branches' => 'nullable|array',
            'branches.*' => 'nullable|exists:branches,id',
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
            'birth_date' => $request->birth_date,
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
            'state_id' => $request->state_id,
            'category_bonus_id' => $request->category_bonus_id,
        ]);

        $user->syncRoles([$validatedData['role']]);

        return response()->json([
            'error' => false,
            'message' => 'Usuario actualizado exitosamente',
        ]);
    }

    public function destroy(User $user)
    {
        // Obtener el ID del rol del usuario autenticado
        $userRoleId = auth()->user()->roles->first()->id;

        // Verificar que el usuario no se esté eliminando a sí mismo
        if ($user->id === auth()->id()) {
            return response()->json([
                'error' => true,
                'message' => 'No puedes eliminarte a ti mismo.',
            ], 403);
        }

        // Verificar que el rol del usuario a eliminar no sea mayor o igual al rol del usuario autenticado
        $userRoleIdToDelete = $user->roles->first()->id;

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
                    UserBonus::create([
                        'user_id' => $userId,
                        'bonus_id' => $bonusId,
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

}
