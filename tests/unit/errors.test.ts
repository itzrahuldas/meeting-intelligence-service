// ---------------------------------------------------------------------------
// tests/unit/errors.test.ts — Custom error class unit tests
// ---------------------------------------------------------------------------

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '../../src/utils/errors';

describe('Custom Error Classes', () => {
  // ── AppError ────────────────────────────────────────────────────────────

  describe('AppError', () => {
    it('should create an error with the correct statusCode, code, and message', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Something broke');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Something broke');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should allow marking errors as non-operational', () => {
      const error = new AppError(500, 'CRASH', 'Fatal', false);
      expect(error.isOperational).toBe(false);
    });

    it('should be serialisable to a plain object', () => {
      const error = new AppError(422, 'UNPROCESSABLE', 'Test');
      const plain = {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      };

      expect(plain).toEqual({
        message: 'Test',
        statusCode: 422,
        code: 'UNPROCESSABLE',
      });
    });

    it('should capture a stack trace', () => {
      const error = new AppError(500, 'ERR', 'Stack test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });

  // ── ValidationError ─────────────────────────────────────────────────────

  describe('ValidationError', () => {
    it('should have statusCode 400 and code VALIDATION_ERROR', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
    });
  });

  // ── AuthenticationError ─────────────────────────────────────────────────

  describe('AuthenticationError', () => {
    it('should have statusCode 401 and code AUTHENTICATION_ERROR', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.message).toBe('Invalid token');
    });

    it('should default to a sensible message when none is supplied', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });
  });

  // ── AuthorizationError ──────────────────────────────────────────────────

  describe('AuthorizationError', () => {
    it('should have statusCode 403 and code AUTHORIZATION_ERROR', () => {
      const error = new AuthorizationError('Insufficient permissions');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  // ── NotFoundError ───────────────────────────────────────────────────────

  describe('NotFoundError', () => {
    it('should have statusCode 404 and code NOT_FOUND', () => {
      const error = new NotFoundError('Meeting');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Meeting not found');
    });

    it('should format the resource name into the message', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User not found');
    });
  });

  // ── ConflictError ───────────────────────────────────────────────────────

  describe('ConflictError', () => {
    it('should have statusCode 409 and code CONFLICT', () => {
      const error = new ConflictError('Email already registered');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Email already registered');
    });
  });

  // ── InternalError ──────────────────────────────────────────────────────

  describe('InternalError', () => {
    it('should have statusCode 500, code INTERNAL_ERROR, and be non-operational', () => {
      const error = new InternalError();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });

  // ── Inheritance chain ───────────────────────────────────────────────────

  describe('Inheritance', () => {
    it('all custom errors should be instances of both Error and AppError', () => {
      const errors = [
        new ValidationError('v'),
        new AuthenticationError('a'),
        new AuthorizationError('z'),
        new NotFoundError('n'),
        new ConflictError('c'),
        new InternalError('i'),
      ];

      errors.forEach((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(AppError);
      });
    });
  });
});
