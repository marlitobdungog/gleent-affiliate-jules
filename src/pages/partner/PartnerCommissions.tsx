import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { commissionStatusConfig } from "@/lib/statusConfig"
import { formatCurrency } from "@/lib/format"
import { mockPartnerCommissions } from "@/data/mockPartnerPortalData"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const totalEarned = mockPartnerCommissions.reduce((sum, c) => sum + c.amount, 0)
const pendingAmount = mockPartnerCommissions
  .filter((c) => ["Pending Approval", "Approved", "For Payout"].includes(c.status))
  .reduce((sum, c) => sum + c.amount, 0)
const paidAmount = mockPartnerCommissions
  .filter((c) => c.status === "Paid")
  .reduce((sum, c) => sum + c.amount, 0)

export function PartnerCommissions() {
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
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalEarned)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid Out</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(paidAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
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
              {mockPartnerCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-mono text-sm">{commission.id}</TableCell>
                  <TableCell>{commission.deal}</TableCell>
                  <TableCell>{commission.rate}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(commission.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={commission.status} config={commissionStatusConfig} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {commission.earnedAt}
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

export default PartnerCommissions
