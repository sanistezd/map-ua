import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/** Database model owned exclusively by the users module. */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
