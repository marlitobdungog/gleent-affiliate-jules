import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PerformanceSidebar } from "./PerformanceSidebar"
import { PerformanceTopbar } from "./PerformanceTopbar"
import { Outlet } from "react-router-dom"

export function PerformanceShell() {
  return (
    <SidebarProvider>
      <PerformanceSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <PerformanceTopbar />
        <main className="flex-1 bg-muted/30 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
