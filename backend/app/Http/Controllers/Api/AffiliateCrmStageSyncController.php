<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AffiliateCrmStageSyncController extends Controller
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
            'stage_revision' => ['required', 'integer', 'min:1'],
            'pipeline' => ['required', 'array'],
            'pipeline.id' => ['required', 'integer', 'min:1'],
            'pipeline.name' => ['required', 'string', 'max:255'],
            'stage' => ['required', 'array'],
            'stage.id' => ['required', 'integer', 'min:1'],
            'stage.code' => ['required', 'string', 'max:100'],
            'stage.name' => ['required', 'string', 'max:255'],
            'stage.sort_order' => ['required', 'integer', 'min:0'],
            'stage_updated_at' => ['nullable', 'date'],
        ]);

        $result = DB::transaction(function () use ($validated): array {
            $referral = Referral::query()
                ->whereKey($validated['affiliate_referral_id'])
                ->lockForUpdate()
                ->first();

            if (! $referral) {
                return ['status' => 'not_found'];
            }

            if ($referral->crm_lead_id && (int) $referral->crm_lead_id !== (int) $validated['crm_lead_id']) {
                return ['status' => 'conflict'];
            }

            if ((int) $referral->crm_stage_revision >= (int) $validated['stage_revision']) {
                return ['status' => 'ignored_stale', 'revision' => (int) $referral->crm_stage_revision];
            }

            $referral->forceFill([
                'crm_lead_id' => (int) $validated['crm_lead_id'],
                'crm_pipeline_id' => (int) $validated['pipeline']['id'],
                'crm_pipeline_name' => $validated['pipeline']['name'],
                'crm_stage_id' => (int) $validated['stage']['id'],
                'crm_stage_code' => $validated['stage']['code'],
                'crm_stage_name' => $validated['stage']['name'],
                'crm_stage_sort_order' => (int) $validated['stage']['sort_order'],
                'crm_stage_revision' => (int) $validated['stage_revision'],
                'crm_stage_updated_at' => $validated['stage_updated_at'] ?? now(),
            ])->save();

            return ['status' => 'updated', 'revision' => (int) $validated['stage_revision']];
        }, 3);

        if ($result['status'] === 'not_found') {
            return response()->json(['message' => 'Affiliate referral not found.'], 404)
                ->header('Cache-Control', 'no-store');
        }

        if ($result['status'] === 'conflict') {
            return response()->json(['message' => 'Affiliate referral is already linked to another CRM lead.'], 409)
                ->header('Cache-Control', 'no-store');
        }

        return response()->json($result)->header('Cache-Control', 'no-store');
    }
}
