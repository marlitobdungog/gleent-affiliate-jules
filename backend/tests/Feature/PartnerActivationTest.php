<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_approve_an_application_and_partner_can_activate_and_log_in(): void
    {
        config(['app.frontend_url' => 'http://localhost:8089']);

        $admin = User::factory()->create(['role' => 'admin']);
        $application = $this->createPartnerApplication();

        $response = $this->actingAs($admin)->postJson("/api/applications/{$application->id}/approve");

        $response
            ->assertOk()
            ->assertJsonStructure([
                'partner' => ['id', 'user_id', 'partner_code'],
                'activation_link',
            ])
            ->assertJsonMissing(['login_credentials']);

        $activationLink = $response->json('activation_link');
        parse_str((string) parse_url($activationLink, PHP_URL_QUERY), $parameters);

        $this->postJson('/api/partner/activate', [
            'email' => $parameters['email'],
            'token' => $parameters['token'],
            'password' => 'new-partner-password',
            'password_confirmation' => 'new-partner-password',
        ])->assertOk();

        $this->postJson('/api/partner/login', [
            'email' => $application->email,
            'password' => 'new-partner-password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'partner');

        $this->postJson('/api/partner/activate', [
            'email' => $parameters['email'],
            'token' => $parameters['token'],
            'password' => 'another-password',
            'password_confirmation' => 'another-password',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'This activation link is invalid or has expired.');
    }

    public function test_partner_cannot_manage_applications(): void
    {
        $partner = User::factory()->create(['role' => 'partner']);
        $application = $this->createPartnerApplication();

        $this->actingAs($partner)
            ->postJson("/api/applications/{$application->id}/approve")
            ->assertForbidden()
            ->assertJsonPath('message', 'Access denied.');
    }

    private function createPartnerApplication(): Application
    {
        $product = Product::create([
            'name' => 'SprintHR',
            'slug' => 'sprinthr',
            'status' => 'active',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);

        return Application::create([
            'name' => 'Partner Applicant',
            'email' => 'partner@example.com',
            'target_product_id' => $product->id,
        ]);
    }
}
