# 🧪 Testing Documentation

This document describes the testing strategy, framework, structure, and coverage for the Meeting Intelligence Service.

---

## Table of Contents

1. [Test Framework](#test-framework)
2. [Test Configuration](#test-configuration)
3. [Testing Approach](#testing-approach)
4. [Test Structure](#test-structure)
5. [Test Scenarios by Module](#test-scenarios-by-module)
6. [Edge Cases](#edge-cases)
7. [Running Tests](#running-tests)
8. [Coverage Reports](#coverage-reports)
9. [Mocking Strategy](#mocking-strategy)
10. [Limitations & Future Work](#limitations--future-work)

---

## Test Framework

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Test Runner** | Jest | Test execution, assertions, mocking |
| **TypeScript Support** | ts-jest | Compile TypeScript tests on-the-fly |
| **Assertions** | Jest built-in (`expect`) | Fluent assertion API |
| **Mocking** | Jest built-in (`jest.mock`, `jest.fn`) | Dependency isolation |

### Why Jest?

- Industry-standard for Node.js/TypeScript projects
- Built-in mocking, assertions, and coverage — no extra dependencies
- Excellent TypeScript support via `ts-jest`
- Parallel test execution for speed
- Snapshot testing available if needed

---

## Test Configuration

The Jest configuration is defined in `jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterSetup: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  verbose: true,
};
```

### Setup File (`tests/setup.ts`)

The setup file runs before every test suite and:

1. **Sets environment variables** — `JWT_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`, etc.
2. **Mocks the Prisma client** — All database operations use an in-memory mock.
3. **Mocks the logger** — Winston is silenced to keep test output clean.
4. **Stubs `global.fetch`** — Prevents actual HTTP calls to Discord/external APIs.
5. **Clears mocks after each test** — Ensures test isolation.

---

## Testing Approach

### Unit Testing with Mocked Dependencies

All tests are **unit tests** that test individual functions in isolation. Dependencies are mocked:

```
┌─────────────────────────────────────────┐
│          Function Under Test             │
│         (e.g., auth.service.ts)          │
├─────────────────────────────────────────┤
│  Dependencies (MOCKED):                 │
│  • Prisma Client  → jest.fn()           │
│  • bcryptjs        → jest.fn()           │
│  • jsonwebtoken    → jest.fn()           │
│  • Logger          → jest.fn()           │
└─────────────────────────────────────────┘
```

### Principles

1. **Isolation** — Each test case is independent; order doesn't matter.
2. **Determinism** — No network calls, no database, no file I/O. Tests always produce the same result.
3. **Readability** — Test names describe the scenario in plain English.
4. **Coverage** — Happy path, error paths, and edge cases for each function.

---

## Test Structure

```
tests/
├── setup.ts                    # Global test bootstrap
└── unit/
    ├── response.test.ts        # Response utility tests (9 cases)
    ├── errors.test.ts          # Custom error class tests (12 cases)
    ├── validation.test.ts      # Zod schema validation tests (18 cases)
    ├── auth.test.ts            # Auth service tests (9 cases)
    ├── meetings.test.ts        # Meeting service tests (10 cases)
    ├── actionItems.test.ts     # Action items service tests (12 cases)
    └── ai.test.ts              # AI analysis service tests (7 cases)
```

**Total: 77+ test cases across 7 test files**

---

## Test Scenarios by Module

### 1. Response Utility (`response.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | `sendSuccess` with default status | Returns 200 with `{ success: true, data, traceId }` |
| 2 | `sendSuccess` with 201 status | Returns 201 for creation |
| 3 | `sendSuccess` includes traceId | traceId from request propagated to response |
| 4 | `sendSuccess` with null data | Handles gracefully, `data: null` |
| 5 | `sendSuccess` with pagination | Includes pagination metadata |
| 6 | `sendError` with AppError | Returns correct status and error code |
| 7 | `sendError` with plain Error | Defaults to 500 |
| 8 | `sendError` propagates traceId | traceId in error response |
| 9 | `sendError` with validation details | Includes error details array |

### 2. Error Classes (`errors.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | AppError with custom fields | Correct message, statusCode, code |
| 2 | AppError default code | Defaults to `INTERNAL_ERROR` |
| 3 | AppError serializable | Can be converted to plain object |
| 4 | AppError has stack trace | Stack trace captured |
| 5 | ValidationError | 400, `VALIDATION_ERROR` |
| 6 | ValidationError custom message | Message preserved |
| 7 | AuthenticationError | 401, `AUTHENTICATION_ERROR` |
| 8 | AuthenticationError default msg | Default message when none supplied |
| 9 | AuthorizationError | 403, `AUTHORIZATION_ERROR` |
| 10 | NotFoundError | 404, `NOT_FOUND` |
| 11 | ConflictError | 409, `CONFLICT` |
| 12 | All errors extend AppError | `instanceof` checks pass |

### 3. Validation Schemas (`validation.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Valid registration data | Passes |
| 2 | Invalid email format | Fails |
| 3 | Short password | Fails |
| 4 | Missing name | Fails |
| 5 | Empty name | Fails |
| 6 | Valid login | Passes |
| 7 | Login without email | Fails |
| 8 | Login without password | Fails |
| 9 | Valid meeting (all fields) | Passes |
| 10 | Meeting (required fields only) | Passes |
| 11 | Meeting without title | Fails |
| 12 | Meeting without transcript | Fails |
| 13 | Meeting with empty title | Fails |
| 14 | Invalid participants type | Fails |
| 15 | Valid action item | Passes |
| 16 | Action item (required only) | Passes |
| 17 | Action item without title | Fails |
| 18 | Valid status update | Passes |

### 4. Auth Service (`auth.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Register new user | User created, token returned |
| 2 | Register duplicate email | Throws `ConflictError` |
| 3 | Password hashed before save | bcrypt.hash called with raw password |
| 4 | No password in response | User object omits password field |
| 5 | Login correct credentials | Token returned |
| 6 | Login non-existent user | Throws `AuthenticationError` |
| 7 | Login wrong password | Throws `AuthenticationError` |
| 8 | JWT payload correct | jwt.sign called with userId |
| 9 | No password in login response | Password excluded from user |

### 5. Meeting Service (`meetings.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Create meeting | Meeting returned with ID |
| 2 | Transcript stored correctly | Full transcript persisted |
| 3 | Meeting associated with user | userId in create data |
| 4 | Get existing meeting | Meeting returned with relations |
| 5 | Get non-existent meeting | Throws `NotFoundError` |
| 6 | Get meeting with analysis | Analysis and action items included |
| 7 | List meetings (paginated) | Correct data and pagination |
| 8 | List meetings (page 2 offset) | Skip calculated correctly |
| 9 | List meetings (empty) | Empty array, total=0 |
| 10 | List meetings with search | Search filter applied |

### 6. Action Items Service (`actionItems.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Create action item | Item created with PENDING status |
| 2 | Default PENDING status | Status is PENDING for new items |
| 3 | Correct meeting association | meetingId set correctly |
| 4 | Update status to COMPLETED | Status changed successfully |
| 5 | Update non-existent item | Throws `NotFoundError` |
| 6 | Status transition (PENDING → IN_PROGRESS) | Valid transition |
| 7 | List all action items | All items returned |
| 8 | Filter by status | Only matching status returned |
| 9 | Empty action items list | Empty array |
| 10 | Pagination works correctly | Skip/take calculated right |
| 11 | Get overdue items | Only past-due, non-completed items |
| 12 | No overdue items | Empty array |

### 7. AI Service (`ai.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Valid transcript analysis | Structured result with all fields |
| 2 | Citations have correct format | timestamp, speaker, text present |
| 3 | Invalid citations removed | Hallucinated timestamps filtered |
| 4 | Malformed JSON (code fences) | Cleaned and parsed successfully |
| 5 | AI service failure | Error propagated |
| 6 | Empty transcript | Minimal analysis returned |
| 7 | Action item citations validated | Citations reference real content |

---

## Edge Cases

### Auth
- Empty string for email or password
- SQL injection attempts in email field (handled by Prisma parameterization)
- Extremely long passwords (>1000 chars)
- Unicode characters in user name

### Meetings
- Empty transcript (zero-length string)
- Transcript with no timestamps
- Transcript with only one speaker
- Very long transcript (>100KB)
- Special characters in meeting title

### Action Items
- Due date in the past at creation time
- Status update to the same status
- Action item with no assignee
- Meeting ID that doesn't exist

### AI Analysis
- AI returns empty JSON `{}`
- AI returns JSON wrapped in markdown code fences
- AI returns citations with timestamps not in the transcript
- AI returns malformed JSON (retried with cleanup)
- API rate limit exceeded (503 error)
- Network timeout

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests with verbose output
npx jest --verbose

# Run a specific test file
npx jest tests/unit/auth.test.ts

# Run tests matching a pattern
npx jest --testPathPattern="validation"

# Run tests in watch mode (re-run on file changes)
npx jest --watch

# Run with coverage
npm run test:coverage
```

---

## Coverage Reports

Generate an HTML coverage report:

```bash
npm run test:coverage
```

This generates a report in the `coverage/` directory:

```
coverage/
├── lcov-report/
│   └── index.html    ← Open this in a browser
├── clover.xml
└── lcov.info
```

### Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Statements | >80% | — |
| Branches | >75% | — |
| Functions | >85% | — |
| Lines | >80% | — |

---

## Mocking Strategy

### Prisma Client

The Prisma client is mocked globally in `tests/setup.ts`:

```typescript
export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    // ... all Prisma methods
  },
  meeting: { /* ... */ },
  actionItem: { /* ... */ },
};

jest.mock('../src/lib/prisma', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));
```

Individual tests configure return values:
```typescript
prismaMock.user.findUnique.mockResolvedValue(mockUser);
```

### External Libraries

```typescript
// bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));
```

### Logger

Winston is silenced to prevent test output clutter:
```typescript
jest.mock('../src/lib/logger', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
```

---

## Limitations & Future Work

### Current Limitations

1. **No integration tests** — All tests mock the database. A real PostgreSQL test database would catch query issues, migration problems, and constraint violations.
2. **No API/E2E tests** — HTTP endpoint testing (with Supertest) would verify middleware, routing, and the full request lifecycle.
3. **No load/performance tests** — No benchmarks for response times under concurrent load.
4. **Prisma mock fidelity** — The mock doesn't enforce unique constraints, foreign keys, or query syntax.

### Planned Improvements

| Priority | Improvement | Tool |
|----------|------------|------|
| High | Integration tests with test PostgreSQL | Testcontainers + Docker |
| High | API endpoint tests | Supertest |
| Medium | CI/CD pipeline with test step | GitHub Actions |
| Medium | Test database seeding | Prisma seed scripts |
| Low | Load testing | k6, Artillery |
| Low | Snapshot tests for API responses | Jest snapshots |
