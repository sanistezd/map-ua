import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type { Request } from 'express';

import { AUTH_VERIFIER } from './auth.constants';
import type { AuthUser } from './auth-user';
import type { AuthVerifier } from './auth-verifier';
import { IS_PUBLIC_KEY } from './public.decorator';
import { REQUIRE_FULL_ACCOUNT_KEY } from './require-full-account.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_VERIFIER) private readonly verifier: AuthVerifier,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    const user = token ? await this.verifier.verifyBearerToken(token) : null;

    if (!user) {
      throw new UnauthorizedException({ code: API_ERROR_CODES.unauthorized });
    }

    const requireFullAccount = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_FULL_ACCOUNT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireFullAccount && user.isAnonymous) {
      throw new ForbiddenException({ code: API_ERROR_CODES.forbidden });
    }

    request.user = user;
    return true;
  }
}
