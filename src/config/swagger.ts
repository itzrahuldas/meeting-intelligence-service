import swaggerJsdoc from 'swagger-jsdoc';
import env from './env';

const serverUrl = env.DEPLOYED_URL || `http://localhost:${env.PORT}`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meeting Intelligence Service API',
      version: '1.0.0',
      description:
        'AI-powered Meeting Intelligence Service that processes meeting transcripts, generates structured summaries with citation grounding, manages action items, and sends overdue reminders via Discord.',
      contact: {
        name: env.CANDIDATE_NAME,
        email: env.CANDIDATE_EMAIL,
      },
    },
    servers: [
      {
        url: serverUrl,
        description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        // ─── Auth Schemas ─────────────────────────────────────
        AuthRegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'securePassword123',
            },
            name: {
              type: 'string',
              minLength: 1,
              example: 'John Doe',
            },
          },
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'securePassword123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
              },
            },
          },
        },

        // ─── Transcript Schemas ───────────────────────────────
        TranscriptEntry: {
          type: 'object',
          required: ['speaker', 'text', 'timestamp'],
          properties: {
            speaker: {
              type: 'string',
              example: 'Alice',
            },
            text: {
              type: 'string',
              example: 'We need to finalize the Q3 budget by Friday.',
            },
            timestamp: {
              type: 'string',
              example: '00:05:23',
            },
          },
        },

        // ─── Meeting Schemas ──────────────────────────────────
        CreateMeetingRequest: {
          type: 'object',
          required: ['title', 'participants', 'meetingDate', 'transcript'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'Q3 Planning Meeting',
            },
            participants: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              example: ['Alice', 'Bob', 'Charlie'],
            },
            meetingDate: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:00:00.000Z',
            },
            transcript: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptEntry' },
              minItems: 1,
            },
          },
        },
        MeetingResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            participants: {
              type: 'array',
              items: { type: 'string' },
            },
            meetingDate: { type: 'string', format: 'date-time' },
            transcript: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptEntry' },
            },
            userId: { type: 'string', format: 'uuid' },
            analysis: {
              $ref: '#/components/schemas/AnalysisResponse',
              nullable: true,
            },
            actionItems: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActionItemResponse' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MeetingListResponse: {
          type: 'object',
          properties: {
            meetings: {
              type: 'array',
              items: { $ref: '#/components/schemas/MeetingResponse' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 42 },
                totalPages: { type: 'integer', example: 5 },
              },
            },
          },
        },

        // ─── Analysis Schemas ─────────────────────────────────
        CitationReference: {
          type: 'object',
          properties: {
            speaker: { type: 'string', example: 'Alice' },
            text: { type: 'string', example: 'We need to finalize the Q3 budget by Friday.' },
            timestamp: { type: 'string', example: '00:05:23' },
          },
        },
        AnalysisResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            meetingId: { type: 'string', format: 'uuid' },
            summary: {
              type: 'object',
              properties: {
                overview: { type: 'string' },
                keyTopics: {
                  type: 'array',
                  items: { type: 'string' },
                },
                citations: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CitationReference' },
                },
              },
            },
            decisions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  decision: { type: 'string' },
                  madeBy: { type: 'string' },
                  citations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CitationReference' },
                  },
                },
              },
            },
            followUps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task: { type: 'string' },
                  assignee: { type: 'string' },
                  dueDate: { type: 'string', nullable: true },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  citations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CitationReference' },
                  },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Action Item Schemas ──────────────────────────────
        CreateActionItemRequest: {
          type: 'object',
          required: ['task', 'assignee', 'meetingId'],
          properties: {
            task: {
              type: 'string',
              minLength: 1,
              example: 'Prepare Q3 budget report',
            },
            assignee: {
              type: 'string',
              minLength: 1,
              example: 'Alice',
            },
            meetingId: {
              type: 'string',
              format: 'uuid',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-01-20T17:00:00.000Z',
            },
            citations: {
              type: 'array',
              items: { $ref: '#/components/schemas/CitationReference' },
              nullable: true,
            },
          },
        },
        UpdateActionItemStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
              example: 'IN_PROGRESS',
            },
          },
        },
        ActionItemResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            task: { type: 'string' },
            assignee: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            citations: {
              type: 'array',
              items: { $ref: '#/components/schemas/CitationReference' },
              nullable: true,
            },
            meetingId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ActionItemListResponse: {
          type: 'object',
          properties: {
            actionItems: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActionItemResponse' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },

        // ─── Generic Response Schemas ─────────────────────────
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            traceId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response payload — varies by endpoint',
            },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            traceId: {
              type: 'string',
              format: 'uuid',
            },
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Input validation failed' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                  nullable: true,
                },
              },
            },
          },
        },

        // ─── Health & Evaluation ──────────────────────────────
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'UP' },
          },
        },
        EvaluationResponse: {
          type: 'object',
          properties: {
            candidateName: { type: 'string', example: 'Rahul' },
            email: { type: 'string', format: 'email' },
            repositoryUrl: { type: 'string', format: 'uri' },
            deployedUrl: { type: 'string', format: 'uri' },
            externalIntegration: { type: 'string', example: 'Discord Webhook' },
            features: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },

    // ─── Path Definitions ───────────────────────────────────
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns service health status',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/HealthResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/evaluation': {
        get: {
          tags: ['Evaluation'],
          summary: 'Candidate evaluation info',
          description: 'Returns candidate metadata and implemented features',
          responses: {
            '200': {
              description: 'Evaluation data',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/EvaluationResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Creates a new user account and returns a JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthRegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/AuthResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
            '409': {
              description: 'Email already registered',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login',
          description: 'Authenticates user credentials and returns a JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/AuthResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/meetings': {
        post: {
          tags: ['Meetings'],
          summary: 'Create a new meeting',
          description: 'Uploads a meeting transcript and triggers AI analysis',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMeetingRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Meeting created and analysis started',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MeetingResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
        get: {
          tags: ['Meetings'],
          summary: 'List meetings',
          description: 'Returns paginated list of meetings for the authenticated user',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1, minimum: 1 },
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
              description: 'Items per page',
            },
          ],
          responses: {
            '200': {
              description: 'Paginated meeting list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MeetingListResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/meetings/{id}': {
        get: {
          tags: ['Meetings'],
          summary: 'Get meeting by ID',
          description: 'Returns a single meeting with its analysis and action items',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Meeting ID',
            },
          ],
          responses: {
            '200': {
              description: 'Meeting details',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MeetingResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '404': {
              description: 'Meeting not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/meetings/{id}/analysis': {
        get: {
          tags: ['Meetings'],
          summary: 'Get meeting analysis',
          description: 'Returns the AI-generated analysis for a meeting',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Meeting ID',
            },
          ],
          responses: {
            '200': {
              description: 'Meeting analysis',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/AnalysisResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '404': {
              description: 'Meeting or analysis not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Meetings'],
          summary: 'Trigger meeting analysis',
          description: 'Re-triggers the AI analysis for a meeting (overwrites existing analysis)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Meeting ID',
            },
          ],
          responses: {
            '200': {
              description: 'Analysis generated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/AnalysisResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '404': {
              description: 'Meeting not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/action-items': {
        post: {
          tags: ['Action Items'],
          summary: 'Create an action item',
          description: 'Creates a new action item linked to a meeting',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateActionItemRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Action item created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/ActionItemResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
        get: {
          tags: ['Action Items'],
          summary: 'List action items',
          description: 'Returns action items with filtering, pagination, and optional overdue detection',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1, minimum: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
            },
            {
              name: 'assignee',
              in: 'query',
              schema: { type: 'string' },
            },
            {
              name: 'meetingId',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'overdue',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Filter to only overdue items (due date in the past, not completed)',
            },
          ],
          responses: {
            '200': {
              description: 'Paginated action item list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/ActionItemListResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/action-items/{id}': {
        get: {
          tags: ['Action Items'],
          summary: 'Get action item by ID',
          description: 'Returns a single action item with its reminder history',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Action item details',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/ActionItemResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '404': {
              description: 'Action item not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
        patch: {
          tags: ['Action Items'],
          summary: 'Update action item status',
          description: 'Updates the status of an action item',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateActionItemStatusRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Action item updated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/ActionItemResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
            '404': {
              description: 'Action item not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define all paths inline above, no need for JSDoc scanning
};

export const swaggerSpec = swaggerJsdoc(options);
