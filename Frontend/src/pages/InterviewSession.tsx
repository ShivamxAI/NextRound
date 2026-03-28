import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, ArrowRight, XCircle, Clock, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- FIREBASE IMPORT ---
import { auth } from "../lib/firebase";

export default function InterviewSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("id");
  const { toast } = useToast();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timer, setTimer] = useState(180); // 3 min per question

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 1. Fetch Questions
  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) {
        navigate("/dashboard");
        return;
      }
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`http://127.0.0.1:8000/api/interview/${interviewId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.questions || []);
        } else {
          throw new Error("Failed to load interview");
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not load interview session.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId, navigate, toast]);

  // 2. Timer Countdown Logic
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // 3. Auto-Advance when Timer hits 0
  useEffect(() => {
    if (timer === 0 && !isSaving) {
      toast({ title: "Time's Up!", description: "Moving to the next question automatically." });
      handleNext(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  // 4. Voice-to-Text Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (currentTranscript) {
          setAnswer((prev) => prev + currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        toast({ title: "Not Supported", description: "Your browser does not support voice recording.", variant: "destructive" });
      }
    }
  };

  // 5. Submit Answer & Next/End Logic
  const handleNext = async (isEndingEarly = false) => {
    setIsSaving(true);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const currentQ = questions[currentIndex];

      // If they ran out of time or clicked next without typing, we submit a fallback string.
      const finalAnswer = answer.trim() !== "" ? answer.trim() : "(No answer provided / Time expired)";

      const response = await fetch(`http://127.0.0.1:8000/api/interview/${interviewId}/answer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: currentQ.id,
          answer: finalAnswer
        })
      });

      if (!response.ok) throw new Error("Failed to save answer");

      // Check if they clicked End Interview, OR if it's the last question
      if (isEndingEarly || currentIndex === questions.length - 1) {
        navigate(`/interview/feedback?id=${interviewId}`);
      } else {
        // Move to next question and reset states
        setCurrentIndex((prev) => prev + 1);
        setAnswer("");
        setTimer(180); // Reset timer to 3 mins
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save answer. Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No questions found.</div>;
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-8">
        <h1 className="font-display font-bold text-foreground">
          Next<span className="text-primary">Round</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${timer < 30 ? "text-destructive animate-pulse" : "text-foreground"}`}>
            <Clock className="h-4 w-4" />
            <span>{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 max-w-3xl mx-auto w-full">
        <Card className="w-full mb-8">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                AI
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Question {currentIndex + 1}</p>
                <p className="text-foreground leading-relaxed text-lg">
                  {currentQ.text}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full space-y-4">
          <Textarea
            rows={6}
            placeholder="Type your answer here or click the microphone to speak..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="resize-none text-base p-4"
          />

          <div className="flex items-center justify-center">
            <button
              onClick={toggleRecording}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-destructive/30 animate-pulse-ring" />
              )}
              {isRecording ? <MicOff className="h-6 w-6 relative z-10" /> : <Mic className="h-6 w-6" />}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {isRecording ? "Listening... speak now (click to stop)" : "Click to answer with your voice"}
          </p>
        </div>
      </div>

      <footer className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto flex justify-between">
          {/* Changed this button to trigger handleNext(true) instead of navigating to Dashboard */}
          <Button variant="outline" onClick={() => handleNext(true)} disabled={isSaving}>
            <XCircle className="mr-2 h-4 w-4" /> End Interview Early
          </Button>
          
          <Button onClick={() => handleNext(false)} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isLastQuestion ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ):null}
            {isSaving ? "Saving..." : isLastQuestion ? "Submit Interview" : "Next Question"}
            {!isLastQuestion && !isSaving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}