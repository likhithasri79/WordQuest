import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, CheckCircle, XCircle } from 'lucide-react';
import { ResolvedRoundItem } from '../types/index.js';

interface RoundHistoryProps {
  history: ResolvedRoundItem[];
  opponentNickname: string;
}

export const RoundHistory: React.FC<RoundHistoryProps> = ({ history, opponentNickname }) => {
  const [isOlderHistoryOpen, setIsOlderHistoryOpen] = useState(false);

  if (!history || history.length === 0) {
    return null;
  }

  // Most recent mismatch / resolved round is the last element
  const mostRecentRound = history[history.length - 1];
  const olderRounds = history.slice(0, history.length - 1);

  return (
    <div style={{ width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Focal Card: Most Recent Mismatch / Round */}
      <div
        className="glass-card"
        style={{
          border: mostRecentRound.isMatch
            ? '1px solid rgba(20, 184, 166, 0.4)'
            : '1px solid rgba(244, 63, 94, 0.35)',
          background: mostRecentRound.isMatch
            ? 'rgba(20, 184, 166, 0.08)'
            : 'rgba(244, 63, 94, 0.06)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mostRecentRound.isMatch ? (
              <CheckCircle size={18} color="#2dd4bf" />
            ) : (
              <XCircle size={18} color="#fb7185" />
            )}
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
              Round {mostRecentRound.roundNumber} — {mostRecentRound.isMatch ? 'Victory Match!' : 'Mismatch'}
            </span>
          </div>
          <span className={`badge ${mostRecentRound.isMatch ? 'badge-live' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
            {mostRecentRound.isMatch ? 'Match' : 'Differed'}
          </span>
        </div>

        {/* Word Comparison Display */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>YOUR WORD</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              {mostRecentRound.yourWord}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {opponentNickname.toUpperCase()}'S WORD
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              {mostRecentRound.opponentWord}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Collapsible Older Rounds Accordion */}
      {olderRounds.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setIsOlderHistoryOpen(!isOlderHistoryOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} />
              <span>Previous Rounds ({olderRounds.length})</span>
            </div>
            {isOlderHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isOlderHistoryOpen && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '4px 0',
              }}
            >
              {olderRounds
                .slice()
                .reverse()
                .map((r) => (
                  <div
                    key={r.roundNumber}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                      Round {r.roundNumber}
                    </span>
                    <div style={{ display: 'flex', gap: '16px', color: '#ffffff' }}>
                      <span>You: <strong style={{ color: '#818cf8' }}>{r.yourWord}</strong></span>
                      <span>{opponentNickname}: <strong style={{ color: '#fb7185' }}>{r.opponentWord}</strong></span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
