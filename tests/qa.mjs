// Street Havoc 16 — automated QA pass for docs/TESTING.md.
// Requires the dev server running (npm run dev). Usage: npm run qa  [BASE=http://localhost:5173/]
// Writes screenshots/contact sheets to tests/output/ and prints PASS/FAIL per check.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5173/';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'output');
mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const browser = await chromium.launch();
const consoleErrors = [];

async function open(query, viewport = { width: 1280, height: 720 }, ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport, ...ctxOpts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => consoleErrors.push(`${query}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${query}: ${m.text()}`); });
  await page.goto(BASE + query);
  await page.waitForFunction(() => window.__sh16?.ready, null, { timeout: 30000 });
  return { page, ctx };
}
const H = (page, fn, ...args) => page.evaluate(([fn, args]) => window.__sh16[fn](...args), [fn, args]);
const raf = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const inter = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const ATTACKS = ['light', 'heavy', 'special'];
const CFG = {
  kessa: { light: { hitstop: 2 }, heavy: { hitstop: 3 }, special: { hitstop: 3 } },
  brom: { light: { hitstop: 2 }, heavy: { hitstop: 3 }, special: { hitstop: 3 } },
};

// ------------------------------------------------------------------ 1. attack timeline + frame captures
async function attackTimelines(p1, p2) {
  const { page, ctx } = await open(`?cpu=off&p1=${p1}&p2=${p2}`);
  await H(page, 'pause');
  await H(page, 'hitboxes', true);
  const clips = [];
  for (const kind of ATTACKS) {
    await H(page, 'setup', { p1x: 900, p2x: 1600 });
    await H(page, 'tap', 0, kind);
    const rec = []; let lastFrame = -1;
    for (let i = 0; i < 150; i++) {
      const s = await H(page, 'step', 1);
      const f = s.fighters[0];
      rec.push({ state: f.state, anim: f.anim, frame: f.frame, phase: f.phase, hitbox: !!f.hitbox });
      if (f.state === 'attack' && f.frame !== lastFrame) {
        lastFrame = f.frame;
        await raf(page);
        const c = await H(page, 'worldToScreen', f.x - 170, f.y - 260);
        const z = s.camera.zoom;
        const buf = await page.screenshot({ clip: { x: Math.max(0, c.x), y: Math.max(0, c.y), width: 340 * z, height: 300 * z } });
        clips.push({ kind, frame: f.frame, phase: f.phase, img: buf.toString('base64') });
      }
      if (i > 2 && f.state === 'idle') break;
    }
    const atk = rec.filter((r) => r.state === 'attack');
    const order = { windup: 0, active: 1, recovery: 2 };
    const monotonic = atk.every((r, i) => i === 0 || order[r.phase] >= order[atk[i - 1].phase]);
    const hitboxOnlyActive = atk.every((r) => r.hitbox === (r.phase === 'active'));
    const seq = [...new Set(atk.map((r) => r.phase))].join('>');
    check(`${p1} ${kind}: wind-up > impact > recovery, then Idle`, atk[0]?.phase === 'windup' && seq === 'windup>active>recovery' && monotonic && rec[rec.length - 1].state === 'idle',
      `${atk.length} ticks [${atk.map((r) => r.phase[0]).join('')}]`);
    check(`${p1} ${kind}: hitbox exists only on impact frames`, hitboxOnlyActive);
    // movement/other attacks locked during the attack
    await H(page, 'setup', { p1x: 900, p2x: 1600 });
    await H(page, 'tap', 0, kind);
    await H(page, 'step', 1);
    await H(page, 'hold', 0, { right: true });
    await H(page, 'tap', 0, kind === 'light' ? 'heavy' : 'light');
    const s2 = await H(page, 'step', 2);
    check(`${p1} ${kind}: movement/other attacks locked out until recovery`, s2.fighters[0].state === 'attack' && s2.fighters[0].anim === kind);
    await H(page, 'hold', 0, {});
  }
  // contact sheet of every attack frame with the overlay on
  const sheet = await ctx.newPage();
  await sheet.setViewportSize({ width: 1800, height: 900 });
  const html = `<body style="margin:0;background:#111;color:#eee;font:12px monospace">${ATTACKS.map((k) => `<div style="display:flex;gap:4px;margin:4px">${clips.filter((c) => c.kind === k).map((c) =>
    `<div><div>${k} f${c.frame} ${c.phase}</div><img style="height:240px;border:2px solid ${c.phase === 'active' ? '#f33' : '#555'}" src="data:image/png;base64,${c.img}"></div>`).join('')}</div>`).join('')}</body>`;
  await sheet.setContent(html);
  await sheet.screenshot({ path: join(OUT, `attacks_${p1}.png`), fullPage: true });
  await ctx.close();
}

