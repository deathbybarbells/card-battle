/* =========================================================
   deck.js – Balanced deck & card play logic (single spawnBlockEffect)
   ========================================================= */
import {
  applyDamageToBoss,
  gainEnergyNow,
  gainFutureEnergy,
  recordCardPlay
} from './combat.js';
import { pushLog } from './log.js';

/* ===== Starter Cards ===== */
const STARTER_CARDS = [
  { id:'strike1', name:'Strike',  cost:1, desc:'Deal 5',                 type:'attack',  dmg:5 },
  { id:'strike2', name:'Strike',  cost:1, desc:'Deal 5',                 type:'attack',  dmg:5 },
  { id:'strike3', name:'Strike',  cost:1, desc:'Deal 5',                 type:'attack',  dmg:5 },
  { id:'guard1',  name:'Guard',   cost:1, desc:'+4 Block',               type:'block',   block:4 },
  { id:'guard2',  name:'Guard',   cost:1, desc:'+4 Block',               type:'block',   block:4 },
  { id:'focus1',  name:'Focus',   cost:2, desc:'+1 Max Energy (limit 2)',type:'maxenergy', inc:1 },
  { id:'channel', name:'Channel', cost:0, desc:'+1 Energy (Exhaust)',    type:'energy',  exhaust:true },
  { id:'riposte', name:'Riposte', cost:1, desc:'Deal 4 & Gain 3 Block',  type:'riposte', dmg:4, block:3 },
  { id:'jab1',    name:'Jab',     cost:0, desc:'Deal 2 (ping)',          type:'attack',  dmg:2 }
];

/* === Focus Cap Tracking === */
function canPlayFocus(state) {
  if (!state.meta) state.meta = {};
  if (!state.meta.focusPlays) state.meta.focusPlays = 0;
  return state.meta.focusPlays < 2;
}
function recordFocusPlay(state) {
  state.meta.focusPlays = (state.meta.focusPlays || 0) + 1;
}

/* === Public API === */
export function drawInitialDeck(state) {
  state.player.drawPile    = structuredClone(STARTER_CARDS);
  state.player.discardPile = [];
  state.player.hand        = [];
  shuffle(state.player.drawPile);
  draw(state, 5);
}

export function playCard(state, cardId) {
  if (state.phase !== 'player')
    return { played:false, reason:'not player phase' };

  const hand = state.player.hand;
  const idx  = hand.findIndex(c => c.id === cardId);
  if (idx === -1) return { played:false, reason:'no such card' };

  const card = hand[idx];
  if (card.cost > state.player.energy)
    return { played:false, reason:'insufficient energy' };

  if (card.type === 'maxenergy' && !canPlayFocus(state))
    return { played:false, reason:'focus cap reached' };

  // Pay cost
  state.player.energy -= card.cost;

  switch(card.type) {
    case 'attack': {
      const variance = Math.random() < 0.10 ? 1 : 0;
      const dmg = card.dmg + variance;
      applyDamageToBoss(state, dmg);
      pushLog(state, `Strike hits for ${dmg}.`);
      recordCardPlay(state, { dmg });
      heroAttackFlash();
      break;
    }
    case 'riposte': {
      applyDamageToBoss(state, card.dmg);
      state.player.block += card.block;
      pushLog(state, `Riposte: ${card.dmg} dmg & +${card.block} block (total ${state.player.block}).`);
      recordCardPlay(state, { dmg:card.dmg, block:card.block });
      heroAttackFlash();
      spawnBlockEffect();
      break;
    }
    case 'block': {
      state.player.block += card.block;
      pushLog(state, `Block +${card.block} (now ${state.player.block}).`);
      recordCardPlay(state, { block:card.block });
      spawnBlockEffect();
      break;
    }
    case 'maxenergy':
      gainFutureEnergy(state, card.inc || 1);
      recordFocusPlay(state);
      pushLog(state, `Max Energy +${card.inc || 1} (${state.meta.focusPlays}/2).`);
      // recordCardPlay: optional (not damage/block)
      break;
    case 'energy':
      gainEnergyNow(state);
      pushLog(state, `+1 immediate Energy.`);
      // recordCardPlay optional
      break;
    default:
      pushLog(state, `${card.name} has no implemented effect.`);
  }

  // Discard or exhaust
  if (card.exhaust) {
    pushLog(state, `${card.name} is exhausted.`);
  } else {
    state.player.discardPile.push(card);
  }
  hand.splice(idx, 1);

  return { played:true };
}

export function draw(state, n = 1) {
  while (n-- > 0) {
    if (!state.player.drawPile.length) {
      if (!state.player.discardPile.length) break;
      state.player.drawPile = state.player.discardPile;
      state.player.discardPile = [];
      shuffle(state.player.drawPile);
    }
    const card = state.player.drawPile.shift();
    if (!card) break;
    state.player.hand.push(card);
  }
}

export function drawUpTo(state, size) {
  while (state.player.hand.length < size) {
    if (!state.player.drawPile.length) {
      if (!state.player.discardPile.length) break;
      state.player.drawPile = state.player.discardPile;
      state.player.discardPile = [];
      shuffle(state.player.drawPile);
    }
    const c = state.player.drawPile.shift();
    if (!c) break;
    state.player.hand.push(c);
  }
}

/* === Visual Helpers (single versions) === */
function heroAttackFlash() {
  const heroRoot = document.getElementById('player');
  if (!heroRoot) return;
  heroRoot.classList.remove('attack');
  void heroRoot.offsetWidth;
  heroRoot.classList.add('attack');
  setTimeout(() => heroRoot.classList.remove('attack'), 400);
}

function spawnBlockEffect() {
  const heroInner = document.querySelector('#player .hero');
  if (!heroInner) return;
  const fx = document.createElement('div');
  fx.className = 'hero-shield-effect';
  heroInner.appendChild(fx);
  setTimeout(() => fx.remove(), 700);
}

/* === Utility === */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
