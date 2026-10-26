import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  studyEndsAt: string;
  totalDurationMinutes: number;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  studyEndsAt,
  totalDurationMinutes,
  onExpire,
}) => {
  const calculateSecondsLeft = () => {
    const diffMs = new Date(studyEndsAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateSecondsLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [studyEndsAt]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formattedTime =
    hours > 0
      ? `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalSeconds = totalDurationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.max(0, (1 - secondsLeft / totalSeconds) * 100)) : 100;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
        <Clock size={18} />
        <span>Authoritative Study Period ({totalDurationMinutes} min)</span>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '3.2rem',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '0.04em',
          textShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
        }}
      >
        {formattedTime}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
            transition: 'width 1s linear',
          }}
        />
      </div>

      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Server-authoritative timer · Auto-resumes when complete
      </span>
    </div>
  );
};
