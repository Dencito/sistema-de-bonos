<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class SetCompanyPrefixAfterAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            // Obtener el prefijo del subdominio o del header
            $host = $request->getHost();
            
            if (str_contains($host, 'localhost:')) {
                $prefix = $request->header('X-Company-Prefix', 'empresa1');
            } else {
                $parts = explode('.', $host);
                $prefix = $parts[0];
            }

            // Establecer el prefijo en la configuración
            Config::set('company.prefix', $prefix);
        }

        return $next($request);
    }
}
