# 🧠 Meeting Intelligence Service

> A complete full-stack AI-powered meeting intelligence platform built for the Hintro Backend Engineering Assignment. 
> It processes meeting transcripts with OpenRouter Llama 3.3, extracts structured insights with citation grounding, manages action items, and features a beautiful Next.js frontend.

---
---

## 🏗 System Architecture

![Hintro Meeting Intelligence Cloud Architecture](./docs/architecture.png)

*The system uses a modern, serverless edge-ready architecture, strictly separating concerns between the Next.js presentation layer, the Express API gateway, the PostgreSQL persistence layer, and the OpenRouter AI Intelligence engine.*

---

## 🚀 Live Demos

| Resource | URL |
|----------|-----|
| **🖥️ Frontend UI (Vercel)** | [https://meeting-intelligence-ui.vercel.app](https://meeting-intelligence-ui.vercel.app) |
| **⚙️ Backend API (Render)** | [https://meeting-intelligence-service-qga7.onrender.com](https://meeting-intelligence-service-qga7.onrender.com) |
| **📚 Swagger API Docs** | [https://meeting-intelligence-service-qga7.onrender.com/api-docs](https://meeting-intelligence-service-qga7.onrender.com/api-docs) |
| **🩺 Health Check** | [https://meeting-intelligence-service-qga7.onrender.com/health](https://meeting-intelligence-service-qga7.onrender.com/health) |
| **📝 Evaluation Endpoint** | [https://meeting-intelligence-service-qga7.onrender.com/api/evaluation](https://meeting-intelligence-service-qga7.onrender.com/api/evaluation) |

---

## ✨ Key Features

### 💻 Frontend (Next.js 14)
- **Modern App Router** architecture with Server & Client components
- **Premium Glassmorphism UI** utilizing Tailwind CSS
- **Interactive Dashboards** tracking meeting statistics and AI insights
- **Dynamic Meeting Creation** with inline transcript parsing
- **Action Items Kanban/List** with status badges and overdue highlights
- **Citation Pills** allowing users to trace AI-generated summaries directly back to exact timestamps in the raw transcript

### ⚙️ Backend (Node.js & Express)
- **JWT Authentication** — Secure register/login with bcrypt password hashing
- **Meeting CRUD** — Create, list, and retrieve meetings with full transcript storage
- **AI Analysis (OpenRouter Llama 3.3 70B)** — Structured JSON extraction of summaries, decisions, follow-ups, and action items
- **Citation Grounding Engine** — Validates AI outputs against the original transcript to aggressively prevent hallucination
- **Action Item Cron Service** — node-cron job detects overdue items and triggers updates
- **Discord Integrations** — Sends automated rich embed notifications for overdue action items
- **Rate Limiting** — 3-tier limiting: global (100/15min), auth (10/15min), AI (20/hr)
- **Structured Logging** — Winston with trace UUIDs attached to every request



## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 20, TypeScript 5
- **Framework**: Express 4
- **Database**: PostgreSQL 16 + Prisma ORM
- **AI Engine**: OpenRouter (Llama 3.3 70B)
- **Validation**: Zod
- **Scheduling**: node-cron
- **Deployment**: Render

---

## 📁 Repository Structure

```
meeting-intelligence-service/
├── frontend/                 # Next.js Application UI
│   ├── src/app/              # App Router Pages (login, dashboard, meetings, etc)
│   ├── src/components/       # Reusable UI components
│   └── src/lib/              # Axios API client setup
├── src/                      # Express Backend API
│   ├── modules/              # Domain-driven features (auth, meetings, action-items)
│   ├── services/             # Core business logic (AI, Scheduler, Notifications)
│   ├── middleware/           # Rate limiting, Auth, Error handling
│   └── config/               # Database, Env, Swagger definitions
├── prisma/                   # Database schema and migrations
└── ... docs and config files
```

---

## 🏃 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/itzrahuldas/meeting-intelligence-service.git
cd meeting-intelligence-service

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory (Backend):
```env
DATABASE_URL="postgres://user:password@localhost:5432/meeting_db"
JWT_SECRET="super-secret-key"
JWT_EXPIRES_IN="24h"
GEMINI_API_KEY="your-gemini-key"
FRONTEND_URL="http://localhost:3000"
```

Create a `.env.local` file in the `/frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:10000"
```

### 3. Start Database & Backend
```bash
# In the root folder
npx prisma db push
npm run dev
# API running at http://localhost:10000
```

### 4. Start Frontend
```bash
# In the /frontend folder
npm run dev
# UI running at http://localhost:3000
```

---

## 🚢 Deployment Architecture

This project is structured as a completely decoupled system deployed across two major platforms:

1. **Backend API (Render)**
   - Deployed as a Node Web Service
   - Connected to Render managed PostgreSQL database
   - Build Command: `npm install --include=dev && npx prisma generate && npm run build`
   - Start Command: `npx prisma db push && node dist/server.js`

2. **Frontend UI (Vercel)**
   - Deployed from the `/frontend` directory
   - Connects dynamically to the Render Backend API via environment variables
   - Build Command: `npm run build`

---

## 📄 Documentation Reference

For more detailed technical insights on how this application was built, check the internal documentation:
- [DECISIONS.md](./DECISIONS.md) — Architecture and design decisions
- [AI_APPROACH.md](./AI_APPROACH.md) — How Gemini prompts and citation grounding were engineered
- [TESTING.md](./TESTING.md) — Test suite methodology
- [CHANGELOG.md](./CHANGELOG.md) — Implementation milestones

---
*Developed by Rahul Das for Hintro*
