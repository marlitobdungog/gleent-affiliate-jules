<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PartnerStoreReferralRequest;
use App\Http\Requests\PartnerUpdateProfileRequest;
use App\Models\MarketingAsset;
use App\Models\Partner;
use App\Models\PartnerProductEligibility;
use App\Models\Referral;
use App\Services\AffiliateClickHandoffService;
use App\Services\AffiliateLinkService;
use App\Services\PartnerPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            $partner->update([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
            ]);
        });

        $partner->refresh()->load('user');

        return response()->json($service->getProfile($partner));
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

        $eligible = PartnerProductEligibility::query()
            ->where('partner_id', $partner->id)
            ->where('product_id', $request->validated('product_id'))
            ->where('is_active', true)
            ->whereHas('product', fn ($query) => $query->where('status', 'active'))
            ->exists();

        if (! $eligible) {
            return response()->json(['message' => 'Product is not available to this partner.'], 404);
        }

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

    public function marketingAssets(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getMarketingAssets($partner));
    }

    public function downloadMarketingAsset(Request $request, MarketingAsset $marketingAsset, PartnerPortalService $service): BinaryFileResponse|JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        if (! $service->isMarketingAssetAvailable($marketingAsset, $partner)) {
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

    public function products(Request $request, PartnerPortalService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getProducts($partner));
    }

    public function affiliateProducts(Request $request, AffiliateLinkService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');

        return response()->json($service->getAffiliateProducts($partner))
            ->header('Cache-Control', 'private, no-store');
    }

    public function affiliateLinks(Request $request, AffiliateLinkService $service): JsonResponse
    {
        /** @var Partner $partner */
        $partner = $request->attributes->get('partner');
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json($service->getAffiliateLinks($partner, (int) $validated['product_id']))
            ->header('Cache-Control', 'private, no-store');
    }

    public function redirectAffiliateShortLink(string $shortCode, AffiliateLinkService $service, AffiliateClickHandoffService $handoff): RedirectResponse
    {
        $destination = $service->resolveShortRedirect($shortCode, $handoff);

        return redirect()->away($destination, 302)
            ->header('Cache-Control', 'private, no-store, max-age=0')
            ->header('Referrer-Policy', 'no-referrer');
    }

    public function redirectAffiliateLink(string $token, AffiliateLinkService $service, AffiliateClickHandoffService $handoff): RedirectResponse
    {
        $destination = $service->resolveRedirect($token, $handoff);

        return redirect()->away($destination, 302)
            ->header('Cache-Control', 'private, no-store, max-age=0')
            ->header('Referrer-Policy', 'no-referrer');
    }
}
