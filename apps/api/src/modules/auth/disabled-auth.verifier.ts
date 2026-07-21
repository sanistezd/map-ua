import { Injectable } from '@nestjs/common';

import type { AuthUser } from './auth-user';
import type { AuthVerifier } from './auth-verifier';

/** Secure default used until an application chooses and configures an auth adapter. */
@Injectable()
export class DisabledAuthVerifier implements AuthVerifier {
  verifyBearerToken(_token: string): Promise<AuthUser | null> {
    return Promise.resolve(null);
  }
}
