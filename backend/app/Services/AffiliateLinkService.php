<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\Product;
use App\Models\ProductAffiliateLink;
use App\Models\ProductLandingPage;
use App\Models\Setting;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class AffiliateLinkService
{
    public function getAffiliateProducts(Partner $partner): array
    {
        $globalWindow = (int) (Setting::where('key', 'default_attribution_window_days')->value('value') ?? 30);
        $commission = $partner->commission_type === 'percentage'
            ? rtrim(rtrim(number_format((float) $partner->commission_rate, 2, '.', ''), '0'), '.').'%'
            : '₱'.number_format((float) $partner->commission_rate, 2);

        $eligibilities = $partner->productEligibilities()
            ->where('is_active', true)
            ->with([
                'product.affiliateSettings',
                'product.landingPages' => fn ($query) => $query
                    ->where(function ($query) use ($partner) {
                        $query->where('is_active', true)
                            ->orWhereHas('affiliateLinks', fn ($links) => $links->where('partner_id', $partner->id));
                    })
                    ->orderByDesc('is_default')
                    ->orderBy('name'),
            ])
            ->get()
            ->filter(fn ($eligibility) => $eligibility->product && $eligibility->product->status === 'active')
            ->sortBy(fn ($eligibility) => mb_strtolower($eligibility->product->name))
            ->values();

        return [
            'partner_code' => $partner->partner_code,
            'legacy_link' => $partner->partner_link,
            'products' => $eligibilities->map(function ($eligibility) use ($commission, $globalWindow) {
                $product = $eligibility->product;
                $settings = $product->affiliateSettings;
                $landingPages = $product->landingPages;
                $activeLandingPages = $landingPages->where('is_active', true);
                $defaultPage = $activeLandingPages->firstWhere('is_default', true) ?? $activeLandingPages->first();

                return [
                    'id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->name,
                    'description' => $product->description,
                    'commission_display' => $commission,
                    'default_landing_page_id' => $defaultPage?->id,
                    'tracking_mode' => $settings?->tracking_mode ?? 'direct',
                    'referral_parameter' => $settings?->referral_parameter ?? 'ref',
                    'attribution_window_days' => $settings?->attribution_window_days ?? $globalWindow,
                    'landing_pages' => $landingPages->map(fn (ProductLandingPage $page) => [
                        'id' => $page->id,
                        'name' => $page->name,
                        'destination_url' => $page->destination_url,
                        'is_default' => (bool) $page->is_default,
                        'is_active' => (bool) $page->is_active,
                    ])->values(),
                ];
            })->values()->all(),
        ];
    }

    public function getAffiliateLinks(Partner $partner, int $productId): array
    {
        $product = Product::query()
            ->where('status', 'active')
            ->whereHas('partnerEligibilities', fn ($query) => $query
                ->where('partner_id', $partner->id)
                ->where('is_active', true))
            ->with([
                'affiliateSettings',
                'landingPages' => fn ($query) => $query
                    ->where(function ($query) use ($partner) {
                        $query->where('is_active', true)
                            ->orWhereHas('affiliateLinks', fn ($links) => $links->where('partner_id', $partner->id));
                    })
                    ->orderByDesc('is_default')
                    ->orderBy('name'),
            ])
            ->findOrFail($productId);

        $trackingMode = $product->affiliateSettings?->tracking_mode ?? 'direct';
        $referralParameter = $product->affiliateSettings?->referral_parameter ?? 'ref';
        $shortLinksEnabled = (bool) config('services.affiliate.short_links_enabled', true);
        $existingLinks = ProductAffiliateLink::query()
            ->where('partner_id', $partner->id)
            ->where('product_id', $product->id)
            ->get()
            ->keyBy('landing_page_id');

        $links = $product->landingPages->map(function (ProductLandingPage $page) use ($partner, $product, $trackingMode, $referralParameter, $shortLinksEnabled, $existingLinks) {
            $affiliateLink = $existingLinks->get($page->id);
            $available = $page->is_active
                && $this->destinationMatchesProduct($page->destination_url, $product->website_url);

            if (! $available && ! $affiliateLink) {
                return null;
            }

            if ($shortLinksEnabled || $trackingMode === 'redirect') {
                $affiliateLink ??= $this->findOrCreateAffiliateLink($partner, $product, $page);
                $affiliateLink = $this->ensureShortCode($affiliateLink);
                $shareUrl = $shortLinksEnabled
                    ? $this->shortLinkUrl($affiliateLink)
                    : rtrim((string) config('app.url'), '/').'/api/r/'.$affiliateLink->token;
            } else {
                $shareUrl = $this->appendReferralParameter(
                    $page->destination_url,
                    $referralParameter,
                    $partner->partner_code,
                );
            }

            return [
                'landing_page_id' => $page->id,
                'landing_page_name' => $page->name,
                'share_url' => $shareUrl,
                'destination_url' => $page->destination_url,
                'is_default' => (bool) $page->is_default,
                'available' => $available,
                'status' => $available ? 'active' : 'inactive',
                'is_short_link' => $shortLinksEnabled,
                'tracking_mode' => $trackingMode,
            ];
        })->filter()->values()->all();

        return [
            'product_id' => $product->id,
            'links' => $links,
        ];
    }

    public function resolveRedirect(
        string $token,
        AffiliateClickHandoffService $handoff,
        AffiliateClickAnalyticsService $analytics,
        Request $request,
    ): array {
        $link = ProductAffiliateLink::query()
            ->where('token', $token)
            ->firstOrFail();

        return $this->resolveLink($link, $handoff, $analytics, $request);
    }

    public function resolveShortRedirect(
        string $shortCode,
        AffiliateClickHandoffService $handoff,
        AffiliateClickAnalyticsService $analytics,
        Request $request,
    ): array {
        $link = ProductAffiliateLink::query()
            ->where('short_code', $shortCode)
            ->firstOrFail();

        return $this->resolveLink($link, $handoff, $analytics, $request);
    }

    private function resolveLink(
        ProductAffiliateLink $link,
        AffiliateClickHandoffService $handoff,
        AffiliateClickAnalyticsService $analytics,
        Request $request,
    ): array {
        $link->load(['partner', 'product.affiliateSettings', 'landingPage']);

        $partner = $link->partner;
        $product = $link->product;
        $landingPage = $link->landingPage;

        $eligible = $partner
            && in_array($partner->status, ['active', 'approved'], true)
            && $partner->productEligibilities()
                ->where('product_id', $link->product_id)
                ->where('is_active', true)
                ->exists();

        $validTarget = $product
            && $product->status === 'active'
            && $landingPage
            && $landingPage->product_id === $product->id
            && $landingPage->is_active
            && $this->destinationMatchesProduct($landingPage->destination_url, $product->website_url);

        if (! $eligible || ! $validTarget) {
            throw (new ModelNotFoundException)->setModel(ProductAffiliateLink::class, [$link->short_code ?? $link->token]);
        }

        $visit = $analytics->recordVisit($link, $request);
        $click = $visit['click'];
        $handoffToken = $click ? $handoff->issue($click, $product) : null;
        $referralParameter = $product->affiliateSettings?->referral_parameter ?? 'ref';
        if (strcasecmp($referralParameter, 'gclick') === 0) {
            $referralParameter = 'ref';
        }

        $parameters = [$referralParameter => $partner->partner_code];
        if ($handoffToken) {
            $parameters['gclick'] = $handoffToken;
        }

        return [
            'destination' => $this->appendReferralParameters($landingPage->destination_url, $parameters),
            'visitor_cookie' => $visit['visitor_cookie'],
        ];
    }

    private function findOrCreateAffiliateLink(Partner $partner, Product $product, ProductLandingPage $page): ProductAffiliateLink
    {
        $lookup = fn () => ProductAffiliateLink::query()
            ->useWritePdo()
            ->where('partner_id', $partner->id)
            ->where('product_id', $product->id)
            ->where('landing_page_id', $page->id);

        $existing = $lookup()->first();
        if ($existing) {
            return $this->ensureShortCode($existing);
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return ProductAffiliateLink::create([
                    'partner_id' => $partner->id,
                    'product_id' => $product->id,
                    'landing_page_id' => $page->id,
                    'token' => Str::random(48),
                    'short_code' => $this->generateShortCode(),
                ]);
            } catch (UniqueConstraintViolationException $exception) {
                $existing = $lookup()->first();
                if ($existing) {
                    return $this->ensureShortCode($existing);
                }

                if ($attempt === 4) {
                    throw $exception;
                }
            }
        }

        throw new RuntimeException('Unable to create a unique affiliate short link.');
    }

    private function ensureShortCode(ProductAffiliateLink $link): ProductAffiliateLink
    {
        if ($link->short_code) {
            return $link;
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                ProductAffiliateLink::query()
                    ->whereKey($link->id)
                    ->whereNull('short_code')
                    ->update(['short_code' => $this->generateShortCode()]);

                return $link->refresh();
            } catch (UniqueConstraintViolationException $exception) {
                if ($attempt === 4) {
                    throw $exception;
                }
            }
        }

        throw new RuntimeException('Unable to assign a unique affiliate short code.');
    }

    private function shortLinkUrl(ProductAffiliateLink $link): string
    {
        if (! $link->short_code) {
            throw new RuntimeException('The affiliate link is missing its short code.');
        }

        $baseUrl = rtrim((string) config('services.affiliate.short_link_base_url', config('app.url')), '/');
        $parts = parse_url($baseUrl);
        if (! is_array($parts) || ! isset($parts['host'])) {
            throw new RuntimeException('The affiliate short-link base URL must be an HTTPS origin.');
        }

        $localHttpAllowed = app()->environment(['local', 'testing'])
            && in_array(strtolower($parts['host'] ?? ''), ['localhost', '127.0.0.1', '::1'], true);
        $hasPath = isset($parts['path']) && ! in_array($parts['path'], ['', '/'], true);

        if (($parts['scheme'] ?? null) !== 'https' && ! $localHttpAllowed
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['query'])
            || isset($parts['fragment'])
            || $hasPath) {
            throw new RuntimeException('The affiliate short-link base URL must be an HTTPS origin.');
        }

        return $baseUrl.'/'.$link->short_code;
    }

    private function generateShortCode(): string
    {
        $alphabet = (string) config('services.affiliate.short_code_alphabet', 'abcdefghjkmnpqrstuvwxyz23456789');
        $length = (int) config('services.affiliate.short_code_length', 8);
        $alphabetLength = strlen($alphabet);
        $limit = intdiv(256, $alphabetLength) * $alphabetLength;
        $code = '';

        while (strlen($code) < $length) {
            foreach (str_split(random_bytes(max(16, $length))) as $byte) {
                $value = ord($byte);
                if ($value >= $limit) {
                    continue;
                }

                $code .= $alphabet[$value % $alphabetLength];
                if (strlen($code) === $length) {
                    break;
                }
            }
        }

        return $code;
    }

    private function appendReferralParameter(string $url, string $parameter, string $value): string
    {
        return $this->appendReferralParameters($url, [$parameter => $value]);
    }

    private function appendReferralParameters(string $url, array $parameters): string
    {
        $parts = parse_url($url);
        $query = [];
        parse_str($parts['query'] ?? '', $query);
        foreach ($parameters as $parameter => $value) {
            $query[$parameter] = $value;
        }

        $rebuilt = ($parts['scheme'] ?? 'https').'://'.$parts['host'];
        if (isset($parts['port'])) {
            $rebuilt .= ':'.$parts['port'];
        }
        $rebuilt .= $parts['path'] ?? '';
        $rebuilt .= '?'.http_build_query($query, '', '&', PHP_QUERY_RFC3986);

        if (isset($parts['fragment'])) {
            $rebuilt .= '#'.$parts['fragment'];
        }

        return $rebuilt;
    }

    private function destinationMatchesProduct(string $destination, ?string $websiteUrl): bool
    {
        if (! $websiteUrl) {
            return false;
        }

        $target = parse_url($destination);
        $website = parse_url($websiteUrl);
        $host = strtolower($target['host'] ?? '');
        $isLocalHost = $host === 'localhost' || str_ends_with($host, '.localhost');
        $isPrivateIp = filter_var($host, FILTER_VALIDATE_IP) !== false
            && filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
        $isBlockedHost = $isLocalHost
            || str_ends_with($host, '.local')
            || str_ends_with($host, '.internal')
            || str_ends_with($host, '.test');
        $localHostAllowed = $isLocalHost && app()->environment(['local', 'testing']);

        return ($target['scheme'] ?? null) === 'https'
            && isset($target['host'], $website['host'])
            && $host === strtolower($website['host'])
            && ! isset($target['user'])
            && ! isset($target['pass'])
            && ! $isPrivateIp
            && (! $isBlockedHost || $localHostAllowed);
    }
}
