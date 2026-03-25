import { LayoutDashboard, Plus, History, User, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom"; // <-- Added for redirection
import { useToast } from "@/hooks/use-toast"; // <-- Added for notifications
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

// --- FIREBASE IMPORTS ---
import { auth } from "../lib/firebase"; // Adjust this path if your firebase file is elsewhere
import { signOut } from "firebase/auth";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New Interview", url: "/interview/setup", icon: Plus },
  { title: "History", url: "/history", icon: History },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- LOGOUT LOGIC ---
  const handleSignOut = async () => {
    try {
      await signOut(auth); // Clears the Firebase session
      toast({ title: "Signed out successfully" });
      navigate("/login"); // Redirects to login page
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
        <h1 className="text-xl font-bold font-display text-sidebar-primary-foreground tracking-tight">
          Next<span className="text-sidebar-primary">Round</span>
        </h1>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-widest">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
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
        {/* --- ATTACHED onClick EVENT HERE --- */}
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