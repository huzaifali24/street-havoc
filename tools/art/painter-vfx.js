/* VFX sprite sheets: hit sparks, Volt Arc swipe, Forge Quake shockwave, landing dust, gulls. */
(function () {
  'use strict';
  const SH = window.SH;
  const { V, add, rng, fillCircle, fillCapsule, fillEllipse, newCanvas, quantize, despeckle } = SH;
  const KC = SH.colors.KC, BC = SH.colors.BC;
  const DUST = ['#2a2236', '#5e5466', '#8a7f8c', '#b8aab0'];

  function sheet(frames, fw, fh, draw, palette) {
    const [c, ctx] = newCanvas(fw * frames, fh);
    for (let i = 0; i < frames; i++) {
      const [f, fctx] = newCanvas(fw, fh);
      draw(fctx, i, fw, fh);
      if (palette) { quantize(f, palette); despeckle(f); }
      ctx.drawImage(f, i * fw, 0);
    }
    return c;
  }

  function zig(ctx, a, b, segs, amp, rnd, w, col) {
    ctx.fillStyle = col; let p = a;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs; const q = i === segs ? b : V(a.x + (b.x - a.x) * t + (rnd() * 2 - 1) * amp, a.y + (b.y - a.y) * t + (rnd() * 2 - 1) * amp);
      fillCapsule(ctx, p, q, w, w); p = q;
    }
  }

  // 48x48, 4 frames: small electric burst (Kessa hits)
  function voltSpark(ctx, i) {
    const c = V(24, 24), rnd = rng(11 + i);
    const s = [1, 0.85, 0.6, 0.35][i];
    if (i < 2) { ctx.fillStyle = KC.cyanS; fillCircle(ctx, c, 9 * s + 2); ctx.fillStyle = KC.cyanH; fillCircle(ctx, c, 7 * s); ctx.fillStyle = KC.white; fillCircle(ctx, c, 4.5 * s); }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + i * 0.4;
      const r0 = 4 + i * 4, r1 = r0 + 10 * s + 4;
      zig(ctx, add(c, V(Math.cos(a), Math.sin(a)), r0), add(c, V(Math.cos(a), Math.sin(a)), r1), 3, 2, rnd, i < 2 ? 1 : 0.7, k % 2 ? KC.yelH : KC.cyanH);
    }
  }
  // 48x48, 4 frames: ember impact burst (Brom hits)
  function emberSpark(ctx, i) {
    const c = V(24, 24), rnd = rng(31 + i);
    const s = [1, 0.85, 0.6, 0.35][i];
    if (i < 2) { ctx.fillStyle = BC.irH; fillCircle(ctx, c, 10 * s + 2); ctx.fillStyle = BC.ember; fillCircle(ctx, c, 8 * s); ctx.fillStyle = BC.emberH; fillCircle(ctx, c, 5 * s); }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      const r0 = 5 + i * 5, r1 = r0 + 7 * s + 2;
      ctx.fillStyle = k % 2 ? BC.ember : BC.emberH;
      fillCapsule(ctx, add(c, V(Math.cos(a), Math.sin(a)), r0), add(c, V(Math.cos(a), Math.sin(a)), r1), 1.4 * s + 0.4, 0.5);
    }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = BC.emberH; const p = add(c, V(rnd() * 2 - 1, rnd() * 2 - 1), 8 + i * 5); ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
  }
  // 96x96, 5 frames: Volt Arc crescent. Origin = left-center (0, 48); arc spans forward.
  function voltArc(ctx, i) {
    const c = V(4, 48), rnd = rng(77 + i * 3);
    const span = [0.45, 1, 1, 1, 0.9][i];
    const bright = [0.8, 1, 0.9, 0.6, 0.3][i];
    const a0 = -62 * Math.PI / 180, a1 = a0 + (124 * Math.PI / 180) * span;
    const N = 40;
    const band = (rIn, rOut, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      for (let k = 0; k <= N; k++) { const a = a0 + (a1 - a0) * (k / N); const taper = Math.sin(Math.PI * k / N); const r = rOut - (rOut - rIn) * (1 - taper) * 0.5; ctx.lineTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r); }
      for (let k = N; k >= 0; k--) { const a = a0 + (a1 - a0) * (k / N); const taper = Math.sin(Math.PI * k / N); const r = rIn + (rOut - rIn) * (1 - taper) * 0.5; ctx.lineTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    };
    if (i < 4) {
      band(26, 44, KC.navyS);
      band(28, 42, KC.cyanS);
      band(31, 40, KC.cyan);
      if (bright > 0.55) band(33, 38, KC.cyanH);
      if (bright > 0.85) band(34.5, 36.5, KC.white);
    }
    const bolts = i < 4 ? 5 : 7;
    for (let k = 0; k < bolts; k++) {
      const t = (k + 0.5) / bolts; const a = a0 + (a1 - a0) * t;
      const r = 36 + (rnd() * 2 - 1) * (i === 4 ? 10 : 4);
      const p = V(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
      zig(ctx, p, add(p, V(Math.cos(a), Math.sin(a)), 8 + rnd() * 6), 3, 2.5, rnd, 0.7, k % 2 ? KC.yelH : KC.white);
    }
  }
  // 192x64, 6 frames: Forge Quake ground shockwave. Origin = bottom-center.
  function quakeWave(ctx, i) {
    const cx = 96, gy = 60, rnd = rng(500 + i);
    const r = [10, 22, 34, 44, 52, 56][i];
    const h = [10, 16, 18, 14, 9, 5][i];
    if (i < 5) {
      ctx.fillStyle = DUST[1]; fillEllipse(ctx, V(cx, gy), r + 4, h + 3, 0);
      ctx.fillStyle = DUST[2]; fillEllipse(ctx, V(cx, gy), r, h, 0);
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000'; fillEllipse(ctx, V(cx, gy + 2), Math.max(0, r - 10), Math.max(0, h - 4), 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    // ember cracks along the ground
    const crack = [5, 10, 16, 20, 18, 10][i];
    for (const dir of [-1, 1]) {
      ctx.fillStyle = i < 4 ? BC.emberH : BC.ember;
      let x = cx, y = gy;
      for (let k = 0; k < 5; k++) { const nx = x + dir * crack / 5 * 1.6, ny = gy - 1 + (rnd() * 2 - 1) * 1.5; fillCapsule(ctx, V(x, y), V(nx, ny), 1.2, 0.8); x = nx; y = ny; }
    }
    // rubble & embers
    for (let k = 0; k < 10; k++) {
      const s = rnd() * 2 - 1; const p = V(cx + s * r * 0.9, gy - 4 - rnd() * (h + 8) * (i < 3 ? 1 : 0.6) + i * 2);
      ctx.fillStyle = k % 3 === 0 ? BC.emberH : (k % 3 === 1 ? DUST[3] : DUST[0]);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
  }
  // 64x32, 4 frames: landing dust puffs. Origin bottom-center.
  function dust(ctx, i) {
    const rnd = rng(900 + i);
    const spread = [8, 16, 22, 26][i], rad = [5, 6, 5, 3][i];
    for (const dir of [-1, 1]) for (let k = 0; k < 3; k++) {
      const p = V(32 + dir * (spread - k * 5), 28 - k * 2 - i);
      ctx.fillStyle = DUST[0]; fillCircle(ctx, p, rad + 1);
      ctx.fillStyle = DUST[i < 2 ? 2 : 1]; fillCircle(ctx, p, rad);
      ctx.fillStyle = DUST[3]; if (i < 2) fillCircle(ctx, add(p, V(-1, -1)), rad * 0.5);
    }
    void rnd;
  }
  // 16x12, 2 frames: gull silhouette, wings up / down
  function gull(ctx, i) {
    const col = '#241a34';
    SH.rect(ctx, 7, 6, 3, 2, col);
    if (i === 0) { SH.line(ctx, 7, 6, 4, 3, col); SH.line(ctx, 4, 3, 1, 4, col); SH.line(ctx, 9, 6, 12, 3, col); SH.line(ctx, 12, 3, 15, 4, col); }
    else { SH.line(ctx, 7, 7, 3, 8, col); SH.line(ctx, 3, 8, 0, 10, col); SH.line(ctx, 9, 7, 13, 8, col); SH.line(ctx, 13, 8, 15, 10, col); }
  }

  const KP = SH.fighters.kessa.palette, BP = SH.fighters.brom.palette.concat(DUST);
  const LIST = [
    { path: 'sprites/vfx/hit_spark_volt.png', frames: 4, w: 48, h: 48, fn: voltSpark, pal: KP },
    { path: 'sprites/vfx/hit_spark_ember.png', frames: 4, w: 48, h: 48, fn: emberSpark, pal: BP },
    { path: 'sprites/vfx/volt_arc.png', frames: 5, w: 96, h: 96, fn: voltArc, pal: KP },
    { path: 'sprites/vfx/quake_wave.png', frames: 6, w: 192, h: 64, fn: quakeWave, pal: BP },
    { path: 'sprites/vfx/dust.png', frames: 4, w: 64, h: 32, fn: dust, pal: DUST },
    { path: 'stage/scrapyard_docks/gull.png', frames: 2, w: 16, h: 12, fn: gull, pal: null },
  ];
  SH.vfx = { list: () => LIST.map((v) => ({ path: v.path, frames: v.frames, render: () => sheet(v.frames, v.w, v.h, v.fn, v.pal) })) };
})();
