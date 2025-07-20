/* =========================================================
   ui.js – Rendering & FX
   Card Core Clash
   ========================================================= */

import { checkEnd } from './end.js';

/* ---------------------------------------------------------
   FX HELPERS
--------------------------------------------------------- */

/**
 * Shield pulse effect when block is gained.
 */
export function spawnBlockEffect() {
  const hero = document.querySelector('#player .hero');
  if (!hero) return;
  const fx = document.createElement('div');
  fx.className = 'hero-shield-effect';
  hero.appendChild(fx);
  setTimeout(() => fx.remove(), 650);
}

/**
 * Floating damage text (supports 0 / blocked).
 * @param {string} selector - CSS selector for host element (#player or #boss)
 * @param {number} dmg - Actual HP damage taken
 * @param {number} absorbed - Amount blocked (for future conditional text)
 */
export function spawnDamageFloater(selector, dmg, absorbed = 0) {
  const host = document.querySelector(selector);
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'dmg-floater';
  // Show -dmg if dmg > 0, show '0' if nothing but block absorption occurred, else blank.
  el.textContent = dmg > 0 ? `-${dmg}` : (absorbed ? '0' : '');
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('shown'));
  setTimeout(() => el.remove(), 900);
}

/* ---------------------------------------------------------
   MASTER RENDER
--------------------------------------------------------- */
export function renderAll(state) {
  renderPlayer(state);
  renderBoss(state);
  renderHand(state);
  renderLog(state);
  renderCorruption(state);
  renderBossIntent(state);
  checkEnd(state);
}

/* ---------------------------------------------------------
   PLAYER
--------------------------------------------------------- */
function renderPlayer(state) {
  const hpText = document.getElementById('player-hp');
  if (hpText) hpText.textContent = `${state.player.hp}/${state.player.maxHp}`;

  // Player HP bar create-once
  let bar = document.querySelector('#player .hpbar');
  if (!bar) {
    const p = document.getElementById('player');
    if (p) {
      bar = document.createElement('div');
      bar.className = 'hpbar';
      bar.innerHTML = `<div class="hpfill" id="player-hp-inner"></div>`;
      p.appendChild(bar);
    }
  }
  const inner = document.getElementById('player-hp-inner');
  if (inner) {
    const pct = Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100));
    inner.style.width = pct + '%';
  }
}

/* ---------------------------------------------------------
   BOSS
--------------------------------------------------------- */
function renderBoss(state) {
  const hpText = document.getElementById('boss-hp');
  if (hpText) hpText.textContent = `${state.boss.hp}/${state.boss.maxHp}`;

  let bar = document.querySelector('#boss .boss-hpbar');
  if (!bar) {
    const b = document.getElementById('boss');
    if (b) {
      bar = document.createElement('div');
      bar.className = 'boss-hpbar';
      bar.innerHTML = `<div class="boss-hpbar-inner" id="boss-hp-inner"></div>`;
      b.appendChild(bar);
    }
  }
  const inner = document.getElementById('boss-hp-inner');
  if (inner) {
    const pct = Math.max(0, Math.min(100, (state.boss.hp / state.boss.maxHp) * 100));
    inner.style.width = pct + '%';
  }
}

/* ---------------------------------------------------------
   HAND / CARDS
--------------------------------------------------------- */
function renderHand(state) {
  const handEl = document.getElementById('hand');
  if (!handEl) return;
  handEl.innerHTML = '';

  const energyAvail = state.player.energy;

  state.player.hand.forEach(card => {
    const c = document.createElement('div');
    c.className = 'card';
    if (card.cost > energyAvail) c.classList.add('unplayable'); else c.classList.add('playable');
    if (card.exhaust) c.classList.add('exhaustable');

    c.innerHTML = `
      <div class="cost">${card.cost}</div>
      <h4 class="title">${escapeHtml(card.name)}</h4>
      <div class="desc">${escapeHtml(card.desc || '')}</div>
    `;

    c.addEventListener('click', () => {
      if (state.phase !== 'player') return;
      if (card.cost > state.player.energy) return;
      import('./deck.js').then(m => {
        const r = m.playCard(state, card.id);
        if (r.played) renderAll(state);
      });
    });

    handEl.appendChild(c);
  });

  const energyEl = document.getElementById('energy');
  if (energyEl) energyEl.textContent = `${state.player.energy}/${state.player.maxEnergy}`;
}

/* ---------------------------------------------------------
   LOG
--------------------------------------------------------- */
function renderLog(state) {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  const lines = (state.log || []).slice(-60);
  logEl.innerHTML = lines.map(l => escapeHtml(l)).join('<br>');
  logEl.scrollTop = logEl.scrollHeight;
}

/* ---------------------------------------------------------
   CORRUPTION
--------------------------------------------------------- */
function renderCorruption(state) {
  const cEl = document.getElementById('corruption');
  if (cEl) cEl.textContent = state.corruption;
  const fill = document.getElementById('corruption-fill');
  if (fill) {
    const pct = Math.min(100, (state.corruption / 10) * 100);
    fill.style.width = pct + '%';
  }
}

/* ---------------------------------------------------------
   BOSS INTENT
--------------------------------------------------------- */
function renderBossIntent(state) {
  let intentEl = document.getElementById('boss-intent');
  if (!state.bossIntent) {
    if (intentEl) intentEl.remove();
    return;
  }
  if (!intentEl) {
    intentEl = document.createElement('div');
    intentEl.id = 'boss-intent';
    intentEl.style.position = 'absolute';
    intentEl.style.top = '6px';
    intentEl.style.left = '6px';
    intentEl.style.fontSize = '.7rem';
    intentEl.style.background = 'rgba(20,30,44,.8)';
    intentEl.style.padding = '4px 8px';
    intentEl.style.border = '1px solid #2a4456';
    intentEl.style.borderRadius = '6px';
    intentEl.style.color = '#cfe4f7';
    intentEl.style.pointerEvents = 'none';
    const boss = document.getElementById('boss');
    if (boss) boss.appendChild(intentEl);
  }

  if (typeof state.bossIntent === 'string') {
    intentEl.textContent = state.bossIntent;
  } else {
    const { key, text, base, hits } = state.bossIntent;
    if (key === 'breath') intentEl.textContent = `${text} (${base} + Corruption)`;
    else if (hits > 1) intentEl.textContent = `${text} (${base} x${hits})`;
    else intentEl.textContent = text;
  }
}

/* ---------------------------------------------------------
   UTIL
--------------------------------------------------------- */
function escapeHtml(s = '') {
  return s.replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;');
}

/* ---------------------------------------------------------
   DEFAULT EXPORT
--------------------------------------------------------- */
export default {
  renderAll,
  spawnBlockEffect,
  spawnDamageFloater
};
