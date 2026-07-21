import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from './auth-user';

/**
 * Extracted as a standalone function (rather than inlined in
 * createParamDecorator) so it can be unit tested directly — Nest's custom
 * param decorators can't be invoked outside a real request pipeline.
 */
export function getCurrentUser(
  _data: unknown,
  context: ExecutionContext,
): AuthUser {
  const request = context
    .switchToHttp()
    .getRequest<Request & { user: AuthUser }>();
  return request.user;
}

export const CurrentUser = createParamDecorator(getCurrentUser);
