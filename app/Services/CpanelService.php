<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Support\Facades\Log;

class CpanelService
{
    protected $username;
    protected $token;
    protected $domain;
    protected $baseUrl;

    public function __construct()
    {
        $this->username = config('services.cpanel.username');
        $this->token = config('services.cpanel.token');
        $this->domain = config('services.cpanel.domain');
        $this->baseUrl = config('services.cpanel.host');
    }

    public function createSubdomain(string $subdomain)
    {
        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => "cpanel {$this->username}:{$this->token}",
                ])->post("{$this->baseUrl}/execute/SubDomain/addsubdomain", [
                    'domain' => $subdomain,
                    'rootdomain' => $this->domain,
                    'dir' => "/public_html/{$subdomain}.{$this->domain}/public",
                    'disallowdot' => 1
                ]);

            if ($response->failed()) {
                Log::error('cPanel API Response: ' . $response->body());
                throw new Exception('Error creating subdomain in cPanel: ' . $response->body());
            }

            // Configurar el virtual host si es necesario
            $this->configureVirtualHost($subdomain);

            return true;
        } catch (Exception $e) {
            Log::error('cPanel API Error: ' . $e->getMessage());
            throw new Exception('cPanel API Error: ' . $e->getMessage());
        }
    }

    protected function configureVirtualHost(string $subdomain)
    {
        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => "cpanel {$this->username}:{$this->token}",
                ])->get("{$this->baseUrl}/execute/SubDomain/addsubdomain", [
                    'domain' => $subdomain,
                    'rootdomain' => $this->domain,
                    'dir' => "/public_html/{$subdomain}.{$this->domain}/public"
                ]);

            if ($response->failed()) {
                Log::error('cPanel Virtual Host API Response: ' . $response->body());
                throw new Exception('Error configuring virtual host: ' . $response->body());
            }

            return true;
        } catch (Exception $e) {
            Log::error('cPanel Virtual Host Configuration Error: ' . $e->getMessage());
            throw new Exception('cPanel Virtual Host Configuration Error: ' . $e->getMessage());
        }
    }
}
