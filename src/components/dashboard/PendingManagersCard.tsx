import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ManagerPending } from "@/types/performance"

interface PendingManagersCardProps {
  managers: ManagerPending[]
}

export function PendingManagersCard({ managers }: PendingManagersCardProps) {
  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Pending Reviews by Manager</CardTitle>
          <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
            {managers.reduce((sum, m) => sum + m.pending, 0)} total pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Manager</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Pending</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Overdue</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Completion</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.manager} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">{m.manager}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{m.department}</td>
                  <td className="px-4 py-3 text-foreground">{m.pending}</td>
                  <td className="px-4 py-3">
                    {m.overdue > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive font-medium">
                        <AlertTriangle className="size-3" />
                        {m.overdue}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Progress
                        value={m.completion}
                        className={cn(
                          "h-1.5 w-16",
                          m.overdue > 0 ? "[&>[data-slot=progress-indicator]]:bg-amber-500" : ""
                        )}
                      />
                      <span className="text-xs text-muted-foreground font-medium tabular-nums">
                        {m.completion}%
                      </span>
                    </div>
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
