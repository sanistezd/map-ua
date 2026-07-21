import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type { Request } from 'express';

import { AUTH_VERIFIER } from './auth.constants';
import type { AuthUser } from './auth-user';
import type { AuthVerifier } from './auth-verifier';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AUTH_VERIFIER) private readonly verifier: AuthVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    const user = token ? await this.verifier.verifyBearerToken(token) : null;

    if (!user) {
      throw new UnauthorizedException({ code: API_ERROR_CODES.unauthorized });
    }

    request.user = user;
    return true;
  }
}
