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

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'auth_service' => [
        'base_url' => rtrim((string) env('AUTH_SERVICE_URL', 'http://host.docker.internal:8001'), '/'),
        'internal_api_key' => env('AUTH_SERVICE_INTERNAL_API_KEY'),
        'affiliate_client_id' => env('AUTH_SERVICE_AFFILIATE_CLIENT_ID'),
        'affiliate_client_secret' => env('AUTH_SERVICE_AFFILIATE_CLIENT_SECRET'),
        'onboarding_client_id' => env('AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_ID'),
        'onboarding_client_secret' => env('AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_SECRET'),
        'callback_url' => env('AUTH_SERVICE_AFFILIATE_CALLBACK_URL', rtrim((string) env('APP_URL', 'http://localhost:8089'), '/').'/api/sso/callback'),
        'application_code' => env('AUTH_SERVICE_AFFILIATE_APPLICATION_CODE', 'affiliate'),
        'onboarding_application_code' => env('AUTH_SERVICE_AFFILIATE_ONBOARDING_APPLICATION_CODE', 'affiliate-onboarding'),
        'tenant_slug' => env('AUTH_SERVICE_TENANT_SLUG', 'gleent'),
        'connect_timeout_seconds' => max(1, (int) env('AUTH_SERVICE_CONNECT_TIMEOUT_SECONDS', 3)),
        'timeout_seconds' => max(1, (int) env('AUTH_SERVICE_TIMEOUT_SECONDS', 10)),
    ],

];
