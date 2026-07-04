import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatNumber, formatPercent } from "@/lib/format"
import type { FunnelStage } from "@/types/affiliate"

const stageColors = [
  "bg-blue-500",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-violet-400",
  "bg-purple-400",
  "bg-emerald-400",
  "bg-emerald-500",
]

interface ReferralFunnelCardProps {
  stages: FunnelStage[]
}

export function ReferralFunnelCard({ stages }: ReferralFunnelCardProps) {
  const topCount = stages[0]?.count ?? 1

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Referral Funnel</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          SprintHR partner journey from click to paid commission
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((stage, index) => {
          const widthPct = Math.max((stage.count / topCount) * 100, 12)
          const prevCount = index > 0 ? stages[index - 1].count : null
          const dropoff =
            prevCount && prevCount > 0
              ? ((prevCount - stage.count) / prevCount) * 100
              : null
          const overallPct = (stage.count / topCount) * 100

          return (
            <div key={stage.label} className="flex flex-col items-center">
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 flex justify-center">
                  <div
                    className={cn(
                      "h-9 rounded-md flex items-center justify-between px-3 transition-all",
                      stageColors[index] ?? "bg-primary"
                    )}
                    style={{ width: `${widthPct}%`, minWidth: "40%" }}
                  >
                    <span className="text-xs font-medium text-white truncate">{stage.label}</span>
                    <span className="text-xs font-semibold text-white tabular-nums ml-2 shrink-0">
                      {formatNumber(stage.count)}
                    </span>
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatPercent(overallPct)}
                  </span>
                  {dropoff !== null && dropoff > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 tabular-nums">
                      −{formatPercent(dropoff)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
