import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Handshake, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { partnerAuthApi } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"

interface OnboardingIdentity {
  name: string | null
  email: string
}

export function PartnerRegister() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [identity, setIdentity] = useState<OnboardingIdentity | null>(null)
  const [loadingIdentity, setLoadingIdentity] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ company_name: "", phone: "" })

  useEffect(() => {
    if (user?.role === "partner") navigate("/partner/dashboard")
    else if (user?.role === "admin") navigate("/admin/dashboard")
  }, [user, navigate])

  useEffect(() => {
    partnerAuthApi.onboarding()
      .then((data: OnboardingIdentity) => setIdentity(data))
      .catch(() => window.location.assign("/api/sso/start/apply"))
      .finally(() => setLoadingIdentity(false))
  }, [])

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await partnerAuthApi.register(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.errors?.application?.[0] ?? err?.message ?? "Failed to submit application")
    } finally {
      setLoading(false)
    }
  }

  if (loadingIdentity || !identity) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Application submitted</CardTitle>
              <CardDescription>
                Thank you for applying to the Gleent Affiliate program. We’ll review your application and contact {identity.email} with a decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full"><Link to="/partner/login">Back to sign in</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Handshake className="size-6" /></div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">Partner Portal</span>
            <span className="text-sm text-muted-foreground">Gleent Affiliate</span>
          </div>
        </div>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Apply to the program</CardTitle>
            <CardDescription>Submit your application. Portal access is enabled after approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="grid gap-6">
              {(error || searchParams.get("error")) && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {error ?? (searchParams.get("error") === "not_an_active_partner"
                    ? "No active partner profile was found. You can apply using this Gleent Account."
                    : "Please review your application and try again.")}
                </div>
              )}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium">Gleent Account</div>
                <div className="mt-1">{identity.name || identity.email}</div>
                <div className="text-muted-foreground">{identity.email}</div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_name">Company (optional)</Label>
                <Input id="company_name" value={formData.company_name} onChange={(event) => setFormData({ ...formData, company_name: event.target.value })} placeholder="Acme Inc." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} placeholder="+63 912 345 6789" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit application
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already a partner? <Link to="/partner/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PartnerRegister
