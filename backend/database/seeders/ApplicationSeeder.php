<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $product = Product::first();

        Application::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '09123456789',
            'company_name' => 'JD Consulting',
            'website' => 'https://jdconsulting.com',
            'target_product_id' => $product->id,
            'status' => 'submitted',
        ]);

        Application::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'company_name' => 'JS Marketing',
            'target_product_id' => $product->id,
            'status' => 'under_review',
        ]);

        Application::create([
            'name' => 'Bob Wilson',
            'email' => 'bob@example.com',
            'target_product_id' => $product->id,
            'status' => 'needs_more_info',
        ]);
    }
}
