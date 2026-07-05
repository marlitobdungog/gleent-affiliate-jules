import {
  LayoutDashboard,
  Link2,
  UserPlus,
  GitBranch,
  Coins,
  Wallet,
  Image,
  User,
  Handshake,
  LogOut,
  ChevronRight,
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
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { authApi } from "@/services/api"

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, route: "/partner/dashboard" },
  { label: "My Link", icon: Link2, route: "/partner/my-link" },
  { label: "Referrals", icon: UserPlus, route: "/partner/referrals" },
  { label: "Lead Stages", icon: GitBranch, route: "/partner/lead-stages" },
  { label: "Commissions", icon: Coins, route: "/partner/commissions" },
  { label: "Payouts", icon: Wallet, route: "/partner/payouts" },
  { label: "Marketing Assets", icon: Image, route: "/partner/marketing-assets" },
]

const accountNav = [
  { label: "Profile", icon: User, route: "/partner/profile" },
]

export function PartnerSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      logout()
      navigate("/partner/login")
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Handshake className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
              Partner Portal
            </span>
            <span className="text-xs text-sidebar-foreground/60 leading-tight truncate">
              Gleent Affiliate
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
                  <SidebarMenuButton asChild tooltip={item.label} className="cursor-pointer">
                    <NavLink
                      to={item.route}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNav.map((item) => (
                <SidebarMenuItem key={item.route}>
                  <SidebarMenuButton asChild tooltip={item.label} className="cursor-pointer">
                    <NavLink
                      to={item.route}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 space-y-2">
        {user && (
          <div className="px-2 py-1.5 flex flex-col min-w-0">
            <span className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</span>
            <span className="text-[10px] text-sidebar-foreground/60 truncate">{user.email}</span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Logout"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-sidebar-foreground/50">
          <ChevronRight className="size-3 shrink-0" />
          <span className="truncate">Partner affiliate program</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
