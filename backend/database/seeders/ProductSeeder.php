<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        Product::create([
            'name' => 'SprintHR',
            'slug' => 'sprinthr',
            'description' => 'HR, payroll, attendance, and workforce management platform',
            'status' => 'active',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);
    }
}
