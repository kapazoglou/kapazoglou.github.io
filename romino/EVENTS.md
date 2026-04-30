# Romino — Event & Transition Tree


## Phases

```
place-card  ──►  place-dice  ──►  place-card  ──► ...
                      │
                 (full grid)
                      │
                      ▼
              place-dice (batch 2)
                      │
                 (all filled)
                      │
                      ▼
                   replay
                      │
                   REPLAY btn
                      │
                      ▼
                 place-card  (reset)
```

---

## 1. Startup / Reset

```
resetGame() / page load
│
├── state cleared, diceDeck shuffled
├── spawnCard()  →  actionBarCards = [c0]
├── phase = 'place-card'
└── render()
    └── action bar: 1 card, NO preview dice (cardsPlaced === 0)
```

---

## 2. place-card phase

### 2a. User input — card selection

```
click / pointerdown on .converter-card.in-tray
│
├── [same card already selected]  →  selectedCardId = null
└── [new card]                    →  selectedCardId = cardId
    └── render()  (card gets .is-selected)
```

### 2b. User input — card placement (tap or drag-drop)

```
tap grid-slot  |  drop card on grid-slot
│
├── [slot occupied]  →  deselect, render()
└── [slot empty]
    ├── actionBarCards.remove(cardId)
    ├── awaitingPostDiceGridPlace = false  (if set)
    ├── cardsPlaced++
    ├── grid[i] = cardId
    ├── diceAccentActive = false
    └── render()  (card lands; accent borders drop via CSS transition)
        └── setTimeout 220 ms
            └── convertFilledCards()
                ├── [nothing to convert]  →  onDone()
                └── [cards fully filled]
                    └── processCardFills()  (pip animations, fillOneCard)
                        └── onDone()
                            ├── resolveAllScoringSets()
                            │   └── [line match found]  →  → SCORING SWEEP (§4)
                            ├── render()
                            └── checkPhaseTransition()  →  (§3)
```

### 2c. User input — elsewhere tap

```
click outside card / die / grid-slot
└── selectedDieId = null, selectedCardId = null
    └── render()
```

---

## 3. checkPhaseTransition — place-card branch

```
checkPhaseTransition()  [phase === 'place-card' && actionBarCards.length === 0]
│
├── [scoringExit active]  →  return  (commitScoringExit will call again)
│
├── [currentRoll.length === 0 && cardsPlaced === 1]  ← first card ever placed
│   │   "Show preview dice before entering dice phase"
│   ├── spawnCard()  →  actionBarCards = [c1]
│   ├── newCards = {c1}
│   ├── newPreviewInCard = true
│   └── render()
│       └── action bar: card animates in (is-new, 0 ms)
│                       preview dice animate in (preview-is-new, 320/380/440 ms)
│
└── [normal path]
    ├── phase = 'place-dice'
    ├── awaitingPostDiceGridPlace = false
    ├── allSlotsFilled?
    │   ├── yes  →  pendingSecondDiceBatch = true   ← full-grid round
    │   └── no   →  pendingSecondDiceBatch = false
    ├── spawnDice(3)  →  currentRoll, trayOrder
    ├── diceAccentActive = true
    ├── newPreview = true
    └── renderWithPreviewFade()
        ├── [.upcoming-preview exists]
        │   ├── add .is-exiting to old preview strip
        │   └── setTimeout 180 ms  →  render()
        └── [no preview]  →  render()
            └── action bar (place-dice):
                  active dice  (is-new, 0/60/120 ms)
                  card ghost   (is-new, after last die + 320 ms)
                  preview dice (preview-is-new, after ghost + 320+40 ms)
```

---

## 4. Scoring sweep

```
resolveOneScoringSet()  →  startScoringExitAnimation(line, ruleId, cardIds)
│
├── scoringExit = { lineSlots, cardIds, ruleId, lineKey, phase:'wait' }
├── app.classList.add('is-scoring-exit')
└── render()  (matched cards highlighted)
    └── setTimeout 320 ms  (BEAT_MS)
        ├── scoringExit.phase = 'run'
        └── render()  (sweep animation plays)
            └── setTimeout 780 ms  (SWEEP_MS)
                └── commitScoringExit()
                    ├── grid[lineSlots] = null
                    ├── scoredSets.push(...)
                    ├── scoringExit = null
                    ├── app.classList.remove('is-scoring-exit')
                    │
                    ├── resolveAllScoringSets()
                    │   └── [another line match]  →  → SCORING SWEEP (loops)
                    │
                    └── [no more matches]
                        ├── [pendingSixDiceNewCard]          →  (§6b)
                        ├── [pendingSecondBatchAfterScoring] →  spawnSecondDiceBatch()  (§6a)
                        └── [3-dice path]
                            └── checkPhaseTransition()  →  (§3 normal path)
                                └── return  (skip extra render)
```

---

## 5. place-dice phase

### 5a. User input — die selection (tray)

