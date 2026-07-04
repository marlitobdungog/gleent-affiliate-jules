import { useEffect, useState } from "react"
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { partnersApi } from "@/services/api"
import { partnerStatusConfig } from "@/lib/statusConfig"
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

interface PartnersProps {
  onSelectPartner: (partnerId: string) => void
}

export function Partners({ onSelectPartner }: PartnersProps) {
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    status: "active",
    commission_type: "percentage",
    commission_rate: "10",
  })

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    try {
      const data = await partnersApi.getAll()
      setPartners(data)
    } catch (err) {
      console.error("Failed to fetch partners", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company_name: "",
      status: "active",
      commission_type: "percentage",
      commission_rate: "10",
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (partner: any) => {
    setSelectedPartner(partner)
    setFormData({
      name: partner.name,
      email: partner.email,
      phone: partner.phone || "",
      company_name: partner.company_name || "",
      status: partner.status,
      commission_type: partner.commission_type,
      commission_rate: partner.commission_rate.toString(),
    })
    setIsEditModalOpen(true)
  }

  const handleOpenDeleteModal = (partner: any) => {
    setSelectedPartner(partner)
    setIsDeleteModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isAddModalOpen) {
        await partnersApi.create(formData)
      } else {
        await partnersApi.update(selectedPartner.id, formData)
      }
      await fetchPartners()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
    } catch (err: any) {
      alert(err.message || "Failed to save partner")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await partnersApi.delete(selectedPartner.id)
      await fetchPartners()
      setIsDeleteModalOpen(false)
    } catch (err: any) {
      alert(err.message || "Failed to delete partner")
    } finally {
      setSaving(false)
    }
  }

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.company_name && p.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.partner_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage affiliate partners, tiers, and partner account details.
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <Plus className="size-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading partners...</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No partners found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Partner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Referrals</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => onSelectPartner(partner.id)}
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium text-foreground">{partner.name}</div>
                        <div className="text-xs text-muted-foreground">{partner.company_name}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{partner.email}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                          {partner.partner_code}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-foreground tabular-nums">
                        {partner.referrals_count}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <StatusBadge status={partner.status} config={partnerStatusConfig} />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onSelectPartner(partner.id)}>
                              <Eye className="size-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(partner)}>
                              <Pencil className="size-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleOpenDeleteModal(partner)}
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
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isAddModalOpen ? "Add Partner" : "Edit Partner"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Commission Type</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={v => setFormData({...formData, commission_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Commission Rate</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.commission_rate}
                  onChange={e => setFormData({...formData, commission_rate: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Partner"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{selectedPartner?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
