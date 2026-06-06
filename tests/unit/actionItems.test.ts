// ---------------------------------------------------------------------------
// tests/unit/actionItems.test.ts — Action items service unit tests
// ---------------------------------------------------------------------------

import { prismaMock } from '../setup';
import { actionItemsService } from '../../src/modules/action-items/actionItems.service';
import { NotFoundError } from '../../src/utils/errors';

// ── Test Data ───────────────────────────────────────────────────────────────

const userId = 'user-uuid-1';
const meetingId = 'meeting-uuid-1';

const mockActionItem = {
  id: 'action-uuid-1',
  task: 'Fix login bug',
  assignee: 'Alice',
  dueDate: new Date('2026-06-15T17:00:00Z'),
  status: 'PENDING',
  citations: null,
  meetingId,
  createdAt: new Date('2026-06-05T10:00:00Z'),
  updatedAt: new Date('2026-06-05T10:00:00Z'),
  meeting: { id: meetingId, title: 'Sprint Planning' },
};

const mockMeeting = {
  id: meetingId,
  title: 'Sprint Planning',
  userId,
};

const mockActionItems = [
  mockActionItem,
  {
    ...mockActionItem,
    id: 'action-uuid-2',
    task: 'Write API docs',
    status: 'IN_PROGRESS',
    dueDate: new Date('2026-06-20T17:00:00Z'),
  },
  {
    ...mockActionItem,
    id: 'action-uuid-3',
    task: 'Set up CI/CD',
    status: 'COMPLETED',
    dueDate: new Date('2026-06-12T17:00:00Z'),
  },
];

const overdueItem = {
  ...mockActionItem,
  id: 'action-uuid-overdue',
  task: 'Submit report',
  dueDate: new Date('2026-06-01T17:00:00Z'), // past due
  status: 'PENDING',
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Action Items Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createActionItem ──────────────────────────────────────────────────

  describe('createActionItem', () => {
    it('should create an action item and return it', async () => {
      prismaMock.meeting.findFirst.mockResolvedValue(mockMeeting);
      prismaMock.actionItem.create.mockResolvedValue(mockActionItem);

      const input = {
        task: 'Fix login bug',
        assignee: 'Alice',
        dueDate: '2026-06-15T17:00:00Z',
        meetingId,
      };

      const result = await actionItemsService.createActionItem(userId, input);

      expect(prismaMock.meeting.findFirst).toHaveBeenCalledWith({
        where: { id: meetingId, userId },
      });
      expect(prismaMock.actionItem.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'action-uuid-1');
    });

    it('should throw NotFoundError when meeting does not belong to user', async () => {
      prismaMock.meeting.findFirst.mockResolvedValue(null);

      await expect(
        actionItemsService.createActionItem(userId, {
          task: 'Test',
          assignee: 'Bob',
          meetingId: 'wrong-meeting',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── updateActionItemStatus ────────────────────────────────────────────

  describe('updateActionItemStatus', () => {
    it('should update the status of an existing action item', async () => {
      const updatedItem = { ...mockActionItem, status: 'COMPLETED' };
      prismaMock.actionItem.findFirst.mockResolvedValue(mockActionItem);
      prismaMock.actionItem.update.mockResolvedValue(updatedItem);

      const result = await actionItemsService.updateActionItemStatus(
        userId,
        'action-uuid-1',
        { status: 'COMPLETED' }
      );

      expect(prismaMock.actionItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'action-uuid-1' },
          data: { status: 'COMPLETED' },
        })
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundError if the action item does not exist', async () => {
      prismaMock.actionItem.findFirst.mockResolvedValue(null);

      await expect(
        actionItemsService.updateActionItemStatus(userId, 'non-existent', { status: 'COMPLETED' })
      ).rejects.toThrow(NotFoundError);

      expect(prismaMock.actionItem.update).not.toHaveBeenCalled();
    });

    it('should transition from PENDING to IN_PROGRESS', async () => {
      const inProgressItem = { ...mockActionItem, status: 'IN_PROGRESS' };
      prismaMock.actionItem.findFirst.mockResolvedValue(mockActionItem);
      prismaMock.actionItem.update.mockResolvedValue(inProgressItem);

      const result = await actionItemsService.updateActionItemStatus(
        userId,
        'action-uuid-1',
        { status: 'IN_PROGRESS' }
      );

      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  // ── listActionItems ───────────────────────────────────────────────────

  describe('listActionItems', () => {
    it('should return all action items for a user', async () => {
      prismaMock.actionItem.findMany.mockResolvedValue(mockActionItems);
      prismaMock.actionItem.count.mockResolvedValue(3);

      const result = await actionItemsService.listActionItems(userId, { page: 1, limit: 10 });

      expect(prismaMock.actionItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            meeting: { userId },
          }),
        })
      );
      expect(result.actionItems).toHaveLength(3);
    });

    it('should filter action items by status', async () => {
      const pendingItems = mockActionItems.filter((i) => i.status === 'PENDING');
      prismaMock.actionItem.findMany.mockResolvedValue(pendingItems);
      prismaMock.actionItem.count.mockResolvedValue(1);

      const result = await actionItemsService.listActionItems(userId, {
        page: 1,
        limit: 10,
        status: 'PENDING',
      });

      expect(result.actionItems).toHaveLength(1);
    });

    it('should return empty array when no action items exist', async () => {
      prismaMock.actionItem.findMany.mockResolvedValue([]);
      prismaMock.actionItem.count.mockResolvedValue(0);

      const result = await actionItemsService.listActionItems(userId, { page: 1, limit: 10 });

      expect(result.actionItems).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should paginate results correctly', async () => {
      prismaMock.actionItem.findMany.mockResolvedValue([mockActionItems[2]]);
      prismaMock.actionItem.count.mockResolvedValue(3);

      await actionItemsService.listActionItems(userId, { page: 3, limit: 1 });

      expect(prismaMock.actionItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 2,
          take: 1,
        })
      );
    });
  });

  // ── getOverdueActionItems ─────────────────────────────────────────────

  describe('getOverdueActionItems', () => {
    it('should return action items past their due date that are not completed', async () => {
      prismaMock.actionItem.findMany.mockResolvedValue([overdueItem]);

      const result = await actionItemsService.getOverdueActionItems();

      expect(prismaMock.actionItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: 'COMPLETED' },
            dueDate: { lt: expect.any(Date) },
          }),
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].task).toBe('Submit report');
    });

    it('should return empty array when no items are overdue', async () => {
      prismaMock.actionItem.findMany.mockResolvedValue([]);

      const result = await actionItemsService.getOverdueActionItems();

      expect(result).toEqual([]);
    });
  });
});
