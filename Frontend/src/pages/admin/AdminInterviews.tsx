import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, TrendingUp, Briefcase, Search, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

interface Interview {
  id: string;
  user_name: string;
  role: string;
  type: string;
  score: string | number;
  status: string;
  date: string;
}

interface InterviewStats {
  total: number;
  industry_count?: number; 
  avg_score: number;
  popular_role: string;
}

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadInterviews = async () => {
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
    loadInterviews();
  }, []);

  const filteredInterviews = interviews.filter((inv) =>
    inv.user_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.role.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    if (!isoString) return "Unknown";
    const date = new Date(isoString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Loading interview records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Interview Monitoring</h1>
        <p className="text-muted-foreground mt-1">Track and review all AI interview sessions</p>
      </div>

      {/* METRICS GRID - Updated to 3 columns to perfectly fit the remaining cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-display text-emerald-500">{stats.avg_score}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Most Common Role</p>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl font-bold font-display truncate pt-2">{stats.popular_role}</div>
          </CardContent>
        </Card>
      </div>

      {/* INTERVIEWS TABLE */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <CardTitle className="font-display text-lg">Recent Interviews</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search user or role..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-6 py-4 font-semibold text-foreground">User</TableHead>
                <TableHead className="py-4 font-semibold text-foreground">Role</TableHead>
                <TableHead className="py-4 font-semibold text-foreground">Type</TableHead>
                <TableHead className="py-4 font-semibold text-foreground text-center">Score</TableHead>
                <TableHead className="py-4 font-semibold text-foreground">Status</TableHead>
                <TableHead className="py-4 font-semibold text-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">No interviews found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterviews.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/10">
                    <TableCell className="px-6 py-4 font-medium">{inv.user_name}</TableCell>
                    <TableCell className="py-4 text-muted-foreground">{inv.role}</TableCell>
                    <TableCell className="py-4">
                      {/* Dynamic Badge: Highlights anything that is NOT 'General' */}
                      {inv.type.toLowerCase() === "general" ? (
                        <Badge variant="secondary" className="uppercase text-[10px]">{inv.type}</Badge>
                      ) : (
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200 shadow-sm font-semibold uppercase text-[10px]">
                          {inv.type}
                        </Badge>
                      )}
                    </TableCell>
                    
                    {/* Render Real Score */}
                    <TableCell className="py-4 text-center font-bold text-foreground">
                      {inv.score}
                    </TableCell>

                    <TableCell className="py-4">
                      <Badge className="bg-blue-600 hover:bg-blue-700 capitalize">
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(inv.date)}
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