```
click / pointerdown on .die-wrapper  (not locked, not in a card slot)
│
├── [same die already selected]  →  selectedDieId = null
└── [new die]                    →  selectedDieId = dieId, selectedCardId = null
    └── render()  (die gets .is-selected)
```

### 5b. User input — die placement (tap or drag-drop)

```
tap holder-dice  |  drop die on holder-dice
│
├── [slot occupied / locked]  →  deselect or no-op
└── [slot empty]
    ├── [came from another card slot]  →  clear origin slot
    ├── card.slots[si] = dieId
    ├── selectedDieId = null
    ├── updateScorePreview(cardId)  (shows 🪙 badge if card qualifies)
    └── render()
        └── checkPhaseTransition()  →  (§6)
```

### 5c. User input — tray die swap (drag only)

```
drop die onto another tray die
│
├── swap trayOrder[ia] ↔ trayOrder[ib]
├── [came from card slot]  →  clear origin slot
└── render()
```

---

## 6. checkPhaseTransition — place-dice branch

```
checkPhaseTransition()  [phase === 'place-dice' && isAllDicePlaced()]
│
├── (§6a) [isSecondDiceBatch]
│   └── convertAllGridCards()  (fill all, pip animations)
│       ├── peekAnyScoringMatch()
│       │   └── yes  →  pendingSixDiceNewCard = true
│       ├── resolveAllScoringSets()
│       │   └── [match]  →  SCORING SWEEP (§4)  →  commitScoringExit → (§6b)
│       └── [no match / after sweeps]
│           ├── [grid fully filled]  →  showReplay()  →  phase = 'replay'
│           └── render()
│
├── (§6b) [pendingSecondDiceBatch]   ← first batch, full-grid round
│   ├── processCardFills() for newly filled cards
│   └── afterConversion()
│       ├── resolveAllScoringSets()
│       │   └── [match]  →  SCORING SWEEP (§4)
│       │       pendingSecondBatchAfterScoring = true
│       │       commitScoringExit  →  spawnSecondDiceBatch()
│       └── [no match]  →  spawnSecondDiceBatch()
│           ├── isSecondDiceBatch = true
│           ├── spawnDice(3)
│           ├── newPreview = true
│           └── renderWithPreviewFade()  →  (action bar: batch-2 dice)
│
└── [normal 3-dice path]
    ├── phase = 'place-card'
    ├── spawnCard()  →  actionBarCards = [cN]
    ├── newCards = {cN}
    ├── awaitingPostDiceGridPlace = true
    └── render()
        └── action bar: card animates in (is-new)
                        preview dice shown (static, continuous from dice phase)
```

---

## 7. Replay phase

```
showReplay()
├── phase = 'replay'
└── render()
    └── action bar: REPLAY button (is-new)

click #replay-btn
└── resetGame()  →  (§1)
```

---

## 8. Game-over overlay

```
showGameOver(reason)  [called externally when applicable]
├── #game-over-reason.textContent = reason
└── #game-over-overlay.classList.add('is-visible')

click #game-over-restart
├── overlay hidden
└── resetGame()  →  (§1)
```

---

## 9. Grid card repositioning (drag only)

```
pointerdown on .converter-card--grid-draggable
│   (card on grid with no dice yet placed on it)
│
└── drag committed
    └── drop on empty grid-slot
        ├── grid[fromGridIndex] = null
        ├── grid[targetIndex] = cardId
        └── render()
            └── convertFilledCards → resolveAllScoringSets → checkPhaseTransition
                (no-ops since card has no dice)
```

---

## 10. Animation flags (consumed on first render)

| Flag | Set by | Controls |
|---|---|---|
| `newDice` | `spawnDice()` | `is-new` on tray dice |
| `newCards` | `checkPhaseTransition`, `commitScoringExit` | `is-new` on action-bar cards |
| `newPreview` | `checkPhaseTransition`, `spawnSecondDiceBatch` | `preview-is-new` + delays on dice-phase preview strip |
| `newPreviewInCard` | `checkPhaseTransition` (first-card branch) | `preview-is-new` + delays on place-card preview strip |
| `diceAccentActive` | `spawnDice`, cleared on card placement | `is-new` border on placed dice |

---

## 11. Key timing constants

| Constant | Value | Purpose |
|---|---|---|
| card-placement delay | 220 ms | Wait for box-shadow CSS transition before converting |
| `BEAT_MS` | 320 ms | Pause before sweep animation starts |
| `SWEEP_MS` | 780 ms | Duration of card sweep-out animation |
| preview fade | 180 ms | `is-exiting` fade before new dice/card renders |
| tray die stagger | 60 ms | Delay between each `is-new` die in tray |
| preview die stagger | 60 ms | Delay between each `preview-is-new` die |
| card ghost delay | `(n−1)×60 + 320` ms | After last active die, before card ghost |
| preview-after-ghost | `ghostDelay + 320 + 40` ms | After card ghost, before preview dice |
