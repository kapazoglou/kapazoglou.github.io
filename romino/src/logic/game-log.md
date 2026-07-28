---
module: game-log
layer: logic
v: 1.2
date: 2026-07-28
deps: [state, settings]
---
# Game log

Per-game session stats + lifetime aggregates per settings configuration in `localStorage`.

## Keys
- `romino-v2-game-log` — ring buffer (last 100 `GameRecord`s)
- `romino-v2-lifetime-stats` — map `{ [configId]: { settings, stats } }`; bucket created on first game over for that config

## Config identity
- `settingsConfigId(settings)` — stable hash from sorted settings snapshot
- `getLifetimeStats(settings?)` — stats for one config (empty if none yet)
- `listLifetimeConfigs()` — all buckets with at least one game

## Lifetime stats fields
- `tileCounts` — tiles converted (`suit:rank` → count)
- `sweepTileCounts` — tiles cleared in sweeps (`suit:rank` → count)
- `sweepPatternCounts` — ordered sweep signatures (`Z:7|Z:8|Z:9` → count)
- `sweepSignature(tiles)` — build signature from sweep run tiles

## Session hooks
- `recordDiceOutcome` — every `rollValue()` (tray roll + outer reroll)
- `recordStarsEarned` — confirm star matches
- `recordStarSpent` — ace/joker convert, outer reroll
- `recordTileCreated` — `convertColumn`
- `beginBankCycle` / `recordSweepRun` / `commitBankCycle` — one confirm-cycle bank in `resolveSweepsAnimated`

## Game over
- `buildGameRecord({ reason })` — includes `snapshotSettings()`
- `appendGameRecord` + `updateLifetimeStats` (creates config bucket if new)

## Read API
- `getGameLog()`, `getGameLogEntry(id)`, `getLifetimeStats()`, `getLifetimeConfig()`, `listLifetimeConfigs()`, `getLifetimeDerived()`, `exportGameLogJSON()`, `rebuildLifetimeStatsFromLog()`
