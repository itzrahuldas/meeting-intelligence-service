// ---------------------------------------------------------------------------
// tests/unit/response.test.ts — Response utility unit tests
// ---------------------------------------------------------------------------

import { sendSuccess, sendError } from '../../src/utils/response';

// ── Helpers ─────────────────────────────────────────────────────────────────

function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.req = { traceId: 'trace-abc-123' };
  return res;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Response Utility', () => {
  // ── sendSuccess ─────────────────────────────────────────────────────────

  describe('sendSuccess', () => {
    it('should return 200 with correct envelope by default', () => {
      const res = mockResponse();
      const data = { id: 1, name: 'Standup Meeting' };

      sendSuccess(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          traceId: 'trace-abc-123',
        })
      );
    });

    it('should return 201 for resource creation responses', () => {
      const res = mockResponse();
      const data = { id: 42 };

      sendSuccess(res, data, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
        })
      );
    });

    it('should include traceId from the request object', () => {
      const res = mockResponse();
      res.req.traceId = 'unique-trace-999';

      sendSuccess(res, null);

      const body = res.json.mock.calls[0][0];
      expect(body.traceId).toBe('unique-trace-999');
    });

    it('should handle null data gracefully', () => {
      const res = mockResponse();

      sendSuccess(res, null);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data).toBeNull();
    });
  });

  // ── sendError ───────────────────────────────────────────────────────────

  describe('sendError', () => {
    it('should return the correct status code and error envelope', () => {
      const res = mockResponse();

      sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Something went wrong',
            code: 'INTERNAL_ERROR',
          }),
          traceId: 'trace-abc-123',
        })
      );
    });

    it('should propagate the traceId in the error response', () => {
      const res = mockResponse();
      res.req.traceId = 'err-trace-456';

      sendError(res, 400, 'BAD_REQUEST', 'fail');

      const body = res.json.mock.calls[0][0];
      expect(body.traceId).toBe('err-trace-456');
    });

    it('should include details when provided', () => {
      const res = mockResponse();
      const details = [{ field: 'email', message: 'Invalid email' }];

      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);

      const body = res.json.mock.calls[0][0];
      expect(body.error.details).toEqual(details);
    });

    it('should omit details when not provided', () => {
      const res = mockResponse();

      sendError(res, 404, 'NOT_FOUND', 'Resource not found');

      const body = res.json.mock.calls[0][0];
      expect(body.error.details).toBeUndefined();
    });
  });
});
