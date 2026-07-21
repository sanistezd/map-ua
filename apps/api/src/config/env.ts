import { z } from 'zod';

/** A blank value for an optional .env key ("KEY=") must mean "not set", not an empty string to validate. */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  );

const booleanString = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Global rate limit (Nest ThrottlerGuard). Defaults: 100 requests / 60s.
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  // Email: optional. Resend is tried first, SMTP (Nodemailer) is the fallback.
  RESEND_API_KEY: optional(z.string()),
  EMAIL_FROM: optional(z.string().email()),
  EMAIL_HOST: optional(z.string()),
  EMAIL_PORT: optional(z.coerce.number().int().positive()),
  EMAIL_USER: optional(z.string()),
  EMAIL_PASS: optional(z.string()),
  EMAIL_SECURE: optional(booleanString),

  // Storage: optional AWS S3 (or S3-compatible, via AWS_S3_ENDPOINT).
  AWS_REGION: optional(z.string()),
  AWS_ACCESS_KEY_ID: optional(z.string()),
  AWS_SECRET_ACCESS_KEY: optional(z.string()),
  AWS_S3_BUCKET: optional(z.string()),
  AWS_S3_ENDPOINT: optional(z.string().url()),
});

export type Environment = z.infer<typeof schema>;
export const validateEnv = (config: Record<string, unknown>): Environment =>
  schema.parse(config);
