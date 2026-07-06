import { useEffect, useState } from "react"
import { Plus, Search, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { referralStatusConfig } from "@/lib/statusConfig"
import { partnerPortalApi } from "@/services/api"
import type { PartnerProduct, PartnerReferralItem } from "@/types/partnerPortal"
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
  const [referrals, setReferrals] = useState<PartnerReferralItem[]>([])
  const [products, setProducts] = useState<PartnerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    product_id: "",
    lead_name: "",
    lead_email: "",
    company_name: "",
    notes: "",
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [referralsData, productsData] = await Promise.all([
        partnerPortalApi.getReferrals(),
        partnerPortalApi.getProducts(),
      ])
      setReferrals(referralsData)
      setProducts(productsData)
      if (productsData.length > 0 && !formData.product_id) {
        setFormData((prev) => ({ ...prev, product_id: String(productsData[0].id) }))
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load referrals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = referrals.filter(
    (r) =>
      r.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.company ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await partnerPortalApi.submitReferral({
        product_id: Number(formData.product_id),
        lead_name: formData.lead_name,
        lead_email: formData.lead_email,
        company_name: formData.company_name,
        notes: formData.notes || undefined,
      })
      toast.success("Referral submitted successfully")
      setIsSubmitOpen(false)
      setFormData({
        product_id: products[0] ? String(products[0].id) : "",
        lead_name: "",
        lead_email: "",
        company_name: "",
        notes: "",
      })
      await fetchData()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit referral")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
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
        <Button onClick={() => setIsSubmitOpen(true)} disabled={products.length === 0}>
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
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No referrals found.</p>
          ) : (
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
                        <p className="font-medium">{referral.lead_name}</p>
                        <p className="text-xs text-muted-foreground">{referral.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{referral.company}</TableCell>
                    <TableCell>{referral.product}</TableCell>
                    <TableCell>
                      <StatusBadge status={referral.status} config={referralStatusConfig} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {referral.submitted_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
                <Input
                  id="lead-name"
                  placeholder="Jane Smith"
                  required
                  value={formData.lead_name}
                  onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="jane@company.com"
                  required
                  value={formData.lead_email}
                  onChange={(e) => setFormData({ ...formData, lead_email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product Interest</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context about this lead..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formData.product_id}>
                {submitting ? "Submitting..." : "Submit Referral"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PartnerReferrals
