import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

/* ── Auth.js core tables ──────────────────────────────────────────────────
 * Shapes are dictated by @auth/drizzle-adapter; do not rename columns.
 */

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

/* ── Vocabulary progress ──────────────────────────────────────────────────
 * Port of the Supabase users_progress table. One row per user.
 */

export const usersProgress = pgTable('users_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  masteredIds: integer('mastered_ids').array().notNull().default([]),
  reviewIds: integer('review_ids').array().notNull().default([]),
  sessionScore: integer('session_score').notNull().default(0),
  lives: integer('lives').notNull().default(5),
  totalSeen: integer('total_seen').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ── Practice sync ───────────────────────────────────────────────────────
 * Questions and lessons live in the repo (content/), not here. The database
 * keeps only what a learner produces, so progress follows them across devices.
 *
 * `attempt_log` is append-only and keyed (user, question, timestamp) so a
 * device can push the same batch twice without duplicating rows.
 */

export const attemptLog = pgTable(
  'attempt_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    qid: text('qid').notNull(),
    lessonId: text('lesson_id').notNull(),
    type: text('type').notNull(),
    difficulty: smallint('difficulty').notNull(),
    correct: boolean('correct').notNull(),
    ms: integer('ms').notNull(),
    mode: text('mode').notNull(),
    ts: timestamp('ts', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('attempt_log_user_q_ts').on(t.userId, t.qid, t.ts),
    index('attempt_log_user_ts').on(t.userId, t.ts),
  ]
);

/** Small per-user preferences and results: exam date, error reasons, mock scores. */
export const userState = pgTable('user_state', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  state: jsonb('state').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
