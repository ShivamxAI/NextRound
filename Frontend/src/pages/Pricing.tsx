import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with basic interview practice",
    badge: null,
    features: [
      "3 mock interviews/month",
      "Basic feedback",
      "Text responses only",
      "Limited JD analysis",
    ],
    cta: "Start Free",
    variant: "outline" as const,
    href: "/signup",
  },
  {
    name: "Pro",
    price: "₹99",
    period: "/month",
    description: "Unlock the full interview experience",
    badge: "Most Popular",
    features: [
      "Unlimited interviews",
      "Voice-enabled interviews",
      "Detailed AI feedback",
      "Performance analytics",
      "Resume-to-role matching",
      "Downloadable reports",
    ],
    cta: "Upgrade to Pro",
    variant: "default" as const,
    href: "/signup",
  },
  {
    name: "Premium",
    price: "₹299",
    period: "/month",
    description: "Advanced coaching for serious candidates",
    badge: null,
    features: [
      "Everything in Pro",
      "Advanced communication analysis",
      "AI-generated improvement roadmap",
      "Industry-specific mock interviews",
      "Priority support",
    ],
    cta: "Go Premium",
    variant: "outline" as const,
    href: "/signup",
  },
];

const faqs = [
  {
    q: "Can I try NextRound before paying?",
    a: "Yes! The Free plan gives you 3 mock interviews per month with basic feedback — no credit card required.",
  },
  {
    q: "How does billing work?",
    a: "Plans are billed monthly and auto-renew. You can cancel or change your plan anytime from your billing dashboard.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards and UPI through our secure payment gateway.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Absolutely. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is my payment information secure?",
    a: "Yes. All payments are processed through PCI-compliant gateways. We never store your card details on our servers.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold font-display tracking-tight text-foreground">
            Next<span className="text-primary">Round</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl lg:text-5xl font-bold font-display text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your interview preparation needs. Upgrade anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card
                  className={`h-full flex flex-col relative ${
                    plan.badge ? "border-primary shadow-lg ring-1 ring-primary/20" : "border shadow-sm"
                  }`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold font-display text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant={plan.variant} className="w-full" asChild>
                      <Link to={plan.href}>
                        {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t bg-card">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold font-display text-foreground">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
