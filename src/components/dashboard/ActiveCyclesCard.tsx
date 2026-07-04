import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CycleStatusBadge } from "@/components/cycles/CycleStatusBadge"
import type { ReviewCycle } from "@/types/performance"

interface ActiveCyclesCardProps {
  cycles: ReviewCycle[]
  onViewCycle: (cycle: ReviewCycle) => void
  onNavigateCycles: () => void
}

export function ActiveCyclesCard({ cycles, onViewCycle, onNavigateCycles }: ActiveCyclesCardProps) {
  const activeCycles = cycles.filter(
    (c) => c.status === "Active" || c.status === "Closing Soon"
  )

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Active Review Cycles</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onNavigateCycles}>
          View all <ArrowRight className="ml-1 size-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Cycle Name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Review Period
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Completion
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  Due Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCycles.map((cycle) => (
                <tr key={cycle.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-medium text-foreground">{cycle.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cycle.type}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {cycle.period}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Progress value={cycle.completion} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground font-medium tabular-nums">
                        {cycle.completion}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CycleStatusBadge status={cycle.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {cycle.dueDate}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onViewCycle(cycle)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
