// ---------------------------------------------------------------------------
// tests/setup.ts — Global test bootstrap
// ---------------------------------------------------------------------------

import { jest } from '@jest/globals';

// ── 1. Environment Variables ────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';
process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test/fake-token';
process.env.PORT = '3001';

// ── 2. Prisma Client Mock ──────────────────────────────────────────────────
export const prismaMock: any = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  meeting: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  meetingAnalysis: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  actionItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  reminderHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((fn: any) => fn(prismaMock)),
};

// Mock the Prisma database module
jest.mock('../src/config/database', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

// ── 3. External Service Stubs ───────────────────────────────────────────────

// Silence Winston so test output isn't cluttered with log lines.
jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

// Stub global fetch (used by Discord webhook calls, etc.)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  }),
) as unknown as typeof fetch;

// ── Global Teardown ─────────────────────────────────────────────────────────
// Note: afterEach/afterAll are not available here (setupFiles runs before the
// test framework). Mock cleanup is handled by clearMocks: true in jest.config.

