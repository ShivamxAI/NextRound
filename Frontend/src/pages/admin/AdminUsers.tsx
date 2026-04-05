import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // <-- New!
import { Search, Users, Filter, Loader2, MoreHorizontal, Trash2, User, CreditCard, Calendar, Activity } from "lucide-react"; // <-- Added Icons
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// 1. Define the shape of our User data from the backend
interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
  interviews?: number; // <-- Added this!
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // 2. Add state for our backend data
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal Action States
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<UserData | null>(null);
  const [manageUser, setManageUser] = useState<UserData | null>(null);
  const [newPlan, setNewPlan] = useState<string>("free");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  
  const { toast } = useToast();

  // 3. Fetch users when the component loads
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchWithAuth("/admin/users");
        setUsers(data.users || []);
      } catch (err: any) {
        console.error("Failed to load users:", err);
        setError(err.message || "Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // --- DELETE LOGIC ---
  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(`⚠️ WARNING: Are you absolutely sure you want to delete ${userName}?\n\nThis will permanently erase their account, profile, and ALL of their past interview data. This action CANNOT be undone.`);
    if (!confirmed) return;

    setIsDeleting(userId);
    try {
      await fetchWithAuth(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "User Deleted", description: `${userName} and all associated data have been permanently removed.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete user. Check server logs.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  // --- UPDATE SUBSCRIPTION LOGIC ---
  const handleUpdateSubscription = async () => {
    if (!manageUser) return;
    setIsUpdatingPlan(true);
    
    try {
      await fetchWithAuth(`/admin/users/${manageUser.id}/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan: newPlan })
      });
      
      // Update the user in our local state so the UI refreshes instantly without needing a page reload
      setUsers(users.map(u => u.id === manageUser.id ? { ...u, plan: newPlan } : u));
      toast({ title: "Subscription Updated", description: `${manageUser.name} is now on the ${newPlan.toUpperCase()} plan.` });
      setManageUser(null); // Close the modal
    } catch (err) {
      toast({ title: "Error", description: "Failed to update subscription.", variant: "destructive" });
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // 4. Real-time Filtering Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">View, search, and manage registered users</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interviews</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-red-500 font-medium">{error}</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium">No users found</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {search || statusFilter !== 'all' ? "Try adjusting your search or filters." : "Registered users will appear here once authentication is enabled."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.plan === "pro" || user.plan === "premium" ? "default" : "secondary"} className="uppercase text-[10px]">
                        {user.plan || "free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "outline" : "destructive"} className="capitalize">
                        {user.status || "active"}
                      </Badge>
                    </TableCell>
                    
                    {/* --- REAL INTERVIEW COUNT --- */}
                    <TableCell className="text-foreground font-medium pl-6">
                      {user.interviews || 0}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      
                      {/* --- ACTIONS DROPDOWN --- */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting === user.id}>
                            {isDeleting === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* VIEW PROFILE TRIGGER */}
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewUser(user)}>
                             <User className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          
                          {/* MANAGE SUB TRIGGER */}
                          <DropdownMenuItem className="cursor-pointer" onClick={() => { setManageUser(user); setNewPlan(user.plan || "free"); }}>
                             <CreditCard className="h-4 w-4 mr-2" /> Manage Subscription
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* DELETE BUTTON */}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- POPUP 1: VIEW PROFILE MODAL --- */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>Overview of the user's account and platform statistics.</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {viewUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{viewUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5"/> Current Plan</p>
                  <p className="font-medium uppercase">{viewUser.plan || "free"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> Account Status</p>
                  <p className="font-medium capitalize">{viewUser.status || "Active"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1.5"><Search className="h-3.5 w-3.5"/> Interviews Taken</p>
                  <p className="font-medium">{viewUser.interviews || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> Join Date</p>
                  <p className="font-medium">{formatDate(viewUser.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- POPUP 2: MANAGE SUBSCRIPTION MODAL --- */}
      <Dialog open={!!manageUser} onOpenChange={() => setManageUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>Update the billing tier for {manageUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Plan</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Tier (₹0)</SelectItem>
                  <SelectItem value="pro">Pro Tier (₹99/mo)</SelectItem>
                  <SelectItem value="premium">Premium Tier (₹299/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Changing the plan will immediately update the user's access rights and permissions across the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateSubscription} disabled={isUpdatingPlan || newPlan === manageUser?.plan}>
              {isUpdatingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}