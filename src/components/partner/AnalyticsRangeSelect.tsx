import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AffiliateAnalyticsRange } from "@/types/partnerPortal"

interface AnalyticsRangeSelectProps {
  value: AffiliateAnalyticsRange
  onValueChange: (value: AffiliateAnalyticsRange) => void
}

export function AnalyticsRangeSelect({ value, onValueChange }: AnalyticsRangeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="affiliate-analytics-range" className="whitespace-nowrap text-sm text-muted-foreground">
        Period
      </Label>
      <Select value={value} onValueChange={next => onValueChange(next as AffiliateAnalyticsRange)}>
        <SelectTrigger id="affiliate-analytics-range" className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
