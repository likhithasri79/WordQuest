import { Player, SafeMatchView } from '../types/index.js';

const TOKEN_KEY = 'wordquest_recovery_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Initializes or restores player guest session
 */
export async function getOrCreateGuestSession(): Promise<{ player: Player; token: string }> {
  const existingToken = getStoredToken();

  if (existingToken) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${existingToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return { player: data.player, token: existingToken };
      }
    } catch {
      // Fallback to creating a new guest identity if token failed
    }
  }

  // Create new guest session
  const res = await fetch('/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error('Failed to create guest identity');
  }

  const data = await res.json();
  setStoredToken(data.recoveryToken);
  return { player: data.player, token: data.recoveryToken };
}

/**
 * Recovers any ongoing active match for the authenticated player
 */
export async function fetchActiveMatch(): Promise<SafeMatchView | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/matches/active', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return data.activeMatch || null;
  } catch {
    return null;
  }
}
