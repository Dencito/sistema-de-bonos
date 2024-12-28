<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', Rule::unique('users')],
            'password' => ['required'],
            'role' => ['required', 'string', Rule::exists('roles', 'name')],
        ]);

        try {
            DB::beginTransaction();

            $role = Role::where('name', $request->role)->first();
            if (!$role) {
                DB::rollBack();
                return response()->json(['message' => 'Rol no válido', 'error' => true], 400);
            }

            $user = User::create([
                'first_name' => $request->first_name,
                'second_name' => $request->second_name,
                'first_last_name' => $request->first_last_name,
                'second_last_name' => $request->second_last_name,
                'phone' => $request->phone,
                'rut' => $request->rut,
                'birth_date' => $request->birth_date,
                'email' => $request->email,
                'nationality' => $request->nationality,
                'address' => $request->address,
                'marital_status' => $request->marital_status,
                'pension' => $request->pension,
                'health' => $request->health,
                'afp' => $request->afp,
                'children' => $request->children,
                'company_entry_date' => $request->company_entry_date,
                'username' => $request->username,
                'password' => bcrypt($request->password),
                'branch_id' => $request->branch_id,
                'status_id' => 1,
                'role_id' => $role->id,
            ]);

            DB::commit();

            if(!$user) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Error al crear el usuario',
                    'status' => 500,
                ], 500);
            }
            
            $data = [
                'user' => $user,
                'status' => 201,
            ];
            
            //event(new Registered($user));
            Auth::login($user);
            redirect(route('dashboard', absolute: false));
            //return response()->json($data, 500);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear el usuario',
                'error' => true,
                'details' => $e->getMessage()
            ], 500);
        }
    }

    protected function getUserByUsername($username) {
        $user = User::where('username', $username)->firstOrFail();
        return $user;
    }
}
