import React, { useState, useEffect, useCallback } from 'react';
import { Player, SafeMatchView, ConnectionStatus, AppView, RoundResultPayload } from './types/index.js';
import { getOrCreateGuestSession, fetchActiveMatch } from './lib/api.js';
import { getSocket, disconnectSocket } from './lib/socket.js';
import { Navbar } from './components/Navbar.js';
import { LandingView } from './views/LandingView.js';
import { MatchmakingView } from './views/MatchmakingView.js';
import { GameArenaView } from './views/GameArenaView.js';
import { SettingsModal } from './components/SettingsModal.js';

export const App: React.FC = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [activeMatch, setActiveMatch] = useState<SafeMatchView | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [queueSize, setQueueSize] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play simple synth sound cues
  const playAudioCue = useCallback((type: 'matched' | 'victory' | 'mismatch') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'matched') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      } else if (type === 'victory') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.4); // C6
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // 1. Session Initialization and Active Match Recovery
  useEffect(() => {
    async function initApp() {
      try {
        const { player: currentGuest, token } = await getOrCreateGuestSession();
        setPlayer(currentGuest);

        // Check if player has an active ongoing match to recover
        const recoveredMatch = await fetchActiveMatch();
        if (recoveredMatch) {
          setActiveMatch(recoveredMatch);
          setCurrentView('game');
        }

        // Connect Socket.IO with token
        const socket = getSocket(token);

        socket.on('connect', () => {
          setConnectionStatus('connected');
          // If in an active match, resume and re-sync socket room
          if (recoveredMatch) {
            socket.emit('game:resume', { matchId: recoveredMatch.matchId });
          }
        });

        socket.on('disconnect', () => setConnectionStatus('disconnected'));
        socket.on('reconnecting', () => setConnectionStatus('reconnecting'));

        // Matchmaking Queue Events
        socket.on('queue:status', (data: { inQueue: boolean; queueSize?: number }) => {
          if (data.queueSize !== undefined) setQueueSize(data.queueSize);
          if (!data.inQueue && currentView === 'queue') {
            setCurrentView('landing');
          }
        });

        socket.on('queue:matched', () => {
          playAudioCue('matched');
        });

        // Game State Synchronization
        socket.on('game:state', (state: SafeMatchView) => {
          setActiveMatch(state);
          setCurrentView('game');
        });

        // Opponent Word Received (Zero leakage: no word in payload)
        socket.on('game:submission_received', (data: { playerId: string }) => {
          setActiveMatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              opponentSubmissionStatus: data.playerId !== player?.id ? 'SUBMITTED' : prev.opponentSubmissionStatus,
            };
          });
        });

        // Round Resolution Broadcast (reveals words)
        socket.on('game:round_result', (result: RoundResultPayload) => {
          setActiveMatch((prev) => {
            if (!prev) return prev;

            const updatedHistory = [
              ...prev.resolvedHistory,
              {
                roundNumber: result.roundNumber,
                yourWord: prev.myRole === 'playerA' ? result.wordA : result.wordB,
                opponentWord: prev.myRole === 'playerA' ? result.wordB : result.wordA,
                isMatch: result.isMatch,
                resolvedAt: new Date().toISOString(),
              },
            ];

            return {
              ...prev,
              status: result.nextStatus,
              mismatchCount: result.mismatchCount,
              studyEndsAt: result.studyEndsAt,
              mySubmissionStatus: 'PENDING',
              opponentSubmissionStatus: 'PENDING',
              resolvedHistory: updatedHistory,
            };
          });

          playAudioCue(result.isMatch ? 'victory' : 'mismatch');
        });

        // Study Session Ended
        socket.on('game:study_ended', (data: { nextRoundNumber: number }) => {
          setActiveMatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'AWAITING_SUBMISSIONS',
              currentRound: data.nextRoundNumber,
              studyEndsAt: null,
              mySubmissionStatus: 'PENDING',
              opponentSubmissionStatus: 'PENDING',
            };
          });
        });

        socket.connect();
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    initApp();

    return () => {
      disconnectSocket();
    };
  }, []);

  // 2. Queue & Game Action Handlers
  const handleFindMatch = () => {
    const socket = getSocket();
    socket.emit('queue:join');
    setCurrentView('queue');
  };

  const handleCancelQueue = () => {
    const socket = getSocket();
    socket.emit('queue:cancel');
    setCurrentView('landing');
  };

  const handleSubmitWord = (word: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!activeMatch) return resolve(false);

      const socket = getSocket();
      socket.emit(
        'game:submit',
        {
          matchId: activeMatch.matchId,
          roundNumber: activeMatch.currentRound,
          word,
        },
        (ack: { success: boolean; error?: { message: string } }) => {
          if (ack && ack.success) {
            setActiveMatch((prev) => (prev ? { ...prev, mySubmissionStatus: 'SUBMITTED' } : prev));
            resolve(true);
          } else {
            alert(ack?.error?.message || 'Submission failed');
            resolve(false);
          }
        }
      );
    });
  };

  const handleStudyExpired = async () => {
    const recovered = await fetchActiveMatch();
    if (recovered) {
      setActiveMatch(recovered);
    }
  };

  const handleReturnHome = () => {
    setActiveMatch(null);
    setCurrentView('landing');
  };

  return (
    <>
      <Navbar
        player={player}
        connectionStatus={connectionStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReturnHome={currentView !== 'game' ? handleReturnHome : undefined}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'landing' && (
          <LandingView
            currentNickname={player?.nickname || 'Player'}
            onUpdateNickname={(name) => setPlayer((prev) => (prev ? { ...prev, nickname: name } : prev))}
            onFindMatch={handleFindMatch}
            isConnecting={connectionStatus === 'connecting'}
          />
        )}

        {currentView === 'queue' && player && (
          <MatchmakingView
            player={player}
            queueSize={queueSize}
            onCancel={handleCancelQueue}
          />
        )}

        {currentView === 'game' && activeMatch && player && (
          <GameArenaView
            match={activeMatch}
            player={player}
            onSubmitWord={handleSubmitWord}
            onStudyExpired={handleStudyExpired}
            onReturnHome={handleReturnHome}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
    </>
  );
};
