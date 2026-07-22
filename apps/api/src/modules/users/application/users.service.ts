import type { User } from '../domain/user';
import type { UsersRepository } from '../domain/users.repository';
import type { WelcomeEmailPort } from '../domain/welcome-email.port';

export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly welcomeEmail: WelcomeEmailPort,
  ) {}

  async create(email: string): Promise<User> {
    const user = await this.users.create(email);
    if (user.email) {
      await this.welcomeEmail.enqueue(user.email);
    }
    return user;
  }

  async upsertFromAuth(id: string, email: string | null, isAnonymous: boolean): Promise<User> {
    return this.users.upsertFromAuth(id, email, isAnonymous);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return this.users.update(id, data);
  }

  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  delete(id: string): Promise<void> {
    return this.users.delete(id);
  }
}
