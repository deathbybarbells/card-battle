// src/engine/gameState.js
export function createInitialState() {
  return {
    turn: 1,
    phase: 'player',
    player: {
      hp: 50,
      maxHp: 50,
      block: 0,
      energy: 3,
      maxEnergy: 5,
      hand: [],
      drawPile: [],
      discardPile: [],
    },
    boss: {
      hp: 100,
      maxHp: 100,
      block: 0,
      reflect: 0
    },
    hazards: [],
    purgeUsed: false,
    corruption: 0,
    rewardPending: false,
    bossIntent: null,
    stats: loadRunStats(),
    thisRun: {
      started: Date.now(),
      ended: null,
      result: null,
      turns: 0
    },
    log: []   // <-- REQUIRED
  };
}

/* (unchanged loadRunStats / persistStats below) */

/* ==== Persistent Stats (LocalStorage) ==== */
function loadRunStats() {
  try {
    const raw = localStorage.getItem('ccc_run_stats');
    if (raw) return JSON.parse(raw);
  } catch(e){}
  return {
    totalRuns: 0,
    wins: 0,
    fastestWin: null,   // in turns
    totalWinTurns: 0
  };
}

export function persistStats(stats) {
  try {
    localStorage.setItem('ccc_run_stats', JSON.stringify(stats));
  } catch(e){}
}
