<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

/**
 * Aísla la cookie de sesión por empresa (tenant), para evitar que usuarios
 * de distintas empresas en el mismo navegador/dominio se pisen la sesión
 * y disparen errores de "CSRF token mismatch".
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
            $baseCookie = Config::get('session.cookie');
            // Nombre único por empresa. Sanitizamos por seguridad.
            $safe = preg_replace('/[^A-Za-z0-9_\-]/', '', $tenant);
            Config::set('session.cookie', $safe . '_session');

            // También el XSRF-TOKEN se deriva del session cookie name en
            // algunos setups; Laravel usa siempre "XSRF-TOKEN" pero lo
            // referenciamos aquí para futura extensión.
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
        ];
        return !in_array(strtolower($seg), $reserved, true);
    }
}
