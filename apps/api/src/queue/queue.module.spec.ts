import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { createBullRootOptions } from './queue.module';

const { RedisMock } = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;

  const RedisMock = vi.fn().mockImplementation(function (
    this: {
      url: string;
      options: unknown;
      listeners: Record<string, Handler[]>;
      on: ReturnType<typeof vi.fn>;
      emit: (event: string, ...args: unknown[]) => void;
    },
    url: string,
    options: unknown,
  ) {
    this.url = url;
    this.options = options;
    this.listeners = {};
    this.on = vi.fn((event: string, handler: Handler) => {
      (this.listeners[event] ??= []).push(handler);
    });
    this.emit = (event: string, ...args: unknown[]) => {
      for (const handler of this.listeners[event] ?? []) {
        handler(...args);
      }
    };
  });

  return { RedisMock };
});

vi.mock('ioredis', () => ({ default: RedisMock }));

function createConfig(redisUrl: string): ConfigService {
  return {
    getOrThrow: vi.fn().mockReturnValue(redisUrl),
  } as unknown as ConfigService;
}

describe('createBullRootOptions', () => {
  it('connects to REDIS_URL with maxRetriesPerRequest disabled, as BullMQ requires', () => {
    const config = createConfig('redis://localhost:6379');

    const options = createBullRootOptions(config);

    expect(RedisMock).toHaveBeenCalledExactlyOnceWith(
      'redis://localhost:6379',
      { maxRetriesPerRequest: null },
    );
    expect(options.connection).toBeDefined();
  });

  it('logs a warning instead of throwing when the Redis connection errors', () => {
    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const config = createConfig('redis://localhost:6379');

    const options = createBullRootOptions(config);
    const connection = options.connection as unknown as {
      emit: (event: string, ...args: unknown[]) => void;
    };

    expect(() =>
      connection.emit('error', new Error('ECONNREFUSED')),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('ECONNREFUSED'),
    );
  });
});
