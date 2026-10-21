<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductAffiliateLinkClick;
use App\Models\Partner;
use App\Models\Setting;
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
            'typ' => 'click-handoff',
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
            || ! in_array($payload['typ'] ?? 'click-handoff', ['click-handoff'], true)
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

    /**
     * Exchange the short-lived redirect token for a signed token that lasts through
     * the product's configured attribution window.
     */
    public function exchange(string $token): ?array
    {
        $verified = $this->verify($token);
        if (! $verified) {
            return null;
        }

        $click = ProductAffiliateLinkClick::query()
            ->with('affiliateLink.product.affiliateSettings')
            ->where('click_id', $verified['click_id'])
            ->first();
        $product = $click?->affiliateLink?->product;

        if (! $click || ! $click->is_countable || ! $product) {
            return null;
        }

        $windowDays = max(1, (int) ($product->affiliateSettings?->attribution_window_days
            ?? Setting::query()->where('key', 'default_attribution_window_days')->value('value')
            ?? 30));
        $expiresAt = $click->created_at->copy()->addDays($windowDays);
        if ($expiresAt->isPast()) {
            return null;
        }

        $attributionToken = $this->sign([
            'aud' => $this->audienceFor($product),
            'click_id' => $click->click_id,
            'exp' => $expiresAt->timestamp,
            'nonce' => bin2hex(random_bytes(16)),
            'product' => $product->slug,
            'iss' => 'gleent-affiliate',
            'typ' => 'affiliate-attribution',
        ]);

        return [
            'attribution_token' => $attributionToken,
            'product_slug' => $product->slug,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    /**
     * Resolve a durable attribution token to the click and its authoritative owners.
     *
     * @return array{click: ProductAffiliateLinkClick, product: Product, partner: Partner}|null
     */
    public function resolveAttribution(string $token): ?array
    {
        $payload = $this->verifiedPayload($token);
        if (! is_array($payload)
            || ($payload['iss'] ?? null) !== 'gleent-affiliate'
            || ($payload['typ'] ?? null) !== 'affiliate-attribution'
            || ! is_string($payload['aud'] ?? null)
            || ! is_string($payload['click_id'] ?? null)
            || ! is_string($payload['product'] ?? null)
            || ! preg_match('/^[a-f0-9]{32}$/', (string) ($payload['nonce'] ?? ''))
            || ! is_int($payload['exp'] ?? null)
            || $payload['exp'] <= now()->timestamp) {
            return null;
        }

        $click = ProductAffiliateLinkClick::query()
            ->with(['affiliateLink.product.affiliateSettings', 'affiliateLink.partner'])
            ->where('click_id', $payload['click_id'])
            ->first();
        $link = $click?->affiliateLink;
        $product = $link?->product;
        $partner = $link?->partner;

        if (! $click || ! $click->is_countable || ! $link || ! $product || ! $partner
            || $product->slug !== $payload['product']
            || $this->audienceFor($product) !== $payload['aud']) {
            return null;
        }

        $windowDays = max(1, (int) ($product->affiliateSettings?->attribution_window_days
            ?? Setting::query()->where('key', 'default_attribution_window_days')->value('value')
            ?? 30));
        if ($click->created_at->copy()->addDays($windowDays)->isPast()) {
            return null;
        }

        return compact('click', 'product', 'partner');
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

    private function sign(array $payload): string
    {
        $encodedPayload = $this->encode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = hash_hmac('sha256', $encodedPayload, (string) config('app.key'), true);

        return $encodedPayload.'.'.$this->encode($signature);
    }

    private function verifiedPayload(string $token): ?array
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

        return is_array($payload) ? $payload : null;
    }
}
