import { BASE_CARDS } from './data/cards.js';
import { createInitialState } from './engine/gameState.js';
import { shuffle, draw } from './engine/deck.js';
import { startPlayerTurn } from './engine/combat.js';
import { bindUI, renderAll } from './engine/ui.js';

const state = createInitialState();
state.player.deck = BASE_CARDS.slice();
state.player.drawPile = state.player.deck.slice();
shuffle(state.player.drawPile);

startPlayerTurn(state);
draw(state, 5);

bindUI(state);
renderAll(state);
