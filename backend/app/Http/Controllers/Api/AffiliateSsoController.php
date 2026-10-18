<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\User;
use App\Services\AuthServiceClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class AffiliateSsoController extends Controller
{
    public function startLogin(Request $request): RedirectResponse
    {
        return $this->startOnboarding($request, 'login');
    }

    public function startApplication(Request $request): RedirectResponse
    {
        return $this->startOnboarding($request, 'apply');
    }

    public function onboardingIdentity(Request $request)
    {
        $identity = $request->session()->get('affiliate_onboarding_identity');
        abort_unless(is_array($identity), 401, 'Sign in with Gleent Account before applying.');

        return response()->json([
            'name' => $identity['account_name'],
            'email' => $identity['account_email'],
        ]);
    }

    public function callback(Request $request, AuthServiceClient $authService): RedirectResponse
    {
        $state = (string) $request->query('state', '');
        $code = (string) $request->query('code', '');
        $flow = $state !== '' ? $request->session()->get('affiliate_oauth_flows.'.$state) : null;

        if (! is_array($flow)
            || ! isset($flow['client_type'], $flow['intent'], $flow['verifier'], $flow['created_at'])
            || ! is_string($flow['verifier'])
            || now()->timestamp - (int) $flow['created_at'] > 600
            || ! hash_equals((string) ($flow['state'] ?? ''), $state)) {
            return $this->frontend('/partner/login?error=invalid_sso_state');
        }

        $request->session()->forget('affiliate_oauth_flows.'.$state);

        if ($code === '') {
            return $this->frontend('/partner/login?error=sign_in_failed');
        }

        $authConfig = (array) config('services.auth_service', []);
        $clientId = (string) ($authConfig[$flow['client_type'].'_client_id'] ?? '');
        $clientSecret = (string) ($authConfig[$flow['client_type'].'_client_secret'] ?? '');
        if ($clientId === '' || $clientSecret === '') {
            return $this->frontend('/partner/login?error=sso_unavailable');
        }

        try {
            $identity = $authService->exchangeAuthorizationCode($code, $clientId, $clientSecret, $flow['verifier']);
            $this->assertIdentityResponse($identity, $flow['client_type'], $authConfig);
        } catch (Throwable $exception) {
            report($exception);

            return $this->frontend('/partner/login?error=sign_in_failed');
        }

        if ($flow['client_type'] === 'onboarding') {
            unset($identity['access_token']);
            $request->session()->put('affiliate_onboarding_identity', $identity);

            if ($flow['intent'] === 'apply') {
                return $this->frontend('/partner/register');
            }

            return $this->continuePartnerLogin($request, $identity, $authService);
        }

        $user = User::where('account_user_id', $identity['account_user_id'])->where('role', 'partner')->first();
        if (! $user
            || (string) $user->auth_service_user_id !== (string) $identity['user_id']
            || (string) $user->auth_service_tenant_id !== (string) $identity['tenant_id']
            || ! $user->partner
            || ! in_array($user->partner->status, ['active', 'approved'], true)) {
            return $this->frontend('/partner/login?error=affiliate_access_denied');
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->forget('affiliate_onboarding_identity');

        return $this->frontend('/partner/dashboard');
    }

    private function continuePartnerLogin(Request $request, array $identity, AuthServiceClient $authService): RedirectResponse
    {
        $user = User::where('account_user_id', $identity['account_user_id'])
            ->where('role', 'partner')
            ->first();

        if (! $user) {
            $user = User::where('role', 'partner')
                ->whereRaw('LOWER(email) = ?', [strtolower($identity['account_email'])])
                ->first();
        }

        if (! $user) {
            $partner = Partner::whereRaw('LOWER(email) = ?', [strtolower($identity['account_email'])])
                ->whereIn('status', ['active', 'approved', 'pending'])
                ->first();
            if ($partner && ! $partner->user) {
                $user = DB::transaction(function () use ($partner, $identity) {
                    $lockedPartner = Partner::whereKey($partner->id)->lockForUpdate()->first();
                    if (! $lockedPartner || $lockedPartner->user) {
                        return $lockedPartner?->user;
                    }

                    $linkedUser = User::where('role', 'partner')
                        ->whereRaw('LOWER(email) = ?', [strtolower($identity['account_email'])])
                        ->lockForUpdate()
                        ->first();
                    if (! $linkedUser) {
                        $linkedUser = User::create([
                            'name' => $identity['account_name'] ?: $identity['account_email'],
                            'email' => strtolower($identity['account_email']),
                            'password' => null,
                            'role' => 'partner',
                        ]);
                    }
                    $lockedPartner->update(['user_id' => $linkedUser->id]);

                    return $linkedUser;
                });
            }
        }

        $partner = $user?->partner;
        if (! $user || ! $partner) {
            return $this->frontend('/partner/register?error=not_an_active_partner');
        }

        if (($user->account_user_id && (string) $user->account_user_id !== (string) $identity['account_user_id'])
            || ($user->auth_service_user_id && (string) $user->auth_service_user_id !== (string) $identity['user_id'])) {
            return $this->frontend('/partner/login?error=account_link_conflict');
        }

        try {
            $user->forceFill([
                'account_user_id' => $identity['account_user_id'],
                'auth_service_user_id' => $identity['user_id'],
                'auth_service_tenant_id' => $identity['tenant_id'],
            ])->save();
            if (in_array($partner->status, ['active', 'approved'], true)) {
                $authService->setAffiliateAccess($identity['user_id'], $identity['tenant_id'], true);
            } else {
                return $this->frontend('/partner/login?error=partner_not_active');
            }
        } catch (Throwable $exception) {
            report($exception);

            return $this->frontend('/partner/login?error=sso_unavailable');
        }

        return $this->startFlow($request, 'affiliate', 'login');
    }

    private function startOnboarding(Request $request, string $intent): RedirectResponse
    {
        return $this->startFlow($request, 'onboarding', $intent);
    }

    private function startFlow(Request $request, string $clientType, string $intent): RedirectResponse
    {
        $config = (array) config('services.auth_service', []);
        $clientId = (string) ($config[$clientType.'_client_id'] ?? '');
        $callbackUrl = (string) ($config['callback_url'] ?? '');
        $baseUrl = rtrim((string) ($config['base_url'] ?? ''), '/');
        if ($clientId === '' || $callbackUrl === '' || $baseUrl === '') {
            return $this->frontend('/partner/login?error=sso_unavailable');
        }

        $state = bin2hex(random_bytes(32));
        $verifier = Str::random(64);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        $request->session()->put('affiliate_oauth_flows.'.$state, [
            'state' => $state,
            'verifier' => $verifier,
            'client_type' => $clientType,
            'intent' => $intent,
            'created_at' => now()->timestamp,
        ]);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $callbackUrl,
            'response_type' => 'code',
            'state' => $state,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ], '', '&', PHP_QUERY_RFC3986);

        return redirect()->away($baseUrl.'/v1/oauth/authorize?'.$query);
    }

    /** @param array<string, mixed> $identity
     * @param  array<string, mixed>  $config
     */
    private function assertIdentityResponse(array $identity, string $clientType, array $config): void
    {
        $invalidFields = [];
        if (! preg_match('/^[1-9][0-9]{0,19}$/', (string) ($identity['account_user_id'] ?? ''))) {
            $invalidFields[] = 'account_user_id';
        }
        if (! filter_var($identity['account_email'] ?? null, FILTER_VALIDATE_EMAIL)) {
            $invalidFields[] = 'account_email';
        }
        if (($identity['account_email_verified'] ?? false) !== true) {
            $invalidFields[] = 'account_email_verified';
        }
        if (! Str::isUuid((string) ($identity['user_id'] ?? ''))) {
            $invalidFields[] = 'user_id';
        }
        if (! Str::isUuid((string) ($identity['tenant_id'] ?? ''))) {
            $invalidFields[] = 'tenant_id';
        }
        if (($identity['tenant_slug'] ?? null) !== ($config['tenant_slug'] ?? 'gleent')) {
            $invalidFields[] = 'tenant_slug';
        }
        if ($invalidFields !== []) {
            throw new RuntimeException('The sign-in service returned invalid Account fields: '.implode(', ', $invalidFields).'.');
        }

        $expectedApplication = $clientType === 'onboarding'
            ? ($config['onboarding_application_code'] ?? 'affiliate-onboarding')
            : ($config['application_code'] ?? 'affiliate');
        if (($identity['application_code'] ?? null) !== $expectedApplication) {
            throw new RuntimeException('The sign-in service returned an unexpected application.');
        }

        if ($clientType === 'onboarding'
            && ! in_array('affiliate:apply', $identity['scopes'] ?? [], true)) {
            throw new RuntimeException('The sign-in service did not grant the onboarding scope.');
        }
    }

    private function frontend(string $path): RedirectResponse
    {
        return redirect()->away(rtrim((string) config('app.frontend_url'), '/').$path);
    }
}
