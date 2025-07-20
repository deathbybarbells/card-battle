/* =========================================================
   end.js – victory / defeat detection & overlay handling
   Corrupted Core Clash
   ========================================================= */

import { pushLog } from './log.js';
import { persistStats } from './gameState.js'; // ensure this exists; otherwise remove related calls
import { playSFX } from './sound.js';

/**
 * checkEnd(state)
 * Returns true if the game is already ended OR it has just ended in this call.
 * Sets state.thisRun.result = 'win' | 'loss'.
 */
export function checkEnd(state) {
  // If result already set, treat as ended (avoid duplicate overlays).
  if (state.thisRun.result) return true;

  const playerDead = state.player.hp <= 0;
  const bossDead   = state.boss.hp   <= 0;

  if (!playerDead && !bossDead) {
    return false; // no end condition yet
  }

  // Resolve outcome preference (simultaneous death = loss to keep it harsh / simple)
  if (playerDead && bossDead) {
    state.thisRun.result = 'loss';
    playSFX('lose');                        // 🔊 play defeat sound
    pushLog(state, 'Both fall – treated as defeat.');
  } else if (bossDead) {
    state.thisRun.result = 'win';
    playSFX('win');                         // 🔊 play victory sound
    pushLog(state, 'Victory! The boss is destroyed.');
  } else {
    state.thisRun.result = 'loss';
    playSFX('lose');                        // 🔊 play defeat sound
    pushLog(state, 'You are defeated.');
  }

  finalizeRunStats(state);
  showEndOverlay(state);
  return true;
}

/* ---------- Run Stats Aggregation ---------- */
function finalizeRunStats(state) {
  state.thisRun.ended = Date.now();
  state.thisRun.turns = state.turn;

  const stats = state.stats || {
    totalRuns: 0,
    wins: 0,
    fastestWin: null,
    totalWinTurns: 0
  };

  stats.totalRuns += 1;

  if (state.thisRun.result === 'win') {
    stats.wins += 1;
    if (stats.fastestWin == null || state.turn < stats.fastestWin) {
      stats.fastestWin = state.turn;
    }
    stats.totalWinTurns += state.turn;
  }

  state.stats = stats;

  // Persist if supported
  try {
    if (typeof persistStats === 'function') {
      persistStats(stats);
    }
  } catch (e) {
    console.warn('[end.js] persistStats failed:', e);
  }
}

/* ---------- Overlay (Modal) ---------- */
function showEndOverlay(state) {
  let overlay = document.getElementById('end-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'end-overlay';
    overlay.innerHTML = `
      <div class="end-box">
        <h2 id="end-title"></h2>
        <div id="end-summary" class="end-summary"></div>
        <div class="end-buttons">
          <button id="restart-run">Restart</button>
        </div>
      </div>
    `;
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(8,12,18,0.82)',
      zIndex: 2000
    });
    document.body.appendChild(overlay);
  }

  applyOverlayStyles(); // only applies once (idempotent)

  const won = state.thisRun.result === 'win';
  const titleEl = document.getElementById('end-title');
  const summaryEl = document.getElementById('end-summary');

  const stats = state.stats || {};
  const winRate = stats.totalRuns
    ? ((stats.wins / stats.totalRuns) * 100).toFixed(1)
    : '0.0';

  titleEl.textContent = won ? 'VICTORY' : 'DEFEAT';
  titleEl.className = won ? 'win-title' : 'loss-title';

  summaryEl.innerHTML = `
    <p><strong>Turns:</strong> ${state.turn}</p>
    <p><strong>Player HP:</strong> ${state.player.hp}/${state.player.maxHp}</p>
    <p><strong>Boss HP:</strong> ${Math.max(state.boss.hp,0)}/${state.boss.maxHp}</p>
    <p><strong>Result:</strong> ${won ? 'Win' : 'Loss'}</p>
    <hr />
    <p><strong>Total Runs:</strong> ${stats.totalRuns || 0}</p>
    <p><strong>Wins:</strong> ${stats.wins || 0} (${winRate}% win rate)</p>
    <p><strong>Fastest Win (turns):</strong> ${stats.fastestWin ?? '—'}</p>
  `;

  overlay.style.display = 'flex';

  const restartBtn = document.getElementById('restart-run');
  restartBtn.onclick = () => {
    overlay.style.display = 'none';
    if (window.__restartGame) window.__restartGame();
    else location.reload();
  };
}

/* ---------- One-time CSS Injection for Overlay ---------- */
function applyOverlayStyles() {
  if (document.getElementById('end-overlay-styles')) return;
  const style = document.createElement('style');
  style.id = 'end-overlay-styles';
  style.textContent = `
    #end-overlay .end-box {
      background:#141c22;
      border:1px solid #284255;
      border-radius:14px;
      padding:1.8rem 2.2rem 1.6rem;
      width: clamp(320px, 40vw, 480px);
      box-shadow:0 0 40px -10px #000;
      animation: endPop .55s ease;
      position:relative;
    }
    #end-overlay h2 {
      margin:0 0 0.75rem;
      font-size:1.9rem;
      letter-spacing:2px;
      text-align:center;
    }
    .win-title { color:#4acf6d; text-shadow:0 0 12px rgba(74,207,109,0.4); }
    .loss-title { color:#ff5555; text-shadow:0 0 12px rgba(255,85,85,0.35); }
    #end-overlay .end-summary {
      font-size:.95rem;
      line-height:1.35;
      color:#d4e2ef;
      max-height:240px;
      overflow:auto;
    }
    #end-overlay .end-summary hr {
      border:none;
      border-top:1px solid #2a3d4f;
      margin:.8rem 0;
    }
    #end-overlay .end-buttons {
      margin-top:1.1rem;
      text-align:center;
    }
    #end-overlay button#restart-run {
      background:#295a85;
      color:#fff;
      border:none;
      padding:.6rem 1.2rem;
      font-size:.95rem;
      font-weight:600;
      letter-spacing:.5px;
      border-radius:8px;
      cursor:pointer;
      transition:background .25s;
    }
    #end-overlay button#restart-run:hover {
      background:#3271aa;
    }
    @keyframes endPop {
      from { transform:translateY(18px) scale(.9); opacity:0; }
      to   { transform:translateY(0) scale(1); opacity:1; }
    }
  `;
  document.head.appendChild(style);
}
