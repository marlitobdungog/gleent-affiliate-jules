<?php

namespace App\Services;

use App\Exceptions\ReferralPartnerConflictException;
use App\Models\Referral;
use Illuminate\Support\Facades\DB;

class ReferralRegistrationService
{
    /**
     * @return array{referral: Referral, created: bool}
     */
    public function register(array $data): array
    {
        $email = mb_strtolower(trim($data['lead_email']));

        return DB::transaction(function () use ($data, $email): array {
            $referral = Referral::withTrashed()
                ->where('product_id', $data['product_id'])
                ->whereRaw('LOWER(lead_email) = ?', [$email])
                ->lockForUpdate()
                ->first();

            if ($referral) {
                if ((int) $referral->partner_id !== (int) $data['partner_id']) {
                    throw new ReferralPartnerConflictException();
                }

                if ($referral->trashed()) {
                    $referral->restore();
                }

                $referral->update([
                    'lead_name' => $data['lead_name'],
                    'lead_email' => $email,
                    'lead_phone' => $data['lead_phone'] ?? $referral->lead_phone,
                    'company_name' => $data['company_name'] ?? $referral->company_name,
                    'notes' => $data['notes'] ?? $referral->notes,
                ]);

                return ['referral' => $referral->fresh(), 'created' => false];
            }

            $data['lead_email'] = $email;

            return ['referral' => Referral::create($data), 'created' => true];
        }, 3);
    }
}
