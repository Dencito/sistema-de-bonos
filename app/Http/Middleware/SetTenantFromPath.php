<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Company;

class SetTenantFromPath
{
    /**
     * Handle an incoming request.
     *
     * NOTE: Table prefixing is handled exclusively by CompanyScope trait
     * via config('company.prefix') set in CompanyServiceProvider.
     * This middleware only validates the tenant and injects it into the request.
     * Do NOT set DB prefix here — that caused the double-prefix bug:
     *   CompanyScope: 888spa_ + table  →  888spa_companies
     *   DB prefix:    888spa_ + 888spa_companies  →  888spa_888spa_companies  💥
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $segments = $request->segments();

        // No segments → public root, continue
        if (empty($segments)) {
            return $next($request);
        }

        $companySlug = $segments[0];

        // Rutas que no requieren tenant
        $publicRoutes = ['login', 'register', 'password', 'sanctum', 'api'];
        if (in_array($companySlug, $publicRoutes)) {
            return $next($request);
        }

        try {
            // Company model does NOT use CompanyScope — it is the global master table.
            // config('company.prefix') is already set by CompanyServiceProvider before
            // this middleware runs, so CompanyScope prefixes all other model tables correctly.
            $company = Company::where('name', $companySlug)
                ->orWhere('slug', $companySlug)
                ->first();

            if (!$company) {
                abort(404, 'Empresa no encontrada');
            }

            // Inject tenant into the request for downstream use
            $request->merge(['tenant_company' => $company]);

            // Share with Blade/Inertia views
            view()->share('currentCompany', $company);

        } catch (\Exception $e) {
            \Log::error('Error setting tenant from path: ' . $e->getMessage());
            abort(500, 'Error al configurar el tenant');
        }

        return $next($request);
    }
}
