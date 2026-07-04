import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PerformanceDistributionItem } from "@/types/performance"

interface PerformanceDistributionCardProps {
  distribution: PerformanceDistributionItem[]
}

export function PerformanceDistributionCard({ distribution }: PerformanceDistributionCardProps) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Performance Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {distribution.map((item) => {
          const pct = Math.round((item.count / total) * 100)
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{item.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {item.count} <span className="text-xs">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", item.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground pt-1">{total} employees rated this cycle</p>
      </CardContent>
    </Card>
  )
}
