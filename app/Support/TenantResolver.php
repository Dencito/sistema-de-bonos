<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/**
 * Unico lugar donde se decide de que empresa es un request.
 *
 * Antes esto estaba repartido: el subdominio en CompanyServiceProvider, el
 * primer segmento del path en SetTenantSessionCookie y location.host en dos
 * componentes de React. Tres implementaciones que podian discrepar.
 *
 * Orden de resolucion:
 *   1. Header X-Company-Prefix (la app mobile y el entorno local).
 *   2. Primer segmento del path: /nanu/login  -> nanu
 *   3. Subdominio del host: nanu.dominio.cl   -> nanu   (empresas viejas)
 *
 * Devuelve null cuando no hay empresa, que es el modo "tickets": se opera
 * sobre las tablas sin prefijo.
 */
class TenantResolver
{
    /**
     * Segmentos que nunca son una empresa. Sin esta lista, /login se
     * interpretaria como la empresa "login".
     */
    public const RESERVED = [
        'login', 'logout', 'register', 'password', 'email', 'profile',
        'build', 'storage', 'api', 'broadcasting', 'livewire', 'up',
        'verify-email', 'forgot-password', 'reset-password', 'assets',
        'create-company', 'platform', 'tickets', 'favicon.ico', 'robots.txt',
    ];

    /** Cache por request: la validacion consulta la base. */
    private static array $exists = [];

    public static function fromRequest(?Request $request = null): ?string
    {
        $request ??= request();

        if (!$request) {
            return null;
        }

        $header = $request->header('X-Company-Prefix');
        if (!empty($header)) {
            return static::sanitize($header);
        }

        $segment = $request->segment(1);
        if ($segment && !in_array(strtolower($segment), static::RESERVED, true)) {
            $slug = static::sanitize($segment);

            // Un segmento que no es una empresa conocida no se toma como tal:
            // asi /cualquier-cosa da 404 en vez de reventar mas adelante con
            // un "table cualquier-cosa_users doesn't exist".
            if ($slug && static::exists($slug)) {
                return $slug;
            }
        }

        return static::fromHost($request);
    }

    /**
     * Solo la parte del path, sin el fallback al subdominio. La usa
     * RouteServiceProvider: si el tenant vino por subdominio las rutas NO
     * llevan prefijo.
     */
    public static function fromPath(?Request $request = null): ?string
    {
        $request ??= request();

        if (!$request) {
            return null;
        }

        $segment = $request->segment(1);

        if (!$segment || in_array(strtolower($segment), static::RESERVED, true)) {
            return null;
        }

        $slug = static::sanitize($segment);

        return $slug && static::exists($slug) ? $slug : null;
    }

    private static function fromHost(Request $request): ?string
    {
        $host = $request->getHost();

        if (!$host || in_array($host, ['localhost', '127.0.0.1'], true)) {
            return null;
        }

        $parts = explode('.', str_replace('www.', '', $host));

        if (count($parts) < 3) {
            return null;
        }

        $sub = static::sanitize($parts[0]);

        // 'tickets' es el host del deploy, no una empresa
        return $sub && $sub !== 'tickets' ? $sub : null;
    }

    /**
     * Una empresa existe si tiene sus tablas. Se mira {slug}_users en vez del
     * registro de empresas porque es lo que la app realmente necesita para
     * funcionar, y no depende de en que tabla se lleve el registro.
     */
    private static function exists(string $slug): bool
    {
        if (array_key_exists($slug, static::$exists)) {
            return static::$exists[$slug];
        }

        try {
            return static::$exists[$slug] = Schema::hasTable($slug . '_users');
        } catch (\Throwable) {
            // Base caida o sin configurar: no queremos tumbar el request acá
            return static::$exists[$slug] = false;
        }
    }

    /** Evita path traversal y nombres de tabla invalidos. */
    private static function sanitize(string $value): ?string
    {
        $clean = preg_replace('/[^A-Za-z0-9_\-]/', '', $value);

        return $clean !== '' ? strtolower($clean) : null;
    }
}
