import { useState, useEffect } from "react";
import { LayoutDashboard, Plus, History, User, LogOut, Shield, Sparkles } from "lucide-react"; 
import { NavLink } from "@/components/NavLink";
import { Link, useNavigate } from "react-router-dom"; // <-- Added Link here
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

// FIREBASE & API IMPORTS 
import { auth } from "../lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth"; 
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
  
  // States for Admin and Subscription Plan
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");

  // Ask the backend for the user's profile when the sidebar loads
  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const profile = await fetchWithAuth("/profile/"); 
        
        // Check Admin Status
        if (profile.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        // Set the Subscription Plan
        if (profile.plan) {
          setUserPlan(profile.plan.toLowerCase());
        }

      } catch (err) {
        console.error("Could not verify user profile:", err);
        setIsAdmin(false);
      }
    };

    // Listen for Firebase to initialize FIRST
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkUserProfile(); 
      } else {
        setIsAdmin(false); 
        setUserPlan("free");
      }
    });

    return () => unsubscribe();
  }, []);

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
      {/* LOGO AND CLICKABLE PRO BADGE AREA */}
      <div className="px-6 py-5 flex items-center gap-2">
        <h1 className="text-xl font-bold font-display text-sidebar-primary-foreground tracking-tight">
          Next<span className="text-sidebar-primary">Round</span>
        </h1>
        
        {/* Clickable Pro Badge */}
        {userPlan === "pro" && (
          <Link to="/pricing" className="mt-1 outline-none">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm cursor-pointer hover:shadow-md hover:opacity-90 hover:scale-105 transition-all inline-block">
              Pro
            </span>
          </Link>
        )}

        {/* Clickable Premium Badge */}
        {userPlan === "premium" && (
          <Link to="/pricing" className="mt-1 outline-none">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm cursor-pointer hover:shadow-md hover:opacity-90 hover:scale-105 transition-all inline-block">
              Premium
            </span>
          </Link>
        )}
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

              {/* UPGRADE CTA (Only show if they are on the free plan!) */}
              {userPlan === "free" && (
                <SidebarMenuItem className="mt-2 mb-2">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/pricing"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors font-medium border border-transparent hover:border-amber-200/50"
                      activeClassName="bg-amber-50 text-amber-700 border-amber-200/50"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Upgrade</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* The Secret Admin Door! */}
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