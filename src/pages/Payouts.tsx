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
import { getPartnerName, mockPayouts } from "@/data/mockAffiliateData"
import { formatCurrency } from "@/lib/format"
import { payoutStatusConfig } from "@/lib/statusConfig"
import type { PayoutStatus } from "@/types/affiliate"

export function Payouts() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = mockPayouts.filter((payout) => {
    const partnerName = getPartnerName(payout.partnerId)
    const matchesSearch =
      search === "" ||
      partnerName.toLowerCase().includes(search.toLowerCase()) ||
      payout.payoutPeriod.toLowerCase().includes(search.toLowerCase()) ||
      payout.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      payout.method.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || payout.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const outstandingCount = mockPayouts.filter(
    (p) => p.status !== "Paid" && p.status !== "Cancelled"
  ).length

  const outstandingTotal = mockPayouts
    .filter((p) => p.status !== "Paid" && p.status !== "Cancelled")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Process and track affiliate commission payments.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search partner, period, reference..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(payoutStatusConfig) as PayoutStatus[]).map((status) => (
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
                    Period
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Payment Method
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Reference No.
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Created Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">
                    Paid Date
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payout) => (
                  <tr
                    key={payout.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-foreground">
                      {getPartnerName(payout.partnerId)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{payout.payoutPeriod}</td>
                    <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {payout.method}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <code className="text-xs font-mono text-muted-foreground">
                        {payout.referenceNo}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payout.status} config={payoutStatusConfig} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      {payout.createdDate}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden xl:table-cell">
                      {payout.paidDate ?? "—"}
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
                          <DropdownMenuItem
                            disabled={payout.status === "Paid" || payout.status === "Cancelled"}
                          >
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={
                              payout.status === "Paid" ||
                              payout.status === "Cancelled" ||
                              payout.status === "On Hold"
                            }
                          >
                            Process Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={payout.status === "Paid" || payout.status === "Cancelled"}
                          >
                            Put On Hold
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Details</DropdownMenuItem>
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
        {outstandingCount} outstanding payout{outstandingCount !== 1 ? "s" : ""} totalling{" "}
        {formatCurrency(outstandingTotal)}
      </p>
    </div>
  )
}
