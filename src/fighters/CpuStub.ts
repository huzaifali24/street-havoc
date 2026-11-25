// Very small CPU opponent for single-player testing. Not a real AI — it approaches,
// pokes with whichever attack fits the range, occasionally jumps or backs off.
import { ScriptSource } from '../core/Input';
import type { Fighter } from './FighterController';

export class CpuStub {
  readonly source = new ScriptSource();
  private wait = 30;
  private holdDir = 0;
  private holdTicks = 0;
  private rnd: () => number;
  constructor(seed: number) {
    let s = seed >>> 0 || 1;
    this.rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  }

  tick(self: Fighter, opp: Fighter): void {
    if (self.locked) { this.source.set({}); return; }
    if (this.holdTicks > 0) {
      this.holdTicks--;
      this.source.set(this.holdDir > 0 ? { right: true } : this.holdDir < 0 ? { left: true } : {});
      return;
    }
    this.source.set({});
    if (--this.wait > 0) return;
    const dist = Math.abs(opp.x - self.x);
    const toward = opp.x > self.x ? 1 : -1;
    const r = this.rnd();
    const reach = self.cfg.id === 'brom' ? 150 : 140;
    if (opp.state === 'defeat') { this.wait = 60; return; }
    if (dist > reach + 40) {
      if (r < 0.06) { this.source.set({ up: true, right: toward > 0, left: toward < 0 }); this.wait = 40; return; }
      this.holdDir = toward; this.holdTicks = 10 + Math.floor(this.rnd() * 20); this.wait = 1; return;
    }
    if (r < 0.45) this.source.tap('light');
    else if (r < 0.65) this.source.tap('heavy');
    else if (r < 0.82) this.source.tap('special');
    else { this.holdDir = -toward; this.holdTicks = 12 + Math.floor(this.rnd() * 14); }
    this.wait = 18 + Math.floor(this.rnd() * 26);
  }
}
