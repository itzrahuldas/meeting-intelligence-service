// ---------------------------------------------------------------------------
// tests/unit/validation.test.ts — Zod schema validation unit tests
// ---------------------------------------------------------------------------

import { registerSchema, loginSchema } from '../../src/modules/auth/auth.schemas';
import { createMeetingSchema } from '../../src/modules/meetings/meetings.schemas';
import {
  createActionItemSchema,
  updateStatusSchema,
} from '../../src/modules/action-items/actionItems.schemas';

// ── Auth Schemas ────────────────────────────────────────────────────────────

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: 'SecurePass123!',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject registration with invalid email', () => {
      const invalidData = {
        name: 'Rahul',
        email: 'not-an-email',
        password: 'SecurePass123!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject registration with short password', () => {
      const invalidData = {
        name: 'Rahul',
        email: 'rahul@example.com',
        password: '123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject registration without a name', () => {
      const invalidData = {
        email: 'rahul@example.com',
        password: 'SecurePass123!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty string for name', () => {
      const invalidData = {
        name: '',
        email: 'rahul@example.com',
        password: 'SecurePass123!',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const validData = {
        email: 'rahul@example.com',
        password: 'SecurePass123!',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject login without email', () => {
      const invalidData = {
        password: 'SecurePass123!',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject login without password', () => {
      const invalidData = {
        email: 'rahul@example.com',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

// ── Meeting Schema ──────────────────────────────────────────────────────────

describe('Meeting Schema', () => {
  describe('createMeetingSchema', () => {
    it('should accept a valid meeting with all fields', () => {
      const validData = {
        title: 'Sprint Planning',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com', 'bob@test.com'],
        transcript: [
          { timestamp: '00:00', speaker: 'Alice', text: 'Let us start the planning session.' },
        ],
      };

      const result = createMeetingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject a meeting without a title', () => {
      const invalidData = {
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com'],
        transcript: [
          { timestamp: '00:00', speaker: 'Alice', text: 'Hello everyone.' },
        ],
      };

      const result = createMeetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject a meeting without a transcript', () => {
      const invalidData = {
        title: 'Missing Transcript',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com'],
      };

      const result = createMeetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject a meeting with an empty title', () => {
      const invalidData = {
        title: '',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com'],
        transcript: [
          { timestamp: '00:00', speaker: 'Alice', text: 'Something.' },
        ],
      };

      const result = createMeetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject if transcript is not an array', () => {
      const invalidData = {
        title: 'Standup',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com'],
        transcript: 'plain text transcript',
      };

      const result = createMeetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject an empty transcript array', () => {
      const invalidData = {
        title: 'Standup',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com'],
        transcript: [],
      };

      const result = createMeetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject if meetingDate is not a valid ISO datetime', () => {
      const invalidData = {
        title: 'Standup',
        meetingDate: 'not-a-date',
        participants: ['alice@test.com'],
        transcript: [
          { timestamp: '00:00', speaker: 'Alice', text: 'Hello.' },
        ],
      };

      const result = createMeetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

// ── Action Item Schemas ─────────────────────────────────────────────────────

describe('Action Item Schemas', () => {
  describe('createActionItemSchema', () => {
    it('should accept a valid action item', () => {
      const validData = {
        task: 'Fix login bug',
        assignee: 'Alice',
        dueDate: '2026-06-15T17:00:00Z',
        meetingId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createActionItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject an action item without task', () => {
      const invalidData = {
        assignee: 'Alice',
        meetingId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createActionItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject an action item with an empty task', () => {
      const invalidData = {
        task: '',
        assignee: 'Alice',
        meetingId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createActionItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject an action item without a meetingId', () => {
      const invalidData = {
        task: 'Do something',
        assignee: 'Bob',
      };

      const result = createActionItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject an invalid meetingId (not UUID)', () => {
      const invalidData = {
        task: 'Do something',
        assignee: 'Bob',
        meetingId: 'not-a-uuid',
      };

      const result = createActionItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateStatusSchema', () => {
    it('should accept valid status "COMPLETED"', () => {
      const result = updateStatusSchema.safeParse({ status: 'COMPLETED' });
      expect(result.success).toBe(true);
    });

    it('should accept valid status "PENDING"', () => {
      const result = updateStatusSchema.safeParse({ status: 'PENDING' });
      expect(result.success).toBe(true);
    });

    it('should accept valid status "IN_PROGRESS"', () => {
      const result = updateStatusSchema.safeParse({ status: 'IN_PROGRESS' });
      expect(result.success).toBe(true);
    });

    it('should reject an invalid status value', () => {
      const result = updateStatusSchema.safeParse({ status: 'DONE' });
      expect(result.success).toBe(false);
    });

    it('should reject when status is missing entirely', () => {
      const result = updateStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject numeric status values', () => {
      const result = updateStatusSchema.safeParse({ status: 1 });
      expect(result.success).toBe(false);
    });
  });
});
