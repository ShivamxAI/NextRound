import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, RotateCcw, Target, MessageSquare, Shield, Zap, TrendingUp, AlertTriangle, Loader2, CheckCircle, Lock, Map, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// IMPORT FOR MARKDOWN RENDERING 
import ReactMarkdown from 'react-markdown';
// ------------------------------------------

// FIREBASE & API IMPORTS 
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fetchWithAuth } from "../lib/api";

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("id");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [feedback, setFeedback] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("free");

  // Fetch user plan safely
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await fetchWithAuth("/profile/");
          setUserPlan(profile.plan?.toLowerCase() || "free");
        } catch (error) {
          console.error("Failed to fetch plan", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Trigger AI Evaluation on load
  useEffect(() => {
    if (!interviewId) {
      navigate("/dashboard");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const data = await fetchWithAuth(`/interview/${interviewId}/evaluate`, {
            method: "POST"
          });
          setFeedback(data);
        } catch (error) {
          console.error(error);
          toast({ title: "Evaluation Failed", description: "Could not load your interview results.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [interviewId, navigate, toast]);

  const handleDownload = () => {
    if (userPlan === "free") {
      toast({ 
        title: "Pro Feature 🔒", 
        description: "Downloading detailed reports is only available on Pro and Premium plans.", 
      });
      navigate("/pricing");
      return;
    }
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center max-w-md mx-auto">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-display font-semibold">Analyzing Your Performance</h2>
        <p className="text-muted-foreground text-sm">
          Our AI hiring manager is reviewing your transcript, calculating your scores, and extracting personalized feedback...
        </p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Could not load feedback data.</p>
        <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  const categories = [
    { label: "Technical Accuracy", icon: Target, score: feedback.metrics?.technical_accuracy || 0 },
    { label: "Communication", icon: MessageSquare, score: feedback.metrics?.communication || 0 },
    { label: "Confidence", icon: Shield, score: feedback.metrics?.confidence || 0 },
    { label: "Fluency", icon: Zap, score: feedback.metrics?.fluency || 0 },
  ];

  // Dummy data for the blurred background if they aren't Premium
  const mockRoadmap = [
    "Review advanced state management to handle complex prop drilling scenarios.",
    "Practice 3 LeetCode Medium dynamic programming problems focusing on memoization.",
    "Do a mock behavioral interview focusing entirely on the STAR method for conflict resolution."
  ];

  // Determine what to render in the roadmap section
  const roadmapSteps = userPlan === "premium" 
  ? (feedback.roadmap || ["Roadmap unavailable for legacy interviews. Please start a new practice round!"]) 
  : mockRoadmap;
  const showPremiumOverlay = userPlan !== "premium";

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Interview Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your performance and improve</p>
        </div>
        
        {/* ADDED print:hidden to hide these buttons when printing */}
        <div className="flex gap-2 print:hidden">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className={userPlan === "free" ? "hover:border-amber-400 hover:text-amber-600 transition-colors" : ""}
          >
            {userPlan === "free" ? <Lock className="mr-2 h-4 w-4 text-amber-500" /> : <Download className="mr-2 h-4 w-4" />}
            Download Report
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
                <p className="text-sm text-muted-foreground mt-1">{c.score}%</p>
                <Progress value={c.score} className="h-1.5 mt-2" />
              </div>
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

      {/* AI ROADMAP UPSELL CARD */}
      <Card className="relative overflow-hidden border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50">
          <CardTitle className="text-lg font-display flex items-center gap-2 text-indigo-900">
            <Map className="h-5 w-5 text-indigo-500" /> 
            Personalized Action Plan
          </CardTitle>
          <CardDescription className="text-indigo-700/70">
            A step-by-step AI generated roadmap to help you master your weak points.
          </CardDescription>
        </CardHeader>
        
        <CardContent className={`p-6 relative ${showPremiumOverlay ? "min-h-[320px]" : ""}`}>
          
          {/* The Data (Blurred if not premium) */}
          <div className={`space-y-6 ${showPremiumOverlay ? "blur-[5px] opacity-40 pointer-events-none select-none" : ""}`}>
            {roadmapSteps.map((step: string, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="pt-1.5">
                  <p className="text-foreground font-medium text-sm leading-relaxed">{step}</p>
                </div>
              </div>
            ))}
          </div>

          {/* The Lock Overlay (Only shows for Free and Pro) */}
          {showPremiumOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px]">
              <div className="bg-card p-6 rounded-xl border shadow-lg text-center max-w-sm w-[90%] mx-auto mt-4">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold font-display text-foreground mb-2">Premium Feature</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Unlock your hyper-personalized, 3-step AI improvement roadmap to guarantee you ace the real interview.
                </p>
                <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0" asChild>
                  <Link to="/pricing">
                    Upgrade to Premium <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PREMIUM: QUESTION-BY-QUESTION BREAKDOWN */}
      {feedback?.question_feedback && feedback.question_feedback.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold font-display">Question-by-Question Analysis</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Premium Feature</span>
          </div>

          <div className="space-y-6">
            {feedback.question_feedback.map((item: any, index: number) => (
              <div key={index} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                {/* Question Header */}
                <div className="bg-slate-50 p-4 border-b">
                  <p className="font-semibold text-slate-800">
                    <span className="text-primary mr-2">Q{index + 1}:</span> 
                    {item.question}
                  </p>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User's Answer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wide">
                      <span>Your Answer</span>
                    </div>
                    {/* Kept your gray italic style here */}
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 h-full max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible border border-slate-100 italic whitespace-pre-wrap leading-relaxed">
                      <ReactMarkdown>
                        {item.user_answer ? `"${item.user_answer}"` : "*(No answer provided)*"}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Ideal Answer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 uppercase tracking-wide">
                      <span>Ideal Answer</span>
                    </div>
                    {/* Restored Emerald styling */}
                    <div className="bg-emerald-50/50 p-4 rounded-lg text-sm border border-emerald-100 h-full max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible">
                        <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed marker:text-emerald-500">
                            <ReactMarkdown>
                                {item.ideal_answer}
                            </ReactMarkdown>
                        </div>
                    </div>
                  </div>
                </div>

                {/* AI Critique */}
                <div className="px-4 pb-4">
                  {/* Restored Indigo styling */}
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg max-h-[250px] overflow-y-auto print:max-h-none print:overflow-visible">
                    <p className="text-sm font-semibold text-indigo-900 mb-2">AI Critique:</p>
                    <div className="text-sm text-indigo-800/80 leading-relaxed whitespace-pre-wrap break-words">
                      <ReactMarkdown>
                        {item.critique}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}