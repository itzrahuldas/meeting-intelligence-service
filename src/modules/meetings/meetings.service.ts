import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { CreateMeetingInput, MeetingQueryInput } from './meetings.schemas';
import { analyzeTranscript, TranscriptEntry } from '../../services/ai.service';

export class MeetingsService {
  async createMeeting(userId: string, input: CreateMeetingInput) {
    const meeting = await prisma.meeting.create({
      data: {
        title: input.title,
        participants: input.participants,
        meetingDate: new Date(input.meetingDate),
        transcript: input.transcript as any,
        userId,
      },
      include: {
        analysis: true,
        actionItems: true,
      },
    });

    return meeting;
  }

  async listMeetings(userId: string, query: MeetingQueryInput) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          analysis: true,
          _count: { select: { actionItems: true } },
        },
        orderBy: { meetingDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMeetingById(userId: string, meetingId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      include: {
        analysis: true,
        actionItems: {
          include: {
            reminders: {
              orderBy: { sentAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting');
    }

    return meeting;
  }

  async analyzeMeeting(userId: string, meetingId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting');
    }

    const transcript = meeting.transcript as unknown as TranscriptEntry[];

    logger.info('Starting AI analysis', { meetingId });

    // Call the AI service to analyze the transcript
    const analysisResult = await analyzeTranscript(transcript);

    // Use a transaction to upsert analysis and create action items
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the analysis
      const analysis = await tx.meetingAnalysis.upsert({
        where: { meetingId },
        create: {
          meetingId,
          summary: analysisResult.summary as any,
          decisions: analysisResult.decisions as any,
          followUps: analysisResult.followUps as any,
        },
        update: {
          summary: analysisResult.summary as any,
          decisions: analysisResult.decisions as any,
          followUps: analysisResult.followUps as any,
        },
      });

      // Delete existing AI-generated action items for this meeting
      await tx.actionItem.deleteMany({
        where: { meetingId },
      });

      // Create new action items from AI response
      if (analysisResult.actionItems && analysisResult.actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: analysisResult.actionItems.map((item) => ({
            task: item.task,
            assignee: item.assignee || 'Unassigned',
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            citations: item.citations as any,
            meetingId,
          })),
        });
      }

      // Fetch the created action items
      const actionItems = await tx.actionItem.findMany({
        where: { meetingId },
      });

      return { analysis, actionItems };
    });

    logger.info('AI analysis completed', {
      meetingId,
      analysisId: result.analysis.id,
      actionItemsCreated: result.actionItems.length,
    });

    return {
      summary: analysisResult.summary,
      actionItems: result.actionItems,
      decisions: analysisResult.decisions,
      followUps: analysisResult.followUps,
    };
  }
}

export const meetingsService = new MeetingsService();
