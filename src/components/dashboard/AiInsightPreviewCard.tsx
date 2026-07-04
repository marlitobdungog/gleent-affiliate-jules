import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AiInsightPreviewCard() {
  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">AI Insights Preview</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI summaries are not enabled yet. SprintHR Performance can summarize review trends,
          identify performance risk areas, and suggest personalized development plans.
        </p>
        <div className="space-y-2">
          {[
            "Summarize review cycle results",
            "Flag at-risk employees",
            "Suggest development plans",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-1.5 rounded-full bg-muted-foreground/40" />
              {feature}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" disabled>
          <Sparkles className="size-3.5 mr-1.5" />
          Enable AI Insights
        </Button>
      </CardContent>
    </Card>
  )
}
