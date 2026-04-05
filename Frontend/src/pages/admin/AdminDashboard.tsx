import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  MessageSquare, 
  IndianRupee, // <-- Using Rupee Icon!
  CreditCard, 
  TrendingUp, 
  Loader2,
  ActivityIcon
} from "lucide-react";
import { fetchWithAuth } from "../../lib/api";

interface DashboardStats {
  total_users: number;
  active_users_monthly: number;
  total_interviews: number;
  revenue_inr: number;
  active_subscriptions: number;
  avg_score: number;
  recent_activity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetchWithAuth("/admin/stats");
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Helper to format date
  const formatDate = (isoString: string) => {
    if (!isoString) return "Just now";
    return new Date(isoString).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Loading platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Users (Monthly)</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display">{stats.active_users_monthly}</div>
            <p className="text-xs text-muted-foreground mt-1">In the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display">{stats.total_interviews}</div>
            <p className="text-xs text-muted-foreground mt-1">AI sessions initiated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Revenue (Monthly)</p>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </div>
            {/* Formatted in INR format */}
            <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-500">
              ₹{stats.revenue_inr.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current MRR</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display">{stats.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid pro/premium plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Performance Score</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display text-indigo-600 dark:text-indigo-400">
              {stats.avg_score}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all completed candidates</p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent_activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ActivityIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No recent activity</p>
              <p className="text-sm text-muted-foreground mt-1">Platform activity will appear here once users start using NextRound.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {stats.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b border-border/50 last:border-0 pb-4 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Candidate: {activity.user}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(activity.date)}
                    </span>
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"} className="text-[10px] uppercase">
                      {activity.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}