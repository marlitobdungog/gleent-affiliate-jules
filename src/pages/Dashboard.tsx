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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { RecentApplicationsCard } from "@/components/dashboard/RecentApplicationsCard"
import { TopPerformingPartnersCard } from "@/components/dashboard/TopPerformingPartnersCard"
import { ReferralFunnelCard } from "@/components/dashboard/ReferralFunnelCard"
import { RecentDealsCard } from "@/components/dashboard/RecentDealsCard"
import { PendingPayoutsCard } from "@/components/dashboard/PendingPayoutsCard"
import {
  mockDashboardKpi,
  mockApplications,
  mockTopPartners,
  mockFunnelStages,
  mockRecentDeals,
  mockPendingPayouts,
} from "@/data/mockAffiliateData"
import { formatCurrency, formatNumber } from "@/lib/format"

interface DashboardProps {
  onNavigate: (route: string) => void
  onSelectPartner: (partnerId: string) => void
  onReviewApplication: (applicationId: string) => void
}

export function Dashboard({ onNavigate, onSelectPartner, onReviewApplication }: DashboardProps) {
  const kpi = mockDashboardKpi

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
          value={formatNumber(kpi.totalPartners)}
          subtitle={`${kpi.activePartners} currently active`}
          icon={Users}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <KpiCard
          title="Pending Applications"
          value={formatNumber(kpi.pendingApplications)}
          subtitle="Awaiting review"
          icon={UserPlus}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
        <KpiCard
          title="Active Partners"
          value={formatNumber(kpi.activePartners)}
          subtitle={`${Math.round((kpi.activePartners / kpi.totalPartners) * 100)}% of total partners`}
          icon={UserCheck}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <KpiCard
          title="Total Referrals"
          value={formatNumber(kpi.totalReferrals)}
          subtitle={`${formatNumber(kpi.referralsThisMonth)} this month`}
          icon={MousePointerClick}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
        />
        <KpiCard
          title="Qualified Leads"
          value={formatNumber(kpi.qualifiedLeads)}
          subtitle={`${formatNumber(kpi.totalReferrals - kpi.qualifiedLeads)} not yet qualified`}
          icon={Target}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
        />
        <KpiCard
          title="Closed Deals"
          value={formatNumber(kpi.closedDeals)}
          subtitle="Lifetime closed won"
          icon={Handshake}
          iconClassName="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
        <KpiCard
          title="Total Commission Earned"
          value={formatCurrency(kpi.totalCommissionEarned)}
          subtitle="All-time partner earnings"
          icon={Wallet}
          iconClassName="bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
        />
        <KpiCard
          title="Pending Payouts"
          value={formatCurrency(kpi.pendingPayouts)}
          subtitle="Due to partners"
          icon={Clock}
          iconClassName="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
        />
      </div>

      <Tabs defaultValue="applications">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="applications">Recent Applications</TabsTrigger>
          <TabsTrigger value="partners">Top Partners</TabsTrigger>
          <TabsTrigger value="funnel">Referral Funnel</TabsTrigger>
          <TabsTrigger value="deals">Recent Deals</TabsTrigger>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <RecentApplicationsCard
            applications={mockApplications}
            onNavigate={() => onNavigate("applications")}
            onReviewApplication={onReviewApplication}
          />
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <TopPerformingPartnersCard
            partners={mockTopPartners}
            onNavigate={() => onNavigate("partners")}
            onSelectPartner={onSelectPartner}
          />
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <ReferralFunnelCard stages={mockFunnelStages} />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <RecentDealsCard deals={mockRecentDeals} onNavigate={() => onNavigate("deals")} />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PendingPayoutsCard
            payouts={mockPendingPayouts}
            onNavigate={() => onNavigate("payouts")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
