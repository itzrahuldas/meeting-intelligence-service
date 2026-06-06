# 🏛️ Architecture Decision Records

This document captures the key technical decisions made during the design and development of the Meeting Intelligence Service, along with the reasoning, alternatives considered, and trade-offs accepted.

---

## 1. Runtime & Language — Node.js + TypeScript

**Decision:** Use Node.js as the runtime and TypeScript as the development language.

**Why:**
- TypeScript provides compile-time type safety that catches entire categories of bugs before they reach production — wrong property names, missing function arguments, incorrect return types.
- The Express.js ecosystem is mature, battle-tested, and has excellent community support.
- Node.js excels at I/O-bound workloads (HTTP requests, database queries, external API calls), which is exactly the profile of this service.
- Fast iteration speed — changes are reflected in seconds with `ts-node-dev`.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Go** | Excellent performance, built-in concurrency, single binary deployment | Steeper learning curve, less expressive for rapid prototyping, smaller ORM ecosystem |
| **Python / FastAPI** | Great AI/ML ecosystem, clean syntax, async support | Slower runtime, less mature type checking (mypy vs tsc), GIL limitations |
| **Rust / Actix** | Maximum performance, memory safety | Very steep learning curve, slow compilation, overkill for a CRUD+AI service |

**Trade-offs Accepted:**
- TypeScript adds a compilation step (`tsc`), increasing build time by ~5-10 seconds.
- Type definitions for some npm packages can lag behind the JavaScript version.
- Node.js is single-threaded; CPU-intensive work (if any) would need worker threads.

---

## 2. Database — PostgreSQL + Prisma

**Decision:** Use PostgreSQL as the primary database with Prisma as the ORM.

**Why:**
- The data model is inherently relational: Users → Meetings → Action Items, with Analysis as a 1:1 relation on Meeting. PostgreSQL's foreign keys and joins are a natural fit.
- ACID compliance ensures data integrity — critical when meetings and their analyses must stay consistent.
- Prisma generates a fully type-safe client from the schema, so every query is checked at compile time. No more runtime "column not found" errors.
- Prisma Migrate provides version-controlled, reproducible migrations.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **MongoDB** | Flexible schema, easy to start | Poor fit for relational data, no FK enforcement, weaker transaction support |
| **SQLite** | Zero-config, file-based, great for prototyping | No concurrent writes, no built-in JSON support, doesn't scale to production |
| **MySQL** | Widely supported, good performance | Fewer advanced features than PostgreSQL (JSON, array types, CTEs) |

**Trade-offs Accepted:**
- Requires running a PostgreSQL server (mitigated by Docker Compose and managed cloud databases like Render).
- Prisma adds a binary engine layer; for extremely complex queries, raw SQL may be needed.
- Cold-start of Prisma Client can add ~100ms on the first query.

---

## 3. Authentication — JWT with Bearer Tokens

**Decision:** Implement stateless authentication using JSON Web Tokens with bcryptjs for password hashing.

**Why:**
- **Stateless** — No server-side session storage needed. Each request carries its own authentication proof, making horizontal scaling trivial.
- **Simple** — The token is passed in the `Authorization: Bearer <token>` header, which is universally supported by HTTP clients, Postman, Swagger UI, and frontend frameworks.
- **Self-contained** — The token payload includes the user ID, so we can identify the user without a database lookup on every request.
- **bcryptjs** — Adaptive hashing algorithm with configurable salt rounds, industry-standard for password storage.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Session-based auth** | Easy to revoke, familiar | Requires server-side storage (Redis/DB), breaks statelessness |
| **OAuth2 / OpenID Connect** | Federated login, enterprise-ready | Massive complexity overkill for a single-service API |
| **API Keys** | Simple to implement | No user identity, harder to rotate, less secure |
| **Passport.js** | Flexible strategy pattern | Heavy abstraction for simple JWT, adds dependency |

**Trade-offs Accepted:**
- JWTs cannot be revoked once issued (without implementing a blacklist in Redis or DB).
- Token expiration is the primary security mechanism — set to 24h as a balance between UX and security.
- Password reset flow is not implemented in v1.0.

