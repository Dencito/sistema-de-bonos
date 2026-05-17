<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Sentry\State\Scope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class SentryServiceProvider extends ServiceProvider
{
    public function boot()
    {
        \Sentry\configureScope(function (Scope $scope): void {
            // Add user context
            if (auth()->check()) {
                $user = auth()->user();
                $scope->setUser([
                    'id' => $user->id,
                    'email' => $user->email,
                    'username' => $user->name,
                    'role' => $user->role ?? 'unknown',
                    'last_login' => $user->last_login_at ?? 'unknown',
                ]);
            }

            // Add request context
            $scope->setExtra('url', Request::fullUrl());
            $scope->setExtra('method', Request::method());
            $scope->setExtra('ip', Request::ip());
            $scope->setExtra('user_agent', Request::userAgent());

            // Add application context
            $scope->setTag('environment', config('app.env'));
            $scope->setTag('php_version', PHP_VERSION);
            $scope->setTag('laravel_version', app()->version());

            // Add performance metrics
            $scope->setExtra('memory_usage', memory_get_usage(true));

            // Add custom breadcrumb for tracking user journey
            \Sentry\addBreadcrumb(
                new \Sentry\Breadcrumb(
                    \Sentry\Breadcrumb::LEVEL_INFO,
                    \Sentry\Breadcrumb::TYPE_NAVIGATION,
                    'navigation',
                    Request::path()
                )
            );
        });

        // Listen for database queries (useful for debugging performance issues)
        if (config('app.debug')) {
            \DB::listen(function ($query) {
                \Sentry\addBreadcrumb(
                    new \Sentry\Breadcrumb(
                        \Sentry\Breadcrumb::LEVEL_INFO,
                        \Sentry\Breadcrumb::TYPE_DEFAULT,
                        'sql',
                        '',
                        [
                            'sql' => $query->sql,
                            'time' => $query->time . 'ms',
                        ]
                    )
                );
            });
        }
    }

    public function register()
    {
        //
    }
}
