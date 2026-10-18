<?php

use App\Http\Controllers\Api\AffiliateSsoController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->middleware('web')->group(function () {
    Route::get('/admin/bootstrap-status', [AuthController::class, 'bootstrapStatus']);
    Route::post('/admin/bootstrap', [AuthController::class, 'bootstrapAdmin']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/partner/register', [AuthController::class, 'registerPartner']);
    Route::get('/partner/onboarding', [AffiliateSsoController::class, 'onboardingIdentity']);
    Route::get('/sso/start/login', [AffiliateSsoController::class, 'startLogin']);
    Route::get('/sso/start/apply', [AffiliateSsoController::class, 'startApplication']);
    Route::get('/sso/callback', [AffiliateSsoController::class, 'callback']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get('/admin/{any?}', function () {
    return view('welcome');
})->where('any', '.*');

Route::get('/partner/{any?}', function () {
    return view('welcome');
})->where('any', '.*');
