// sound.js

// 1. Map your clips
export const SFX = {
  monsterAttack: new Audio('assets/audio/creature_roar_01.ogg'),
  monsterHurt:   new Audio('assets/audio/creature_hurt_01.ogg'),
  playCard:      new Audio('assets/audio/card-place-2.ogg'),
  block:         new Audio('assets/audio/block.ogg'),       // make sure block.ogg, not .gg
  heroAttack:    new Audio('assets/audio/blade_01.ogg'),
  powerUp:       new Audio('assets/audio/powerUp4.ogg'),
  lose:          new Audio('assets/audio/you_lose.ogg'),
  win:           new Audio('assets/audio/you_win.ogg'),
};

// 2. Helper to play without cutting off repeats
export function playSFX(key) {
  const base = SFX[key];
  if (!base) return console.warn(`No SFX mapped for "${key}"`);
  const clip = base.cloneNode();
  clip.currentTime = 0;
  clip.play();
}
