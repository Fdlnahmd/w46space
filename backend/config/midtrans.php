<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Midtrans Payment Gateway Configuration
    |--------------------------------------------------------------------------
    | Server Key & Client Key dapat ditemukan di:
    | Sandbox : https://dashboard.sandbox.midtrans.com → Settings → Access Keys
    | Production: https://dashboard.midtrans.com → Settings → Access Keys
    */

    'server_key'    => env('MIDTRANS_SERVER_KEY'),
    'client_key'    => env('MIDTRANS_CLIENT_KEY'),
    'is_production' => env('MIDTRANS_IS_PRODUCTION', false),

    /*
    | URL Snap berdasarkan environment
    */
    'snap_url' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js',
];
