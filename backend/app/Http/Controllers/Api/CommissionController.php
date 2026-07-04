<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommissionRequest;
use App\Http\Requests\UpdateCommissionRequest;
use App\Models\Commission;
use Illuminate\Http\JsonResponse;

class CommissionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Commission::with(['partner', 'product', 'deal'])->get());
    }

    public function store(StoreCommissionRequest $request): JsonResponse
    {
        $commission = Commission::create($request->validated());
        return response()->json($commission, 201);
    }

    public function show(Commission $commission): JsonResponse
    {
        return response()->json($commission->load(['partner', 'product', 'deal']));
    }

    public function update(UpdateCommissionRequest $request, Commission $commission): JsonResponse
    {
        $commission->update($request->validated());
        return response()->json($commission);
    }

    public function destroy(Commission $commission): JsonResponse
    {
        $commission->delete();
        return response()->json(null, 204);
    }

    public function approve(Commission $commission): JsonResponse
    {
        $commission->update([
            'status' => 'approved',
            'approved_at' => now()
        ]);
        return response()->json($commission);
    }

    public function reject(Commission $commission): JsonResponse
    {
        $commission->update(['status' => 'rejected']);
        return response()->json($commission);
    }

    public function markForPayout(Commission $commission): JsonResponse
    {
        $commission->update(['status' => 'for_payout']);
        return response()->json($commission);
    }
}
