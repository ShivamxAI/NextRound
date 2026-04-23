import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link, useNavigate } from "react-router-dom"; 
import { useToast } from "@/hooks/use-toast"; 
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

// FIREBASE IMPORTS 
import { auth } from "../lib/firebase"; 
import { signOut } from "firebase/auth";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Interviews", url: "/admin/interviews", icon: MessageSquare },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Content & AI", url: "/admin/content", icon: Settings },
  { title: "Logs", url: "/admin/logs", icon: FileText },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // LOGOUT LOGIC 
  const handleSignOut = async () => {
    try {
      await signOut(auth); 
      toast({ title: "Signed out successfully" });
      navigate("/login"); 
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ 
        title: "Error signing out", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Sidebar className="border-r-0">
      <div className="px-6 py-5">
        
        {/* THE ESCAPE HATCH */}
        <Link to="/dashboard" className="block transition-opacity hover:opacity-80 cursor-pointer">
          <h1 className="text-xl font-bold font-display text-sidebar-primary-foreground tracking-tight">
            Next<span className="text-sidebar-primary">Round</span>
          </h1>
        </Link>
        {/* ------------------------ */}

        <div className="flex items-center gap-2 mt-1">
          <Shield className="h-3 w-3 text-sidebar-primary" />
          <span className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">Admin Panel</span>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-widest">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* WIRED UP SIGN OUT BUTTON */}
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}