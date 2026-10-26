import React, { useState, useEffect } from 'react';
import { X, Users, Search } from 'lucide-react';
import { Avatar } from '../components/Avatar.js';
import { Player } from '../types/index.js';

interface MatchmakingViewProps {
  player: Player;
  queueSize: number;
  onCancel: () => void;
}

export const MatchmakingView: React.FC<MatchmakingViewProps> = ({
  player,
  queueSize,
  onCancel,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        padding: '20px',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          padding: '40px 32px',
          textAlign: 'center',
          border: '1px solid var(--border-glow)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        {/* Radar Spinner with Avatar in center */}
        <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="radar-spinner" style={{ position: 'absolute' }} />
          <Avatar nickname={player.nickname} size="lg" />
        </div>

        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '8px' }}>
            Searching for Opponent...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Looking for a player ready to test word synchronicity
          </p>
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <Search size={14} color="#818cf8" />
            <span>Elapsed: <strong style={{ color: '#ffffff' }}>{formatElapsed(elapsedSeconds)}</strong></span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <Users size={14} color="#2dd4bf" />
            <span>In Queue: <strong style={{ color: '#ffffff' }}>{queueSize || 1}</strong></span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="btn btn-secondary"
          style={{ width: '100%', maxWidth: '240px' }}
        >
          <X size={18} />
          <span>Cancel Matchmaking</span>
        </button>
      </div>
    </div>
  );
};
