import type { FighterConfig } from './FighterConfig';

// Brom Hatch — heavy forge-and-anvil brawler. Slow, high reward per hit, barely flinches on light hits.
export const BROM: FighterConfig = {
  id: 'brom',
  name: 'BROM',
  tag: 'HATCH',
  maxHp: 1150,
  walkFwd: 2.0,
  walkBack: 1.6,
  jump: { vy: 14, vx: 3.2, gUp: 0.95, gApex: 0.5, gDown: 1.3, apexWindow: 2, landTicks: 9, landDust: true },
  frame: { w: 128, h: 128, anchorX: 64, anchorY: 124, scale: 2 },
  anims: {
    idle: { frames: 4, ticks: [14, 12, 14, 12], loop: true },
    walk: { frames: 6, ticks: [7, 7, 7, 7, 7, 7], loop: true },
    jump: { frames: 3, ticks: [1, 1, 1], loop: false },
    land: { frames: 1, ticks: [9], loop: false },
    light: { frames: 5, ticks: [3, 3, 3, 4, 6], loop: false },
    heavy: { frames: 7, ticks: [7, 7, 8, 4, 3, 16, 14], loop: false },
    special: { frames: 9, ticks: [5, 5, 5, 4, 4, 4, 9, 10, 10], loop: false },
    hurt: { frames: 3, ticks: [1, 1, 1], loop: false },
    defeat: { frames: 5, ticks: [12, 12, 12, 12, 999], loop: false },
    win: { frames: 4, ticks: [16, 12, 30, 999], loop: false },
  },
  pushbox: { x: -20, y: -95, w: 40, h: 95 },
  attacks: {
    light: {
      name: 'HOOK',
      phases: ['windup', 'windup', 'active', 'recovery', 'recovery'],
      hitboxes: [null, null, { x: 34, y: -82, w: 28, h: 20 }, null, null],
      damage: 60, weight: 'light', hitstun: 16, hitstop: 2, knockback: 7,
      advance: [0, 0, 1.2, 0, 0],
    },
    heavy: {
      name: 'ANVIL DROP',
      phases: ['windup', 'windup', 'windup', 'active', 'active', 'recovery', 'recovery'],
      hitboxes: [null, null, null, { x: 36, y: -92, w: 32, h: 28 }, { x: 42, y: -68, w: 30, h: 30 }, null, null],
      damage: 170, weight: 'heavy', hitstun: 32, hitstop: 3, knockback: 16,
      advance: [0, 0, 0, 2.2, 0.8, 0, 0],
      shake: 5,
    },
    special: {
      name: 'FORGE QUAKE',
      phases: ['windup', 'windup', 'windup', 'windup', 'active', 'active', 'recovery', 'recovery', 'recovery'],
      hitboxes: [null, null, null, null, { x: -18, y: -24, w: 86, h: 24 }, { x: -18, y: -20, w: 86, h: 20 }, null, null, null],
      damage: 125, weight: 'heavy', hitstun: 28, hitstop: 3, knockback: 14,
      advance: [0, 0.6, 0.6, 0.6, 0, 0, 0, 0, 0],
      vfx: { key: 'vfx_quake_wave', onFrame: 4, dx: 24, dy: 0, frameTicks: 4 },
      shake: 4,
    },
  },
  hurt: {
    light: { frames: [0], stunScale: 0.55, pushScale: 0.4 },   // barely staggers
    heavy: { frames: [1, 2], stunScale: 1, pushScale: 1 },     // real flinch
    invulnTail: 8,
  },
  hitSpark: 'vfx_hit_spark_ember',
  afterimages: [],
  hudColor: 0xff8a1c,
};
