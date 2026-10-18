<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\PartnerProductEligibility;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $aliceUser = User::create([
            'name' => 'Alice Cooper',
            'email' => 'alice@example.com',
            'password' => Hash::make('password123'),
            'role' => 'partner',
        ]);

        $alice = Partner::create([
            'user_id' => $aliceUser->id,
            'name' => 'Alice Cooper',
            'email' => 'alice@example.com',
            'phone' => '+1 (555) 234-5678',
            'company_name' => 'Acme Growth Partners',
            'partner_code' => 'ALC2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/ALC2026',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 15,
            'joined_at' => now()->subMonths(8),
            'approved_at' => now()->subMonths(8),
        ]);
        $this->grantDefaultProduct($alice);

        $charlieUser = User::create([
            'name' => 'Charlie Brown',
            'email' => 'charlie@example.com',
            'password' => Hash::make('password123'),
            'role' => 'partner',
        ]);

        $charlie = Partner::create([
            'user_id' => $charlieUser->id,
            'name' => 'Charlie Brown',
            'email' => 'charlie@example.com',
            'partner_code' => 'CHB2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/CHB2026',
            'status' => 'active',
            'commission_type' => 'fixed',
            'commission_rate' => 500,
            'joined_at' => now()->subMonths(4),
            'approved_at' => now()->subMonths(4),
        ]);
        $this->grantDefaultProduct($charlie);

        $david = Partner::create([
            'name' => 'David Miller',
            'email' => 'david@example.com',
            'partner_code' => 'DVM2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/DVM2026',
            'status' => 'inactive',
            'commission_type' => 'percentage',
            'commission_rate' => 15,
            'joined_at' => now()->subMonths(2),
        ]);
        $this->grantDefaultProduct($david);
    }

    private function grantDefaultProduct(Partner $partner): void
    {
        $product = Product::query()->where('status', 'active')->orderBy('id')->first();
        if (! $product) {
            return;
        }

        PartnerProductEligibility::updateOrCreate(
            ['partner_id' => $partner->id, 'product_id' => $product->id],
            ['is_active' => true],
        );
    }
}
