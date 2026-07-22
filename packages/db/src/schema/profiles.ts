import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const profiles = pgTable('users', {
  id: uuid('id').primaryKey(), // Supabase user id
  email: varchar('email', { length: 320 }).unique(),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
