<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait SentryLogging
{
    protected function logError(\Throwable $exception, string $context = '', array $extraData = [])
    {
        Log::error($exception->getMessage(), [
            'exception' => get_class($exception),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'context' => $context,
            'extra' => $extraData
        ]);

        // Determinar si debemos enviar a Sentry
        if (!$this->shouldSendToSentry($exception)) {
            return;
        }

        // Solo enviar a Sentry si pasa los filtros
        if ($this->shouldReportToSentry($exception)) {
            try {
                $user = Auth::user();

                \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($user, $context, $extraData): void {
                    // Información básica del usuario
                    if ($user) {
                        $scope->setExtra('user_id', $user->id);
                        $scope->setExtra('user_email', $user->email);
                    }

                    // Contexto de la operación
                    $scope->setTag('context', $context);

                    // Datos extra limitados
                    foreach ($extraData as $key => $value) {
                        if (is_scalar($value)) {  // Solo valores simples
                            $scope->setExtra($key, $value);
                        }
                    }
                });

                \Sentry\captureException($exception);
            } catch (\Throwable $e) {
                // Si falla el logging, solo registrar localmente
                Log::error('Error logging to Sentry: ' . $e->getMessage());
            }
        }
    }

    protected function shouldSendToSentry(\Throwable $exception): bool
    {
        if (app()->environment('production')) {
            return true;
        }

        if ($exception instanceof \Error ||
                $exception instanceof \ErrorException ||
                $exception->getCode() >= 500) {
            return true;
        }

        // 2. Es una excepción que específicamente queremos trackear
        $trackInDevelopment = [
            // Añade aquí las excepciones que quieras trackear en desarrollo
            // Ejemplo: \App\Exceptions\CriticalBusinessException::class
        ];

        foreach ($trackInDevelopment as $exceptionClass) {
            if ($exception instanceof $exceptionClass) {
                return true;
            }
        }

        return false;
    }

    protected function shouldReportToSentry(\Throwable $exception): bool
    {
        // Lista de excepciones que NO queremos reportar a Sentry
        $ignoredExceptions = [
            \Illuminate\Auth\AuthenticationException::class,
            \Illuminate\Auth\Access\AuthorizationException::class,
            \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
            \Illuminate\Session\TokenMismatchException::class,
            \Illuminate\Validation\ValidationException::class,
        ];

        foreach ($ignoredExceptions as $ignoredException) {
            if ($exception instanceof $ignoredException) {
                return false;
            }
        }

        return true;
    }
}
