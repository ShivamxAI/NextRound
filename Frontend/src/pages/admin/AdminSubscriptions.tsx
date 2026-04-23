import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Users, TrendingUp, AlertCircle, Loader2, MoreHorizontal } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  user_name: string;
  plan: string;
  status: string;
  amount: string;
  renewal_date: string;
}

interface Stats {
  active_subscriptions: number;
  free_users: number;
  monthly_revenue: string;
  expiring_soon: number;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    active_subscriptions: 0,
    free_users: 0,
    monthly_revenue: "₹0",
    expiring_soon: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [manageSub, setManageSub] = useState<Subscription | null>(null);
  const [newPlan, setNewPlan] = useState<string>("free");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await fetchWithAuth("/admin/subscriptions");
      setStats(data.stats);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // UPDATE SUBSCRIPTION LOGIC 
  const handleUpdateSubscription = async () => {
    if (!manageSub) return;
    setIsUpdatingPlan(true);
    
    try {
      // We reuse the exact same endpoint we made for the Users page!
      await fetchWithAuth(`/admin/users/${manageSub.id}/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan: newPlan })
      });
      
      toast({ title: "Subscription Updated", description: `${manageSub.user_name} is now on the ${newPlan.toUpperCase()} plan.` });
      setManageSub(null); 
      
      // Re-fetch everything so the Revenue and Active User cards update instantly!
      await loadData();
      
    } catch (err) {
      toast({ title: "Error", description: "Failed to update subscription.", variant: "destructive" });
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro": return <Badge className="bg-blue-600 hover:bg-blue-700 uppercase text-[10px]">PRO</Badge>;
      // HIGHLIGHTED PREMIUM BADGE!
      case "premium": return <Badge className="bg-indigo-600 hover:bg-indigo-700 shadow-sm border border-indigo-400 uppercase text-[10px]">PREMIUM</Badge>;
      default: return <Badge variant="secondary" className="text-muted-foreground bg-muted uppercase text-[10px]">FREE</Badge>;
    }
  };

  const statsCards = [
    { title: "Active Subscriptions", value: stats.active_subscriptions, icon: CreditCard },
    { title: "Free Users", value: stats.free_users, icon: Users },
    { title: "Monthly Revenue", value: stats.monthly_revenue, icon: TrendingUp },
    { title: "Expiring Soon", value: stats.expiring_soon, icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Subscription Management</h1>
        <p className="text-muted-foreground mt-1">Manage user plans, payments, and billing</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.title === "Expiring Soon" && stats.expiring_soon > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-display ${stat.title === "Expiring Soon" && stats.expiring_soon > 0 ? "text-destructive" : "text-foreground"}`}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-6 py-4 font-semibold">User</TableHead>
                <TableHead className="py-4 font-semibold">Plan</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="py-4 font-semibold">Amount</TableHead>
                <TableHead className="py-4 font-semibold">Renewal Date</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center">
                     <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                   </TableCell>
                 </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium">No subscriptions yet</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Active subscriptions and payment history will appear here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/10">
                    <TableCell className="px-6 py-4 font-medium">{sub.user_name}</TableCell>
                    <TableCell className="py-4">
                      {getPlanBadge(sub.plan)}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={sub.status === "active" ? "outline" : "destructive"} className="capitalize">
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-muted-foreground">
                      {sub.amount}
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground text-sm whitespace-nowrap">
                      {sub.renewal_date}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      
                      {/* ACTIONS DROPDOWN */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Billing Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* MANAGE SUB TRIGGER */}
                          <DropdownMenuItem className="cursor-pointer" onClick={() => { setManageSub(sub); setNewPlan(sub.plan || "free"); }}>
                             <CreditCard className="h-4 w-4 mr-2" /> Manage Subscription
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

      {/* MANAGE SUBSCRIPTION MODAL */}
      <Dialog open={!!manageSub} onOpenChange={() => setManageSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>Update the billing tier for {manageSub?.user_name}.</DialogDescription>
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
              Changing the plan will immediately adjust the expected monthly revenue metrics and update the user's access rights.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageSub(null)}>Cancel</Button>
            <Button onClick={handleUpdateSubscription} disabled={isUpdatingPlan || newPlan === manageSub?.plan}>
              {isUpdatingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}