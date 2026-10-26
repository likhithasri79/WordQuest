import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createGuestPlayer, authenticateByToken } from '../modules/players/playerService.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

const guestSchema = z.object({
  nickname: z.string().trim().min(1).max(50).optional(),
  avatarId: z.string().trim().min(1).max(50).optional(),
});

/**
 * POST /api/auth/guest
 * Generates an unpredictable guest identity and recovery token.
 */
authRouter.post('/guest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = guestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError('Invalid guest parameters', 400, 'INVALID_INPUT'));
    }

    const result = await createGuestPlayer(
      parseResult.data.nickname,
      parseResult.data.avatarId
    );

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Validates session token and returns the current authenticated player profile.
 */
authRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Missing authorization token', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.substring(7).trim();
    const player = await authenticateByToken(token);

    if (!player) {
      return next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
    }

    res.status(200).json({
      player: {
        id: player.id,
        nickname: player.nickname,
        avatarId: player.avatarId,
        createdAt: player.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});