// ------------------------------------------------------------------ 2. hits, hit-stop, knockback, reactions
async function hitChecks(p1, p2, swapSides) {
  const { page, ctx } = await open(`?cpu=off&p1=${p1}&p2=${p2}`);
  await H(page, 'pause');
  const tag = `${p1}${swapSides ? ' (attacking leftward)' : ''}`;
  for (const kind of ATTACKS) {
    const ax = swapSides ? 1300 : 1100, dx = swapSides ? 1170 : 1230;
    await H(page, 'setup', { p1x: ax, p2x: dx });
    await H(page, 'tap', 0, kind);
    let s, hitTick = -1;
    for (let i = 0; i < 120; i++) { s = await H(page, 'step', 1); if (s.hits.length) { hitTick = i; break; } }
    if (hitTick < 0) { check(`${tag} ${kind}: connects at close range`, false, 'no hit'); continue; }
    const hit = s.hits[0];
    const def = s.fighters[1], atk = s.fighters[0];
    const expectStop = CFG[p1][kind].hitstop;
    check(`${tag} ${kind}: hit registers on an impact frame`, atk.phase === 'active', `frame ${hit.frame}`);
    check(`${tag} ${kind}: hit-stop ${expectStop} ticks applied`, s.hitstop === expectStop, `hitstop=${s.hitstop}`);
    // both fighters frozen during hit-stop
    const frozen = [];
    for (let k = 0; k < expectStop; k++) {
      const t = await H(page, 'step', 1);
      frozen.push(t.fighters[0].frame === atk.frame && t.fighters[1].x === def.x && t.fighters[0].x === atk.x);
    }
    check(`${tag} ${kind}: both fighters freeze during hit-stop`, frozen.every(Boolean));
    const away = Math.sign(dx - ax);
    check(`${tag} ${kind}: knockback pushes defender away from attacker`, hit.knockDir === away, `dir=${hit.knockDir} expected ${away}`);
    check(`${tag} ${kind}: defender plays hit-react (Hurt)`, def.state === 'hurt' && def.anim === 'hurt' && def.facing === -away, `state=${def.state} frame=${def.frame} facing=${def.facing}`);
    // run out the attack: exactly one hit (no double hits)
    for (let i = 0; i < 90; i++) { s = await H(page, 'step', 1); if (s.fighters[0].state === 'idle' && s.fighters[1].state === 'idle') break; }
    check(`${tag} ${kind}: exactly one hit per attack`, s.hits.length === 1, `hits=${s.hits.length}`);
  }
  await ctx.close();
}

async function reactionChecks() {
  const { page, ctx } = await open('?cpu=off&p1=kessa&p2=brom');
  await H(page, 'pause');
  // Brom barely staggers on a light hit, real flinch on heavy; Kessa flinches on light
  const measure = async (p1x, p2x, kind, side) => {
    await H(page, 'setup', { p1x, p2x });
    await H(page, 'tap', side, kind);
    let s; const frames = new Set(); let hurtTicks = 0; let inv = [];
    for (let i = 0; i < 160; i++) {
      s = await H(page, 'step', 1); const d = s.fighters[1 - side];
      if (d.state === 'hurt') { hurtTicks++; frames.add(d.frame); inv.push(d.invulnerable); }
      if (hurtTicks && d.state !== 'hurt') break;
    }
    return { hurtTicks, frames: [...frames], inv };
  };
  const bL = await measure(1100, 1230, 'light', 0), bH = await measure(1100, 1230, 'heavy', 0);
  check('Brom: barely staggers on light hits, real flinch on heavy hits', bL.hurtTicks < bH.hurtTicks && bL.frames.length === 1 && bH.frames.includes(1),
    `light: ${bL.hurtTicks} ticks frames ${bL.frames}; heavy: ${bH.hurtTicks} ticks frames ${bH.frames}`);
  const kL = await measure(1100, 1230, 'light', 1);
  check('Kessa: 2-frame flinch on light hit', kL.frames.length === 2, `frames ${kL.frames}, ${kL.hurtTicks} ticks`);
  const tail = bH.inv.slice(-8).every(Boolean) && !bH.inv[0];
  check('Hurt has an 8-tick invulnerable tail (anti infinite-lock)', tail, `invuln pattern ${bH.inv.map((v) => (v ? 'I' : '.')).join('')}`);
  await ctx.close();
}

