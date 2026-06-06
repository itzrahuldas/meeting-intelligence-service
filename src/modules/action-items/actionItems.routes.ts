import { Router } from 'express';
import { actionItemsController } from './actionItems.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createActionItemSchema,
  updateStatusSchema,
  listActionItemsQuerySchema,
} from './actionItems.schemas';

const router = Router();

// All action item routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/action-items/overdue:
 *   get:
 *     summary: Get overdue action items
 *     tags: [Action Items]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue action items (status != COMPLETED AND dueDate < now)
 */
router.get('/overdue', (req, res, next) =>
  actionItemsController.getOverdue(req, res, next)
);

/**
 * @swagger
 * /api/action-items:
 *   post:
 *     summary: Create a new action item
 *     tags: [Action Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateActionItemRequest'
 *     responses:
 *       201:
 *         description: Action item created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Meeting not found
 */
router.post('/', validate(createActionItemSchema), (req, res, next) =>
  actionItemsController.create(req, res, next)
);

/**
 * @swagger
 * /api/action-items/{id}/status:
 *   patch:
 *     summary: Update action item status
 *     tags: [Action Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateActionItemStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Action item not found
 */
router.patch('/:id/status', validate(updateStatusSchema), (req, res, next) =>
  actionItemsController.updateStatus(req, res, next)
);

/**
 * @swagger
 * /api/action-items:
 *   get:
 *     summary: List action items with filtering
 *     tags: [Action Items]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *       - in: query
 *         name: meetingId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paginated list of action items
 */
router.get('/', validate(listActionItemsQuerySchema, 'query'), (req, res, next) =>
  actionItemsController.list(req, res, next)
);

/**
 * @swagger
 * /api/action-items/{id}:
 *   get:
 *     summary: Get an action item by ID
 *     tags: [Action Items]
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
 *         description: Action item details with reminder history
 *       404:
 *         description: Action item not found
 */
router.get('/:id', (req, res, next) =>
  actionItemsController.getById(req, res, next)
);

export { router as actionItemRoutes };
