import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth.tsx"

function Root() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <App />
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}

const router = createBrowserRouter([{ path: "*", element: <Root /> }])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
