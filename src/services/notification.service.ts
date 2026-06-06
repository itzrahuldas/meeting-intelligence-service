import env from '../config/env';
import { logger } from '../utils/logger';

export interface ReminderPayload {
  task: string;
  assignee: string;
  dueDate: string;
  meetingTitle: string;
  actionItemId: string;
}

export async function sendDiscordReminder(payload: ReminderPayload): Promise<boolean> {
  const webhookUrl = env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('Discord webhook URL not configured, skipping reminder', {
      actionItemId: payload.actionItemId,
    });
    return false;
  }

  const dueDate = new Date(payload.dueDate);
  const now = new Date();
  const overdueDays = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const embed = {
    title: '⏰ Overdue Action Item Reminder',
    color: 0xff6b6b,
    fields: [
      {
        name: '📋 Task',
        value: payload.task,
        inline: false,
      },
      {
        name: '👤 Assigned To',
        value: payload.assignee,
        inline: true,
      },
      {
        name: '📅 Due Date',
        value: dueDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        inline: true,
      },
      {
        name: '⚠️ Overdue By',
        value: `${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
        inline: true,
      },
      {
        name: '🎙️ Meeting',
        value: payload.meetingTitle,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Meeting Intelligence Service',
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response body');
      logger.error('Discord webhook request failed', {
        actionItemId: payload.actionItemId,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: errorBody,
      });
      return false;
    }

    logger.info('Discord reminder sent successfully', {
      actionItemId: payload.actionItemId,
      assignee: payload.assignee,
      task: payload.task.substring(0, 50),
    });

    return true;
  } catch (error) {
    logger.error('Failed to send Discord reminder', {
      actionItemId: payload.actionItemId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
