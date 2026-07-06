import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { referralStatusConfig } from "@/lib/statusConfig"
import { partnerPortalApi } from "@/services/api"
import type { PartnerLeadStage } from "@/types/partnerPortal"
import { Progress } from "@/components/ui/progress"

export function PartnerLeadStages() {
  const [stages, setStages] = useState<PartnerLeadStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    partnerPortalApi
      .getLeadStages()
      .then(setStages)
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

  const totalLeads = stages.reduce((sum, s) => sum + s.count, 0)
  const inPipeline = stages
    .filter((s) => !["Closed Won", "Closed Lost"].includes(s.stage))
    .reduce((sum, s) => sum + s.count, 0)
  const closedWon = stages.find((s) => s.stage === "Closed Won")?.count ?? 0
  const closedLost = stages.find((s) => s.stage === "Closed Lost")?.count ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Stages</h1>
        <p className="text-muted-foreground mt-1">
          Track where your referrals are in the sales pipeline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{totalLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>In Pipeline</CardDescription>
            <CardTitle className="text-3xl">{inPipeline}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Closed Won</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{closedWon}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Closed Lost</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{closedLost}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Pipeline Breakdown</CardTitle>
          <CardDescription>Number of leads at each stage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lead data yet.</p>
          ) : (
            stages.map((stage) => {
              const pct = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0
              return (
                <div key={stage.status} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={stage.stage} config={referralStatusConfig} />
                      <span className="text-sm text-muted-foreground truncate">
                        {stage.description}
                      </span>
                    </div>
                    <span className="text-sm font-medium shrink-0">{stage.count}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PartnerLeadStages
