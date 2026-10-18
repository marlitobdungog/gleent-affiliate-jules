<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\Product;
use App\Models\ProductAffiliateLink;
use App\Models\ProductAffiliateLinkClick;
use App\Models\ProductLandingPage;
use App\Models\Setting;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Str;

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
                'product.landingPages' => fn ($query) => $query->where('is_active', true)->orderByDesc('is_default')->orderBy('name'),
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
                $defaultPage = $landingPages->firstWhere('is_default', true) ?? $landingPages->first();

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
                'landingPages' => fn ($query) => $query->where('is_active', true)->orderByDesc('is_default')->orderBy('name'),
            ])
            ->findOrFail($productId);

        $trackingMode = $product->affiliateSettings?->tracking_mode ?? 'direct';
        $referralParameter = $product->affiliateSettings?->referral_parameter ?? 'ref';

        $links = $product->landingPages->map(function (ProductLandingPage $page) use ($partner, $product, $trackingMode, $referralParameter) {
            if ($trackingMode === 'redirect') {
                $affiliateLink = ProductAffiliateLink::firstOrCreate(
                    [
                        'partner_id' => $partner->id,
                        'product_id' => $product->id,
                        'landing_page_id' => $page->id,
                    ],
                    ['token' => Str::random(48)],
                );

                $shareUrl = rtrim((string) config('app.url'), '/').'/api/r/'.$affiliateLink->token;
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
                'tracking_mode' => $trackingMode,
            ];
        })->values()->all();

        return [
            'product_id' => $product->id,
            'links' => $links,
        ];
    }

    public function resolveRedirect(string $token): string
    {
        $link = ProductAffiliateLink::query()
            ->with(['partner', 'product.affiliateSettings', 'landingPage'])
            ->where('token', $token)
            ->firstOrFail();

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
            throw (new ModelNotFoundException)->setModel(ProductAffiliateLink::class, [$token]);
        }

        ProductAffiliateLinkClick::create(['affiliate_link_id' => $link->id]);

        return $this->appendReferralParameter(
            $landingPage->destination_url,
            $product->affiliateSettings?->referral_parameter ?? 'ref',
            $partner->partner_code,
        );
    }

    private function appendReferralParameter(string $url, string $parameter, string $value): string
    {
        $parts = parse_url($url);
        $query = [];
        parse_str($parts['query'] ?? '', $query);
        $query[$parameter] = $value;

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
