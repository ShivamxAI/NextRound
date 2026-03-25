import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CreditCard, TrendingUp, Activity, DollarSign } from "lucide-react";

const statCards = [
  { title: "Total Users", value: "—", change: null, icon: Users },
  { title: "Active Users (Monthly)", value: "—", change: null, icon: Activity },
  { title: "Total Interviews", value: "—", change: null, icon: MessageSquare },
  { title: "Revenue (Monthly)", value: "—", change: null, icon: DollarSign },
  { title: "Active Subscriptions", value: "—", change: null, icon: CreditCard },
  { title: "Avg. Performance Score", value: "—", change: null, icon: TrendingUp },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">No data yet</p>
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
