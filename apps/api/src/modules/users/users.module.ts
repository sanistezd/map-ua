import { Module } from '@nestjs/common';

import { EmailModule } from '@/modules/email/email.module';
import { StorageModule } from '@/modules/storage/storage.module';

import { UsersService } from './application/users.service';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from './domain/users.repository';
import {
  WELCOME_EMAIL_PORT,
  type WelcomeEmailPort,
} from './domain/welcome-email.port';
import { DrizzleUsersRepository } from './infrastructure/drizzle-users.repository';
import { EmailQueueWelcomeEmailAdapter } from './infrastructure/email-queue-welcome-email.adapter';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [EmailModule, StorageModule],
  controllers: [UsersController],
  providers: [
    { provide: USERS_REPOSITORY, useClass: DrizzleUsersRepository },
    { provide: WELCOME_EMAIL_PORT, useClass: EmailQueueWelcomeEmailAdapter },
    {
      provide: UsersService,
      inject: [USERS_REPOSITORY, WELCOME_EMAIL_PORT],
      useFactory: (users: UsersRepository, welcomeEmail: WelcomeEmailPort) =>
        new UsersService(users, welcomeEmail),
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
