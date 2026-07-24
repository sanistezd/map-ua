import type { User } from './user';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  create(email: string): Promise<User>;
  upsertFromAuth(
    id: string,
    email: string | null,
    isAnonymous: boolean,
  ): Promise<User>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
