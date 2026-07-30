<?php

namespace App\Http\Middleware;

use App\Services\PlatformAdminService;
use Closure;
use Illuminate\Http\Request;

/**
 * Cierra la consola de plataforma a quien no se haya autenticado contra
 * storage/app/platform-admins.json.
 */
class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->session()->has(PlatformAdminService::SESSION_KEY)) {
            return redirect()->route('platform.login');
        }

        return $next($request);
    }
}
