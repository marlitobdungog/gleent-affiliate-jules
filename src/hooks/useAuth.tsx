import * as React from "react"
import { authApi } from "@/services/api"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "partner"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authApi.me()
        setUser(currentUser)
      } catch (err) {
        console.error("Not authenticated")
        localStorage.removeItem("auth_user")
      } finally {
        setIsLoading(false)
      }
    }

    const savedUser = localStorage.getItem("auth_user")
    if (savedUser) {
        setUser(JSON.parse(savedUser))
    }

    initAuth()
  }, [])

  const login = (newUser: User) => {
    setUser(newUser)
    localStorage.setItem("auth_user", JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
