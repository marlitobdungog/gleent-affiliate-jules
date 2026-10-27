<?php

namespace App\Services;

use App\Exceptions\ReferralPartnerConflictException;
use App\Models\Referral;
use Illuminate\Support\Facades\DB;

class AffiliateLeadCaptureService
{
    public function __construct(private readonly AffiliateClickHandoffService $handoff) {}

    public function capture(array $data): ?Referral
    {
        $email = mb_strtolower(trim($data['lead_email']));

        if (! empty($data['external_source_key'])) {
            $existingSource = Referral::withTrashed()
                ->where('external_source_key', $data['external_source_key'])
                ->first();

            if ($existingSource) {
                if (mb_strtolower(trim($existingSource->lead_email)) !== $email) {
                    return null;
                }

                return DB::transaction(function () use ($existingSource, $data, $email): Referral {
                    $this->restoreForRecapture($existingSource);

                    $existingSource->update([
                        'lead_name' => $data['lead_name'],
                        'lead_email' => $email,
                        'lead_phone' => $data['lead_phone'] ?? $existingSource->lead_phone,
                        'company_name' => $data['company_name'] ?? $existingSource->company_name,
                        'signup_status' => $data['signup_status'] ?? $existingSource->signup_status,
                        'notes' => $data['notes'] ?? $existingSource->notes,
                    ]);

                    return $existingSource->fresh();
                }, 3);
            }
        }

        $attribution = $this->handoff->resolveAttribution($data['attribution_token']);
        if (! $attribution) {
            return null;
        }

        $click = $attribution['click'];
        $product = $attribution['product'];
        $partner = $attribution['partner'];
        $identityHash = hash('sha256', $product->id.'|'.$email);
        $source = $data['source'];

        return DB::transaction(function () use ($data, $click, $product, $partner, $email, $identityHash, $source): Referral {
            $referral = Referral::withTrashed()
                ->where('lead_identity_hash', $identityHash)
                ->lockForUpdate()
                ->first();

            if (! $referral) {
                $referral = Referral::withTrashed()
                    ->where('product_id', $product->id)
                    ->whereRaw('LOWER(lead_email) = ?', [$email])
                    ->lockForUpdate()
                    ->first();
            }

            if ($referral) {
                if ((int) $referral->partner_id !== (int) $partner->id) {
                    throw new ReferralPartnerConflictException();
                }

                $this->restoreForRecapture($referral);

                $updates = ['lead_identity_hash' => $identityHash];

                if ((int) $referral->partner_id === (int) $partner->id && ! $referral->affiliate_click_id
                    && ! in_array($referral->source, ['manual_submission'], true)) {
                    $updates['affiliate_click_id'] = $click->click_id;
                }

                if (! $referral->source) {
                    $updates['source'] = $source;
                }

                if (! $referral->lead_name || $referral->lead_name === $email) {
                    $updates['lead_name'] = $data['lead_name'];
                }

                if (! empty($data['lead_phone'])) {
                    $updates['lead_phone'] = $data['lead_phone'];
                }

                if (! empty($data['company_name'])) {
                    $updates['company_name'] = $data['company_name'];
                }

                if (! empty($data['signup_status'])) {
                    $updates['signup_status'] = $data['signup_status'];
                }

                if (! empty($data['external_source_key']) && ! $referral->external_source_key) {
                    $updates['external_source_key'] = $data['external_source_key'];
                }

                if (! empty($data['notes']) && ! $referral->notes) {
                    $updates['notes'] = $data['notes'];
                }

                $referral->update($updates);

                return $referral->fresh();
            }

            return Referral::create([
                'partner_id' => $partner->id,
                'product_id' => $product->id,
                'affiliate_click_id' => $click->click_id,
                'lead_identity_hash' => $identityHash,
                'external_source_key' => $data['external_source_key'] ?? null,
                'lead_name' => $data['lead_name'],
                'lead_email' => $email,
                'lead_phone' => $data['lead_phone'] ?? null,
                'company_name' => $data['company_name'] ?? null,
                'source' => $source,
                'signup_status' => $data['signup_status'] ?? null,
                'status' => 'new',
                'notes' => $data['notes'] ?? null,
            ]);
        }, 3);
    }

    private function restoreForRecapture(Referral $referral): void
    {
        if ($referral->trashed()) {
            $referral->restore();
        }
    }
}
