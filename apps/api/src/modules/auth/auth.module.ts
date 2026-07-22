import type { DynamicModule, Provider, Type } from '@nestjs/common';
import { Module } from '@nestjs/common';

import { AUTH_VERIFIER } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import type { AuthVerifier } from './auth-verifier';
import { SupabaseAuthVerifier } from './supabase-auth.verifier';

export interface AuthModuleOptions {
  verifier?: Type<AuthVerifier>;
}

@Module({})
export class AuthModule {
  static register(options: AuthModuleOptions = {}): DynamicModule {
    const verifierProvider: Provider = {
      provide: AUTH_VERIFIER,
      useClass: options.verifier ?? SupabaseAuthVerifier,
    };

    return {
      global: true,
      module: AuthModule,
      controllers: [AuthController],
      providers: [verifierProvider, AuthGuard],
      exports: [AUTH_VERIFIER, AuthGuard],
    };
  }
}
