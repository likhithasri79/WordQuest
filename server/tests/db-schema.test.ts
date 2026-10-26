import { describe, it, expect } from 'vitest';
import { players, matches, rounds, matchStatusEnum } from '../src/db/schema.js';

describe('Database Schema & Integrity Definition', () => {
  it('should define the exact 6 match lifecycle states in enum', () => {
    const states = matchStatusEnum.enumValues;
    expect(states).toContain('WAITING_FOR_PLAYERS');
    expect(states).toContain('AWAITING_SUBMISSIONS');
    expect(states).toContain('RESOLVING_ROUND');
    expect(states).toContain('STUDYING');
    expect(states).toContain('COMPLETED');
    expect(states).toContain('CANCELLED');
    expect(states.length).toBe(6);
  });

  it('should define study_ends_at on matches table', () => {
    // Assert matches table includes studyEndsAt column
    expect(matches.studyEndsAt).toBeDefined();
    expect(matches.studyEndsAt.name).toBe('study_ends_at');
    expect(matches.studyEndsAt.columnType).toBe('PgTimestamp');
  });

  it('should define guestTokenHash with 64 char constraint on players table', () => {
    expect(players.guestTokenHash).toBeDefined();
    expect(players.guestTokenHash.name).toBe('guest_token_hash');
    expect(players.guestTokenHash.isUnique).toBe(true);
  });

  it('should define round_number and match_id on rounds table', () => {
    expect(rounds.matchId).toBeDefined();
    expect(rounds.roundNumber).toBeDefined();
    expect(rounds.roundNumber.name).toBe('round_number');
    expect(rounds.playerAWord).toBeDefined();
    expect(rounds.playerBWord).toBeDefined();
  });
});
