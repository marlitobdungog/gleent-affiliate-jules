<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\PartnerProductEligibility;
use App\Models\Product;
use App\Models\ProductAffiliateLink;
use App\Models\ProductAffiliateLinkClick;
use App\Models\ProductAffiliateSetting;
use App\Models\ProductLandingPage;
use App\Models\Referral;
use App\Models\Setting;
use App\Models\User;
use App\Services\AffiliateClickAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerAffiliateLinksTest extends TestCase
{
    use RefreshDatabase;

    public function test_partner_sees_only_eligible_active_products_and_their_published_pages(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $eligible = $this->product('Eligible Product');
        $unassigned = $this->product('Unassigned Product');
        $inactive = $this->product('Inactive Product', 'inactive');
        $this->grant($partner, $eligible);
        $defaultPage = $this->landingPage($eligible, 'Primary', 'https://eligible.example/main', true);
        $this->landingPage($eligible, 'Archived', 'https://eligible.example/old', false, false);
        $this->landingPage($unassigned, 'Other', 'https://unassigned.example', true);

        Setting::updateOrCreate(['key' => 'default_attribution_window_days'], ['value' => '45']);
        ProductAffiliateSetting::create([
            'product_id' => $eligible->id,
            'tracking_mode' => 'direct',
            'referral_parameter' => 'partner',
            'attribution_window_days' => null,
        ]);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-products')
            ->assertOk()
            ->assertJsonPath('partner_code', $partner->partner_code)
            ->assertJsonPath('legacy_link', $partner->partner_link)
            ->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.id', $eligible->id)
            ->assertJsonPath('products.0.commission_display', '12.5%')
            ->assertJsonPath('products.0.default_landing_page_id', $defaultPage->id)
            ->assertJsonPath('products.0.attribution_window_days', 45)
            ->assertJsonCount(1, 'products.0.landing_pages');

        $this->assertNotSame($eligible->id, $unassigned->id);
        $this->assertNotSame($eligible->id, $inactive->id);
    }

    public function test_direct_link_is_built_from_server_owned_partner_and_landing_page_data(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Direct Product');
        $product->update(['website_url' => 'https://direct.example']);
        $this->grant($partner, $product);
        $page = $this->landingPage($product, 'Recruitment', 'https://direct.example/jobs?source=campaign#demo', true);
        ProductAffiliateSetting::create([
            'product_id' => $product->id,
            'tracking_mode' => 'direct',
            'referral_parameter' => 'ref',
        ]);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id.'&destination_url=https://evil.example')
            ->assertOk()
            ->assertJsonPath('product_id', $product->id)
            ->assertJsonPath('links.0.landing_page_id', $page->id)
            ->assertJsonPath('links.0.available', true)
            ->assertJsonPath('links.0.is_short_link', true)
            ->assertJsonPath('links.0.destination_url', $page->destination_url);

        $first = $this->getJson('/api/partner/affiliate-links?product_id='.$product->id)->json('links.0.share_url');
        $this->assertSame(
            $first,
            $this->getJson('/api/partner/affiliate-links?product_id='.$product->id)->json('links.0.share_url'),
        );
        $this->assertMatchesRegularExpression('~^http://localhost/[a-hjkmnp-z2-9]{8}$~', $first);
        $this->assertDatabaseCount('product_affiliate_links', 1);

        $shortCode = basename((string) parse_url($first, PHP_URL_PATH));
        $page->update(['destination_url' => 'https://direct.example/new?source=updated']);
        $response = $this->get('/'.$shortCode)
            ->assertStatus(302)
            ->assertHeader('Cache-Control', 'max-age=0, no-store, private');

        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('updated', $query['source']);
        $this->assertSame('PARTNER2026', $query['ref']);
        $this->assertNotEmpty($query['gclick']);

        $this->postJson('/api/affiliate/clicks/verify', ['token' => $query['gclick']])
            ->assertOk()
            ->assertJsonPath('product_slug', $product->slug);

        $this->assertDatabaseCount('product_affiliate_link_clicks', 1);
    }

    public function test_redirect_link_is_stable_tracks_visits_and_resolves_to_current_allowlisted_destination(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Redirect Product');
        $product->update(['website_url' => 'https://redirect.example']);
        $this->grant($partner, $product);
        $page = $this->landingPage($product, 'Main', 'https://redirect.example/start?campaign=spring#signup', true);
        ProductAffiliateSetting::create([
            'product_id' => $product->id,
            'tracking_mode' => 'redirect',
            'referral_parameter' => 'ref',
        ]);

        $first = $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->json('links.0.share_url');
        $second = $this->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->json('links.0.share_url');

        $this->assertSame($first, $second);
        $this->assertMatchesRegularExpression('~^http://localhost/[a-hjkmnp-z2-9]{8}$~', $first);
        $this->assertDatabaseCount('product_affiliate_links', 1);

        $page->update(['destination_url' => 'https://redirect.example/new?source=updated']);
        $response = $this->get(parse_url($first, PHP_URL_PATH))
            ->assertStatus(302)
            ->assertHeader('Cache-Control', 'max-age=0, no-store, private');
        $visitorCookie = strtolower((string) $response->headers->get('Set-Cookie'));
        $this->assertStringContainsString('gleent_visitor=', $visitorCookie);
        $this->assertStringContainsString('httponly', $visitorCookie);
        $this->assertStringContainsString('samesite=lax', $visitorCookie);
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('updated', $query['source']);
        $this->assertSame('PARTNER2026', $query['ref']);
        $this->assertNotEmpty($query['gclick']);

        $this->assertSame(1, ProductAffiliateLinkClick::count());
        $this->assertNotEmpty(ProductAffiliateLinkClick::first()?->click_id);
    }

    public function test_redirect_link_fails_closed_after_product_access_or_landing_page_is_disabled(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Managed Product');
        $product->update(['website_url' => 'https://managed.example']);
        $eligibility = $this->grant($partner, $product);
        $page = $this->landingPage($product, 'Main', 'https://managed.example', true);
        ProductAffiliateSetting::create([
            'product_id' => $product->id,
            'tracking_mode' => 'redirect',
            'referral_parameter' => 'ref',
        ]);

        $shareUrl = $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->json('links.0.share_url');
        $path = parse_url($shareUrl, PHP_URL_PATH);

        $eligibility->update(['is_active' => false]);
        $this->get($path)->assertNotFound();
        $this->assertSame(0, ProductAffiliateLinkClick::count());

        $eligibility->update(['is_active' => true]);
        $page->update(['is_active' => false]);
        $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->assertJsonPath('links.0.share_url', $shareUrl)
            ->assertJsonPath('links.0.available', false)
            ->assertJsonPath('links.0.status', 'inactive');
        $this->get($path)->assertNotFound();
        $this->assertSame(0, ProductAffiliateLinkClick::count());
    }

    public function test_legacy_redirect_token_still_resolves_after_short_links_are_enabled(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Legacy Redirect Product');
        $product->update(['website_url' => 'https://legacy-redirect.example']);
        $this->grant($partner, $product);
        $this->landingPage($product, 'Main', 'https://legacy-redirect.example/start', true);
        ProductAffiliateSetting::create([
            'product_id' => $product->id,
            'tracking_mode' => 'redirect',
            'referral_parameter' => 'ref',
        ]);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk();

        $legacyToken = ProductAffiliateLink::query()->sole()->token;
        $response = $this->get('/api/r/'.$legacyToken)->assertStatus(302);
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertSame('PARTNER2026', $query['ref']);
        $this->assertNotEmpty($query['gclick']);
        $this->assertSame(1, ProductAffiliateLinkClick::count());
    }

    public function test_click_handoff_rejects_tampered_and_expired_tokens(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Handoff Product');
        $product->update(['website_url' => 'https://handoff.example']);
        $this->grant($partner, $product);
        $this->landingPage($product, 'Main', 'https://handoff.example/start', true);
        ProductAffiliateSetting::create([
            'product_id' => $product->id,
            'tracking_mode' => 'direct',
            'referral_parameter' => 'ref',
        ]);

        $shareUrl = $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->json('links.0.share_url');
        $response = $this->get(parse_url($shareUrl, PHP_URL_PATH))->assertStatus(302);
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $validToken = $query['gclick'];
        $tamperedToken = ($validToken[0] === 'a' ? 'b' : 'a').substr($validToken, 1);

        $this->postJson('/api/affiliate/clicks/verify', ['token' => $tamperedToken])->assertNotFound();

        $this->travel(11)->minutes();
        $this->postJson('/api/affiliate/clicks/verify', ['token' => $validToken])->assertNotFound();
    }

    public function test_partner_analytics_aggregates_clicks_and_unique_visitors_across_links(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Analytics Product');
        $product->update(['website_url' => 'https://analytics.example']);
        $this->grant($partner, $product);
        $this->landingPage($product, 'Main', 'https://analytics.example/main', true);
        $this->landingPage($product, 'Recruitment', 'https://analytics.example/jobs', false);

        $links = $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->json('links');
        $this->assertCount(2, $links);

        $visitorToken = str_repeat('a', 64);
        $firstPath = parse_url($links[0]['share_url'], PHP_URL_PATH);
        $secondPath = parse_url($links[1]['share_url'], PHP_URL_PATH);

        $this->withUnencryptedCookie('gleent_visitor', $visitorToken)->get($firstPath)->assertStatus(302);
        $this->withUnencryptedCookie('gleent_visitor', $visitorToken)->get($firstPath)->assertStatus(302);
        $this->withUnencryptedCookie('gleent_visitor', $visitorToken)->get($secondPath)->assertStatus(302);

        Referral::create([
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'lead_name' => 'Analytics Lead',
            'lead_email' => 'analytics-lead@example.com',
            'company_name' => 'Analytics Co',
            'source' => 'manual_submission',
            'status' => 'new',
        ]);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/analytics/overview?range=all')
            ->assertOk()
            ->assertJsonPath('metrics.total_clicks', 3)
            ->assertJsonPath('metrics.unique_clicks', 1)
            ->assertJsonPath('metrics.referrals', 1)
            ->assertJsonPath('metrics.conversion_rate', 100)
            ->assertJsonPath('timezone', 'Asia/Manila');

        $linkAnalytics = $this->actingAs($partnerUser)
            ->getJson('/api/partner/analytics/links?product_id='.$product->id.'&range=all')
            ->assertOk()
            ->json('links');

        $this->assertSame(2, $linkAnalytics[0]['total_clicks']);
        $this->assertSame(1, $linkAnalytics[0]['unique_clicks']);
        $this->assertNull($linkAnalytics[0]['referrals']);
        $this->assertSame(1, $linkAnalytics[1]['total_clicks']);
        $this->assertSame(1, $linkAnalytics[1]['unique_clicks']);

        $this->assertDatabaseHas('product_affiliate_link_clicks', [
            'visitor_key_hash' => hash('sha256', $visitorToken),
            'is_countable' => true,
        ]);
    }

    public function test_analytics_excludes_prefetches_and_redirect_survives_a_failed_click_write(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $product = $this->product('Resilient Analytics Product');
        $product->update(['website_url' => 'https://resilient.example']);
        $this->grant($partner, $product);
        $this->landingPage($product, 'Main', 'https://resilient.example/main', true);

        $shareUrl = $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$product->id)
            ->assertOk()
            ->json('links.0.share_url');
        $path = parse_url($shareUrl, PHP_URL_PATH);

        $this->withHeaders([
            'User-Agent' => 'Slackbot-LinkExpanding',
            'Purpose' => 'prefetch',
        ])->get($path)->assertStatus(302);

        $this->assertDatabaseHas('product_affiliate_link_clicks', [
            'is_countable' => false,
            'exclusion_reason' => 'prefetch',
            'visitor_key_hash' => null,
        ]);

        $analytics = \Mockery::mock(AffiliateClickAnalyticsService::class);
        $analytics->shouldReceive('recordVisit')
            ->once()
            ->andReturn(['click' => null, 'visitor_cookie' => null]);
        $this->instance(AffiliateClickAnalyticsService::class, $analytics);

        $response = $this->get($path)->assertStatus(302);
        $destination = (string) $response->headers->get('Location');
        parse_str((string) parse_url($destination, PHP_URL_QUERY), $query);

        $this->assertSame('PARTNER2026', $query['ref']);
        $this->assertArrayNotHasKey('gclick', $query);
    }

    public function test_partner_analytics_cannot_read_another_partners_links_and_validates_range(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $otherUser = User::factory()->create(['role' => 'partner']);
        $otherPartner = Partner::create([
            'user_id' => $otherUser->id,
            'name' => 'Partner Two',
            'email' => $otherUser->email,
            'partner_code' => 'PARTNER2027',
            'partner_link' => 'https://legacy.example/ref/PARTNER2027',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 10,
        ]);
        $ownedProduct = $this->product('Owned Analytics Product');
        $otherProduct = $this->product('Other Analytics Product');
        $this->grant($partner, $ownedProduct);
        $this->grant($otherPartner, $otherProduct);
        $this->landingPage($ownedProduct, 'Main', 'https://owned.example', true);
        $this->landingPage($otherProduct, 'Main', 'https://other.example', true);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/analytics/links?product_id='.$otherProduct->id)
            ->assertNotFound();

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/analytics/overview?range=365d')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('range');
    }

    public function test_partner_cannot_generate_or_submit_for_an_unassigned_product(): void
    {
        [$partnerUser, $partner] = $this->partner();
        $assigned = $this->product('Assigned Product');
        $unassigned = $this->product('Private Product');
        $this->grant($partner, $assigned);
        $this->landingPage($assigned, 'Main', 'https://assigned.example', true);
        $this->landingPage($unassigned, 'Main', 'https://private.example', true);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/products')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $assigned->id);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/affiliate-links?product_id='.$unassigned->id)
            ->assertNotFound();

        $this->actingAs($partnerUser)
            ->postJson('/api/partner/referrals', [
                'product_id' => $unassigned->id,
                'lead_name' => 'Lead One',
                'lead_email' => 'lead@example.com',
                'company_name' => 'Example Co',
            ])
            ->assertNotFound();

        $this->actingAs($partnerUser)
            ->postJson('/api/partner/referrals', [
                'product_id' => $assigned->id,
                'lead_name' => 'Lead One',
                'lead_email' => 'lead@example.com',
                'company_name' => 'Example Co',
            ])
            ->assertCreated();

        $this->assertDatabaseCount('referrals', 1);
    }

    public function test_admin_can_assign_only_active_products_and_non_admin_cannot_manage_eligibility(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$partnerUser, $partner] = $this->partner();
        $active = $this->product('Selectable Product');
        $inactive = $this->product('Unavailable Product', 'inactive');

        $this->actingAs($admin)
            ->getJson("/api/partners/{$partner->id}/eligible-products")
            ->assertOk()
            ->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.is_eligible', false);

        $this->actingAs($admin)
            ->putJson("/api/partners/{$partner->id}/eligible-products", ['product_ids' => [$active->id]])
            ->assertOk()
            ->assertJsonPath('products.0.is_eligible', true);

        $this->assertDatabaseHas('partner_product_eligibilities', [
            'partner_id' => $partner->id,
            'product_id' => $active->id,
            'is_active' => true,
            'granted_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->putJson("/api/partners/{$partner->id}/eligible-products", ['product_ids' => [$inactive->id]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('product_ids.0');

        $this->actingAs($partnerUser)
            ->putJson("/api/partners/{$partner->id}/eligible-products", ['product_ids' => []])
            ->assertForbidden();
    }

    private function partner(): array
    {
        $user = User::factory()->create(['role' => 'partner']);
        $partner = Partner::create([
            'user_id' => $user->id,
            'name' => 'Partner One',
            'email' => $user->email,
            'partner_code' => 'PARTNER2026',
            'partner_link' => 'https://legacy.example/ref/PARTNER2026',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 12.5,
        ]);

        return [$user, $partner];
    }

    private function product(string $name, string $status = 'active'): Product
    {
        static $sequence = 0;
        $sequence++;

        return Product::create([
            'name' => $name,
            'slug' => 'product-'.$sequence,
            'website_url' => 'https://'.strtolower(str_replace(' ', '', $name)).'.example',
            'status' => $status,
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);
    }

    private function grant(Partner $partner, Product $product): PartnerProductEligibility
    {
        return PartnerProductEligibility::create([
            'partner_id' => $partner->id,
            'product_id' => $product->id,
            'is_active' => true,
        ]);
    }

    private function landingPage(Product $product, string $name, string $url, bool $default, bool $active = true): ProductLandingPage
    {
        return ProductLandingPage::create([
            'product_id' => $product->id,
            'name' => $name,
            'destination_url' => $url,
            'is_default' => $default,
            'is_active' => $active,
        ]);
    }
}
