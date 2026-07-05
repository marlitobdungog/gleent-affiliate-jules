import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { referralStatusConfig } from "@/lib/statusConfig"
import { mockPartnerReferrals } from "@/data/mockPartnerPortalData"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export function PartnerReferrals() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)

  const filtered = mockPartnerReferrals.filter(
    (r) =>
      r.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Referral submitted successfully (demo)")
    setIsSubmitOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground mt-1">
            Submit and track leads you've referred to Gleent.
          </p>
        </div>
        <Button onClick={() => setIsSubmitOpen(true)}>
          <Plus className="size-4 mr-2" />
          Submit Referral
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search referrals..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{referral.leadName}</p>
                      <p className="text-xs text-muted-foreground">{referral.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{referral.company}</TableCell>
                  <TableCell>{referral.product}</TableCell>
                  <TableCell>
                    <StatusBadge status={referral.status} config={referralStatusConfig} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {referral.submittedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a Referral</DialogTitle>
            <DialogDescription>
              Enter the lead details below. Our team will follow up within 1–2 business days.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Lead Name</Label>
                <Input id="lead-name" placeholder="Jane Smith" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input id="lead-email" type="email" placeholder="jane@company.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product Interest</Label>
              <Select defaultValue="core">
                <SelectTrigger id="product">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">SprintHR Core</SelectItem>
                  <SelectItem value="payroll">SprintHR Payroll</SelectItem>
                  <SelectItem value="benefits">SprintHR Benefits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" placeholder="Any additional context about this lead..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Referral</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PartnerReferrals
