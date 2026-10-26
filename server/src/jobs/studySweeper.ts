import { Server as SocketIOServer } from 'socket.io';
import { reconcileOverdueStudyMatches } from '../modules/matches/matchService.js';
import { logger } from '../utils/logger.js';

let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the periodic background sweeper that reconciles expired study periods.
 * Uses atomic SKIP LOCKED queries so multiple server instances never double-resolve.
 */
export function startStudySweeper(io: SocketIOServer, intervalMs = 5000): void {
  if (intervalId) return;

  logger.info('Starting background study deadline sweeper...', { intervalMs });

  intervalId = setInterval(async () => {
    try {
      const recoveredCount = await reconcileOverdueStudyMatches((matchId, nextRound) => {
        const roomName = `match:${matchId}`;
        logger.info('Authoritative study deadline expired. Opening next round.', {
          matchId,
          nextRound,
        });

        io.to(roomName).emit('game:study_ended', {
          matchId,
          nextRoundNumber: nextRound,
        });
      });

      if (recoveredCount > 0) {
        logger.info(`Sweeper successfully transitioned ${recoveredCount} overdue study match(es).`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sweeper error';
      logger.error('Error during study deadline sweeper run', { error: message });
    }
  }, intervalMs);

  intervalId.unref(); // Allows process to exit cleanly without being held open by timer
}

/**
 * Stops the periodic sweeper during graceful shutdown.
 */
export function stopStudySweeper(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Background study deadline sweeper stopped.');
  }
}
