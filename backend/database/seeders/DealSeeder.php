<?php

namespace Database\Seeders;

use App\Models\Deal;
use App\Models\Partner;
use App\Models\Product;
use App\Models\Referral;
use Illuminate\Database\Seeder;

class DealSeeder extends Seeder
{
    public function run(): void
    {
        $partner = Partner::first();
        $product = Product::first();
        $referral = Referral::where('status', 'closed_won')->first() ?? Referral::first();

        Deal::create([
            'referral_id' => $referral->id,
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'client_name' => 'Dunder Mifflin',
            'deal_name' => 'SprintHR Implementation',
            'deal_value' => 50000,
            'status' => 'won',
            'closed_at' => now(),
        ]);

        Deal::create([
            'referral_id' => $referral->id,
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'client_name' => 'Schrute Farms',
            'deal_name' => 'Payroll System',
            'deal_value' => 25000,
            'status' => 'open',
        ]);

        Deal::create([
            'referral_id' => $referral->id,
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'client_name' => 'Wernham Hogg',
            'deal_name' => 'Full Suite',
            'deal_value' => 100000,
            'status' => 'won',
            'closed_at' => now(),
        ]);
    }
}