---

## 4. AI Provider — Google Gemini

**Decision:** Use Google Gemini (via `@google/generative-ai` SDK) for meeting transcript analysis.

**Why:**
- **Generous free tier** — 15 requests per minute, 1 million tokens per minute on the free tier. More than sufficient for development and moderate production use.
- **Structured output** — Gemini supports JSON mode and can be instructed to return specific schemas, which is critical for our citation-grounding pipeline.
- **Good grounding capabilities** — The model follows complex system prompts well, enabling our multi-layer hallucination prevention strategy.
- **Simple SDK** — The `@google/generative-ai` package is lightweight and well-documented.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **OpenAI GPT-4** | Best-in-class quality, function calling | Paid from day one, rate limits on free trial |
| **Anthropic Claude** | Excellent at following instructions, large context | Paid only, no free tier |
| **Groq (Llama)** | Extremely fast inference | Limited model quality, smaller context window |
| **Local LLM (Ollama)** | Privacy, no API costs | Requires GPU, inconsistent quality, deployment complexity |

**Trade-offs Accepted:**
- Free tier has rate limits (15 RPM) — not suitable for high-traffic production without upgrading.
- Model quality may vary between Gemini versions; we pin to a specific model version.
- Vendor lock-in to Google's API; mitigated by abstracting the AI service behind an interface.

---

## 5. External Integration — Discord Webhook

**Decision:** Use Discord webhooks for delivering overdue action item reminders.

**Why:**
- **Zero OAuth complexity** — A webhook is just a URL. No app registration, no token refresh, no user authorization flow.
- **Rich embeds** — Discord supports rich embed messages with colors, fields, thumbnails, and timestamps, making notifications visually informative.
- **Easy to test** — Create a private Discord server, add a webhook in 30 seconds, and immediately see notifications.
- **Reliable** — Discord's webhook API is stable, well-documented, and has generous rate limits.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Slack** | Ubiquitous in workplaces | Requires creating a Slack App, OAuth flow, more setup |
| **Email (SendGrid/SES)** | Universal reach | Requires domain verification, can land in spam, async delivery |
| **Twilio SMS** | Direct to phone | Paid per message, requires phone number verification |
| **Push Notifications** | Native mobile experience | Requires mobile app, FCM/APNs setup |

**Trade-offs Accepted:**
- Requires the user/team to have a Discord server — not universally used in enterprise.
- Webhook URLs are secrets; if leaked, anyone can post to the channel.
- No delivery confirmation or read receipts.

---

## 6. Validation — Zod

**Decision:** Use Zod for runtime request validation and type inference.

**Why:**
- **TypeScript-native** — Zod schemas infer TypeScript types automatically (`z.infer<typeof schema>`), eliminating the need to maintain separate type definitions and validation rules.
- **Composable** — Schemas can be composed, extended, and refined. `registerSchema.pick({email: true})` gives you just the email validation.
- **Excellent error messages** — Zod provides structured error objects with paths and messages, which map cleanly to our API error response format.
- **Small API surface** — Easy to learn, hard to misuse.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Joi** | Mature, widely used in Express | No TypeScript type inference, different paradigm |
| **class-validator** | Decorator-based, familiar to NestJS users | Requires classes, doesn't compose as naturally |
| **Yup** | Similar API to Zod | Less TypeScript integration, older project |
| **express-validator** | Built for Express | Middleware-based, less composable, no type inference |

**Trade-offs Accepted:**
- Adds ~50KB to the bundle (acceptable for a server-side application).
- Team members unfamiliar with Zod need a short learning period.

---

## 7. ORM — Prisma

**Decision:** Use Prisma as the database ORM and migration tool.

