import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AuthGuard } from './auth.guard';
import type { AuthUser } from './auth-user';
import type { AuthVerifier } from './auth-verifier';

function createContext(authorization?: string): {
  context: ExecutionContext;
  request: Request & { user?: AuthUser };
} {
  const request = { headers: { authorization } } as Request & {
    user?: AuthUser;
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: vi.fn(),
    getClass: vi.fn(),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AuthGuard', () => {
  let verifier: AuthVerifier;
  let reflector: Reflector;

  beforeEach(() => {
    verifier = { verifyBearerToken: vi.fn() };
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    } as unknown as Reflector;
  });

  it('rejects requests without an Authorization header', async () => {
    const { context } = createContext(undefined);
    const guard = new AuthGuard(verifier, reflector);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifier.verifyBearerToken).not.toHaveBeenCalled();
  });

  it('rejects a malformed Authorization header', async () => {
    const verifier: AuthVerifier = { verifyBearerToken: vi.fn() };
    const { context } = createContext('Basic somecreds');
    const guard = new AuthGuard(verifier);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifier.verifyBearerToken).not.toHaveBeenCalled();
  });

  it('rejects a bearer token the verifier does not recognize', async () => {
    const verifier: AuthVerifier = {
      verifyBearerToken: vi.fn().mockResolvedValue(null),
    };
    const { context } = createContext('Bearer bad-token');
    const guard = new AuthGuard(verifier);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifier.verifyBearerToken).toHaveBeenCalledExactlyOnceWith(
      'bad-token',
    );
  });

  it('attaches the verified user to the request and allows it through', async () => {
    const user: AuthUser = { id: '1', email: 'a@b.com' };
    const verifier: AuthVerifier = {
      verifyBearerToken: vi.fn().mockResolvedValue(user),
    };
    const { context, request } = createContext('Bearer good-token');
    const guard = new AuthGuard(verifier);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });
});
