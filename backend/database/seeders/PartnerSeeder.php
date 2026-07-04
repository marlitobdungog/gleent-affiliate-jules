<?php

namespace Database\Seeders;

use App\Models\Partner;
use Illuminate\Database\Seeder;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        Partner::create([
            'name' => 'Alice Cooper',
            'email' => 'alice@example.com',
            'partner_code' => 'ALC2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/ALC2026',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 10,
            'joined_at' => now(),
            'approved_at' => now(),
        ]);

        Partner::create([
            'name' => 'Charlie Brown',
            'email' => 'charlie@example.com',
            'partner_code' => 'CHB2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/CHB2026',
            'status' => 'active',
            'commission_type' => 'fixed',
            'commission_rate' => 500,
            'joined_at' => now(),
            'approved_at' => now(),
        ]);

        Partner::create([
            'name' => 'David Miller',
            'email' => 'david@example.com',
            'partner_code' => 'DVM2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/DVM2026',
            'status' => 'inactive',
            'commission_type' => 'percentage',
            'commission_rate' => 15,
            'joined_at' => now(),
        ]);
    }
}
