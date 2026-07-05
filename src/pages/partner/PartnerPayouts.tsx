import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { payoutStatusConfig } from "@/lib/statusConfig"
import { formatCurrency } from "@/lib/format"
import { mockPartnerPayouts } from "@/data/mockPartnerPortalData"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const totalPaid = mockPartnerPayouts
  .filter((p) => p.status === "Paid")
  .reduce((sum, p) => sum + p.amount, 0)
const pendingPayout = mockPartnerPayouts
  .filter((p) => p.status === "Pending")
  .reduce((sum, p) => sum + p.amount, 0)

export function PartnerPayouts() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="text-muted-foreground mt-1">
          Track your payout history and pending transfers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Payout</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(pendingPayout)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPartnerPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-mono text-sm">{payout.id}</TableCell>
                  <TableCell>{payout.period}</TableCell>
                  <TableCell>{payout.method}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={payout.status} config={payoutStatusConfig} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {payout.paidAt ?? payout.requestedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PartnerPayouts
