<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\MarketingAsset;
use App\Models\Partner;
use App\Models\Payout;
use App\Models\Product;
use App\Models\Referral;
use Illuminate\Support\Collection;

class PartnerPortalService
{
    private const LEAD_STAGE_DESCRIPTIONS = [
        'new' => 'Referrals received, awaiting initial contact',
        'contacted' => 'Outreach made, gathering requirements',
        'qualified' => 'Lead meets criteria and shows buying intent',
        'demo_scheduled' => 'Product demo booked with sales team',
        'proposal_sent' => 'Commercial proposal delivered',
        'closed_won' => 'Deal successfully closed',
        'closed_lost' => 'Opportunity did not convert',
        'invalid' => 'Lead did not meet qualification criteria',
        'duplicate' => 'Duplicate of an existing lead',
    ];

    private const LEAD_STAGE_ORDER = [
        'new',
        'contacted',
        'qualified',
        'demo_scheduled',
        'proposal_sent',
        'closed_won',
        'closed_lost',
    ];

    public function getProfile(Partner $partner): array
    {
        $partner->load('user');

        return $this->formatPartnerProfile($partner);
    }

    public function getDashboard(Partner $partner): array
    {
        $referrals = $partner->referrals()->with('product')->latest()->take(4)->get();
        $totalReferrals = $partner->referrals()->count();
        $closedDeals = $partner->deals()->where('status', 'won')->count();
        $activeLeads = $partner->referrals()
            ->whereNotIn('status', ['closed_won', 'closed_lost', 'invalid', 'duplicate'])
            ->count();

        $totalEarnings = (float) $partner->commissions()
            ->whereIn('status', ['approved', 'for_payout', 'paid'])
            ->sum('commission_amount');

        $pendingPayout = (float) $partner->payouts()
            ->whereIn('status', ['draft', 'pending', 'processing'])
            ->sum('amount');

        if ($pendingPayout === 0.0) {
            $pendingPayout = (float) $partner->commissions()
                ->where('status', 'for_payout')
                ->sum('commission_amount');
        }

        $conversionRate = $totalReferrals > 0
            ? (int) round(($closedDeals / $totalReferrals) * 100)
            : 0;

        return [
            'kpi' => [
                'total_referrals' => $totalReferrals,
                'active_leads' => $activeLeads,
                'closed_deals' => $closedDeals,
                'total_earnings' => $totalEarnings,
                'pending_payout' => $pendingPayout,
                'conversion_rate' => $conversionRate,
            ],
            'recent_referrals' => $referrals->map(fn (Referral $referral) => $this->formatReferral($referral))->values(),
            'profile' => $this->formatPartnerProfile($partner),
        ];
    }

    public function getReferrals(Partner $partner): Collection
    {
        return $partner->referrals()
            ->with('product')
            ->latest()
            ->get()
            ->map(fn (Referral $referral) => $this->formatReferral($referral));
    }

    public function getLeadStages(Partner $partner): array
    {
        $counts = $partner->referrals()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $stages = collect(self::LEAD_STAGE_ORDER)->map(function (string $status) use ($counts) {
            return [
                'stage' => $this->formatStatus($status),
                'status' => $status,
                'count' => (int) ($counts[$status] ?? 0),
                'description' => self::LEAD_STAGE_DESCRIPTIONS[$status] ?? '',
            ];
        });

        $otherStatuses = $counts->keys()->diff(self::LEAD_STAGE_ORDER);
        foreach ($otherStatuses as $status) {
            $stages->push([
                'stage' => $this->formatStatus($status),
                'status' => $status,
                'count' => (int) $counts[$status],
                'description' => self::LEAD_STAGE_DESCRIPTIONS[$status] ?? '',
            ]);
        }

        return $stages->values()->all();
    }

    public function getCommissions(Partner $partner): array
    {
        $commissions = $partner->commissions()
            ->with(['deal', 'product'])
            ->latest()
            ->get();

        $items = $commissions->map(fn (Commission $commission) => $this->formatCommission($commission));

        $totalEarned = (float) $commissions->sum('commission_amount');
        $pendingAmount = (float) $commissions
            ->whereIn('status', ['pending_approval', 'approved', 'for_payout'])
            ->sum('commission_amount');
        $paidAmount = (float) $commissions
            ->where('status', 'paid')
            ->sum('commission_amount');

        return [
            'summary' => [
                'total_earned' => $totalEarned,
                'pending_amount' => $pendingAmount,
                'paid_amount' => $paidAmount,
            ],
            'items' => $items->values(),
        ];
    }

