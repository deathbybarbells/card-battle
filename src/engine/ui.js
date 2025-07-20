import { playCard, endPlayerTurn, enemyTurn } from './combat.js';
import { renderHazards } from './hazards.js';

export function bindUI(state) {
  document.getElementById('end-turn').addEventListener('click', () => {
    if (state.gameOver) return;
    endPlayerTurn(state);
    enemyTurn(state);
    renderAll(state);
  });
}

export function renderAll(state) {
  document.getElementById('player-hp').textContent = `${state.player.hp}/${state.player.maxHp}`;
  document.getElementById('boss-hp').textContent = `${state.boss.hp}/${state.boss.maxHp}`;
  document.getElementById('energy').textContent = `${state.player.energy}/${state.player.maxEnergy}`;
  document.getElementById('corruption').textContent = state.corruption;

  const handDiv = document.getElementById('hand');
  handDiv.innerHTML = '';
  state.player.hand.forEach(card => {
    const c = document.createElement('div');
    c.className = 'card';
    if (card.cost >= 2) c.classList.add('cost-high');
    c.innerHTML = `<strong>${card.name}</strong>
      <span>Cost: ${card.cost}</span>
      <span>${
        card.type === 'attack' ? (card.dmg+' dmg') :
        card.type === 'skill' ? (card.block+' block') :
        card.effect === 'purge' ? 'Sacrifice+Energy' :
        'Max Energy +1'
      }</span>`;
    c.addEventListener('click', () => {
      if (state.phase !== 'player' || state.gameOver) return;
      playCard(state, card);
      attackAnim();
      renderAll(state);
    });
    handDiv.appendChild(c);
  });

  renderHazards(state, document.getElementById('hazards'));

  const log = document.getElementById('log');
  log.innerHTML = state.log.map(line => `<div>${line}</div>`).join('');

  if (state.gameOver) {
    const result = document.createElement('div');
    result.className = state.gameOver === 'win' ? 'status-win' : 'status-danger';
    result.textContent = state.gameOver === 'win' ? 'YOU WIN!' : 'DEFEAT';
    log.prepend(result);
  }
}

function attackAnim() {
  const player = document.getElementById('player');
  player.classList.remove('attack');
  void player.offsetWidth;
  player.classList.add('attack');
  setTimeout(()=>player.classList.remove('attack'), 400);
}
