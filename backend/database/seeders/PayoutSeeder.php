<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\Payout;
use Illuminate\Database\Seeder;

class PayoutSeeder extends Seeder
{
    public function run(): void
    {
        $partner = Partner::first();

        Payout::create([
            'partner_id' => $partner->id,
            'amount' => 5000,
            'payment_method' => 'Bank Transfer',
            'payment_reference' => 'REF-12345',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        Payout::create([
            'partner_id' => $partner->id,
            'amount' => 2500,
            'status' => 'pending',
        ]);
    }
}
