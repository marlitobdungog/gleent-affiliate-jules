import React, { useEffect, useState } from "react"
import { Loader2, MoreHorizontal, Plus, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminUsersApi, settingsApi } from "@/services/api"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"

type AdminUser = {
  id: number
  name: string
  email: string
  is_primary_admin: boolean
  created_at: string | null
}

type ValidationErrors = Record<string, string[]>

const initialAdminForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
}

function fieldError(errors: ValidationErrors, field: string) {
  return errors[field]?.[0]
}

function formatDate(value: string | null) {
  if (!value) return "Unknown"

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<any>({
    default_partner_link_domain: "",
    default_commission_type: "percentage",
    default_commission_rate: "",
    default_attribution_window_days: "30",
    minimum_payout_amount: "",
    affiliate_program_status: "active",
  })
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [adminUsersLoading, setAdminUsersLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminSaving, setAdminSaving] = useState(false)
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [adminForm, setAdminForm] = useState(initialAdminForm)
  const [adminFormErrors, setAdminFormErrors] = useState<ValidationErrors>({})
  const [adminError, setAdminError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchAdminUsers()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await settingsApi.getAll()
      setSettings((prev: any) => ({ ...prev, ...data }))
    } catch (err) {
      console.error("Failed to fetch settings", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true)
    try {
      const data = await adminUsersApi.getAll()
      setAdminUsers(data)
      setAdminError(null)
    } catch (err: any) {
      setAdminError(err.message || "Failed to load administrators")
    } finally {
      setAdminUsersLoading(false)
    }
  }

  const handleOpenAddAdmin = () => {
    setAdminForm(initialAdminForm)
    setAdminFormErrors({})
    setAdminError(null)
    setIsAddAdminOpen(true)
  }

  const handleOpenDeleteAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin)
    setAdminError(null)
    setIsDeleteAdminOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.update(settings)
      alert("Settings saved successfully!")
    } catch (err: any) {
      alert(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminSaving(true)
    setAdminFormErrors({})
    setAdminError(null)

    try {
      await adminUsersApi.create(adminForm)
      await fetchAdminUsers()
      setIsAddAdminOpen(false)
      setAdminForm(initialAdminForm)
    } catch (err: any) {
      setAdminFormErrors(err.errors || {})
      setAdminError(err.message || "Failed to create administrator")
    } finally {
      setAdminSaving(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return

    setAdminSaving(true)
    setAdminError(null)

    try {
      await adminUsersApi.delete(selectedAdmin.id)
      await fetchAdminUsers()
      setIsDeleteAdminOpen(false)
      setSelectedAdmin(null)
    } catch (err: any) {
      setAdminError(err.message || "Failed to delete administrator")
    } finally {
      setAdminSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure affiliate program rules and administrator access.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="border border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Program Configuration</CardTitle>
            <CardDescription>Main settings for your affiliate program.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="domain">Default Partner Link Domain</Label>
              <Input
                id="domain"
                value={settings.default_partner_link_domain}
                onChange={e => setSettings({...settings, default_partner_link_domain: e.target.value})}
                placeholder="https://example.com/ref"
              />
              <p className="text-[10px] text-muted-foreground">Used when generating new partner links.</p>
            </div>

            <Separator />

            <div className="grid gap-2 max-w-sm">
              <Label htmlFor="attribution-window">Default Attribution Window</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attribution-window"
                  type="number"
                  min="1"
                  max="3650"
                  value={settings.default_attribution_window_days}
                  onChange={e => setSettings({ ...settings, default_attribution_window_days: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="text-xs text-muted-foreground">Products inherit this window unless they set an override.</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Default Commission Type</Label>
                <Select
                  value={settings.default_commission_type}
                  onValueChange={v => setSettings({...settings, default_commission_type: v})}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Default Commission Rate</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={settings.default_commission_rate}
                  onChange={e => setSettings({...settings, default_commission_rate: e.target.value})}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_payout">Minimum Payout Amount</Label>
                <Input
                  id="min_payout"
                  type="number"
                  value={settings.minimum_payout_amount}
                  onChange={e => setSettings({...settings, minimum_payout_amount: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Program Status</Label>
                <Select
                  value={settings.affiliate_program_status}
                  onValueChange={v => setSettings({...settings, affiliate_program_status: v})}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="border border-border shadow-none">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Administrative Access</CardTitle>
            <CardDescription>Manage administrator accounts for this portal.</CardDescription>
          </div>
          <Button type="button" onClick={handleOpenAddAdmin}>
            <Plus className="size-4 mr-2" />
            Add Admin
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {adminError && (
            <div className="mx-6 mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {adminError}
            </div>
          )}
          <div className="overflow-x-auto">
            {adminUsersLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading administrators...</div>
            ) : adminUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No administrators found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Administrator</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Primary</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((admin) => {
                    const canDelete = !admin.is_primary_admin && admin.id !== user?.id

                    return (
                      <tr
                        key={admin.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="font-medium text-foreground">{admin.name}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                        <td className="px-4 py-3">
                          {admin.is_primary_admin ? (
                            <Badge variant="secondary">Primary admin</Badge>
                          ) : (
                            <span className="text-muted-foreground">Secondary</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(admin.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          {canDelete && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleOpenDeleteAdmin(admin)}
                                >
                                  <Trash2 className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent>
          <form onSubmit={handleCreateAdmin}>
            <DialogHeader>
              <DialogTitle>Add Admin</DialogTitle>
            </DialogHeader>
            {adminError && (
              <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {adminError}
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  value={adminForm.name}
                  onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                  required
                />
                {fieldError(adminFormErrors, "name") && (
                  <p className="text-xs text-destructive">{fieldError(adminFormErrors, "name")}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminForm.email}
                  onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                  required
                />
                {fieldError(adminFormErrors, "email") && (
                  <p className="text-xs text-destructive">{fieldError(adminFormErrors, "email")}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminForm.password}
                  onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                  required
                />
                {fieldError(adminFormErrors, "password") && (
                  <p className="text-xs text-destructive">{fieldError(adminFormErrors, "password")}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password-confirmation">Confirm Password</Label>
                <Input
                  id="admin-password-confirmation"
                  type="password"
                  value={adminForm.password_confirmation}
                  onChange={e => setAdminForm({...adminForm, password_confirmation: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddAdminOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adminSaving}>
                {adminSaving ? "Saving..." : "Save Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
          </DialogHeader>
          {adminError && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {adminError}
            </div>
          )}
          <div className="py-4">
            Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAdminOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin} disabled={adminSaving}>
              {adminSaving ? "Deleting..." : "Delete Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
