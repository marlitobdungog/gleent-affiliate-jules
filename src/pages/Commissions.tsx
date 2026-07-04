import { useEffect, useState } from "react"
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
import { commissionsApi } from "@/services/api"
import { formatCurrency } from "@/lib/format"
import { commissionStatusConfig } from "@/lib/statusConfig"

export function Commissions() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const data = await commissionsApi.getAll()
      setCommissions(data)
    } catch (err) {
      console.error("Failed to fetch commissions", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, action: 'approve' | 'reject' | 'markForPayout') => {
    setIsProcessing(true)
    try {
      await commissionsApi[action](id)
      await fetchCommissions()
    } catch (err: any) {
      alert(err.message || "Failed to update commission")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch =
      c.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.deal?.deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.product?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingApprovalCount = commissions.filter(
    (c) => c.status === "pending_approval"
  ).length

  const forPayoutCount = commissions.filter((c) => c.status === "for_payout").length

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="for_payout">For Payout</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading commissions...</div>
            ) : filteredCommissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No commissions found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Partner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Deal</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Deal Value</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Rate</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Commission Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{commission.partner?.name}</td>
                      <td className="px-4 py-3 text-foreground">{commission.deal?.deal_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{commission.product?.name}</td>
                      <td className="px-4 py-3 text-foreground tabular-nums">{formatCurrency(commission.base_amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {commission.commission_type === 'percentage' ? `${commission.commission_rate}%` : formatCurrency(commission.commission_rate)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground tabular-nums">{formatCurrency(commission.commission_amount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={commission.status} config={commissionStatusConfig} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isProcessing}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={commission.status !== 'pending_approval'}
                              onClick={() => handleStatusUpdate(commission.id, 'approve')}
                            >
                              Approve Commission
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={commission.status !== 'pending_approval'}
                              className="text-destructive"
                              onClick={() => handleStatusUpdate(commission.id, 'reject')}
                            >
                              Reject Commission
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={commission.status !== 'approved'}
                              onClick={() => handleStatusUpdate(commission.id, 'markForPayout')}
                            >
                              Move to Payout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
