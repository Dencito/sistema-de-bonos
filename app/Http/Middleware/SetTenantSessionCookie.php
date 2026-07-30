<?php

namespace App\Http\Middleware;

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
     * Resuelve el tenant en este orden:
     *  1. Header X-Company-Prefix (usado en dev/localhost).
     *  2. Primer segmento del path URL (path-based tenancy).
     *  3. Subdominio del host (legacy).
     *  4. config('company.prefix') ya resuelto por el ServiceProvider.
     */
    protected function resolveTenant(Request $request): ?string
    {
        $header = $request->header('X-Company-Prefix');
        if (!empty($header)) {
            return $header;
        }

        $segment = $request->segment(1);
        if ($segment && $this->looksLikeTenantSegment($segment)) {
            return $segment;
        }

        $host = $request->getHost();
        if ($host && !in_array($host, ['localhost', '127.0.0.1'], true)) {
            $parts = explode('.', str_replace('www.', '', $host));
            if (count($parts) >= 3) {
                return $parts[0];
            }
        }

        $fromConfig = config('company.prefix');
        if (!empty($fromConfig)) {
            return $fromConfig;
        }

        return null;
    }

    /**
     * Evita tomar rutas estáticas/asset/etc como tenant.
     */
    protected function looksLikeTenantSegment(string $seg): bool
    {
        $reserved = [
            'login', 'logout', 'register', 'password', 'email', 'profile',
            'build', 'storage', 'api', 'broadcasting', 'livewire', 'up',
            'verify-email', 'forgot-password', 'reset-password', 'assets',
            // Consola de plataforma: está por encima de los tenants
            'create-company', 'platform',
        ];
        return !in_array(strtolower($seg), $reserved, true);
    }
}
