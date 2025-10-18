<?php

namespace App\Providers;

use App\Services\CompanyDatabaseService;
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
            $host = $request->getHost();
            $subdomain;
            Log::info('Host original: ' . $host);

            if ($this->isLocalEnvironment($host)) {
                $subdomain = $request->header('X-Company-Prefix', '888spa');
                Log::info('Usando entorno local, subdomain desde header: ' . $subdomain);
            } else {
                if (empty($host)) {
                    throw new \Exception('Host no válido: está vacío');
                }

                $subdomain = $this->getSubdomainFromHost($host);
                if (empty($subdomain)) {
                    throw new \Exception('No se pudo extraer el subdominio del host');
                }
            }
            
            Log::info('APP_PRIMARY_SUBDOMAIN: ' . env('APP_PRIMARY_SUBDOMAIN'));
            if ($subdomain === "tickets") {
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
