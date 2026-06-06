import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { sendDiscordReminder } from './notification.service';

const REMINDER_INTERVAL = '*/15 * * * *'; // Every 15 minutes
const DEDUP_HOURS = 24; // Don't send another reminder within 24 hours

export function startScheduler(): void {
  logger.info('⏰ Reminder scheduler started', {
    schedule: REMINDER_INTERVAL,
    description: 'Runs every 15 minutes to check for overdue action items',
  });

  cron.schedule(REMINDER_INTERVAL, async () => {
    logger.info('Running overdue action items check...');

    try {
      // 1. Find all overdue action items (status != COMPLETED, dueDate < now)
      const overdueItems = await prisma.actionItem.findMany({
        where: {
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' },
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
            },
          },
          reminders: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      logger.info(`Found ${overdueItems.length} overdue action items`);

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const item of overdueItems) {
        // 2a. Check if a reminder was already sent in the last 24 hours (dedup)
        const lastReminder = item.reminders[0];
        if (lastReminder) {
          const hoursSinceLastReminder =
            (Date.now() - lastReminder.sentAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceLastReminder < DEDUP_HOURS) {
            logger.debug('Skipping reminder — already sent recently', {
              actionItemId: item.id,
              hoursSince: Math.round(hoursSinceLastReminder),
            });
            skipped++;
            continue;
          }
        }

        // 2b. Send Discord notification
        const success = await sendDiscordReminder({
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate!.toISOString(),
          meetingTitle: item.meeting.title,
          actionItemId: item.id,
        });

        // 2c. Record in ReminderHistory
        await prisma.reminderHistory.create({
          data: {
            actionItemId: item.id,
            channel: 'discord',
            success,
            errorMessage: success ? null : 'Failed to send Discord notification',
          },
        });

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Rate limit: wait 1 second between messages to avoid Discord rate limits
        if (overdueItems.indexOf(item) < overdueItems.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 3. Log summary
      logger.info('Overdue reminder job completed', {
        total: overdueItems.length,
        sent,
        skipped,
        failed,
      });
    } catch (error: any) {
      logger.error('Reminder scheduler failed', {
        error: error.message,
        stack: error.stack,
      });
    }
  });
}
