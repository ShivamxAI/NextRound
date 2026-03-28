import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CreditCard, TrendingUp, Activity, DollarSign, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export default function AdminDashboard() {
  // 1. Set up our state to hold the backend data
  const [stats, setStats] = useState({
    total_users: 0,
    active_users_monthly: 0,
    total_interviews: 0,
    revenue_monthly: 0,
    active_subscriptions: 0,
    avg_performance_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 2. Fetch the data the exact moment the page loads
  useEffect(() => {
    const loadStats = async () => {
      try {
        // This calls our FastAPI /api/admin/stats route securely!
        const data = await fetchWithAuth("/admin/stats");
        
        // Merge the live data into our state
        setStats((prev) => ({ ...prev, ...data }));
      } catch (err: any) {
        console.error("Dashboard Error:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // 3. We define the cards INSIDE the component now so they can read the live 'stats' state
  const statCards = [
    { title: "Total Users", value: stats.total_users, subtext: "Registered accounts", icon: Users },
    { title: "Active Users (Monthly)", value: stats.active_users_monthly, subtext: "In the last 30 days", icon: Activity },
    { title: "Total Interviews", value: stats.total_interviews, subtext: "AI sessions completed", icon: MessageSquare },
    { title: "Revenue (Monthly)", value: `$${stats.revenue_monthly}`, subtext: "Current MRR", icon: DollarSign },
    { title: "Active Subscriptions", value: stats.active_subscriptions || 0, subtext: "Paid pro plans", icon: CreditCard },
    { title: "Avg. Performance Score", value: `${stats.avg_performance_score}%`, subtext: "Across all candidates", icon: TrendingUp },
  ];

  // If the API is still loading, show a nice spinning loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // If the API throws a 403 Forbidden or network error
  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <h2 className="font-bold text-lg mb-2">Access Denied</h2>
        <p>{error}</p>
        <p className="text-sm mt-4 text-red-400">Your are not an admin</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      {/* The Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No recent activity</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Platform activity will appear here once users start using NextRound.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}