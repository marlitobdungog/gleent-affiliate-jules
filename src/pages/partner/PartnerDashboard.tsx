import { useEffect, useState } from "react"
import {
  MousePointerClick,
  UserPlus,
  UsersRound,
  Target,
  Handshake,
  Coins,
  Wallet,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { AnalyticsRangeSelect } from "@/components/partner/AnalyticsRangeSelect"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency } from "@/lib/format"
import { partnerStatusConfig, referralStatusConfig } from "@/lib/statusConfig"
import { partnerPortalApi } from "@/services/api"
import type { AffiliateAnalyticsRange, PartnerAffiliateAnalyticsOverview, PartnerDashboardData } from "@/types/partnerPortal"
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
  const [analytics, setAnalytics] = useState<PartnerAffiliateAnalyticsOverview | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [range, setRange] = useState<AffiliateAnalyticsRange>("30d")

  useEffect(() => {
    partnerPortalApi
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true
    setAnalytics(null)
    setAnalyticsError(null)
    setAnalyticsLoading(true)

    partnerPortalApi
      .getAffiliateAnalyticsOverview(range)
      .then((result: PartnerAffiliateAnalyticsOverview) => active && setAnalytics(result))
      .catch((error: any) => active && setAnalyticsError(error?.message || "Unable to load click analytics."))
      .finally(() => active && setAnalyticsLoading(false))

    return () => { active = false }
  }, [range])

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
  const availableFrom = analytics?.data_available_from
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: analytics.timezone }).format(new Date(analytics.data_available_from))
    : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}. Here's an overview of your affiliate performance.
        </p>
      </div>

      <section className="space-y-4" aria-labelledby="link-performance-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="link-performance-heading" className="text-lg font-semibold">Link Performance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Clicks and referrals across your eligible product links.</p>
          </div>
          <AnalyticsRangeSelect value={range} onValueChange={setRange} />
        </div>

        {analyticsError && (
          <Alert variant="destructive">
            <AlertTitle>Click analytics unavailable</AlertTitle>
            <AlertDescription>{analyticsError} Your links and referrals are unaffected.</AlertDescription>
          </Alert>
        )}

        {analyticsLoading && <p className="text-sm text-muted-foreground" role="status">Loading click analytics…</p>}

        {analytics && !analyticsError && <>
          {analytics.is_partial && availableFrom && (
            <Alert>
              <AlertTitle>Some history is unavailable</AlertTitle>
              <AlertDescription>Verified click analytics start on {availableFrom}. Earlier visits are not included.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total Clicks" value={String(analytics.metrics.total_clicks)} subtitle="Accepted link visits in period" icon={MousePointerClick} />
            <KpiCard title="Unique Clicks" value={String(analytics.metrics.unique_clicks)} subtitle="Distinct browser identifiers" icon={UsersRound} iconClassName="bg-violet-500/10 text-violet-600" />
            <KpiCard title="Referrals" value={String(analytics.metrics.referrals)} subtitle="Created in the same period" icon={UserPlus} iconClassName="bg-emerald-500/10 text-emerald-600" />
            <KpiCard title="Click Conversion" value={`${analytics.metrics.conversion_rate.toFixed(1)}%`} subtitle="Referrals / unique clicks" icon={TrendingUp} iconClassName="bg-rose-500/10 text-rose-600" />
          </div>
          {analytics.metrics.total_clicks === 0 && (
            <p className="text-sm text-muted-foreground">No clicks yet. Share your affiliate link to start tracking visits.</p>
          )}
          {availableFrom && !analytics.is_partial && (
            <p className="text-xs text-muted-foreground">Tracking data available from {availableFrom}. All-time metrics begin at this date.</p>
          )}
        </>}
      </section>

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
                        <div className="space-y-1">
                          <StatusBadge status={referral.status} config={referralStatusConfig} />
                          {referral.crm_pipeline_name && (
                            <p className="text-xs text-muted-foreground">{referral.crm_pipeline_name}</p>
                          )}
                        </div>
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
