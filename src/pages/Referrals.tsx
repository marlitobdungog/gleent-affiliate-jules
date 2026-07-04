import * as React from "react"
import { Info, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { getPartnerName, mockReferrals } from "@/data/mockAffiliateData"
import { referralStatusConfig } from "@/lib/statusConfig"
import type { ReferralStatus } from "@/types/affiliate"

export function Referrals() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = mockReferrals.filter((referral) => {
    const partnerName = getPartnerName(referral.partnerId)
    const matchesSearch =
      search === "" ||
      referral.leadName.toLowerCase().includes(search.toLowerCase()) ||
      referral.company.toLowerCase().includes(search.toLowerCase()) ||
      partnerName.toLowerCase().includes(search.toLowerCase()) ||
      referral.product.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || referral.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const newCount = mockReferrals.filter((r) => r.status === "New").length

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track leads created from partner links or manually submitted by partners.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Commission is not created when a referral is submitted. Commissions are only generated
          after a deal is closed and approved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search leads, companies, partners..."
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
            {(Object.keys(referralStatusConfig) as ReferralStatus[]).map((status) => (
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
                    Lead / Company
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Product
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Partner
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Source
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">
                    Assigned Salesperson
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Created Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">
                    Last Activity
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-foreground">{referral.leadName}</div>
                      <div className="text-xs text-muted-foreground">{referral.company}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {referral.product}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {getPartnerName(referral.partnerId)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {referral.source}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={referral.status} config={referralStatusConfig} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                      {referral.assignedSalesperson ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      {referral.createdDate}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden xl:table-cell">
                      {referral.lastActivity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {newCount} new referral{newCount !== 1 ? "s" : ""} awaiting assignment
      </p>
    </div>
  )
}
