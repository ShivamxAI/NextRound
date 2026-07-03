# 🚀 NextRound: AI-Powered Technical Interviewer

NextRound is an intelligent, full-stack platform designed to simulate realistic technical & behavioral interviews and provide actionable, senior-level feedback. Built as a showcase of Generative AI integration, the platform leverages Google's **Gemini 2.5 Flash** to dynamically evaluate candidates, generate tailored improvement roadmaps, and assess technical accuracy.

## Checkout my app at :  [https://nextround-4c74d.web.app/](https://nextroundweb.xyz/)

## ✨ Key Features

### 🧠 Intelligent Interview Generation
* **Dynamic Context:** Generates custom interview questions based on the candidate's target Job Description, industry, and extracted skills.
* **Predefined Sets:** Admins can bypass AI generation for standard roles using custom JSON question arrays.
* **Voice-to-Text Integration:** Candidates can answer questions naturally using their microphone (powered natively by the browser's Web Speech API for zero-latency, private transcription).

### 📊 Multi-Tiered AI Evaluation
NextRound provides graded feedback based on the user's subscription tier:
* **Free Tier:** Basic overall score and general strengths/improvements.
* **Pro Tier:** Detailed metrics (Technical Accuracy, Communication, Confidence, Fluency).
* **Premium Tier:** * **Question-by-Question Analysis:** Side-by-side comparison of the user's answer vs. an AI-generated "Ideal Answer".
  * **Expert Critique:** Deep technical corrections using structured Markdown.
  * **Personalized Roadmap:** A step-by-step action plan to address specific weaknesses.

### 🛡️ Admin Dashboard & Control Center
* **Live Analytics:** Real-time metrics on user growth, revenue, and average candidate scores aggregated directly from Firestore.
* **Content Control:** JSON Editor for injecting standardized question sets.
* **AI Logs:** Full transparency into Gemini AI prompts, latencies, and generated payloads.
* **User Management:** Monitor subscription statuses, interview counts, and manage user access.

### 💳 Automated Billing & Subscriptions
* Fully automated SaaS billing engine powered by **Razorpay**.
* Secure backend webhooks (`/webhook`) to handle real-time plan upgrades, renewals, and cancellations automatically.
* Custom SMTP Email Engine for sending receipts and expiring subscription reminders.

---

## 🏗️ Architectural Highlights
* **Refactored Backend Routing:** Extracted admin-specific routes into a dedicated, secure `admin.py` to adhere strictly to the Single Responsibility Principle.
* **Advanced UI/UX:** Engineered responsive, perfectly contained, scrollable Tailwind modals for handling large AI text payloads, complete with `print:` CSS modifiers for flawless PDF report exports.
* **Markdown Integration:** Integrated `react-markdown` on the frontend to elegantly parse and style the AI's complex structured output (lists, bolding, italics).
* **Premium Data Tiering:** Engineered the Gemini AI prompt to dynamically adjust its output complexity and JSON schema based on the user's active subscription tier.

---

## 🛠️ Tech Stack Architecture

**Frontend (Client)**
* **Framework:** React.js (Vite) + TypeScript
* **Styling:** Tailwind CSS & shadcn/ui components
* **Markdown Rendering:** `react-markdown`
* **Authentication:** Firebase Auth
* **Hosting:** Firebase Hosting

**Backend (API)**
* **Framework:** Python / FastAPI
* **Database:** Google Cloud Firestore (Firebase Admin SDK)
* **AI Engine:** Google GenAI SDK (Gemini 2.5 Flash)
* **Payments:** Razorpay Python SDK
* **Deployment:** Google Cloud Run (Serverless Docker)

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Google Cloud CLI (`gcloud`)
* Firebase CLI (`firebase-tools`)

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/nextround.git]
cd nextround
