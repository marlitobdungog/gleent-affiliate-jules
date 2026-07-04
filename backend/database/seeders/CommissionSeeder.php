<?php

namespace Database\Seeders;

use App\Models\Commission;
use App\Models\Deal;
use App\Models\Partner;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CommissionSeeder extends Seeder
{
    public function run(): void
    {
        $deals = Deal::where('status', 'won')->get();

        foreach ($deals as $deal) {
            $partner = $deal->partner;
            $amount = $partner->commission_type === 'percentage'
                ? $deal->deal_value * ($partner->commission_rate / 100)
                : $partner->commission_rate;

            Commission::create([
                'partner_id' => $deal->partner_id,
                'deal_id' => $deal->id,
                'product_id' => $deal->product_id,
                'base_amount' => $deal->deal_value,
                'commission_type' => $partner->commission_type,
                'commission_rate' => $partner->commission_rate,
                'commission_amount' => $amount,
                'status' => 'approved',
                'approved_at' => now(),
            ]);
        }

        // One more pending commission
        $deal = Deal::where('status', 'open')->first();
        if ($deal) {
             Commission::create([
                'partner_id' => $deal->partner_id,
                'deal_id' => $deal->id,
                'product_id' => $deal->product_id,
                'base_amount' => $deal->deal_value,
                'commission_type' => 'percentage',
                'commission_rate' => 10,
                'commission_amount' => $deal->deal_value * 0.1,
                'status' => 'pending_approval',
            ]);
        }
    }
}
