import { describe, expect, it } from 'vitest';

import { DisabledAuthVerifier } from './disabled-auth.verifier';

describe('DisabledAuthVerifier', () => {
  it('never authenticates any token', async () => {
    const verifier = new DisabledAuthVerifier();

    await expect(verifier.verifyBearerToken('any-token')).resolves.toBeNull();
    await expect(verifier.verifyBearerToken('')).resolves.toBeNull();
  });
});
