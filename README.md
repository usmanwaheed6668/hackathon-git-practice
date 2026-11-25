# TalentIQ — Precision AI-Powered Recruitment & Talent Intelligence Platform

TalentIQ is an enterprise-grade recruitment intelligence platform built with **ASP.NET Core 8** and **React 18** adhering strictly to the **Human Authority Principle**: AI models synthesize, evaluate, and advise, while human recruiters retain sovereign decision-making power.

---

## Architecture & Technology Stack

- **Backend:** ASP.NET Core 8 Web API, Entity Framework Core 8, SQL Server (LocalDB / Express / Docker), JWT Bearer Authentication, Swagger/OpenAPI, FluentValidation.
- **Frontend:** React 18, Vite, Tailwind CSS (Kinetic Obsidian dark theme), React Router v6, Axios, Lucide React, Recharts.
- **AI Engine (Backend-Hosted Only):**
  - Google Gemini 2.0 Flash (`gemini-2.0-flash`) & `text-embedding-004`.
  - Claim verification engine for zero-hallucination resume parsing (PdfPig text extraction).
  - Deterministic transparent multi-component scoring engine (Skills 50%, Experience 25%, Education 15%, Semantic Vector 10%).
  - Procedural / keyword deterministic fallback when API keys are omitted.
- **Security & Multi-Tenancy:**
  - Resource ownership authorization guards (`EnsureOwnsJob`, `EnsureRole`).
  - Strict privacy partitioning: Candidates never see match scores, assessments, recruiter notes, interview ratings, or other applicants' submissions.
  - PBKDF2 with HMAC-SHA512 password hashing.
  - Rate limiting (15 auth attempts/min) with account lockout (5 failed attempts -> 60s cooldown, HTTP 423).
  - Parameterized queries via EF Core, strict upload validation (magic bytes, size caps, GUID storage outside web root).

---

## Core Capabilities (Part 1, 2, & 3)

### 1. Application State Machine & Transactional Audit Trail
- Linear forward progression: `Submitted -> Parsed -> AIAssessmentAvailable -> RecruiterReview -> Shortlisted -> Interview -> Selected`
- Sovereign rejection allowed from any non-terminal stage with mandatory justification reason.
- Atomic commit of application status change and audit trail entry.
- Private recruiter notes with author identity and timestamps.

### 2. AI Interview Question Generator (`IQuestionGenerator`)
- Produces 10-12 tailored questions spanning 3 difficulties (Beginner, Intermediate, Advanced).
- Covers Technical, Project Deep-Dives (at least 3 citing candidate's actual projects), Gap-Probing (neutral framing for missing resume evidence), and Behavioral categories.
- Includes detailed objective answer evaluation guidelines.
- Full recruiter control: edit, delete, regenerate single, regenerate all, or add custom questions.

### 3. Conflict-Free Interview Scheduling & Structured Evaluations
- **Conflict Detection:** Overlapping interviews for the same candidate are strictly blocked (409 Conflict). Overlapping interviews for the same interviewer return 409 Conflict with clash details, overrideable via `confirmOverride: true`.
- Structured 1-5 evaluations (Technical, Communication, Problem Solving, Culture Fit) and recommendations (`StrongYes`, `Yes`, `No`, `StrongNo`).
- Sovereign Final Decision endpoint (`POST /api/applications/{id}/final-decision`) requiring prior interview feedback.

### 4. Recruiter Analytics Dashboard (Recharts)
- Live pipeline funnel bar chart across workflow stages.
- Score distribution histogram across candidate percentiles.
- Shortlist ratio donut gauge.
- Ranked common candidate skill gaps.
- Application processing velocity metrics.
- Global and per-job filtering.

### 5. Semantic Talent Search & Candidate Comparison
- Vector semantic search (`POST /api/talent/search`) across candidate profiles with resume snippet highlights.
- Side-by-side comparison matrix (`GET /api/applications/compare?ids=`) comparing up to 3 candidates on scores, experience, verified skills, and projects.
- Algorithmic fairness check (`POST /api/applications/{id}/fairness-check`) verifying scoring invariance with anonymized credentials.

### 6. Simulated Notifications
- Entity `Notification` (`UserId`, `Title`, `Message`, `IsRead`, `CreatedAt`).
- Real-time notification bell dropdown in navigation bar with unread count badge and mark-as-read controls.
- Automatically generated on shortlisting, interview scheduling, and hiring decisions.

---

## Quickstart & Docker Compose

To launch the complete platform (SQL Server, ASP.NET Core API, and Nginx React Frontend):

```bash
docker-compose up --build
```

- **Frontend Application:** `http://localhost:5173`
- **Backend API & Swagger:** `http://localhost:5080/swagger`
- **Health Check:** `http://localhost:5080/health`

### Local Development Setup

#### Backend:
```bash
cd backend/src/TalentIQ.Api
# Optional: Set Gemini API key (defaults gracefully to deterministic offline mode)
dotnet user-secrets set "Gemini:ApiKey" "<YOUR_GEMINI_API_KEY>"
dotnet run
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Automated Tests (32 Passing xUnit Tests)

The test suite covers state machine transitions, interview conflict detection, notes privacy, score overrides, authentication lockouts, password rules, and AI scoring:

```bash
cd backend
dotnet test tests/TalentIQ.Tests/TalentIQ.Tests.csproj
```

**Result:**
```text
Passed!  - Failed: 0, Passed: 32, Skipped: 0, Total: 32, Duration: 1 s
```

---

## Pre-Seeded Demo Accounts

| Persona | Email | Password | Role Description |
|---|---|---|---|
| **Recruiter** | `recruiter@demo.com` | `Recruiter123` | Talent Lead with 3 requisitions (Backend Developer, Full Stack, DevOps) |
| **Candidate** | `ayesha@demo.com` | `Candidate123` | Senior Python/Django/PostgreSQL/Docker candidate (Strong Match) |
| **Candidate** | `bilal@demo.com` | `Candidate123` | Full Stack Python/Flask/MySQL candidate (Partial Match) |
| **Candidate** | `sara@demo.com` | `Candidate123` | Frontend React/Figma candidate (Junior Match) |

### Instant Live Demo Setup
To instantly submit Ayesha, Bilal, and Sara to the Backend Developer job with AI assessments, questions, and scheduled interviews:
```http
POST http://localhost:5080/api/dev/run-demo
```
Or reset database to fresh baseline:
```http
POST http://localhost:5080/api/dev/reset
```
