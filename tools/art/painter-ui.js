/*
 * UI font painter + the renderAll() entry point that lists every generated asset.
 * Output paths are relative to assets/ and must match src/assets/manifest.ts.
 */
(function () {
  'use strict';
  const SH = window.SH;

  // ---- 5x7 arcade font, rendered into 7x9 cells with a 1px dark outline ----
  const CHARSET = " !'-.:/?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const G = {
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
    '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
    ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  };
  function drawFont() {
    const cw = 7, ch = 9, perRow = 16, rows = Math.ceil(CHARSET.length / perRow);
    const [c, ctx] = SH.newCanvas(cw * perRow, ch * rows);
    [...CHARSET].forEach((chr, i) => {
      const gx = (i % perRow) * cw, gy = Math.floor(i / perRow) * ch;
      const g = G[chr];
      const on = (x, y) => x >= 0 && y >= 0 && x < 5 && y < 7 && g[y][x] === '#';
      for (let y = -1; y <= 7; y++) for (let x = -1; x <= 5; x++) {
        if (on(x, y)) continue;
        let near = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (on(x + dx, y + dy)) near = true;
        if (near) SH.rect(ctx, gx + 1 + x, gy + 1 + y, 1, 1, '#0a0814');
      }
      for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (on(x, y)) SH.rect(ctx, gx + 1 + x, gy + 1 + y, 1, 1, '#ffffff');
    });
    return c;
  }

  // ---- entry points ----
  SH.renderAll = function (only) {
    const out = [];
    const push = (path, canvas, frames) => { if (!only || path.includes(only)) out.push({ path, data: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height, frames }); };
    for (const id of Object.keys(SH.fighters)) {
      const F = SH.fighters[id];
      for (const [anim, poses] of Object.entries(F.anims)) {
        if (only && !(`sprites/${id}/${anim}.png`).includes(only)) continue;
        push(`sprites/${id}/${anim}.png`, SH.renderSheet(poses, 128, 128, F.draw, F.palette), poses.length);
      }
    }
    if (SH.vfx) for (const v of SH.vfx.list()) { if (only && !v.path.includes(only)) continue; push(v.path, v.render(), v.frames); }
    if (SH.stage) for (const s of SH.stage.list()) { if (only && !s.path.includes(only)) continue; push(s.path, s.render()); }
    push('ui/font_7x9.png', drawFont());
    return out;
  };
  SH.FONT_CHARSET = CHARSET;

  // Upscaled contact sheets for eyeballing art: each fighter on a floor-colored strip.
  SH.previewSheets = function () {
    const res = [];
    const S = 3;
    for (const id of Object.keys(SH.fighters)) {
      const F = SH.fighters[id];
      const rows = Object.entries(F.anims);
      const maxF = Math.max(...rows.map(([, p]) => p.length));
      const [c, ctx] = SH.newCanvas(maxF * 128 * S, rows.length * 128 * S);
      ctx.imageSmoothingEnabled = false;
      rows.forEach(([anim, poses], r) => {
        ctx.fillStyle = r % 2 ? '#2c2240' : '#34284a'; ctx.fillRect(0, r * 128 * S, c.width, 128 * S);
        ctx.fillStyle = '#4e4760'; ctx.fillRect(0, r * 128 * S + 124 * S, c.width, 4 * S);
        const sheet = SH.renderSheet(poses, 128, 128, F.draw, F.palette);
        ctx.drawImage(sheet, 0, 0, sheet.width, 128, 0, r * 128 * S, sheet.width * S, 128 * S);
        ctx.fillStyle = '#ffffff'; ctx.font = '20px monospace'; ctx.fillText(anim, 6, r * 128 * S + 22);
        for (let i = 1; i < poses.length; i++) { ctx.fillStyle = '#00000055'; ctx.fillRect(i * 128 * S, r * 128 * S, 1, 128 * S); }
      });
      res.push({ name: `${id}.png`, data: c.toDataURL('image/png') });
    }
    return res;
  };
})();
