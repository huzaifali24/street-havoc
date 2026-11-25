/*
 * Street Havoc 16 — placeholder art generator: shared drawing core.
 * Runs inside headless Chromium (see tools/art/generate.mjs). Plain browser JS.
 *
 * Coordinate conventions for fighter rigs (art pixels, 128x128 frame, facing RIGHT):
 *   limb angles:  0 = pointing straight down, +90 = forward (right), 180 = up, -90 = back
 *   torso angle:  0 = upright, + = lean forward, - = lean back
 *   feet baseline (anchor) is y = 124, anchor x = 64.
 */
(function () {
  'use strict';
  const R = Math.PI / 180;
  const V = (x, y) => ({ x, y });
  const add = (p, v, s = 1) => V(p.x + v.x * s, p.y + v.y * s);
  const lerp = (a, b, t) => V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  const dd = (a) => V(Math.sin(a * R), Math.cos(a * R));
  const upv = (t) => V(Math.sin(t * R), -Math.cos(t * R));
  const fwv = (t) => V(Math.cos(t * R), Math.sin(t * R));
  const norm = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return V(dx / l, dy / l); };

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // ---------- anti-aliased path primitives (snapped to palette afterwards) ----------
  function fillCircle(ctx, c, r) { if (r <= 0.2) return; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); }
  function fillEllipse(ctx, c, rx, ry, rot) { if (rx <= 0.2 || ry <= 0.2) return; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fill(); }
  function fillPoly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); }
  function fillCapsule(ctx, a, b, ra, rb) {
    ra = Math.max(ra, 0.25); rb = Math.max(rb, 0.25);
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    if (L < 0.01) { fillCircle(ctx, a, Math.max(ra, rb)); return; }
    const nx = -dy / L, ny = dx / L;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * ra, a.y + ny * ra); ctx.lineTo(b.x + nx * rb, b.y + ny * rb);
    ctx.lineTo(b.x - nx * rb, b.y - ny * rb); ctx.lineTo(a.x - nx * ra, a.y - ny * ra);
    ctx.closePath(); ctx.fill();
    fillCircle(ctx, a, ra); fillCircle(ctx, b, rb);
  }

  // A shaded part is drawn 4 times: outline (grown), shadow, base (shifted toward light), highlight.
  const LIGHT = V(-0.55, -0.85);
  function shade(ctx, ramp, shape) {
    ctx.fillStyle = ramp.o; shape(1, V(0, 0));
    ctx.fillStyle = ramp.s; shape(0, V(0, 0));
    ctx.fillStyle = ramp.b; shape(-0.85, V(LIGHT.x, LIGHT.y));
    if (ramp.h) { ctx.fillStyle = ramp.h; shape(-2.1, V(LIGHT.x * 2.1, LIGHT.y * 2.1)); }
  }
  const capS = (ctx, a, b, ra, rb) => (g, o) => fillCapsule(ctx, add(a, o), add(b, o), ra + g, rb + g);
  const circS = (ctx, c, r) => (g, o) => fillCircle(ctx, add(c, o), r + g);
  const ellS = (ctx, c, rx, ry, rot) => (g, o) => fillEllipse(ctx, add(c, o), rx + g, ry + g, rot);

  function torsoPts(hip, t, L, wf, wb, g) {
    const S = [0, 0.4, 0.75, 1];
    const u = upv(t), f = fwv(t);
    const front = [], back = [];
    S.forEach((s, i) => {
      let ss = s * L; if (i === 0) ss -= g; if (i === 3) ss += g;
      const c = add(hip, u, ss);
      front.push(add(c, f, wf[i] + g)); back.push(add(c, f, -(wb[i] + g)));
    });
    return front.concat(back.reverse());
  }
  const torsoS = (ctx, hip, t, L, wf, wb) => (g, o) => fillPoly(ctx, torsoPts(add(hip, o), t, L, wf, wb, g));

  // ---------- rig ----------
  function rig(P, D) {
    const hip = V(P.x, P.y);
    const t = P.t || 0, ht = t + (P.h || 0);
    const up = upv(t), fw = fwv(t);
    const tl = D.torso + (P.breath || 0);
    const neck = add(hip, up, tl);
    const head = add(neck, upv(ht), D.neck + D.headR);
    const shBase = add(neck, up, -D.shDrop);
    const shF = add(shBase, fw, D.shOff), shB = add(shBase, fw, -D.shOff);
    const hipF = add(hip, fw, D.hipOff), hipB = add(hip, fw, -D.hipOff);
    const limb = (o, ang, l1, l2) => { const m = add(o, dd(ang[0]), l1); const e = add(m, dd(ang[1]), l2); return [o, m, e]; };
    const legF = limb(hipF, P.lF, D.thigh, D.shin), legB = limb(hipB, P.lB, D.thigh, D.shin);
    const armF = limb(shF, P.aF, D.uarm, D.farm), armB = limb(shB, P.aB, D.uarm, D.farm);
    const toeF = add(legF[2], dd(P.fF == null ? 90 : P.fF), D.foot);
    const toeB = add(legB[2], dd(P.fB == null ? 88 : P.fB), D.foot);
    const fistF = add(armF[2], norm(armF[1], armF[2]), D.rFist * 0.55);
    const fistB = add(armB[2], norm(armB[1], armB[2]), D.rFist * 0.55);
    return { hip, neck, head, t, ht, up, fw, tl, shF, shB, hipF, hipB, legF, legB, armF, armB, toeF, toeB, fistF, fistB };
  }

  // Shift the pose vertically so its lowest point rests on the baseline (y=124), then apply lift.
  function ground(P, D) {
    const J = rig(P, D);
    const c = [
      [J.legF[2], D.rFoot], [J.toeF, D.rFoot * 0.8], [J.legB[2], D.rFoot], [J.toeB, D.rFoot * 0.8],
      [J.legF[1], D.rThigh[1]], [J.legB[1], D.rThigh[1]], [J.hip, D.torsoB[0]], [J.neck, D.torsoB[3]],
      [J.head, D.headR], [J.fistF, D.rFist], [J.fistB, D.rFist],
    ];
    let maxY = -1e9; c.forEach(([p, r]) => { maxY = Math.max(maxY, p.y + r + 1); });
    return Object.assign({}, P, { y: P.y + (124 - maxY) - (P.lift || 0) });
  }

  // ---------- palette quantisation ----------
  function quantize(canvas, palette) {
    const ctx = canvas.getContext('2d');
    const im = ctx.getImageData(0, 0, canvas.width, canvas.height); const d = im.data;
    const pal = palette.map(hex);
    const cache = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
      // un-premultiply edge blend is irrelevant: canvas returns straight alpha
      const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      let best = cache.get(key);
      if (best === undefined) {
        let bd = 1e9; best = 0;
        for (let k = 0; k < pal.length; k++) {
          const dr = d[i] - pal[k][0], dg = d[i + 1] - pal[k][1], db = d[i + 2] - pal[k][2];
          const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
          if (dist < bd) { bd = dist; best = k; }
        }
        cache.set(key, best);
      }
      d[i] = pal[best][0]; d[i + 1] = pal[best][1]; d[i + 2] = pal[best][2]; d[i + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
  }

  // Remove isolated single pixels (anti-alias crumbs) that are not outline color.
  function despeckle(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const im = ctx.getImageData(0, 0, w, h); const d = im.data;
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    const kill = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!op(x, y)) continue;
      const n = op(x - 1, y) + op(x + 1, y) + op(x, y - 1) + op(x, y + 1);
      if (n === 0) kill.push((y * w + x) * 4);
    }
    kill.forEach((i) => { d[i + 3] = 0; });
    ctx.putImageData(im, 0, 0);
  }

  function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; return [c, ctx]; }

  function renderSheet(frames, fw, fh, drawFn, palette) {
    const [sheet, sctx] = newCanvas(fw * frames.length, fh);
    frames.forEach((P, i) => {
      const [c, ctx] = newCanvas(fw, fh);
      drawFn(ctx, P, i);
      if (palette) { quantize(c, palette); despeckle(c); }
      sctx.drawImage(c, i * fw, 0);
    });
    return sheet;
  }

  // ---------- crisp pixel helpers (stage art) ----------
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  function px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function line(ctx, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    ctx.fillStyle = c;
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function disc(ctx, cx, cy, r, c, pattern) {
    ctx.fillStyle = c;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r && (!pattern || pattern(x, y))) ctx.fillRect(x, y, 1, 1);
    }
  }
  function ellipse(ctx, cx, cy, rx, ry, c, clipBottom) {
    ctx.fillStyle = c;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      if (clipBottom != null && y > clipBottom) continue;
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  // vertical ordered-dither gradient across a list of [y, color] stops
  function ditherV(ctx, x0, y0, w, h, stops) {
    const im = ctx.getImageData(x0, y0, w, h); const d = im.data;
    const S = stops.map(([y, c]) => [y, hex(c)]);
    for (let y = 0; y < h; y++) {
      const Y = y0 + y;
      let i = 0; while (i < S.length - 2 && Y >= S[i + 1][0]) i++;
      const [ya, A] = S[i], [yb, B] = S[i + 1];
      const t = Math.max(0, Math.min(1, (Y - ya) / Math.max(1, yb - ya)));
      for (let x = 0; x < w; x++) {
        const th = BAYER[(Y & 3) * 4 + ((x0 + x) & 3)];
        const C = t > th ? B : A; const k = (y * w + x) * 4;
        d[k] = C[0]; d[k + 1] = C[1]; d[k + 2] = C[2]; d[k + 3] = 255;
      }
    }
    ctx.putImageData(im, x0, y0);
  }
  const checker = (x, y) => ((x + y) & 1) === 0;

  window.SH = {
    R, V, add, lerp, dd, upv, fwv, norm, rng, hex,
    fillCircle, fillEllipse, fillPoly, fillCapsule, shade, capS, circS, ellS, torsoPts, torsoS,
    rig, ground, quantize, despeckle, newCanvas, renderSheet,
    BAYER, px, rect, line, disc, ellipse, ditherV, checker,
  };
})();
