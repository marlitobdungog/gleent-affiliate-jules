import React, { useEffect, useState } from "react"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { settingsApi } from "@/services/api"
import { Separator } from "@/components/ui/separator"

export function Settings() {
  const [settings, setSettings] = useState<any>({
    default_partner_link_domain: "",
    default_commission_type: "percentage",
    default_commission_rate: "",
    minimum_payout_amount: "",
    affiliate_program_status: "active",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure affiliate program rules and defaults.
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
    </div>
  )
}
