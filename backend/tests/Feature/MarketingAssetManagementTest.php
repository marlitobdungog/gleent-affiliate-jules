<?php

namespace Tests\Feature;

use App\Models\MarketingAsset;
use App\Models\Partner;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MarketingAssetManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_a_marketing_asset_and_link_it_to_products(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $product = $this->product();

        $response = $this->actingAs($admin)->post('/api/marketing-assets', [
            'title' => 'Referral Guide',
            'type' => 'Brochure',
            'file' => UploadedFile::fake()->create('referral-guide.pdf', 64, 'application/pdf'),
            'is_active' => true,
            'sort_order' => 2,
            'product_ids' => [$product->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Referral Guide')
            ->assertJsonPath('format', 'PDF')
            ->assertJsonPath('products.0.id', $product->id);

        $asset = MarketingAsset::firstOrFail();
        $this->assertTrue(Storage::disk('local')->exists($asset->file_path));
        $this->assertTrue($asset->products->contains($product));
    }

    public function test_partner_cannot_manage_marketing_assets(): void
    {
        $partner = $this->partnerUser();

        $this->actingAs($partner)
            ->getJson('/api/marketing-assets')
            ->assertForbidden();
    }

    public function test_admin_can_replace_and_delete_a_marketing_asset(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $oldProduct = $this->product('old-product');
        $newProduct = $this->product('new-product');
        $asset = $this->asset('Original guide');
        $asset->products()->attach($oldProduct);
        $oldFilePath = $asset->file_path;

        $this->actingAs($admin)
            ->put("/api/marketing-assets/{$asset->id}", [
                'title' => 'Updated guide',
                'type' => 'Copy',
                'file' => UploadedFile::fake()->create('updated-guide.pdf', 64, 'application/pdf'),
                'is_active' => false,
                'sort_order' => 3,
                'product_ids' => [$newProduct->id],
            ])
            ->assertOk()
            ->assertJsonPath('title', 'Updated guide')
            ->assertJsonPath('is_active', false)
            ->assertJsonPath('products.0.id', $newProduct->id);

        $asset->refresh();
        $this->assertFalse(Storage::disk('local')->exists($oldFilePath));
        $this->assertTrue(Storage::disk('local')->exists($asset->file_path));
        $this->assertTrue($asset->products->contains($newProduct));

        $this->actingAs($admin)
            ->deleteJson("/api/marketing-assets/{$asset->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('marketing_assets', ['id' => $asset->id]);
        $this->assertFalse(Storage::disk('local')->exists($asset->file_path));
    }

    public function test_partner_only_sees_and_downloads_available_assets(): void
    {
        Storage::fake('local');
        $partner = $this->partnerUser();
        $activeProduct = $this->product('active-product', 'active');
        $inactiveProduct = $this->product('inactive-product', 'inactive');

        $generalAsset = $this->asset('General copy');
        $activeAsset = $this->asset('Active product guide');
        $activeAsset->products()->attach($activeProduct);
        $inactiveAsset = $this->asset('Inactive product guide');
        $inactiveAsset->products()->attach($inactiveProduct);

        $response = $this->actingAs($partner)->getJson('/api/partner/marketing-assets');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['title' => $generalAsset->title])
            ->assertJsonFragment(['title' => $activeAsset->title])
            ->assertJsonMissing(['title' => $inactiveAsset->title]);

        $this->actingAs($partner)
            ->get("/api/partner/marketing-assets/{$activeAsset->id}/download")
            ->assertOk();

        $this->actingAs($partner)
            ->getJson("/api/partner/marketing-assets/{$inactiveAsset->id}/download")
            ->assertNotFound();
    }

    private function product(string $slug = 'product', string $status = 'active'): Product
    {
        return Product::create([
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'slug' => $slug,
            'status' => $status,
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);
    }

    private function asset(string $title): MarketingAsset
    {
        $filePath = 'marketing-assets/'.str($title)->slug().'.pdf';
        Storage::disk('local')->put($filePath, 'marketing material');

        return MarketingAsset::create([
            'title' => $title,
            'type' => 'Brochure',
            'format' => 'PDF',
            'file_path' => $filePath,
            'file_size_bytes' => 18,
            'is_active' => true,
        ]);
    }

    private function partnerUser(): User
    {
        $user = User::factory()->create(['role' => 'partner']);
        Partner::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'partner_code' => 'PARTNER'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            'partner_link' => 'https://example.test/ref/partner',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 10,
            'joined_at' => now(),
        ]);

        return $user;
    }
}
