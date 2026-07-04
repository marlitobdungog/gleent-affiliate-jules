<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\Application;
use App\Models\Referral;
use App\Models\Deal;
use App\Models\Commission;
use App\Models\Payout;

class DashboardService
{
    public function getSummary()
    {
        return [
            'total_partners' => Partner::count(),
            'pending_applications' => Application::where('status', 'submitted')->count(),
            'active_partners' => Partner::where('status', 'active')->count(),
            'total_referrals' => Referral::count(),
            'qualified_leads' => Referral::where('status', 'qualified')->count(),
            'closed_deals' => Deal::where('status', 'won')->count(),
            'total_commission' => Commission::where('status', 'paid')->sum('commission_amount'),
            'pending_payouts' => Payout::whereIn('status', ['draft', 'pending', 'processing'])->count(),

            'recent_applications' => Application::with('targetProduct')->latest()->take(5)->get(),
            'top_partners' => Partner::withCount('deals')
                ->orderBy('deals_count', 'desc')
                ->take(5)
                ->get(),
            'recent_referrals' => Referral::with(['partner', 'product'])->latest()->take(5)->get(),
            'recent_deals' => Deal::with(['partner', 'product'])->latest()->take(5)->get(),
            'pending_payouts_list' => Payout::with('partner')
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->latest()
                ->take(5)
                ->get(),
        ];
    }
}
