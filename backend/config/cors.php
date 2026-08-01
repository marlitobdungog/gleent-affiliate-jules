<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        'https://gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app,http://localhost:5173,http://localhost:8089'
    ))))),

    'allowed_origins_patterns' => array_values(array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS_PATTERNS',
        '#^https://.*\.a\.run\.app$#,#^http://localhost(:\d+)?$#'
    ))))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
