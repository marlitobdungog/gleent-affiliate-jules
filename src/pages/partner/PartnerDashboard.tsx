import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Handshake, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { authApi } from "@/services/api"

export function PartnerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Session may already be cleared
    }
    logout()
    navigate("/partner/login")
  }

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Handshake className="size-4" />
            </div>
            <span className="font-semibold">Partner Portal</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
            <CardDescription>
              Your partner dashboard is being set up. You'll soon be able to track referrals,
              commissions, and payouts here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account status: pending review. An admin will activate your partner account shortly.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default PartnerDashboard
