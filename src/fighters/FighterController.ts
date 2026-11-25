// Shared fighter state machine. Pure logic (no Phaser) — runs once per fixed 60 Hz tick.
//
//   Idle <-> Walk -> Jump -> Land -> Idle
//   Idle/Walk -> LightAttack | HeavyAttack | Special  (movement locked until recovery ends) -> Idle
//   any state -> Hurt   (except while in Hurt's invulnerable tail, or Defeat)
//   Hurt -> Idle;  any -> Defeat (terminal for the round);  Idle -> Win (round end)
import type { AnimKey, AttackDef, AttackKind, Box, FighterConfig, Phase } from './FighterConfig';
import type { PlayerInput } from '../core/Input';
import { FLOOR_Y, STAGE_W, WALL_MARGIN } from '../core/world';
import { getHurtboxes } from './hurtboxes';
import { fighterTextureKey } from '../assets/manifest';

export type FState = 'idle' | 'walk' | 'jump' | 'land' | 'attack' | 'hurt' | 'defeat' | 'win';

export type FighterEvent =
  | { type: 'attackStart'; kind: AttackKind }
  | { type: 'attackFrame'; kind: AttackKind; frame: number; phase: Phase }
  | { type: 'vfx'; key: string; x: number; y: number; flip: boolean; frameTicks: number; behind?: boolean }
  | { type: 'land'; x: number; y: number; dust: boolean }
  | { type: 'jump' };

export interface WorldBox { x: number; y: number; w: number; h: number }

export class Fighter {
  readonly cfg: FighterConfig;
  readonly side: 0 | 1;
  x = 0; y = FLOOR_Y; vx = 0; vy = 0; pushVx = 0;
  facing: 1 | -1 = 1;
  hp: number;
  state: FState = 'idle';
  anim: AnimKey = 'idle';
  frame = 0;
  private frameTick = 0;
  animDone = false;
  attackKind: AttackKind | null = null;
  attackHasHit = false;
  hurtTotal = 0; hurtLeft = 0; hurtWeight: 'light' | 'heavy' = 'light';
  private landLeft = 0;
  /** true while round intro/outro: fighter ignores input */
  locked = true;
  stateTicks = 0;
  events: FighterEvent[] = [];

  constructor(cfg: FighterConfig, side: 0 | 1) {
    this.cfg = cfg; this.side = side; this.hp = cfg.maxHp;
  }

  reset(x: number, facing: 1 | -1): void {
    this.x = x; this.y = FLOOR_Y; this.vx = this.vy = this.pushVx = 0; this.facing = facing;
    this.hp = this.cfg.maxHp; this.attackKind = null; this.attackHasHit = false;
    this.setState('idle'); this.setAnim('idle');
  }

  get airborne(): boolean { return this.y < FLOOR_Y - 0.01; }
  get attack(): AttackDef | null { return this.attackKind ? this.cfg.attacks[this.attackKind] : null; }
  get phase(): Phase | null { return this.state === 'attack' && this.attack ? this.attack.phases[this.frame] : null; }
  get invulnerable(): boolean {
    return this.state === 'defeat' || this.state === 'win' || (this.state === 'hurt' && this.hurtLeft <= this.cfg.hurt.invulnTail);
  }
  get actionable(): boolean { return !this.locked && (this.state === 'idle' || this.state === 'walk'); }
  get textureKey(): string { return fighterTextureKey(this.cfg.id, this.anim); }

  private setState(s: FState): void { this.state = s; this.stateTicks = 0; }

  setAnim(a: AnimKey, frame = 0): void {
    if (this.anim !== a || frame !== this.frame) this.frameTick = 0;
    this.anim = a; this.frame = frame; this.animDone = false;
  }

  /** Advance the current animation by one tick. Returns true if the frame changed. */
  private stepAnim(): boolean {
    const def = this.cfg.anims[this.anim];
    this.frameTick++;
    if (this.frameTick < def.ticks[this.frame]) return false;
    this.frameTick = 0;
    if (this.frame < def.frames - 1) { this.frame++; return true; }
    if (def.loop) { this.frame = 0; return true; }
    this.animDone = true; return false;
  }

  faceToward(opp: Fighter): void {
    if (Math.abs(opp.x - this.x) > 4) this.facing = opp.x > this.x ? 1 : -1;
  }

