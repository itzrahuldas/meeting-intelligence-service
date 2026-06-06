import { z } from 'zod';

export const createActionItemSchema = z.object({
  task: z
    .string({ required_error: 'Task is required' })
    .min(1, 'Task must not be empty'),
  assignee: z
    .string({ required_error: 'Assignee is required' })
    .min(1, 'Assignee must not be empty'),
  meetingId: z
    .string({ required_error: 'Meeting ID is required' })
    .uuid('Meeting ID must be a valid UUID'),
  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 datetime string' })
    .optional(),
  citations: z
    .array(
      z.object({
        timestamp: z.string({ required_error: 'Citation timestamp is required' }),
      })
    )
    .optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  }),
});

export const listActionItemsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100')),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  assignee: z
    .string()
    .optional(),
  meetingId: z
    .string()
    .uuid('Meeting ID must be a valid UUID')
    .optional(),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ListActionItemsQuery = z.infer<typeof listActionItemsQuerySchema>;
