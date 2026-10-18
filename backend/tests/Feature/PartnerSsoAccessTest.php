<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Partner;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PartnerSsoAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.auth_service.base_url' => 'https://auth.test',
            'services.auth_service.internal_api_key' => 'test-internal-key',
            'services.auth_service.application_code' => 'affiliate',
            'services.auth_service.onboarding_application_code' => 'affiliate-onboarding',
            'services.auth_service.affiliate_client_id' => 'affiliate-client',
            'services.auth_service.affiliate_client_secret' => 'affiliate-secret',
            'services.auth_service.onboarding_client_id' => 'affiliate-onboarding-client',
            'services.auth_service.onboarding_client_secret' => 'affiliate-onboarding-secret',
            'services.auth_service.callback_url' => 'http://localhost:8089/api/sso/callback',
            'services.auth_service.tenant_slug' => 'gleent',
        ]);
    }

    public function test_account_signed_in_application_creates_partner_without_password_and_grants_access(): void
    {
        Http::fake(['https://auth.test/v1/users/*/applications/affiliate' => Http::response([], 200)]);
        $product = $this->createProduct();
        $admin = User::factory()->create(['role' => 'admin']);
        $application = Application::create([
            'name' => 'Account Partner',
            'email' => 'partner@gleent.test',
            'account_user_id' => '42',
            'auth_service_user_id' => 'fe405033-3547-4337-80b8-dcf628aa3c26',
            'auth_service_tenant_id' => '11111111-1111-4111-8111-111111111111',
            'target_product_id' => $product->id,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/applications/{$application->id}/approve")
            ->assertOk()
            ->assertJsonStructure(['partner' => ['id', 'user_id', 'partner_code']])
            ->assertJsonMissingPath('activation_link');

        $user = User::where('email', 'partner@gleent.test')->firstOrFail();
        $this->assertNull($user->password);
        $this->assertSame('42', $user->account_user_id);
        $this->assertDatabaseHas('partners', ['user_id' => $user->id, 'status' => 'active']);

        Http::assertSent(fn ($request) => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/v1/users/fe405033-3547-4337-80b8-dcf628aa3c26/applications/affiliate')
            && $request->header('X-API-Key')[0] === 'test-internal-key'
            && $request['enabled'] === true
            && $request['tenant_id'] === '11111111-1111-4111-8111-111111111111');
    }

    public function test_pending_application_without_account_link_cannot_be_approved(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $application = Application::create([
            'name' => 'Legacy Applicant',
            'email' => 'legacy@gleent.test',
            'target_product_id' => $this->createProduct()->id,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/applications/{$application->id}/approve")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('application');

        $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'submitted']);
        $this->assertDatabaseMissing('users', ['email' => 'legacy@gleent.test']);
        Http::assertNothingSent();
    }

    public function test_partner_suspension_revokes_auth_service_access(): void
    {
        Http::fake(['https://auth.test/v1/users/*/applications/affiliate' => Http::response([], 200)]);
        $admin = User::factory()->create(['role' => 'admin']);
        $partnerUser = User::factory()->create([
            'role' => 'partner',
            'account_user_id' => '42',
            'auth_service_user_id' => 'fe405033-3547-4337-80b8-dcf628aa3c26',
            'auth_service_tenant_id' => '11111111-1111-4111-8111-111111111111',
        ]);
        $partner = Partner::create([
            'user_id' => $partnerUser->id,
            'name' => $partnerUser->name,
            'email' => $partnerUser->email,
            'partner_code' => 'TEST2026',
            'partner_link' => 'https://example.test/ref/TEST2026',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 10,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/partners/{$partner->id}/suspend")
            ->assertOk()
            ->assertJsonPath('status', 'suspended');

        Http::assertSent(fn ($request) => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/v1/users/fe405033-3547-4337-80b8-dcf628aa3c26/applications/affiliate')
            && $request['enabled'] === false);

        $this->actingAs($partnerUser)
            ->getJson('/api/partner/dashboard')
            ->assertUnauthorized();
    }

    public function test_application_submission_uses_identity_from_account_session_not_request_body(): void
    {
        $product = $this->createProduct();
        $this->withSession(['affiliate_onboarding_identity' => [
            'account_user_id' => '42',
            'user_id' => 'fe405033-3547-4337-80b8-dcf628aa3c26',
            'tenant_id' => '11111111-1111-4111-8111-111111111111',
            'tenant_slug' => 'gleent',
            'account_email' => 'verified@gleent.test',
            'account_name' => 'Verified Account Name',
            'account_email_verified' => true,
        ]])->postJson('/api/partner/register', [
            'name' => 'Forged Name',
            'email' => 'forged@example.test',
            'company_name' => 'Partner Co',
            'target_product_id' => $product->id,
        ])->assertCreated()
            ->assertJsonPath('application.name', 'Verified Account Name')
            ->assertJsonPath('application.email', 'verified@gleent.test');

        $this->assertDatabaseHas('applications', [
            'account_user_id' => '42',
            'auth_service_user_id' => 'fe405033-3547-4337-80b8-dcf628aa3c26',
        ]);
    }

    public function test_existing_approved_partner_links_by_verified_account_email_then_uses_affiliate_oauth(): void
    {
        $identity = [
            'access_token' => 'server-side-token',
            'expires_in' => 900,
            'user_id' => 'fe405033-3547-4337-80b8-dcf628aa3c26',
            'account_user_id' => '42',
            'account_email' => 'partner@gleent.test',
            'account_name' => 'Account Partner',
            'account_email_verified' => true,
            'tenant_id' => '11111111-1111-4111-8111-111111111111',
            'tenant_slug' => 'gleent',
            'application_code' => 'affiliate-onboarding',
            'scopes' => ['affiliate:apply'],
        ];
        Http::fake([
            'https://auth.test/v1/oauth/token' => Http::sequence()
                ->push($identity)
                ->push(array_merge($identity, ['application_code' => 'affiliate', 'scopes' => []])),
            'https://auth.test/v1/users/*/applications/affiliate' => Http::response([], 200),
        ]);

        $user = User::factory()->create([
            'role' => 'partner',
            'email' => 'partner@gleent.test',
            'account_user_id' => null,
            'auth_service_user_id' => null,
            'auth_service_tenant_id' => null,
        ]);
        $partner = Partner::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'partner_code' => 'LINK2026',
            'partner_link' => 'https://example.test/ref/LINK2026',
            'status' => 'active',
            'commission_type' => 'percentage',
            'commission_rate' => 10,
        ]);

        $state = 'onboarding-state-0123456789abcdef';
        $response = $this->withSession(['affiliate_oauth_flows' => [
            $state => [
                'state' => $state,
                'verifier' => str_repeat('v', 64),
                'client_type' => 'onboarding',
                'intent' => 'login',
                'created_at' => now()->timestamp,
            ],
        ]])->get('/api/sso/callback?'.http_build_query(['code' => 'onboarding-code', 'state' => $state]));

        $response->assertRedirect();
        $this->assertStringContainsString('auth.test/v1/oauth/authorize?', $response->headers->get('Location'));
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('affiliate-client', $query['client_id']);
        $this->assertSame('code', $query['response_type']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertSame('42', User::findOrFail($user->id)->account_user_id);
        $this->assertSame($partner->id, $user->fresh()->partner->id);

        $affiliateState = $query['state'];
        $this->get('/api/sso/callback?'.http_build_query(['code' => 'affiliate-code', 'state' => $affiliateState]))
            ->assertRedirect('http://localhost:8089/partner/dashboard');

        Http::assertSent(fn ($request) => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/v1/users/fe405033-3547-4337-80b8-dcf628aa3c26/applications/affiliate')
            && $request['enabled'] === true);
    }

    private function createProduct(): Product
    {
        return Product::create([
            'name' => 'SprintHR',
            'slug' => 'sprinthr',
            'status' => 'active',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);
    }
}
