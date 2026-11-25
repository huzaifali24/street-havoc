// The match: stage + both fighters + HUD + touch controls, best-of-3 rounds.
// Game logic runs on a fixed 60 Hz tick (deterministic; hit-stop counts ticks).
// Two cameras: the main camera renders the world (zoomed per aspect ratio), a UI camera
// renders HUD/touch controls in raw screen pixels.
import Phaser from 'phaser';
import { FIGHTERS, VFX_ORIGINS, VFX_SHEETS } from '../assets/manifest';
import { Fighter, overlap, type WorldBox } from '../fighters/FighterController';
import type { AttackKind } from '../fighters/FighterConfig';
import { CpuStub } from '../fighters/CpuStub';
import { KeyboardSource, P1_ALT_KEYS, P1_KEYS, P2_KEYS, PlayerInput, ScriptSource } from '../core/Input';
import { readOptions, type GameOptions } from '../core/options';
import { cameraCenterX, computeView, FLOOR_Y, MAX_SEPARATION, STAGE_W, TICK_MS, WALL_MARGIN, type ViewLayout } from '../core/world';
import { ScrapyardDocks } from '../stage/ScrapyardDocks';
import { Hud } from '../ui/Hud';
import { TouchControls } from '../ui/TouchControls';
import { HitboxOverlay } from '../debug/HitboxOverlay';
import { installTestHooks } from '../debug/TestHooks';

type Phase = 'intro' | 'fight' | 'ko' | 'timeup' | 'roundEnd' | 'matchEnd';

interface Vfx { spr: Phaser.GameObjects.Sprite; frames: number; frameTicks: number; t: number }
interface Ghost { spr: Phaser.GameObjects.Sprite; life: number }

export interface HitLog { tick: number; attacker: number; kind: AttackKind; frame: number; damage: number; defHp: number; defState: string; knockDir: number; hitstop: number }

export const ROUND_TIME = 99;
const START_GAP = 440;

export class FightScene extends Phaser.Scene {
  opts!: GameOptions;
  fighters: Fighter[] = [];
  inputs: PlayerInput[] = [];
  scripts: ScriptSource[] = [];
  keyboards: KeyboardSource[] = [];
  touch!: TouchControls;
  hud!: Hud;
  overlay!: HitboxOverlay;
  stage!: ScrapyardDocks;
  cpu: CpuStub | null = null;
  worldLayer!: Phaser.GameObjects.Layer;
  uiLayer!: Phaser.GameObjects.Layer;
  uiCam!: Phaser.Cameras.Scene2D.Camera;
  view!: ViewLayout;
  camX = STAGE_W / 2;
  shake = 0;
  tickCount = 0;
  hitstop = 0;
  phase: Phase = 'intro';
  phaseTicks = 0;
  round = 1;
  roundWinner = -1;
  paused = false;
  hitLog: HitLog[] = [];
  private acc = 0;
  sprites: Phaser.GameObjects.Sprite[] = [];
  private shadows!: Phaser.GameObjects.Graphics;
  private vfx: Vfx[] = [];
  private ghosts: Ghost[] = [];
  private rotateMsg!: Phaser.GameObjects.BitmapText;
  private fpsAvg = 60;

  constructor() { super('fight'); }

