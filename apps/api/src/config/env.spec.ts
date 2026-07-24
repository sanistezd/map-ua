import { describe, expect, it } from 'vitest';

import { validateEnv } from './env';

const REQUIRED = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

describe('validateEnv', () => {
  it('applies defaults when only the required vars are set', () => {
    const env = validateEnv(REQUIRED);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.WEB_URL).toBe('http://localhost:3000');
    expect(env.REDIS_URL).toBe('redis://localhost:6379');
    expect(env.SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.SUPABASE_ANON_KEY).toBe('test-anon-key');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key');
    expect(env.THROTTLE_TTL_MS).toBe(60_000);
    expect(env.THROTTLE_LIMIT).toBe(100);
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.AWS_S3_ENDPOINT).toBeUndefined();
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow();
  });

  it('throws when DATABASE_URL is not a valid URL', () => {
    expect(() => validateEnv({ DATABASE_URL: 'not-a-url' })).toThrow();
  });

  it('throws on an invalid NODE_ENV value', () => {
    expect(() => validateEnv({ ...REQUIRED, NODE_ENV: 'staging' })).toThrow();
  });

  it('coerces PORT from a string', () => {
    const env = validateEnv({ ...REQUIRED, PORT: '5000' });
    expect(env.PORT).toBe(5000);
  });

  // Regression test: a present-but-empty value ("KEY=" with nothing after
  // "=") must mean "not set", not an empty string that fails its own
  // validator (e.g. .url()/.email()) and crashes the app on boot.
  it('treats an empty string as unset for optional vars', () => {
    const env = validateEnv({
      ...REQUIRED,
      AWS_S3_ENDPOINT: '',
      RESEND_API_KEY: '',
      EMAIL_FROM: '',
    });

    expect(env.AWS_S3_ENDPOINT).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.EMAIL_FROM).toBeUndefined();
  });

  it('validates and coerces provided optional vars', () => {
    const env = validateEnv({
      ...REQUIRED,
      EMAIL_PORT: '587',
      EMAIL_SECURE: 'true',
      EMAIL_FROM: 'noreply@example.com',
      AWS_S3_ENDPOINT: 'https://s3.example.com',
    });

    expect(env.EMAIL_PORT).toBe(587);
    expect(env.EMAIL_SECURE).toBe(true);
    expect(env.EMAIL_FROM).toBe('noreply@example.com');
    expect(env.AWS_S3_ENDPOINT).toBe('https://s3.example.com');
  });

  it('parses false boolean strings without JavaScript truthiness coercion', () => {
    const env = validateEnv({ ...REQUIRED, EMAIL_SECURE: 'false' });

    expect(env.EMAIL_SECURE).toBe(false);
  });

  it('coerces throttle settings from strings', () => {
    const env = validateEnv({
      ...REQUIRED,
      THROTTLE_TTL_MS: '10000',
      THROTTLE_LIMIT: '20',
    });

    expect(env.THROTTLE_TTL_MS).toBe(10_000);
    expect(env.THROTTLE_LIMIT).toBe(20);
  });

  it('throws when a non-empty optional value fails its own validator', () => {
    expect(() =>
      validateEnv({ ...REQUIRED, EMAIL_FROM: 'not-an-email' }),
    ).toThrow();
    expect(() =>
      validateEnv({ ...REQUIRED, AWS_S3_ENDPOINT: 'not-a-url' }),
    ).toThrow();
  });
});
