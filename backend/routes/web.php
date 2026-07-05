<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->middleware('web')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/partner/register', [AuthController::class, 'registerPartner']);
    Route::post('/partner/login', [AuthController::class, 'loginPartner']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get('/admin/{any?}', function () {
    return view('welcome');
})->where('any', '.*');

Route::get('/partner/{any?}', function () {
    return view('welcome');
})->where('any', '.*');
