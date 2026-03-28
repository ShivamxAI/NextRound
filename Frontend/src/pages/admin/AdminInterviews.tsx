import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquare, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// Define the shape of our Interview data
interface Interview {
  id: string;
  user_name: string;
  role: string;
  type: string;
  score: string | number;
  status: string;
  date: string;
}

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    flagged: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchWithAuth("/admin/interviews");
        setStats(data.stats);
        setInterviews(data.interviews || []);
      } catch (err) {
        console.error("Failed to load interviews:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Move the stats cards inside the component to use the live state
  const statsCards = [
    { title: "Total Interviews", value: stats.total, icon: MessageSquare },
    { title: "Completed", value: stats.completed, icon: CheckCircle2 },
    { title: "In Progress", value: stats.in_progress, icon: Clock },
    { title: "Flagged Responses", value: stats.flagged, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Interview Monitoring</h1>
        <p className="text-muted-foreground mt-1">Track and review all AI interview sessions</p>
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

      {/* Recent Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center">
                     <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                   </TableCell>
                 </TableRow>
              ) : interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium">No interviews yet</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Interview sessions and AI question logs will appear here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">{interview.user_name}</TableCell>
                    <TableCell>{interview.role}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {interview.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {interview.score !== "—" ? `${interview.score}/100` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={interview.status === "completed" ? "default" : "outline"} className="capitalize">
                        {interview.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {interview.date ? new Date(interview.date).toLocaleDateString() : "Unknown"}
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