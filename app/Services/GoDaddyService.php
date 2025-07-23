<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class GoDaddyService
{
    protected $apiKey;
    protected $apiSecret;
    protected $baseUrl;
    protected $domain;

    public function __construct()
    {
        $this->apiKey = config('services.godaddy.api_key');
        $this->apiSecret = config('services.godaddy.api_secret');
        $this->baseUrl = 'https://api.godaddy.com/v1';
        $this->domain = config('services.godaddy.domain');
    }
    
    /**
     * Obtener API Key de GoDaddy
     */
    public function getApiKey()
    {
        return $this->apiKey;
    }
    
    /**
     * Obtener API Secret de GoDaddy
     */
    public function getApiSecret()
    {
        return $this->apiSecret;
    }
    
    /**
     * Obtener URL base de GoDaddy API
     */
    public function getBaseUrl()
    {
        return $this->baseUrl;
    }
    
    /**
     * Obtener dominio configurado
     */
    public function getDomain()
    {
        return $this->domain;
    }

    public function createSubdomain(string $subdomain)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "sso-key {$this->apiKey}:{$this->apiSecret}",
                'Content-Type' => 'application/json',
            ])->withOptions([
                'verify' => false // Temporarily disable SSL verification
            ])->patch("{$this->baseUrl}/domains/{$this->domain}/records", [
                [
                    'type' => 'A',
                    'name' => $subdomain,
                    'data' => config('services.godaddy.server_ip'),
                    'ttl' => 3600
                ]
            ]);

            if ($response->failed()) {
                throw new Exception('Error creating subdomain in GoDaddy: ' . $response->body());
            }
            

            $response2 = Http::withHeaders([
                'Authorization' => "sso-key {$this->apiKey}:{$this->apiSecret}",
                'Content-Type' => 'application/json',
            ])->withOptions([
                'verify' => false // Temporarily disable SSL verification
            ])->patch("{$this->baseUrl}/domains/{$this->domain}/records", [
                [
                    'type' => 'CNAME',
                    'name' => "cpanel.{$subdomain}",
                    'data' => "{$subdomain}.{$this->domain}",
                    'ttl' => 3600
                ]
            ]);

            if ($response2->failed()) {
                throw new Exception('Error creating subdomain in GoDaddy: ' . $response->body());
            }

            return true;
        } catch (Exception $e) {
            throw new Exception('GoDaddy API Error: ' . $e->getMessage());
        }
    }
}
