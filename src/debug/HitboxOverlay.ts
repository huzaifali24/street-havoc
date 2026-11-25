// Toggleable collision overlay (F2 or ` key; enabled in dev builds or with ?debug=1).
//   green  = hurtbox (vulnerable)          grey dashed-look = hurtbox while invulnerable
//   red    = hitbox on an active frame     dim red = active hitbox that already connected
//   yellow = pushbox (body collision)      white cross = sprite anchor (feet)
import Phaser from 'phaser';
import type { Fighter } from '../fighters/FighterController';

export class HitboxOverlay {
  private g: Phaser.GameObjects.Graphics;
  enabled = false;
  constructor(scene: Phaser.Scene, add: (o: Phaser.GameObjects.GameObject) => void) {
    this.g = scene.add.graphics().setDepth(1000); add(this.g);
  }
  toggle(): void { this.enabled = !this.enabled; if (!this.enabled) this.g.clear(); }

  draw(fighters: Fighter[]): void {
    const g = this.g; g.clear();
    if (!this.enabled) return;
    for (const f of fighters) {
      const p = f.pushbox();
      g.lineStyle(2, 0xffe14a, 0.9).strokeRect(p.x, p.y, p.w, p.h);
      const inv = f.invulnerable;
      for (const b of f.hurtboxesForOverlay()) {
        g.lineStyle(3, inv ? 0x8a8a9a : 0x3dff6e, inv ? 0.6 : 1).strokeRect(b.x, b.y, b.w, b.h);
      }
      const h = f.overlayHitbox();
      if (h) {
        g.fillStyle(0xff2a2a, f.attackHasHit ? 0.12 : 0.3).fillRect(h.x, h.y, h.w, h.h);
        g.lineStyle(3, 0xff2a2a, f.attackHasHit ? 0.5 : 1).strokeRect(h.x, h.y, h.w, h.h);
      }
      g.lineStyle(2, 0xffffff, 1).lineBetween(f.x - 8, f.y, f.x + 8, f.y).lineBetween(f.x, f.y - 8, f.x, f.y + 8);
    }
  }
}
