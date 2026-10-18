<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartnerRequest;
use App\Http\Requests\UpdatePartnerRequest;
use App\Models\Partner;
use App\Services\AuthServiceClient;
use App\Services\PartnerAccessService;
use App\Services\PartnerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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

    public function update(UpdatePartnerRequest $request, Partner $partner, PartnerAccessService $accessService, AuthServiceClient $authService): JsonResponse
    {
        $validated = $request->validated();
        DB::transaction(function () use ($partner, $validated, $accessService, $authService) {
            if (isset($validated['status'])) {
                $accessService->syncForStatusChange($partner, $validated['status'], $authService);
            }
            $partner->update($validated);
        });

        return response()->json($partner);
    }

    public function destroy(Partner $partner, PartnerAccessService $accessService, AuthServiceClient $authService): JsonResponse
    {
        DB::transaction(function () use ($partner, $accessService, $authService) {
            $accessService->revoke($partner, $authService);
            $partner->delete();
        });

        return response()->json(null, 204);
    }

    public function activate(Partner $partner, PartnerAccessService $accessService, AuthServiceClient $authService): JsonResponse
    {
        DB::transaction(function () use ($partner, $accessService, $authService) {
            $accessService->syncForStatusChange($partner, 'active', $authService);
            $partner->update(['status' => 'active']);
        });

        return response()->json($partner);
    }

    public function suspend(Partner $partner, PartnerAccessService $accessService, AuthServiceClient $authService): JsonResponse
    {
        DB::transaction(function () use ($partner, $accessService, $authService) {
            $accessService->syncForStatusChange($partner, 'suspended', $authService);
            $partner->update(['status' => 'suspended']);
        });

        return response()->json($partner);
    }
}
