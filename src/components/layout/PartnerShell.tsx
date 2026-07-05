import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PartnerSidebar } from "./PartnerSidebar"
import { PartnerTopbar } from "./PartnerTopbar"
import { Outlet } from "react-router-dom"

export function PartnerShell() {
  return (
    <SidebarProvider>
      <PartnerSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <PartnerTopbar />
        <main className="flex-1 bg-muted/30 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
