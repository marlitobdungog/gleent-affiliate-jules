import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PerformanceSidebar } from "./PerformanceSidebar"
import { PerformanceTopbar } from "./PerformanceTopbar"

interface PerformanceShellProps {
  children: React.ReactNode
  activePage: string
  onNavigate: (route: string) => void
}

export function PerformanceShell({ children, activePage, onNavigate }: PerformanceShellProps) {
  return (
    <SidebarProvider>
      <PerformanceSidebar activePage={activePage} onNavigate={onNavigate} />
      <SidebarInset className="flex flex-col min-h-svh">
        <PerformanceTopbar />
        <main className="flex-1 bg-muted/30 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
