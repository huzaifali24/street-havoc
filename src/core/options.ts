// Match options from the URL — this is the "minimal stub" character select for Milestone 1.
//   ?p1=kessa&p2=brom   which fighter each side plays (default Kessa vs Brom)
//   ?cpu=p2|off|none    p2 = CPU-stub controls player 2 (default); off = P2 stands still
//                        (training dummy); none = local 2-player on one keyboard
//   ?debug=1            enables the hitbox overlay toggle (F2 / `) in production builds
//   ?hitboxes=1         start with the overlay visible
//   ?test=1             exposes window.__sh16 test hooks (always on in dev builds)
//   ?seed=N             CPU RNG seed
export type CpuMode = 'p2' | 'off' | 'none';
export interface GameOptions {
  p1: 'kessa' | 'brom';
  p2: 'kessa' | 'brom';
  cpu: CpuMode;
  debugAllowed: boolean;
  hitboxes: boolean;
  test: boolean;
  seed: number;
  touch: boolean;
}

export function readOptions(): GameOptions {
  const q = new URLSearchParams(window.location.search);
  const fighter = (v: string | null, d: 'kessa' | 'brom') => (v === 'kessa' || v === 'brom' ? v : d);
  const cpuRaw = q.get('cpu');
  const cpu: CpuMode = cpuRaw === 'off' || cpuRaw === 'none' ? cpuRaw : 'p2';
  const dev = import.meta.env.DEV;
  return {
    p1: fighter(q.get('p1'), 'kessa'),
    p2: fighter(q.get('p2'), 'brom'),
    cpu,
    debugAllowed: dev || q.get('debug') === '1',
    hitboxes: q.get('hitboxes') === '1',
    test: dev || q.get('test') === '1',
    seed: Number(q.get('seed') ?? 1234) || 1234,
    touch: q.get('touch') !== '0',
  };
}
