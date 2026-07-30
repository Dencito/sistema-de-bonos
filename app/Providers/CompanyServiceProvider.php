<?php

namespace App\Providers;

use App\Services\CompanyDatabaseService;
use App\Support\TenantResolver;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Sentry\Breadcrumb;
use Sentry\Sentry;

class CompanyServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    protected function getSubdomainFromHost($host)
    {
        $host = str_replace('www.', '', $host);

        $parts = explode('.', $host);
        if (count($parts) >= 3) {
            //return "888spa";
            return $parts[0];
        }

        return null;
    }

    protected function isLocalEnvironment($host)
    {
        return $host === 'localhost' || str_contains($host, 'localhost:') || str_contains($host, '127.0.0.1');
    }

    public function boot(CompanyDatabaseService $companyDatabaseService)
    {
        try {
            $request = request();

            // TenantResolver mira, en orden: header X-Company-Prefix, primer
            // segmento del path (/nanu/login) y subdominio. Devuelve null
            // cuando no hay empresa, que es el modo tickets: tablas sin prefijo.
            $subdomain = TenantResolver::fromRequest($request);

            // En local, sin nada que resolver, se opera sobre 888spa
            if (!$subdomain && $this->isLocalEnvironment($request->getHost())) {
                $subdomain = TenantResolver::fromPath($request) ? null : '888spa';
            }

            if (!$subdomain) {
                Config::set('company.prefix', null);
                return;
            }

            // TODO
            // $tablesExist = $companyDatabaseService->validateCompanyTables($subdomain);
            /* \Sentry\addBreadcrumb(
                new \Sentry\Breadcrumb(
                    \Sentry\Breadcrumb::LEVEL_INFO,
                    \Sentry\Breadcrumb::TYPE_DEFAULT,
                    'company.subdomain',
                    'Validación de tablas',
                    [
                        'subdomain' => $subdomain,
                        'tablesExist' => $tablesExist
                    ]
                )
            ); */

            // TODO: Verifify if tables exist
            /* if (!$tablesExist) {
                throw new \Exception("Acceso inválido: Las tablas para {$subdomain} no existen");
            } */

            Config::set('company.prefix', $subdomain);
        } catch (\Exception $e) {
            \Sentry\captureException($e);
            Config::set('company.prefix', null);
            throw $e;
        }
    }
}