// ------------------------------------------------------------------ 3. defeat + round flow
async function defeatChecks() {
  const { page, ctx } = await open('?cpu=off&p1=kessa&p2=brom');
  await H(page, 'pause');
  await H(page, 'setup', { p1x: 1100, p2x: 1230, hp: [950, 30] });
  await H(page, 'tap', 0, 'light');
  let s; for (let i = 0; i < 30; i++) { s = await H(page, 'step', 1); if (s.hits.length) break; }
  check('Defeat triggers at 0 HP', s.fighters[1].hp === 0 && s.fighters[1].state === 'defeat' && s.phase === 'ko', `hp=${s.fighters[1].hp} state=${s.fighters[1].state} phase=${s.phase}`);
  // hammer P2's inputs: nothing should happen
  await H(page, 'hold', 1, { left: true, up: true, light: true });
  let stillDefeat = true; let attacked = false;
  for (let i = 0; i < 60; i++) { await H(page, 'tap', 1, 'special'); s = await H(page, 'step', 1); if (s.fighters[1].state !== 'defeat') stillDefeat = false; if (s.fighters[1].anim !== 'defeat') attacked = true; }
  check('Defeat locks out further input', stillDefeat && !attacked && s.fighters[1].locked, `state=${s.fighters[1].state} anim=${s.fighters[1].anim}`);
  await H(page, 'hold', 1, {});
  await H(page, 'hitboxes', false); await raf(page);
  await page.screenshot({ path: join(OUT, 'defeat_ko.png') });
  for (let i = 0; i < 100; i++) s = await H(page, 'step', 1);
  await raf(page); await page.screenshot({ path: join(OUT, 'round_win_pose.png') });
  check('Winner plays win pose and gets the round', s.fighters[0].state === 'win' && s.wins[0] === 1, `p1=${s.fighters[0].state} wins=${s.wins}`);
  for (let i = 0; i < 150; i++) s = await H(page, 'step', 1);
  check('Next round starts (best of 3)', s.round === 2 && ['intro', 'fight'].includes(s.phase) && s.fighters[1].hp === s.fighters[1].maxHp, `round=${s.round} phase=${s.phase}`);
  await ctx.close();
}

async function matchFlow() {
  // full best-of-3 played through the real round loop: two KOs in a row for P1
  const { page, ctx } = await open('?cpu=off&p1=kessa&p2=brom');
  await H(page, 'pause');
  let s = await H(page, 'setup', { p1x: 1100, p2x: 1230, hp: [950, 30] });
  for (let r = 0; r < 2; r++) {
    if (r === 1) {
      for (let i = 0; i < 120 && s.phase !== 'fight'; i++) s = await H(page, 'step', 1); // round 2 intro
      await page.evaluate(() => { const sc = window.__game.scene.getScene('fight'); sc.fighters[1].hp = 30; sc.fighters[0].x = 1100; sc.fighters[1].x = 1230; });
    }
    await H(page, 'tap', 0, 'light');
    for (let i = 0; i < 260; i++) { s = await H(page, 'step', 1); if (s.phase === 'matchEnd' || (r === 0 && s.phase === 'intro' && s.round === 2)) break; }
  }
  check('Best-of-3: two round wins ends the match', s.phase === 'matchEnd' && s.wins[0] === 2, `phase=${s.phase} wins=${s.wins}`);
  await raf(page); await page.screenshot({ path: join(OUT, 'match_end.png') });
  for (let i = 0; i < 40; i++) s = await H(page, 'step', 1);
  await H(page, 'tap', 0, 'light');
  s = await H(page, 'step', 2);
  check('Rematch from match-end screen', s.phase === 'intro' && s.round === 1 && s.wins[0] === 0);
  await ctx.close();
}

