import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mic, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Resume Analysis",
    description: "Upload your resume and get AI-powered insights to match any job description.",
  },
  {
    icon: Mic,
    title: "Voice Interviews",
    description: "Practice with realistic voice-based interviews powered by speech recognition.",
  },
  {
    icon: BarChart3,
    title: "Smart Feedback",
    description: "Receive detailed evaluation on technical accuracy, communication, and confidence.",
  },
];

const stats = [
  { label: "Mock Interviews", value: "50K+" },
  { label: "Success Rate", value: "87%" },
  { label: "Active Users", value: "10K+" },
  { label: "Avg. Score Boost", value: "+34%" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground">
            Next<span className="text-primary">Round</span>
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              AI-Powered Interview Prep
            </span>
            <h2 className="text-4xl lg:text-6xl font-bold font-display text-foreground leading-tight mb-6">
              Prepare for Your Next Interview with{" "}
              <span className="text-primary">Confidence</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              NextRound simulates real-world technical and behavioral interviews using AI,
              helping you practice, improve, and land your dream job.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" asChild className="px-8">
                <Link to="/signup">
                  Start Practicing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold font-display text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold font-display text-foreground mb-3">
              Everything You Need to Ace Your Interview
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our AI engine analyzes your resume, generates tailored questions, and evaluates your responses in real-time.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold font-display text-foreground mb-2">{f.title}</h4>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card border-y">
        <div className="container mx-auto px-4 max-w-3xl">
          <h3 className="text-3xl font-bold font-display text-foreground text-center mb-12">
            How It Works
          </h3>
          <div className="space-y-6">
            {[
              "Upload your resume and target job description",
              "Configure your interview — type, duration, and focus areas",
              "Practice with AI-generated questions via voice or text",
              "Get detailed feedback and actionable improvement tips",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                  {i + 1}
                </div>
                <p className="text-foreground pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold font-display text-foreground mb-4">
            Ready to Ace Your Next Interview?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join thousands of candidates who improved their interview skills with NextRound.
          </p>
          <Button size="lg" asChild className="px-8">
            <Link to="/signup">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-display font-semibold text-foreground">
            Next<span className="text-primary">Round</span>
          </p>
          <p>© {new Date().getFullYear()} NextRound. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
