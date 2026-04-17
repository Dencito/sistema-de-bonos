<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use App\Models\Company;

class SetTenantFromPath
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Extraer el nombre de la empresa del path
        $segments = $request->segments();
        
        // Si no hay segmentos o es una ruta pública, continuar
        if (empty($segments)) {
            return $next($request);
        }

        $companySlug = $segments[0];

        // Rutas que no requieren tenant (login, register, etc.)
        $publicRoutes = ['login', 'register', 'password', 'sanctum', 'api'];
        if (in_array($companySlug, $publicRoutes)) {
            return $next($request);
        }

        try {
            // Buscar la empresa por slug/name
            $company = Company::where('name', $companySlug)
                ->orWhere('slug', $companySlug)
                ->first();

            if (!$company) {
                // Si no existe la empresa, redirigir o mostrar error
                abort(404, 'Empresa no encontrada');
            }

            // Configurar la conexión a la base de datos del tenant
            $this->configureTenantDatabase($company);

            // Inyectar la empresa en el request para uso posterior
            $request->merge(['tenant_company' => $company]);
            
            // Compartir con las vistas
            view()->share('currentCompany', $company);

        } catch (\Exception $e) {
            \Log::error('Error setting tenant from path: ' . $e->getMessage());
            abort(500, 'Error al configurar el tenant');
        }

        return $next($request);
    }

    /**
     * Configure the database connection for the tenant
     */
    private function configureTenantDatabase(Company $company)
    {
        // Configurar el prefijo de tablas según la empresa
        $prefix = $company->name . '_';

        // Actualizar la configuración de la base de datos
        Config::set('database.connections.mysql.prefix', $prefix);
        
        // Reconectar para aplicar el nuevo prefijo
        DB::purge('mysql');
        DB::reconnect('mysql');

        // Log para debugging
        \Log::info('Tenant database configured', [
            'company' => $company->name,
            'prefix' => $prefix
        ]);
    }
}
