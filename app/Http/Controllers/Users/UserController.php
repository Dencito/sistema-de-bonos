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

        return Inertia::render('Users/Index', [
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
            $existingUser = User::where('username', $request->username)
                                ->first();
            if ($existingUser) {
                return response()->json(['message' => 'El nombre de usuario ya existe', 'error' => true], 400);
            }
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error al verificar el nombre de usuario', 'error' => true], 500);
        }

        try {
            $existingUser = User::where('email', $request->username)
                                ->first();
            if ($existingUser) {
                return response()->json(['message' => 'El correo electrónico ya existe', 'error' => true], 400);
            }
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error al verificar el nombre de usuario', 'error' => true], 500);
        }

        $request->validate([
            'username' => 'required|string|unique:users,username',
            'email' => 'nullable',
            'password' => 'required|string',
            'role' => 'required|string|exists:roles,name',
            'phone' => 'string',
            'state_id' => 'required|exists:states,id',
            'branch_id' => 'required|exists:branches,id',
            'company_id' => 'required|exists:companies,id',
            'branches' => 'required|array',
            'branches.*' => 'exists:branches,id',
        ]);

        
        DB::beginTransaction();
        try {
            // Comenzar una transacción para asegurar atomicidad
            $user = User::create([
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'state_id' => $request->state_id,
                'branch_id' => $request->branch_id,
                'company_id' => $request->company_id,
            ]);
            
            $user->assignRole($request->role);

            $userId = $user->id;
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

        $validatedData = $request->validate([
            'username' => 'required|string',
            'email' => 'nullable|email',
            'password' => 'nullable|string',
            'role' => 'required|string|exists:roles,name',
            'phone' => 'nullable|string',
            'state_id' => 'required',
            'branch_id' => 'required',
        ]);

        $user->update([
            'username' => $validatedData['username'],
            'email' => $validatedData['email'],
            'password' => $request->filled('password') ? Hash::make($validatedData['password']) : $user->password,
            'phone' => $validatedData['phone'],
            'state_id' => $validatedData['state_id'],
            'branch_id' => $validatedData['branch_id'],
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