  update(input: PlayerInput, opp: Fighter): void {
    this.events.length = 0;
    this.stateTicks++;
    const J = this.cfg.jump;
    switch (this.state) {
      case 'idle':
      case 'walk': {
        this.faceToward(opp);
        if (!this.locked) {
          const kind: AttackKind | null = input.consume('special') ? 'special' : input.consume('heavy') ? 'heavy' : input.consume('light') ? 'light' : null;
          if (kind) { this.startAttack(kind); break; }
          if (input.held.up || input.consume('up')) {
            const dir = input.held.right === input.held.left ? 0 : input.held.right ? 1 : -1;
            this.vx = dir * J.vx; this.vy = -J.vy;
            this.setState('jump'); this.setAnim('jump', 0);
            this.events.push({ type: 'jump' });
            break;
          }
        }
        const dir = this.locked || input.held.right === input.held.left ? 0 : input.held.right ? 1 : -1;
        if (dir !== 0) {
          this.vx = dir * (dir === this.facing ? this.cfg.walkFwd : this.cfg.walkBack);
          if (this.state !== 'walk') { this.setState('walk'); this.setAnim('walk'); }
          this.stepAnim();
        } else {
          this.vx = 0;
          if (this.state !== 'idle') { this.setState('idle'); this.setAnim('idle'); }
          this.stepAnim();
        }
        this.x += this.vx;
        break;
      }
      case 'jump': {
        const g = this.vy < -J.apexWindow ? J.gUp : this.vy <= J.apexWindow ? J.gApex : J.gDown;
        this.vy += g; this.y += this.vy; this.x += this.vx;
        this.frame = this.vy < -J.apexWindow ? 0 : this.vy <= J.apexWindow ? 1 : 2;
        if (this.y >= FLOOR_Y) {
          this.y = FLOOR_Y; this.vy = 0; this.vx = 0;
          this.landLeft = J.landTicks;
          this.setState('land'); this.setAnim('land');
          this.events.push({ type: 'land', x: this.x, y: this.y, dust: J.landDust });
        }
        break;
      }
      case 'land':
        if (--this.landLeft <= 0) { this.faceToward(opp); this.setState('idle'); this.setAnim('idle'); }
        break;
      case 'attack': {
        const atk = this.attack!;
        const changed = this.stepAnim();
        if (changed) this.onAttackFrame();
        this.x += this.facing * (atk.advance[this.frame] ?? 0);
        if (this.animDone) { this.attackKind = null; this.setState('idle'); this.setAnim('idle'); this.faceToward(opp); }
        break;
      }
      case 'hurt': {
        this.hurtLeft--;
        const fr = this.cfg.hurt[this.hurtWeight].frames;
        const prog = 1 - this.hurtLeft / this.hurtTotal;
        this.frame = fr[Math.min(fr.length - 1, Math.floor(prog * fr.length))];
        if (this.airborne) { this.vy += J.gDown; this.y = Math.min(FLOOR_Y, this.y + this.vy); }
        if (this.hurtLeft <= 0 && !this.airborne) { this.setState('idle'); this.setAnim('idle'); this.faceToward(opp); }
        break;
      }
      case 'defeat':
        this.stepAnim();
        if (this.airborne) { this.vy += J.gDown; this.y = Math.min(FLOOR_Y, this.y + this.vy); }
        break;
      case 'win':
        this.stepAnim();
        break;
    }
    // knockback / pushback applies in every state
    if (Math.abs(this.pushVx) > 0.05) { this.x += this.pushVx; this.pushVx *= 0.8; } else this.pushVx = 0;
    this.x = Math.max(WALL_MARGIN, Math.min(STAGE_W - WALL_MARGIN, this.x));
  }

  private startAttack(kind: AttackKind): void {
    this.attackKind = kind; this.attackHasHit = false; this.vx = 0;
    this.setState('attack'); this.setAnim(kind, 0);
    this.events.push({ type: 'attackStart', kind });
    this.onAttackFrame();
  }

  private onAttackFrame(): void {
    const atk = this.attack!; const kind = this.attackKind!;
    this.events.push({ type: 'attackFrame', kind, frame: this.frame, phase: atk.phases[this.frame] });
    const v = atk.vfx;
    if (v && v.onFrame === this.frame) {
      const s = this.cfg.frame.scale;
      this.events.push({ type: 'vfx', key: v.key, x: this.x + this.facing * v.dx * s, y: this.y + v.dy * s, flip: this.facing < 0, frameTicks: v.frameTicks, behind: v.behind });
    }
  }

  takeHit(atk: AttackDef, fromX: number): void {
    const dir: 1 | -1 = this.x > fromX ? 1 : this.x < fromX ? -1 : (this.facing === 1 ? -1 : 1);
    this.facing = (dir === 1 ? -1 : 1); // direction-aware: turn to face the attacker
    this.hp = Math.max(0, this.hp - atk.damage);
    this.attackKind = null;
    const r = this.cfg.hurt[atk.weight];
    this.pushVx = dir * atk.knockback * r.pushScale;
    if (this.hp <= 0) {
      this.pushVx = dir * Math.max(atk.knockback, 10);
      this.setState('defeat'); this.setAnim('defeat');
      this.locked = true;
      return;
    }
    this.hurtWeight = atk.weight;
    this.hurtTotal = this.hurtLeft = Math.max(4, Math.round(atk.hitstun * r.stunScale)) + this.cfg.hurt.invulnTail;
    this.setState('hurt'); this.setAnim('hurt', r.frames[0]);
  }

  win(): void { this.setState('win'); this.setAnim('win'); this.locked = true; this.vx = 0; }

  // ---------- collision geometry (world space) ----------
  toWorld(b: Box): WorldBox {
    const s = this.cfg.frame.scale;
    const x = this.facing === 1 ? this.x + b.x * s : this.x - (b.x + b.w) * s;
    return { x, y: this.y + b.y * s, w: b.w * s, h: b.h * s };
  }
  activeHitbox(): WorldBox | null {
    const atk = this.attack;
    if (this.state !== 'attack' || !atk || this.attackHasHit) return null;
    const b = atk.hitboxes[this.frame];
    return b ? this.toWorld(b) : null;
  }
  /** Hitbox for the overlay (shown even after it connected, dimmed). */
  overlayHitbox(): WorldBox | null {
    const atk = this.attack; if (this.state !== 'attack' || !atk) return null;
    const b = atk.hitboxes[this.frame]; return b ? this.toWorld(b) : null;
  }
  hurtboxes(): WorldBox[] {
    if (this.invulnerable) return [];
    return getHurtboxes(this.textureKey, this.frame).map((b) => this.toWorld(b));
  }
  hurtboxesForOverlay(): WorldBox[] { return getHurtboxes(this.textureKey, this.frame).map((b) => this.toWorld(b)); }
  pushbox(): WorldBox { return this.toWorld(this.cfg.pushbox); }
}

export function overlap(a: WorldBox, b: WorldBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
