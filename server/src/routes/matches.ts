import { Router, Request, Response, NextFunction } from 'express';
import { authenticateByToken } from '../modules/players/playerService.js';
import { getActiveMatchForPlayer, getSafeMatchView } from '../modules/matches/matchService.js';
import { AppError } from '../middleware/errorHandler.js';

export const matchesRouter = Router();

// Middleware ensuring player is authenticated for match endpoints
async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing authorization header', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.substring(7).trim();
  const player = await authenticateByToken(token);
  if (!player) {
    return next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }

  req.player = player;
  next();
}

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      player?: {
        id: string;
        nickname: string;
        avatarId: string;
      };
    }
  }
}

/**
 * GET /api/matches/active
 * Recovers the active match for the authenticated player.
 * Automatically checks and transitions expired study sessions.
 */
matchesRouter.get('/active', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeMatch = await getActiveMatchForPlayer(req.player!.id);
    res.status(200).json({ activeMatch });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:id
 * Fetches authorized, zero-leakage match state by match ID.
 */
matchesRouter.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matchState = await getSafeMatchView(req.params.id, req.player!.id);
    res.status(200).json({ match: matchState });
  } catch (err) {
    next(err);
  }
});
