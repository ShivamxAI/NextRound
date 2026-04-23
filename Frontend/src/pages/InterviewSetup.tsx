import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Upload, Brain, MessageSquare, Shuffle, Clock, Hash, CheckCircle2, Loader2, Briefcase, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// IMPORT SECURE API HELPER 
import { fetchWithAuth } from "../lib/api";

const interviewTypes = [
  { id: "technical", label: "Technical", icon: Brain, description: "DSA, system design, and coding questions" },
  { id: "behavioral", label: "Behavioral", icon: MessageSquare, description: "Situational and experience-based questions" },
  { id: "mixed", label: "Mixed", icon: Shuffle, description: "A blend of technical and behavioral questions" },
];

export default function InterviewSetup() {
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("30");
  const [questions, setQuestions] = useState("10");
  
  // Industry Focus State 
  const [industry, setIndustry] = useState("general");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPlan, setUserPlan] = useState("free"); 
  
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Dynamic Limits based on Plan
  const maxDuration = userPlan === "free" ? 30 : 90;
  const maxQuestions = userPlan === "free" ? 10 : 25;

  // Fetch plan on load
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const profile = await fetchWithAuth("/profile/");
        setUserPlan(profile.plan?.toLowerCase() || "free");
      } catch (error) {
        console.error("Failed to load profile for limits", error);
      }
    };
    fetchPlan();
  }, []);

  const canNext = () => {
    if (step === 1) return jobDescription.trim().length > 0 || jdFile !== null;
    if (step === 2) return type !== "";
    if (step === 3) {
      const d = parseInt(duration) || 0;
      const q = parseInt(questions) || 0;
      return d >= 5 && d <= maxDuration && q >= 1 && q <= maxQuestions;
    }
    return true;
  };

  const handleStartInterview = async () => {
    setIsGenerating(true);
    try {
      const finalJD = jobDescription.trim() || "Please refer to uploaded JD.";

      const data = await fetchWithAuth("/interview/generate", {
        method: "POST",
        body: JSON.stringify({
          job_description: finalJD,
          interview_type: type,
          duration_minutes: parseInt(duration),
          question_count: parseInt(questions),
          industry: industry // Sends industry to the backend!
        })
      });

      toast({ title: "Interview Ready!", description: "AI has customized your questions." });
      navigate(`/interview/session?id=${data.interview_id}`);
      
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("FREE_LIMIT_REACHED")) {
        toast({ 
          title: "Limit Reached", 
          description: "You've used your 3 free interviews this month. Upgrade to Pro for unlimited access!", 
          variant: "destructive"
        });
        navigate("/pricing"); 
      } else {
        toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInterviewTypeButtons = () => {
    return interviewTypes.map((t) => {
      const isSelected = type === t.id;
      return (
        <button
          key={t.id}
          onClick={() => setType(t.id)}
          className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-colors ${
            isSelected
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30 hover:bg-muted/50"
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
            <t.icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="font-medium text-foreground">{t.label}</p>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>
        </button>
      );
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">New Interview</h1>
        <p className="text-sm text-muted-foreground mt-1">Step {step} of {totalSteps}</p>
      </div>

      <Progress value={progress} className="h-2" />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Job Description</CardTitle>
            <CardDescription>Paste the job description or upload it as a file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Paste Job Description</Label>
              <Textarea
                rows={6}
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">or</div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {jdFile ? jdFile.name : "Upload JD File"}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setJdFile(e.target.files?.[0] || null)} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Interview Type</CardTitle>
            <CardDescription>Choose the type of interview you want to practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderInterviewTypeButtons()}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Settings</CardTitle>
            <CardDescription>Configure duration, questions, and industry focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* --- NEW: INDUSTRY FOCUS DROPDOWN --- */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Industry Focus
              </Label>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={userPlan !== "premium"}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="general">General (Standard Questions)</option>
                  <option value="faang">Big Tech / FAANG</option>
                  <option value="fintech">FinTech & Trading</option>
                  <option value="healthtech">HealthTech & HIPAA</option>
                  <option value="ecommerce">E-Commerce & Retail</option>
                  <option value="startup">Early-stage Startup</option>
                </select>
                {/* Lock Icon overlay for non-premium users */}
                {userPlan !== "premium" && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-amber-500" />
                  </div>
                )}
              </div>
              {userPlan !== "premium" && (
                <div className="text-xs text-muted-foreground mt-1">
                  Industry-specific targeting is a Premium feature. <Link to="/pricing" className="text-primary hover:underline">Upgrade here.</Link>
                </div>
              )}
            </div>
            {/* ------------------------------------ */}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Duration (minutes)
              </Label>
              <Input 
                type="number" 
                min="5" 
                max={maxDuration} 
                value={duration} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") setDuration("");
                  else if (parseInt(val) > maxDuration) setDuration(maxDuration.toString());
                  else setDuration(val);
                }} 
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Minimum: 5 mins</span>
                <span>
                  Maximum: {maxDuration} mins 
                  {userPlan === "free" && (
                    <Link to="/pricing" className="text-primary hover:underline ml-1">
                      (Upgrade for 90 mins)
                    </Link>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" /> Number of Questions
              </Label>
              <Input 
                type="number" 
                min="1" 
                max={maxQuestions} 
                value={questions} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") setQuestions("");
                  else if (parseInt(val) > maxQuestions) setQuestions(maxQuestions.toString());
                  else setQuestions(val);
                }} 
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Minimum: 1 question</span>
                <span>
                  Maximum: {maxQuestions} questions
                  {userPlan === "free" && (
                    <Link to="/pricing" className="text-primary hover:underline ml-1">
                      (Upgrade for 25 limits)
                    </Link>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Review & Start</CardTitle>
            <CardDescription>Confirm your interview settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Job Description</span>
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {jdFile ? jdFile.name : jobDescription.slice(0, 40) + "..."}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Interview Type</span>
                <span className="text-foreground font-medium capitalize">{type}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Industry</span>
                <span className="text-foreground font-medium capitalize">{industry === "general" ? "Standard" : industry}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground font-medium">{duration} min</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Questions</span>
                <span className="text-foreground font-medium">{questions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}
          disabled={isGenerating}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {step > 1 ? "Back" : "Cancel"}
        </Button>
        
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleStartInterview} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Start Interview
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}