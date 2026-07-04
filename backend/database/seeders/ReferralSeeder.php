<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\Product;
use App\Models\Referral;
use Illuminate\Database\Seeder;

class ReferralSeeder extends Seeder
{
    public function run(): void
    {
        $partner = Partner::first();
        $product = Product::first();

        Referral::create([
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'lead_name' => 'Michael Scott',
            'lead_email' => 'michael@dundermifflin.com',
            'company_name' => 'Dunder Mifflin',
            'status' => 'qualified',
        ]);

        Referral::create([
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'lead_name' => 'Dwight Schrute',
            'lead_email' => 'dwight@schrute-farms.com',
            'status' => 'demo_scheduled',
        ]);

        Referral::create([
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'lead_name' => 'Jim Halpert',
            'lead_email' => 'jim@example.com',
            'status' => 'proposal_sent',
        ]);

        $partner2 = Partner::skip(1)->first();
        Referral::create([
            'partner_id' => $partner2->id,
            'product_id' => $product->id,
            'lead_name' => 'Pam Beesly',
            'lead_email' => 'pam@example.com',
            'status' => 'new',
        ]);

        Referral::create([
            'partner_id' => $partner2->id,
            'product_id' => $product->id,
            'lead_name' => 'Ryan Howard',
            'lead_email' => 'ryan@example.com',
            'status' => 'closed_won',
        ]);
    }
}
