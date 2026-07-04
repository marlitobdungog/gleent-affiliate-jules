import { useEffect, useState } from "react"
import {
  Users,
  UserPlus,
  UserCheck,
  MousePointerClick,
  Target,
  Handshake,
  Wallet,
  Clock,
  Plus,
  FileText,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { RecentApplicationsCard } from "@/components/dashboard/RecentApplicationsCard"
import { TopPerformingPartnersCard } from "@/components/dashboard/TopPerformingPartnersCard"
import { RecentDealsCard } from "@/components/dashboard/RecentDealsCard"
import { PendingPayoutsCard } from "@/components/dashboard/PendingPayoutsCard"
import {
  mockApplications,
  mockDashboardKpi,
  mockPendingPayouts,
  mockPartners,
  mockRecentDeals,
} from "@/data/mockAffiliateData"
import { dashboardApi } from "@/services/api"
import { formatCurrency, formatNumber } from "@/lib/format"
import type {
  AffiliateApplication,
  PendingPayout,
  RecentDeal,
  TopPartner,
} from "@/types/affiliate"

interface DashboardProps {
  onNavigate: (route: string) => void
  onSelectPartner: (partnerId: string) => void
  onReviewApplication: (applicationId: string) => void
}

type DashboardSummary = {
  total_partners: number
  pending_applications: number
  active_partners: number
  total_referrals: number
  qualified_leads: number
  closed_deals: number
  total_commission: number
  pending_payouts: number
  recent_applications: unknown[]
  top_partners: unknown[]
  recent_deals: unknown[]
  pending_payouts_list: unknown[]
}

const fallbackDashboardSummary: DashboardSummary = {
  total_partners: mockDashboardKpi.totalPartners,
  pending_applications: mockDashboardKpi.pendingApplications,
  active_partners: mockDashboardKpi.activePartners,
  total_referrals: mockDashboardKpi.totalReferrals,
  qualified_leads: mockDashboardKpi.qualifiedLeads,
  closed_deals: mockDashboardKpi.closedDeals,
  total_commission: mockDashboardKpi.totalCommissionEarned,
  pending_payouts: mockDashboardKpi.pendingPayouts,
  recent_applications: mockApplications.slice(0, 5).map((app) => ({
    id: app.id,
    name: app.applicantName,
    email: app.email,
    company_name: app.company,
    target_product: { name: app.targetProduct },
    status: app.status,
    created_at: app.appliedDate,
  })),
  top_partners: mockPartners.slice(0, 5).map((partner) => ({
    id: partner.id,
    name: partner.name,
    company_name: partner.company,
    deals_count: partner.closedDeals,
    status: partner.status,
  })),
  recent_deals: mockRecentDeals.slice(0, 5).map((deal) => ({
    id: deal.id,
    deal_name: deal.deal,
    client_name: deal.client,
    partner_id: deal.partner,
    product: { name: deal.product },
    deal_value: deal.dealValue,
    status: deal.status,
  })),
  pending_payouts_list: mockPendingPayouts.slice(0, 5).map((payout) => ({
    id: payout.id,
    partner_id: payout.partner,
    amount: payout.amount,
    status: payout.status,
    created_at: payout.dueDate,
  })),
}

function normalizeApplications(items: unknown[]): AffiliateApplication[] {
  return items.map((item) => {
    const app = item as Record<string, unknown>

    return {
      id: String(app.id ?? ""),
      applicantName: String(app.applicantName ?? app.name ?? ""),
      email: String(app.email ?? ""),
      company: String(app.company ?? app.company_name ?? ""),
      partnerType: (app.partnerType ?? "Agency") as AffiliateApplication["partnerType"],
      targetProduct: String(
        app.targetProduct ?? (app.target_product as Record<string, unknown> | undefined)?.name ?? ""
      ),
      audienceNetwork: String(app.audienceNetwork ?? app.expectedAudience ?? "N/A"),
      appliedDate: String(app.appliedDate ?? app.created_at ?? ""),
      status: (app.status ?? "Submitted") as AffiliateApplication["status"],
      phone: typeof app.phone === "string" ? app.phone : undefined,
      website: typeof app.website === "string" ? app.website : undefined,
      linkedIn: typeof app.linkedIn === "string" ? app.linkedIn : undefined,
      twitter: typeof app.twitter === "string" ? app.twitter : undefined,
      promotionPlan: typeof app.promotionPlan === "string" ? app.promotionPlan : undefined,
      expectedAudience: typeof app.expectedAudience === "string" ? app.expectedAudience : undefined,
      notes: typeof app.notes === "string" ? app.notes : undefined,
      source: typeof app.source === "string" ? app.source : undefined,
    }
  })
}

function normalizeTopPartners(items: unknown[]): TopPartner[] {
  return items.map((item) => {
    const partner = item as Record<string, unknown>

    return {
      id: String(partner.id ?? ""),
      partner: String(partner.partner ?? partner.name ?? ""),
      code: String(partner.code ?? partner.partner_code ?? ""),
      referrals: Number(partner.referrals ?? partner.referrals_count ?? partner.deals_count ?? 0),
      closedDeals: Number(partner.closedDeals ?? partner.deals_count ?? 0),
      revenueGenerated: Number(partner.revenueGenerated ?? partner.revenue_generated ?? 0),
      commissionEarned: Number(partner.commissionEarned ?? partner.commission_earned ?? 0),
    }
  })
}

function normalizeRecentDeals(items: unknown[]): RecentDeal[] {
  return items.map((item) => {
    const deal = item as Record<string, unknown>
    const product = deal.product as Record<string, unknown> | undefined
    const partner = deal.partner as Record<string, unknown> | undefined

    return {
      id: String(deal.id ?? ""),
      deal: String(deal.deal ?? deal.deal_name ?? ""),
      product: String(deal.product ?? product?.name ?? ""),
      client: String(deal.client ?? deal.client_name ?? ""),
      partner: String(deal.partner ?? partner?.name ?? deal.partner_name ?? ""),
      dealValue: Number(deal.dealValue ?? deal.deal_value ?? 0),
      commission: Number(deal.commission ?? deal.commission_amount ?? 0),
      status: (deal.status ?? deal.dealStatus ?? "Open") as RecentDeal["status"],
      closedDate: String(deal.closedDate ?? deal.closed_date ?? ""),
    }
  })
}

function normalizePendingPayouts(items: unknown[]): PendingPayout[] {
  return items.map((item) => {
    const payout = item as Record<string, unknown>
    const partner = payout.partner as Record<string, unknown> | undefined

    return {
      id: String(payout.id ?? ""),
      partner: String(payout.partner ?? partner?.name ?? ""),
      amount: Number(payout.amount ?? 0),
      commissionPeriod: String(
        payout.commissionPeriod ?? payout.commission_period ?? payout.payoutPeriod ?? ""
      ),
      dueDate: String(payout.dueDate ?? payout.createdDate ?? payout.created_at ?? ""),
      status: (payout.status ?? "Pending") as PendingPayout["status"],
    }
  })
}

export function Dashboard({ onNavigate, onSelectPartner, onReviewApplication }: DashboardProps) {
  const [data, setData] = useState<DashboardSummary>(fallbackDashboardSummary)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const summary = await dashboardApi.getSummary()
      setData(summary)
    } catch (err) {
      console.error("Failed to fetch dashboard data", err)
      setData(fallbackDashboardSummary)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading dashboard...</p>
      </div>
    )
  }

  const kpi = data
  const recentApplications = normalizeApplications(kpi.recent_applications)
  const topPartners = normalizeTopPartners(kpi.top_partners)
  const recentDeals = normalizeRecentDeals(kpi.recent_deals)
  const pendingPayouts = normalizePendingPayouts(kpi.pending_payouts_list)

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            How is our affiliate program performing?
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onNavigate("applications")}>
            <FileText className="size-4 mr-1.5" />
            Review Applications
          </Button>
          <Button size="sm" onClick={() => onNavigate("payouts")}>
            <Plus className="size-4 mr-1.5" />
            Process Payouts
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          title="Total Partners"
          value={formatNumber(kpi.total_partners)}
          subtitle={`${kpi.active_partners} currently active`}
          icon={Users}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <KpiCard
          title="Pending Applications"
          value={formatNumber(kpi.pending_applications)}
          subtitle="Awaiting review"
          icon={UserPlus}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
        <KpiCard
          title="Active Partners"
          value={formatNumber(kpi.active_partners)}
          subtitle={kpi.total_partners > 0 ? `${Math.round((kpi.active_partners / kpi.total_partners) * 100)}% of total partners` : '0% of total partners'}
          icon={UserCheck}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <KpiCard
          title="Total Referrals"
          value={formatNumber(kpi.total_referrals)}
          subtitle="Referrals recorded"
          icon={MousePointerClick}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
        />
        <KpiCard
          title="Qualified Leads"
          value={formatNumber(kpi.qualified_leads)}
          subtitle={`${formatNumber(kpi.total_referrals - kpi.qualified_leads)} not yet qualified`}
          icon={Target}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
        />
        <KpiCard
          title="Closed Deals"
          value={formatNumber(kpi.closed_deals)}
          subtitle="Lifetime closed won"
          icon={Handshake}
          iconClassName="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
        <KpiCard
          title="Total Commission Paid"
          value={formatCurrency(kpi.total_commission)}
          subtitle="All-time partner earnings"
          icon={Wallet}
          iconClassName="bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
        />
        <KpiCard
          title="Pending Payouts"
          value={formatNumber(kpi.pending_payouts)}
          subtitle="Payouts in progress"
          icon={Clock}
          iconClassName="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
        />
      </div>

      <Tabs defaultValue="applications">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="applications">Recent Applications</TabsTrigger>
          <TabsTrigger value="partners">Top Partners</TabsTrigger>
          <TabsTrigger value="deals">Recent Deals</TabsTrigger>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <RecentApplicationsCard
            applications={recentApplications}
            onNavigate={() => onNavigate("applications")}
            onReviewApplication={onReviewApplication}
          />
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <TopPerformingPartnersCard
            partners={topPartners}
            onNavigate={() => onNavigate("partners")}
            onSelectPartner={onSelectPartner}
          />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <RecentDealsCard
            deals={recentDeals}
            onNavigate={() => onNavigate("deals")}
          />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PendingPayoutsCard
            payouts={pendingPayouts}
            onNavigate={() => onNavigate("payouts")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
