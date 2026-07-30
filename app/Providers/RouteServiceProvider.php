<?php

namespace App\Providers;

use App\Support\TenantResolver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Si la empresa viene en la URL (/nanu/login), las rutas se
            // registran bajo ese prefijo. Es un prefijo LITERAL, no un
            // parametro {empresa}: asi los controladores no reciben un
            // argumento extra y route('login') ya devuelve /nanu/login sin
            // necesidad de URL::defaults.
            //
            // Sin empresa en el path se registran sin prefijo, que es lo que
            // usan las empresas viejas por subdominio y el modo tickets.
            //
            // OJO: depende de que las rutas se resuelvan por request, o sea de
            // NO usar route:cache. deploy.sh corre optimize:clear.
            $tenant = TenantResolver::fromPath();

            $web = Route::middleware('web');

            if ($tenant) {
                $web = $web->prefix($tenant);
            }

            $web->group(base_path('routes/web.php'));
        });
    }
}
