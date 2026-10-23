import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import type { UserRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { UserRecord } from './domain/user';

const now = new Date('2026-01-01T00:00:00.000Z');

const baseUser: UserRecord = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Demo User',
  email: 'demo@example.com',
  passwordHash: 'hash',
  createdAt: now,
  updatedAt: now,
};

function createRepository(): jest.Mocked<UserRepository> {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
}

function createService(
  users: jest.Mocked<UserRepository>,
  signAsync = jest.fn().mockResolvedValue('signed-token'),
): AuthService {
  const jwt = { signAsync } as unknown as JwtService;
  return new AuthService(users, jwt);
}

describe('AuthService', () => {
  it('registers a user with a hashed password and returns a token', async () => {
    const users = createRepository();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockImplementation(async (data) => ({
      ...baseUser,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
    }));

    const service = createService(users);
    const result = await service.register({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('demo@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');

    const created = users.create.mock.calls[0]![0];
    expect(created.passwordHash).not.toBe('password123');
    await expect(
      argon2.verify(created.passwordHash, 'password123'),
    ).resolves.toBe(true);
  });

  it('rejects a duplicate email', async () => {
    const users = createRepository();
    users.findByEmail.mockResolvedValue(baseUser);

    const service = createService(users);

    await expect(
      service.register({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects login with an invalid password', async () => {
    const users = createRepository();
    users.findByEmail.mockResolvedValue({
      ...baseUser,
      passwordHash: await argon2.hash('correct-password', {
        type: argon2.argon2id,
      }),
    });

    const service = createService(users);

    await expect(
      service.login({
        email: 'demo@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user by id', async () => {
    const users = createRepository();
    users.findById.mockResolvedValue(baseUser);

    const service = createService(users);
    const user = await service.me(baseUser.id);

    expect(user).toEqual({
      id: baseUser.id,
      name: baseUser.name,
      email: baseUser.email,
      createdAt: baseUser.createdAt.toISOString(),
    });
  });

  it('rejects me when the user no longer exists', async () => {
    const users = createRepository();
    users.findById.mockResolvedValue(null);

    const service = createService(users);

    await expect(service.me(baseUser.id)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
