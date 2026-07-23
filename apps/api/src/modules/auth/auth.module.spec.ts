import type { Provider } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { AUTH_VERIFIER } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthModule } from './auth.module';
import type { AuthUser } from './auth-user';
import type { AuthVerifier } from './auth-verifier';
import { SupabaseAuthVerifier } from './supabase-auth.verifier';

@Injectable()
class FakeVerifier implements AuthVerifier {
  verifyBearerToken(): Promise<AuthUser | null> {
    return Promise.resolve(null);
  }
}

function findVerifierProvider(providers: Provider[]) {
  return providers.find(
    (provider): provider is Provider & { provide: symbol; useClass: unknown } =>
      typeof provider === 'object' &&
      provider !== null &&
      'provide' in provider &&
      provider.provide === AUTH_VERIFIER,
  );
}

describe('AuthModule.register', () => {
  it('defaults to SupabaseAuthVerifier when no verifier is given', () => {
    const module = AuthModule.register();

    expect(module.controllers).toEqual([AuthController]);
    expect(module.exports).toEqual([AUTH_VERIFIER, AuthGuard]);
    const verifierProvider = findVerifierProvider(module.providers ?? []);
    expect(verifierProvider?.useClass).toBe(SupabaseAuthVerifier);
  });

  it('uses the provided verifier class when given one', () => {
    const module = AuthModule.register({ verifier: FakeVerifier });

    const verifierProvider = findVerifierProvider(module.providers ?? []);
    expect(verifierProvider?.useClass).toBe(FakeVerifier);
  });
});
