import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: ("admin" | "partner")[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is logged in but doesn't have the right role
    // We redirect to a safe place or back to login if they shouldn't be here
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
