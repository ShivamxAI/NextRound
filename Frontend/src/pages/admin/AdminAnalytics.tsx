import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Briefcase } from "lucide-react";

const metricCards = [
  { title: "Daily Active Users", value: "—", icon: Users },
  { title: "Monthly Active Users", value: "—", icon: Users },
  { title: "Revenue Overview", value: "—", icon: TrendingUp },
  { title: "Popular Job Roles", value: "—", icon: Briefcase },
];

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform metrics and business intelligence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metricCards.map((m) => (
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-foreground">{m.value}</div>
              <p className="text-xs text-muted-foreground mt-1">No data available</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">User growth chart will appear here</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Connect analytics backend to visualize data</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Revenue chart will appear here</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Connect payment backend to visualize data</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Average Performance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Performance distribution chart will appear here</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Data will populate as interviews are conducted</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
