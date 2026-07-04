import React, { useEffect, useState } from "react"
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { dealsApi, referralsApi } from "@/services/api"
import { formatCurrency } from "@/lib/format"
import { dealStatusConfig } from "@/lib/statusConfig"
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

export function Deals() {
  const [deals, setDeals] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    referral_id: "",
    partner_id: "",
    product_id: "",
    client_name: "",
    deal_name: "",
    deal_value: "",
    status: "open",
    closed_at: "",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dealsData, referralsData] = await Promise.all([
        dealsApi.getAll(),
        referralsApi.getAll()
      ])
      setDeals(dealsData)
      setReferrals(referralsData)
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({
      referral_id: "",
      partner_id: "",
      product_id: "",
      client_name: "",
      deal_name: "",
      deal_value: "",
      status: "open",
      closed_at: "",
      notes: "",
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (deal: any) => {
    setSelectedDeal(deal)
    setFormData({
      referral_id: deal.referral_id.toString(),
      partner_id: deal.partner_id.toString(),
      product_id: deal.product_id.toString(),
      client_name: deal.client_name,
      deal_name: deal.deal_name,
      deal_value: deal.deal_value.toString(),
      status: deal.status,
      closed_at: deal.closed_at ? new Date(deal.closed_at).toISOString().split('T')[0] : "",
      notes: deal.notes || "",
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isAddModalOpen) {
        await dealsApi.create(formData)
      } else {
        await dealsApi.update(selectedDeal.id, formData)
      }
      await fetchData()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
    } catch (err: any) {
      alert(err.message || "Failed to save deal")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await dealsApi.delete(selectedDeal.id)
      await fetchData()
      setIsDeleteModalOpen(false)
    } catch (err: any) {
      alert(err.message || "Failed to delete deal")
    } finally {
      setSaving(false)
    }
  }

  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || deal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sales deals and connected affiliate commissions.
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <Plus className="size-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search deals, clients, partners..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading deals...</div>
            ) : filteredDeals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No deals found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Deal Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Partner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Value</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Closed Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{deal.deal_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{deal.client_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{deal.product?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{deal.partner?.name}</td>
                      <td className="px-4 py-3 text-foreground tabular-nums">{formatCurrency(deal.deal_value)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={deal.status} config={dealStatusConfig} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {deal.closed_at ? new Date(deal.closed_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditModal(deal)}>
                              <Pencil className="size-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setSelectedDeal(deal); setIsDeleteModalOpen(true); }}
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
              <DialogTitle>{isAddModalOpen ? "Add Deal" : "Edit Deal"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="referral">Referral</Label>
                <Select
                  value={formData.referral_id}
                  onValueChange={v => {
                    const ref = referrals.find(r => r.id.toString() === v);
                    if (ref) {
                      setFormData({
                        ...formData,
                        referral_id: v,
                        partner_id: ref.partner_id.toString(),
                        product_id: ref.product_id.toString(),
                        client_name: ref.company_name || ref.lead_name
                      });
                    } else {
                      setFormData({...formData, referral_id: v});
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select referral" />
                  </SelectTrigger>
                  <SelectContent>
                    {referrals.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.lead_name} ({r.company_name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deal_name">Deal Name</Label>
                <Input
                  id="deal_name"
                  value={formData.deal_name}
                  onChange={e => setFormData({...formData, deal_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deal_value">Deal Value</Label>
                <Input
                  id="deal_value"
                  type="number"
                  step="0.01"
                  value={formData.deal_value}
                  onChange={e => setFormData({...formData, deal_value: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="closed_at">Closed Date</Label>
                  <Input
                    id="closed_at"
                    type="date"
                    value={formData.closed_at}
                    onChange={e => setFormData({...formData, closed_at: e.target.value})}
                  />
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
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Save Deal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete deal <strong>{selectedDeal?.deal_name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
