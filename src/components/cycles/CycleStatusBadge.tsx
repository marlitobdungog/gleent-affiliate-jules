import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CycleStatus } from "@/types/performance"

const statusConfig: Record<CycleStatus, { label: string; className: string }> = {
  Draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  Active: {
    label: "Active",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  "Closing Soon": {
    label: "Closing Soon",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  Finalized: {
    label: "Finalized",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
}

interface CycleStatusBadgeProps {
  status: CycleStatus
  className?: string
}

export function CycleStatusBadge({ status, className }: CycleStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-xs", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
