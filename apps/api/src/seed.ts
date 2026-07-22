import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { schema } from '@root/db';
const users = schema.profiles;

config({ path: '../../env/api.local.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const database = drizzle(sql);

async function seed() {
  await database
    .insert(users)
    .values({ id: '00000000-0000-0000-0000-000000000000', email: 'starter@example.com' })
    .onConflictDoNothing();
  await sql.end();
}

void seed();
