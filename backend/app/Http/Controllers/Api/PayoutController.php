<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePayoutRequest;
use App\Http\Requests\UpdatePayoutRequest;
use App\Models\Payout;
use App\Services\PayoutService;
use Illuminate\Http\JsonResponse;

class PayoutController extends Controller
{
    protected $payoutService;

    public function __construct(PayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
    }

    public function index(): JsonResponse
    {
        return response()->json(Payout::with('partner')->get());
    }

    public function store(StorePayoutRequest $request): JsonResponse
    {
        $payout = Payout::create($request->validated());
        return response()->json($payout, 201);
    }

    public function show(Payout $payout): JsonResponse
    {
        return response()->json($payout->load('partner'));
    }

    public function update(UpdatePayoutRequest $request, Payout $payout): JsonResponse
    {
        $payout->update($request->validated());
        return response()->json($payout);
    }

    public function destroy(Payout $payout): JsonResponse
    {
        $payout->delete();
        return response()->json(null, 204);
    }

    public function markPaid(Payout $payout): JsonResponse
    {
        $this->payoutService->markAsPaid($payout);
        return response()->json($payout);
    }

    public function hold(Payout $payout): JsonResponse
    {
        $payout->update(['status' => 'on_hold']);
        return response()->json($payout);
    }

    public function cancel(Payout $payout): JsonResponse
    {
        $payout->update(['status' => 'cancelled']);
        return response()->json($payout);
    }
}
