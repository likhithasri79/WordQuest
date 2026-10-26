# WordQuest: API & Real-time Socket.IO Contract

## 1. REST Endpoints

### 1.1 Health Check
- **`GET /health`**
- **Description**: Returns server liveness, database connectivity status, and current server UTC time.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "serverTime": "2026-10-26T11:45:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### 1.2 Guest Identity Registration
- **`POST /api/auth/guest`**
- **Description**: Issues a secure guest identity and recovery credential.
- **Request Body**:
```json
{
  "nickname": "WordMaster42",
  "avatarId": "avatar-01"
}
```
- **Response `201 Created`**:
```json
{
  "player": {
    "id": "a24b10ce-d456-4b82-901b-c12e5f88490a",
    "nickname": "WordMaster42",
    "avatarId": "avatar-01"
  },
  "recoveryToken": "e7c2a1f098...[64 hex chars]"
}
```

### 1.3 State Recovery / Reconnect Reconciler
- **`GET /api/matches/active`**
- **Headers**: `Authorization: Bearer <recoveryToken>`
- **Description**: Recovers any currently active match for the authenticated player.
- **Response `200 OK`** (if in a match): Returns authoritative match state (see section 2.4).
- **Response `200 OK`** (if no active match): `{ "activeMatch": null }`

---

## 2. Real-time Socket.IO Specification

### 2.1 Handshake Authentication
Clients connect to `/` with auth credentials:
```typescript
const socket = io(SERVER_URL, {
  auth: {
    token: recoveryToken
  }
});
```
If the token is invalid or missing, connection is rejected with `UNAUTHORIZED`.

---

### 2.2 Client-to-Server Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `queue:join` | `{}` | Places the authenticated player in the matchmaking pool. |
| `queue:cancel` | `{}` | Removes the player from the matchmaking pool. |
| `game:submit` | `{ matchId: string, roundNumber: number, word: string }` | Submits a secret word for the active round. |
| `game:resume` | `{ matchId: string }` | Re-subscribes socket to match room and requests sync. |

---

### 2.3 Server-to-Client Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `queue:status` | `{ inQueue: boolean, waitSeconds: number }` | Sent on queue join or queue update. |
| `queue:matched` | `{ matchId: string, opponent: { nickname: string, avatarId: string } }` | Emitted when two players are matched. |
| `game:state` | Full match state payload (see below) | Authoritative state sync upon joining or reconnecting. |
| `game:submission_received` | `{ playerId: string, roundNumber: number }` | Emitted when a player submits. **Never contains the word**. |
| `game:round_result` | Detailed result payload (see below) | Emitted once both submissions are resolved. |
| `game:study_started` | `{ studyDeadline: string, durationMinutes: number, mismatchCount: number }` | Emitted on mismatch to trigger study mode. |
| `game:study_ended` | `{ nextRoundNumber: number }` | Emitted when deadline expires and next round opens. |
| `game:error` | `{ code: string, message: string }` | Emitted on validation or business rule failures. |

---

### 2.4 Authoritative Payloads

#### `game:state` (Snapshot Payload)
```typescript
interface GameStatePayload {
  matchId: string;
  status: "AWAITING_SUBMISSIONS" | "RESOLVING_ROUND" | "STUDYING" | "COMPLETED" | "CANCELLED";
  currentRound: number;
  mismatchCount: number;
  serverTime: string; // ISO 8601 UTC
  studyEndsAt: string | null; // ISO 8601 UTC or null
  mySubmissionStatus: "PENDING" | "SUBMITTED";
  opponentSubmissionStatus: "PENDING" | "SUBMITTED";
  opponent: {
    nickname: string;
    avatarId: string;
  };
  resolvedHistory: Array<{
    roundNumber: number;
    yourWord: string;
    opponentWord: string;
    isMatch: boolean;
    resolvedAt: string;
  }>;
}
```

#### `game:round_result`
```typescript
interface RoundResultPayload {
  matchId: string;
  roundNumber: number;
  isMatch: boolean;
  yourWord: string;
  opponentWord: string;
  nextStatus: "STUDYING" | "COMPLETED";
  mismatchCount: number;
  studyEndsAt: string | null;
  studyDurationMinutes: number | null;
}
```

---

## 3. Standardized Error Codes

| Code | HTTP/Socket Reason |
| :--- | :--- |
| `UNAUTHORIZED` | Token is invalid, expired, or missing. |
| `INVALID_SUBMISSION` | Word is empty, whitespace only, exceeds 100 characters, or contains invalid characters. |
| `DUPLICATE_SUBMISSION`| Player has already submitted for this specific round. |
| `PREMATURE_SUBMISSION`| Submission attempted while match is in `STUDYING` and deadline has not expired. |
| `INVALID_STATE` | Action cannot be performed in the current match status. |
| `NOT_IN_MATCH` | Player is attempting an action on a match they are not part of. |
| `MATCH_COMPLETED` | Match has already reached completion. |
