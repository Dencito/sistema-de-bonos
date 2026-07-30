<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\CompanyDatabaseService;
use App\Services\PlatformAdminService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Consola de plataforma: el lugar desde donde se crean las empresas.
 *
 * Vive fuera de cualquier tenant (no lleva prefijo /{empresa}) y se autentica
 * contra un archivo, no contra la base. Ver PlatformAdminService.
 */
class PlatformConsoleController extends Controller
{
    public function __construct(private PlatformAdminService $admins)
    {
    }

    public function showLogin(Request $request)
    {
        if ($request->session()->has(PlatformAdminService::SESSION_KEY)) {
            return redirect()->route('platform.companies.create');
        }

        return Inertia::render('Platform/Login', [
            'configured' => $this->admins->configured(),
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'user' => 'required|string|max:100',
            'password' => 'required|string|max:200',
        ]);

        // Sin esto el archivo de credenciales queda expuesto a fuerza bruta:
        // no hay usuario en base al que bloquear, asi que limitamos por IP.
        $key = 'platform-login:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'user' => 'Demasiados intentos. Probá de nuevo en ' . RateLimiter::availableIn($key) . ' segundos.',
            ]);
        }

        $user = $this->admins->attempt($data['user'], $data['password']);

        if (!$user) {
            RateLimiter::hit($key, 300);

            throw ValidationException::withMessages([
                'user' => 'Credenciales incorrectas.',
            ]);
        }

        RateLimiter::clear($key);

        // Sesión nueva para que un id de sesión previo no quede con privilegios
        $request->session()->regenerate();
        $request->session()->put(PlatformAdminService::SESSION_KEY, $user);

        return redirect()->route('platform.companies.create');
    }

    /**
     * Consola: listado de empresas y formulario de creacion.
     */
    public function console()
    {
        return Inertia::render('Platform/Console', [
            'companies' => Company::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'domain', 'is_active', 'created_at']),
            'baseUrl' => rtrim(config('app.url'), '/'),
        ]);
    }

    /**
     * Crea la empresa y sus tablas. Nada mas.
     *
     * A diferencia de CompanyController::create() no copia el proyecto, no
     * reescribe .env, no crea subdominio ni corre npm run build: la empresa
     * queda accesible en /{slug}/ sobre este mismo deploy.
     *
     * Solo se piden los datos que hacen falta para que la empresa funcione. El
     * resto de la ficha (representante legal, direccion, contacto) es nullable
     * en la tabla y se completa despues desde la pantalla de Empresas.
     */
    public function storeCompany(Request $request, CompanyDatabaseService $databases)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:60',
                // El slug es el prefijo de las tablas y el segmento de la URL
                'regex:/^[a-z][a-z0-9]*$/',
                Rule::unique(Company::class, 'slug'),
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'max_branches' => 'required|integer|min:1|max:500',
        ], [
            'slug.regex' => 'El identificador debe empezar con una letra y llevar solo minúsculas y números, sin guiones ni espacios.',
        ]);

        // Los segmentos reservados no pueden ser un tenant: la URL nunca lo
        // resolveria porque SetTenantSessionCookie los descarta.
        if (in_array($data['slug'], ['create-company', 'platform', 'login', 'logout', 'api', 'build', 'storage', 'tickets'], true)) {
            throw ValidationException::withMessages([
                'slug' => 'Ese identificador está reservado por el sistema.',
            ]);
        }

        $company = Company::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'schema_name' => $data['slug'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'max_branches' => $data['max_branches'],
            'status_id' => 1,
            'is_active' => true,
            'settings' => json_encode([]),
        ]);

        // createCompanyTables lee $request->slug para armar los nombres
        $databases->createCompanyTables(new Request(['slug' => $data['slug']]));

        return redirect()
            ->route('platform.companies.create')
            ->with('status', "Empresa {$company->name} creada. Ya podés entrar en /{$company->slug}/login");
    }

    public function logout(Request $request)
    {
        $request->session()->forget(PlatformAdminService::SESSION_KEY);
        $request->session()->regenerate();

        return redirect()->route('platform.login');
    }
}