// ------------------------------------------------------------------ 4. movement
async function movementChecks(p1, p2) {
  const { page, ctx } = await open(`?cpu=off&p1=${p1}&p2=${p2}`);
  await H(page, 'pause');
  let s = await H(page, 'setup', { p1x: 900, p2x: 1600 });
  const x0 = s.fighters[0].x;
  await H(page, 'hold', 0, { right: true }); s = await H(page, 'step', 30);
  const fwd = s.fighters[0].x - x0;
  await H(page, 'hold', 0, { left: true }); const x1 = s.fighters[0].x; s = await H(page, 'step', 30);
  const back = x1 - s.fighters[0].x;
  check(`${p1}: walk forward/back`, s.fighters[0].state === 'walk' && fwd > 0 && back > 0 && fwd > back, `fwd ${fwd.toFixed(0)}px/30t back ${back.toFixed(0)}px/30t`);
  await H(page, 'hold', 0, {}); s = await H(page, 'step', 2);
  check(`${p1}: returns to idle`, s.fighters[0].state === 'idle');
  await H(page, 'tap', 0, 'up');
  let minY = 1e9, frames = new Set(), ticks = 0, landed = false;
  for (let i = 0; i < 120; i++) {
    s = await H(page, 'step', 1); const f = s.fighters[0];
    if (f.state === 'jump') { ticks++; minY = Math.min(minY, f.y); frames.add(f.frame); }
    if (f.state === 'land') landed = true;
    if (landed && f.state === 'idle') break;
  }
  check(`${p1}: jump rise/apex/fall then land`, frames.size === 3 && landed && s.fighters[0].state === 'idle', `height ${(900 - minY).toFixed(0)}px, airtime ${ticks} ticks`);
  await ctx.close();
  return { fwd, back, height: 900 - minY, ticks };
}

