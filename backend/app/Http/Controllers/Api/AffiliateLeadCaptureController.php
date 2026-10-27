<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AffiliateClickHandoffService;
use App\Services\AffiliateLeadCaptureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateLeadCaptureController extends Controller
{
    public function exchange(Request $request, AffiliateClickHandoffService $service): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:2048'],
        ]);
        $exchange = $service->exchange($validated['token']);

        if (! $exchange) {
            return response()->json(['message' => 'Invalid or expired attribution handoff.'], 404)
                ->header('Cache-Control', 'no-store');
        }

        return response()->json($exchange)->header('Cache-Control', 'no-store');
    }

    public function capture(Request $request, AffiliateLeadCaptureService $service): JsonResponse
    {
        $configuredToken = (string) config('services.affiliate.lead_capture_token');
        $providedToken = (string) $request->bearerToken();

        if ($configuredToken === '') {
            return response()->json(['message' => 'Lead capture is not configured.'], 503)
                ->header('Cache-Control', 'no-store');
        }

        if ($providedToken === '' || ! hash_equals($configuredToken, $providedToken)) {
            return response()->json(['message' => 'Unauthenticated.'], 401)
                ->header('Cache-Control', 'no-store');
        }

        $validated = $request->validate([
            'attribution_token' => ['required', 'string', 'max:4096'],
            'source' => ['required', 'string', 'in:website_demo,website_signup'],
            'signup_status' => ['nullable', 'string', 'in:email_verified,account_created'],
            'external_source_key' => ['nullable', 'string', 'max:150'],
            'lead_name' => ['required', 'string', 'max:255'],
            'lead_email' => ['required', 'email', 'max:255'],
            'lead_phone' => ['nullable', 'string', 'max:40'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:10000'],
        ]);

        $referral = $service->capture($validated);
        if (! $referral) {
            return response()->json(['message' => 'Invalid or expired attribution.'], 422)
                ->header('Cache-Control', 'no-store');
        }

        return response()->json([
            'id' => (string) $referral->id,
            'status' => $referral->status,
            'source' => $referral->source,
            'signup_status' => $referral->signup_status,
        ])->header('Cache-Control', 'no-store');
    }
}
