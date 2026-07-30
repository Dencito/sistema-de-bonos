<?php

namespace App\Http\Middleware;

use App\Support\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

/**
 * Aísla la sesión por empresa (tenant):
 *  - Cambia el nombre de la cookie de sesión → cada empresa tiene su propia cookie
 *  - Cambia el path de archivos de sesión  → cada empresa tiene su propio directorio
 *
 * Con driver=file esto garantiza aislamiento total: un usuario de empresa A
 * nunca puede pisar la sesión de empresa B, aunque compartan el mismo servidor.
 *
 * Debe ejecutarse ANTES de \Illuminate\Session\Middleware\StartSession
 * (por eso se registra con ->prepend() en bootstrap/app.php).
 */
class SetTenantSessionCookie
{
    public function handle(Request $request, Closure $next)
    {
        $tenant = $this->resolveTenant($request);

        if ($tenant) {
            // Sanitizamos el nombre del tenant para evitar path traversal
            $safe = preg_replace('/[^A-Za-z0-9_\-]/', '', $tenant);

            // Cookie única por empresa → el navegador no mezcla sesiones
            Config::set('session.cookie', $safe . '_session');

            // Directorio de archivos de sesión único por empresa
            // storage/framework/sessions/888spa/  |  storage/framework/sessions/chillan/
            $tenantSessionPath = storage_path('framework/sessions/' . $safe);
            if (!is_dir($tenantSessionPath)) {
                mkdir($tenantSessionPath, 0755, true);
            }
            Config::set('session.files', $tenantSessionPath);
        }

        return $next($request);
    }

    /**
     * Delega en TenantResolver, que es el único lugar donde se decide de qué
     * empresa es un request. Antes este middleware tenía su propia copia de la
     * lógica y podía discrepar del CompanyServiceProvider.
     *
     * config('company.prefix') queda como último recurso porque el provider ya
     * corrió cuando este middleware se ejecuta.
     */
    protected function resolveTenant(Request $request): ?string
    {
        return TenantResolver::fromRequest($request) ?: (config('company.prefix') ?: null);
    }
}
