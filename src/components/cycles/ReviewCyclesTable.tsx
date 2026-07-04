import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CycleStatusBadge } from "./CycleStatusBadge"
import { MoreHorizontal, Eye, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ReviewCycle } from "@/types/performance"

interface ReviewCyclesTableProps {
  cycles: ReviewCycle[]
  onViewCycle: (cycle: ReviewCycle) => void
  onEditCycle: (cycle: ReviewCycle) => void
}

export function ReviewCyclesTable({ cycles, onViewCycle, onEditCycle }: ReviewCyclesTableProps) {
  if (cycles.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No review cycles found matching your filters.</p>
        <p className="text-muted-foreground text-xs mt-1">Try adjusting your filters or create a new cycle.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Cycle Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Review Period</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Employees</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Completion</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">Created By</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((cycle) => (
            <tr
              key={cycle.id}
              className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => onViewCycle(cycle)}
            >
              <td className="px-6 py-3.5">
                <span className="font-medium text-foreground">{cycle.name}</span>
              </td>
              <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{cycle.type}</td>
              <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap hidden md:table-cell">
                {cycle.period}
              </td>
              <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                {cycle.assignedEmployees}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Progress value={cycle.completion} className="h-1.5 w-16" />
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {cycle.completion}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <CycleStatusBadge status={cycle.status} />
              </td>
              <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                {cycle.dueDate}
              </td>
              <td className="px-4 py-3.5 text-muted-foreground hidden xl:table-cell">
                {cycle.createdBy}
              </td>
              <td
                className="px-4 py-3.5 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-end gap-1">
                  {cycle.status === "Draft" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onEditCycle(cycle)}
                    >
                      <Edit className="size-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onViewCycle(cycle)}
                    >
                      <Eye className="size-3 mr-1" />
                      View
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onViewCycle(cycle)}>
                        View Details
                      </DropdownMenuItem>
                      {cycle.status === "Draft" && (
                        <DropdownMenuItem onClick={() => onEditCycle(cycle)}>
                          Edit Cycle
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
