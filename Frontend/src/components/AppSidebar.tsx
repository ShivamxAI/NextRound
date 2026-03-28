import { useState, useEffect } from "react";
import { LayoutDashboard, Plus, History, User, LogOut, Shield } from "lucide-react"; 
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom"; 
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

// --- FIREBASE & API IMPORTS ---
import { auth } from "../lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth"; // <-- Added onAuthStateChanged
import { fetchWithAuth } from "../lib/api"; 

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New Interview", url: "/interview/setup", icon: Plus },
  { title: "History", url: "/history", icon: History },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 1. State to track if the user is an admin
  const [isAdmin, setIsAdmin] = useState(false);

  // 2. Ask the backend for the user's profile when the sidebar loads
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const profile = await fetchWithAuth("/profile/"); 
        if (profile.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Could not verify admin status:", err);
        setIsAdmin(false);
      }
    };

    // --- THE FIX: Listen for Firebase to initialize FIRST ---
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAdminStatus(); // User is confirmed loaded, now check the database!
      } else {
        setIsAdmin(false); // Hide if logged out
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // --- LOGOUT LOGIC ---
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

              {/* 3. The Secret Admin Door! */}
              {/* This will ONLY render if isAdmin is true */}
              {isAdmin && (
                <SidebarMenuItem className="mt-4 pt-4 border-t border-sidebar-border">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <Shield className="h-4 w-4 text-indigo-500" />
                      <span className="text-indigo-500 font-medium">Admin Panel</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
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