import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { players, Player } from '../../db/schema.js';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface GuestRegistrationResult {
  player: {
    id: string;
    nickname: string;
    avatarId: string;
    createdAt: Date;
  };
  recoveryToken: string;
}

/**
 * Creates a new guest player with a cryptographically secure 256-bit recovery token.
 * Only the SHA-256 hash of the recovery token is stored in the database.
 */
export async function createGuestPlayer(
  nickname?: string,
  avatarId = 'avatar-01'
): Promise<GuestRegistrationResult> {
  // Generate random nickname if omitted (e.g. "WordMaster#4812")
  const defaultNickname = nickname?.trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  
  // 32 bytes = 256 bits of cryptographic entropy
  const recoveryToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(recoveryToken);

  const [newPlayer] = await db
    .insert(players)
    .values({
      guestTokenHash: tokenHash,
      nickname: defaultNickname,
      avatarId,
    })
    .returning();

  return {
    player: {
      id: newPlayer.id,
      nickname: newPlayer.nickname,
      avatarId: newPlayer.avatarId,
      createdAt: newPlayer.createdAt,
    },
    recoveryToken,
  };
}

/**
 * Authenticates a player using their plaintext recovery token.
 * Hashes the incoming token and looks up the player in the database.
 */
export async function authenticateByToken(token: string): Promise<Player | null> {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = hashToken(token);

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.guestTokenHash, tokenHash))
    .limit(1);

  if (!player) return null;

  // Asynchronously update last_seen_at without blocking critical path
  db.update(players)
    .set({ lastSeenAt: new Date() })
    .where(eq(players.id, player.id))
    .catch(() => {});

  return player;
}
