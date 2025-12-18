<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MobileAuthController extends Controller
{
    /**
     * Login for mobile app
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required',
            'device_name' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Check if user is active
        if ($user->status_id != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta está inactiva. Contacta al administrador.'
            ], 403);
        }

        // Check if user has trabajador role (role_id 5 or 6)
        if (!in_array($user->role_id, [5, 6])) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a la aplicación móvil.'
            ], 403);
        }

        // Create token
        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name . ' ' . ($user->second_last_name ?? '')),
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'branch_id' => $user->branch_id,
                ],
                'token' => $token,
            ]
        ]);
    }

    /**
     * Logout from mobile app
     */
    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente'
        ]);
    }

    /**
     * Get authenticated user info
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name . ' ' . ($user->second_last_name ?? '')),
                'email' => $user->email,
                'role_id' => $user->role_id,
                'branch_id' => $user->branch_id,
                'status_id' => $user->status_id,
            ]
        ]);
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string',
        ]);

        $user = $request->user();

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Create new token
        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token renovado correctamente',
            'data' => [
                'token' => $token,
            ]
        ]);
    }
}
