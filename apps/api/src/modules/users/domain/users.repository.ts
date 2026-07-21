import type { User } from './user';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  create(email: string): Promise<User>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
