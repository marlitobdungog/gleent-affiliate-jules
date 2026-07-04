import * as React from "react"
import { MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getPartnerName, mockCommissions } from "@/data/mockAffiliateData"
import { formatCurrency, formatPercent } from "@/lib/format"
import { commissionStatusConfig } from "@/lib/statusConfig"
import type { CommissionStatus } from "@/types/affiliate"

function canApprove(status: CommissionStatus) {
  return status === "Pending Approval"
}

function canReject(status: CommissionStatus) {
  return status === "Pending Approval"
}

function canAdjust(status: CommissionStatus) {
  return status === "Pending Approval" || status === "Approved" || status === "For Payout"
}

function canMoveToPayout(status: CommissionStatus) {
  return status === "Approved"
}

export function Commissions() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = mockCommissions.filter((commission) => {
    const partnerName = getPartnerName(commission.partnerId)
    const matchesSearch =
      search === "" ||
      partnerName.toLowerCase().includes(search.toLowerCase()) ||
      commission.deal.toLowerCase().includes(search.toLowerCase()) ||
      commission.product.toLowerCase().includes(search.toLowerCase()) ||
      (commission.approvedBy?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const matchesStatus = statusFilter === "all" || commission.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const pendingApprovalCount = mockCommissions.filter(
    (c) => c.status === "Pending Approval"
  ).length

  const forPayoutCount = mockCommissions.filter((c) => c.status === "For Payout").length

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Commissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Finance and admin control — review, approve, and adjust partner commissions.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search partner, deal, product..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
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
                    Partner
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Deal
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Product
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Deal Value
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Rate
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Commission Amount
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">
                    Approved By
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Approved Date
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((commission) => (
                  <tr
                    key={commission.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-foreground">
                      {getPartnerName(commission.partnerId)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{commission.deal}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {commission.product}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {formatCurrency(commission.baseAmount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums hidden md:table-cell">
                      {formatPercent(commission.commissionRate)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                      {formatCurrency(commission.commissionAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={commission.status} config={commissionStatusConfig} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                      {commission.approvedBy ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      {commission.approvedDate ?? "—"}
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
                          <DropdownMenuItem disabled={!canApprove(commission.status)}>
                            Approve Commission
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canReject(commission.status)}
                            className="text-destructive focus:text-destructive"
                          >
                            Reject Commission
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canAdjust(commission.status)}>
                            Adjust Commission
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled={!canMoveToPayout(commission.status)}>
                            Move to Payout
                          </DropdownMenuItem>
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

      <p className="text-xs text-muted-foreground">
        {pendingApprovalCount} commission{pendingApprovalCount !== 1 ? "s" : ""} pending approval
        {" · "}
        {forPayoutCount} ready for payout
      </p>
    </div>
  )
}
