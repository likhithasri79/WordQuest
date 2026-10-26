
# WordQuest

A real-time, 1v1 multiplayer word-matching game.

## Planned stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Real-time communication: Socket.IO
- Database: PostgreSQL
- Matchmaking and coordination: Redis

## Core gameplay

Two players independently submit words.
Matching words end the game in victory.
Mismatched words trigger a 15-minute study session,
with the next session increasing by 15 minutes
after each subsequent mismatch.
