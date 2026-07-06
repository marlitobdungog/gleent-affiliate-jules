import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { commissionStatusConfig } from "@/lib/statusConfig"
import { formatCurrency } from "@/lib/format"
import { partnerPortalApi } from "@/services/api"
import type { PartnerCommissionsData } from "@/types/partnerPortal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PartnerCommissions() {
  const [data, setData] = useState<PartnerCommissionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    partnerPortalApi
      .getCommissions()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unable to load commissions.</p>
      </div>
    )
  }

  const { summary, items } = data

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
        <p className="text-muted-foreground mt-1">
          View commissions earned from your referred deals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(summary.total_earned)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {formatCurrency(summary.pending_amount)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid Out</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {formatCurrency(summary.paid_amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No commissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-mono text-sm">{commission.id}</TableCell>
                    <TableCell>{commission.deal}</TableCell>
                    <TableCell>{commission.rate}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(commission.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={commission.status} config={commissionStatusConfig} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {commission.earned_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PartnerCommissions
