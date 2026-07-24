import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';

import { UsersService } from '@/modules/users/application/users.service';

import type { AuthUser } from '../auth-user';

@Injectable()
export class ProfileUpsertInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    if (request.user) {
      await this.usersService.upsertFromAuth(
        request.user.id,
        request.user.email,
        request.user.isAnonymous,
      );
    }

    return next.handle();
  }
}
