<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PartnerChangePasswordRequest;
use App\Http\Requests\PartnerStoreReferralRequest;
use App\Http\Requests\PartnerUpdateProfileRequest;
use App\Models\MarketingAsset;
use App\Models\Partner;
use App\Models\Referral;
use App\Services\PartnerPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PartnerPortalController extends Controller
{
    public function profile(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getProfile($partner));
    }

    public function updateProfile(PartnerUpdateProfileRequest $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');
        $validated = $request->validated();

        DB::transaction(function () use ($partner, $validated) {
            $partner->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            $partner->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
            ]);
        });

        $partner->refresh()->load('user');

        return response()->json($service->getProfile($partner));
    }

    public function changePassword(PartnerChangePasswordRequest $request): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        $partner->user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function dashboard(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getDashboard($partner));
    }

    public function referrals(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getReferrals($partner));
    }

    public function storeReferral(PartnerStoreReferralRequest $request): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        $referral = Referral::create([
            'partner_id' => $partner->id,
            'product_id' => $request->validated('product_id'),
            'lead_name' => $request->validated('lead_name'),
            'lead_email' => $request->validated('lead_email'),
            'company_name' => $request->validated('company_name'),
            'notes' => $request->validated('notes'),
            'source' => 'manual_submission',
            'status' => 'new',
        ]);

        $referral->load('product');

        return response()->json([
            'id' => (string) $referral->id,
            'lead_name' => $referral->lead_name,
            'company' => $referral->company_name,
            'email' => $referral->lead_email,
            'product' => $referral->product?->name,
            'status' => 'New',
            'status_raw' => $referral->status,
            'submitted_at' => $referral->created_at?->toDateString(),
        ], 201);
    }

    public function leadStages(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getLeadStages($partner));
    }

    public function commissions(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getCommissions($partner));
    }

    public function payouts(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getPayouts($partner));
    }

    public function marketingAssets(PartnerPortalService $service): JsonResponse
    {
        return response()->json($service->getMarketingAssets());
    }

    public function downloadMarketingAsset(Request $request, MarketingAsset $marketingAsset): BinaryFileResponse|JsonResponse
    {
        if (! $marketingAsset->is_active) {
            return response()->json(['message' => 'Asset not available.'], 404);
        }

        $disk = Storage::disk('local');
        if (! $disk->exists($marketingAsset->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $filename = basename($marketingAsset->file_path);

        return response()->download(
            $disk->path($marketingAsset->file_path),
            $filename
        );
    }

    public function products(PartnerPortalService $service): JsonResponse
    {
        return response()->json($service->getProducts());
    }
}
