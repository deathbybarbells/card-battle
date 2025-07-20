const HAZARD_TYPES = [
  { type:'spike',   name:'Spike',   dmg:2, desc:'Deal 2 end turn.' },
  { type:'poison',  name:'Spores',  dmg:1, status:'poison', desc:'+1 poison stack.' },
  { type:'leech',   name:'Leech',   dmg:2, lifesteal:2, desc:'Deal 2 & boss heals 2.' },
  { type:'drone',   name:'Drone',   block:4, desc:'Boss gains 4 block.' },
  { type:'spark',   name:'Spark',   dmg:3, oneShot:true, desc:'One-shot 3 dmg.' },
  { type:'mirror',  name:'Mirror',  reflect:50, desc:'Reflect 50% next attack.' },
];

export function randomHazard() {
  return structuredClone(HAZARD_TYPES[Math.floor(Math.random()*HAZARD_TYPES.length)]);
}

export function resolveHazards(state, applyDamageToPlayer, healBoss, grantBossBlock, reflectTracker) {
  let totalDmg = 0;
  for (const h of state.hazards) {
    if (h.dmg) totalDmg += h.dmg;
    if (h.status === 'poison') {
      state.player.pendingPoison = (state.player.pendingPoison || 0) + 1;
    }
    if (h.lifesteal) healBoss(state, h.lifesteal);
    if (h.block) grantBossBlock(state, h.block);
    if (h.reflect) reflectTracker.value = h.reflect;
    if (h.oneShot) h._expire = true;
  }

  if (state.player.pendingPoison) {
    state.player.hp = Math.max(0, state.player.hp - state.player.pendingPoison);
    state.log.unshift(`Poison deals ${state.player.pendingPoison}.`);
  }

  if (totalDmg) {
    const taken = applyDamageToPlayer(state, totalDmg);
    state.log.unshift(`Hazards hit for ${taken}.`);
  }

  state.hazards = state.hazards.filter(h => !h._expire);
}

export function renderHazards(state, container) {
  container.innerHTML = '';
  state.hazards.forEach(h => {
    const div = document.createElement('div');
    div.className = 'hazard';
    div.title = h.desc;
    div.textContent = h.name[0];
    container.appendChild(div);
  });
}
