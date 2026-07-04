<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ProductSeeder::class,
            SettingSeeder::class,
            ApplicationSeeder::class,
            PartnerSeeder::class,
            ReferralSeeder::class,
            DealSeeder::class,
            CommissionSeeder::class,
            PayoutSeeder::class,
        ]);
    }
}
