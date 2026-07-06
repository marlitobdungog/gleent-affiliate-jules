import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { partnerStatusConfig } from "@/lib/statusConfig"
import { partnerPortalApi } from "@/services/api"
import type { PartnerProfile } from "@/types/partnerPortal"
import { toast } from "sonner"

export function PartnerProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
  })

  useEffect(() => {
    partnerPortalApi
      .getProfile()
      .then((data: PartnerProfile) => {
        setProfile(data)
        setFormData({
          name: data.name,
          email: data.email,
          companyName: data.company_name ?? "",
          phone: data.phone ?? "",
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await partnerPortalApi.updateProfile({
        name: formData.name,
        email: formData.email,
        company_name: formData.companyName || undefined,
        phone: formData.phone || undefined,
      })
      setProfile(updated)
      toast.success("Profile updated successfully")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unable to load profile.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your partner account information.</p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Partner code:{" "}
            <span className="font-mono font-medium">{profile.partner_code}</span>
            {" · "}
            <StatusBadge status={profile.status} config={partnerStatusConfig} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/partner/profile/change-password">Change Password</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PartnerProfile
