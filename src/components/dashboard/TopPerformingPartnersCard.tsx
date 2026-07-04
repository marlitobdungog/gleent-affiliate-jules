import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { TopPartner } from "@/types/affiliate"

interface TopPerformingPartnersCardProps {
  partners: TopPartner[]
  onNavigate: () => void
  onSelectPartner: (partnerId: string) => void
}

export function TopPerformingPartnersCard({
  partners,
  onNavigate,
  onSelectPartner,
}: TopPerformingPartnersCardProps) {
  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Top Performing Partners</CardTitle>
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
                  Partner
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Code
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Referrals
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Closed Deals
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Revenue Generated
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Commission Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr
                  key={partner.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => onSelectPartner(partner.id)}
                >
                  <td className="px-6 py-3 font-medium text-foreground">{partner.partner}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {partner.code}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{partner.referrals}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums hidden sm:table-cell">
                    {partner.closedDeals}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums hidden md:table-cell">
                    {formatCurrency(partner.revenueGenerated)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                    {formatCurrency(partner.commissionEarned)}
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
