import { draw } from './deck.js';

export function startPlayerTurn(state) {
  state.phase = 'player';
  state.player.block = 0;
  state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + 1);
  draw(state, 5 - state.player.hand.length);
  pushLog(state, `Turn ${state.turn} begins.`);
}

export function endPlayerTurn(state) {
  state.phase = 'enemy';
}

export function enemyTurn(state) {
  const r = Math.random();
  if (r < 0.4) {
    const hazard = { id: 'spike'+Date.now(), name: 'Spike', dmg: 3 };
    state.hazards.push(hazard);
    pushLog(state, 'Boss spawns Spike hazard (+3 dmg).');
  } else {
    let dmg = 7;
    dmg = applyDamageToPlayer(state, dmg);
    pushLog(state, `Boss hits for ${dmg}.`);
  }
  resolveHazards(state);
  state.corruption++;
  state.turn++;
  checkEnd(state);
  if (!state.gameOver) startPlayerTurn(state);
}

export function playCard(state, card) {
  if (card.cost > state.player.energy || state.phase !== 'player' || state.gameOver) return;
  state.player.energy -= card.cost;

  if (card.type === 'attack') {
    const dealt = applyDamageToBoss(state, card.dmg);
    pushLog(state, `You strike for ${dealt}.`);
  } else if (card.type === 'skill') {
    state.player.block += card.block;
    pushLog(state, `You gain ${card.block} block.`);
  } else if (card.effect === 'gainEnergyNext') {
    state.player.maxEnergy = Math.min(7, state.player.maxEnergy + 1);
    pushLog(state, `Focus raises max energy (${state.player.maxEnergy}).`);
  } else if (card.effect === 'purge') {
    if (!state.purgeUsed) {
      const sacrificial = state.player.hand.find(c=>c.id.startsWith('strike') && c!==card);
      if (sacrificial) {
        state.player.hand = state.player.hand.filter(c => c!==sacrificial && c!==card);
        state.player.maxEnergy = Math.min(8, state.player.maxEnergy + 1);
        pushLog(state, `Purged a Strike: +1 max energy (${state.player.maxEnergy}).`);
        state.purgeUsed = true;
      } else {
        pushLog(state,'No valid card to purge.');
      }
      checkEnd(state);
      return;
    } else {
      pushLog(state,'Purge already used.');
    }
  }

  state.player.hand = state.player.hand.filter(c => c !== card);
  state.player.discardPile.push(card);
  checkEnd(state);
}

function applyDamageToBoss(state, dmg) {
  const blocked = Math.min(state.boss.block, dmg);
  state.boss.block -= blocked;
  const real = dmg - blocked;
  state.boss.hp = Math.max(0, state.boss.hp - real);
  checkEnd(state);
  return real;
}

function applyDamageToPlayer(state, dmg) {
  const blocked = Math.min(state.player.block, dmg);
  state.player.block -= blocked;
  const real = dmg - blocked;
  state.player.hp = Math.max(0, state.player.hp - real);
  checkEnd(state);
  return real;
}

function resolveHazards(state) {
  let total = 0;
  for (const h of state.hazards) total += h.dmg;
  if (total) {
    const taken = applyDamageToPlayer(state, total);
    pushLog(state, `Hazards deal ${taken} damage.`);
  }
}

function pushLog(state, msg) {
  state.log.unshift(msg);
  if (state.log.length > 120) state.log.pop();
}

function checkEnd(state) {
  if (state.boss.hp <= 0) state.gameOver = 'win';
  else if (state.player.hp <= 0 || state.corruption >= 10) state.gameOver = 'lose';
}
