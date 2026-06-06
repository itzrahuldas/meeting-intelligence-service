// ---------------------------------------------------------------------------
// tests/unit/auth.test.ts — Auth service unit tests
// ---------------------------------------------------------------------------

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../setup';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Import AFTER mocks are set up
import { authService } from '../../src/modules/auth/auth.service';
import { ConflictError, AuthenticationError } from '../../src/utils/errors';

// ── Test data ───────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-1',
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  password: '$2a$10$hashedpasswordvalue',
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
};

const registerInput = {
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  password: 'SecurePass123!',
};

const loginInput = {
  email: 'rahul@example.com',
  password: 'SecurePass123!',
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────────────────────

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$hashedpasswordvalue');
      prismaMock.user.create.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
      });
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.register(registerInput);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerInput.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerInput.password, expect.any(Number));
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).toBeDefined();
    });

    it('should throw ConflictError when email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.register(registerInput)).rejects.toThrow(ConflictError);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhashedvalue');
      prismaMock.user.create.mockResolvedValue({ ...mockUser, password: '$2a$10$newhashedvalue' });
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await authService.register(registerInput);

      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', expect.any(Number));
    });
  });

  // ── login ─────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('login-jwt-token');

      const result = await authService.login(loginInput);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginInput.password, mockUser.password);
      expect(result).toHaveProperty('token', 'login-jwt-token');
    });

    it('should throw AuthenticationError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow(AuthenticationError);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginInput)).rejects.toThrow(AuthenticationError);
    });

    it('should not return the password in the login response', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      const result = await authService.login(loginInput);

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
