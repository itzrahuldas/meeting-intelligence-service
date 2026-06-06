import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import {
  CreateActionItemInput,
  UpdateStatusInput,
  ListActionItemsQuery,
} from './actionItems.schemas';

export class ActionItemsService {
  async createActionItem(userId: string, input: CreateActionItemInput) {
    // Verify the meeting belongs to the user
    const meeting = await prisma.meeting.findFirst({
      where: { id: input.meetingId, userId },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting');
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        task: input.task,
        assignee: input.assignee,
        meetingId: input.meetingId,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        citations: input.citations as any || null,
      },
      include: {
        meeting: { select: { id: true, title: true } },
      },
    });

    return actionItem;
  }

  async listActionItems(userId: string, query: ListActionItemsQuery) {
    const { page, limit, status, assignee, meetingId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ActionItemWhereInput = {
      meeting: { userId },
    };

    if (status) {
      where.status = status;
    }

    if (assignee) {
      where.assignee = { contains: assignee, mode: 'insensitive' };
    }

    if (meetingId) {
      where.meetingId = meetingId;
    }

    const [actionItems, total] = await Promise.all([
      prisma.actionItem.findMany({
        where,
        include: {
          meeting: {
            select: { id: true, title: true },
          },
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.actionItem.count({ where }),
    ]);

    return {
      actionItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActionItemById(userId: string, actionItemId: string) {
    const actionItem = await prisma.actionItem.findFirst({
      where: {
        id: actionItemId,
        meeting: { userId },
      },
      include: {
        meeting: {
          select: { id: true, title: true },
        },
        reminders: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!actionItem) {
      throw new NotFoundError('Action Item');
    }

    return actionItem;
  }

  async updateActionItemStatus(
    userId: string,
    actionItemId: string,
    input: UpdateStatusInput
  ) {
    const existing = await prisma.actionItem.findFirst({
      where: {
        id: actionItemId,
        meeting: { userId },
      },
    });

    if (!existing) {
      throw new NotFoundError('Action Item');
    }

    const updated = await prisma.actionItem.update({
      where: { id: actionItemId },
      data: { status: input.status },
      include: {
        meeting: { select: { id: true, title: true } },
      },
    });

    return updated;
  }

  async getOverdueActionItems() {
    const overdueItems = await prisma.actionItem.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
      include: {
        meeting: {
          select: { id: true, title: true },
        },
        _count: { select: { reminders: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return overdueItems;
  }
}

export const actionItemsService = new ActionItemsService();
