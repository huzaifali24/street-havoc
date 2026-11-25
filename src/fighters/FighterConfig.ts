// Data-driven fighter definition. Everything a fighter "is" lives in a FighterConfig
// (kessa.ts / brom.ts); FighterController.ts is the shared state machine that runs it.
//
// Box coordinates are ART PIXELS relative to the sprite anchor (feet, bottom-centre),
// for a fighter FACING RIGHT. +x = forward, -y = up. World size = art px * frame.scale.

export type AnimKey = 'idle' | 'walk' | 'jump' | 'land' | 'light' | 'heavy' | 'special' | 'hurt' | 'defeat' | 'win';
export const ANIM_KEYS: AnimKey[] = ['idle', 'walk', 'jump', 'land', 'light', 'heavy', 'special', 'hurt', 'defeat', 'win'];

export type AttackKind = 'light' | 'heavy' | 'special';
export type Phase = 'windup' | 'active' | 'recovery';

export interface Box { x: number; y: number; w: number; h: number }

export interface AnimDef {
  /** frames in assets/sprites/<id>/<anim>.png (horizontal strip of frame.w x frame.h cells) */
  frames: number;
  /** game ticks (1/60 s) each frame is shown */
  ticks: number[];
  loop: boolean;
}

export interface VfxSpawn {
  key: string;          // vfx texture key (see manifest VFX)
  onFrame: number;      // spawn when the attack enters this anim frame
  dx: number; dy: number; // art px offset from the fighter anchor (facing right)
  frameTicks: number;   // ticks per vfx frame
  behind?: boolean;
}

export interface AttackDef {
  name: string;
  phases: Phase[];               // one per anim frame
  hitboxes: (Box | null)[];      // one per anim frame; non-null only on 'active' frames
  damage: number;
  weight: 'light' | 'heavy';     // drives the defender's reaction
  hitstun: number;               // ticks the defender is stunned (before the invuln tail)
  hitstop: number;               // freeze both fighters this many ticks on connect (2–3)
  knockback: number;             // initial push velocity (world px / tick), decays
  advance: number[];             // forward movement per tick during each anim frame (world px)
  vfx?: VfxSpawn;
  shake?: number;                // camera shake intensity on hit (0 = none)
}

export interface FighterConfig {
  id: 'kessa' | 'brom';
  name: string;
  tag: string;
  maxHp: number;
  walkFwd: number;               // world px / tick
  walkBack: number;
  jump: {
    vy: number;                  // launch speed (world px / tick, upward)
    vx: number;                  // horizontal speed if a direction is held at launch
    gUp: number; gApex: number; gDown: number; // gravity while rising / near apex / falling
    apexWindow: number;          // |vy| below this counts as "apex" (floaty part)
    landTicks: number;           // landing recovery
    landDust: boolean;
  };
  frame: { w: number; h: number; anchorX: number; anchorY: number; scale: number };
  anims: Record<AnimKey, AnimDef>;
  pushbox: Box;
  attacks: Record<AttackKind, AttackDef>;
  hurt: {
    light: { frames: number[]; stunScale: number; pushScale: number };
    heavy: { frames: number[]; stunScale: number; pushScale: number };
    invulnTail: number;          // invulnerable ticks at the end of every hit reaction
  };
  hitSpark: string;              // vfx key spawned where this fighter's attacks connect
  afterimages: AttackKind[];     // attacks that draw motion ghosts on active frames
  hudColor: number;
}

/** Throws if a config is internally inconsistent (wrong array lengths, hitbox on a non-active frame...). */
export function validateConfig(c: FighterConfig): string[] {
  const errs: string[] = [];
  for (const k of ANIM_KEYS) {
    const a = c.anims[k];
    if (a.ticks.length !== a.frames) errs.push(`${c.id}.${k}: ticks length ${a.ticks.length} != frames ${a.frames}`);
  }
  for (const kind of ['light', 'heavy', 'special'] as AttackKind[]) {
    const atk = c.attacks[kind], n = c.anims[kind].frames;
    if (atk.phases.length !== n) errs.push(`${c.id}.${kind}: phases length != frames`);
    if (atk.hitboxes.length !== n) errs.push(`${c.id}.${kind}: hitboxes length != frames`);
    if (atk.advance.length !== n) errs.push(`${c.id}.${kind}: advance length != frames`);
    if (atk.phases[0] !== 'windup') errs.push(`${c.id}.${kind}: must start with a wind-up frame`);
    if (!atk.phases.includes('active')) errs.push(`${c.id}.${kind}: no active frame`);
    if (atk.phases[atk.phases.length - 1] !== 'recovery') errs.push(`${c.id}.${kind}: must end with recovery`);
    atk.phases.forEach((p, i) => {
      if ((p === 'active') !== (atk.hitboxes[i] != null)) errs.push(`${c.id}.${kind}[${i}]: hitbox must exist exactly on active frames`);
    });
    if (atk.hitstop < 1 || atk.hitstop > 3) errs.push(`${c.id}.${kind}: hitstop must be 1–3 ticks`);
  }
  return errs;
}
