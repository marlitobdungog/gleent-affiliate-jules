<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductConfigurationAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_read_and_save_product_affiliate_configuration(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = $this->product();

        $this->actingAs($admin)
            ->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('slug', 'sprinthr')
            ->assertJsonPath('global_attribution_window_days', 30)
            ->assertJsonPath('affiliate_settings', null);

        $this->actingAs($admin)
            ->putJson("/api/products/{$product->id}/affiliate-settings", [
                'tracking_mode' => 'direct',
                'referral_parameter' => 'ref',
                'attribution_window_days' => null,
                'base_destination_url' => 'https://sprinthr.example',
            ])
            ->assertOk()
            ->assertJsonPath('affiliate_settings.tracking_mode', 'direct')
            ->assertJsonPath('affiliate_settings.referral_parameter', 'ref')
            ->assertJsonPath('affiliate_settings.attribution_window_days', null)
            ->assertJsonPath('base_destination_url', 'https://sprinthr.example');

        $this->assertDatabaseHas('product_affiliate_settings', [
            'product_id' => $product->id,
            'tracking_mode' => 'direct',
            'referral_parameter' => 'ref',
            'attribution_window_days' => null,
        ]);
        $this->assertDatabaseHas('product_landing_pages', [
            'product_id' => $product->id,
            'name' => 'Main Website',
            'destination_url' => 'https://sprinthr.example',
            'is_default' => true,
            'is_active' => true,
        ]);
        $this->assertSame(1, ProductConfigurationAudit::where('product_id', $product->id)->count());
    }

    public function test_landing_page_default_is_changed_atomically_and_archiving_selects_a_replacement(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = $this->product();
        $this->actingAs($admin)->putJson("/api/products/{$product->id}/affiliate-settings", [
            'tracking_mode' => 'direct',
            'referral_parameter' => 'ref',
            'base_destination_url' => 'https://sprinthr.example',
        ])->assertOk();

        $secondPage = $this->actingAs($admin)
            ->postJson("/api/products/{$product->id}/landing-pages", [
                'name' => 'Recruitment',
                'destination_url' => 'https://sprinthr.example/recruitment?source=campaign#demo',
            ])
            ->assertCreated()
            ->assertJsonPath('is_default', false)
            ->json();

        $this->actingAs($admin)
            ->postJson("/api/products/{$product->id}/landing-pages/{$secondPage['id']}/make-default")
            ->assertOk()
            ->assertJsonPath('is_default', true);

        $this->putJson("/api/products/{$product->id}/landing-pages/{$secondPage['id']}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('is_active', false)
            ->assertJsonPath('is_default', false);

        $this->assertDatabaseHas('product_landing_pages', [
            'product_id' => $product->id,
            'destination_url' => 'https://sprinthr.example',
            'is_active' => true,
            'is_default' => true,
        ]);
        $this->assertDatabaseHas('product_landing_pages', [
            'id' => $secondPage['id'],
            'is_active' => false,
            'is_default' => false,
        ]);
        $this->assertGreaterThanOrEqual(4, ProductConfigurationAudit::where('product_id', $product->id)->count());
    }

    public function test_product_destinations_reject_non_https_and_unapproved_hosts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = $this->product();

        $this->actingAs($admin)
            ->postJson("/api/products/{$product->id}/landing-pages", [
                'name' => 'Unsafe scheme',
                'destination_url' => 'javascript:alert(1)',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('destination_url');

        $this->actingAs($admin)
            ->postJson("/api/products/{$product->id}/landing-pages", [
                'name' => 'External host',
                'destination_url' => 'https://unapproved.example/path',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('destination_url');

        $this->actingAs($admin)
            ->putJson("/api/products/{$product->id}", ['slug' => 'changed-product-slug'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('slug');

        $this->actingAs($admin)
            ->putJson("/api/products/{$product->id}", ['website_url' => 'https://192.168.1.10'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('website_url');
    }

    public function test_percentage_commission_is_limited_to_one_hundred(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = $this->product();

        $this->actingAs($admin)
            ->putJson("/api/products/{$product->id}", [
                'default_commission_type' => 'percentage',
                'default_commission_rate' => 100.01,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('default_commission_rate');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'default_commission_rate' => '10.00',
        ]);
    }

    public function test_non_admin_cannot_read_or_change_product_configuration(): void
    {
        $partner = User::factory()->create(['role' => 'partner']);
        $product = $this->product();

        $this->actingAs($partner)
            ->getJson("/api/products/{$product->id}")
            ->assertForbidden();

        $this->actingAs($partner)
            ->putJson("/api/products/{$product->id}/affiliate-settings", [
                'tracking_mode' => 'redirect',
                'referral_parameter' => 'ref',
            ])
            ->assertForbidden();
    }

    private function product(): Product
    {
        return Product::create([
            'name' => 'SprintHR',
            'slug' => 'sprinthr',
            'website_url' => 'https://sprinthr.example',
            'status' => 'active',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);
    }
}
