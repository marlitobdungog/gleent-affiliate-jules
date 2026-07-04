<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Deal;

class CommissionService
{
    public function createFromDeal(Deal $deal)
    {
        if ($deal->status !== 'won') {
            return null;
        }

        // Check if commission already exists for this deal
        if (Commission::where('deal_id', $deal->id)->exists()) {
            return null;
        }

        $partner = $deal->partner;
        $commissionType = $partner->commission_type;
        $commissionRate = $partner->commission_rate;
        $commissionAmount = 0;

        if ($commissionType === 'percentage') {
            $commissionAmount = $deal->deal_value * ($commissionRate / 100);
        } else {
            $commissionAmount = $commissionRate;
        }

        return Commission::create([
            'partner_id' => $deal->partner_id,
            'deal_id' => $deal->id,
            'product_id' => $deal->product_id,
            'base_amount' => $deal->deal_value,
            'commission_type' => $commissionType,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'status' => 'pending_approval',
        ]);
    }
}
