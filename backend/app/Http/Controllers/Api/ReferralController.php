<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReferralRequest;
use App\Http\Requests\UpdateReferralRequest;
use App\Models\Referral;
use Illuminate\Http\JsonResponse;

class ReferralController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Referral::with(['partner', 'product'])->get());
    }

    public function store(StoreReferralRequest $request): JsonResponse
    {
        $referral = Referral::create($request->validated());
        return response()->json($referral, 201);
    }

    public function show(Referral $referral): JsonResponse
    {
        return response()->json($referral->load(['partner', 'product', 'deals']));
    }

    public function update(UpdateReferralRequest $request, Referral $referral): JsonResponse
    {
        $referral->update($request->validated());
        return response()->json($referral);
    }

    public function destroy(Referral $referral): JsonResponse
    {
        $referral->delete();
        return response()->json(null, 204);
    }
}
