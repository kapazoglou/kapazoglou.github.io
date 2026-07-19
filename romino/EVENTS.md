# römino v2 — Event & Transition Tree

## Phases

```
idle  ──►  rolled  ──►  animating  ──►  idle  ──► ...
                │           │
                │           └── stars → convert → sweep → bank pips
                │
           pool < nRoll (idle) ──► replay / game-over sheet
```

---

## Turn flow

```
handleRollButton()
│
├── phase === 'idle'  →  rollDice() if dicePool >= nRoll
│   │                    else game-over sheet (pool < nRoll)
│   ├── dicePool -= nRoll
│   ├── actionBar = n random dice
│   └── phase = 'rolled'
│
└── phase === 'rolled'  →  confirmTurn() then rollDice() (same click)
    ├── dicePool += actionBar.length (unplaced return to pool)
    ├── actionBar = []
    ├── phase = 'animating' (input frozen)
    ├── runConfirmAnimations()
    │   ├── collectStarsToHUD() — row gap pips → score (pre-convert, dice still visible)
    │   ├── animateConverts() — stack → tile per column; dicePool += 3 per convert
    │   ├── resolveSweepsAnimated() — beat + sweep each run; star pips → points
    │   └── phase = 'idle'
    └── rollDice() — fresh tray with slide-in if dicePool > 0
```

---

## Placement (rolled phase only)

```
select die (action bar)  →  show yellow triangles
tap triangle / drag-drop  →  placeDie(col, kind)
tap placed die (this turn)  →  returnDieToBar()
```

Constraints: center-first column, nPlace cap, adjacentColumnsOnly, oneToOne rules.

---

## Settings

Triple-click HUD score → settings panel (nDice, nRoll, nPlace, toggles). Changing counts/rules resets game.
