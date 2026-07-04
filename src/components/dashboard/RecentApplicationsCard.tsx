import { ArrowRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { applicationStatusConfig } from "@/lib/statusConfig"
import type { AffiliateApplication } from "@/types/affiliate"

interface RecentApplicationsCardProps {
  applications: AffiliateApplication[]
  onNavigate: () => void
  onReviewApplication: (applicationId: string) => void
}

export function RecentApplicationsCard({
  applications,
  onNavigate,
  onReviewApplication,
}: RecentApplicationsCardProps) {
  const pending = applications.filter(
    (a) =>
      a.status === "Submitted" ||
      a.status === "Under Review" ||
      a.status === "Needs More Info"
  )

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Recent Affiliate Applications</CardTitle>
          <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
            {pending.length} need review
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onNavigate}>
          View all <ArrowRight className="ml-1 size-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Applicant
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Email
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  Company
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Source
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Applied Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-foreground">{app.applicantName}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{app.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{app.company}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {app.source ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{app.appliedDate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} config={applicationStatusConfig} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onReviewApplication(app.id)}>
                          Review
                        </DropdownMenuItem>
                        <DropdownMenuItem>Approve</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
