import { useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Handshake, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"

const errorMessages: Record<string, string> = {
  affiliate_access_denied: "This Gleent Account does not have active Affiliate partner access.",
  partner_not_active: "Your partner application is not approved yet, or your access is inactive.",
  not_an_active_partner: "No active Affiliate partner profile is linked to this Gleent Account.",
  account_link_conflict: "This partner profile is linked to a different Gleent Account. Contact support.",
  sso_unavailable: "Sign-in is temporarily unavailable. Please try again shortly.",
  sign_in_failed: "We could not complete sign-in. Please try again.",
  invalid_sso_state: "This sign-in request expired. Please start again.",
}

export function PartnerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === "partner") navigate("/partner/dashboard")
    else if (user?.role === "admin") navigate("/admin/dashboard")
  }, [user, navigate])

  const startSignIn = () => window.location.assign("/api/sso/start/login")

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
            <CardTitle className="text-xl">Sign in to Affiliate</CardTitle>
            <CardDescription>
              Use your Gleent Account to access referrals, commissions, and payouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {searchParams.get("error") && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {errorMessages[searchParams.get("error")!] ?? "Sign-in could not be completed."}
              </div>
            )}
            <Button type="button" className="w-full" onClick={startSignIn}>
              <LogIn className="mr-2 size-4" />
              Continue with Gleent Account
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Not a partner yet?{" "}
              <Link to="/partner/register" className="font-medium text-primary hover:underline">
                Apply to the program
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PartnerLogin
