/*
 * Scrapyard Docks at Dusk — parallax layers. All art at 1 art px = 2 world px.
 * Layer art coordinates: y=0 is world y=0; the fighters' feet line is art y=450 (world 900).
 * Horizon at art y≈392. Floor planks art y 420..470. See src/stage/ScrapyardDocks.ts.
 */
(function () {
  'use strict';
  const SH = window.SH;
  const { rect, line, px, disc, ellipse, ditherV, rng, newCanvas, checker } = SH;

  const W = 1200, H = 700;

  // ---------------- SKY (parallax 0.1) ----------------
  function sky() {
    const [c, ctx] = newCanvas(W, H);
    ditherV(ctx, 0, 0, W, H, [
      [0, '#0e0a26'], [110, '#1a1240'], [190, '#2c1b58'], [250, '#4a2366'], [300, '#7a2e68'],
      [338, '#b4445e'], [366, '#e0683e'], [390, '#f6a24a'], [420, '#ffc866'], [700, '#ffc866'],
    ]);
    const rnd = rng(7);
    for (let i = 0; i < 160; i++) { const y = rnd() * 210; px(ctx, rnd() * W, y, y < 120 && rnd() > 0.5 ? '#b0a0d8' : '#5a4a8a'); }
    // low sun with retro cut lines
    const sx = 800, sy = 384;
    disc(ctx, sx, sy, 60, '#f8b45a', (x, y) => ((x + y) & 1) === 0 && ((x >> 1) + (y >> 1)) % 2 === 0);
    disc(ctx, sx, sy, 50, '#f8b45a', checker);
    disc(ctx, sx, sy, 42, '#ffd27a');
    disc(ctx, sx, sy, 30, '#ffeeb0');
    for (const [y, h] of [[352, 1], [362, 2], [372, 2], [380, 3]]) rect(ctx, sx - 44, y, 88, h, '#e8783e');
    // clouds: dark bodies with sun-lit undersides
    const cloud = (x, y, w, lit) => {
      const r = rng(x * 3 + y);
      for (let k = 0; k < 6; k++) {
        const ex = x + (k / 5) * w, ry = 4 + r() * 6, rx = w * 0.18 + r() * w * 0.1;
        ellipse(ctx, ex, y, rx, ry, '#2e1f4c');
      }
      for (let k = 0; k < 6; k++) {
        const ex = x + (k / 5) * w; const rx = w * 0.16;
        ellipse(ctx, ex, y + 3, rx, 3, lit);
        ellipse(ctx, ex, y + 2, rx * 0.9, 2, '#3e2858');
      }
    };
    cloud(80, 150, 260, '#a2465e'); cloud(520, 110, 200, '#8a3a5c'); cloud(880, 172, 300, '#b84e5c');
    cloud(260, 252, 240, '#e0704a'); cloud(1000, 262, 160, '#e0704a'); cloud(620, 300, 150, '#f08a50');
    cloud(30, 320, 130, '#f6a050');
    return c;
  }

  // ---------------- FAR (parallax 0.35): sea, far quay, gantry cranes, ship ----------------
  function far() {
    const [c, ctx] = newCanvas(W, H);
    ditherV(ctx, 0, 392, W, H - 392, [[392, '#4a2f5e'], [420, '#2e2050'], [520, '#1c1538'], [700, '#120e26']]);
    const rnd = rng(21);
    // sun reflection streaks
    for (let i = 0; i < 260; i++) {
      const y = 394 + Math.pow(rnd(), 1.6) * 140; const spread = 40 + (y - 394) * 1.2;
      const x = 800 + (rnd() * 2 - 1) * spread; const w = 2 + rnd() * 10 * (1 - (y - 394) / 160);
      rect(ctx, x, y, w, 1, y < 430 ? '#f6a24a' : (rnd() > 0.5 ? '#c05a4a' : '#7a3a5a'));
    }
    for (let i = 0; i < 300; i++) rect(ctx, rnd() * W, 400 + rnd() * 300, 2 + rnd() * 6, 1, '#2c2250');
    const ink = '#22172f', ink2 = '#2c1f40', rim = '#b0505a';
    // far quay: warehouses + container rows
    rect(ctx, 0, 384, W, 10, '#1a1228');
    let x = 0;
    while (x < W) {
      const w = 40 + rnd() * 90, h = 14 + rnd() * 30;
      rect(ctx, x, 384 - h, w, h, rnd() > 0.5 ? ink : ink2); rect(ctx, x, 384 - h, w, 1, rim);
      for (let k = 0; k < 4; k++) if (rnd() > 0.5) rect(ctx, x + 4 + rnd() * (w - 8), 384 - h + 4 + rnd() * (h - 8), 2, 1, '#ffcf7a');
      x += w + rnd() * 20;
    }
    for (let i = 0; i < 70; i++) { const cx = rnd() * W, cy = 384 - (1 + Math.floor(rnd() * 3)) * 8; rect(ctx, cx, cy, 20, 8, ['#2e2046', '#34244c', '#3a2440'][i % 3]); rect(ctx, cx, cy, 20, 1, '#8a4060'); }
    // gantry cranes
    const crane = (cx, top, boomL, boomR) => {
      rect(ctx, cx - 22, top, 4, 384 - top, ink); rect(ctx, cx + 18, top, 4, 384 - top, ink);
      line(ctx, cx - 20, top + 10, cx + 20, 384 - 10, ink); line(ctx, cx + 20, top + 10, cx - 20, 384 - 10, ink);
      rect(ctx, cx - boomL, top - 6, boomL + boomR, 6, ink); rect(ctx, cx - boomL, top - 6, boomL + boomR, 1, rim);
      for (let k = cx - boomL; k < cx + boomR - 8; k += 8) line(ctx, k, top - 1, k + 8, top - 5, '#3a2850');
      rect(ctx, cx - 6, top - 50, 4, 44, ink); rect(ctx, cx + 4, top - 50, 4, 44, ink);
      line(ctx, cx - 4, top - 50, cx - boomL, top - 6, ink); line(ctx, cx + 6, top - 50, cx + boomR, top - 6, ink);
      rect(ctx, cx - 14, top + 6, 26, 14, ink2); rect(ctx, cx - 14, top + 6, 26, 1, rim);
      rect(ctx, cx - 5, top - 53, 3, 3, '#ff3b3b'); rect(ctx, cx + boomR - 3, top - 9, 2, 2, '#ff3b3b');
    };
    crane(110, 250, 60, 120); crane(390, 232, 70, 140); crane(640, 262, 50, 100); crane(1060, 240, 70, 120);
    // container ship on the horizon
    rect(ctx, 840, 378, 250, 14, '#181026'); line(ctx, 840, 378, 828, 370, '#181026'); rect(ctx, 828, 370, 14, 8, '#181026');
    for (let k = 0; k < 9; k++) for (let r = 0; r < 2; r++) rect(ctx, 850 + k * 22, 366 - r * 8, 20, 8, ['#3a2440', '#2a2848', '#40243a', '#30263e'][(k + r) % 4]);
    rect(ctx, 1052, 336, 22, 42, '#1e1430'); for (let k = 0; k < 4; k++) rect(ctx, 1055 + k * 5, 342, 2, 2, '#ffcf7a');
    rect(ctx, 1060, 322, 8, 14, '#1e1430'); rect(ctx, 840, 378, 250, 1, '#8a4060');
    // small tug
    rect(ctx, 260, 386, 50, 7, '#181026'); rect(ctx, 274, 376, 18, 10, '#1e1430'); rect(ctx, 278, 379, 2, 2, '#ffcf7a');
    return c;
  }

  // ---------------- MID (parallax 1.0): the dock we fight on ----------------
  function container(ctx, x, y, w, h, body, dark, light, rimc, seed) {
    rect(ctx, x, y, w, h, body);
    for (let k = x + 3; k < x + w - 3; k += 6) { rect(ctx, k, y + 4, 2, h - 8, light); rect(ctx, k + 2, y + 4, 1, h - 8, dark); }
    rect(ctx, x, y, w, 4, dark); rect(ctx, x, y + h - 4, w, 4, dark); rect(ctx, x, y, w, 1, rimc);
    rect(ctx, x, y, 4, h, dark); rect(ctx, x + w - 4, y, 4, h, dark);
    for (const cx of [x, x + w - 6]) for (const cy of [y, y + h - 6]) rect(ctx, cx, cy, 6, 6, '#1a1420');
    const r = rng(seed);
    for (let k = 0; k < 3; k++) rect(ctx, x + 12 + r() * (w - 40), y + 12 + r() * 20, 6 + r() * 14, 3, light);
    // rust drips
    for (let k = 0; k < 8; k++) { const rx = x + 6 + r() * (w - 12); rect(ctx, rx, y + 4, 1, 4 + r() * 14, '#4a2a24'); }
    // dusk shading toward bottom
    for (let yy = y + h - 24; yy < y + h - 4; yy++) for (let xx = x; xx < x + w; xx++) if (((xx + yy) & 1) === 0 && (yy - (y + h - 24)) > (xx & 3) * 5) px(ctx, xx, yy, dark);
  }
  function craneLeg(ctx, x, w, top, bottom) {
    const dark = '#262838', base = '#3e4258', lite = '#5a6078', rim = '#b0605a';
    rect(ctx, x, top, 7, bottom - top, base); rect(ctx, x + w - 7, top, 7, bottom - top, base);
    rect(ctx, x, top, 2, bottom - top, lite); rect(ctx, x + w - 7, top, 2, bottom - top, lite);
    rect(ctx, x + 5, top, 2, bottom - top, dark); rect(ctx, x + w - 2, top, 2, bottom - top, dark);
    for (let y = top; y < bottom - 30; y += 40) {
      rect(ctx, x + 7, y, w - 14, 4, dark);
      for (let t = 0; t < 2; t++) { line(ctx, x + 7, y + 4 + t, x + w - 8, y + 39 + t, base); line(ctx, x + w - 8, y + 4 + t, x + 7, y + 39 + t, dark); }
    }
    rect(ctx, x - 1, top, 1, bottom - top, rim);
    rect(ctx, x - 8, bottom - 26, w + 16, 22, '#2a2430'); rect(ctx, x - 8, bottom - 26, w + 16, 2, '#4a3e52');
    for (const wx of [x - 2, x + w - 10]) disc(ctx, wx + 6, bottom - 6, 6, '#141018');
  }
  function mid() {
    const [c, ctx] = newCanvas(W, H);
    const rnd = rng(42);
    // containers framing the sides (behind the dock's back edge)
    container(ctx, -6, 300, 240, 108, '#4c2632', '#341820', '#603040', '#c0606a', 1);
    container(ctx, 8, 192, 226, 108, '#263a3e', '#18282c', '#30484c', '#c0705a', 2);
    container(ctx, 120, 84, 120, 108, '#3a2c46', '#261c30', '#4a3a58', '#c06a6a', 3);
    container(ctx, 966, 300, 240, 108, '#262c46', '#181c30', '#323a58', '#c0606a', 4);
    container(ctx, 960, 192, 220, 108, '#4a3026', '#2e1c16', '#5c3c30', '#d07a5a', 5);
    // gantry crane legs
    craneLeg(ctx, 252, 40, 0, 410); craneLeg(ctx, 908, 40, 0, 410);
    // dock back edge + bollards
    rect(ctx, 0, 404, W, 16, '#2c2436'); rect(ctx, 0, 404, W, 2, '#5a4658'); rect(ctx, 0, 418, W, 2, '#1c1626');
    for (const bx of [380, 610, 820]) {
      rect(ctx, bx - 5, 398, 10, 14, '#1e1a26'); rect(ctx, bx - 8, 396, 16, 4, '#1e1a26'); rect(ctx, bx - 8, 396, 16, 1, '#c0705a'); rect(ctx, bx - 4, 400, 2, 10, '#4a4058');
    }
    ellipse(ctx, 640, 412, 14, 4, '#3a2e24'); ellipse(ctx, 640, 411, 9, 2, '#5a4634');
    // plank floor: 5 boards, clean band with strong value contrast (grey-violet, no orange/cyan)
    const boards = ['#5a5068', '#4e4760', '#555068', '#4a445c', '#514a64'];
    for (let b = 0; b < 5; b++) {
      const y = 420 + b * 10;
      rect(ctx, 0, y, W, 10, boards[b]); rect(ctx, 0, y, W, 1, '#6e6680'); rect(ctx, 0, y + 9, W, 1, '#231e2e');
      let jx = (b * 53) % 90;
      while (jx < W) { rect(ctx, jx, y + 1, 1, 8, '#231e2e'); px(ctx, jx + 2, y + 3, '#8a8298'); px(ctx, jx + 2, y + 7, '#8a8298'); px(ctx, jx - 2, y + 3, '#8a8298'); px(ctx, jx - 2, y + 7, '#8a8298'); jx += 110 + Math.floor(rnd() * 70); }
      for (let k = 0; k < 40; k++) rect(ctx, rnd() * W, y + 2 + rnd() * 6, 4 + rnd() * 18, 1, '#443e56');
    }
    // dusk warm glint along the far edge
    for (let x = 0; x < W; x += 2) if (rnd() > 0.6) px(ctx, x, 420, '#a07070');
    // front beam + fenders
    rect(ctx, 0, 470, W, 10, '#2a2032'); rect(ctx, 0, 470, W, 1, '#3e3448');
    for (let x = 20; x < W; x += 40) rect(ctx, x, 474, 2, 2, '#6a5e72');
    // under-dock shadow, pilings, water
    ditherV(ctx, 0, 480, W, H - 480, [[480, '#0e0a18'], [520, '#1a1430'], [600, '#1e1838'], [700, '#151028']]);
    for (let x = 30; x < W; x += 75) {
      rect(ctx, x, 480, 10, 90, '#2a2236'); rect(ctx, x, 480, 2, 90, '#3a3046');
      for (let y = 572; y < 640; y += 6) rect(ctx, x + Math.round(Math.sin(y) * 2), y, 10, 3, '#221c30');
    }
    for (let x = 30; x < W - 75; x += 75) { line(ctx, x + 10, 484, x + 75, 520, '#161020'); line(ctx, x + 10, 485, x + 75, 521, '#161020'); }
    for (let x = 100; x < W; x += 150) { ellipse(ctx, x, 488, 9, 11, '#100c16'); ellipse(ctx, x, 488, 4, 6, '#1a1430'); rect(ctx, x - 1, 470, 2, 8, '#100c16'); }
    for (let i = 0; i < 260; i++) { const y = 580 + rnd() * 120; rect(ctx, rnd() * W, y, 2 + rnd() * 8, 1, rnd() > 0.85 ? '#c06a50' : (rnd() > 0.5 ? '#3a2c5a' : '#2c2248')); }
    return c;
  }

  // ---------------- FOREGROUND (parallax 1.15): fence strip + crate/barrel silhouettes ----------------
  function fg() {
    const FW = 1400, FH = 110;
    const [c, ctx] = newCanvas(FW, FH);
    const ink = '#0c0812', rim = '#3a2440', glint = '#a0584a';
    for (let y = 12; y < FH; y++) for (let x = 0; x < FW; x++) if ((x + y) % 9 === 0 || (((x - y) % 9) + 9) % 9 === 0) px(ctx, x, y, '#140e1e');
    rect(ctx, 0, 6, FW, 5, ink); for (let x = 0; x < FW; x += 3) if ((x * 7) % 11 < 4) px(ctx, x, 6, glint);
    for (let x = 30; x < FW; x += 140) { rect(ctx, x, 4, 6, FH - 4, ink); px(ctx, x + 1, 4, glint); }
    const crate = (x, y, w, h) => { rect(ctx, x, y, w, h, ink); rect(ctx, x, y, w, 1, glint); rect(ctx, x, y + 1, 1, h, rim); line(ctx, x + 3, y + 3, x + w - 3, y + h - 1, '#1a1222'); line(ctx, x + w - 3, y + 3, x + 3, y + h - 1, '#1a1222'); };
    const barrel = (x, y, w, h) => { rect(ctx, x + 2, y, w - 4, h, ink); rect(ctx, x, y + 3, w, h - 6, ink); rect(ctx, x + 2, y, w - 4, 1, glint); rect(ctx, x, y + 10, w, 2, '#1a1222'); rect(ctx, x, y + h - 12, w, 2, '#1a1222'); rect(ctx, x + 1, y + 3, 1, h - 6, rim); };
    crate(40, 56, 70, 54); barrel(118, 66, 30, 44);
    barrel(520, 70, 28, 40); barrel(552, 64, 30, 46);
    crate(880, 62, 56, 48); crate(900, 30, 40, 32);
    crate(1230, 54, 66, 56); barrel(1302, 68, 28, 42);
    return c;
  }

  SH.stage = {
    list: () => [
      { path: 'stage/scrapyard_docks/sky.png', render: sky },
      { path: 'stage/scrapyard_docks/far.png', render: far },
      { path: 'stage/scrapyard_docks/mid.png', render: mid },
      { path: 'stage/scrapyard_docks/fg.png', render: fg },
    ],
  };
})();
