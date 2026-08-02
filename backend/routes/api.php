<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PartnerPortalController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth');

    Route::get('/dashboard/summary', [DashboardController::class, 'summary'])->middleware('auth');

    Route::apiResource('products', ProductController::class)->middleware('auth');

    Route::apiResource('applications', ApplicationController::class)->middleware('auth');
    Route::post('applications/{application}/approve', [ApplicationController::class, 'approve'])->middleware('auth');
    Route::post('applications/{application}/reject', [ApplicationController::class, 'reject'])->middleware('auth');
    Route::post('applications/{application}/needs-more-info', [ApplicationController::class, 'needsMoreInfo'])->middleware('auth');

    Route::apiResource('partners', PartnerController::class)->middleware('auth');
    Route::post('partners/{partner}/activate', [PartnerController::class, 'activate'])->middleware('auth');
    Route::post('partners/{partner}/suspend', [PartnerController::class, 'suspend'])->middleware('auth');

    Route::apiResource('referrals', ReferralController::class)->middleware('auth');

    Route::apiResource('deals', DealController::class)->middleware('auth');

    Route::apiResource('commissions', CommissionController::class)->middleware('auth');
    Route::post('commissions/{commission}/approve', [CommissionController::class, 'approve'])->middleware('auth');
    Route::post('commissions/{commission}/reject', [CommissionController::class, 'reject'])->middleware('auth');
    Route::post('commissions/{commission}/mark-for-payout', [CommissionController::class, 'markForPayout'])->middleware('auth');

    Route::apiResource('payouts', PayoutController::class)->middleware('auth');
    Route::post('payouts/{payout}/mark-paid', [PayoutController::class, 'markPaid'])->middleware('auth');
    Route::post('payouts/{payout}/hold', [PayoutController::class, 'hold'])->middleware('auth');
    Route::post('payouts/{payout}/cancel', [PayoutController::class, 'cancel'])->middleware('auth');

    Route::get('settings', [SettingController::class, 'index'])->middleware('auth');
    Route::put('settings', [SettingController::class, 'update'])->middleware('auth');

    Route::middleware(['auth', 'partner'])->prefix('partner')->group(function () {
        Route::get('profile', [PartnerPortalController::class, 'profile']);
        Route::put('profile', [PartnerPortalController::class, 'updateProfile']);
        Route::put('password', [PartnerPortalController::class, 'changePassword']);
        Route::get('dashboard', [PartnerPortalController::class, 'dashboard']);
        Route::get('referrals', [PartnerPortalController::class, 'referrals']);
        Route::post('referrals', [PartnerPortalController::class, 'storeReferral']);
        Route::get('lead-stages', [PartnerPortalController::class, 'leadStages']);
        Route::get('commissions', [PartnerPortalController::class, 'commissions']);
        Route::get('payouts', [PartnerPortalController::class, 'payouts']);
        Route::get('products', [PartnerPortalController::class, 'products']);
        Route::get('marketing-assets', [PartnerPortalController::class, 'marketingAssets']);
        Route::get('marketing-assets/{marketingAsset}/download', [PartnerPortalController::class, 'downloadMarketingAsset']);
    });
});



