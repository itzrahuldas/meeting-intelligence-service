// ---------------------------------------------------------------------------
// tests/unit/meetings.test.ts — Meeting service unit tests
// ---------------------------------------------------------------------------

import { prismaMock } from '../setup';
import { meetingsService } from '../../src/modules/meetings/meetings.service';
import { NotFoundError } from '../../src/utils/errors';

// ── Test Data ───────────────────────────────────────────────────────────────

const userId = 'user-uuid-1';

const sampleTranscript = [
  { timestamp: '00:00', speaker: 'Alice', text: 'Welcome to sprint planning.' },
  { timestamp: '00:15', speaker: 'Bob', text: 'I finished the auth module.' },
  { timestamp: '01:02', speaker: 'Charlie', text: 'I need help with the dashboard.' },
];

const mockMeeting = {
  id: 'meeting-uuid-1',
  title: 'Sprint Planning',
  meetingDate: new Date('2026-06-10T10:00:00Z'),
  participants: ['alice@test.com', 'bob@test.com', 'charlie@test.com'],
  transcript: sampleTranscript,
  userId,
  createdAt: new Date('2026-06-05T10:00:00Z'),
  updatedAt: new Date('2026-06-05T10:00:00Z'),
  analysis: null,
  actionItems: [],
};

const mockMeetingsList = [
  mockMeeting,
  {
    ...mockMeeting,
    id: 'meeting-uuid-2',
    title: 'Retrospective',
    meetingDate: new Date('2026-06-11T14:00:00Z'),
    _count: { actionItems: 0 },
  },
  {
    ...mockMeeting,
    id: 'meeting-uuid-3',
    title: 'Design Review',
    meetingDate: new Date('2026-06-12T09:00:00Z'),
    _count: { actionItems: 2 },
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Meeting Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createMeeting ─────────────────────────────────────────────────────

  describe('createMeeting', () => {
    it('should create a meeting and return it', async () => {
      prismaMock.meeting.create.mockResolvedValue(mockMeeting);

      const input = {
        title: 'Sprint Planning',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['alice@test.com', 'bob@test.com', 'charlie@test.com'],
        transcript: sampleTranscript,
      };

      const result = await meetingsService.createMeeting(userId, input);

      expect(prismaMock.meeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Sprint Planning',
            userId,
          }),
        })
      );
      expect(result).toHaveProperty('id', 'meeting-uuid-1');
      expect(result.title).toBe('Sprint Planning');
    });

    it('should associate the meeting with the authenticated user', async () => {
      prismaMock.meeting.create.mockResolvedValue(mockMeeting);

      await meetingsService.createMeeting('specific-user-id', {
        title: 'Test',
        meetingDate: '2026-06-10T10:00:00Z',
        participants: ['a@b.com'],
        transcript: sampleTranscript,
      });

      const callArgs = (prismaMock.meeting.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.userId).toBe('specific-user-id');
    });
  });

  // ── getMeetingById ────────────────────────────────────────────────────

  describe('getMeetingById', () => {
    it('should return a meeting when it exists', async () => {
      prismaMock.meeting.findFirst.mockResolvedValue(mockMeeting);

      const result = await meetingsService.getMeetingById(userId, 'meeting-uuid-1');

      expect(prismaMock.meeting.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'meeting-uuid-1', userId },
        })
      );
      expect(result).toHaveProperty('id', 'meeting-uuid-1');
    });

    it('should throw NotFoundError when meeting does not exist', async () => {
      prismaMock.meeting.findFirst.mockResolvedValue(null);

      await expect(
        meetingsService.getMeetingById(userId, 'non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should include analysis and actionItems in the response', async () => {
      const meetingWithRelations = {
        ...mockMeeting,
        analysis: { id: 'analysis-1', summary: 'Good meeting' },
        actionItems: [{ id: 'ai-1', task: 'Fix bug' }],
      };
      prismaMock.meeting.findFirst.mockResolvedValue(meetingWithRelations);

      const result = await meetingsService.getMeetingById(userId, 'meeting-uuid-1');

      expect(result.analysis).toBeDefined();
      expect(result.actionItems).toHaveLength(1);
    });
  });

  // ── listMeetings ──────────────────────────────────────────────────────

  describe('listMeetings', () => {
    it('should return paginated meetings for a user', async () => {
      prismaMock.meeting.findMany.mockResolvedValue(mockMeetingsList);
      prismaMock.meeting.count.mockResolvedValue(3);

      const result = await meetingsService.listMeetings(userId, { page: 1, limit: 10 });

      expect(prismaMock.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
          skip: 0,
          take: 10,
        })
      );
      expect(result.meetings).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should calculate correct pagination offset for page 2', async () => {
      prismaMock.meeting.findMany.mockResolvedValue([]);
      prismaMock.meeting.count.mockResolvedValue(15);

      await meetingsService.listMeetings(userId, { page: 2, limit: 5 });

      expect(prismaMock.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    it('should return empty array when user has no meetings', async () => {
      prismaMock.meeting.findMany.mockResolvedValue([]);
      prismaMock.meeting.count.mockResolvedValue(0);

      const result = await meetingsService.listMeetings(userId, { page: 1, limit: 10 });

      expect(result.meetings).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should order meetings by date descending', async () => {
      prismaMock.meeting.findMany.mockResolvedValue(mockMeetingsList);
      prismaMock.meeting.count.mockResolvedValue(3);

      await meetingsService.listMeetings(userId, { page: 1, limit: 10 });

      const callArgs = (prismaMock.meeting.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.orderBy).toBeDefined();
    });
  });
});
