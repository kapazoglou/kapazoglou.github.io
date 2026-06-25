---
Name: kapazoglou
Role: UX Designer · game designer · sole steward of römino
Motivation: Ship a tactile, phone-first dice-and-card puzzle that feels designed—not generated. Own the visual and interaction truth; delegate structural fidelity to the agent.
Idea: römino — place domino-style dice onto card slots, score sweeps, earn coins, survive the grid. Rule variants are first-class toggles, not forks.
Project: römino (vanilla JS/CSS/HTML, Vite dev server, GitHub Pages at kapazoglou.github.io/romino)
Vision: A polished mobile game with Figma-accurate visuals, snappy animations, and a modular codebase agents can map without breaking layer invariants. Every feature traces to a design decision, not a guess.
---

# User intent anchor

Read this before inferring scope. When in doubt, **ask** — do not silently assume.

## Who I am

- **UX Designer** with ADHD. I hold the UI/UX mental model; you hold topology and code relationships.
- I work in **Figma** — treat Figma specs and exports as the source of truth for pixels, colors, spacing, and interaction feel.
- I need **clear, scoped questions** when intent is ambiguous. A short clarifying question beats a wrong implementation.
- Momentum is fine on **trivial** changes (typos, renames). Everything else: confirm shape before code.

## What römino is

A **phone-first** web game:

1. Draw cards into an action bar; drag dice onto card slots on a grid.
2. Fill cards → convert → score **sweeps** (sets, runs, flushes, domino chains, etc.).
3. Earn and spend **coins**; optional constraints (forbidden slots, cool-off, paid slots, coin-flip dice).
4. **Square v1** is the active ruleset — dozens of toggles in `settings.js` let me experiment without branching the codebase.

Stack: **vanilla HTML, CSS, JS** (ES modules). Vite for dev/build only. No frameworks.

## How I want to work with you

| I decide | You steward |
|----------|-------------|
| Visual design, layout, feel, copy | Layer boundaries, state ownership, blast radius |
| Feature intent and edge-case behaviour | Topology mapping before changes |
| When something ships | Invariant tracing, security seams, DRY/KISS |
| Figma vs code conflicts (I pick) | Surface the conflict — never pick silently |

**Git:** Propose commits and messages in prose. **Commit only when I explicitly ask.**

**Multi-module changes:** Discuss and plan first (Plan mode). Do not refactor adjacent modules without flagging.

**Settings leakage:** If a feature needs a toggle, wire it through `SETTINGS_CONFIG` — don't hardcode behaviour I can't turn off.

## Quality bar

- Coherent, operational, builds cleanly.
- Animations respect `spd()` / `fastAnimations`.
- `state` in `logic/` is truth; DOM follows via `render()`.
- Would I be comfortable showing this diff to a senior engineer? If not, flag what's missing.

## Communication preferences

- Measured, rigorous, concise — not walls of prose or tutorial voice.
- Use **ASCII** for quick UI placement mockups when words aren't enough.
- If my request feels messy, ask me to add a `<thinking>...</thinking>` block so you can align to my actual mental model.
- Disagree honestly when code or design would create debt.

## Non-goals (unless I say otherwise)

- Framework migrations, TypeScript, CSS preprocessors.
- Scope creep into modules I didn't mention.
- Pixel-tweaking without Figma reference or my explicit direction.
