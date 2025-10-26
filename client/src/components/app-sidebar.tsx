import { LayoutDashboard, Plane, Wine, ClipboardCheck, Settings, Calendar, ShoppingCart, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Flight Management",
    url: "/flights",
    icon: Plane,
  },
  {
    title: "Customer Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Bottle Handling",
    url: "/bottles",
    icon: Wine,
  },
  {
    title: "Trolley Verification",
    url: "/trolleys",
    icon: ClipboardCheck,
  },
  {
    title: "Employee Performance",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Replanning",
    url: "/replanning",
    icon: Calendar,
  },
  {
    title: "Airline Rules",
    url: "/rules",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">SmartGate</h1>
            <p className="text-xs text-muted-foreground">GateGroup Operations</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground">v1.0.0 - MVP Edition</p>
      </SidebarFooter>
    </Sidebar>
  );
}