  create(): void {
    this.opts = readOptions();
    const cfgOf = (id: string) => FIGHTERS.find((f) => f.id === id)!;
    this.fighters = [new Fighter(cfgOf(this.opts.p1), 0), new Fighter(cfgOf(this.opts.p2), 1)];

    this.worldLayer = this.add.layer();
    this.uiLayer = this.add.layer();
    const addW = (o: Phaser.GameObjects.GameObject) => this.worldLayer.add(o);
    const addU = (o: Phaser.GameObjects.GameObject) => this.uiLayer.add(o);

    this.stage = new ScrapyardDocks(this, addW);
    this.shadows = this.add.graphics().setDepth(-10); addW(this.shadows);
    this.fighters.forEach((f, i) => {
      const s = this.add.sprite(0, 0, f.textureKey, 0).setOrigin(f.cfg.frame.anchorX / f.cfg.frame.w, f.cfg.frame.anchorY / f.cfg.frame.h)
        .setScale(f.cfg.frame.scale).setDepth(10 + i);
      addW(s); this.sprites.push(s);
    });
    this.overlay = new HitboxOverlay(this, addW);
    this.overlay.enabled = this.opts.debugAllowed && this.opts.hitboxes;

    this.hud = new Hud(this, addU, this.fighters);
    this.touch = new TouchControls(this, addU);
    this.touch.visible = this.opts.touch;
    this.rotateMsg = this.add.bitmapText(0, 0, 'arcade', 'ROTATE YOUR DEVICE').setOrigin(0.5).setVisible(false); addU(this.rotateMsg);

    // cameras
    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.cameras.main.ignore(this.uiLayer);
    this.uiCam.ignore(this.worldLayer);

    // input wiring
    const twoP = this.opts.cpu === 'none';
    for (let i = 0; i < 2; i++) {
      const pi = new PlayerInput(); const sc = new ScriptSource(); pi.sources.push(sc);
      this.inputs.push(pi); this.scripts.push(sc);
    }
    const k1 = new KeyboardSource(P1_KEYS); this.inputs[0].sources.push(k1); this.keyboards.push(k1);
    if (twoP) { const k2 = new KeyboardSource(P2_KEYS); this.inputs[1].sources.push(k2); this.keyboards.push(k2); }
    else { const k1b = new KeyboardSource(P1_ALT_KEYS); this.inputs[0].sources.push(k1b); this.keyboards.push(k1b); }
    this.inputs[0].sources.push(this.touch);
    if (this.opts.cpu === 'p2') { this.cpu = new CpuStub(this.opts.seed); this.inputs[1].sources.push(this.cpu.source); }

    const onDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      if ((e.code === 'F2' || e.code === 'Backquote') && this.opts.debugAllowed) { e.preventDefault(); this.overlay.toggle(); return; }
      this.keyboards.forEach((k) => k.keyDown(e.code));
    };
    const onUp = (e: KeyboardEvent) => this.keyboards.forEach((k) => k.keyUp(e.code));
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', () => this.keyboards.forEach((k) => k.clear()));
    this.events.once('shutdown', () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); });

    this.scale.on('resize', (s: Phaser.Structs.Size) => this.layout(s.width, s.height));
    this.layout(this.scale.width, this.scale.height);
    this.startMatch();
    if (this.opts.test) installTestHooks(this);
  }

  // ---------------------------------------------------------------- layout
  layout(W: number, H: number): void {
    this.view = computeView(W, H);
    this.cameras.main.setSize(W, H);
    this.uiCam.setSize(W, H);
    this.hud.layout(W, H);
    this.touch.layout(W, H);
    this.rotateMsg.setPosition(W / 2, H / 2).setScale(Math.max(2, Math.round(W / 160))).setVisible(W / H < 1.15);
    this.camX = cameraCenterX(this.camX, this.view.viewW);
    this.renderFrame();
  }

  // ---------------------------------------------------------------- match flow
  startMatch(): void {
    this.hud.wins = [0, 0];
    this.round = 1;
    this.hitLog = [];
    this.startRound();
  }

  startRound(): void {
    const mid = STAGE_W / 2;
    this.fighters[0].reset(mid - START_GAP / 2, 1);
    this.fighters[1].reset(mid + START_GAP / 2, -1);
    this.fighters.forEach((f) => (f.locked = true));
    this.vfx.forEach((v) => v.spr.destroy()); this.vfx = [];
    this.hitstop = 0;
    this.hud.timeLeft = ROUND_TIME;
    this.camX = mid;
    this.setPhase('intro');
  }

  setPhase(p: Phase): void {
    this.phase = p; this.phaseTicks = 0;
    const lock = p !== 'fight';
    this.fighters.forEach((f) => { if (lock) f.locked = true; else if (f.state !== 'defeat') f.locked = false; });
    this.inputs.forEach((i) => (i.enabled = p === 'fight' || p === 'matchEnd'));
  }

  private updatePhase(): void {
    this.phaseTicks++;
    const t = this.phaseTicks;
    const [a, b] = this.fighters;
    switch (this.phase) {
      case 'intro':
        if (t === 1) this.hud.setAnnounce(`ROUND ${this.round}`, this.round === 3 ? 'FINAL ROUND' : '', 0xfff4c4);
        if (t === 70) this.hud.setAnnounce('FIGHT!', '', 0xf6a24a);
        if (t >= 110) { this.hud.setAnnounce(''); this.setPhase('fight'); }
        break;
      case 'fight':
        this.hud.timeLeft = Math.max(0, this.hud.timeLeft - 1 / 60);
        if (this.hud.timeLeft <= 0) {
          const ra = a.hp / a.cfg.maxHp, rb = b.hp / b.cfg.maxHp;
          this.roundWinner = ra === rb ? -1 : ra > rb ? 0 : 1;
          this.hud.setAnnounce('TIME', '', 0xfff4c4);
          this.setPhase('timeup');
        }
        break;
      case 'ko':
      case 'timeup':
        if (t === 90) {
          const w = this.roundWinner;
          if (w >= 0) {
            const wf = this.fighters[w];
            wf.pushVx = 0; wf.win();
            this.hud.wins[w]++;
            this.hud.setAnnounce(`${wf.cfg.name} WINS`, '', wf.cfg.hudColor);
          } else this.hud.setAnnounce('DRAW', '', 0xfff4c4);
        }
        if (t >= 200) {
          const champ = this.hud.wins.findIndex((w) => w >= 2);
          if (champ >= 0) {
            const cf = this.fighters[champ];
            this.hud.setAnnounce(`${cf.cfg.name} WINS`, 'PRESS ANY ATTACK TO REMATCH', cf.cfg.hudColor);
            this.setPhase('matchEnd');
          } else { this.round++; this.startRound(); }
        }
        break;
      case 'matchEnd':
        if (t > 30 && this.inputs.some((i) => i.consume('light') || i.consume('heavy') || i.consume('special'))) this.startMatch();
        break;
    }
  }

  // ---------------------------------------------------------------- tick
  tick(): void {
    this.tickCount++;
    if (this.cpu) this.cpu.tick(this.fighters[1], this.fighters[0]);
    this.inputs.forEach((i) => i.sample(this.tickCount));
    this.updatePhase();

    if (this.hitstop > 0) {
      this.hitstop--;
    } else {
      const [a, b] = this.fighters;
      a.update(this.inputs[0], b);
      b.update(this.inputs[1], a);
      for (const f of this.fighters) this.handleEvents(f);
      this.resolvePush();
      this.resolveHits();
      this.tickVfx();
    }
    const mid = (this.fighters[0].x + this.fighters[1].x) / 2;
    const target = cameraCenterX(mid, this.view.viewW);
    this.camX += (target - this.camX) * 0.2;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - 0.4);
  }

  private handleEvents(f: Fighter): void {
    for (const e of f.events) {
      if (e.type === 'vfx') this.spawnVfx(e.key, e.x, e.y, e.flip, e.frameTicks, e.behind ? 8 : 20);
      if (e.type === 'land' && e.dust) { this.spawnVfx('vfx_dust', e.x, e.y, false, 4, 9); this.shake = Math.max(this.shake, 1.5); }
    }
    // afterimages on active frames of selected attacks
    if (f.state === 'attack' && f.attackKind && f.cfg.afterimages.includes(f.attackKind) && f.phase === 'active' && this.tickCount % 2 === 0) {
      const spr = this.add.sprite(f.x, f.y, f.textureKey, f.frame)
        .setOrigin(f.cfg.frame.anchorX / f.cfg.frame.w, f.cfg.frame.anchorY / f.cfg.frame.h)
        .setScale(f.cfg.frame.scale).setFlipX(f.facing < 0).setTintFill(0x33ccf5).setAlpha(0.45).setDepth(5);
      this.worldLayer.add(spr);
      this.ghosts.push({ spr, life: 10 });
    }
  }

  private resolvePush(): void {
    const [a, b] = this.fighters;
    const pa = a.pushbox(), pb = b.pushbox();
    if (overlap(pa, pb)) {
      const overlapX = a.x < b.x ? pa.x + pa.w - pb.x : pb.x + pb.w - pa.x;
      const dir = a.x < b.x ? -1 : a.x > b.x ? 1 : (a.facing === 1 ? -1 : 1);
      a.x += dir * overlapX / 2; b.x -= dir * overlapX / 2;
      for (const f of this.fighters) f.x = Math.max(WALL_MARGIN, Math.min(STAGE_W - WALL_MARGIN, f.x));
      // if one is pinned at a wall the other takes the full push
      const pa2 = a.pushbox(), pb2 = b.pushbox();
      if (overlap(pa2, pb2)) {
        const ov = a.x < b.x ? pa2.x + pa2.w - pb2.x : pb2.x + pb2.w - pa2.x;
        const free = (a.x <= WALL_MARGIN + 0.5 || a.x >= STAGE_W - WALL_MARGIN - 0.5) ? b : a;
        free.x += (free === a ? dir : -dir) * ov;
      }
    }
    // max separation: the camera must always see both fighters
    for (const [f, o] of [[a, b], [b, a]] as const) f.x = Math.max(o.x - MAX_SEPARATION, Math.min(o.x + MAX_SEPARATION, f.x));
  }

  private resolveHits(): void {
    const hits: { atk: Fighter; def: Fighter; hb: WorldBox; hu: WorldBox }[] = [];
    for (const atk of this.fighters) {
      const def = this.fighters[1 - atk.side];
      const hb = atk.activeHitbox();
      if (!hb) continue;
      const hu = def.hurtboxes().find((h) => overlap(hb, h));
      if (hu) hits.push({ atk, def, hb, hu });
    }
    for (const { atk, def, hb, hu } of hits) {
      const A = atk.attack!; const kind = atk.attackKind!; const frame = atk.frame;
      atk.attackHasHit = true;
      const atWall = def.x <= WALL_MARGIN + 2 || def.x >= STAGE_W - WALL_MARGIN - 2;
      def.takeHit(A, atk.x);
      if (atWall) atk.pushVx = -Math.sign(def.x - atk.x || atk.facing) * A.knockback * 0.6;
      this.hitstop = Math.max(this.hitstop, A.hitstop);
      this.shake = Math.max(this.shake, A.shake ?? 0);
      const cx = (Math.max(hb.x, hu.x) + Math.min(hb.x + hb.w, hu.x + hu.w)) / 2;
      const cy = (Math.max(hb.y, hu.y) + Math.min(hb.y + hb.h, hu.y + hu.h)) / 2;
      this.spawnVfx(atk.cfg.hitSpark, cx, cy, atk.facing < 0, 2, 25);
      this.hud.onHit(def.side);
      this.hitLog.push({ tick: this.tickCount, attacker: atk.side, kind, frame, damage: A.damage, defHp: def.hp, defState: def.state, knockDir: Math.sign(def.pushVx), hitstop: A.hitstop });
      if (def.state === 'defeat' && this.phase === 'fight') {
        this.roundWinner = atk.side;
        this.hitstop = 24; // dramatic KO freeze
        this.hud.setAnnounce('K.O.', '', 0xff5a3c);
        this.setPhase('ko');
      }
    }
  }

  spawnVfx(key: string, x: number, y: number, flip: boolean, frameTicks: number, depth: number): void {
    const sheet = VFX_SHEETS.find((s) => s.key === key); if (!sheet) return;
    const [ox, oy] = VFX_ORIGINS[key] ?? [0.5, 0.5];
    const spr = this.add.sprite(x, y, key, 0).setScale(2).setDepth(depth).setFlipX(flip)
      .setOrigin(flip ? 1 - ox : ox, oy);
    this.worldLayer.add(spr);
    this.vfx.push({ spr, frames: sheet.frames, frameTicks, t: 0 });
  }

  private tickVfx(): void {
    this.vfx = this.vfx.filter((v) => {
      v.t++;
      const f = Math.floor(v.t / v.frameTicks);
      if (f >= v.frames) { v.spr.destroy(); return false; }
      v.spr.setFrame(f); return true;
    });
    this.ghosts = this.ghosts.filter((g) => {
      g.life--; g.spr.setAlpha(Math.max(0, g.life / 10) * 0.45);
      if (g.life <= 0) { g.spr.destroy(); return false; }
      return true;
    });
  }

  // ---------------------------------------------------------------- frame
  private lastNow = 0;
  update(): void {
    // Wall-clock delta (Phaser's smoothed delta under-reports when frames drop, which
    // would make the fixed-tick simulation run in slow motion on slow devices).
    const now = performance.now();
    const delta = this.lastNow ? now - this.lastNow : TICK_MS;
    this.lastNow = now;
    this.fpsAvg = this.fpsAvg * 0.95 + (1000 / Math.max(1, delta)) * 0.05;
    if (!this.paused) {
      this.acc += Math.min(delta, 250);
      while (this.acc >= TICK_MS) { this.acc -= TICK_MS; this.tick(); }
    }
    this.renderFrame();
  }

  renderFrame(): void {
    if (!this.view) return;
    const cam = this.cameras.main;
    const sx = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake : 0;
    const sy = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake * 0.5 : 0;
    cam.setZoom(this.view.zoom);
    cam.centerOn(this.camX + sx, this.view.centerY + sy);
    const v = this.view;
    this.stage.update(this.camX, { left: this.camX - v.viewW / 2, right: this.camX + v.viewW / 2, top: v.centerY - v.viewH / 2, bottom: v.centerY + v.viewH / 2 });

    this.shadows.clear();
    this.fighters.forEach((f, i) => {
      const s = this.sprites[i];
      const jiggle = this.hitstop > 0 && f.state === 'hurt' ? (this.tickCount % 2 ? 2 : -2) : 0;
      s.setTexture(f.textureKey, f.frame).setFlipX(f.facing < 0).setPosition(Math.round(f.x + jiggle), Math.round(f.y));
      s.setDepth(f.state === 'attack' ? 12 : 10 + i);
      const h = Math.max(0, FLOOR_Y - f.y);
      const w = (f.cfg.id === 'brom' ? 70 : 56) * Math.max(0.45, 1 - h / 400);
      this.shadows.fillStyle(0x0a0614, 0.45).fillEllipse(f.x, FLOOR_Y + 2, w * 2, 12);
    });
    this.overlay.draw(this.fighters);
    this.hud.draw();
    this.touch.draw();
    if (this.overlay.enabled) {
      const f = this.fighters;
      this.hud.setDebug(`FPS ${Math.round(this.fpsAvg)}  P1 ${f[0].state.toUpperCase()} ${f[0].anim.toUpperCase()}:${f[0].frame}  P2 ${f[1].state.toUpperCase()} ${f[1].anim.toUpperCase()}:${f[1].frame}  HITSTOP ${this.hitstop}`);
    } else this.hud.setDebug('');
  }
}
