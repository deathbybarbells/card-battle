export const BASE_CARDS = [
  { id: 'strike1', name: 'Strike',  cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike2', name: 'Strike',  cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike3', name: 'Strike',  cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike4', name: 'Strike',  cost: 1, type: 'attack', dmg: 6 },
  { id: 'strike5', name: 'Strike',  cost: 1, type: 'attack', dmg: 6 },
  { id: 'guard1',  name: 'Guard',   cost: 1, type: 'skill',  block: 6 },
  { id: 'guard2',  name: 'Guard',   cost: 1, type: 'skill',  block: 6 },
  { id: 'guard3',  name: 'Guard',   cost: 1, type: 'skill',  block: 6 },
  { id: 'focus',   name: 'Focus',   cost: 1, type: 'buff',   effect: 'gainEnergyNext' },
  { id: 'purge',   name: 'Purge',   cost: 0, type: 'special',effect: 'purge' },
  { id: 'channel', name: 'Channel', cost: 0, type: 'buff',   effect: 'gainEnergyNow' }
];

export const REWARD_POOL = [
  { id:'heavy',   name:'Heavy Blow',  cost:2, type:'attack', dmg:16 },
  { id:'bguard',  name:'Bulwark',     cost:1, type:'skill',  block:10 },
  { id:'ignite',  name:'Ignite',      cost:1, type:'attack', dmg:4, effect:'burn' },
  { id:'surge',   name:'Surge',       cost:0, type:'buff',   effect:'gainEnergyNext' },
  { id:'double',  name:'Twin Strike', cost:1, type:'attack', dmg:4, hits:2 },
  { id:'cleanse', name:'Cleanse',     cost:1, type:'skill',  effect:'cleanse', block:4 }
];
