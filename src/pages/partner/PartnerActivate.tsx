import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Handshake, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { partnerAuthApi } from "@/services/api"
import { toast } from "sonner"

export function PartnerActivate() {
  const [searchParams] = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [activated, setActivated] = useState(false)
  const [formData, setFormData] = useState({
    email: searchParams.get("email") ?? "",
    token: searchParams.get("token") ?? "",
    password: "",
    password_confirmation: "",
  })

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      email: searchParams.get("email") ?? "",
      token: searchParams.get("token") ?? "",
    }))
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.email || !formData.token) {
      toast.error("This activation link is invalid or incomplete.")
      return
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords do not match")
      return
    }

    setSaving(true)
    try {
      await partnerAuthApi.activate(formData)
      setActivated(true)
    } catch (err: any) {
      toast.error(err?.message ?? "Unable to activate your account")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Handshake className="size-6" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">Partner Portal</span>
            <span className="text-sm text-muted-foreground">Gleent Affiliate</span>
          </div>
        </div>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">{activated ? "Account activated" : "Set your password"}</CardTitle>
            <CardDescription>
              {activated
                ? "Your password has been created. You can now log in to the partner portal."
                : "Create a password to activate your partner account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activated ? (
              <Button asChild className="w-full">
                <Link to="/partner/login">Go to login</Link>
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} readOnly className="bg-muted/50" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password_confirmation">Confirm Password</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(event) => setFormData({ ...formData, password_confirmation: event.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Activate account
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PartnerActivate
