# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-05

### Added

#### Core Application
- Node.js + TypeScript + Express backend with modular architecture
- PostgreSQL database with Prisma ORM and type-safe queries
- Declarative Prisma schema with User, Meeting, Analysis, and ActionItem models
- Database migrations via `prisma migrate`

#### Authentication
- JWT-based authentication with Bearer token scheme
- User registration with bcryptjs password hashing (10 salt rounds)
- User login with credential verification
- Protected route middleware (`/api/auth/profile`)
- Token payload includes `userId` and `email`

#### Meeting Management
- Create meetings with title, date, participants, and transcript
- List meetings with pagination (`page`, `limit` query params)
- Search meetings by title keyword
- Get individual meeting by ID (includes analysis and action items)
- Meetings scoped to authenticated user (multi-tenant isolation)

#### AI-Powered Analysis
- Google Gemini integration for meeting transcript analysis
- Structured output extraction: summary, key topics, action items, decisions, sentiment
- Citation grounding — every insight references specific transcript timestamps and speakers
- Hallucination prevention with 5-layer approach:
  1. System prompt constraints (explicit "DO NOT invent" rules)
  2. Structured JSON output (forces specific schema)
  3. Temperature=0 (deterministic, non-creative output)
  4. Post-processing validation (verify citations exist in transcript)
  5. Graceful degradation (remove ungrounded insights rather than fail)
- JSON response cleanup (strips markdown code fences)
- Analysis stored alongside meeting for retrieval

#### Action Item Management
- Create action items linked to meetings
- Fields: title, description, assignee, due date, priority, status
- Update action item status (PENDING → IN_PROGRESS → COMPLETED)
- Filter action items by status
- Paginated action item listing
- Overdue action item detection (past due date + not completed)

#### Scheduled Jobs
- node-cron job running every 15 minutes (`*/15 * * * *`)
- Scans all users for overdue action items
- Triggers Discord webhook notifications for overdue items
- Structured logging for job execution and results

#### Discord Integration
- Discord webhook integration for reminder notifications
- Rich embed messages with:
  - Overdue item count
  - Item titles and assignees
  - Due dates with relative time
  - Color-coded severity (red for overdue)
- Error handling for webhook delivery failures

#### Infrastructure & Developer Experience
- Structured JSON logging with Winston
  - Log levels: error, warn, info, http, debug
  - Console transport with colorized output (dev)
  - Trace ID included in every log line
- Request trace ID generation and propagation (`X-Trace-Id` header)
- Global error handling middleware with unified response format
- Input validation with Zod schemas
- Unified API response format: `{ success, message, data, traceId, pagination? }`
- Unified error response format: `{ success: false, error: { message, code, details? }, traceId }`
- Health check endpoint (`GET /health`)
- OpenAPI/Swagger documentation at `/api-docs`

#### Testing
- Jest + ts-jest test framework
- Global test setup with environment variables and mocks
- Unit tests for:
  - Response utility functions (9 cases)
  - Custom error classes (12 cases)
  - Zod validation schemas (18 cases)
  - Auth service (9 cases)
  - Meeting service (10 cases)
  - Action items service (12 cases)
  - AI analysis service (7 cases)
- Total: 77+ test cases

#### Documentation
- Comprehensive README with badges, architecture diagram, API docs, and curl examples
- Architecture Decision Records (DECISIONS.md) — 10 documented decisions
- AI Approach documentation (AI_APPROACH.md) — prompt design, citation strategy, hallucination prevention
- Testing documentation (TESTING.md) — strategy, scenarios, mocking approach
- Submission checklist (CHECKLIST.md)
- This changelog (CHANGELOG.md)

#### DevOps
- Multi-stage Dockerfile (builder + production)
- docker-compose.yml with app + PostgreSQL services
- PostgreSQL health check with `pg_isready`
- Volume persistence for database data
- Render deployment instructions in README
