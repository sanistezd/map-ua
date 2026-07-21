import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { NonProductionGuard } from './non-production.guard';

function createConfig(nodeEnv?: string): ConfigService {
  return {
    get: vi.fn().mockReturnValue(nodeEnv),
  } as unknown as ConfigService;
}

describe('NonProductionGuard', () => {
  it('blocks the route in production', () => {
    const guard = new NonProductionGuard(createConfig('production'));
    expect(() => guard.canActivate()).toThrow(NotFoundException);
  });

  it('allows the route in development', () => {
    const guard = new NonProductionGuard(createConfig('development'));
    expect(guard.canActivate()).toBe(true);
  });

  it('allows the route in test', () => {
    const guard = new NonProductionGuard(createConfig('test'));
    expect(guard.canActivate()).toBe(true);
  });

  it('allows the route when NODE_ENV is unset', () => {
    const guard = new NonProductionGuard(createConfig(undefined));
    expect(guard.canActivate()).toBe(true);
  });
});
