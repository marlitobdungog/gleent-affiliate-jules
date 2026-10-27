<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ReferralPartnerConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReferralRequest;
use App\Http\Requests\UpdateReferralRequest;
use App\Models\Referral;
use App\Services\ReferralRegistrationService;
use Illuminate\Http\JsonResponse;

class ReferralController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Referral::with(['partner', 'product'])->get());
    }

    public function store(StoreReferralRequest $request, ReferralRegistrationService $service): JsonResponse
    {
        try {
            $result = $service->register($request->validated());
        } catch (ReferralPartnerConflictException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        }

        return response()->json($result['referral'], $result['created'] ? 201 : 200);
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
