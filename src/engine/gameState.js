export function createInitialState() {
  return {
    turn: 1,
    player: {
      hp: 40, maxHp: 40,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      deck: [],
      drawPile: [],
      discardPile: [],
      hand: []
    },
    boss: { hp: 60, maxHp: 60, block: 0 },
    corruption: 0,
    hazards: [],
    purgeUsed: false,
    phase: 'player',
    log: [],
    gameOver: null
  };
}
