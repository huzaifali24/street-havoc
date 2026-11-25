// Virtual stick (bottom-left) + LIGHT / HEAVY / SPECIAL buttons (bottom-right).
// Everything is confined to the bottom 22% strip of the screen (BAND_SCREEN_BOTTOM), which
// the camera keeps free of the gameplay band, so controls never cover fighters or floor.
// Multi-touch: stick and buttons track separate pointers.
import Phaser from 'phaser';
import { NO_BUTTONS, type Buttons, type ButtonName, type InputSource } from '../core/Input';
import { BAND_SCREEN_BOTTOM } from '../core/world';
import { FONT } from '../assets/manifest';

interface Btn { name: ButtonName; label: string; color: number; x: number; y: number; r: number; pointer: number | null; text: Phaser.GameObjects.BitmapText }

export class TouchControls implements InputSource {
  private g: Phaser.GameObjects.Graphics;
  private stick = { x: 0, y: 0, r: 0, pointer: null as number | null, dx: 0, dy: 0 };
  private btns: Btn[] = [];
  private taps: Partial<Buttons> = {};
  private W = 0; private H = 0;
  visible = true;

  constructor(scene: Phaser.Scene, add: (o: Phaser.GameObjects.GameObject) => void) {
    this.g = scene.add.graphics(); add(this.g);
    const defs: [ButtonName, string, number][] = [['light', 'L', 0x33ccf5], ['heavy', 'H', 0xff8a1c], ['special', 'SP', 0xf2c330]];
    for (const [name, label, color] of defs) {
      const text = scene.add.bitmapText(0, 0, FONT.key, label).setOrigin(0.5, 0.5).setLetterSpacing(-1); add(text);
      this.btns.push({ name, label, color, x: 0, y: 0, r: 0, pointer: null, text });
    }
    scene.input.addPointer(3);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.move(p));
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => this.up(p));
    scene.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.up(p));
  }

  /** Top edge of the control strip in screen px. */
  get stripTop(): number { return this.H * BAND_SCREEN_BOTTOM; }

  layout(W: number, H: number): void {
    this.W = W; this.H = H;
    const strip = H * (1 - BAND_SCREEN_BOTTOM);
    const cy = H - strip / 2;
    const maxR = strip / 2 - Math.max(3, H * 0.01);         // stays inside the strip
    const r = Math.min(maxR, 70, W * 0.06);
    const mx = W * 0.04;
    this.stick.r = Math.min(maxR, 72, W * 0.07);
    this.stick.x = mx + this.stick.r; this.stick.y = cy;
    const gap = r * 0.35;
    this.btns.forEach((b, i) => {
      b.r = r; b.y = cy;
      b.x = W - mx - r - (2 - i) * (2 * r + gap);
      b.text.setPosition(b.x, b.y).setScale(Math.max(1, Math.round(r / 14)));
    });
  }

  /** Screen rects occupied by the controls (for overlap tests). */
  rects(): { x: number; y: number; w: number; h: number }[] {
    const s = this.stick;
    return [{ x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 }, ...this.btns.map((b) => ({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }))];
  }
  buttonCenter(name: ButtonName): { x: number; y: number } { const b = this.btns.find((q) => q.name === name)!; return { x: b.x, y: b.y }; }
  stickCenter(): { x: number; y: number; r: number } { return { x: this.stick.x, y: this.stick.y, r: this.stick.r }; }

  private down(p: Phaser.Input.Pointer): void {
    if (!this.visible) return;
    for (const b of this.btns) {
      if (Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r * 1.15 && b.pointer === null) { b.pointer = p.id; this.taps[b.name] = true; return; }
    }
    // stick: anywhere in the left 45% of the control strip
    if (this.stick.pointer === null && p.x < this.W * 0.45 && p.y >= this.stripTop - this.H * 0.02) {
      this.stick.pointer = p.id; this.move(p);
    }
  }
  private move(p: Phaser.Input.Pointer): void {
    if (p.id !== this.stick.pointer) return;
    let dx = p.x - this.stick.x, dy = p.y - this.stick.y;
    const d = Math.hypot(dx, dy), max = this.stick.r;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    const wasUp = this.stick.dy < -0.5 * max;
    this.stick.dx = dx; this.stick.dy = dy;
    if (!wasUp && dy < -0.5 * max) this.taps.up = true;
  }
  private up(p: Phaser.Input.Pointer): void {
    if (p.id === this.stick.pointer) { this.stick.pointer = null; this.stick.dx = this.stick.dy = 0; }
    for (const b of this.btns) if (b.pointer === p.id) b.pointer = null;
  }

  held(): Buttons {
    const b = { ...NO_BUTTONS };
    const t = this.stick.r * 0.35;
    b.left = this.stick.dx < -t; b.right = this.stick.dx > t; b.up = this.stick.dy < -this.stick.r * 0.5;
    for (const q of this.btns) if (q.pointer !== null) b[q.name] = true;
    return b;
  }
  takeTaps(): Partial<Buttons> { const t = this.taps; this.taps = {}; return t; }

  draw(): void {
    const g = this.g; g.clear();
    if (!this.visible) { this.btns.forEach((b) => b.text.setVisible(false)); return; }
    const s = this.stick;
    g.fillStyle(0x0a0814, 0.45).fillCircle(s.x, s.y, s.r);
    g.lineStyle(2, 0xb0a0d8, 0.55).strokeCircle(s.x, s.y, s.r);
    const kr = s.r * 0.45;
    g.fillStyle(s.pointer !== null ? 0xfff4c4 : 0xb0a0d8, s.pointer !== null ? 0.9 : 0.6).fillCircle(s.x + s.dx, s.y + s.dy, kr);
    g.lineStyle(2, 0x0a0814, 0.8).strokeCircle(s.x + s.dx, s.y + s.dy, kr);
    for (const b of this.btns) {
      const on = b.pointer !== null;
      g.fillStyle(0x0a0814, on ? 0.7 : 0.45).fillCircle(b.x, b.y, b.r);
      g.lineStyle(3, b.color, on ? 1 : 0.7).strokeCircle(b.x, b.y, b.r - 1.5);
      if (on) g.fillStyle(b.color, 0.35).fillCircle(b.x, b.y, b.r - 3);
      b.text.setVisible(true).setTint(b.color);
    }
  }
}
