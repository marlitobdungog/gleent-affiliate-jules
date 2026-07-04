import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { RegularizationEmployee, RegularizationStatus } from "@/types/performance"

const statusConfig: Record<RegularizationStatus, string> = {
  "Not Started":
    "bg-muted text-muted-foreground border-border",
  "Manager Review Pending":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  "HR Review Pending":
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "For Final Decision":
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
}

interface RegularizationDueCardProps {
  employees: RegularizationEmployee[]
  onViewAll: () => void
}

export function RegularizationDueCard({ employees, onViewAll }: RegularizationDueCardProps) {
  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Regularization Reviews Due</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onViewAll}>
          View Regularization <ArrowRight className="ml-1 size-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Position</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Due Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Manager</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employee} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">{emp.employee}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{emp.position}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{emp.department}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{emp.dueDate}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{emp.manager}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium whitespace-nowrap", statusConfig[emp.status])}
                    >
                      {emp.status}
                    </Badge>
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
