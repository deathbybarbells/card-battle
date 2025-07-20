export function renderHazards(state, container) {
  container.innerHTML = '';
  state.hazards.forEach(h => {
    const div = document.createElement('div');
    div.className = 'hazard';
    div.title = `${h.name}: ${h.dmg} dmg end of turn`;
    div.textContent = h.name[0];
    container.appendChild(div);
  });
}
