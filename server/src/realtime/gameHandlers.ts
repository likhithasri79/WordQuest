import { Server as SocketIOServer, Socket } from 'socket.io';
import { z } from 'zod';
import { authenticateByToken } from '../modules/players/playerService.js';
import { matchmakingQueue } from '../modules/matchmaking/matchmakingService.js';
import {
  submitWord,
  getSafeMatchView,
} from '../modules/matches/matchService.js';
import { logger } from '../utils/logger.js';
import { Player } from '../db/schema.js';

interface AuthenticatedSocket extends Socket {
  data: {
    player: Player;
  };
}

const submitPayloadSchema = z.object({
  matchId: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  word: z.string().trim().min(1).max(100),
});

const resumePayloadSchema = z.object({
  matchId: z.string().uuid(),
});

export function registerGameHandlers(io: SocketIOServer): void {
  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('UNAUTHORIZED'));
      }

      const player = await authenticateByToken(token);
      if (!player) {
        return next(new Error('UNAUTHORIZED'));
      }

      socket.data.player = player;
      next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auth error';
      next(new Error(`Authentication failed: ${message}`));
    }
  });

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const player = socket.data.player;

    logger.info('Authenticated player connected via Socket.IO', {
      socketId: socket.id,
      playerId: player.id,
      nickname: player.nickname,
    });

    // 1. Queue Join Event
    socket.on('queue:join', async () => {
      try {
        matchmakingQueue.enqueue({
          playerId: player.id,
          socketId: socket.id,
          nickname: player.nickname,
          avatarId: player.avatarId,
          queuedAt: Date.now(),
        });

        socket.emit('queue:status', {
          inQueue: true,
          queueSize: matchmakingQueue.getQueueSize(),
        });

        // Check if pairing is possible
        const paired = await matchmakingQueue.tryPairPlayers();
        if (paired) {
          const { match, playerA, playerB } = paired;
          const matchRoom = `match:${match.id}`;

          const socketA = io.sockets.sockets.get(playerA.socketId);
          const socketB = io.sockets.sockets.get(playerB.socketId);

          if (socketA) socketA.join(matchRoom);
          if (socketB) socketB.join(matchRoom);

          // Emit matched event with opponent info
          if (socketA) {
            socketA.emit('queue:matched', {
              matchId: match.id,
              opponent: {
                id: playerB.playerId,
                nickname: playerB.nickname,
                avatarId: playerB.avatarId,
              },
            });
            const stateA = await getSafeMatchView(match.id, playerA.playerId);
            socketA.emit('game:state', stateA);
          }

          if (socketB) {
            socketB.emit('queue:matched', {
              matchId: match.id,
              opponent: {
                id: playerA.playerId,
                nickname: playerA.nickname,
                avatarId: playerA.avatarId,
              },
            });
            const stateB = await getSafeMatchView(match.id, playerB.playerId);
            socketB.emit('game:state', stateB);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Matchmaking error';
        socket.emit('game:error', { code: 'QUEUE_ERROR', message });
      }
    });

    // 2. Queue Cancel Event
    socket.on('queue:cancel', () => {
      matchmakingQueue.dequeue(player.id);
      socket.emit('queue:status', { inQueue: false });
    });

    // 3. Word Submission Event (Private until resolution)
    socket.on('game:submit', async (payload: unknown, ack?: (res: unknown) => void) => {
      try {
        const parsed = submitPayloadSchema.safeParse(payload);
        if (!parsed.success) {
          const errRes = { code: 'INVALID_SUBMISSION', message: 'Invalid submission data' };
          socket.emit('game:error', errRes);
          if (ack) ack({ success: false, error: errRes });
          return;
        }

        const { matchId, roundNumber, word } = parsed.data;

        // Execute submission in transaction
        const response = await submitWord({
          matchId,
          playerId: player.id,
          roundNumber,
          word,
        });

        const matchRoom = `match:${matchId}`;

        if (!response.resolved) {
          // Zero Word Leakage: notify room that word was received, NEVER broadcast the word!
          io.to(matchRoom).emit('game:submission_received', {
            playerId: player.id,
            roundNumber,
          });

          if (ack) ack({ success: true, status: 'WAITING_FOR_OPPONENT' });
        } else {
          // Both submitted! Broadcast round resolution with both revealed words
          const res = response.result;

          io.to(matchRoom).emit('game:round_result', {
            matchId,
            roundNumber,
            isMatch: res.isMatch,
            wordA: res.wordA,
            wordB: res.wordB,
            nextStatus: res.nextStatus,
            mismatchCount: res.mismatchCount,
            studyEndsAt: res.studyEndsAt ? res.studyEndsAt.toISOString() : null,
            studyDurationMinutes: res.studyDurationMinutes,
          });

          if (!res.isMatch) {
            io.to(matchRoom).emit('game:study_started', {
              mismatchCount: res.mismatchCount,
              studyDurationMinutes: res.studyDurationMinutes,
              studyEndsAt: res.studyEndsAt ? res.studyEndsAt.toISOString() : null,
            });
          }

          if (ack) ack({ success: true, status: res.nextStatus });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Submission failed';
        const code = (err as { code?: string }).code || 'SUBMISSION_ERROR';
        socket.emit('game:error', { code, message });
        if (ack) ack({ success: false, error: { code, message } });
      }
    });

    // 4. Match Resume / State Sync Event
    socket.on('game:resume', async (payload: unknown) => {
      try {
        const parsed = resumePayloadSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit('game:error', { code: 'INVALID_PAYLOAD', message: 'Invalid match ID' });
          return;
        }

        const { matchId } = parsed.data;
        socket.join(`match:${matchId}`);

        const safeState = await getSafeMatchView(matchId, player.id);
        socket.emit('game:state', safeState);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to resume match';
        const code = (err as { code?: string }).code || 'RESUME_ERROR';
        socket.emit('game:error', { code, message });
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      matchmakingQueue.dequeueBySocketId(socket.id);
    });
  });
}
