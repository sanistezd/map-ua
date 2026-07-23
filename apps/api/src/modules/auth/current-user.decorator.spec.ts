import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AuthUser } from './auth-user';
import { getCurrentUser } from './current-user.decorator';

function createContext(user: AuthUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('getCurrentUser', () => {
  it('extracts the user attached to the request by the auth guard', () => {
    const user: AuthUser = { id: '1', email: 'a@b.com', isAnonymous: false };
    const context = createContext(user);

    expect(getCurrentUser(undefined, context)).toBe(user);
  });
});
