<?php

namespace App\Providers;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\ServiceProvider;

class CompanyServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        if (!app()->runningInConsole()) {
            $request = request();
            if ($request) {
                $company = $request->route('company');

                if (empty($company)) {
                    Config::set('company.prefix', null);
                    return;
                }

                // For local development, allow override via header
                $host = $request->getHost();
                $isLocal = $host === 'localhost' || str_contains($host, 'localhost:') || str_contains($host, '127.0.0.1');
                
                if ($isLocal) {
                    $headerCompany = $request->header('X-Company-Prefix');
                    if ($headerCompany) {
                        $company = $headerCompany;
                    }
                }

                // Check if it's the main app (e.g., 'tickets')
                if ($company === 'tickets') {
                    Config::set('company.prefix', null);
                    return;
                }

                Config::set('company.prefix', $company);
            }
        }
    }
}
