import { describe, expect, it, vi } from 'vitest';

import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import type { UsersRepository } from '../domain/users.repository';
import type { WelcomeEmailPort } from '../domain/welcome-email.port';
import { UsersService } from './users.service';

function createWelcomeEmail(): WelcomeEmailPort {
  return {
    enqueue: vi.fn().mockResolvedValue(undefined),
  };
}

describe('UsersService', () => {
  it('returns the domain user and enqueues a welcome email', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const repository: UsersRepository = {
      create: vi
        .fn()
        .mockResolvedValue({ id: '1', email: 'a@b.com', createdAt }),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const welcomeEmail = createWelcomeEmail();
    await expect(
      new UsersService(repository, welcomeEmail).create('a@b.com'),
    ).resolves.toEqual({
      id: '1',
      email: 'a@b.com',
      createdAt,
    });
    expect(welcomeEmail.enqueue).toHaveBeenCalledExactlyOnceWith('a@b.com');
  });

  it('propagates domain errors without enqueueing an email', async () => {
    const repository: UsersRepository = {
      create: vi.fn().mockRejectedValue(new UserEmailTakenError()),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const welcomeEmail = createWelcomeEmail();
    await expect(
      new UsersService(repository, welcomeEmail).create('a@b.com'),
    ).rejects.toBeInstanceOf(UserEmailTakenError);
    expect(welcomeEmail.enqueue).not.toHaveBeenCalled();
  });

  it('deletes a user by delegating to the repository', async () => {
    const repository: UsersRepository = {
      create: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const service = new UsersService(repository, createWelcomeEmail());

    await expect(service.delete('1')).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledExactlyOnceWith('1');
  });

  it('propagates a missing-user domain error', async () => {
    const repository: UsersRepository = {
      create: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockRejectedValue(new UserNotFoundError()),
    };
    const service = new UsersService(repository, createWelcomeEmail());

    await expect(service.delete('missing')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
