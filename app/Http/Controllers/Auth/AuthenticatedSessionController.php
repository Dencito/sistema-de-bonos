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
use App\Models\User;
use App\Models\Company;

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

            // El usuario está activo, permitimos el acceso sin verificar roles
            Log::info('Usuario activo, permitiendo acceso', ['user_id' => $user->id]);

            // Obtener la empresa del request (si viene de una URL con empresa)
            // O usar la empresa por defecto del usuario
            $companyName = $request->input('company') ?? $this->getDefaultCompany($user);
            
            if (!$companyName) {
                Log::error('No se pudo determinar la empresa', ['user_id' => $user->id]);
                Auth::logout();
                return back()->withErrors([
                    'login' => 'No se pudo determinar la empresa. Contacta al administrador.',
                ]);
            }

            $dashboardUrl = "/{$companyName}/";

            Log::info('Redirigiendo al usuario después de login exitoso', [
                'user_id' => $user->id,
                'company' => $companyName,
                'redirect_to' => $dashboardUrl,
                'is_authenticated' => Auth::check(),
                'session_id' => $request->session()->getId()
            ]);
            
            return redirect()->intended($dashboardUrl);
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
     * Get the default company name for the user
     * This is used as fallback when no company is specified in the request
     */
    private function getDefaultCompany(User $user): ?string
    {
        // Opción 1: Si el usuario tiene company_id directo
        if ($user->company_id) {
            $company = Company::find($user->company_id);
            return $company ? $company->name : null;
        }

        // Opción 2: Si el usuario tiene relación con empresa a través de branches
        if ($user->branch_id) {
            $branch = $user->branch;
            if ($branch && $branch->company_id) {
                $company = Company::find($branch->company_id);
                return $company ? $company->name : null;
            }
        }

        // Opción 3: Obtener la primera empresa disponible
        $company = Company::first();
        return $company ? $company->name : null;
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}

