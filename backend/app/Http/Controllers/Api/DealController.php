<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDealRequest;
use App\Http\Requests\UpdateDealRequest;
use App\Models\Deal;
use App\Services\DealService;
use Illuminate\Http\JsonResponse;

class DealController extends Controller
{
    protected $dealService;

    public function __construct(DealService $dealService)
    {
        $this->dealService = $dealService;
    }

    public function index(): JsonResponse
    {
        return response()->json(Deal::with(['partner', 'product', 'referral'])->get());
    }

    public function store(StoreDealRequest $request): JsonResponse
    {
        $deal = $this->dealService->createDeal($request->validated());
        return response()->json($deal, 201);
    }

    public function show(Deal $deal): JsonResponse
    {
        return response()->json($deal->load(['partner', 'product', 'referral', 'commission']));
    }

    public function update(UpdateDealRequest $request, Deal $deal): JsonResponse
    {
        $deal = $this->dealService->updateDeal($deal, $request->validated());
        return response()->json($deal);
    }

    public function destroy(Deal $deal): JsonResponse
    {
        $deal->delete();
        return response()->json(null, 204);
    }
}