// ------------------------------------------------------------------ 5. input latency (keyboard + simulated touch)
async function latencyChecks() {
  const { page, ctx } = await open('?cpu=off', { width: 844, height: 390 }, { hasTouch: true, isMobile: true });
  await H(page, 'pause');
  await H(page, 'setup', { p1x: 900, p2x: 1600 });
  await page.keyboard.down('KeyJ');
  let s = await H(page, 'step', 1);
  await page.keyboard.up('KeyJ');
  check('Keyboard: attack starts on the first tick after keydown', s.fighters[0].state === 'attack' && s.fighters[0].anim === 'light');
  await H(page, 'step', 40);
  await page.keyboard.press('KeyK'); // press+release before the next tick (tap must not be lost)
  s = await H(page, 'step', 1);
  check('Keyboard: a tap shorter than one tick is not dropped', s.fighters[0].anim === 'heavy');
  await H(page, 'step', 80);
  const t = await H(page, 'touchTargets');
  await page.touchscreen.tap(t.special.x, t.special.y);
  s = await H(page, 'step', 1);
  check('Touch: SP button starts Special on the next tick', s.fighters[0].anim === 'special' && s.fighters[0].state === 'attack');
  await H(page, 'step', 80);
  const cdp = await ctx.newCDPSession(page);
  const x0 = s.fighters[0].x;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.stick.x, y: t.stick.y, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: t.stick.x + t.stick.r * 0.9, y: t.stick.y, id: 1 }] });
  s = await H(page, 'step', 1);
  const walk1 = s.fighters[0].state;
  // second finger on L while the stick is held (multi-touch)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.stick.x + t.stick.r * 0.9, y: t.stick.y, id: 1 }, { x: t.light.x, y: t.light.y, id: 2 }] });
  s = await H(page, 'step', 1);
  const multi = s.fighters[0].anim === 'light';
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check('Touch: stick walks on the next tick', walk1 === 'walk', `state=${walk1}`);
  check('Touch: multi-touch (stick held + attack button)', multi, `anim=${s.fighters[0].anim}`);
  // real-time latency: unpaused, measure wall-clock from keydown to attack state
  await H(page, 'setup', { p1x: 900, p2x: 1600 });
  await H(page, 'resume');
  await page.waitForTimeout(300);
  const ms = await page.evaluate(() => new Promise((res) => {
    const t0 = performance.now();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
    const poll = () => { if (window.__sh16.snapshot().fighters[0].state === 'attack') { window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' })); res(performance.now() - t0); } else requestAnimationFrame(poll); };
    poll();
  }));
  check('Real-time keyboard latency (keydown -> attack state)', ms < 70, `${ms.toFixed(1)} ms in headless Chromium`);
  await ctx.close();
  void x0;
}

// ------------------------------------------------------------------ 6. camera / visual buckets
const BUCKETS = [
  { name: '16x9', w: 1280, h: 720 },
  { name: '19x5-9', w: 844, h: 390 },
  { name: 'tablet', w: 1200, h: 840 },
  { name: 'tablet-16x10', w: 1280, h: 800 },
  { name: 'tablet-4x3', w: 1024, h: 768 },
];
async function visualChecks(b) {
  const { page, ctx } = await open('?cpu=off', { width: b.w, height: b.h });
  await H(page, 'pause');
  const fighterRects = (s) => s.fighters.map((f) => {
    const z = s.camera.zoom;
    const hb = f.hurtboxes.map((r) => ({ ...page && r }));
    const xs = hb.flatMap((r) => [r.x, r.x + r.w]), ys = hb.flatMap((r) => [r.y, r.y + r.h]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (minX - s.camera.cx) * z + s.screen.W / 2, sy = (minY - s.camera.cy) * z + s.screen.H / 2;
    return { x: sx, y: sy, w: (maxX - minX) * z, h: (maxY - minY) * z };
  });
  const cases = [
    { tag: 'centre', p1x: 980, p2x: 1420 },
    { tag: 'left-wall', p1x: 60, p2x: 420 },
    { tag: 'right-wall', p1x: 1980, p2x: 2340 },
    { tag: 'max-separation', p1x: 770, p2x: 1630 },
  ];
  for (const c of cases) {
    let s = await H(page, 'setup', { p1x: c.p1x, p2x: c.p2x });
    s = await H(page, 'step', 60); // let the camera settle
    await raf(page);
    await page.screenshot({ path: join(OUT, `${b.name}_${c.tag}.png`) });
    const fr = fighterRects(s);
    const onScreen = fr.every((r) => r.x >= 0 && r.x + r.w <= s.screen.W && r.y >= 0 && r.y + r.h <= s.screen.H);
    const ui = [...s.hudRects, ...s.touchRects];
    const floorStrip = { x: 0, y: s.band.floor - 20 * s.camera.zoom, w: s.screen.W, h: s.band.bottom - (s.band.floor - 20 * s.camera.zoom) };
    const hudOverFighter = ui.some((u) => fr.some((r) => inter(u, r)));
    const hudOverFloor = ui.some((u) => inter(u, floorStrip));
    check(`[${b.name} ${c.tag}] both fighters fully on screen`, onScreen);
    check(`[${b.name} ${c.tag}] HUD/touch never cover a fighter or the floor`, !hudOverFighter && !hudOverFloor);
    if (c.tag === 'centre') {
      const touchTop = Math.min(...s.touchRects.map((r) => r.y));
      check(`[${b.name}] touch controls confined to bottom 22% and below the gameplay band`, touchTop >= s.screen.H * 0.78 - 0.5 && touchTop >= s.band.bottom - 0.5,
        `controls top ${touchTop.toFixed(0)}px, band bottom ${s.band.bottom.toFixed(0)}px, H*0.78=${(s.screen.H * 0.78).toFixed(0)}`);
      const m = Math.min(...s.hudRects.slice(0, 2).map((r) => r.x)), my = Math.min(...s.hudRects.slice(0, 2).map((r) => r.y));
      const rightGap = s.screen.W - Math.max(...s.hudRects.slice(0, 2).map((r) => r.x + r.w));
      check(`[${b.name}] health bars >= 4% from edges`, m >= s.screen.W * 0.04 - 0.5 && rightGap >= s.screen.W * 0.04 - 0.5 && my >= s.screen.H * 0.04 - 0.5,
        `left ${m}px right ${rightGap.toFixed(0)}px top ${my}px`);
      const uni = s.spriteScales.every(([x, y]) => Math.abs(Math.abs(x) - y) < 1e-6) && s.layerScales.every(([, x, y]) => x === y);
      check(`[${b.name}] uniform X/Y scale on all sprites and layers (no stretching)`, uni, `zoom ${s.camera.zoom.toFixed(3)}`);
      const kh = s.fighters.find((f) => f.id === 'kessa'), bh = s.fighters.find((f) => f.id === 'brom');
      const ht = (f) => { const ys = f.hurtboxes.flatMap((r) => [r.y, r.y + r.h]); return (Math.max(...ys) - Math.min(...ys)) / s.camera.viewH; };
      check(`[${b.name}] fighter height vs visible stage height`, true, `Kessa ${(ht(kh) * 100).toFixed(1)}%  Brom ${(ht(bh) * 100).toFixed(1)}%  (view ${s.camera.viewW.toFixed(0)}x${s.camera.viewH.toFixed(0)} world)`);
    }
  }
  // jump apex vs HUD
  await H(page, 'setup', { p1x: 1000, p2x: 1400 });
  await H(page, 'tap', 0, 'up');
  let top = 1e9, s;
  for (let i = 0; i < 40; i++) { s = await H(page, 'step', 1); const f = s.fighters[0]; const ys = f.hurtboxes.map((r) => r.y); top = Math.min(top, ...ys); }
  const topScreen = (top - s.camera.cy) * s.camera.zoom + s.screen.H / 2;
  const hudBottom = Math.max(...s.hudRects.map((r) => r.y + r.h));
  check(`[${b.name}] jump apex stays below the HUD`, topScreen > hudBottom, `apex top ${topScreen.toFixed(0)}px, HUD bottom ${hudBottom.toFixed(0)}px`);
  s = await H(page, 'snapshot');
  check(`[${b.name}] parallax coverage: no seams/gaps (${s.coverage.checks} layer checks)`, s.coverage.violations === 0, s.coverage.worst ? JSON.stringify(s.coverage.worst) : '');
  await ctx.close();
}

// sweep every camera position at many aspect ratios through the real layer code
async function seamSweep() {
  const { page, ctx } = await open('?cpu=off', { width: 1280, height: 720 });
  const res = await page.evaluate(async () => {
    const g = window.__game; const sc = g.scene.getScene('fight');
    const sizes = [[1280, 720], [844, 390], [1200, 840], [1280, 800], [1024, 768], [2400, 1080], [1920, 1080], [960, 600], [2048, 1536]];
    let bad = 0, checks = 0;
    for (const [w, h] of sizes) {
      sc.layout(w, h);
      for (let x = 0; x <= 2400; x += 10) {
        sc.camX = Math.max(sc.view.viewW / 2, Math.min(2400 - sc.view.viewW / 2, x));
        const before = sc.stage.coverage.violations;
        sc.renderFrame(); checks++;
        if (sc.stage.coverage.violations > before) bad++;
      }
    }
    sc.layout(g.scale.width, g.scale.height);
    return { checks, bad };
  });
  check('Parallax seam sweep: all camera positions x 9 aspect ratios', res.bad === 0, `${res.checks} positions, ${res.bad} with gaps`);
  await ctx.close();
}

async function bootChecks() {
  const { page, ctx } = await open('?cpu=off');
  const s = await H(page, 'snapshot');
  check('All manifest assets load with the expected dimensions; configs valid', s.problems.length === 0, s.problems.join('; '));
  // assets/REQUIRED_ASSETS.md must list exactly the manifest's files with matching sizes
  const man = await H(page, 'manifest');
  const md = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'REQUIRED_ASSETS.md'), 'utf8');
  const rows = new Map([...md.matchAll(/^\| `([^`]+\.png)` \| (\d+)x(\d+) \|/gm)].map((m) => [m[1], `${m[2]}x${m[3]}`]));
  const mism = man.filter((a) => rows.get(a.path) !== `${a.width}x${a.height}`).map((a) => `${a.path} doc=${rows.get(a.path)} code=${a.width}x${a.height}`);
  const extra = [...rows.keys()].filter((k) => !man.some((a) => a.path === k));
  check('REQUIRED_ASSETS.md matches the code manifest exactly', !mism.length && !extra.length, [...mism, ...extra.map((e) => 'not in code: ' + e)].join('; ') || `${man.length} files`);
  await ctx.close();
}

async function cpuSmoke() {
  const { page, ctx } = await open('?cpu=p2', { width: 1280, height: 720 });
  await page.waitForTimeout(9000);
  const s = await H(page, 'snapshot');
  await page.screenshot({ path: join(OUT, 'cpu_live.png') });
  check('CPU stub fights back in real time (smoke)', s.hits.length > 0 || s.fighters[0].hp < s.fighters[0].maxHp || s.fighters[1].state !== 'idle', `phase=${s.phase} hits=${s.hits.length}`);
  await ctx.close();
}

await bootChecks();
for (const [a, b] of [['kessa', 'brom'], ['brom', 'kessa']]) {
  await attackTimelines(a, b);
  await hitChecks(a, b, false);
  await hitChecks(a, b, true);
  const m = await movementChecks(a, b);
  void m;
}
await reactionChecks();
await defeatChecks();
await matchFlow();
await latencyChecks();
for (const b of BUCKETS) await visualChecks(b);
await seamSweep();
await cpuSmoke();
check('No page errors / console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

await browser.close();
writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