**Why:**
- **Type-safe queries** — Every `prisma.meeting.findUnique()` call is fully typed. The compiler knows the return shape, including relations.
- **Auto-generated client** — `npx prisma generate` produces a client tailored to your schema. No manual model definitions.
- **Declarative schema** — `schema.prisma` is the single source of truth for the database structure. Readable by developers, DBAs, and AI tools alike.
- **Excellent migration system** — `prisma migrate dev` generates SQL migrations automatically with human-readable names.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **TypeORM** | Decorator-based, Active Record pattern | Complex configuration, TypeScript types can be unreliable |
| **Sequelize** | Mature, large community | Verbose, weak TypeScript support, callback-heavy legacy API |
| **Drizzle** | Lightweight, SQL-like syntax | Newer, smaller ecosystem, less documentation |
| **Raw SQL (pg)** | Maximum control, best performance | No type safety, manual migration management, more boilerplate |

**Trade-offs Accepted:**
- Prisma's query engine adds a binary dependency (~15MB).
- Complex queries (e.g., recursive CTEs, window functions) may require `$queryRaw`.
- Slightly slower than raw SQL for very high-throughput scenarios.

---

## 8. Project Structure — Module-Based

**Decision:** Organize code by feature module rather than by technical layer.

**Why:**
- **Cohesion** — Everything related to "meetings" lives in `src/modules/meetings/`: routes, controller, service, schemas. A developer working on meetings doesn't need to jump between 5 different folders.
- **Scalability** — Adding a new feature means adding a new folder under `modules/`, not modifying 5 existing folders.
- **Discoverability** — New team members can understand the codebase structure in minutes.

**Structure:**
```
src/modules/
├── auth/           # Register, login, profile
├── meetings/       # Meeting CRUD + analysis
├── action-items/   # Action item management
└── ai/             # AI analysis service
```

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Layer-based** (`controllers/`, `services/`, `routes/`) | Traditional, familiar | Files for one feature scattered across folders |
| **Domain-Driven Design** | Powerful for complex domains | Over-engineered for this scale |

**Trade-offs Accepted:**
- Shared utilities (`errors.ts`, `response.ts`) still live outside modules.
- Cross-module dependencies (e.g., AI service used by meetings module) create coupling points.

---

## 9. Logging — Winston with Structured JSON

**Decision:** Use Winston for application logging with JSON format and trace ID support.

**Why:**
- **Production-standard** — Winston is the most popular Node.js logging library with active maintenance.
- **Structured JSON** — JSON logs are parseable by log aggregation tools (Datadog, ELK, CloudWatch).
- **Trace IDs** — Every log line includes the request's trace ID, enabling end-to-end request tracing through log aggregation.
- **Multiple transports** — Console for development, file for production, easily extensible to external services.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Pino** | Faster (5-10x), lower overhead | Less flexible formatting, smaller plugin ecosystem |
| **Bunyan** | JSON-native, good CLI tools | Less actively maintained |
| **console.log** | Zero setup | No levels, no formatting, no transports, unprofessional |

**Trade-offs Accepted:**
- Winston is ~3-5x slower than Pino for high-throughput logging (not a bottleneck for this service).
- Requires initial configuration (transports, formats, levels).

---

## 10. Scheduler — node-cron

**Decision:** Use node-cron for scheduling periodic overdue action item checks and reminder dispatch.

**Why:**
- **In-process** — No external dependencies (no Redis, no separate cron daemon). The scheduler runs inside the Node.js process.
- **Familiar syntax** — Uses standard cron expressions (`*/15 * * * *` = every 15 minutes).
- **Lightweight** — Tiny package with zero dependencies.
- **Sufficient for this scale** — For a single-instance application, in-process scheduling is perfectly reliable.

**Alternatives Considered:**
| Alternative | Pros | Cons |
|------------|------|------|
| **Bull / BullMQ** | Redis-backed, persistent, retries, concurrency | Requires Redis, significant added complexity |
| **Agenda** | MongoDB-backed, persistent | Requires MongoDB, heavy for simple schedules |
| **OS cron (crontab)** | Battle-tested, OS-level | Not portable, can't access app state, deployment complexity |
| **Temporal** | Enterprise-grade workflow orchestration | Massive overkill, requires infrastructure |

**Trade-offs Accepted:**
- Scheduled jobs don't survive process restarts — if the server crashes, the next check happens when it restarts.
- No persistence — missed checks are simply skipped (acceptable for reminders).
- Single-instance only — in a multi-instance deployment, each instance would run its own scheduler (would need distributed locking for production).
