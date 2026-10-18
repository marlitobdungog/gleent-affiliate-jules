<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductAffiliateLinkClick;
use Illuminate\Support\Carbon;
use JsonException;

class AffiliateClickHandoffService
{
    public function issue(ProductAffiliateLinkClick $click, Product $product): string
    {
        $audience = $this->audienceFor($product);
        $payload = [
            'aud' => $audience,
            'click_id' => $click->click_id,
            'exp' => now()->addMinutes(max(1, (int) config('services.affiliate.click_token_ttl_minutes', 10)))->timestamp,
            'nonce' => bin2hex(random_bytes(16)),
            'product' => $product->slug,
            'iss' => 'gleent-affiliate',
        ];

        $encodedPayload = $this->encode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = hash_hmac('sha256', $encodedPayload, (string) config('app.key'), true);

        return $encodedPayload.'.'.$this->encode($signature);
    }

    /**
     * Verify a handoff token and return only an opaque click reference and public product context.
     * The token is an attribution reference; it does not authorize or create a lead or commission.
     */
    public function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return null;
        }

        [$encodedPayload, $encodedSignature] = $parts;
        $providedSignature = $this->decode($encodedSignature);
        if ($providedSignature === false) {
            return null;
        }

        $expectedSignature = hash_hmac('sha256', $encodedPayload, (string) config('app.key'), true);
        if (! hash_equals($expectedSignature, $providedSignature)) {
            return null;
        }

        $json = $this->decode($encodedPayload);
        if ($json === false) {
            return null;
        }

        try {
            $payload = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        if (! is_array($payload)
            || ($payload['iss'] ?? null) !== 'gleent-affiliate'
            || ! is_string($payload['aud'] ?? null)
            || ! is_string($payload['click_id'] ?? null)
            || ! is_string($payload['product'] ?? null)
            || ! preg_match('/^[a-f0-9]{32}$/', (string) ($payload['nonce'] ?? ''))
            || ! is_int($payload['exp'] ?? null)
            || $payload['exp'] <= now()->timestamp) {
            return null;
        }

        $click = ProductAffiliateLinkClick::query()
            ->with('affiliateLink.product')
            ->where('click_id', $payload['click_id'])
            ->first();
        $product = $click?->affiliateLink?->product;
        if (! $product
            || $product->slug !== $payload['product']
            || $this->audienceFor($product) !== $payload['aud']) {
            return null;
        }

        return [
            'click_id' => $click->click_id,
            'product_slug' => $product->slug,
            'expires_at' => Carbon::createFromTimestamp($payload['exp'])->toIso8601String(),
        ];
    }

    private function audienceFor(Product $product): string
    {
        $host = parse_url((string) $product->website_url, PHP_URL_HOST);

        return is_string($host) ? strtolower($host) : '';
    }

    private function encode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function decode(string $value): string|false
    {
        $padding = (4 - strlen($value) % 4) % 4;

        return base64_decode(strtr($value.str_repeat('=', $padding), '-_', '+/'), true);
    }
}
