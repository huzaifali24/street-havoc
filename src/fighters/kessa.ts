import type { FighterConfig } from './FighterConfig';

// Kessa "Voltfist" Reyes — fast rushdown striker. Fast, low reward per hit.
export const KESSA: FighterConfig = {
  id: 'kessa',
  name: 'KESSA',
  tag: "'VOLTFIST' REYES",
  maxHp: 950,
  walkFwd: 3.6,
  walkBack: 3.0,
  jump: { vy: 18, vx: 4.8, gUp: 0.9, gApex: 0.35, gDown: 1.4, apexWindow: 2.5, landTicks: 3, landDust: false },
  frame: { w: 128, h: 128, anchorX: 64, anchorY: 124, scale: 2 },
  anims: {
    idle: { frames: 6, ticks: [8, 7, 7, 8, 7, 7], loop: true },
    walk: { frames: 8, ticks: [5, 5, 5, 5, 5, 5, 5, 5], loop: true },
    jump: { frames: 3, ticks: [1, 1, 1], loop: false },          // frame picked from vertical velocity
    land: { frames: 1, ticks: [3], loop: false },
    light: { frames: 5, ticks: [3, 2, 3, 4, 5], loop: false },
    heavy: { frames: 7, ticks: [4, 4, 3, 3, 3, 6, 8], loop: false },
    special: { frames: 8, ticks: [4, 4, 4, 3, 3, 5, 6, 7], loop: false },
    hurt: { frames: 3, ticks: [1, 1, 1], loop: false },          // frame picked from hit weight/progress
    defeat: { frames: 5, ticks: [8, 8, 8, 10, 999], loop: false },
    win: { frames: 4, ticks: [8, 8, 10, 999], loop: false },
  },
  pushbox: { x: -12, y: -100, w: 24, h: 100 },
  attacks: {
    light: {
      name: 'SNAP KICK',
      phases: ['windup', 'windup', 'active', 'recovery', 'recovery'],
      hitboxes: [null, null, { x: 28, y: -44, w: 36, h: 20 }, null, null],
      damage: 45, weight: 'light', hitstun: 15, hitstop: 2, knockback: 6,
      advance: [0, 0.8, 1.6, 0, 0],
    },
    heavy: {
      name: 'RISING SPIN',
      phases: ['windup', 'windup', 'windup', 'active', 'active', 'recovery', 'recovery'],
      hitboxes: [null, null, null, { x: 30, y: -88, w: 32, h: 28 }, { x: 24, y: -108, w: 30, h: 34 }, null, null],
      damage: 95, weight: 'heavy', hitstun: 24, hitstop: 3, knockback: 13,
      advance: [0, 0, 1.2, 1.6, 0.8, 0, 0],
      shake: 2,
    },
    special: {
      name: 'VOLT ARC',
      phases: ['windup', 'windup', 'windup', 'active', 'active', 'recovery', 'recovery', 'recovery'],
      hitboxes: [null, null, null, { x: 22, y: -106, w: 44, h: 72 }, { x: 22, y: -98, w: 44, h: 60 }, null, null, null],
      damage: 110, weight: 'heavy', hitstun: 26, hitstop: 3, knockback: 12,
      advance: [-0.6, 0, 0, 2.4, 1.0, 0, 0, 0],
      vfx: { key: 'vfx_volt_arc', onFrame: 3, dx: 18, dy: -70, frameTicks: 3 },
      shake: 2,
    },
  },
  hurt: {
    light: { frames: [0, 2], stunScale: 1, pushScale: 1 },
    heavy: { frames: [1, 2], stunScale: 1, pushScale: 1 },
    invulnTail: 8,
  },
  hitSpark: 'vfx_hit_spark_volt',
  afterimages: ['heavy', 'special'],
  hudColor: 0x33ccf5,
};
