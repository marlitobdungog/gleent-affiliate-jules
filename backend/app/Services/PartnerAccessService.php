<?php

namespace App\Services;

use App\Models\Partner;
use Illuminate\Validation\ValidationException;

class PartnerAccessService
{
    public function syncForStatusChange(Partner $partner, string $newStatus, AuthServiceClient $authService): void
    {
        $wasEnabled = in_array($partner->status, ['active', 'approved'], true);
        $willBeEnabled = in_array($newStatus, ['active', 'approved'], true);

        if ($wasEnabled === $willBeEnabled) {
            return;
        }

        $this->setAccess($partner, $willBeEnabled, $authService);
    }

    public function revoke(Partner $partner, AuthServiceClient $authService): void
    {
        $this->setAccess($partner, false, $authService);
    }

    private function setAccess(Partner $partner, bool $enabled, AuthServiceClient $authService): void
    {
        $user = $partner->user;
        if (! $user?->auth_service_user_id || ! $user->auth_service_tenant_id) {
            if ($enabled) {
                throw ValidationException::withMessages([
                    'status' => ['This partner must link a verified Gleent Account before access can be enabled.'],
                ]);
            }

            return;
        }

        $authService->setAffiliateAccess(
            (string) $user->auth_service_user_id,
            (string) $user->auth_service_tenant_id,
            $enabled,
        );
    }
}
