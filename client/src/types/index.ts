export type MatchStatus =
  | 'WAITING_FOR_PLAYERS'
  | 'AWAITING_SUBMISSIONS'
  | 'RESOLVING_ROUND'
  | 'STUDYING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Player {
  id: string;
  nickname: string;
  avatarId: string;
}

export interface ResolvedRoundItem {
  roundNumber: number;
  yourWord: string;
  opponentWord: string;
  isMatch: boolean;
  resolvedAt: string | null;
}

export interface SafeMatchView {
  matchId: string;
  status: MatchStatus;
  currentRound: number;
  mismatchCount: number;
  studyEndsAt: string | null;
  serverTime: string;
  myRole: 'playerA' | 'playerB';
  mySubmissionStatus: 'PENDING' | 'SUBMITTED';
  opponentSubmissionStatus: 'PENDING' | 'SUBMITTED';
  opponent: {
    id: string;
    nickname: string;
    avatarId: string;
  };
  resolvedHistory: ResolvedRoundItem[];
}

export interface RoundResultPayload {
  matchId: string;
  roundNumber: number;
  isMatch: boolean;
  wordA: string;
  wordB: string;
  nextStatus: 'COMPLETED' | 'STUDYING';
  mismatchCount: number;
  studyEndsAt: string | null;
  studyDurationMinutes: number | null;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
export type AppView = 'landing' | 'queue' | 'game';
