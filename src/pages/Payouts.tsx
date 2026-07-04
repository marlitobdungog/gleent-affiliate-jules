import { useEffect, useState } from "react"
import { MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { payoutsApi } from "@/services/api"
import { formatCurrency } from "@/lib/format"
import { payoutStatusConfig } from "@/lib/statusConfig"

export function Payouts() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPayouts()
  }, [])

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const data = await payoutsApi.getAll()
      setPayouts(data)
    } catch (err) {
      console.error("Failed to fetch payouts", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, action: 'markPaid' | 'hold' | 'cancel') => {
    setIsProcessing(true)
    try {
      await payoutsApi[action](id)
      await fetchPayouts()
    } catch (err: any) {
      alert(err.message || "Failed to update payout")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch =
      p.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.payment_reference && p.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const outstandingCount = payouts.filter(
    (p) => p.status !== "paid" && p.status !== "cancelled"
  ).length

  const outstandingTotal = payouts
    .filter((p) => p.status !== "paid" && p.status !== "cancelled")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

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
            placeholder="Search partner, reference..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading payouts...</div>
            ) : filteredPayouts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No payouts found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Partner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Period</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Payment Method</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Reference No.</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Paid Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{payout.partner?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payout.period_start ? `${new Date(payout.period_start).toLocaleDateString()} - ${new Date(payout.period_end).toLocaleDateString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground tabular-nums">{formatCurrency(payout.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{payout.payment_method || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <code className="text-xs font-mono text-muted-foreground">{payout.payment_reference || '—'}</code>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payout.status} config={payoutStatusConfig} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : "—"}
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
                              disabled={payout.status === "paid" || payout.status === "cancelled"}
                              onClick={() => handleStatusUpdate(payout.id, 'markPaid')}
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={payout.status === "paid" || payout.status === "cancelled" || payout.status === "on_hold"}
                              onClick={() => handleStatusUpdate(payout.id, 'hold')}
                            >
                              Put On Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={payout.status === "paid" || payout.status === "cancelled"}
                              onClick={() => handleStatusUpdate(payout.id, 'cancel')}
                            >
                              Cancel Payout
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
        {outstandingCount} outstanding payout{outstandingCount !== 1 ? "s" : ""} totalling{" "}
        {formatCurrency(outstandingTotal)}
      </p>
    </div>
  )
}
