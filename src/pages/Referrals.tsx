import React, { useEffect, useState } from "react"
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Info, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { referralsApi, partnersApi, productsApi } from "@/services/api"
import { referralStatusConfig } from "@/lib/statusConfig"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function Referrals() {
  const [referrals, setReferrals] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    partner_id: "",
    product_id: "",
    lead_name: "",
    lead_email: "",
    lead_phone: "",
    company_name: "",
    source: "",
    status: "new",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [referralsData, partnersData, productsData] = await Promise.all([
        referralsApi.getAll(),
        partnersApi.getAll(),
        productsApi.getAll()
      ])
      setReferrals(referralsData)
      setPartners(partnersData)
      setProducts(productsData)
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({
      partner_id: "",
      product_id: "",
      lead_name: "",
      lead_email: "",
      lead_phone: "",
      company_name: "",
      source: "",
      status: "new",
      notes: "",
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (referral: any) => {
    setSelectedReferral(referral)
    setFormData({
      partner_id: referral.partner_id.toString(),
      product_id: referral.product_id.toString(),
      lead_name: referral.lead_name,
      lead_email: referral.lead_email,
      lead_phone: referral.lead_phone || "",
      company_name: referral.company_name || "",
      source: referral.source || "",
      status: referral.status,
      notes: referral.notes || "",
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isAddModalOpen) {
        await referralsApi.create(formData)
      } else {
        await referralsApi.update(selectedReferral.id, formData)
      }
      await fetchData()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
    } catch (err: any) {
      alert(err.message || "Failed to save referral")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await referralsApi.delete(selectedReferral.id)
      await fetchData()
      setIsDeleteModalOpen(false)
    } catch (err: any) {
      alert(err.message || "Failed to delete referral")
    } finally {
      setSaving(false)
    }
  }

  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch =
      ref.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.company_name && ref.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ref.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || ref.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track leads created from partner links or manually submitted by partners.
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <Plus className="size-4 mr-2" />
          Add Referral
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Commission is not created when a referral is submitted. Commissions are only generated
          after a deal is closed as won.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search leads, companies, partners..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
            <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading referrals...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No referrals found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Lead / Company</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Partner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Source</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Created Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-medium text-foreground">{referral.lead_name}</div>
                        <div className="text-xs text-muted-foreground">{referral.company_name}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{referral.product?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{referral.partner?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{referral.source}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={referral.status} config={referralStatusConfig} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditModal(referral)}>
                              <Pencil className="size-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setSelectedReferral(referral); setIsDeleteModalOpen(true); }}
                            >
                              <Trash2 className="size-4 mr-2" /> Delete
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

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); }}}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isAddModalOpen ? "Add Referral" : "Edit Referral"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="partner">Partner</Label>
                  <Select
                    value={formData.partner_id}
                    onValueChange={v => setFormData({...formData, partner_id: v})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={v => setFormData({...formData, product_id: v})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead_name">Lead Name</Label>
                <Input
                  id="lead_name"
                  value={formData.lead_name}
                  onChange={e => setFormData({...formData, lead_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead_email">Lead Email</Label>
                <Input
                  id="lead_email"
                  type="email"
                  value={formData.lead_email}
                  onChange={e => setFormData({...formData, lead_email: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lead_phone">Lead Phone</Label>
                  <Input
                    id="lead_phone"
                    value={formData.lead_phone}
                    onChange={e => setFormData({...formData, lead_phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={e => setFormData({...formData, source: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={v => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Save Referral"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Referral</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete lead <strong>{selectedReferral?.lead_name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete Referral"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
