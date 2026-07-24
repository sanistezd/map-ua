import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import type { StorageService } from '../../storage/storage.service';
import type { UsersService } from '../application/users.service';
import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import { UsersController } from './users.controller';

function createUsers(): UsersService {
  return {
    findAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  } as unknown as UsersService;
}

function createConfig(): ConfigService {
  return { get: vi.fn() } as unknown as ConfigService;
}

function createStorage(): StorageService {
  return {
    isConfigured: vi.fn().mockReturnValue(false),
  } as unknown as StorageService;
}
describe('UsersController', () => {
  it('delegates findAll to the service', async () => {
    const users = createUsers();
    (users.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: '1',
        email: 'a@b.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const controller = new UsersController(
      users,
      createConfig(),
      createStorage(),
    );

    await expect(controller.findAll()).resolves.toEqual([
      {
        id: '1',
        email: 'a@b.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(users.findAll).toHaveBeenCalledOnce();
  });

  it('delegates create to the service with the request email', async () => {
    const users = createUsers();
    const created = {
      id: '1',
      email: 'a@b.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    (users.create as ReturnType<typeof vi.fn>).mockResolvedValue(created);
    const controller = new UsersController(
      users,
      createConfig(),
      createStorage(),
    );

    await expect(controller.create({ email: 'a@b.com' })).resolves.toEqual({
      ...created,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(users.create).toHaveBeenCalledExactlyOnceWith('a@b.com');
  });

  it('maps duplicate-email domain errors to HTTP conflicts', async () => {
    const users = createUsers();
    (users.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new UserEmailTakenError(),
    );

    await expect(
      new UsersController(users, createConfig(), createStorage()).create({
        email: 'a@b.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('delegates remove to the service with the route param id', async () => {
    const users = createUsers();
    (users.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const controller = new UsersController(
      users,
      createConfig(),
      createStorage(),
    );

    await expect(controller.remove('user-1')).resolves.toBeUndefined();
    expect(users.delete).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it('maps missing-user domain errors to HTTP not-found responses', async () => {
    const users = createUsers();
    (users.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
      new UserNotFoundError(),
    );

    await expect(
      new UsersController(users, createConfig(), createStorage()).remove(
        'missing',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
