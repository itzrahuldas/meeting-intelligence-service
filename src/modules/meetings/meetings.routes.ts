import { Router } from 'express';
import { meetingsController } from './meetings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { aiRateLimiter } from '../../middleware/rateLimiter.middleware';
import { createMeetingSchema, listMeetingsQuerySchema } from './meetings.schemas';

const router = Router();

// All meeting routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMeetingRequest'
 *     responses:
 *       201:
 *         description: Meeting created
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createMeetingSchema), (req, res, next) =>
  meetingsController.create(req, res, next)
);

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: List meetings with pagination
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of meetings
 */
router.get('/', validate(listMeetingsQuerySchema, 'query'), (req, res, next) =>
  meetingsController.list(req, res, next)
);

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a meeting by ID
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Meeting details with analysis and action items
 *       404:
 *         description: Meeting not found
 */
router.get('/:id', (req, res, next) =>
  meetingsController.getById(req, res, next)
);

/**
 * @swagger
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Analyze meeting transcript with AI
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: AI analysis with summary, action items, decisions, follow-ups (all with citations)
 *       404:
 *         description: Meeting not found
 *       502:
 *         description: AI service unavailable
 */
router.post('/:id/analyze', aiRateLimiter, (req, res, next) =>
  meetingsController.analyze(req, res, next)
);

export { router as meetingRoutes };
