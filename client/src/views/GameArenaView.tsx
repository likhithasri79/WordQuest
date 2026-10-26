import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, Shield, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import { SafeMatchView, Player } from '../types/index.js';
import { Avatar } from '../components/Avatar.js';
import { CountdownTimer } from '../components/CountdownTimer.js';
import { RoundHistory } from '../components/RoundHistory.js';

interface GameArenaViewProps {
  match: SafeMatchView;
  player: Player;
  onSubmitWord: (word: string) => Promise<boolean>;
  onStudyExpired: () => void;
  onReturnHome: () => void;
}

export const GameArenaView: React.FC<GameArenaViewProps> = ({
  match,
  player,
  onSubmitWord,
  onStudyExpired,
  onReturnHome,
}) => {
  const [wordInput, setWordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAwaitingSubmission = match.status === 'AWAITING_SUBMISSIONS';
  const isStudying = match.status === 'STUDYING';
  const isCompleted = match.status === 'COMPLETED';

  const mySubmitted = match.mySubmissionStatus === 'SUBMITTED';
  const opponentSubmitted = match.opponentSubmissionStatus === 'SUBMITTED';

  // Trigger celebration confetti on match victory
  React.useEffect(() => {
    if (isCompleted) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#14b8a6', '#f43f5e', '#a855f7', '#fbbf24'],
      });
    }
  }, [isCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || isSubmitting || mySubmitted) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const success = await onSubmitWord(wordInput.trim());
      if (success) {
        setWordInput('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 20px 48px',
        maxWidth: '720px',
        margin: '0 auto',
        width: '100%',
        gap: '24px',
      }}
    >
      {/* 1. Matchup Header: Player vs Opponent */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
        }}
      >
        {/* Player Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar nickname={player.nickname} size="md" />
          <div>
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>{player.nickname}</div>
            <div style={{ fontSize: '0.78rem', color: mySubmitted ? '#2dd4bf' : 'var(--text-muted)' }}>
              {mySubmitted ? '✓ Word Submitted' : 'Thinking...'}
            </div>
          </div>
        </div>

        {/* Center Round Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span className="badge badge-live">
            Round {match.currentRound}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            Mismatches: {match.mismatchCount}
          </span>
        </div>

        {/* Opponent Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
          <Avatar nickname={match.opponent.nickname} size="md" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>{match.opponent.nickname}</div>
            <div style={{ fontSize: '0.78rem', color: opponentSubmitted ? '#2dd4bf' : 'var(--text-muted)' }}>
              {opponentSubmitted ? '✓ Word Submitted' : 'Thinking...'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Victory State (Completed) */}
      {isCompleted && (
        <div
          className="glass-card animate-fade-in"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            textAlign: 'center',
            padding: '36px 24px',
            border: '1px solid rgba(20, 184, 166, 0.5)',
            boxShadow: 'var(--shadow-success)',
            background: 'rgba(20, 184, 166, 0.08)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(20, 184, 166, 0.5)',
            }}
          >
            <Trophy size={32} color="#ffffff" />
          </div>

          <div>
            <h2 style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '6px' }}>Mutual Synchronicity Achieved!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Both players chose the exact matching word in Round {match.currentRound}!
            </p>
          </div>

          <button onClick={onReturnHome} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <span>Return to Lobby</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* 3. Study Session State (Active Countdown) */}
      {isStudying && match.studyEndsAt && (
        <div
          className="animate-fade-in"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <CountdownTimer
            studyEndsAt={match.studyEndsAt}
            totalDurationMinutes={match.mismatchCount * 15}
            onExpire={onStudyExpired}
          />
        </div>
      )}

      {/* 4. Submission Input Arena (Active Round) */}
      {isAwaitingSubmission && (
        <div
          className="glass-card animate-fade-in"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '32px 28px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '6px' }}>
              {mySubmitted ? 'Word Submitted!' : `Round ${match.currentRound}: Choose your word`}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              {mySubmitted
                ? 'Your submission is safely encrypted on the server. Awaiting opponent response...'
                : 'Enter any word or phrase of any length. Try to predict what your opponent will choose.'}
            </p>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                className="input-field"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder={mySubmitted ? 'Your word has been received' : 'Type any word or phrase...'}
                disabled={mySubmitted || isSubmitting}
                maxLength={100}
                style={{
                  fontSize: '1.15rem',
                  paddingRight: '120px',
                  opacity: mySubmitted ? 0.7 : 1,
                }}
                autoFocus={!mySubmitted}
              />
              <button
                type="submit"
                disabled={mySubmitted || !wordInput.trim() || isSubmitting}
                className="btn btn-primary"
                style={{
                  position: 'absolute',
                  right: '8px',
                  padding: '9px 18px',
                  fontSize: '0.92rem',
                }}
              >
                {mySubmitted ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Sent</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <span style={{ color: '#fb7185', fontSize: '0.85rem' }}>{errorMessage}</span>
            )}
          </form>

          {/* Privacy Notice Invariant */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            <Shield size={16} color="#818cf8" />
            <span>
              <strong>Zero Leakage Guarantee:</strong> Submissions are strictly secret. Neither player can see the other's word until both submit.
            </span>
          </div>
        </div>
      )}

      {/* 5. Round History: Prominent Previous Mismatch + Collapsible Older Rounds */}
      <RoundHistory
        history={match.resolvedHistory}
        opponentNickname={match.opponent.nickname}
      />
    </div>
  );
};
