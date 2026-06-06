# Meeting Intelligence Service

> AI-powered meeting intelligence platform built for the Hintro Backend Engineering Assignment.
> Processes meeting transcripts with Google Gemini, extracts structured insights with citation grounding, manages action items, and delivers overdue reminders via Discord.

[![CI](https://github.com/YOUR_USERNAME/meeting-intelligence-service/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/meeting-intelligence-service/actions)

---

## 🚀 Live Links

| Resource | URL |
|----------|-----|
| **API Base URL** | `https://YOUR_DEPLOYMENT_URL` |
| **Swagger Docs** | `https://YOUR_DEPLOYMENT_URL/api-docs` |
| **Health Check** | `https://YOUR_DEPLOYMENT_URL/health` |
| **Evaluation Endpoint** | `https://YOUR_DEPLOYMENT_URL/api/evaluation` |

---

## ✨ Features

- **JWT Authentication** — Secure register/login with bcrypt password hashing
- **Meeting CRUD** — Create, list, and retrieve meetings with full transcript storage
- **AI Analysis (Gemini)** — Structured extraction of summaries, decisions, follow-ups, and action items
- **Citation Grounding** — Every AI insight is anchored to a specific transcript timestamp; invalid citations are post-validated and removed
- **Hallucination Prevention** — Post-validation pass filters any AI-generated citation whose timestamp doesn't exist in the original transcript
- **Action Item Management** — Full lifecycle tracking (PENDING → IN_PROGRESS → COMPLETED)
- **Overdue Detection** — Real-time detection of past-due, incomplete action items
- **Scheduled Reminders** — node-cron job runs every 15 minutes; sends Discord embeds with 24-hour deduplication
- **Discord Integration** — Rich embed notifications with task, assignee, due date, and meeting context
- **Rate Limiting** — 3-tier limiting: global (100/15min), auth (10/15min), AI (20/hr)
- **Request Tracing** — UUID trace IDs on every request, included in all logs and responses
- **Structured Logging** — Winston with JSON output, request logger, and contextual metadata
- **OpenAPI Docs** — Swagger UI at `/api-docs`
- **Docker Support** — Multi-stage Dockerfile + docker-compose for full stack

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript 5 |
| Framework | Express 4 |
| Database | PostgreSQL 16 + Prisma ORM |
| AI | Google Gemini 2.0 Flash |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| Scheduling | node-cron |
| Notifications | Discord Webhook |
| Rate Limiting | express-rate-limit |
| Logging | Winston |
| Testing | Jest + ts-jest |
| Docs | Swagger UI (swagger-jsdoc) |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
src/
├── app.ts                    # Express app setup (middleware, routes)
├── server.ts                 # Entry point (HTTP server + scheduler)
├── config/
│   ├── database.ts           # Prisma client singleton
│   ├── env.ts                # Typed env configuration
│   └── swagger.ts            # OpenAPI 3.0 spec
├── middleware/
│   ├── auth.middleware.ts    # JWT authentication
│   ├── errorHandler.middleware.ts  # Global error handler
│   ├── rateLimiter.middleware.ts   # Rate limiting (3 tiers)
│   ├── requestLogger.middleware.ts # HTTP request logging
│   ├── traceId.middleware.ts # Request trace ID
│   └── validate.middleware.ts  # Zod validation
├── modules/
│   ├── auth/                 # Register + Login
│   ├── meetings/             # Meeting CRUD + AI analysis
│   └── action-items/         # Action item lifecycle
├── services/
│   ├── ai.service.ts         # Gemini integration + citation grounding
│   ├── notification.service.ts # Discord webhook
│   └── scheduler.service.ts  # Cron overdue reminders
└── utils/
    ├── errors.ts             # Custom error hierarchy
    ├── logger.ts             # Winston logger
    └── response.ts           # Unified API response helpers
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | ✅ | Token expiry (e.g. `24h`, `7d`) |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `DISCORD_WEBHOOK_URL` | ⬜ | Discord channel webhook URL for reminders |
| `PORT` | ⬜ | HTTP server port (default: `3000`) |
| `NODE_ENV` | ⬜ | `development` \| `production` \| `test` |
| `CANDIDATE_NAME` | ⬜ | Your name (shown in `/api/evaluation`) |
| `CANDIDATE_EMAIL` | ⬜ | Your email |
| `REPOSITORY_URL` | ⬜ | GitHub repo URL |
| `DEPLOYED_URL` | ⬜ | Live deployment URL |

---

## 🏃 Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/meeting-intelligence-service.git
cd meeting-intelligence-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations (creates tables)
npx prisma migrate dev --name init
```

### 4. Start Development Server

```bash
npm run dev
# Server starts at http://localhost:3000
# Swagger UI at http://localhost:3000/api-docs
```

---

## 🐳 Docker Setup

```bash
# Start the full stack (app + PostgreSQL)
docker-compose up -d

# The app handles migrations automatically on startup
# API available at http://localhost:3000
```

---

## 🧪 Running Tests

```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode during development
npm run test:watch
```

**Test Results:** 80 tests across 7 suites — all passing ✅

| Suite | Tests |
|-------|-------|
| `auth.test.ts` | Auth service (register, login, hashing, JWT) |
| `meetings.test.ts` | Meeting CRUD + pagination |
| `actionItems.test.ts` | Action items lifecycle + overdue |
| `ai.test.ts` | Gemini integration + citation validation |
| `validation.test.ts` | Zod schema validation |
| `errors.test.ts` | Custom error hierarchy |
| `response.test.ts` | Unified response helper |

---

## 📡 API Reference

### Authentication

All protected endpoints require an `Authorization: Bearer <token>` header.

#### POST `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```
**Response:**
```json
{
  "traceId": "uuid",
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" }
  }
}
```

#### POST `/api/auth/login`
```json
{ "email": "john@example.com", "password": "securePass123" }
```

---

### Meetings

#### POST `/api/meetings` 🔒
Create a meeting with a transcript. Returns the meeting immediately; call `/analyze` to run AI.

```json
{
  "title": "Q3 Planning Meeting",
  "participants": ["Alice", "Bob", "Charlie"],
  "meetingDate": "2025-06-01T10:00:00.000Z",
  "transcript": [
    { "timestamp": "00:01", "speaker": "Alice", "text": "We need to finalise the budget by Friday." },
    { "timestamp": "00:03", "speaker": "Bob", "text": "I can take ownership of the budget report." },
    { "timestamp": "00:05", "speaker": "Charlie", "text": "Let's schedule a review on Thursday." }
  ]
}
```

#### GET `/api/meetings` 🔒
List meetings with pagination. Query params: `page`, `limit`, `search`.

#### GET `/api/meetings/:id` 🔒
Get a single meeting with analysis and action items.

#### POST `/api/meetings/:id/analyze` 🔒
Trigger AI analysis. Returns summary, action items, decisions, follow-ups — each with transcript citations.

```json
{
  "success": true,
  "data": {
    "summary": [
      {
        "text": "The team discussed finalising the Q3 budget deadline",
        "citations": [{ "timestamp": "00:01", "speaker": "Alice", "text": "We need to finalise the budget by Friday." }]
      }
    ],
    "actionItems": [
      {
        "task": "Take ownership of the budget report",
        "assignee": "Bob",
        "dueDate": null,
        "citations": [{ "timestamp": "00:03", "speaker": "Bob", "text": "I can take ownership of the budget report." }]
      }
    ],
    "decisions": [],
    "followUps": [
      {
        "text": "Schedule a review on Thursday",
        "citations": [{ "timestamp": "00:05", "speaker": "Charlie", "text": "Let's schedule a review on Thursday." }]
      }
    ]
  }
}
```

---

### Action Items

#### POST `/api/action-items` 🔒
Create a manual action item linked to a meeting.

#### GET `/api/action-items` 🔒
List with filters: `status` (PENDING/IN_PROGRESS/COMPLETED), `assignee`, `meetingId`, `page`, `limit`.

#### GET `/api/action-items/overdue` 🔒
Returns all items where `dueDate < now` and `status != COMPLETED`.

#### GET `/api/action-items/:id` 🔒
Get a single action item with reminder history.

#### PATCH `/api/action-items/:id/status` 🔒
Update status.
```json
{ "status": "IN_PROGRESS" }
```

---

### System

#### GET `/health`
Returns `{ "status": "UP" }`. No auth required.

#### GET `/api/evaluation`
Returns candidate metadata and feature list.

---

## 🚢 Deployment

### Render (Recommended)

1. Create a new **Web Service** pointing to your GitHub repo
2. Set **Build Command:** `npm install && npx prisma generate && npm run build`
3. Set **Start Command:** `npx prisma migrate deploy && node dist/server.js`
4. Add all environment variables from `.env.example`
5. Add a **PostgreSQL** database from Render's dashboard and copy the connection string to `DATABASE_URL`

### Railway

1. Connect your GitHub repo
2. Add a PostgreSQL plugin
3. Set environment variables
4. Railway auto-detects Node.js and deploys

### Fly.io

```bash
fly launch
fly secrets set GEMINI_API_KEY=... JWT_SECRET=... DATABASE_URL=...
fly deploy
```

---

## 🏛 Architecture Decisions

See [DECISIONS.md](./DECISIONS.md) for full ADRs covering:
- Database choice (PostgreSQL + Prisma)
- Authentication strategy (JWT stateless)
- AI model selection (Gemini 2.0 Flash)
- Citation grounding approach
- External integration (Discord Webhook)
- Module structure

## 🤖 AI Approach

See [AI_APPROACH.md](./AI_APPROACH.md) for:
- Prompt design and structured extraction strategy
- Citation grounding and post-validation algorithm
- Hallucination prevention approach
- Known limitations

## 🧪 Testing

See [TESTING.md](./TESTING.md) for:
- Test scenarios and edge cases
- Coverage analysis
- Limitations discovered

## 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for implementation milestones.
