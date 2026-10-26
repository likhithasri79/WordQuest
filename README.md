# WordQuest 🎯

A real-time, global 1v1 multiplayer word-matching game built on suspense, privacy, and progressive study sessions.

Two players independently submit words without seeing the other's answer. When both submit, the server checks for an exact match. If the words match, both players win. If they differ, both enter an authoritative study session ($15 \times \text{mismatchCount}$ minutes), increasing with every subsequent mismatch.

---

## 🚀 Planned Stack

- **Frontend**: React + Vite + TypeScript, CSS Modules / Custom Design System, Socket.IO Client.
- **Backend**: Node.js + Express + TypeScript, Socket.IO, Zod schema validation.
- **Database**: PostgreSQL with Drizzle ORM (ACID transactions, row-level locking for round resolution).
- **Caching & Coordination**: Redis (for distributed matchmaking & presence scaling in future milestones).

---

## 📖 Core Gameplay Rules

1. **Independent Secret Submissions**: Neither player's word is revealed until both submit.
2. **Authoritative Normalization**: Case folding and whitespace trimming are performed by a centralized backend function. Internal punctuation and accents are preserved.
3. **Exact Equality Matching**: No AI, embeddings, or semantic similarity. Either the normalized words are identical, or it's a mismatch.
4. **Progressive Study Delays**:
   - 1st Mismatch: **15 minutes**
   - 2nd Mismatch: **30 minutes**
   - 3rd Mismatch: **45 minutes**
   - $n$-th Mismatch: **$15 \times n$ minutes**
5. **Server-Authoritative Deadlines**: The database stores absolute UTC timestamps (`TIMESTAMPTZ`). Reconnecting players or restarting the backend will never reset the timer.

---

## 📂 Project Structure

```
WordQuest/
├── client/          # React + Vite + TypeScript frontend
├── server/          # Node.js + Express + TypeScript + Socket.IO backend
├── docs/            # Architecture & specifications
│   ├── architecture.md    # System design & PostgreSQL schema
│   ├── game-rules.md      # Game rules & state machine specs
│   ├── api-contract.md    # REST & Socket.IO typed payloads
│   └── security.md        # Privacy, token hashing & log hygiene
├── .gitignore       # Git ignore rules
└── README.md        # Project overview & roadmap
```

---

## 🗺️ Development Roadmap

- [x] **Phase 1**: Repository Inspection, Git Status & Complete Architecture Documentation
- [ ] **Phase 2**: Backend Foundation (TypeScript, Express, Socket.IO, structured logging, health check)
- [ ] **Phase 3**: Database Foundation (PostgreSQL setup, Drizzle ORM schema & migrations)
- [ ] **Phase 4**: Domain Logic (Word normalization, state machine, study timer calculations & unit tests)
- [ ] **Phase 5**: Matchmaking & Real-time Events (Guest authentication, atomic queue, private submissions)
- [ ] **Phase 6**: Persistence & Recovery (Authoritative timer restoration, reconnect reconciler)
- [ ] **Phase 7**: Frontend Foundation (React + Vite, UI components, responsive layout & sound design)
- [ ] **Phase 8**: End-to-End Integration (Multi-client verification, edge cases, timer synchronization)
- [ ] **Phase 9**: Quality & Security Audit (Automated test suites, rate-limiting, penetration checks)
- [ ] **Phase 10**: Deployment Configuration (Docker Compose, production build, HTTPS/WSS setup)
