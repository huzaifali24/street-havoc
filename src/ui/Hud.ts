// Health bars, names, round pips, timer and announcer text — drawn by the UI camera in
// screen pixels. Bars sit >= 4% of screen width/height from the edges (notch-safe).
import Phaser from 'phaser';
import type { Fighter } from '../fighters/FighterController';
import { FONT } from '../assets/manifest';

export interface HudRect { x: number; y: number; w: number; h: number }

export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private names: Phaser.GameObjects.BitmapText[] = [];
  private timer: Phaser.GameObjects.BitmapText;
  private announce: Phaser.GameObjects.BitmapText;
  private sub: Phaser.GameObjects.BitmapText;
  private debugText: Phaser.GameObjects.BitmapText;
  private trail = [1, 1];
  private flash = [0, 0];
  private bars: HudRect[] = [];
  private scale = 2;
  private fighters: Fighter[];
  wins = [0, 0];
  timeLeft = 99;

  constructor(scene: Phaser.Scene, add: (o: Phaser.GameObjects.GameObject) => void, fighters: Fighter[]) {
    this.fighters = fighters;
    this.g = scene.add.graphics(); add(this.g);
    for (let i = 0; i < 2; i++) { const t = scene.add.bitmapText(0, 0, FONT.key, fighters[i].cfg.name); add(t); this.names.push(t); }
    this.timer = scene.add.bitmapText(0, 0, FONT.key, '99').setOrigin(0.5, 0); add(this.timer);
    this.announce = scene.add.bitmapText(0, 0, FONT.key, '').setOrigin(0.5, 0.5); add(this.announce);
    this.sub = scene.add.bitmapText(0, 0, FONT.key, '').setOrigin(0.5, 0.5); add(this.sub);
    this.debugText = scene.add.bitmapText(0, 0, FONT.key, '').setOrigin(0, 1).setTint(0x9dff9d); add(this.debugText);
    [...this.names, this.timer, this.announce, this.sub, this.debugText].forEach((t) => t.setLetterSpacing(-1));
  }

  layout(W: number, H: number): void {
    this.scale = Math.max(1, Math.min(4, Math.round(H / 260)));
    const mx = Math.ceil(W * 0.04), my = Math.ceil(H * 0.04);
    const timerW = 34 * this.scale;
    const barW = Math.floor((W - 2 * mx - timerW - 2 * mx * 0.25) / 2);
    const barH = Math.max(10, Math.round(H * 0.04));
    this.bars = [
      { x: mx, y: my, w: barW, h: barH },
      { x: W - mx - barW, y: my, w: barW, h: barH },
    ];
    const s = this.scale;
    this.names.forEach((t, i) => {
      t.setScale(s >= 3 ? s - 1 : s);
      const b = this.bars[i];
      t.setOrigin(i === 0 ? 0 : 1, 0).setPosition(i === 0 ? b.x : b.x + b.w, b.y + b.h + 3);
    });
    this.timer.setScale(s).setPosition(W / 2, my - 1);
    this.announce.setScale(s * 2).setPosition(W / 2, H * 0.36);
    this.sub.setScale(s >= 3 ? s - 1 : s).setPosition(W / 2, H * 0.36 + 14 * s + 4);
    this.debugText.setScale(1).setPosition(4, H - 4);
  }

  /** Screen rects the HUD occupies (for overlap tests). */
  rects(): HudRect[] {
    const out = this.bars.map((b) => ({ ...b }));
    this.names.forEach((t) => { const r = t.getBounds(); out.push({ x: r.x, y: r.y, w: r.width, h: r.height }); });
    const tb = this.timer.getBounds(); out.push({ x: tb.x, y: tb.y, w: tb.width, h: tb.height });
    return out;
  }

  onHit(side: number): void { this.flash[side] = 8; }

  setAnnounce(text: string, sub = '', tint = 0xffffff): void {
    this.announce.setText(text).setTint(tint);
    this.sub.setText(sub);
  }

  setDebug(text: string): void { this.debugText.setText(text); }

  draw(): void {
    const g = this.g; g.clear();
    this.timer.setText(String(Math.max(0, Math.ceil(this.timeLeft))).padStart(2, '0'));
    this.fighters.forEach((f, i) => {
      const b = this.bars[i]; if (!b) return;
      const pct = f.hp / f.cfg.maxHp;
      this.trail[i] = pct < this.trail[i] ? Math.max(pct, this.trail[i] - 0.006) : pct;
      // frame
      g.fillStyle(0x0a0814, 1).fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
      g.fillStyle(0x3a2c4a, 1).fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      g.fillStyle(0x1a1226, 1).fillRect(b.x, b.y, b.w, b.h);
      // P1 drains toward the left edge, P2 toward the right edge (full end at the centre)
      const tw = Math.round(b.w * this.trail[i]), hw = Math.round(b.w * pct);
      const tx = i === 0 ? b.x + b.w - tw : b.x, hx = i === 0 ? b.x + b.w - hw : b.x;
      g.fillStyle(0xd8343c, 1).fillRect(tx, b.y, tw, b.h);
      const col = this.flash[i] > 0 && this.flash[i] % 2 ? 0xffffff : (pct > 0.3 ? 0xf2c330 : 0xff8a1c);
      g.fillStyle(col, 1).fillRect(hx, b.y, hw, b.h);
      g.fillStyle(0xfff4c4, 1).fillRect(hx, b.y, hw, Math.max(2, Math.round(b.h * 0.25)));
      g.fillStyle(0x000000, 0.25).fillRect(hx, b.y + b.h - Math.max(2, Math.round(b.h * 0.25)), hw, Math.max(2, Math.round(b.h * 0.25)));
      // character colour tab on the outer end
      g.fillStyle(f.cfg.hudColor, 1).fillRect(i === 0 ? b.x - 3 : b.x + b.w, b.y - 3, 3, b.h + 6);
      if (this.flash[i] > 0) this.flash[i]--;
      // round-win pips under the bar, centre side
      const r = Math.max(3, Math.round(b.h * 0.32));
      for (let k = 0; k < 2; k++) {
        const px = i === 0 ? b.x + b.w - r - k * (r * 3) : b.x + r + k * (r * 3);
        const py = b.y + b.h + 4 + r;
        g.fillStyle(0x0a0814, 1).fillCircle(px, py, r + 1);
        g.fillStyle(k < this.wins[i] ? 0xf2c330 : 0x3a2c4a, 1).fillCircle(px, py, r);
      }
    });
    // timer box
    const tb = this.timer.getBounds();
    g.fillStyle(0x0a0814, 0.85).fillRect(tb.x - 4, tb.y - 3, tb.width + 8, tb.height + 6);
  }
}
