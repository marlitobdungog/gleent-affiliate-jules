import {
  UserPlus,
  Target,
  Handshake,
  Coins,
  Wallet,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency } from "@/lib/format"
import { partnerStatusConfig, referralStatusConfig } from "@/lib/statusConfig"
import {
  mockPartnerDashboardKpi,
  mockPartnerProfile,
  mockPartnerReferrals,
} from "@/data/mockPartnerPortalData"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PartnerDashboard() {
  const { user } = useAuth()
  const kpi = mockPartnerDashboardKpi
  const recentReferrals = mockPartnerReferrals.slice(0, 4)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}. Here's an overview of your affiliate performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Total Referrals"
          value={String(kpi.totalReferrals)}
          subtitle="All time"
          icon={UserPlus}
        />
        <KpiCard
          title="Active Leads"
          value={String(kpi.activeLeads)}
          subtitle="In pipeline"
          icon={Target}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <KpiCard
          title="Closed Deals"
          value={String(kpi.closedDeals)}
          subtitle="Won opportunities"
          icon={Handshake}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <KpiCard
          title="Total Earnings"
          value={formatCurrency(kpi.totalEarnings)}
          subtitle="Lifetime commissions"
          icon={Coins}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <KpiCard
          title="Pending Payout"
          value={formatCurrency(kpi.pendingPayout)}
          subtitle="Awaiting transfer"
          icon={Wallet}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <KpiCard
          title="Conversion Rate"
          value={`${kpi.conversionRate}%`}
          subtitle="Referral to close"
          icon={TrendingUp}
          iconClassName="bg-rose-500/10 text-rose-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>Your latest submitted leads</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{referral.leadName}</p>
                        <p className="text-xs text-muted-foreground">{referral.company}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{referral.product}</TableCell>
                    <TableCell>
                      <StatusBadge status={referral.status} config={referralStatusConfig} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {referral.submittedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>Your partner details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Partner Code</p>
              <p className="font-mono font-medium">{mockPartnerProfile.partnerCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={mockPartnerProfile.status} config={partnerStatusConfig} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission Rate</p>
              <p className="font-medium">{mockPartnerProfile.commissionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium">{mockPartnerProfile.joinedAt}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PartnerDashboard
