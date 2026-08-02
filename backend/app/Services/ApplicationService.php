<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ApplicationService
{
    public function __construct(protected PartnerService $partnerService) {}

    public function submit(array $data): Application
    {
        return Application::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company_name' => $data['company_name'] ?? null,
            'website' => $data['website'] ?? null,
            'social_link' => $data['social_link'] ?? null,
            'promotion_plan' => $data['promotion_plan'] ?? null,
            'audience_description' => $data['audience_description'] ?? null,
            'target_product_id' => $data['target_product_id'] ?? $this->defaultTargetProductId(),
            'status' => 'submitted',
        ]);
    }

    public function approve(Application $application): array
    {
        if ($application->status === 'approved') {
            throw ValidationException::withMessages([
                'application' => ['This application has already been approved.'],
            ]);
        }

        if (User::where('email', $application->email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['A user account with this email already exists.'],
            ]);
        }

        return DB::transaction(function () use ($application) {
            $application->update(['status' => 'approved']);

            $user = User::create([
                'name' => $application->name,
                'email' => $application->email,
                'password' => Hash::make(Str::random(64)),
                'role' => 'partner',
            ]);

            $defaultType = Setting::where('key', 'default_commission_type')->value('value') ?? 'percentage';
            $defaultRate = Setting::where('key', 'default_commission_rate')->value('value') ?? 10;

            $partner = $this->partnerService->createPartner([
                'user_id' => $user->id,
                'name' => $application->name,
                'email' => $application->email,
                'phone' => $application->phone,
                'company_name' => $application->company_name,
                'status' => 'active',
                'commission_type' => $defaultType,
                'commission_rate' => $defaultRate,
                'joined_at' => now(),
                'approved_at' => now(),
            ]);

            return [
                'partner' => $partner,
                'activation_link' => $this->createActivationLink($user),
            ];
        });
    }

    public function createActivationLink(User $user): string
    {
        $token = Password::createToken($user);

        return rtrim((string) config('app.url'), '/').'/partner/activate?'.http_build_query([
            'email' => $user->email,
            'token' => $token,
        ]);
    }

    public function createActivationLinkFor(Application $application): string
    {
        $user = User::where('email', $application->email)
            ->where('role', 'partner')
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'application' => ['No partner account exists for this application.'],
            ]);
        }

        return $this->createActivationLink($user);
    }

    protected function defaultTargetProductId(): int
    {
        $productId = Product::where('slug', 'sprinthr')->value('id')
            ?? Product::where('status', 'active')->value('id');

        if (! $productId) {
            throw ValidationException::withMessages([
                'target_product_id' => ['No default product is configured.'],
            ]);
        }

        return $productId;
    }
}
