<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

Route::apiResource('products', ProductController::class);

Route::apiResource('applications', ApplicationController::class);
Route::post('applications/{application}/approve', [ApplicationController::class, 'approve']);
Route::post('applications/{application}/reject', [ApplicationController::class, 'reject']);
Route::post('applications/{application}/needs-more-info', [ApplicationController::class, 'needsMoreInfo']);

Route::apiResource('partners', PartnerController::class);
Route::post('partners/{partner}/activate', [PartnerController::class, 'activate']);
Route::post('partners/{partner}/suspend', [PartnerController::class, 'suspend']);

Route::apiResource('referrals', ReferralController::class);

Route::apiResource('deals', DealController::class);

Route::apiResource('commissions', CommissionController::class);
Route::post('commissions/{commission}/approve', [CommissionController::class, 'approve']);
Route::post('commissions/{commission}/reject', [CommissionController::class, 'reject']);
Route::post('commissions/{commission}/mark-for-payout', [CommissionController::class, 'markForPayout']);

Route::apiResource('payouts', PayoutController::class);
Route::post('payouts/{payout}/mark-paid', [PayoutController::class, 'markPaid']);
Route::post('payouts/{payout}/hold', [PayoutController::class, 'hold']);
Route::post('payouts/{payout}/cancel', [PayoutController::class, 'cancel']);

Route::get('settings', [SettingController::class, 'index']);
Route::put('settings', [SettingController::class, 'update']);
