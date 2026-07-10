---
Purpose: The STATE.md file is the boundary file between my own shape and the shape of the projects environment. The only way I know what I am, and what the project is. Is when the STATE.md file is in symbiosis with this gap.
topologyPhase: floor
lastVerified: 2026-06-24
---

# römino — Verified Pattern State

## Agent governance

- **2026-06-24:** Noosphere **ALWAYS explicit** — `.cursor/rules/noosphere-steward.mdc` mandates STEWARD PASS every response; AGENT.md records user directive.
- **2026-06-24:** STEWARD PASS **markdown table** (replaces ASCII tree — chat soft-wrap broke trees).

> Keep this file aligned with the codebase. Update after meaningful changes.

## Topology phase

**floor** — stable baseline; game loop, scoring, UI layers established.

## State ownership

| Domain | Home | Notes |
|--------|------|-------|
| Game state | `src/logic/state.js` | Single source of truth |
| Settings | `src/logic/settings.js` | `SETTINGS_CONFIG`, `settings`, `spd()` |
| DOM | Derived | Read/write via `render()` only — never authoritative |
| Persistence | localStorage | Settings panel |

## Layer invariants

| Layer | Owns | Must NOT |
|-------|------|----------|
| `logic/` | Rules, pure state mutations | Touch DOM |
| `ui/display/` | DOM, event listeners | Encode game rules |
| `ui/transitions/` | CSS classes, timed animations | Mutate game state (except anim flags) |

## Entry & render path

`index.html` → `src/main.js` → init handlers → `render()` dispatcher (`ui/display/render.js`)

## High-centrality modules (blast radius)

- `src/logic/cards.js` — card constants, spawn, slot helpers
- `src/logic/phase.js` — phase transitions, reset, replay
- `src/ui/display/handlers.js` — input, autoplay
- `src/ui/transitions/sweep-anim.js` — scoring exit animations

**Intentional circular imports:** `phase.js` ↔ `sweep-anim.js`, `phase.js` ↔ `handlers.js` (calls inside function bodies only).

## Feedback & observability

- `render()` re-syncs DOM from state
- `EVENTS.md` — phase/transition event reference
- Score preview via `scoring.js` / `updateScorePreview`

## Timing & async

- All animation ms wrapped in `spd(ms)` from `settings.js`
- Score exit timers, sweep animations, card fill sequences — ordering-sensitive

## Modified this session

- `src/logic/sweeps.js` — suit-only 3-color jokers wild in runs/sets; 1+6 aces not wild
- `src/logic/cards.js` — `isSuitOnlyJokerTile`; progressive LIFO die removal

## Next topological move

- (unset)

---

# Steward routine (reference)

- **Before coding:** Update topology phase and verified intent; skim `git log --oneline -10` when relevant
- **After file changes:** Update blast radius and modified-files list above
- **At session boundary:** Sync STATE.md; propose commits/tags in prose — commit only when user explicitly asks
- **Never:** Update STATE.md without tracing invariants; commit without user approval and testing