    public function getPayouts(Partner $partner): array
    {
        $payouts = $partner->payouts()->latest()->get();
        $items = $payouts->map(fn (Payout $payout) => $this->formatPayout($payout));

        return [
            'summary' => [
                'total_paid' => (float) $payouts->where('status', 'paid')->sum('amount'),
                'pending_payout' => (float) $payouts->whereIn('status', ['draft', 'pending', 'processing'])->sum('amount'),
            ],
            'items' => $items->values(),
        ];
    }

    public function getMarketingAssets(): Collection
    {
        return MarketingAsset::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (MarketingAsset $asset) => $this->formatMarketingAsset($asset));
    }

    public function getProducts(): Collection
    {
        return Product::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description']);
    }

    private function formatPartnerProfile(Partner $partner): array
    {
        return [
            'id' => $partner->id,
            'name' => $partner->name,
            'email' => $partner->email,
            'phone' => $partner->phone,
            'company_name' => $partner->company_name,
            'partner_code' => $partner->partner_code,
            'partner_link' => $partner->partner_link,
            'status' => $this->formatStatus($partner->status),
            'status_raw' => $partner->status,
            'commission_type' => $partner->commission_type,
            'commission_rate' => (float) $partner->commission_rate,
            'joined_at' => $partner->joined_at?->toDateString(),
        ];
    }

    private function formatReferral(Referral $referral): array
    {
        return [
            'id' => (string) $referral->id,
            'lead_name' => $referral->lead_name,
            'company' => $referral->company_name,
            'email' => $referral->lead_email,
            'product' => $referral->product?->name,
            'status' => $this->formatStatus($referral->status),
            'status_raw' => $referral->status,
            'submitted_at' => $referral->created_at?->toDateString(),
        ];
    }

    private function formatCommission(Commission $commission): array
    {
        $dealLabel = $commission->deal
            ? trim(($commission->deal->client_name ?: $commission->deal->deal_name).' — '.($commission->product?->name ?? ''))
            : ($commission->product?->name ?? 'Commission');

        $rate = $commission->commission_type === 'percentage'
            ? number_format((float) $commission->commission_rate, 0).'%'
            : '$'.number_format((float) $commission->commission_rate, 2);

        return [
            'id' => 'COM-'.str_pad((string) $commission->id, 4, '0', STR_PAD_LEFT),
            'deal' => $dealLabel,
            'amount' => (float) $commission->commission_amount,
            'rate' => $rate,
            'status' => $this->formatStatus($commission->status),
            'status_raw' => $commission->status,
            'earned_at' => ($commission->approved_at ?? $commission->created_at)?->toDateString(),
        ];
    }

    private function formatPayout(Payout $payout): array
    {
        return [
            'id' => 'PAY-'.str_pad((string) $payout->id, 3, '0', STR_PAD_LEFT),
            'period' => $this->formatPayoutPeriod($payout),
            'amount' => (float) $payout->amount,
            'method' => $payout->payment_method ?? 'Bank Transfer',
            'status' => $this->formatStatus($payout->status),
            'status_raw' => $payout->status,
            'requested_at' => $payout->created_at?->toDateString(),
            'paid_at' => $payout->paid_at?->toDateString(),
        ];
    }

    private function formatMarketingAsset(MarketingAsset $asset): array
    {
        return [
            'id' => (string) $asset->id,
            'title' => $asset->title,
            'type' => $asset->type,
            'format' => $asset->format,
            'size' => $this->formatFileSize($asset->file_size_bytes),
            'download_url' => '/api/partner/marketing-assets/'.$asset->id.'/download',
        ];
    }

    private function formatPayoutPeriod(Payout $payout): string
    {
        if ($payout->period_start && $payout->period_end) {
            return $payout->period_start->format('F Y');
        }

        return $payout->created_at?->format('F Y') ?? 'N/A';
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 0).' KB';
        }

        return $bytes.' B';
    }

    private function formatStatus(string $status): string
    {
        return collect(explode('_', $status))
            ->map(fn (string $part) => ucfirst($part))
            ->implode(' ');
    }
}
