export function shuffle(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j = Math.floor(Math.random()* (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function draw(state, n=1) {
  for (let i=0;i<n;i++) {
    if (state.player.drawPile.length === 0) {
      state.player.drawPile = state.player.discardPile;
      state.player.discardPile = [];
      shuffle(state.player.drawPile);
    }
    if (state.player.drawPile.length === 0) return;
    state.player.hand.push(state.player.drawPile.pop());
  }
}
