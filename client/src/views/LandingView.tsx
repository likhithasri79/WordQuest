import React, { useState } from 'react';
import { Gamepad2, Shield, Clock, Sparkles, ArrowRight, User } from 'lucide-react';

interface LandingViewProps {
  currentNickname: string;
  onUpdateNickname: (newNickname: string) => void;
  onFindMatch: () => void;
  isConnecting: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  currentNickname,
  onUpdateNickname,
  onFindMatch,
  isConnecting,
}) => {
  const [nicknameInput, setNicknameInput] = useState(currentNickname);
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (nicknameInput.trim()) {
      onUpdateNickname(nicknameInput.trim());
      setIsEditingNickname(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        maxWidth: '860px',
        margin: '0 auto',
        width: '100%',
        gap: '48px',
      }}
    >
      {/* Hero Section */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <Sparkles size={16} /> Real-Time 1v1 Multiplayer
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '720px',
          }}
        >
          Think. Submit. Match.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-muted)',
            maxWidth: '560px',
            lineHeight: 1.6,
          }}
        >
          Two minds enter. No communication. Choose words of any length and attempt to converge on the exact same word.
        </p>
      </div>

      {/* Primary Action Card */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-glow)',
          border: '1px solid var(--border-glow)',
        }}
      >
        {/* Nickname Row */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <User size={16} />
            <span>Player:</span>
            {!isEditingNickname ? (
              <strong style={{ color: '#ffffff' }}>{currentNickname}</strong>
            ) : null}
          </div>

          {!isEditingNickname ? (
            <button
              onClick={() => setIsEditingNickname(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#818cf8',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              Change
            </button>
          ) : (
            <form onSubmit={handleSaveNickname} style={{ display: 'flex', gap: '6px' }}>
              <input
                className="input-field"
                style={{ padding: '4px 8px', fontSize: '0.85rem', width: '130px' }}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                Save
              </button>
            </form>
          )}
        </div>

        {/* Find Match Button */}
        <button
          onClick={onFindMatch}
          disabled={isConnecting}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: '1.2rem',
            borderRadius: 'var(--radius-md)',
            animation: 'pulseGlow 3s infinite',
          }}
        >
          <Gamepad2 size={24} />
          <span>{isConnecting ? 'Connecting...' : 'Find a Match'}</span>
          <ArrowRight size={20} />
        </button>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
          Pairs you instantly with a waiting opponent
        </span>
      </div>

      {/* "How It Works" 3-Column Feature Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
          <div style={{ color: '#818cf8' }}><Shield size={24} /></div>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Private Submissions</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Submissions are locked secretly in the server. Neither player sees the opponent's word until both submit.
          </p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
          <div style={{ color: '#2dd4bf' }}><Sparkles size={24} /></div>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Any Word or Phrase</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            No five-letter limits. Single words and multi-word expressions are compared for exact equality.
          </p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
          <div style={{ color: '#fbbf24' }}><Clock size={24} /></div>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Progressive Delays</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Mismatches trigger 15 min, 30 min, 45 min study sessions. The session persists even if you close the browser.
          </p>
        </div>
      </div>
    </div>
  );
};
