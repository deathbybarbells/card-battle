/* =========================================================
   combat.js – Turn flow & boss behavior (instrumented)
   ========================================================= */
import { pushLog } from './log.js';
import { checkEnd } from './end.js';
import { renderAll } from './ui.js';
import { drawUpTo } from './deck.js';
import { playSFX } from './sound.js';

const trace = m => window.__cccPhaseTrace && window.__cccPhaseTrace(m);

/* Boss action script (simple cycling pattern) */
const BOSS_ACTIONS = [
  { key:'claw',   text:'Claw swipe',     base:6, hits:1, pierce:0,    corruption:0 },
  { key:'bite',   text:'Heavy bite',     base:9, hits:1, pierce:0.25, corruption:0 },
  { key:'flurry', text:'Wing flurry',    base:4, hits:2, pierce:0,    corruption:0 },
  { key:'breath', text:'Corrupt breath', base:5, hits:1, pierce:0.15, corruption:2 }
];

function bossScaling(turn) {
  return Math.floor(turn / 2);
}

function pickBossIntent(state) {
  const idx = (state.turn - 1) % BOSS_ACTIONS.length;
  return { ...BOSS_ACTIONS[idx] };
}

function resetTurnMetrics(state) {
  state._turnStats = { dmgOut:0, dmgIn:0, cards:0, blockGained:0 };
}

/* ------------------ Exports ------------------ */

export function initializeBossIntent(state) {
  state.bossIntent = pickBossIntent(state);
  pushLog(state, `Boss prepares: ${state.bossIntent.text}.`);
}

export function startPlayerTurn(state) {
  state.phase = 'player';
  state.player.block = 0;
  const focusPlays = (state.meta && state.meta.focusPlays) || 0;
  const baseEnergy = 3 + focusPlays;
  state.player.energy = Math.min(state.player.maxEnergy, baseEnergy);
  drawUpTo(state, 5);
  resetTurnMetrics(state);
  pushLog(
    state,
    `[Turn ${state.turn}] Your turn begins (E ${state.player.energy}/${state.player.maxEnergy}, Hand ${state.player.hand.length}).`
  );
  trace(`TURN START: ${state.turn} energy=${state.player.energy} hand=${state.player.hand.length}`);
  renderAll(state);
}

export function endPlayerTurn(state) {
  if (state.phase !== 'player') return;
  if (state._turnStats) {
    pushLog(
      state,
      `[Turn ${state.turn} Summary] Cards:${state._turnStats.cards} DmgOut:${state._turnStats.dmgOut} DmgIn:${state._turnStats.dmgIn} BlockGained:${state._turnStats.blockGained}`
    );
    trace(
      `SUMMARY: Turn ${state.turn} cards=${state._turnStats.cards} out=${state._turnStats.dmgOut} in=${state._turnStats.dmgIn} block=${state._turnStats.blockGained}`
    );
  }
  state.phase = 'enemy';
  trace('PHASE -> enemy (begin enemyTurn)');
  pushLog(state, 'End of your turn.');
  enemyTurn(state);
}

