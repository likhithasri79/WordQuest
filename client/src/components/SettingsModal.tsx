import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type TabType = 'rules' | 'privacy' | 'audio';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('rules');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>WordQuest Settings & Rules</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Left Sidebar Tabs + Right Content Area */}
        <div style={{ display: 'flex', flex: 1, minHeight: '340px' }}>
          {/* Tabs Sidebar */}
          <div
            style={{
              width: '180px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'rgba(10, 14, 26, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 10px',
              gap: '6px',
            }}
          >
            <button
              onClick={() => setActiveTab('rules')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: activeTab === 'rules' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                background: activeTab === 'rules' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'rules' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <BookOpen size={16} />
              <span>Game Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: activeTab === 'privacy' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                background: activeTab === 'privacy' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'privacy' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <ShieldCheck size={16} />
              <span>Privacy & Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: activeTab === 'audio' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                background: activeTab === 'audio' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'audio' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <Volume2 size={16} />
              <span>Preferences</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', fontSize: '0.92rem', lineHeight: '1.6' }}>
            {activeTab === 'rules' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>How WordQuest Works</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Two players independently submit words trying to enter the exact same word or phrase without communicating.
                </p>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ color: '#818cf8' }}>Exact Equality Matching:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '6px', color: 'var(--text-muted)' }}>
                    <li>Words of any length are supported (no artificial 5-letter limits).</li>
                    <li>Multi-word phrases are permitted (e.g. <code>deep blue sea</code>).</li>
                    <li>Case and extra whitespace are normalized. Punctuation and accents are preserved.</li>
                    <li>No AI, synonyms, or fuzzy matching is used.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>Authoritative Privacy & Study</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Your submissions remain completely confidential. Neither player can see the opponent's pending answer until both have submitted.
                </p>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <strong style={{ color: '#fbbf24' }}>Progressive Study Timer:</strong>
                  <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                    Each mismatch increases the next study period by 15 minutes:
                  </p>
                  <ul style={{ paddingLeft: '20px', marginTop: '4px', color: 'var(--text-muted)' }}>
                    <li>1st mismatch: <strong>15 minutes</strong></li>
                    <li>2nd mismatch: <strong>30 minutes</strong></li>
                    <li>3rd mismatch: <strong>45 minutes</strong></li>
                  </ul>
                  <p style={{ marginTop: '8px', fontSize: '0.82rem', color: '#f59e0b' }}>
                    Deadlines are persisted in PostgreSQL. Reconnecting or refreshing will never reset your session.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>Audio & Accessibility</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>Sound Effects</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Plays audio cues for matchmaking and round results</div>
                  </div>
                  <button
                    onClick={onToggleSound}
                    className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    {soundEnabled ? 'Enabled' : 'Muted'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
