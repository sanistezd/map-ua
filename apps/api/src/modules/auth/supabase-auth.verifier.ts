import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { Environment } from '@/config/env';

import type { AuthUser } from './auth-user';
import type { AuthVerifier } from './auth-verifier';

@Injectable()
export class SupabaseAuthVerifier implements AuthVerifier {
  private readonly logger = new Logger(SupabaseAuthVerifier.name);
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService<Environment, true>) {
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async verifyBearerToken(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.config.get('SUPABASE_URL', { infer: true }) + '/auth/v1',
      });

      return {
        id: payload.sub as string,
        email: (payload.email as string) || null,
        isAnonymous: payload.is_anonymous === true,
      };
    } catch (error) {
      this.logger.error(`JWT verification failed: ${(error as Error).message}`);
      return null;
    }
  }
}
