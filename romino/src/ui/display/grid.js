import { gridCoinCenterPx, syncGridCoinPositions } from './grid-coins.js';
import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { PIP_COLOR, SUIT_COLOR, cardRank, cardSuit, cardColor, dieSVG, diePipRotationDeg, isSlotForbidden,
  squareAlignment, squareDisplayIndex, squareIndexColor, squareIndexSlot, squareIndexTileColor,
  squarePartialConverted, squareDieLocked, refreshGridCoins,
  isDieSelectable, squareFourSquareBarOrientation } from '../../logic/cards.js';
import { getGridTotal, cardIsGridRepositionable } from '../../logic/sweeps.js';

/** Render the small slot-count indicator squares (top-right corner).
 *  Only shown on in-tray cards (action bar), not on placed grid cards. */
function renderSlotIndicator(slotCount, inTray) {
  if (!settings.diceDecks || !inTray) return '';
  const squares = Array(slotCount).fill('<span></span>').join('');
  return `<div class="card-slot-indicator">${squares}</div>`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatRank(rank) {
  return rank === ' ' ? '&nbsp;' : rank;
}

export function renderHolderDice(cardId, si) {
  const card    = state.cards[cardId];
  const dieId   = card.slots[si];
  const slotKey = `${cardId}-${si}`;

  // Inactive slot — render nothing
  if (dieId === undefined) return '';

  if (dieId === null) {
    const isForbidden = state.selectedDieId !== null && state.grid.includes(cardId)
      && isSlotForbidden(cardId, si, state.selectedDieId);
    const forbiddenClass = isForbidden
      ? (settings.paidSlots && settings.scoring ? ' is-forbidden' : ' is-forbidden is-hard-forbidden')
      : '';
    return `<div class="holder-dice${forbiddenClass}" data-slot="${slotKey}" data-card-id="${cardId}" data-slot-idx="${si}"></div>`;
  }

  const dv               = state.dice[dieId].value;
  const interactionLocked = squareDieLocked(cardId, si);
  const duplicateLocked   = state.phase === 'place-dice' && !isDieSelectable(dieId);
  const locked            = !state.currentRoll.includes(dieId) || interactionLocked || duplicateLocked;
  const isNew             = state.currentRoll.includes(dieId) && state.diceAccentActive && !interactionLocked;
  const isSelected  = state.selectedDieId === dieId;
  const newBorderHex = (dv === 1 || dv === 6) ? '#5c5e66' : (PIP_COLOR[dv] ?? '#5c5e66');
  const newBorderStyle = isNew
    ? ` style="--new-border-color:${hexToRgba(newBorderHex, 0.5)}"`
    : '';

  return `<div class="holder-dice${isNew ? ' is-new' : ''}${isSelected ? ' is-selected' : ''}"${newBorderStyle} data-slot="${slotKey}" data-card-id="${cardId}" data-slot-idx="${si}">
    <div class="die-wrapper${locked ? ' is-locked' : ''}" data-name="dice_filled_pips" data-die-id="${dieId}" data-slot="${slotKey}"${locked ? ' data-locked="true"' : ''}>
      ${dieSVG(dv, 40, diePipRotationDeg(si, dv, cardId))}
    </div>
  </div>`;
}

function formatSquareIndex(text) {
  return text === ' ' ? '&nbsp;' : text;
}

function peekUnconvertedLayout(cardId, card, gameOver = false) {
  if (gameOver) return false;
  return card.filled && settings.peekUnconvertedLayout && state.peekUnconvertedCards.has(cardId);
}

function peekableCls(card, inTray, gameOver = false) {
  if (gameOver) return '';
  return settings.peekUnconvertedLayout && !inTray && card.filled ? ' converter-card--peekable' : '';
}

function renderSquareTile(cardId, si, bordered = true) {
  const tileCls = bordered ? ' square-tile--bordered' : '';
  return `<div class="square-tile${tileCls}">${renderHolderDice(cardId, si)}</div>`;
}

function renderFourSquareIndexTile(cardId) {
  const text = formatSquareIndex(squareDisplayIndex(cardId));
  const { bg, border } = squareIndexTileColor(cardId);
  const borderStyle = border ? ` border:2px solid ${border};` : '';
  return `<div class="square-tile square-tile--index" style="background:${bg};${borderStyle}">
    <div class="square-index-text">${text}</div>
  </div>`;
}

function renderFourSquareCell(cardId, si, bordered = true) {
  if (squareIndexSlot(cardId) === si) {
    return renderFourSquareIndexTile(cardId);
  }
  return renderSquareTile(cardId, si, bordered);
}

function renderFourSquareBar(cardId, converted = false) {
  const orient = squareFourSquareBarOrientation(cardId);
  if (orient === 'center') return '';
  const barCls = converted ? ' square-bar--converted' : '';
  return `<div class="square-bar square-bar--${orient}${barCls}"><div class="square-bar__sep"></div></div>`;
}

function renderFourSquareTiles(cardId, bordered = true, converted = false) {
  const cell = (si) => renderFourSquareCell(cardId, si, bordered);
  return `${renderFourSquareBar(cardId, converted)}<div class="square-tiles square-tiles--four">
    ${cell(0)}${cell(1)}${cell(3)}${cell(2)}
  </div>`;
}

/** Figma cornverter structure: absolute bar + unified flex-wrap tile grid.
 *  Tiles 0,1 sit in the top row; tile 2 wraps to bottom-right.
 *  The hor/ver bars are purely decorative and use pointer-events:none. */
function renderSquareWrapperContent(cardId, alignment, converted = false) {
  if (settings.fourSquare) {
    return renderFourSquareTiles(cardId, !converted, converted);
  }
  const barCls = converted ? ' square-bar--converted' : '';
  if (alignment === 'horizontal') {
    return `<div class="square-bar square-bar--hor${barCls}"><div class="square-bar__sep"></div></div>
      <div class="square-tiles">
        ${renderSquareTile(cardId, 0, false)}
        ${renderSquareTile(cardId, 1, false)}
        ${renderSquareTile(cardId, 2, true)}
      </div>`;
  }
  if (alignment === 'vertical') {
    return `<div class="square-bar square-bar--ver${barCls}"><div class="square-bar__sep"></div></div>
      <div class="square-tiles">
        ${renderSquareTile(cardId, 0, true)}
        ${renderSquareTile(cardId, 1, false)}
        ${renderSquareTile(cardId, 2, false)}
      </div>`;
  }
  return `<div class="square-tiles">
    ${renderSquareTile(cardId, 0)}
    ${renderSquareTile(cardId, 1)}
    ${renderSquareTile(cardId, 2)}
  </div>`;
}

function renderSquareCardHTML(cardId, inTray = false, gridDraggable = false, opts = {}) {
  const gameOver = opts.gameOver === true;
  const card = state.cards[cardId];
  const gridDragCls  = gridDraggable ? ' converter-card--grid-draggable' : '';
  const selectedCls  = state.selectedCardId === cardId ? ' is-selected' : '';
  const previewIsNew = !!card.scorePreviewNew;
  const scorePreviewHTML = card.showScorePreview
    ? `<div class="score-preview${previewIsNew ? ' is-new' : ''}">🪙</div>`
    : '';
  const indexText = formatSquareIndex(squareDisplayIndex(cardId));
  const indexColor = squareIndexColor(cardId);
  const fourSquare = settings.fourSquare;
  const fourSquareCls = fourSquare ? ' converter-card--four-square' : '';
  const peekCls = peekableCls(card, inTray, gameOver);
  const indexSlot = fourSquare ? squareIndexSlot(cardId) : null;
  const indexSlotAttr = indexSlot !== null ? ` data-index-slot="${indexSlot}"` : '';

  if (card.filled && !peekUnconvertedLayout(cardId, card, gameOver)) {
    if (squarePartialConverted(cardId)) {
      const align = squareAlignment(cardId);
      return `<div class="converter-card converter-card--square converter-card--filled${fourSquareCls}${inTray ? ' in-tray' : ''}${gridDragCls}${selectedCls}${peekCls}" data-card-id="${cardId}" style="color:${indexColor}">
        <div class="square-wrapper square-wrapper--converted">${renderSquareWrapperContent(cardId, align, true)}</div>
        <div class="card-index card-index--square card-index--square-partial">${indexText}</div>
        ${scorePreviewHTML}
      </div>`;
    }
    if (fourSquare) {
      return `<div class="converter-card converter-card--square converter-card--filled${fourSquareCls}${inTray ? ' in-tray' : ''}${gridDragCls}${selectedCls}${peekCls}" data-card-id="${cardId}" style="color:#fff">
        <div class="square-wrapper square-wrapper--converted" style="background:${indexColor}"></div>
        <div class="card-index card-index--square card-index--square-filled">${indexText}</div>
        ${scorePreviewHTML}
      </div>`;
    }
    // Full convert: white wrapper, no dice, large centered index
    return `<div class="converter-card converter-card--square converter-card--filled${inTray ? ' in-tray' : ''}${gridDragCls}${selectedCls}${peekCls}" data-card-id="${cardId}" style="color:${indexColor}">
      <div class="square-wrapper square-wrapper--converted"></div>
      <div class="card-index card-index--square card-index--square-filled">${indexText}</div>
      ${scorePreviewHTML}
    </div>`;
  }

  const alignment = squareAlignment(cardId);
  if (fourSquare) {
    return `<div class="converter-card converter-card--square${fourSquareCls}${inTray ? ' in-tray' : ''}${gridDragCls}${selectedCls}${peekCls}" data-card-id="${cardId}"${indexSlotAttr} style="color:${indexColor}">
      <div class="square-wrapper">${renderSquareWrapperContent(cardId, alignment)}</div>
      ${scorePreviewHTML}
    </div>`;
  }
  return `<div class="converter-card converter-card--square${inTray ? ' in-tray' : ''}${gridDragCls}${selectedCls}${peekCls}" data-card-id="${cardId}" style="color:${indexColor}">
    <div class="square-wrapper">${renderSquareWrapperContent(cardId, alignment)}</div>
    <div class="card-index card-index--square">${indexText}</div>
    ${scorePreviewHTML}
  </div>`;
}

export function renderCardHTML(cardId, inTray = false, gridDraggable = false, opts = {}) {
  const card      = state.cards[cardId];
  const gameOver  = opts.gameOver === true;

  if (card.empty) {
    return `<div class="converter-card converter-card--empty" data-card-id="${cardId}"></div>`;
  }

  if (settings.square) {
    return renderSquareCardHTML(cardId, inTray, gridDraggable, opts);
  }

  const rank      = cardRank(cardId);
  const rankHTML  = formatRank(rank);
  const suit      = cardSuit(cardId);
  const color     = cardColor(cardId);
  const textColor = suit ? SUIT_COLOR[suit] : (color && color.toUpperCase() !== '#FFFFFF' ? color : '#D3D6E5');

  const peekCls = peekableCls(card, inTray, gameOver);

  if (card.filled && !peekUnconvertedLayout(cardId, card, gameOver)) {
    const slotCountFilled = card.slotCount ?? 3;
    if (slotCountFilled === 1 && !settings.vSuitDominoFill && suit === 'V') {
      return `<div class="converter-card converter-card--filled${peekCls}" data-card-id="${cardId}" style="color:#CCB400">
        <div class="card-index card-index--filled">
          <span class="card-rank card-rank--filled">*</span><span class="card-suit card-suit--filled">V</span>
        </div>
      </div>`;
    }
    if (slotCountFilled === 1 && settings.vSuitDominoFill && suit === 'V') {
      return `<div class="converter-card converter-card--filled converter-card--domino${peekCls}" data-card-id="${cardId}" style="color:#CCB400">
        <div class="card-index card-index--filled">
          <span class="card-rank card-rank--filled">*</span><span class="card-suit card-suit--filled">&nbsp;</span>
        </div>
        <div class="card-dice card-dice--center">
          <div class="dice-tile dice-tile--center">${renderHolderDice(cardId, 1)}</div>
        </div>
      </div>`;
    }
    if (slotCountFilled === 1) {
      return `<div class="converter-card converter-card--filled${peekCls}" data-card-id="${cardId}" style="color:${textColor}">
        <div class="card-index card-index--filled">
          <span class="card-rank card-rank--filled">*</span>${suit ? `<span class="card-suit card-suit--filled">${suit}</span>` : ''}
        </div>
      </div>`;
    }
    if (slotCountFilled === 2 && !settings.vSuitDominoFill && !gameOver) {
      return `<div class="converter-card converter-card--filled${peekCls}" data-card-id="${cardId}" style="color:#CCB400">
        <div class="card-index card-index--filled">
          <span class="card-rank card-rank--filled">${rankHTML}</span><span class="card-suit card-suit--filled">V</span>
        </div>
      </div>`;
    }
    if ((slotCountFilled === 2 && (gameOver || settings.vSuitDominoFill))
        || (slotCountFilled === 3 && suit === 'V' && !gameOver)) {
      return `<div class="converter-card converter-card--filled converter-card--domino${peekCls}" data-card-id="${cardId}" style="color:#CCB400">
        <div class="card-index card-index--filled">
          <span class="card-rank card-rank--filled">${rankHTML}</span><span class="card-suit card-suit--filled">&nbsp;</span>
        </div>
        <div class="card-dice">
          <div class="dice-tile dice-tile--bottom dice-tile--v-suit">
            ${renderHolderDice(cardId, 0)}${renderHolderDice(cardId, 2)}
          </div>
        </div>
      </div>`;
    }
    return `<div class="converter-card converter-card--filled${peekCls}" data-card-id="${cardId}" style="color:${textColor}">
      <div class="card-index card-index--filled">
        <span class="card-rank card-rank--filled">${rankHTML}</span>${suit ? `<span class="card-suit card-suit--filled">${suit}</span>` : ''}
      </div>
    </div>`;
  }

  const gridDragCls  = gridDraggable ? ' converter-card--grid-draggable' : '';
  const selectedCls  = state.selectedCardId === cardId ? ' is-selected' : '';
  const vSuitCls     = suit === 'V' ? ' converter-card--v-suit' : '';
  const suitDisplay  = suit === 'V' ? '&nbsp;' : suit;
  const previewIsNew = !!card.scorePreviewNew;
  const slotCount    = card.slotCount ?? 3;
  const scorePreviewHTML = card.showScorePreview ? `<div class="score-preview${previewIsNew ? ' is-new' : ''}">🪙</div>` : '';
  const slotIndicatorHTML = renderSlotIndicator(slotCount, inTray);

  const baseClass = `converter-card${inTray ? ' in-tray' : ''}${gridDragCls}${vSuitCls}${selectedCls}${peekCls}`;

  if (slotCount === 2) {
    // Rank-only card: index + two holders at the bottom, no suit slot at the top
    const compactFillCls = settings.vSuitDominoFill ? '' : ' converter-card--2slot-compact-fill';
    return `<div class="${baseClass} converter-card--2slot${compactFillCls}" data-card-id="${cardId}" style="color:#CCB400">
      ${scorePreviewHTML}${slotIndicatorHTML}
      <div class="card-index">
        <span class="card-rank">${rankHTML}</span><span class="card-suit">&nbsp;</span>
      </div>
      <div class="card-dice">
        <div class="dice-tile dice-tile--bottom dice-tile--v-suit">${renderHolderDice(cardId, 0)}${renderHolderDice(cardId, 2)}</div>
      </div>
    </div>`;
  }

  if (slotCount === 1) {
    // Suit-only card: single centered holder
    const compactFillCls = settings.vSuitDominoFill || suit !== 'V' ? '' : ' converter-card--1slot-compact-fill';
    const indexHTML = suit === 'V'
      ? `<div class="card-index">
          <span class="card-rank">*</span><span class="card-suit">&nbsp;</span>
        </div>`
      : '';
    return `<div class="${baseClass} converter-card--1slot${compactFillCls}" data-card-id="${cardId}" style="color:${textColor}">
      ${scorePreviewHTML}${slotIndicatorHTML}
      ${indexHTML}
      <div class="card-dice card-dice--center">
        <div class="dice-tile dice-tile--center">${renderHolderDice(cardId, 1)}</div>
      </div>
    </div>`;
  }

  // Default 3-slot card
  return `<div class="${baseClass}" data-card-id="${cardId}" style="color:${textColor}">
    ${scorePreviewHTML}${slotIndicatorHTML}
    <div class="card-index">
      <span class="card-rank">${rankHTML}</span>${suit ? `<span class="card-suit">${suitDisplay}</span>` : ''}
    </div>
    <div class="card-dice">
      <div class="dice-tile dice-tile--top">${renderHolderDice(cardId, 1)}</div>
      <div class="dice-tile dice-tile--bottom">${renderHolderDice(cardId, 0)}${renderHolderDice(cardId, 2)}</div>
    </div>
  </div>`;
}

export function renderGrid() {
  const el = document.getElementById('grid-container');
  const se = state.scoringExit;
  if (se?.phase === 'run') el.classList.add('is-scoring-sweep');
  else el.classList.remove('is-scoring-sweep');

  el.classList.toggle('grid-4x4', settings.extendedGrid);

  const tpl = document.querySelector('.template');
  if (se?.phase === 'run') tpl?.classList.add('template--score-sweep');
  else tpl?.classList.remove('template--score-sweep');

  refreshGridCoins();

  const gridHTML = Array(getGridTotal()).fill(0).map((_, i) => {
    const liveId    = state.grid[i];
    const cardId    = liveId ?? state.sweepOverlay[i] ?? null;
    const isOverlay = liveId === null && cardId !== null;
    const gridDrag  = !isOverlay && cardId !== null && cardIsGridRepositionable(cardId);
    let slotExtra = '';
    let slotStyle = '';
    if (se && cardId !== null && se.lineSlots.includes(i)) {
      const order = se.lineSlots.indexOf(i);
      slotStyle = ` style="--exit-order:${order}"`;
      if (se.phase === 'wait') {
        slotExtra = ' grid-slot--score-pending';
      } else if (se.phase === 'run') {
        slotExtra = ` grid-slot--score-sweep grid-slot--score-sweep--${se.lineKey}`;
      }
    }
    return `<div class="grid-slot${cardId !== null ? ' is-filled' : ''}${slotExtra}" data-grid-slot="${i}"${slotStyle}>
      ${cardId !== null ? renderCardHTML(cardId, false, gridDrag) : ''}
    </div>`;
  }).join('');

  let coinHTML = '';
  if (settings.square && settings.scoring) {
    for (const key of state.gridCoins) {
      const { cx, cy } = gridCoinCenterPx(key);
      coinHTML += `<div class="grid-coin" data-coin-key="${key}" style="left:${cx}px;top:${cy}px">🪙</div>`;
    }
  }

  el.innerHTML = gridHTML + coinHTML;
  requestAnimationFrame(() => syncGridCoinPositions());
}
