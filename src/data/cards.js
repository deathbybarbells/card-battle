export const BASE_CARDS = [
  { id: 'strike1', name: 'Strike', cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike2', name: 'Strike', cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike3', name: 'Strike', cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike4', name: 'Strike', cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike5', name: 'Strike', cost: 1, type: 'attack', dmg: 6 },
  { id: 'guard1',  name: 'Guard',  cost: 1, type: 'skill',  block: 5 },
  { id: 'guard2',  name: 'Guard',  cost: 1, type: 'skill',  block: 5 },
  { id: 'guard3',  name: 'Guard',  cost: 1, type: 'skill',  block: 5 },
  { id: 'focus',   name: 'Focus',  cost: 1, type: 'buff',   effect: 'gainEnergyNext' },
  { id: 'purge',   name: 'Purge',  cost: 0, type: 'special',effect: 'purge' }
];

export const REWARD_POOL = [
  { id:'heavy',  name:'Heavy Blow',  cost:2, type:'attack', dmg:14 },
  { id:'bguard', name:'Bulwark',     cost:1, type:'skill',  block:9 },
  { id:'ignite', name:'Ignite',      cost:1, type:'attack', dmg:4, effect:'burn' },
  { id:'surge',  name:'Surge',       cost:0, type:'buff',   effect:'gainEnergyNext' },
  { id:'double', name:'Twin Strike', cost:1, type:'attack', dmg:4, hits:2 }
];