export function enemyTurn(state) {
  trace('ENEMY TURN ENTER');
  const intent = state.bossIntent;

  if (!intent) {
    console.error('[CCC] Missing bossIntent');
    pushLog(state, '!! ERROR: No boss intent; skipping enemy turn.');
    recoverToNextTurn(state);
    return;
  }
  if (typeof intent.base !== 'number' || typeof intent.hits !== 'number') {
    console.error('[CCC] Corrupt bossIntent object:', intent);
    pushLog(state, '!! ERROR: Corrupt boss intent.');
    recoverToNextTurn(state);
    return;
  }

  pushLog(state, `Boss acts: ${intent.text}.`);
  playSFX('monsterAttack');

  const scale = bossScaling(state.turn);
  const corruptionBonus = Math.floor(state.corruption / 3);
  const totalScale = scale + corruptionBonus;

  let totalDealt = 0;
  for (let i = 0; i < intent.hits; i++) {
    const raw = intent.base + totalScale;
    const dmgDealt = applyBossDamage(state, raw, intent.pierce);
    totalDealt += dmgDealt;

    pushLog(
      state,
      `  Hit ${i + 1}: ${dmgDealt} dmg (raw ${raw}${
        intent.pierce ? `, pierce ${Math.round(intent.pierce * 100)}%` : ''
      }).`
    );

    if (state.player.hp <= 0) break;
    spawnDamageFloater('#player', dmgDealt);

    // if any damage was blocked, play the block SFX
    if (raw - dmgDealt > 0) {
      playSFX('block');
    }
  }

  if (intent.corruption) {
    state.corruption += intent.corruption;
    pushLog(state, `Corruption +${intent.corruption} (now ${state.corruption}).`);
  }

  pushLog(state, `Boss total damage: ${totalDealt}.`);
  trace(`ENEMY TURN DEALT total=${totalDealt}`);

  if (checkEnd(state)) {
    renderAll(state);
    return;
  }

  // Advance to next turn
  state.turn += 1;
  state.bossIntent = pickBossIntent(state);
  pushLog(state, `Boss prepares: ${state.bossIntent.text}.`);
  startPlayerTurn(state);
}

function recoverToNextTurn(state) {
  state.turn += 1;
  state.bossIntent = pickBossIntent(state);
  startPlayerTurn(state);
}

// Player damage to boss
export function applyDamageToBoss(state, dmg) {
  playSFX('heroAttack');

  let absorbed = 0;
  if (state.boss.block > 0) {
    absorbed = Math.min(state.boss.block, dmg);
    state.boss.block -= absorbed;
    if (absorbed > 0) {
      playSFX('block');
    }
  }

  const actual = dmg - absorbed;
  state.boss.hp = Math.max(0, state.boss.hp - actual);

  pushLog(
    state,
    `You deal ${actual}${absorbed ? ` (blocked ${absorbed})` : ''} to the boss.`
  );
  if (actual > 0) {
    playSFX('monsterHurt');
  }
  if (state._turnStats) {
    state._turnStats.dmgOut += actual;
  }
  checkEnd(state);
}

function applyBossDamage(state, raw, pierce = 0) {
  if (pierce > 0 && state.player.block > 0) {
    const shredded = Math.floor(state.player.block * pierce);
    if (shredded > 0) {
      state.player.block = Math.max(0, state.player.block - shredded);
      pushLog(state, `  Pierce shreds ${shredded} block.`);
    }
  }
  const absorbed = Math.min(state.player.block, raw);
  state.player.block -= absorbed;
  const dmg = raw - absorbed;
  state.player.hp = Math.max(0, state.player.hp - dmg);
  if (state._turnStats) {
    state._turnStats.dmgIn += dmg;
  }
  return dmg;
}

function spawnDamageFloater(selector, dmg) {
  const host = document.querySelector(selector);
  if (!host) {
    return;
  }
  const el = document.createElement('div');
  el.className = 'dmg-floater';
  el.textContent = dmg > 0 ? `-${dmg}` : '0';
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('shown'));
  setTimeout(() => el.remove(), 900);
}

export function gainEnergyNow(state, amount = 1) {
  state.player.energy = Math.min(
    state.player.maxEnergy,
    state.player.energy + amount
  );
  pushLog(state, `+${amount} Energy (now ${state.player.energy}).`);
}

export function gainFutureEnergy(state, inc = 1) {
  state.player.maxEnergy += inc;
  pushLog(state, `Max Energy now ${state.player.maxEnergy}.`);
  playSFX('powerUp');
}

export function bossGainCorruption(state, n = 1) {
  state.corruption += n;
  pushLog(state, `Corruption +${n} (now ${state.corruption}).`);
}

export function recordCardPlay(state, { dmg = 0, block = 0 }) {
  if (!state._turnStats) {
    return;
  }
  state._turnStats.cards += 1;
  if (dmg) state._turnStats.dmgOut += dmg;
  if (block) state._turnStats.blockGained += block;
  playSFX('playCard');
}
