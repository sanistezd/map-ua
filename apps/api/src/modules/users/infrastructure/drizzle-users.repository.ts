import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DATABASE } from '@/database/database.constants';
import type { Database } from '@/database/database.types';

import type { User } from '../domain/user';
import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import type { UsersRepository } from '../domain/users.repository';
import { users } from './persistence/users.schema';

const POSTGRES_UNIQUE_VIOLATION = '23505';

/**
 * Drizzle wraps the driver's PostgresError in its own DrizzleQueryError —
 * the real `.code` lives on `.cause`, not on the error Drizzle throws.
 * Walk the cause chain instead of assuming a fixed wrapping depth, since
 * that depth is an implementation detail that can change between versions.
 */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (
    let depth = 0;
    current !== null && current !== undefined && depth < 5;
    depth += 1
  ) {
    if (
      typeof current === 'object' &&
      'code' in current &&
      (current as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION
    ) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

@Injectable()
export class DrizzleUsersRepository implements UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(email: string): Promise<User> {
    try {
      const [user] = await this.db.insert(users).values({ email }).returning();
      if (!user) {
        throw new Error('Failed to create user');
      }
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserEmailTakenError();
      }
      throw error;
    }
  }

  findAll(): Promise<User[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (deleted.length === 0) {
      throw new UserNotFoundError();
    }
  }
}
