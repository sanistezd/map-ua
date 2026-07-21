import { describe, expect, it } from 'vitest';

import type { Database } from '@/database/database.types';

import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import { DrizzleUsersRepository } from './drizzle-users.repository';

function createDb(returning: () => Promise<unknown>): Database {
  return {
    insert: () => ({
      values: () => ({
        returning,
      }),
    }),
  } as unknown as Database;
}

function createDbForDelete(returning: () => Promise<unknown>): Database {
  return {
    delete: () => ({
      where: () => ({
        returning,
      }),
    }),
  } as unknown as Database;
}

describe('DrizzleUsersRepository', () => {
  it('creates a user', async () => {
    const user = { id: '1', email: 'a@b.com', createdAt: new Date() };
    const repo = new DrizzleUsersRepository(
      createDb(() => Promise.resolve([user])),
    );

    await expect(repo.create('a@b.com')).resolves.toEqual(user);
  });

  it('throws when the insert returns no row', async () => {
    const repo = new DrizzleUsersRepository(
      createDb(() => Promise.resolve([])),
    );

    await expect(repo.create('a@b.com')).rejects.toThrow(
      'Failed to create user',
    );
  });

  it('maps a Postgres unique violation wrapped by Drizzle to UserEmailTakenError', async () => {
    // Mirrors what Drizzle actually throws: a DrizzleQueryError wrapping the
    // real PostgresError as `.cause` — `.code` is not on the top-level error.
    const postgresError = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      { code: '23505' },
    );
    const drizzleError = Object.assign(new Error('Failed query'), {
      cause: postgresError,
    });
    const repo = new DrizzleUsersRepository(
      createDb(() => Promise.reject(drizzleError)),
    );

    await expect(repo.create('a@b.com')).rejects.toBeInstanceOf(
      UserEmailTakenError,
    );
  });

  it('maps a raw, unwrapped unique-violation error too', async () => {
    const rawError = Object.assign(new Error('duplicate key'), {
      code: '23505',
    });
    const repo = new DrizzleUsersRepository(
      createDb(() => Promise.reject(rawError)),
    );

    await expect(repo.create('a@b.com')).rejects.toBeInstanceOf(
      UserEmailTakenError,
    );
  });

  it('rethrows unrelated errors unchanged', async () => {
    const otherError = new Error('connection refused');
    const repo = new DrizzleUsersRepository(
      createDb(() => Promise.reject(otherError)),
    );

    await expect(repo.create('a@b.com')).rejects.toBe(otherError);
  });

  it('deletes a user', async () => {
    const repo = new DrizzleUsersRepository(
      createDbForDelete(() => Promise.resolve([{ id: '1' }])),
    );

    await expect(repo.delete('1')).resolves.toBeUndefined();
  });

  it('throws UserNotFoundError when no row was deleted', async () => {
    const repo = new DrizzleUsersRepository(
      createDbForDelete(() => Promise.resolve([])),
    );

    await expect(repo.delete('missing')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
