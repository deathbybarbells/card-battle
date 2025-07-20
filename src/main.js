/* =========================================================
   main.js – Boot & debug instrumentation
   Card Core Clash
   ========================================================= */

import { createInitialState } from './engine/gameState.js';
import { drawInitialDeck }    from './engine/deck.js';
import {
  initializeBossIntent,
  startPlayerTurn,
  endPlayerTurn
} from './engine/combat.js';
import { renderAll }  from './engine/ui.js';
import { pushLog }    from './engine/log.js';
import { checkEnd }   from './engine/end.js';

console.log('[CCC] Bootstrapping...');

let state;

/* ---------- TRACE PANEL & phaseTrace ---------- */
function ensureTracePanel() {
  let el = document.getElementById('trace-panel');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'trace-panel';
    el.style.cssText = `
      position:fixed; bottom:4px; right:4px; width:320px; height:200px;
      background:rgba(8,12,18,.85); color:#9ddcff; font:11px/1.25 monospace;
      padding:6px 8px; margin:0; border:1px solid #244354; border-radius:6px;
      z-index:99999; white-space:pre-wrap; overflow:auto;
    `;
    el.textContent = '=== Turn Flow Trace ===\n';
    document.body.appendChild(el);
  }
  return el;
}

function phaseTrace(msg) {
  const panel = ensureTracePanel();
  const stamp = new Date().toISOString().substr(11, 8);
  panel.textContent += `[${stamp}] ${msg}\n`;
  // Trim if it grows too large
  if (panel.textContent.length > 50000) {
    panel.textContent = panel.textContent.slice(-40000);
  }
  panel.scrollTop = panel.scrollHeight;
  // Mirror to console (optional)
  console.log('[TRACE]', msg);
}

/* Expose for other modules (deck/combat) */
window.__cccPhaseTrace = phaseTrace;

/* ---------- Wrap start/end phases for tracing ---------- */
function wrapPhases() {
  const _startPlayerTurn = startPlayerTurn;
  const _endPlayerTurn   = endPlayerTurn;

  if (!wrapPhases._patched) {
    wrapPhases._patched = true;
    window.__origStartPlayerTurn = _startPlayerTurn;
    window.__origEndPlayerTurn   = _endPlayerTurn;
  }

  window.startPlayerTurnWrapped = function (s) {
    phaseTrace(`CALL startPlayerTurn (turn=${s.turn}, phase was ${s.phase})`);
    _startPlayerTurn(s);
    phaseTrace(`AFTER startPlayerTurn (phase=${s.phase}, energy=${s.player.energy}, hand=${s.player.hand.length})`);
    renderAll(s);
  };

  window.endPlayerTurnWrapped = function (s) {
    phaseTrace(`CALL endPlayerTurn (turn=${s.turn}, phase=${s.phase})`);
    _endPlayerTurn(s);
    phaseTrace(`RETURN endPlayerTurn -> phase now ${s.phase}, turn=${s.turn}`);
    renderAll(s);
  };
}

/* ---------- HEARTBEAT (idle trace) ---------- */
function installHeartbeat() {
  setInterval(() => {
    if (!state) return;
    if (state.thisRun?.result) return;
    if (state.phase !== 'player') return;
    phaseTrace(`HEARTBEAT: player phase, energy=${state.player.energy}, hand=${state.player.hand.length}`);
  }, 8000);
}

/* ---------- BOOT ---------- */
function boot() {
  wrapPhases();

  state = createInitialState();
  drawInitialDeck(state);
  initializeBossIntent(state);
  window.startPlayerTurnWrapped(state); // Player starts

  // Hook End Turn button safely
  const endBtn = document.getElementById('end-turn');
  if (endBtn) {
    // Replace node to clear stale listeners
    endBtn.replaceWith(endBtn.cloneNode(true));
    const fresh = document.getElementById('end-turn');
    fresh.addEventListener('click', () => {
      if (state.phase !== 'player') {
        phaseTrace('IGNORED: End Turn click while not player phase');
        return;
      }
      window.endPlayerTurnWrapped(state);
    });
  }

  exposeDebug();
  installHeartbeat();
  phaseTrace('BOOT COMPLETE – first player turn active.');
  renderAll(state);
}

/* ---------- DEBUG API ---------- */
function exposeDebug() {
  window.CCC = {
    state,
    draw: (n = 1) => {
      phaseTrace(`DEBUG draw(${n})`);
      import('./engine/deck.js').then(m => {
        m.draw(state, n);
        renderAll(state);
      });
    },
    play: (id) => {
      import('./engine/deck.js').then(m => {
        if (state.phase !== 'player') {
            phaseTrace(`DEBUG play(${id}) IGNORED – not player phase`);
            return;
        }
        const r = m.playCard(state, id);
        phaseTrace(`DEBUG play(${id}) result: ${JSON.stringify(r)}`);
        renderAll(state);
        if (checkEnd(state)) return;
      });
    },
    end: () => {
      phaseTrace('DEBUG manual end turn');
      window.endPlayerTurnWrapped(state);
    },
    forceWin: () => {
      state.boss.hp = 0;
      pushLog(state,'[Debug] Force win.');
      checkEnd(state);
      renderAll(state);
    },
    forceLoss: () => {
      state.player.hp = 0;
      pushLog(state,'[Debug] Force loss.');
      checkEnd(state);
      renderAll(state);
    },
    log: (msg) => pushLog(state, '[Debug] ' + msg),
    restart: () => { phaseTrace('DEBUG restart'); location.reload(); }
  };
  window.__restartGame = () => location.reload();
  console.log('CCC debug API attached to window.CCC');
}

boot();
