<?php

namespace App\Http\Middleware;

use App\Services\CompanyDatabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Closure;

class ValidateCompanySubdomain
{
    protected $companyDatabaseService;

    public function __construct(CompanyDatabaseService $companyDatabaseService)
    {
        $this->companyDatabaseService = $companyDatabaseService;
    }

    public function handle(Request $request, Closure $next)
    {
        try {
            $host = $request->getHost();
            
            // Para desarrollo local, si estamos usando localhost:8000
            if (str_contains($host, 'localhost:')) {
                $subdomain = $request->header('X-Company-Prefix', 'empresa1');
            } else {
                $parts = explode('.', $host);
                if (count($parts) < 2) {
                    throw new \Exception('Acceso inválido: Subdominio no encontrado');
                }
                $subdomain = $parts[0];
            }

            if (!$this->companyDatabaseService->validateCompanyTables($subdomain)) {
                throw new \Exception("Acceso inválido: Las tablas para {$subdomain} no existen");
            }

            Config::set('company.prefix', $subdomain);

            return $next($request);
        } catch (\Exception $e) {
            \Sentry\captureException($e);

            return response()->json([
                'error' => 'Acceso no autorizado',
                'message' => $e->getMessage()
            ], 403);
        }
    }
}
