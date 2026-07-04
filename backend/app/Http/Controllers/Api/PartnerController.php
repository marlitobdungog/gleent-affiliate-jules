<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartnerRequest;
use App\Http\Requests\UpdatePartnerRequest;
use App\Models\Partner;
use App\Services\PartnerService;
use Illuminate\Http\JsonResponse;

class PartnerController extends Controller
{
    protected $partnerService;

    public function __construct(PartnerService $partnerService)
    {
        $this->partnerService = $partnerService;
    }

    public function index(): JsonResponse
    {
        return response()->json(Partner::withCount(['referrals', 'deals', 'commissions'])->get());
    }

    public function store(StorePartnerRequest $request): JsonResponse
    {
        $partner = $this->partnerService->createPartner($request->validated());
        return response()->json($partner, 201);
    }

    public function show(Partner $partner): JsonResponse
    {
        return response()->json($partner->load(['referrals', 'deals', 'commissions', 'payouts']));
    }

    public function update(UpdatePartnerRequest $request, Partner $partner): JsonResponse
    {
        $partner->update($request->validated());
        return response()->json($partner);
    }

    public function destroy(Partner $partner): JsonResponse
    {
        $partner->delete();
        return response()->json(null, 204);
    }

    public function activate(Partner $partner): JsonResponse
    {
        $partner->update(['status' => 'active']);
        return response()->json($partner);
    }

    public function suspend(Partner $partner): JsonResponse
    {
        $partner->update(['status' => 'suspended']);
        return response()->json($partner);
    }
}
