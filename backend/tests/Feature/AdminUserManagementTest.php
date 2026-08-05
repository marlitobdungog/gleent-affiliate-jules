<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_admins(): void
    {
        $primaryAdmin = User::factory()->create([
            'name' => 'Primary Admin',
            'role' => 'admin',
            'is_primary_admin' => true,
        ]);
        $secondaryAdmin = User::factory()->create([
            'name' => 'Secondary Admin',
            'role' => 'admin',
            'is_primary_admin' => false,
        ]);
        User::factory()->create(['role' => 'partner']);

        $this->actingAs($primaryAdmin)
            ->getJson('/api/admin-users')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', $primaryAdmin->id)
            ->assertJsonPath('0.is_primary_admin', true)
            ->assertJsonFragment([
                'id' => $secondaryAdmin->id,
                'name' => 'Secondary Admin',
                'is_primary_admin' => false,
            ])
            ->assertJsonMissingPath('0.password');
    }

    public function test_admin_can_create_secondary_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->postJson('/api/admin-users', [
                'name' => 'New Admin',
                'email' => 'new-admin@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'partner',
                'is_primary_admin' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('name', 'New Admin')
            ->assertJsonPath('email', 'new-admin@example.com')
            ->assertJsonPath('is_primary_admin', false)
            ->assertJsonMissingPath('password');

        $this->assertDatabaseHas('users', [
            'email' => 'new-admin@example.com',
            'role' => 'admin',
            'is_primary_admin' => false,
        ]);
        $this->assertTrue(Hash::check('password123', User::where('email', 'new-admin@example.com')->value('password')));
    }

    public function test_admin_create_validation_rejects_invalid_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['email' => 'existing@example.com']);

        $this->actingAs($admin)
            ->postJson('/api/admin-users', [
                'name' => 'Duplicate',
                'email' => 'existing@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->actingAs($admin)
            ->postJson('/api/admin-users', [
                'name' => 'Short Password',
                'email' => 'short@example.com',
                'password' => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->actingAs($admin)
            ->postJson('/api/admin-users', [
                'name' => 'Mismatch',
                'email' => 'mismatch@example.com',
                'password' => 'password123',
                'password_confirmation' => 'different123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_unauthenticated_user_cannot_access_admin_user_endpoints(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->getJson('/api/admin-users')->assertUnauthorized();
        $this->postJson('/api/admin-users', [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnauthorized();
        $this->deleteJson("/api/admin-users/{$admin->id}")->assertUnauthorized();
    }

    public function test_partner_cannot_access_admin_user_endpoints_or_settings_updates(): void
    {
        $partner = User::factory()->create(['role' => 'partner']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($partner)->getJson('/api/admin-users')->assertForbidden();
        $this->actingAs($partner)->postJson('/api/admin-users', [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertForbidden();
        $this->actingAs($partner)->deleteJson("/api/admin-users/{$admin->id}")->assertForbidden();
        $this->actingAs($partner)->putJson('/api/settings', [
            'affiliate_program_status' => 'inactive',
        ])->assertForbidden();
    }

    public function test_admin_can_delete_secondary_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $secondaryAdmin = User::factory()->create(['role' => 'admin', 'is_primary_admin' => false]);

        $this->actingAs($admin)
            ->deleteJson("/api/admin-users/{$secondaryAdmin->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $secondaryAdmin->id]);
    }

    public function test_admin_cannot_delete_primary_admin_or_self(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $primaryAdmin = User::factory()->create(['role' => 'admin', 'is_primary_admin' => true]);

        $this->actingAs($admin)
            ->deleteJson("/api/admin-users/{$primaryAdmin->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'The primary administrator account cannot be deleted.');

        $this->assertDatabaseHas('users', ['id' => $primaryAdmin->id]);

        $this->actingAs($admin)
            ->deleteJson("/api/admin-users/{$admin->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'You cannot delete your own administrator account.');
    }

    public function test_removed_public_admin_registration_endpoint_cannot_create_admin(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Public Admin',
            'email' => 'public-admin@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'public-admin@example.com']);
    }

    public function test_partner_registration_and_login_still_work(): void
    {
        $product = Product::create([
            'name' => 'SprintHR',
            'slug' => 'sprinthr',
            'status' => 'active',
            'default_commission_type' => 'percentage',
            'default_commission_rate' => 10,
        ]);

        $this->postJson('/api/partner/register', [
            'name' => 'Partner Applicant',
            'email' => 'partner@example.com',
            'company_name' => 'Partner Co',
            'target_product_id' => $product->id,
        ])->assertCreated();

        $application = Application::where('email', 'partner@example.com')->firstOrFail();
        $partner = User::factory()->create([
            'email' => $application->email,
            'password' => 'partner-password',
            'role' => 'partner',
        ]);

        $this->postJson('/api/partner/login', [
            'email' => $partner->email,
            'password' => 'partner-password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'partner');
    }

    public function test_admin_login_still_works(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email' => $admin->email,
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('user.role', 'admin');
    }
}
