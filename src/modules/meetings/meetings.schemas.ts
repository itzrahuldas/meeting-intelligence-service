import { z } from 'zod';

const transcriptEntrySchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  speaker: z.string().min(1, 'Speaker name is required'),
  text: z.string().min(1, 'Text is required'),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  participants: z
    .array(z.string().email('Each participant must be a valid email'))
    .min(1, 'At least one participant is required'),
  meetingDate: z.string().datetime('Invalid date-time format (use ISO 8601)'),
  transcript: z
    .array(transcriptEntrySchema)
    .min(1, 'Transcript must have at least one entry'),
});

export const listMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type MeetingQueryInput = z.infer<typeof listMeetingsQuerySchema>;
