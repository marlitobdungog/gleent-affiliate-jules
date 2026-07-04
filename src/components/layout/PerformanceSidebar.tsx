import {
  LayoutDashboard,
  Users,
  FileText,
  UserPlus,
  Handshake,
  Coins,
  Wallet,
  Package,
  Settings,
  ChevronRight,
  BarChart3,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, route: "dashboard" },
  { label: "Partners", icon: Users, route: "partners" },
  { label: "Applications", icon: FileText, route: "applications" },
  { label: "Referrals", icon: UserPlus, route: "referrals" },
  { label: "Deals", icon: Handshake, route: "deals" },
  { label: "Commissions", icon: Coins, route: "commissions" },
  { label: "Payouts", icon: Wallet, route: "payouts" },
  { label: "Products", icon: Package, route: "products" },
  { label: "Settings", icon: Settings, route: "settings" },
]

interface PerformanceSidebarProps {
  activePage: string
  onNavigate: (route: string) => void
}

export function PerformanceSidebar({ activePage, onNavigate }: PerformanceSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <BarChart3 className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
              Gleent
            </span>
            <span className="text-xs text-sidebar-foreground/60 leading-tight truncate">
              Affiliate
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.route}>
                  <SidebarMenuButton
                    isActive={activePage === item.route}
                    tooltip={item.label}
                    onClick={() => onNavigate(item.route)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-sidebar-foreground/50">
          <ChevronRight className="size-3 shrink-0" />
          <span className="truncate">Connected to SprintHR Core</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
