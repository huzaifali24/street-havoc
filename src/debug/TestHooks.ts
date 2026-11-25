// window.__sh16 — automation hooks for the Playwright checks in tests/ (dev builds or ?test=1).
// Lets a test pause the fixed-tick loop, step exact ticks, inject input, and read back
// fighter state, collision boxes, camera/HUD geometry and parallax coverage.
import type { FightScene } from '../scenes/FightScene';
import type { Buttons, ButtonName } from '../core/Input';
import { assetProblems } from '../scenes/BootScene';
import { allAssets } from '../assets/manifest';
import { FLOOR_Y, BAND_TOP, BAND_BOTTOM, cameraCenterX } from '../core/world';

export function installTestHooks(scene: FightScene): void {
  const toScreen = (x: number, y: number) => {
    const v = scene.view; const W = scene.scale.width, H = scene.scale.height;
    return { x: (x - scene.camX) * v.zoom + W / 2, y: (y - v.centerY) * v.zoom + H / 2 };
  };
  const boxToScreen = (b: { x: number; y: number; w: number; h: number }) => {
    const p = toScreen(b.x, b.y); return { x: p.x, y: p.y, w: b.w * scene.view.zoom, h: b.h * scene.view.zoom };
  };
  const api = {
    ready: true,
    snapshot() {
      return {
        tick: scene.tickCount, phase: scene.phase, round: scene.round, hitstop: scene.hitstop, wins: [...scene.hud.wins],
        timeLeft: scene.hud.timeLeft,
        fighters: scene.fighters.map((f) => ({
          id: f.cfg.id, state: f.state, anim: f.anim, frame: f.frame, phase: f.phase, hp: f.hp, maxHp: f.cfg.maxHp,
          x: f.x, y: f.y, facing: f.facing, locked: f.locked, invulnerable: f.invulnerable, attackHasHit: f.attackHasHit,
          pushVx: f.pushVx, hitbox: f.overlayHitbox(), activeHitbox: f.activeHitbox(), hurtboxes: f.hurtboxesForOverlay(),
          screenBox: boxToScreen({ x: f.x - 60, y: f.y - (f.cfg.id === 'brom' ? 200 : 216), w: 120, h: f.cfg.id === 'brom' ? 200 : 216 }),
        })),
        camera: { zoom: scene.view.zoom, cx: scene.camX, cy: scene.view.centerY, viewW: scene.view.viewW, viewH: scene.view.viewH },
        screen: { W: scene.scale.width, H: scene.scale.height },
        band: { top: toScreen(0, BAND_TOP).y, bottom: toScreen(0, BAND_BOTTOM).y, floor: toScreen(0, FLOOR_Y).y },
        hudRects: scene.hud.rects(), touchRects: scene.touch.rects(),
        coverage: { ...scene.stage.coverage },
        problems: [...assetProblems],
        hits: [...scene.hitLog],
        overlay: scene.overlay.enabled,
        spriteScales: scene.sprites.map((s) => [s.scaleX, s.scaleY]),
        layerScales: scene.stage.layers.map((l) => [l.name, l.img.scaleX, l.img.scaleY]),
      };
    },
    pause() { scene.paused = true; },
    resume() { scene.paused = false; },
    step(n = 1) { for (let i = 0; i < n; i++) scene.tick(); scene.renderFrame(); return api.snapshot(); },
    /** hold buttons on a side until changed */
    hold(side: number, b: Partial<Buttons>) { scene.scripts[side].set(b); },
    tap(side: number, name: ButtonName) { scene.scripts[side].tap(name); },
    /** skip the round intro and place fighters for a test */
    setup(o: { p1x?: number; p2x?: number; hp?: [number, number] } = {}) {
      scene.startMatch();
      const [a, b] = scene.fighters;
      if (o.p1x != null) a.x = o.p1x; if (o.p2x != null) b.x = o.p2x;
      if (o.hp) { a.hp = o.hp[0]; b.hp = o.hp[1]; }
      a.faceToward(b); b.faceToward(a);
      scene.hud.setAnnounce('');
      scene.setPhase('fight');
      scene.hitLog = [];
      scene.camX = cameraCenterX((a.x + b.x) / 2, scene.view.viewW);
      scene.renderFrame();
      return api.snapshot();
    },
    hitboxes(on: boolean) { scene.overlay.enabled = on; scene.renderFrame(); },
    worldToScreen: toScreen,
    touchTargets() { return { stick: scene.touch.stickCenter(), light: scene.touch.buttonCenter('light'), heavy: scene.touch.buttonCenter('heavy'), special: scene.touch.buttonCenter('special') }; },
    manifest() { return allAssets(); },
    lastPress(side: number) { return { ...scene.inputs[side].lastPressTick }; },
  };
  (window as unknown as { __sh16: typeof api }).__sh16 = api;
}
