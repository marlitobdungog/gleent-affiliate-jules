import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, Loader2 } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import { useState } from "react"
import { authApi } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import * as React from "react"

export function Login() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (user) {
      navigate("/admin/dashboard")
    }
  }, [user, navigate])
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await authApi.login(formData)
      login(response.user)
      navigate("/admin/dashboard")
    } catch (err: any) {
      setError(err.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="size-6" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">Admin Portal</span>
            <span className="text-sm text-muted-foreground">Gleent Affiliate</span>
          </div>
        </div>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Login to your account to manage the affiliate program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                Login
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link to="/admin/register" className="text-primary hover:underline font-medium">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
