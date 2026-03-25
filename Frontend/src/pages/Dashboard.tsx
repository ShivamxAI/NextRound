import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Target, Clock, Activity, ArrowRight, Loader2 } from "lucide-react";
import { auth } from "../lib/firebase";

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch("/api/interview/user/history", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // --- CALCULATE STATS ---
  const completedInterviews = history.filter(i => i.status === "completed" && i.feedback);
  const totalInterviews = completedInterviews.length;
  
  const avgScore = totalInterviews > 0 
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.feedback?.overall_score || 0), 0) / totalInterviews)
    : "—";

  const lastPracticeDate = totalInterviews > 0
    ? new Date(completedInterviews[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : "—";

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Welcome back!</h1>
          <p className="text-sm text-muted-foreground mt-1">Ready for your next practice round?</p>
        </div>
        <Button onClick={() => navigate("/interview/setup")}>
          <Activity className="mr-2 h-4 w-4" /> Start New Interview
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
              <p className="text-2xl font-bold font-display text-foreground">{totalInterviews}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Score</p>
              <p className="text-2xl font-bold font-display text-foreground">{avgScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Practice</p>
              <p className="text-2xl font-bold font-display text-foreground">{lastPracticeDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-foreground">Recent Interviews</h2>
          {history.length > 0 && (
            <Button variant="ghost" className="text-sm" asChild>
              <Link to="/history">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No interviews yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Start your first practice to see your history, scores, and AI feedback here.
              </p>
              <Button variant="outline" onClick={() => navigate("/interview/setup")}>
                Start Practice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {/* Show only the 3 most recent interviews on the dashboard */}
            {history.slice(0, 3).map((interview) => (
              <Card key={interview.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/interview/feedback?id=${interview.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground capitalize">{interview.type} Interview</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(interview.created_at).toLocaleDateString()} • {interview.questions?.length || 0} Questions
                    </p>
                  </div>
                  <div className="text-right">
                    {interview.status === "completed" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Score: {interview.feedback?.overall_score || "N/A"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        In Progress
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}