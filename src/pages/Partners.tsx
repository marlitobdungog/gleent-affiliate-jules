import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { mockPartners } from "@/data/mockAffiliateData"
import { formatCurrency } from "@/lib/format"
import { partnerStatusConfig } from "@/lib/statusConfig"
import type { Partner } from "@/types/affiliate"

interface PartnersProps {
  onSelectPartner: (partnerId: string) => void
}

export function Partners({ onSelectPartner }: PartnersProps) {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage affiliate partners, tiers, and partner account details.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search partners..." className="pl-9" />
        </div>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Partner
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Code
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Referrals
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Revenue
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPartners.map((partner) => (
                  <PartnerRow
                    key={partner.id}
                    partner={partner}
                    onSelect={() => onSelectPartner(partner.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PartnerRow({ partner, onSelect }: { partner: Partner; onSelect: () => void }) {
  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <td className="px-6 py-3">
        <div className="font-medium text-foreground">{partner.name}</div>
        <div className="text-xs text-muted-foreground lg:hidden">{partner.company}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{partner.email}</td>
      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{partner.partnerType}</td>
      <td className="px-4 py-3">
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
          {partner.partnerCode}
        </code>
      </td>
      <td className="px-4 py-3 text-foreground tabular-nums hidden sm:table-cell">
        {partner.referrals}
      </td>
      <td className="px-4 py-3 text-muted-foreground tabular-nums hidden md:table-cell">
        {formatCurrency(partner.revenueGenerated)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={partner.status} config={partnerStatusConfig} />
      </td>
    </tr>
  )
}
