<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpdateUniqueValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_partner_update_can_keep_the_same_email(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $partner = Partner::create([
            'user_id' => $user->id,
            'name' => 'Joe',
            'email' => 'dungog.marlito@gmail.com',
            'phone' => null,
            'company_name' => 'Joe Coffee',
            'partner_code' => 'JOE2026',
            'partner_link' => 'https://sprinthr.com.ph/ref/JOE2026',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 10,
            'joined_at' => now(),
            'approved_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/partners/{$partner->id}", [
            'name' => 'Joe Updated',
            'email' => 'dungog.marlito@gmail.com',
        ]);

        $response->assertOk();
        $response->assertJsonPath('email', 'dungog.marlito@gmail.com');
        $response->assertJsonPath('name', 'Joe Updated');
    }

    public function test_product_update_can_keep_the_same_slug(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $product = Product::create([
            'name' => 'Referral Plan',
            'slug' => 'referral-plan',
            'description' => 'Default plan',
            'status' => 'active',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/products/{$product->id}", [
            'name' => 'Referral Plan Updated',
            'slug' => 'referral-plan',
        ]);

        $response->assertOk();
        $response->assertJsonPath('slug', 'referral-plan');
        $response->assertJsonPath('name', 'Referral Plan Updated');
    }
}
