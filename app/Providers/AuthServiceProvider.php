<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Notifications\ResetPassword;
use Carbon\Carbon;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Configurar el tiempo de expiración del enlace de restablecimiento de contraseña
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.url') . '/reset-password/' . $token;
        });

        // Política de contraseñas seguras
        Gate::define('update-password', function ($user, $password) {
            return strlen($password) >= 12 && // Mínimo 12 caracteres
                   preg_match('/[A-Z]/', $password) && // Al menos una mayúscula
                   preg_match('/[a-z]/', $password) && // Al menos una minúscula
                   preg_match('/[0-9]/', $password) && // Al menos un número
                   preg_match('/[^A-Za-z0-9]/', $password); // Al menos un carácter especial
        });

        // Bloqueo de cuenta después de intentos fallidos
        Gate::define('attempt-login', function ($user = null) {
            $key = request()->ip() . ':login-attempts';
            $attempts = cache()->get($key, 0);
            
            if ($attempts >= 5) { // 5 intentos fallidos
                $lockoutTime = cache()->get($key . ':lockout');
                if ($lockoutTime && Carbon::now()->lt($lockoutTime)) {
                    return false;
                }
                cache()->forget($key . ':lockout');
                cache()->forget($key);
            }
            
            return true;
        });
    }
}
