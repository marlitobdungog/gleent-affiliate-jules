<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'default_partner_link_domain' => 'https://sprinthr.com.ph/ref',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => '10',
            'minimum_payout_amount' => '1000',
            'affiliate_program_status' => 'active',
        ];

        foreach ($settings as $key => $value) {
            Setting::create(['key' => $key, 'value' => $value]);
        }
    }
}
