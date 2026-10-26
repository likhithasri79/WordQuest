import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createGuestPlayer } from '../../src/modules/players/playerService.js';
import {
  createMatch,
  submitWord,
  reconcileOverdueStudyMatches,
} from '../../src/modules/matches/matchService.js';
import { db } from '../../src/db/index.js';
import { matches } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('Phase 6: Persistence, Active Match Recovery & Sweeper', () => {
  const app = createApp();

  it('GET /api/matches/active returns active match for player', async () => {
    const { player: p1, recoveryToken: t1 } = await createGuestPlayer('RecoveryPlayerA');
    const { player: p2 } = await createGuestPlayer('RecoveryPlayerB');

    // Initially has no active match
    const initialRes = await request(app)
      .get('/api/matches/active')
      .set('Authorization', `Bearer ${t1}`);

    expect(initialRes.status).toBe(200);
    expect(initialRes.body.activeMatch).toBeNull();

    // Create match
    const match = await createMatch(p1.id, p2.id);

    // Active match is now recovered
    const activeRes = await request(app)
      .get('/api/matches/active')
      .set('Authorization', `Bearer ${t1}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.activeMatch).not.toBeNull();
    expect(activeRes.body.activeMatch.matchId).toBe(match.id);
    expect(activeRes.body.activeMatch.status).toBe('AWAITING_SUBMISSIONS');
    expect(activeRes.body.activeMatch.currentRound).toBe(1);
    expect(activeRes.body.activeMatch.opponent.id).toBe(p2.id);
  });

  it('Passive check automatically advances overdue study matches upon request', async () => {
    const { player: p1, recoveryToken: t1 } = await createGuestPlayer('StudyP1');
    const { player: p2 } = await createGuestPlayer('StudyP2');

    const match = await createMatch(p1.id, p2.id);

    // Cause a mismatch in round 1
    await submitWord({ matchId: match.id, playerId: p1.id, roundNumber: 1, word: 'Apple' });
    await submitWord({ matchId: match.id, playerId: p2.id, roundNumber: 1, word: 'Orange' });

    // Force study_ends_at to the past in database
    const pastDeadline = new Date(Date.now() - 60000); // 1 minute ago
    await db
      .update(matches)
      .set({ studyEndsAt: pastDeadline })
      .where(eq(matches.id, match.id));

    // Player connects and calls /api/matches/active
    const res = await request(app)
      .get('/api/matches/active')
      .set('Authorization', `Bearer ${t1}`);

    expect(res.status).toBe(200);
    // Verified passive transition from STUDYING to AWAITING_SUBMISSIONS
    expect(res.body.activeMatch.status).toBe('AWAITING_SUBMISSIONS');
    expect(res.body.activeMatch.currentRound).toBe(2);
    expect(res.body.activeMatch.studyEndsAt).toBeNull();
  });

  it('Active background reconciler transitions overdue study matches', async () => {
    const { player: p1 } = await createGuestPlayer('SweeperP1');
    const { player: p2 } = await createGuestPlayer('SweeperP2');

    const match = await createMatch(p1.id, p2.id);

    // Cause mismatch
    await submitWord({ matchId: match.id, playerId: p1.id, roundNumber: 1, word: 'Fire' });
    await submitWord({ matchId: match.id, playerId: p2.id, roundNumber: 1, word: 'Water' });

    // Set deadline to past
    const pastDeadline = new Date(Date.now() - 30000);
    await db
      .update(matches)
      .set({ studyEndsAt: pastDeadline })
      .where(eq(matches.id, match.id));

    let notifiedMatchId = '';
    let notifiedRound = 0;

    const recoveredCount = await reconcileOverdueStudyMatches((id, round) => {
      notifiedMatchId = id;
      notifiedRound = round;
    });

    expect(recoveredCount).toBeGreaterThanOrEqual(1);
    expect(notifiedMatchId).toBe(match.id);
    expect(notifiedRound).toBe(2);

    // Running sweeper again finds 0 overdue matches (idempotent & exact-once)
    const secondRun = await reconcileOverdueStudyMatches();
    expect(secondRun).toBe(0);
  });
});
