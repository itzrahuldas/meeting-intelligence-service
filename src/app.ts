import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { traceIdMiddleware } from './middleware/traceId.middleware';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimiter.middleware';
import { sendSuccess } from './utils/response';
import { NotFoundError } from './utils/errors';
import env from './config/env';
import { swaggerSpec } from './config/swagger';
import { authRoutes } from './modules/auth/auth.routes';
import { meetingRoutes } from './modules/meetings/meetings.routes';
import { actionItemRoutes } from './modules/action-items/actionItems.routes';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Request tracing & logging
app.use(traceIdMiddleware);
app.use(requestLoggerMiddleware);

// Global rate limiting (100 req / 15 min per IP)
app.use(globalRateLimiter);

// Swagger API docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Meeting Intelligence API Docs',
  })
);

// Health endpoint
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'UP' });
});

// Evaluation endpoint
app.get('/api/evaluation', (_req, res) => {
  sendSuccess(res, {
    candidateName: env.CANDIDATE_NAME,
    email: env.CANDIDATE_EMAIL,
    repositoryUrl: env.REPOSITORY_URL,
    deployedUrl: env.DEPLOYED_URL,
    externalIntegration: 'Discord Webhook',
    features: [
      'JWT Authentication',
      'Meeting CRUD with Pagination',
      'AI-Powered Meeting Analysis (Gemini)',
      'Citation Grounding & Hallucination Prevention',
      'Action Item Management',
      'Overdue Detection',
      'Scheduled Reminder Job (node-cron)',
      'Discord Webhook Notifications',
      'Structured Logging with Trace IDs',
      'Input Validation (Zod)',
      'OpenAPI/Swagger Documentation',
      'Docker Support',
    ],
  });
});

// API routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionItemRoutes);

// 404 handler
app.use((_req, _res, next) => {
  next(new NotFoundError('Route'));
});

// Global error handler (must be last)
app.use(errorHandler);

export { app };
