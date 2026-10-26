# WordQuest: Security, Privacy & Reliability Specification

## 1. Zero Word Leakage Policy (Core Security Invariant)

In WordQuest, fairness depends entirely on submission confidentiality:
1. **Never Broadcast Pending Submissions**: When Player A submits a word, the server stores it in the database and only emits `{ playerId, roundNumber, status: "SUBMITTED" }` to the room. The word itself is NEVER passed into the socket payload or returned via any API until the round is fully resolved.
2. **Isolation in State Sync**: The `game:state` recovery endpoint filters round data:
   - For past resolved rounds: returns both words.
   - For the current active round: returns only boolean flags `mySubmissionStatus` and `opponentSubmissionStatus`.

---

## 2. Authentication & Authorization

1. **Token Cryptography**:
   - Guest recovery tokens are generated via `crypto.randomBytes(32).toString('hex')` (256 bits of cryptographic entropy).
   - The server hashes this token with SHA-256 before persisting in the `players` table. A database leak will not compromise active session tokens.
2. **Room Authorization**:
   - Socket.IO rooms are named `match:<matchId>`.
   - Before joining a socket to `match:<matchId>`, the server verifies that `socket.data.playerId` equals `player_a_id` or `player_b_id`.
   - Sockets cannot join or listen to arbitary rooms.

---

## 3. Log Redaction & Observability Hygiene

Structured logs must strictly redact:
- Plaintext recovery tokens.
- Pending words (can be logged only as `wordLength: number` or `wordHash: string` for debugging).
- Authorization headers.

Example structured log entry:
```json
{
  "timestamp": "2026-10-26T11:45:00.000Z",
  "level": "info",
  "event": "submission_received",
  "matchId": "f7d2...",
  "playerId": "a1b2...",
  "round": 1,
  "wordLength": 6
}
```

---

## 4. Input Validation & Hardening

1. **Submission Constraints**:
   - Type: String.
   - Min length: 1 character (after trim).
   - Max length: 100 characters.
   - Character whitelist: Alphanumeric, spaces, and standard punctuation. Control characters (`\u0000` to `\u001F`) and script tags (`<script>`) are rejected.
2. **HTTP Hardening**:
   - `helmet` middleware for XSS, HSTS, frameguard, and CSP.
   - `cors` configured strictly to allowed client origin (`process.env.CLIENT_URL`).
   - `express-rate-limit` on `/api/auth/guest` (10 req/minute per IP) to mitigate bot spam.
