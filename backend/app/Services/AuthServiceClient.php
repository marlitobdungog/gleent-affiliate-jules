<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthServiceClient
{
    /** @return array<string, mixed> */
    public function exchangeAuthorizationCode(string $code, string $clientId, string $clientSecret, string $verifier): array
    {
        $config = (array) config('services.auth_service', []);

        try {
            $response = Http::acceptJson()
                ->asForm()
                ->connectTimeout((int) ($config['connect_timeout_seconds'] ?? 3))
                ->timeout((int) ($config['timeout_seconds'] ?? 10))
                ->post(rtrim((string) ($config['base_url'] ?? ''), '/').'/v1/oauth/token', [
                    'grant_type' => 'authorization_code',
                    'code' => $code,
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => (string) ($config['callback_url'] ?? ''),
                    'code_verifier' => $verifier,
                ]);
        } catch (ConnectionException $exception) {
            throw new RuntimeException('Could not connect to the sign-in service.', previous: $exception);
        }

        if (! $response->successful()) {
            throw new RuntimeException('The sign-in service rejected the authorization code.');
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new RuntimeException('The sign-in service returned an invalid response.');
        }

        return $data;
    }

    public function setAffiliateAccess(string $userId, string $tenantId, bool $enabled): Response
    {
        $config = (array) config('services.auth_service', []);
        $apiKey = (string) ($config['internal_api_key'] ?? '');
        if ($apiKey === '') {
            throw new HttpException(503, 'Affiliate access synchronization is not configured.');
        }

        try {
            $response = Http::acceptJson()
                ->withHeader('X-API-Key', $apiKey)
                ->connectTimeout((int) ($config['connect_timeout_seconds'] ?? 3))
                ->timeout((int) ($config['timeout_seconds'] ?? 10))
                ->put(
                    rtrim((string) ($config['base_url'] ?? ''), '/').'/v1/users/'.rawurlencode($userId).'/applications/'.rawurlencode((string) ($config['application_code'] ?? 'affiliate')),
                    ['enabled' => $enabled, 'tenant_id' => $tenantId],
                );
        } catch (ConnectionException $exception) {
            throw new HttpException(503, 'Could not synchronize Affiliate access with the sign-in service.', $exception);
        }

        if (! $response->successful()) {
            throw new HttpException(503, 'The sign-in service could not update Affiliate access.');
        }

        return $response;
    }
}
