<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\Product;
use App\Models\ProductAffiliateLink;
use App\Models\ProductAffiliateLinkClick;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class AffiliateClickAnalyticsService
{
    private const RANGES = [
        '7d' => 7,
        '30d' => 30,
        '90d' => 90,
    ];

    /**
     * Record every valid redirect, while keeping identified automated traffic out of partner metrics.
     * A failed analytics write must not prevent the already validated destination from redirecting.
     *
     * @return array{click: ProductAffiliateLinkClick|null, visitor_cookie: string|null}
     */
    public function recordVisit(ProductAffiliateLink $link, Request $request): array
    {
        $exclusionReason = $this->exclusionReason($request);
        $isCountable = $exclusionReason === null;
        $visitorCookie = null;
        $visitorHash = null;

        if ($isCountable) {
            $cookieName = (string) config('services.affiliate.analytics_visitor_cookie_name', 'gleent_visitor');
            $visitorToken = $request->cookie($cookieName);

            if (! is_string($visitorToken) || ! preg_match('/^[a-f0-9]{64}$/', $visitorToken)) {
                $visitorToken = bin2hex(random_bytes(32));
                $visitorCookie = $visitorToken;
            }

            $visitorHash = hash('sha256', $visitorToken);
        }

        try {
            $click = ProductAffiliateLinkClick::create([
                'affiliate_link_id' => $link->id,
                'click_id' => (string) Str::uuid(),
                'visitor_key_hash' => $visitorHash,
                'is_countable' => $isCountable,
                'exclusion_reason' => $exclusionReason,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return ['click' => null, 'visitor_cookie' => $visitorCookie];
        }

        return ['click' => $click, 'visitor_cookie' => $visitorCookie];
    }

    public function overview(Partner $partner, string $range): array
    {
        $window = $this->window($range);
        $productIds = $partner->productEligibilities()
            ->where('is_active', true)
            ->whereHas('product', fn ($query) => $query->where('status', 'active'))
            ->pluck('product_id');

        $clicks = ProductAffiliateLinkClick::query()
            ->where('is_countable', true)
            ->whereBetween('created_at', [$window['start_utc'], $window['end_utc']]);

        if ($productIds->isEmpty()) {
            $clicks->whereRaw('1 = 0');
        } else {
            $clicks->whereHas('affiliateLink', fn ($query) => $query
                ->where('partner_id', $partner->id)
                ->whereIn('product_id', $productIds));
        }

        $totalClicks = (clone $clicks)->count();
        $uniqueClicks = (clone $clicks)
            ->whereNotNull('visitor_key_hash')
            ->distinct()
            ->count('visitor_key_hash');
        $referrals = $partner->referrals()
            ->whereNotNull('affiliate_click_id')
            ->whereBetween('created_at', [$window['start_utc'], $window['end_utc']])
            ->count();

        return [
            'range' => $range,
            'timezone' => $window['timezone'],
            'data_available_from' => $window['available_from']->toIso8601String(),
            'is_partial' => $window['is_partial'],
            'metrics' => [
                'total_clicks' => (int) $totalClicks,
                'unique_clicks' => (int) $uniqueClicks,
                'referrals' => (int) $referrals,
                'conversion_rate' => $uniqueClicks > 0
                    ? round(($referrals / $uniqueClicks) * 100, 1)
                    : 0.0,
            ],
        ];
    }

    public function linkMetrics(Partner $partner, int $productId, string $range): array
    {
        $product = Product::query()
            ->where('status', 'active')
            ->whereHas('partnerEligibilities', fn ($query) => $query
                ->where('partner_id', $partner->id)
                ->where('is_active', true))
            ->findOrFail($productId);

        $links = $partner->affiliateLinks()
            ->where('product_id', $product->id)
            ->get(['id', 'landing_page_id']);
        $window = $this->window($range);
        $aggregates = collect();

        if ($links->isNotEmpty()) {
            $aggregates = ProductAffiliateLinkClick::query()
                ->selectRaw('affiliate_link_id, COUNT(*) as total_clicks, COUNT(DISTINCT visitor_key_hash) as unique_clicks')
                ->whereIn('affiliate_link_id', $links->pluck('id'))
                ->where('is_countable', true)
                ->whereBetween('created_at', [$window['start_utc'], $window['end_utc']])
                ->groupBy('affiliate_link_id')
                ->get()
                ->keyBy('affiliate_link_id');
        }

        $productClicks = ProductAffiliateLinkClick::query()
            ->whereIn('affiliate_link_id', $links->pluck('id'))
            ->where('is_countable', true)
            ->whereBetween('created_at', [$window['start_utc'], $window['end_utc']]);
        $productTotalClicks = (clone $productClicks)->count();
        $productUniqueClicks = (clone $productClicks)
            ->whereNotNull('visitor_key_hash')
            ->distinct()
            ->count('visitor_key_hash');
        $productReferrals = $partner->referrals()
            ->where('product_id', $product->id)
            ->whereNotNull('affiliate_click_id')
            ->whereBetween('created_at', [$window['start_utc'], $window['end_utc']])
            ->count();

        $referralsByLink = collect();
        if ($links->isNotEmpty()) {
            $referralsByLink = DB::table('referrals')
                ->join('product_affiliate_link_clicks as clicks', 'referrals.affiliate_click_id', '=', 'clicks.click_id')
                ->whereNull('referrals.deleted_at')
                ->whereIn('clicks.affiliate_link_id', $links->pluck('id'))
                ->whereBetween('referrals.created_at', [$window['start_utc'], $window['end_utc']])
                ->selectRaw('clicks.affiliate_link_id, COUNT(*) as referral_count')
                ->groupBy('clicks.affiliate_link_id')
                ->pluck('referral_count', 'affiliate_link_id');
        }

        return [
            'product_id' => $product->id,
            'range' => $range,
            'timezone' => $window['timezone'],
            'data_available_from' => $window['available_from']->toIso8601String(),
            'is_partial' => $window['is_partial'],
            'metrics' => [
                'total_clicks' => (int) $productTotalClicks,
                'unique_clicks' => (int) $productUniqueClicks,
                'referrals' => (int) $productReferrals,
            ],
            'links' => $links->map(function (ProductAffiliateLink $link) use ($aggregates, $referralsByLink) {
                $aggregate = $aggregates->get($link->id);

                return [
                    'affiliate_link_id' => $link->id,
                    'landing_page_id' => $link->landing_page_id,
                    'total_clicks' => (int) ($aggregate->total_clicks ?? 0),
                    'unique_clicks' => (int) ($aggregate->unique_clicks ?? 0),
                    'referrals' => (int) ($referralsByLink->get($link->id) ?? 0),
                ];
            })->values()->all(),
        ];
    }

    private function window(string $range): array
    {
        $timezone = (string) config('services.affiliate.analytics_timezone', 'Asia/Manila');
        $now = CarbonImmutable::now($timezone);
        $startedAt = Setting::query()->where('key', 'affiliate_click_analytics_started_at')->value('value');
        $availableFrom = is_string($startedAt)
            ? CarbonImmutable::parse($startedAt)->setTimezone($timezone)
            : $now;

        if ($range === 'all') {
            $requestedStart = $availableFrom;
            $partial = false;
        } else {
            $requestedStart = $now->startOfDay()->subDays((self::RANGES[$range] ?? 30) - 1);
            $partial = $requestedStart->lt($availableFrom);
        }

        $start = $requestedStart->lt($availableFrom) ? $availableFrom : $requestedStart;

        return [
            'timezone' => $timezone,
            'available_from' => $availableFrom,
            'is_partial' => $partial,
            'start_utc' => $start->utc(),
            'end_utc' => $now->utc(),
        ];
    }

    private function exclusionReason(Request $request): ?string
    {
        $purpose = strtolower(implode(' ', array_filter([
            $request->header('Purpose'),
            $request->header('Sec-Purpose'),
            $request->header('X-Purpose'),
        ])));
        if (preg_match('/\b(prefetch|prerender)\b/', $purpose)) {
            return 'prefetch';
        }

        $userAgent = strtolower((string) $request->userAgent());
        foreach ([
            'bot', 'crawler', 'spider', 'slurp', 'facebookexternalhit', 'facebot',
            'twitterbot', 'linkedinbot', 'slackbot', 'discordbot', 'whatsapp',
            'telegrambot', 'preview', 'googlehc', 'kube-probe', 'curl/', 'wget/',
            'postmanruntime', 'insomnia',
        ] as $marker) {
            if (str_contains($userAgent, $marker)) {
                return 'automated';
            }
        }

        return null;
    }
}
