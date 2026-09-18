<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'godaddy' => [
        'api_key' => env('GODADDY_API_KEY'),
        'api_secret' => env('GODADDY_API_SECRET'),
        'domain' => env('GODADDY_DOMAIN'),
        'server_ip' => env('GODADDY_SERVER_IP'),
    ],

    'cpanel' => [
        'username' => env('CPANEL_USERNAME'),
        'token' => env('CPANEL_TOKEN'),
        'domain' => env('CPANEL_DOMAIN'),
        'host' => env('CPANEL_HOST'),
    ],

    /*
     * Reporte de casinos online (miadmin.cc).
     *
     * La cookie es de sesión y caduca: cuando pase, el reporte avisa y se
     * cambia acá sin tocar código. Nunca va al front: la petición sale del
     * servidor, así la credencial no llega al navegador.
     */
    'miadmin' => [
        'url' => env('MIADMIN_URL', 'https://miadmin.cc'),
        'cookie' => env('MIADMIN_COOKIE'),
        'accounts' => env('MIADMIN_ACCOUNTS'),
        'tz' => env('MIADMIN_TZ', '-3'),
        // Solo para entornos sin curl.cainfo configurado (Windows). En el
        // servidor se deja vacío y la verificación SSL queda activa.
        'ca_bundle' => env('MIADMIN_CA_BUNDLE'),
    ],
];
