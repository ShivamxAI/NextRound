import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Users, TrendingUp, AlertCircle, Loader2, MoreHorizontal } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

interface Subscription {
  id: string;
  user_name: string;
  plan: string;
  status: string;
  amount: string;
  renewal_date: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState({
    active_subscriptions: 0,
    free_users: 0,
    monthly_revenue: "$0",
    expiring_soon: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptions = async () => {
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
    loadSubscriptions();
  }, []);

  const statsCards = [
    { title: "Active Subscriptions", value: stats.active_subscriptions, icon: CreditCard },
    { title: "Free Users", value: stats.free_users, icon: Users },
    { title: "Monthly Revenue", value: stats.monthly_revenue, icon: TrendingUp },
    { title: "Expiring Soon", value: stats.expiring_soon, icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
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
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-foreground">
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        Active subscriptions and payment history will appear here once payment integration is enabled.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.user_name}</TableCell>
                    <TableCell>
                      <Badge variant={sub.plan === "pro" ? "default" : "secondary"} className="uppercase text-[10px]">
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "active" ? "outline" : "destructive"} className="capitalize">
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {sub.amount}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {sub.renewal_date}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}