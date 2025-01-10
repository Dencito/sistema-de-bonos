<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use App\Services\EncryptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        try {
            $encryptedPassword = $request->password;

            Log::info('password encriptada recibida: ' . $encryptedPassword);

            $decryptedPassword = EncryptionService::decryptPassword($encryptedPassword);

            Log::info('password desencriptada: ' . $decryptedPassword);

            $user = User::where('username', $request->login)->first();

            Log::info('username: ' . $request->login);

            if (!$user || !Hash::check($decryptedPassword, $user->password)) {
                throw new \Exception('Las credenciales no son correctas');
            }

            Auth::login($user);
            $request->session()->regenerate();

            if ($user->status_id !== 1) {
                Auth::logout();
                throw new \Exception('Tu cuenta fue bloqueada o se encuentra eliminada.');
            }

            if ($user->hasAnyRole(6)) {
                Auth::logout();
                throw new \Exception('Tu cuenta no tiene permisos para acceder a la plataforma.');
            }

            return redirect()->intended(route('dashboard'));
        } catch (\Exception $e) {
            return back()->withErrors([
                'email' => $e->getMessage(),
            ])->onlyInput('email');
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
