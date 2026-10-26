import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Match Lifecycle States Enum
 */
export const matchStatusEnum = pgEnum('match_status', [
  'WAITING_FOR_PLAYERS',
  'AWAITING_SUBMISSIONS',
  'RESOLVING_ROUND',
  'STUDYING',
  'COMPLETED',
  'CANCELLED',
]);

/**
 * Players Table
 * - Secure guest token hash using SHA-256 (64 hex characters)
 * - Identifies guest player and links to matches
 */
export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guestTokenHash: varchar('guest_token_hash', { length: 64 }).notNull().unique(),
    nickname: varchar('nickname', { length: 50 }).notNull(),
    avatarId: varchar('avatar_id', { length: 50 }).notNull().default('avatar-01'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('players_last_seen_idx').on(table.lastSeenAt),
  ]
);

/**
 * Matches Table
 * - Unites two players in an ongoing game session
 * - study_ends_at is authoritative UTC deadline in PostgreSQL
 */
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerAId: uuid('player_a_id')
      .notNull()
      .references(() => players.id),
    playerBId: uuid('player_b_id')
      .notNull()
      .references(() => players.id),
    status: matchStatusEnum('status').notNull().default('AWAITING_SUBMISSIONS'),
    currentRound: integer('current_round').notNull().default(1),
    mismatchCount: integer('mismatch_count').notNull().default(0),
    studyEndsAt: timestamp('study_ends_at', { withTimezone: true }),
    winnerWord: varchar('winner_word', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('matches_status_idx').on(table.status),
    index('matches_player_a_idx').on(table.playerAId),
    index('matches_player_b_idx').on(table.playerBId),
    index('matches_study_ends_at_idx').on(table.studyEndsAt),
  ]
);

/**
 * Rounds Table
 * - Submissions for each round (1-indexed)
 * - Words remain null until submitted, and private until resolved
 * - UNIQUE(match_id, round_number) ensures exact-once round creation
 */
export const rounds = pgTable(
  'rounds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    playerAWord: varchar('player_a_word', { length: 100 }),
    playerBWord: varchar('player_b_word', { length: 100 }),
    playerASubmittedAt: timestamp('player_a_submitted_at', { withTimezone: true }),
    playerBSubmittedAt: timestamp('player_b_submitted_at', { withTimezone: true }),
    isMatch: boolean('is_match'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('rounds_match_round_idx').on(table.matchId, table.roundNumber),
    index('rounds_match_id_idx').on(table.matchId),
  ]
);

// Drizzle Relations
export const playersRelations = relations(players, ({ many }) => ({
  matchesAsA: many(matches, { relationName: 'playerA' }),
  matchesAsB: many(matches, { relationName: 'playerB' }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  playerA: one(players, {
    fields: [matches.playerAId],
    references: [players.id],
    relationName: 'playerA',
  }),
  playerB: one(players, {
    fields: [matches.playerBId],
    references: [players.id],
    relationName: 'playerB',
  }),
  rounds: many(rounds),
}));

export const roundsRelations = relations(rounds, ({ one }) => ({
  match: one(matches, {
    fields: [rounds.matchId],
    references: [matches.id],
  }),
}));

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Round = typeof rounds.$inferSelect;
export type NewRound = typeof rounds.$inferInsert;
export type MatchStatus = (typeof matchStatusEnum.enumValues)[number];
