import * as React from "react"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getPartnerName, mockDeals } from "@/data/mockAffiliateData"
import { formatCurrency } from "@/lib/format"
import { commissionStatusConfig, dealStatusConfig } from "@/lib/statusConfig"
import type { CommissionStatus, DealStatus } from "@/types/affiliate"

export function Deals() {
  const [search, setSearch] = React.useState("")
  const [dealStatusFilter, setDealStatusFilter] = React.useState<string>("all")
  const [commissionStatusFilter, setCommissionStatusFilter] = React.useState<string>("all")

  const filtered = mockDeals.filter((deal) => {
    const partnerName = getPartnerName(deal.partnerId)
    const matchesSearch =
      search === "" ||
      deal.dealName.toLowerCase().includes(search.toLowerCase()) ||
      deal.client.toLowerCase().includes(search.toLowerCase()) ||
      partnerName.toLowerCase().includes(search.toLowerCase()) ||
      deal.product.toLowerCase().includes(search.toLowerCase())

    const matchesDealStatus = dealStatusFilter === "all" || deal.dealStatus === dealStatusFilter
    const matchesCommissionStatus =
      commissionStatusFilter === "all" || deal.commissionStatus === commissionStatusFilter

    return matchesSearch && matchesDealStatus && matchesCommissionStatus
  })

  const pendingApprovalCount = mockDeals.filter(
    (d) => d.commissionStatus === "Pending Approval"
  ).length

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deals are where commission becomes serious.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search deals, clients, partners..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={dealStatusFilter} onValueChange={setDealStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Deal status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All deal statuses</SelectItem>
            {(Object.keys(dealStatusConfig) as DealStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={commissionStatusFilter} onValueChange={setCommissionStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Commission status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All commission statuses</SelectItem>
            {(Object.keys(commissionStatusConfig) as CommissionStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Deal Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Client
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Product
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Partner
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Deal Value
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Deal Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">
                    Commission Amount
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Commission Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Closed Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-foreground">{deal.dealName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {deal.client}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {deal.product}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {getPartnerName(deal.partnerId)}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {formatCurrency(deal.dealValue)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={deal.dealStatus} config={dealStatusConfig} />
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums hidden xl:table-cell">
                      {deal.commissionAmount != null ? formatCurrency(deal.commissionAmount) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={deal.commissionStatus}
                        config={commissionStatusConfig}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      {deal.closedDate ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {pendingApprovalCount} commission{pendingApprovalCount !== 1 ? "s" : ""} pending approval
      </p>
    </div>
  )
}
