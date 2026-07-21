import type { AuthUser } from './auth-user';

/** Implement this port in an auth adapter and pass it to AuthModule.register(). */
export interface AuthVerifier {
  verifyBearerToken(token: string): Promise<AuthUser | null>;
}
