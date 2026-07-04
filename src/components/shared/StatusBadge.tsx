import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  config: Record<string, string>
}

export function StatusBadge({ status, config }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium whitespace-nowrap", config[status])}
    >
      {status}
    </Badge>
  )
}
