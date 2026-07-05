import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  allowedRoles?: ("admin" | "partner")[]
  loginPath?: string
}

export function ProtectedRoute({ allowedRoles, loginPath = "/admin/login" }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={loginPath} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === "partner" ? "/partner/dashboard" : "/admin/dashboard"
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
