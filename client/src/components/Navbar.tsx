import React from 'react';
import { Sparkles, Settings, Wifi, WifiOff } from 'lucide-react';
import { Player, ConnectionStatus } from '../types/index.js';
import { Avatar } from './Avatar.js';

interface NavbarProps {
  player: Player | null;
  connectionStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onReturnHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  player,
  connectionStatus,
  onOpenSettings,
  onReturnHome,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 19, 0.75)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Logo */}
      <div
        onClick={onReturnHome}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: onReturnHome ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
          }}
        >
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.35rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            WordQuest
          </span>
        </div>
      </div>

      {/* Right Controls: Connection Status + Player Pill + Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Connection Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: connectionStatus === 'connected' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: connectionStatus === 'connected' ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: connectionStatus === 'connected' ? '#2dd4bf' : '#fb7185',
          }}
        >
          {connectionStatus === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span style={{ textTransform: 'capitalize' }}>{connectionStatus}</span>
        </div>

        {/* Player Profile Pill */}
        {player && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px 4px 6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <Avatar nickname={player.nickname} size="sm" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>
              {player.nickname}
            </span>
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="btn btn-secondary"
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)' }}
          title="Game Rules & Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
