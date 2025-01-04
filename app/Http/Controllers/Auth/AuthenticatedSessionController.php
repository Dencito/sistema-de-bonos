<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

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
            // Aquí automáticamente buscará en la tabla con el prefijo correcto
            // Por ejemplo: empresa1_users si el subdominio es empresa1
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                throw new \Exception('Usuario no encontrado en esta empresa');
            }

            $request->authenticate();
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
