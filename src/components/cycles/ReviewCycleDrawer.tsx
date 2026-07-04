import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { CycleStatusBadge } from "./CycleStatusBadge"
import { Users, AlertTriangle, ClipboardList, Building2 } from "lucide-react"
import type { ReviewCycle } from "@/types/performance"

interface ReviewCycleDrawerProps {
  cycle: ReviewCycle | null
  open: boolean
  onClose: () => void
  onEdit: (cycle: ReviewCycle) => void
}

export function ReviewCycleDrawer({ cycle, open, onClose, onEdit }: ReviewCycleDrawerProps) {
  if (!cycle) return null

  const isActive = cycle.status === "Active" || cycle.status === "Closing Soon"
  const isDraft = cycle.status === "Draft"
  const isFinalized = cycle.status === "Finalized"

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold leading-snug">{cycle.name}</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">{cycle.type}</SheetDescription>
            </div>
            <CycleStatusBadge status={cycle.status} className="shrink-0 mt-0.5" />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Description */}
          {cycle.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{cycle.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Completion Progress</span>
              <span className="text-muted-foreground font-semibold tabular-nums">
                {cycle.completion}%
              </span>
            </div>
            <Progress value={cycle.completion} className="h-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{cycle.pendingReviews} pending reviews</span>
              {cycle.overdueReviews > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="size-3" />
                  {cycle.overdueReviews} overdue
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Key Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cycle Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Review Period</p>
                <p className="font-medium mt-0.5">{cycle.period}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-medium mt-0.5">{cycle.dueDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Launch Date</p>
                <p className="font-medium mt-0.5">{cycle.launchDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="font-medium mt-0.5">{cycle.createdBy}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Participants
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{cycle.assignedEmployees} employees assigned</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {cycle.departments.map((dept) => (
                  <Badge key={dept} variant="secondary" className="text-xs">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Template */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Template
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <ClipboardList className="size-4 text-muted-foreground shrink-0" />
              <span>{cycle.template}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex flex-col gap-2">
          {isDraft && (
            <>
              <Button className="w-full" size="sm">
                Launch Cycle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onEdit(cycle)}
              >
                Edit Cycle
              </Button>
            </>
          )}
          {isActive && (
            <>
              <Button className="w-full" size="sm">
                View Evaluations
              </Button>
              <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                Close Cycle
              </Button>
            </>
          )}
          {isFinalized && (
            <>
              <Button className="w-full" size="sm">
                View Evaluations
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                View Report
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
