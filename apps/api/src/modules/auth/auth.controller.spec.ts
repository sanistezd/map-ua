import { describe, expect, it } from 'vitest';

import { AuthController } from './auth.controller';
import type { AuthUser } from './auth-user';

describe('AuthController', () => {
  it('returns the authenticated user attached by the guard', () => {
    const controller = new AuthController();
    const user: AuthUser = { id: '1', email: 'a@b.com', isAnonymous: false };

    expect(controller.me(user)).toBe(user);
  });
});
