import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency } from "@/lib/format"
import { dealStatusConfig } from "@/lib/statusConfig"
import type { RecentDeal } from "@/types/affiliate"

interface RecentDealsCardProps {
  deals: RecentDeal[]
  onNavigate: () => void
}

export function RecentDealsCard({ deals, onNavigate }: RecentDealsCardProps) {
  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Recent Deals</CardTitle>
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
                  Deal
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  Product
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Client
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Partner
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Deal Value
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Commission
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  Closed Date
                </th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-foreground">{deal.deal}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{deal.product}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{deal.client}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{deal.partner}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">
                    {formatCurrency(deal.dealValue)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                    {deal.commission > 0 ? formatCurrency(deal.commission) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={deal.status} config={dealStatusConfig} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                    {deal.closedDate}
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
