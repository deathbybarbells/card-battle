export function showEndOverlay(state) {
  let wrap = document.getElementById('end-overlay');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'end-overlay';
    wrap.innerHTML = `
      <div class="panel">
        <h2 id="result-title"></h2>
        <p id="result-stats"></p>
        <button id="restart-btn">Restart</button>
      </div>`;
    document.body.appendChild(wrap);
    document.getElementById('restart-btn').addEventListener('click', () => location.reload());
  }
  const win = state.boss.hp <= 0;
  document.getElementById('result-title').textContent = win ? 'VICTORY' : 'DEFEAT';
  document.getElementById('result-stats').textContent =
    `Turns: ${state.turn}  |  Player HP: ${state.player.hp}/${state.player.maxHp}`;
  wrap.classList.add(win ? 'win' : 'loss', 'show');
  // Play Sound with Overlay:
const won = state.thisRun.result === 'win';
playSFX(won ? 'win' : 'lose');
}
