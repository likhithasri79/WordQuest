import React from 'react';

interface AvatarProps {
  nickname: string;
  avatarId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #eab308 0%, #ef4444 100%)',
];

export const Avatar: React.FC<AvatarProps> = ({ nickname, size = 'md' }) => {
  // Deterministic gradient selection based on nickname characters
  const charCodeSum = (nickname || 'P')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = GRADIENTS[charCodeSum % GRADIENTS.length];
  const initial = (nickname || 'P').charAt(0).toUpperCase();

  const sizeClasses = {
    sm: { width: '32px', height: '32px', fontSize: '0.85rem' },
    md: { width: '44px', height: '44px', fontSize: '1.15rem' },
    lg: { width: '60px', height: '60px', fontSize: '1.5rem' },
    xl: { width: '80px', height: '80px', fontSize: '2rem' },
  }[size];

  return (
    <div
      style={{
        ...sizeClasses,
        background: gradient,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255,255,255,0.2)',
        fontFamily: 'var(--font-heading)',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};
