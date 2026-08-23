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

/* ── Question bank ────────────────────────────────────────────────────────
 * Common fields are typed columns so they stay filterable and indexable;
 * per-type structure lives in `content`/`answer`, keyed off `type`.
 */

export const passages = pgTable('passages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  body: text('body').notNull(),
  wordCount: integer('word_count'),
  topic: text('topic'),
  difficulty: smallint('difficulty'),
  source: text('source'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const figures = pgTable('figures', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(), // bar | line | pie | table | scatter
  title: text('title'),
  data: jsonb('data').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // TC | SE | RC | QC | PS | NE | DI
    type: text('type').notNull(),
    section: text('section').notNull(), // verbal | quant
    topic: text('topic').notNull(),
    subtopic: text('subtopic'),
    difficulty: smallint('difficulty').notNull(),

    passageId: uuid('passage_id').references(() => passages.id, {
      onDelete: 'cascade',
    }),
    figureId: uuid('figure_id').references(() => figures.id, {
      onDelete: 'cascade',
    }),

    stem: text('stem').notNull(),
    content: jsonb('content').notNull(),
    answer: jsonb('answer').notNull(),
    explanation: text('explanation'),

    source: text('source'),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('questions_section_type_difficulty_idx').on(
      t.section,
      t.type,
      t.difficulty
    ),
    index('questions_topic_idx').on(t.topic),
  ]
);

/* ── Practice tracking ────────────────────────────────────────────────────
 * `attempts` is append-only: every pass at a question inserts a row, so
 * progress over time stays reconstructable. Current status is derived,
 * never overwritten.
 */

export const testSessions = pgTable('test_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(), // practice | quiz | full_test
  config: jsonb('config'),
  startedAt: timestamp('started_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  score: jsonb('score'),
});

export const attempts = pgTable(
  'attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => testSessions.id, {
      onDelete: 'set null',
    }),
    response: jsonb('response'),
    isCorrect: boolean('is_correct').notNull(),
    timeSpentMs: integer('time_spent_ms'),
    flagged: boolean('flagged').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('attempts_user_question_idx').on(t.userId, t.questionId),
    index('attempts_user_created_idx').on(t.userId, t.createdAt),
  ]
);
