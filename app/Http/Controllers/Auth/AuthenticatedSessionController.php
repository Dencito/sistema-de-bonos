<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
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
        Log::info('Inicio de autenticación', ['request_data' => $request->only(['login', 'remember'])]);
        
        try {
            Log::info('Intentando autenticar usuario');
            $request->authenticate();
            Log::info('Usuario autenticado correctamente');

            Log::info('Regenerando sesión');
            $request->session()->regenerate();
            Log::info('Sesión regenerada correctamente', ['session_id' => $request->session()->getId()]);

            // Verificar estado del usuario
            $user = Auth::user();
            Log::info('Usuario autenticado', ['user_id' => $user->id, 'username' => $user->username, 'status_id' => $user->status_id]);
            
            if ((string)$user->status_id !== '1') {
                Log::warning('Usuario bloqueado o eliminado', ['user_id' => $user->id, 'status_id' => $user->status_id]);
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                return back()->withErrors([
                    'login' => 'Tu cuenta fue bloqueada o se encuentra eliminada.',
                ]);
            }

            // Verificar rol del usuario
            Log::info('Verificando roles del usuario', ['user_id' => $user->id, 'roles' => $user->roles->pluck('id')]);
            if (!$user->hasAnyRole(6)) {
                Log::warning('Usuario sin permisos para acceder', ['user_id' => $user->id, 'roles' => $user->roles->pluck('id')]);
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                return back()->withErrors([
                    'login' => 'Tu cuenta no tiene permisos para acceder a la plataforma.',
                ]);
            }

            Log::info('Redirigiendo al usuario después de login exitoso', [
                'user_id' => $user->id,
                'redirect_to' => RouteServiceProvider::HOME,
                'is_authenticated' => Auth::check(),
                'session_id' => $request->session()->getId(),
                'cookies' => $request->cookies->all()
            ]);
            
            return redirect()->intended(RouteServiceProvider::HOME);
        } catch (\Exception $e) {
            Log::error('Error en autenticación', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->only(['login', 'remember'])
            ]);
            throw $e;
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
