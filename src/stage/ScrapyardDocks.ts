// Scrapyard Docks at Dusk — parallax layer setup and the no-seam coverage check.
//
// Parallax factor s: 0.1 sky, 0.35 far quay/sea, 1.0 dock (fighting plane), 1.15 foreground.
// A layer with factor s is centred at  STAGE_W/2 + (camX - STAGE_W/2) * (1 - s)  so it
// scrolls at s × camera speed on screen. Every layer is wide enough to cover the view at
// every camera position used in play; checkCoverage() verifies it each frame (seams = 0).
import Phaser from 'phaser';
import { ART_SCALE, STAGE_H, STAGE_W } from '../core/world';

interface Layer {
  name: string;
  img: Phaser.GameObjects.Image;
  s: number;           // parallax factor
  cover: 'xy' | 'x';   // must cover the whole view, or just horizontally (decor strips)
}

export interface CoverageReport { checks: number; violations: number; worst: { layer: string; gap: number } | null }

export class ScrapyardDocks {
  readonly layers: Layer[] = [];
  private gulls: { spr: Phaser.GameObjects.Sprite; x: number; y: number; v: number; t: number }[] = [];
  readonly coverage: CoverageReport = { checks: 0, violations: 0, worst: null };

  constructor(scene: Phaser.Scene, add: (o: Phaser.GameObjects.GameObject) => void) {
    const mk = (name: string, key: string, s: number, y: number, depth: number, cover: 'xy' | 'x') => {
      const img = scene.add.image(STAGE_W / 2, y, key).setOrigin(0.5, 0).setScale(ART_SCALE).setDepth(depth);
      add(img);
      this.layers.push({ name, img, s, cover });
    };
    mk('sky', 'stage_sky', 0.1, 0, -100, 'xy');
    mk('far', 'stage_far', 0.35, 0, -90, 'x');
    mk('mid', 'stage_mid', 1.0, 0, -50, 'xy');
    mk('fg', 'stage_fg', 1.15, 990, 50, 'x');
    for (let i = 0; i < 3; i++) {
      const spr = scene.add.sprite(0, 0, 'stage_gull', 0).setScale(ART_SCALE).setDepth(-95);
      add(spr);
      this.gulls.push({ spr, x: 300 + i * 700, y: 440 + i * 46, v: 0.35 + i * 0.12, t: i * 7 });
    }
  }

  /** Position parallax layers for the camera centre and record coverage of the visible rect. */
  update(camCX: number, view: { left: number; right: number; top: number; bottom: number }): void {
    for (const L of this.layers) L.img.x = STAGE_W / 2 + (camCX - STAGE_W / 2) * (1 - L.s);
    // gulls drift on the far-layer plane and wrap within it
    for (const g of this.gulls) {
      g.x -= g.v; g.t++;
      if (g.x < -60) g.x = STAGE_W + 60;
      g.spr.setPosition(g.x + (camCX - STAGE_W / 2) * 0.75, g.y + Math.sin(g.t / 40) * 6);
      g.spr.setFrame(Math.floor(g.t / 14) % 2);
    }
    this.checkCoverage(view);
  }

  checkCoverage(view: { left: number; right: number; top: number; bottom: number }): void {
    for (const L of this.layers) {
      const w = L.img.width * L.img.scaleX, h = L.img.height * L.img.scaleY;
      const left = L.img.x - w / 2, right = L.img.x + w / 2, top = L.img.y, bottom = L.img.y + h;
      let gap = Math.max(0, left - view.left, view.right - right);
      if (L.cover === 'xy') gap = Math.max(gap, top - view.top, view.bottom - bottom);
      this.coverage.checks++;
      if (gap > 0.5) {
        this.coverage.violations++;
        if (!this.coverage.worst || gap > this.coverage.worst.gap) this.coverage.worst = { layer: L.name, gap };
      }
    }
  }

  static readonly WORLD_H = STAGE_H;
}
