# MyUNO — Technical learnings & project reference

This document describes **what** the codebase is, **why** key choices were made, and **how** the pieces fit together. It is written for you (and for other LLMs) to onboard quickly, answer interview or stakeholder questions, and plan improvements. The app is a **work in progress**: several README claims and production-hardening items do not match the implementation yet.

---

## 1. What this project is

- **Product**: A web-based **two-player UNO** experience with:
  - **Auth** (signup, login, forgot/reset password) via Blitz.js session auth.
  - **“Play vs AI”**: Host is human; second seat is an **AI** (`GamePlayer.userId = null`). AI moves are triggered from the client after polling sees it is the AI’s turn.
  - **“Play online with friend”**: Host creates a room and gets a **6-character passcode**; a second user is supposed to join with that passcode. **The join flow is currently inconsistent with how games are created** (see [§7 Known gaps & bugs](#7-known-gaps--bugs)).
- **Stack**: **Blitz.js 3** on **Next.js 15** (Pages Router), **React 19**, **TypeScript**, **Prisma 6** + **PostgreSQL**, **Mantine 8** UI, **Zod** + **react-hook-form** for forms, **Vitest** + Testing Library for tests.
- **Game logic**: Pure TypeScript in `src/game-engine/` (deck, shuffle, play, draw, turn order). **State is persisted** in `GameSession` and `GamePlayer` rows (deck, discard pile, hands as JSON strings).

---

## 2. Why this architecture

| Decision | Why it fits this project |
|----------|---------------------------|
| **Blitz.js + Next.js** | Full-stack React with file-based routes, API routes, and built-in auth/session patterns. Good for a single-repo hobby/small product. |
| **Prisma + PostgreSQL** | Durable game and user data; relational model for users, sessions, games, players, moves. |
| **JSON in DB for cards** | Fast to ship: no normalized `CardInstance` graph; entire deck/hands are serialized. Tradeoff: harder to query/analyze per-card history without parsing JSON. |
| **REST handlers under `pages/api/games/*`** | Simple POST/GET from the client with `fetch`; no separate game server. |
| **Polling (2s) on the game page** | Avoids WebSocket/SSE infrastructure for now; “good enough” for a prototype. **Not true real-time** in the low-latency sense. |
| **Mantine** | Rapid UI (layout, buttons, modals) without a custom design system yet. |

---

## 3. How the system is structured

### 3.1 High-level flow

```mermaid
flowchart LR
  subgraph client [Browser]
    Home[index.tsx]
    New[games/new.tsx]
    Game[games/id.tsx]
    Home --> New
    New --> Game
    Game -->|poll GET| GetState[/api/games/getGameState/]
    Game -->|POST| Play[/api/games/playCard/]
    Game -->|POST| Draw[/api/games/drawCard/]
    Game -->|POST| AI[/api/games/aiMove/]
  end
  subgraph server [Next.js API routes]
    GetState --> DB[(PostgreSQL)]
    Play --> Engine[uno-logic.ts]
    Draw --> Engine
    AI --> Engine
    Engine --> DB
  end
  subgraph auth [Blitz auth]
    RPC[/api/rpc/...] --> Session[Session table]
    Login[mutations/login] --> Session
  end
```

### 3.2 Directory map (what lives where)

| Path | Role |
|------|------|
| `src/pages/` | Next.js pages: home, auth, `games/new`, `games/[id]`, `404`. |
| `src/pages/api/games/` | Game HTTP API: `createGame`, `joinGame`, `getGameState`, `playCard`, `drawCard`, `callUno`, `aiMove`. |
| `src/pages/api/rpc/[[...blitz]].ts` | Blitz RPC handler for mutations/queries (auth, `getCurrentUser`, etc.). |
| `src/game-engine/utils.ts` | Types: `Card`, `GameState`, `PlayerState`. |
| `src/game-engine/uno-logic.ts` | Deck init, shuffle, `playCard`, `drawCards`, UNO helpers, serialize/deserialize. |
| `src/components/` | `GameBoard`, `PlayerHand`, `Card` (presentational UNO card). |
| `src/auth/` | Zod schemas, login/signup forms, mutations (login, signup, logout, password reset). |
| `src/users/` | `getCurrentUser` query + `useCurrentUser` hook. |
| `src/core/` | Shared `Layout`, form primitives. |
| `db/schema.prisma` | Prisma models and relations. |
| `db/migrations/` | SQL migrations (auth, nullable `GamePlayer.userId`, etc.). |
| `types.ts` | Blitz session typing (`Role`, `Session.PublicData`). |
| `mailers/forgotPasswordMailer.ts` | Forgot-password email (dev-oriented). |

### 3.3 Database model (conceptual)

- **`User`**: email, name, `hashedPassword`, `role`; linked to `Session`, `Token`, `GamePlayer`.
- **`GameSession`**: one row per match; `passcode`, `status` (`waiting` \| `active` \| `finished`), `gameType` (`ai` \| `online`), top-level fields mirroring engine state (`currentPlayerIndex`, `direction`, `currentColor`, `currentNumber`, `drawCount`, `deck`, `discardPile`, `winner`).
- **`GamePlayer`**: per-seat row: `gameId`, `userId` (nullable for AI placeholder), `playerIndex` (0 or 1 in practice), `hand` JSON string, `score` (reserved for future multi-round scoring).
- **`Move`**: audit log of actions (`play`, etc.); `playerId` stores the acting user id when recorded.
- **`Session` / `Token`**: Blitz auth (cookie sessions, password-reset tokens).

**Important**: The Prisma comment on `GameSession.winner` says “User ID of winner,” but the **engine and API store the winner as a player index** (`0` or `1`) from `uno-logic.ts` (`newState.winner = newState.currentPlayerIndex`). The UI compares `gameState.winner` to `currentPlayerInfo.playerIndex`, which is **consistent with index storage**—only the schema comment is misleading.

### 3.4 `Card` table in Prisma

There is a **`Card` model** (catalog-style: color, type, value, `imageUrl`). **Gameplay does not use it**; cards are entirely the in-memory/JSON `Card` type from `utils.ts`. The table is effectively **unused** for the current flow (possible future asset pipeline or analytics).

---

## 4. Game engine — what the rules actually do

Implementation: `src/game-engine/uno-logic.ts` + types in `utils.ts`.

### 4.1 Deck

- **108 cards**: standard UNO-style counts (one `0` per color, two of each `1–9`, two per action per color, 4 wild, 4 wild draw 4).
- **Shuffle**: Fisher–Yates.
- **Opening discard**: draws until the top card is a **number** (avoids starting on an action/wild).

### 4.2 Playability (`canPlayCard`)

- **Wild / Wild Draw 4**: always playable.
- **Others**: match **current color** or **current number** (`value`). Action cards (skip, reverse, draw2) rely on **color** matching when `currentNumber` is undefined after a wild, etc.—aligned with typical house rules but not exhaustively documented in code.

### 4.3 Effects (simplified)

- **Skip**: advances turn **once** (see [§7](#7-known-gaps--bugs) for 2-player nuance).
- **Reverse**: flips `direction` (`1` / `-1`); with **two players**, reversing direction **does not** duplicate the official “Reverse = Skip” behavior—you may want to align with published 2-player UNO rules later.
- **Draw 2 / Wild Draw 4**: increments `drawCount`; **draw** path applies stacked count then resets `drawCount` and advances turn.
- **Wild**: sets `currentColor` from client-chosen color; clears `currentNumber`.
- **Win**: empty hand sets `gameStatus` to `finished` and sets `winner` to **current player index**.

### 4.4 UNO-related helpers

- `playCard` sets `hasCalledUno = true` when hand size becomes **1** (auto-flags without a separate button flow).
- `callUno` exists in the engine; the **API** `callUno.ts` only validates “one card” and returns success **without persisting** any flag in the database.
- When reconstructing `GameState` in API handlers, **`hasCalledUno` is always reset to `false`**, so UNO state is **not durable** across requests.

### 4.5 Serialization

- `serializeGameState` / `deserializeGameState` wrap `JSON.stringify` / `parse`. The DB uses **per-field** JSON strings for `deck`, `discardPile`, and each `hand`, not necessarily the full `GameState` blob—**the split between columns and engine state must stay in sync** when you add fields.

---

## 5. HTTP API — contracts and behavior

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/games/createGame` | POST | Body: `{ userId, gameType: "ai" \| "online" }`. Creates `GameSession`, two `GamePlayer` rows, shuffled state. Returns `gameId`, `passcode`, message. |
| `/api/games/joinGame` | POST | Body: `{ userId, passcode }`. Intended to activate online game when P2 joins. **See bugs below.** |
| `/api/games/getGameState` | GET | Query: `gameId`. Returns parsed JSON including **all players’ hands**. **No authentication** on this route. |
| `/api/games/playCard` | POST | Body: `{ gameId, cardId, chosenColor?, userId }`. Validates turn using `userId` from body vs `currentPlayer`. Runs `playCard` engine; updates DB; logs `Move`. |
| `/api/games/drawCard` | POST | Body: `{ gameId, userId? }`. Draws 1 or `drawCount` cards. **Does not verify `userId` or turn** in the handler. |
| `/api/games/callUno` | POST | Validates one card; **does not update DB**. |
| `/api/games/aiMove` | POST | Body: `{ gameId }`. If current player has `userId === null`, AI plays or draws; updates DB. |

**Trust model today**: Game routes rely on **client-supplied `userId`** for some checks. There is **no mandatory session-to-user binding** on these handlers (they are plain Next.js API routes, not wrapped with Blitz `api()` session context). Treat this as **prototype-only** from a security perspective.

---

## 6. Frontend — how the player experience works

### 6.1 Pages

- **`/` (`index.tsx`)**: Welcome; links to `/games/new?type=online` or `type=ai`; logout via Blitz `logout` mutation.
- **`/games/new`**: Creates or joins game via `fetch` to game APIs; for online, shows passcode after create; AI redirects straight to `/games/[id]`.
- **`/games/[id]`**: Polls `getGameState` every **2 seconds**; sets “your turn” from `currentPlayer.userId === user?.id`. Renders `GameBoard`, `PlayerHand`, Draw button when active and your turn. For AI games, if current player is AI, triggers **`aiMove`** after 1s delay (can fire multiple times across polls if not guarded—worth hardening).

### 6.2 Components

- **`GameBoard`**: Opponent summary (name + hand size), deck count, top discard via `Card`, current color/number/draw stack, direction text.
- **`PlayerHand`**: Uses `getValidCards` locally for UX; wild flow opens Mantine `Modal` to pick color then calls `playCard` API.
- **`Card`**: Colored box + emoji/text for card type; not image-based (despite unused DB `imageUrl`).

### 6.3 Auth in the UI

- `useCurrentUser` → Blitz `useQuery(getCurrentUser)`. Game creation requires a logged-in user; game pages don’t redirect unauthenticated users explicitly in the snippet reviewed—product decision for later.

---

## 7. Known gaps & bugs (prioritize before “ship”)

Use this as a checklist when handing work to another LLM.

1. **Online join vs create**: `createGame` already creates **two** `GamePlayer` rows (P2 often with `userId: null` for online). `joinGame` **creates another** `GamePlayer` instead of **updating** the placeholder row. That can yield **three players** in one game or duplicate `playerIndex` semantics—**online PvP is likely broken** until join is redesigned (e.g. `update` P2 row with joiner’s `userId`, or defer P2 creation until join).
2. **Security — impersonation**: `userId` in request bodies can be **spoofed**. Harden by resolving the user from **Blitz session** inside each handler (or middleware) and ignoring client `userId`.
3. **Security — information leak**: `getGameState` returns **full opponent hand**. For fair online play, response should be **scoped per viewer** (only your hand + opponent count, or auth + membership check).
4. **`drawCard` authorization**: No check that the caller is the current player (or even logged in).
5. **`callUno`**: No persistence; engine UNO flags not stored in DB columns—either add fields or drop the endpoint until modeled.
6. **`Move.cardPlayed`**: Schema suggests JSON; code stores **raw card id string** for plays.
7. **AI move race**: Polling + timeout can **overlap**; consider server-side single-flight, or client debounce / version tokens.
8. **Winner field semantics**: Schema comment vs stored **player index**—fix comment or migrate to user id consistently.
9. **`GamePlayer` uniqueness**: `@@unique([gameId, userId])` doesn’t prevent duplicate `playerIndex` for different `userId` patterns; consider `@@unique([gameId, playerIndex])` if exactly two seats are invariant.
10. **Tests**: `test/index.test.tsx` is **skipped**; README’s “comprehensive test suite” overstates current coverage. Auth mutations have some tests (`forgotPassword.test.ts`, `resetPassword.test.ts`).
11. **README drift**: Mentions `blitz.config.ts` but **no such file** in repo root. “Real-time multiplayer” is closer to **short-interval polling**.
12. **`public/`**: No tracked static assets in glob; favicon reference in `Layout` may need assets added.

---

## 8. Local development — how to run

- **Env**: `DATABASE_URL` for PostgreSQL (see `.env` / `.env.test` patterns in repo).
- **Migrations**: `npx blitz prisma migrate dev` (per README).
- **Dev server**: `npm run dev` → Blitz dev on port **3000** by default.
- **DB GUI**: `npm run studio` → Prisma Studio.
- **Lint / format**: `npm run lint`; Husky **pre-commit** runs `pretty-quick --staged` (formatting), not full test suite.

---

## 9. Scripts reference (`package.json`)

| Script | Meaning |
|--------|---------|
| `dev` | `blitz dev` |
| `build` / `start` | Production build and run |
| `studio` | Prisma Studio via Blitz |
| `lint` | ESLint |
| `test` / `test:watch` | Vitest |
| `prepare` | `husky install` |

---

## 10. TypeScript & tooling notes

- **`strict` is false** in `tsconfig.json` but **`strictNullChecks`** and **`noUncheckedIndexedAccess`** are on—some game APIs use untyped `req, res` (implicit `any` on handlers).
- **Path alias**: `baseUrl: "."` with imports like `src/...`, `db`, `types`.

---

## 11. Suggested improvement directions (for you + other LLMs)

Short, high-impact order that matches “slick, good looking, fully functional”:

1. **Fix online join** and add **`@@unique([gameId, playerIndex])`** (or equivalent invariant).
2. **Bind all game mutations to session user**; remove trusted `userId` from client body.
3. **Redact `getGameState`** per requesting user; optional **WebSocket/SSE** or **Ably/Pusher** if you want true realtime.
4. **Persist UNO** (or simplify rules to “auto-UNO” only and remove misleading UI/API).
5. **Harden AI turn** execution (idempotency, server cron or queue, or single AI endpoint called once).
6. **Visual polish**: card assets (`Card.imageUrl` or static sprites), animations, sound (optional).
7. **Tests**: engine unit tests (`uno-logic`), API integration tests with Prisma test DB, one React smoke test for game page with mocked fetch.
8. **Align README** with actual architecture (polling, config files, test status).

---

## 12. Quick FAQ (for interviews or handoff)

**Q: Is it “real-time”?**  
A: It uses **HTTP polling every 2 seconds**, not WebSockets—unless you add them.

**Q: Where is the source of truth for the game?**  
A: **PostgreSQL** rows on `GameSession` + `GamePlayer`, updated after each engine transition in the API handlers.

**Q: How does AI work?**  
A: Client detects `currentPlayer.userId === null` and `gameType === "ai"`, then POSTs **`aiMove`**, which picks first valid card or draws.

**Q: Is multiplayer production-safe?**  
A: **Not yet**—join logic and authz on APIs need work (see [§7](#7-known-gaps--bugs)).

**Q: What should I tell another LLM first?**  
A: Send this file plus the **specific feature** you want (e.g. “fix joinGame to update P2 row”) and mention **Blitz 3 + Next 15 Pages Router + Prisma 6**.

---

*Generated as a snapshot of the repository structure and code paths. Update this document when you fix join flow, auth, or realtime strategy so future agents stay aligned.*
