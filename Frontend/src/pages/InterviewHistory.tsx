import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { History, Plus, Calendar, Clock, Target, ChevronRight, Loader2 } from "lucide-react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { fetchWithAuth } from "../lib/api"; // Imports the secure API helper

export default function InterviewHistory() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // EFFECT 1: Wait for Firebase 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // EFFECT 2: Fetch history ONLY after user is loaded 
  useEffect(() => {
    // If no user yet (or they are logged out), do not fetch!
    if (!user) return;

    const fetchHistory = async () => {
      try {
        // Use the helper! It automatically handles the token and base URL.
        const data = await fetchWithAuth("/interview/user/history");
        setHistory(data.history || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]); // Runs exactly when the user state updates

  // SHOW LOADER IF FIREBASE OR DATA IS LOADING 
  if (authLoading || (user && isLoading)) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Interview History</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your past practice sessions</p>
        </div>
        <Button asChild>
          <Link to="/interview/setup">
            <Plus className="mr-2 h-4 w-4" /> New Interview
          </Link>
        </Button>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">No interviews yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start your first practice to build your history!
              </p>
              <Button variant="outline" asChild>
                <Link to="/interview/setup">Start Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {history.map((interview) => (
            <Card 
              key={interview.id} 
              className="hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(
                interview.status === "completed" 
                  ? `/interview/feedback?id=${interview.id}` 
                  : `/interview/session?id=${interview.id}`
              )}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground capitalize text-lg">
                      {interview.type} Interview
                    </h3>
                    {interview.status === "completed" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(interview.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {interview.duration_minutes || "30"} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {interview.questions?.length || 0} Questions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                  {interview.status === "completed" && interview.feedback && (
                    <div className="text-center px-4 border-r sm:border-l sm:border-r-0 border-border">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Score</p>
                      <p className="text-2xl font-bold font-display text-primary">
                        {interview.feedback.overall_score}
                      </p>
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0 ml-auto sm:ml-0">
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}