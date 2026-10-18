<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApplicationService
{
    public function __construct(
        protected PartnerService $partnerService,
        protected AuthServiceClient $authService,
    ) {}

    public function submit(array $data): Application
    {
        if (User::where('account_user_id', $data['account_user_id'])->exists()) {
            throw ValidationException::withMessages([
                'application' => ['This Gleent Account is already linked to an Affiliate account.'],
            ]);
        }

        $pendingApplication = Application::where('email', $data['email'])
            ->whereIn('status', ['submitted', 'under_review', 'needs_more_info'])
            ->first();
        if ($pendingApplication?->account_user_id
            && (string) $pendingApplication->account_user_id !== (string) $data['account_user_id']) {
            throw ValidationException::withMessages([
                'application' => ['A pending application already exists for this email address and is linked to another Account.'],
            ]);
        }
        if (Application::where('account_user_id', $data['account_user_id'])
            ->whereIn('status', ['submitted', 'under_review', 'needs_more_info'])
            ->when($pendingApplication, fn ($query) => $query->where('id', '<>', $pendingApplication->id))
            ->exists()) {
            throw ValidationException::withMessages([
                'application' => ['A pending Affiliate application already exists for this Gleent Account.'],
            ]);
        }

        $applicationData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company_name' => $data['company_name'] ?? null,
            'website' => $data['website'] ?? null,
            'social_link' => $data['social_link'] ?? null,
            'promotion_plan' => $data['promotion_plan'] ?? null,
            'audience_description' => $data['audience_description'] ?? null,
            'account_user_id' => $data['account_user_id'],
            'auth_service_user_id' => $data['auth_service_user_id'],
            'auth_service_tenant_id' => $data['auth_service_tenant_id'],
            'target_product_id' => $data['target_product_id'] ?? $this->defaultTargetProductId(),
            'status' => 'submitted',
        ];

        if ($pendingApplication) {
            $pendingApplication->update($applicationData);

            return $pendingApplication;
        }

        return Application::create($applicationData);
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

        if (! $application->account_user_id || ! $application->auth_service_user_id || ! $application->auth_service_tenant_id) {
            throw ValidationException::withMessages([
                'application' => ['This application is not linked to a verified Gleent Account. Ask the applicant to submit again after signing in.'],
            ]);
        }

        return DB::transaction(function () use ($application) {
            $application->update(['status' => 'approved']);

            $user = User::create([
                'name' => $application->name,
                'email' => $application->email,
                'password' => null,
                'role' => 'partner',
                'account_user_id' => $application->account_user_id,
                'auth_service_user_id' => $application->auth_service_user_id,
                'auth_service_tenant_id' => $application->auth_service_tenant_id,
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

            $this->authService->setAffiliateAccess(
                (string) $user->auth_service_user_id,
                (string) $user->auth_service_tenant_id,
                true,
            );

            return [
                'partner' => $partner,
            ];
        });
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
