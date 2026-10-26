import { createMatch } from '../matches/matchService.js';
import { Match } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';

export interface QueuedPlayer {
  playerId: string;
  socketId: string;
  nickname: string;
  avatarId: string;
  queuedAt: number;
}

export interface MatchPairResult {
  match: Match;
  playerA: QueuedPlayer;
  playerB: QueuedPlayer;
}

class MatchmakingQueue {
  private queue: QueuedPlayer[] = [];
  private isProcessing = false;

  public enqueue(player: QueuedPlayer): boolean {
    // Avoid duplicate queue entries for the same player
    const existingIndex = this.queue.findIndex((p) => p.playerId === player.playerId);
    if (existingIndex !== -1) {
      // Update socket ID if reconnected
      this.queue[existingIndex].socketId = player.socketId;
      return false;
    }

    this.queue.push(player);
    logger.info('Player joined matchmaking queue', {
      playerId: player.playerId,
      queueSize: this.queue.length,
    });
    return true;
  }

  public dequeue(playerId: string): boolean {
    const index = this.queue.findIndex((p) => p.playerId === playerId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      logger.info('Player left matchmaking queue', {
        playerId,
        remainingQueueSize: this.queue.length,
      });
      return true;
    }
    return false;
  }

  public dequeueBySocketId(socketId: string): boolean {
    const index = this.queue.findIndex((p) => p.socketId === socketId);
    if (index !== -1) {
      const removed = this.queue.splice(index, 1)[0];
      logger.info('Socket disconnected, removed from queue', {
        playerId: removed.playerId,
        socketId,
      });
      return true;
    }
    return false;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Attempts to pair the top two waiting players in the queue.
   */
  public async tryPairPlayers(): Promise<MatchPairResult | null> {
    if (this.isProcessing || this.queue.length < 2) {
      return null;
    }

    this.isProcessing = true;

    try {
      if (this.queue.length < 2) return null;

      const playerA = this.queue.shift()!;
      let playerBIndex = this.queue.findIndex((p) => p.playerId !== playerA.playerId);

      if (playerBIndex === -1) {
        // Only self-clones in queue, put playerA back
        this.queue.unshift(playerA);
        return null;
      }

      const playerB = this.queue.splice(playerBIndex, 1)[0];

      // Create persisted match in PostgreSQL
      const match = await createMatch(playerA.playerId, playerB.playerId);

      logger.info('Match successfully created', {
        matchId: match.id,
        playerA: playerA.playerId,
        playerB: playerB.playerId,
      });

      return { match, playerA, playerB };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to create match during matchmaking', { error: message });
      return null;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const matchmakingQueue = new MatchmakingQueue();
