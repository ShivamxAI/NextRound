import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, RotateCcw, Target, MessageSquare, Shield, Zap, TrendingUp, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- FIREBASE IMPORT ---
import { auth } from "../lib/firebase";

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("id");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [feedback, setFeedback] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- TRIGGER AI EVALUATION ON LOAD ---
  useEffect(() => {
    const evaluateInterview = async () => {
      if (!interviewId) {
        navigate("/dashboard");
        return;
      }

      try {
        const token = await auth.currentUser?.getIdToken();
        
        // This triggers the backend to grade the interview
        const response = await fetch(`/api/interview/${interviewId}/evaluate`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error("Failed to generate feedback");

        const data = await response.json();
        setFeedback(data);

      } catch (error) {
        console.error(error);
        toast({ title: "Evaluation Failed", description: "Could not load your interview results.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateInterview();
  }, [interviewId, navigate, toast]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center max-w-md mx-auto">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-display font-semibold">Analyzing Your Performance</h2>
        <p className="text-muted-foreground text-sm">
          Our AI hiring manager is reviewing your transcript, calculating your scores, and extracting personalized feedback. This usually takes 5-10 seconds.
        </p>
      </div>
    );
  }

  // Error/Empty State
  if (!feedback) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Could not load feedback data.</p>
        <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  // Map backend metrics to the frontend UI
  const categories = [
    { label: "Technical Accuracy", icon: Target, score: feedback.metrics?.technical_accuracy || 0 },
    { label: "Communication", icon: MessageSquare, score: feedback.metrics?.communication || 0 },
    { label: "Confidence", icon: Shield, score: feedback.metrics?.confidence || 0 },
    { label: "Fluency", icon: Zap, score: feedback.metrics?.fluency || 0 },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Interview Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your performance and improve</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
          <Button asChild>
            <Link to="/interview/setup">
              <RotateCcw className="mr-2 h-4 w-4" /> Practice Again
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="p-8 flex flex-col items-center text-center bg-primary/5 rounded-xl border-primary/10">
          <div className="w-28 h-28 rounded-full border-8 border-primary flex items-center justify-center mb-4 bg-background shadow-sm">
            <span className="text-4xl font-bold font-display text-primary">{feedback.overall_score}</span>
          </div>
          <p className="text-foreground font-semibold text-lg">Overall Score</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {feedback.overall_score >= 80 ? "Great job! You showed strong competency in this interview." : "Keep practicing! Review your weak points below to improve."}
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        {categories.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <Progress value={c.score} className="h-1.5 mt-2" />
              </div>
              <span className="text-lg font-semibold font-display text-foreground shrink-0">{c.score}%</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {feedback.strengths?.map((strength: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {feedback.improvements?.map((improvement: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5 ml-1" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}