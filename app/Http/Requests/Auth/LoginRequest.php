<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required' ,'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        // Set company prefix from route parameter before authentication
        $company = $this->route('company');
        if ($company) {
            config(['company.prefix' => $company]);
        }

        Log::info('Iniciando proceso de autenticación', [
            'login' => $this->input('login'),
            'remember' => $this->boolean('remember'),
            'ip' => $this->ip(),
            'user_agent' => $this->header('User-Agent'),
            'company_prefix' => config('company.prefix'),
            'route_company' => $company,
        ]);

        $this->ensureIsNotRateLimited();
        Log::info('Verificación de rate limit superada');

        $login = $this->input('login');
        $password = $this->input('password');

        // Intentar autenticación con nombre de usuario
        Log::info('Intentando autenticación con username', ['username' => $login]);
        if (Auth::attempt(['username' => $login, 'password' => $password], $this->boolean('remember'))) {
            Log::info('Autenticación exitosa con username', [
                'user_id' => Auth::id(),
                'remember' => $this->boolean('remember'),
            ]);
            RateLimiter::clear($this->throttleKey());
            return;
        }
        Log::warning('Autenticación fallida con username');

        // Intentar autenticación con email como alternativa
        Log::info('Intentando autenticación con email', ['email' => $login]);
        if (Auth::attempt(['email' => $login, 'password' => $password], $this->boolean('remember'))) {
            Log::info('Autenticación exitosa con email', [
                'user_id' => Auth::id(),
                'remember' => $this->boolean('remember'),
            ]);
            RateLimiter::clear($this->throttleKey());
            return;
        }
        Log::warning('Autenticación fallida con email');

        // Si no coincide con ninguno, incrementa el contador de intentos fallidos
        Log::error('Autenticación fallida para ambos métodos', [
            'login' => $login,
            'throttle_key' => $this->throttleKey(),
        ]);
        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.failed'),
        ]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        $throttleKey = $this->throttleKey();
        Log::info('Verificando rate limit', ['throttle_key' => $throttleKey]);
        
        if (!RateLimiter::tooManyAttempts($throttleKey, 5)) {
            Log::info('Rate limit OK', ['attempts' => RateLimiter::attempts($throttleKey)]);
            return;
        }

        Log::warning('Rate limit excedido', [
            'throttle_key' => $throttleKey,
            'attempts' => RateLimiter::attempts($throttleKey)
        ]);
        
        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($throttleKey);
        Log::warning('Usuario bloqueado temporalmente', [
            'seconds' => $seconds,
            'minutes' => ceil($seconds / 60),
            'ip' => $this->ip()
        ]);

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('login')) . '|' . $this->ip());
    }
}
