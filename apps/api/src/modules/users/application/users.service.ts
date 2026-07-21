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
    await this.welcomeEmail.enqueue(user.email);
    return user;
  }

  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  delete(id: string): Promise<void> {
    return this.users.delete(id);
  }
}
