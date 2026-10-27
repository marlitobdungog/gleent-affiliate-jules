<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AffiliateCrmLeadUnlinkController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $configuredToken = (string) config('services.affiliate.crm_stage_sync_token', '');
        $providedToken = (string) $request->bearerToken();

        if ($configuredToken === '') {
            return response()->json(['message' => 'CRM stage sync is not configured.'], 503)
                ->header('Cache-Control', 'no-store');
        }

        if ($providedToken === '' || ! hash_equals($configuredToken, $providedToken)) {
            return response()->json(['message' => 'Unauthenticated.'], 401)
                ->header('Cache-Control', 'no-store');
        }

        $validated = $request->validate([
            'crm_lead_id' => ['required', 'integer', 'min:1'],
            'affiliate_referral_id' => ['required', 'integer', 'min:1'],
        ]);

        $result = DB::transaction(function () use ($validated): string {
            $referral = Referral::withTrashed()
                ->whereKey($validated['affiliate_referral_id'])
                ->lockForUpdate()
                ->first();

            if (! $referral) {
                return 'not_found';
            }

            if (! $referral->crm_lead_id) {
                return 'already_unlinked';
            }

            if ((int) $referral->crm_lead_id !== (int) $validated['crm_lead_id']) {
                return 'ignored_stale';
            }

            $referral->forceFill([
                'crm_lead_id' => null,
                'crm_pipeline_id' => null,
                'crm_pipeline_name' => null,
                'crm_stage_id' => null,
                'crm_stage_code' => null,
                'crm_stage_name' => null,
                'crm_stage_sort_order' => null,
                'crm_stage_revision' => 0,
                'crm_stage_updated_at' => null,
            ])->save();

            return 'unlinked';
        }, 3);

        return response()->json(['status' => $result])->header('Cache-Control', 'no-store');
    }
}
