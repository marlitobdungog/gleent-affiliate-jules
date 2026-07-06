import { useEffect, useState } from "react"
import {
  UserPlus,
  Target,
  Handshake,
  Coins,
  Wallet,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency } from "@/lib/format"
import { partnerStatusConfig, referralStatusConfig } from "@/lib/statusConfig"
import { partnerPortalApi } from "@/services/api"
import type { PartnerDashboardData } from "@/types/partnerPortal"
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
  const [data, setData] = useState<PartnerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    partnerPortalApi
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unable to load dashboard data.</p>
      </div>
    )
  }

  const { kpi, recent_referrals, profile } = data

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
          value={String(kpi.total_referrals)}
          subtitle="All time"
          icon={UserPlus}
        />
        <KpiCard
          title="Active Leads"
          value={String(kpi.active_leads)}
          subtitle="In pipeline"
          icon={Target}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <KpiCard
          title="Closed Deals"
          value={String(kpi.closed_deals)}
          subtitle="Won opportunities"
          icon={Handshake}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <KpiCard
          title="Total Earnings"
          value={formatCurrency(kpi.total_earnings)}
          subtitle="Lifetime commissions"
          icon={Coins}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <KpiCard
          title="Pending Payout"
          value={formatCurrency(kpi.pending_payout)}
          subtitle="Awaiting transfer"
          icon={Wallet}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <KpiCard
          title="Conversion Rate"
          value={`${kpi.conversion_rate}%`}
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
            {recent_referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrals yet.</p>
            ) : (
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
                  {recent_referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.lead_name}</p>
                          <p className="text-xs text-muted-foreground">{referral.company}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{referral.product}</TableCell>
                      <TableCell>
                        <StatusBadge status={referral.status} config={referralStatusConfig} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {referral.submitted_at}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
              <p className="font-mono font-medium">{profile.partner_code}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={profile.status} config={partnerStatusConfig} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission Rate</p>
              <p className="font-medium">
                {profile.commission_type === "percentage"
                  ? `${profile.commission_rate}%`
                  : formatCurrency(profile.commission_rate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium">{profile.joined_at}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PartnerDashboard
