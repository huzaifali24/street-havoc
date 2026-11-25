// Per-player input: merges keyboard, touch, CPU and test-injected sources, sampled once per
// fixed tick. Presses are latched between ticks (a tap shorter than one tick is never lost)
// and buffered for a few ticks so an attack pressed during hit-stop/recovery still comes out.

export interface Buttons { left: boolean; right: boolean; up: boolean; light: boolean; heavy: boolean; special: boolean }
export const NO_BUTTONS: Buttons = { left: false, right: false, up: false, light: false, heavy: false, special: false };
export type ButtonName = keyof Buttons;
const NAMES: ButtonName[] = ['left', 'right', 'up', 'light', 'heavy', 'special'];

export interface InputSource {
  /** current held state */
  held(): Buttons;
  /** buttons pressed since the last call (latched taps), then cleared */
  takeTaps(): Partial<Buttons>;
}

export const BUFFER_TICKS = 6;

export class PlayerInput {
  sources: InputSource[] = [];
  held: Buttons = { ...NO_BUTTONS };
  private prev: Buttons = { ...NO_BUTTONS };
  /** ticks remaining on each buffered press */
  buffer: Record<ButtonName, number> = { left: 0, right: 0, up: 0, light: 0, heavy: 0, special: 0 };
  enabled = true;
  /** tick number of the most recent fresh press, for latency measurement */
  lastPressTick: Record<ButtonName, number> = { left: -1, right: -1, up: -1, light: -1, heavy: -1, special: -1 };

  sample(tick: number): void {
    const h: Buttons = { ...NO_BUTTONS };
    const taps: Partial<Buttons> = {};
    for (const s of this.sources) {
      const sh = s.held();
      for (const n of NAMES) if (sh[n]) h[n] = true;
      Object.assign(taps, Object.fromEntries(Object.entries(s.takeTaps()).filter(([, v]) => v)));
    }
    for (const n of NAMES) {
      if (this.buffer[n] > 0) this.buffer[n]--;
      const fresh = (h[n] && !this.prev[n]) || !!taps[n];
      if (fresh && this.enabled) { this.buffer[n] = BUFFER_TICKS; this.lastPressTick[n] = tick; }
    }
    this.prev = h;
    this.held = this.enabled ? h : { ...NO_BUTTONS };
    if (!this.enabled) for (const n of NAMES) this.buffer[n] = 0;
  }

  consume(n: ButtonName): boolean {
    if (this.buffer[n] > 0) { this.buffer[n] = 0; return true; }
    return false;
  }
}

/** Keyboard source driven by DOM key codes. */
export class KeyboardSource implements InputSource {
  private down = new Set<string>();
  private tapped = new Set<string>();
  private map: Record<ButtonName, string[]>;
  constructor(map: Record<ButtonName, string[]>) { this.map = map; }
  keyDown(code: string): void { if (!this.down.has(code)) this.tapped.add(code); this.down.add(code); }
  keyUp(code: string): void { this.down.delete(code); }
  clear(): void { this.down.clear(); this.tapped.clear(); }
  held(): Buttons {
    const b = { ...NO_BUTTONS };
    for (const n of NAMES) b[n] = this.map[n].some((c) => this.down.has(c));
    return b;
  }
  takeTaps(): Partial<Buttons> {
    const t: Partial<Buttons> = {};
    for (const n of NAMES) if (this.map[n].some((c) => this.tapped.has(c))) t[n] = true;
    this.tapped.clear();
    return t;
  }
}

/** Programmatic source used by the CPU stub and the Playwright test hooks. */
export class ScriptSource implements InputSource {
  state: Buttons = { ...NO_BUTTONS };
  private taps: Partial<Buttons> = {};
  set(b: Partial<Buttons>): void { this.state = { ...NO_BUTTONS, ...b }; }
  tap(n: ButtonName): void { this.taps[n] = true; }
  held(): Buttons { return this.state; }
  takeTaps(): Partial<Buttons> { const t = this.taps; this.taps = {}; return t; }
}

export const P1_KEYS: Record<ButtonName, string[]> = {
  left: ['KeyA'], right: ['KeyD'], up: ['KeyW', 'Space'], light: ['KeyJ'], heavy: ['KeyK'], special: ['KeyL'],
};
/** In 1-player mode P1 also accepts arrows + Z/X/C. */
export const P1_ALT_KEYS: Record<ButtonName, string[]> = {
  left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], light: ['KeyZ'], heavy: ['KeyX'], special: ['KeyC'],
};
export const P2_KEYS: Record<ButtonName, string[]> = {
  left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], light: ['Comma', 'Numpad1'], heavy: ['Period', 'Numpad2'], special: ['Slash', 'Numpad3'],
};
