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
import { dashboardApi } from "@/services/api"
import { formatCurrency, formatNumber } from "@/lib/format"

interface DashboardProps {
  onNavigate: (route: string) => void
  onSelectPartner: (partnerId: string) => void
  onReviewApplication: (applicationId: string) => void
}

export function Dashboard({ onNavigate, onSelectPartner, onReviewApplication }: DashboardProps) {
  const [data, setData] = useState<any>(null)
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
            applications={kpi.recent_applications.map((app: any) => ({
              id: app.id,
              applicantName: app.name,
              email: app.email,
              company: app.company_name,
              targetProduct: app.target_product?.name,
              status: app.status,
              appliedDate: new Date(app.created_at).toLocaleDateString()
            }))}
            onNavigate={() => onNavigate("applications")}
            onReviewApplication={onReviewApplication}
          />
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <TopPerformingPartnersCard
            partners={kpi.top_partners.map((p: any) => ({
              id: p.id,
              name: p.name,
              company: p.company_name,
              referrals: p.deals_count, // Using deals_count as a proxy for performance
              revenueGenerated: 0, // Placeholder
              status: p.status
            }))}
            onNavigate={() => onNavigate("partners")}
            onSelectPartner={onSelectPartner}
          />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <RecentDealsCard
            deals={kpi.recent_deals.map((d: any) => ({
              id: d.id,
              dealName: d.deal_name,
              client: d.client_name,
              partnerId: d.partner_id,
              product: d.product?.name,
              dealValue: d.deal_value,
              dealStatus: d.status,
              commissionStatus: 'pending' // Placeholder
            }))}
            onNavigate={() => onNavigate("deals")}
          />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PendingPayoutsCard
            payouts={kpi.pending_payouts_list.map((p: any) => ({
              id: p.id,
              partnerId: p.partner_id,
              amount: p.amount,
              status: p.status,
              createdDate: new Date(p.created_at).toLocaleDateString()
            }))}
            onNavigate={() => onNavigate("payouts")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
