/*
 * Fighter sprite painters + pose tables for Kessa "Voltfist" Reyes and Brom Hatch.
 * Frame counts here MUST match src/fighters/kessa.ts and src/fighters/brom.ts
 * (verified by `npm run check:assets`).
 */
(function () {
  'use strict';
  const { V, add, lerp, dd, upv, fwv, norm, rng, fillCircle, fillEllipse, fillCapsule, shade, capS, circS, ellS, torsoS, rig, ground } = window.SH;
  const R = Math.PI / 180;

  // ======================================================================
  // KESSA — tall, lean, cool palette (cyan / electric blue / yellow-white / navy)
  // ======================================================================
  const KC = {
    o: '#0b0e24', navyS: '#1b2a5a', navy: '#2a3f80', cyanS: '#1786c4', cyan: '#33ccf5', cyanH: '#b0f2ff',
    yelS: '#b8861e', yel: '#f2c330', yelH: '#fff4c4', white: '#ffffff',
    skinS: '#8c5236', skin: '#c07a52', skinH: '#e3a57a', hairS: '#140f28', hair: '#20183c', hairH: '#433a78',
  };
  const KPAL = Object.values(KC);
  const KR = {
    suit: { o: KC.o, s: KC.cyanS, b: KC.cyan, h: KC.cyanH },
    suitB: { o: KC.o, s: KC.navyS, b: KC.navy, h: KC.cyanS },
    glove: { o: KC.o, s: KC.yelS, b: KC.yel, h: KC.yelH },
    gloveB: { o: KC.o, s: KC.navyS, b: KC.yelS, h: KC.yel },
    boot: { o: KC.o, s: KC.navyS, b: KC.navy, h: KC.cyanS },
    bootB: { o: KC.o, s: KC.navyS, b: KC.navyS, h: KC.navy },
    skin: { o: KC.o, s: KC.skinS, b: KC.skin, h: KC.skinH },
    hair: { o: KC.o, s: KC.hairS, b: KC.hair, h: KC.hairH },
  };
  const KD = {
    thigh: 27, shin: 26, foot: 8, torso: 30, neck: 3, headR: 8, uarm: 17, farm: 16,
    shDrop: 3, shOff: 1.5, hipOff: 1.5,
    rThigh: [6, 4.4], rShin: [4.2, 3.2], rFoot: 2.9, rUarm: [3.7, 3.0], rFarm: [3.1, 2.7], rFist: 3.8,
    torsoF: [6, 5, 7.6, 3.6], torsoB: [6, 5, 6.2, 3.8],
  };

  function kessaLeg(ctx, L, toe, back) {
    const [hip, knee, ankle] = L;
    const r = back ? KR.suitB : KR.suit, b = back ? KR.bootB : KR.boot;
    shade(ctx, r, capS(ctx, hip, knee, KD.rThigh[0], KD.rThigh[1]));
    shade(ctx, r, capS(ctx, knee, ankle, KD.rShin[0], KD.rShin[1]));
    const bt = lerp(knee, ankle, 0.52);
    shade(ctx, b, capS(ctx, bt, ankle, KD.rShin[1] + 0.6, KD.rShin[1] + 0.7));
    shade(ctx, b, capS(ctx, ankle, toe, KD.rFoot, KD.rFoot * 0.75));
    // yellow-white boot cuff trim
    ctx.fillStyle = back ? KC.yelS : KC.yelH;
    fillCapsule(ctx, lerp(knee, ankle, 0.5), lerp(knee, ankle, 0.58), KD.rShin[1] + 0.7, KD.rShin[1] + 0.7);
    // toe cap
    ctx.fillStyle = back ? KC.navy : KC.yel;
    fillCircle(ctx, lerp(ankle, toe, 0.92), 1.2);
  }

  function kessaArm(ctx, A, fist, back, P) {
    const [sh, el, wr] = A;
    const r = back ? KR.suitB : KR.suit;
    shade(ctx, r, capS(ctx, sh, el, KD.rUarm[0], KD.rUarm[1]));
    shade(ctx, r, capS(ctx, el, wr, KD.rFarm[0], KD.rFarm[1]));
    // glove cuff
    ctx.fillStyle = back ? KC.yelS : KC.yelH;
    fillCapsule(ctx, lerp(el, wr, 0.78), lerp(el, wr, 0.92), KD.rFarm[1] + 0.6, KD.rFarm[1] + 0.6);
    if (!back && P.point) {
      const d = norm(el, wr);
      shade(ctx, KR.glove, capS(ctx, fist, add(fist, d, 5.5), 1.3, 1.1));
    }
    shade(ctx, back ? KR.gloveB : KR.glove, circS(ctx, fist, KD.rFist));
  }

  function kessaTorso(ctx, J) {
    shade(ctx, KR.suit, torsoS(ctx, J.hip, J.t, J.tl, KD.torsoF, KD.torsoB));
    const u = J.up, f = J.fw;
    // navy side panel (back seam)
    ctx.fillStyle = KC.navy;
    fillCapsule(ctx, add(add(J.hip, u, 3), f, -3.6), add(add(J.hip, u, J.tl - 5), f, -3.8), 1.3, 1.1);
    // collar
    ctx.fillStyle = KC.yelH;
    fillCapsule(ctx, add(add(J.neck, u, -1.2), f, -2.6), add(add(J.neck, u, -2), f, 2.4), 0.9, 0.9);
    // belt
    ctx.fillStyle = KC.o;
    fillCapsule(ctx, add(add(J.hip, u, 4), f, -5.8), add(add(J.hip, u, 4), f, 5.8), 1.9, 1.9);
    ctx.fillStyle = KC.yelH;
    fillCapsule(ctx, add(add(J.hip, u, 4.2), f, -5), add(add(J.hip, u, 4.2), f, 5), 1.0, 1.0);
    // chest bolt emblem (original mark: a 3-step zig)
    const c = add(add(J.hip, u, J.tl * 0.68), f, 2.6);
    ctx.fillStyle = KC.yel;
    fillCapsule(ctx, add(c, u, 2.4), add(add(c, u, 0.2), f, -1.6), 0.8, 0.8);
    fillCapsule(ctx, add(add(c, u, 0.2), f, -1.6), add(add(c, u, -0.2), f, 1.2), 0.8, 0.8);
    fillCapsule(ctx, add(add(c, u, -0.2), f, 1.2), add(add(c, u, -2.6), f, -0.4), 0.8, 0.8);
  }

  function kessaHead(ctx, J) {
    const c = J.head, a = J.ht * R, u = upv(J.ht), f = fwv(J.ht);
    shade(ctx, KR.hair, ellS(ctx, c, 7.3, 8.3, a));
    const fc = add(add(c, f, 1.9), u, -1.3);
    shade(ctx, KR.skin, ellS(ctx, fc, 5.5, 6.5, a));
    // bangs
    ctx.fillStyle = KC.o; fillEllipse(ctx, add(add(c, u, 4.6), f, 0.6), 6.9, 3.7, a);
    ctx.fillStyle = KC.hair; fillEllipse(ctx, add(add(c, u, 4.9), f, 0.3), 6.2, 3.0, a);
    ctx.fillStyle = KC.hairH; fillEllipse(ctx, add(add(c, u, 5.9), f, -1.2), 3.0, 1.1, a);
    // eye (determined) + brow
    const eye = add(add(c, f, 4.7), u, 0.4);
    ctx.fillStyle = KC.o; ctx.fillRect(Math.round(eye.x) - 1, Math.round(eye.y) - 1, 2, 2);
    ctx.fillStyle = KC.white; ctx.fillRect(Math.round(eye.x), Math.round(eye.y) - 1, 1, 1);
  }

  function kessaHair(ctx, J, P) {
    const u = upv(J.ht), f = fwv(J.ht);
    let p = add(add(J.head, f, -5.6), u, 3.4);
    const angs = P.hair || [-100, -106, -112, -118];
    const radii = [3.3, 3.0, 2.5, 1.9, 1.2];
    const pts = [p]; angs.forEach((a) => { p = add(p, dd(a), 6.2); pts.push(p); });
    for (let i = 0; i < pts.length - 1; i++) shade(ctx, KR.hair, capS(ctx, pts[i], pts[i + 1], radii[i], radii[i + 1]));
    ctx.fillStyle = KC.o; fillCircle(ctx, add(pts[0], dd(angs[0]), 1.2), 2.4);
    ctx.fillStyle = KC.yel; fillCircle(ctx, add(pts[0], dd(angs[0]), 1.2), 1.6);
  }

  function sparks(ctx, c, n, size, seed) {
    const rnd = rng(seed);
    for (let i = 0; i < n; i++) {
      let p = add(c, V(rnd() * 2 - 1, rnd() * 2 - 1), size * 0.4);
      const col = [KC.white, KC.cyanH, KC.yelH][i % 3];
      ctx.fillStyle = col;
      for (let k = 0; k < 3; k++) {
        const q = add(p, V(rnd() * 2 - 1, rnd() * 2 - 1), size * 0.45);
        fillCapsule(ctx, p, q, 0.55, 0.55); p = q;
      }
    }
  }

  function drawKessa(ctx, P0, i) {
    const P = ground(P0, KD);
    const J = rig(P, KD);
    kessaHair(ctx, J, P);
    kessaArm(ctx, J.armB, J.fistB, true, P);
    kessaLeg(ctx, J.legB, J.toeB, true);
    kessaTorso(ctx, J);
    kessaLeg(ctx, J.legF, J.toeF, false);
    kessaHead(ctx, J);
    kessaArm(ctx, J.armF, J.fistF, false, P);
    if (P.spark) sparks(ctx, J.fistF, P.spark, 8 + P.spark, 100 + i * 7);
  }

  // ---- Kessa poses ----
  const KB = { x: 64, y: 70, t: 8, h: -4, aF: [42, 150], aB: [22, 162], lF: [28, -6], lB: [-26, -12], fF: 90, fB: 86, hair: [-100, -106, -112, -118] };
  const K = (o) => Object.assign({}, KB, o);

  const kIdle = [0, 1, 2, 3, 2, 1].map((b, i) => K({
    x: 64 + (i < 3 ? 0 : 0.6), t: 8 + b * 0.6, h: -4 + b * 0.5,
    lF: [28 + b * 2.2, -6 - b * 1.6], lB: [-26 - b * 2.0, -12 - b * 1.8],
    aF: [42 + b * 1.5, 150 - b * 1.2], aB: [22 + b, 162 - b],
    hair: [-100 + b * 3, -106 + b * 4, -112 + b * 5, -118 + b * 6],
  }));

  const kWalk = [];
  for (let i = 0; i < 8; i++) {
    const ph = (i / 8) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
    kWalk.push(K({
      x: 64, t: 9 + Math.abs(s) * 2,
      lF: [20 + 14 * s, -6 - 18 * Math.max(0, c)], lB: [-20 + 14 * s, -10 - 18 * Math.max(0, -c)],
      aF: [44 + 4 * s, 150], aB: [22 - 4 * s, 160],
      hair: [-96 - 8 * c, -104 - 10 * c, -112 - 12 * c, -120 - 12 * c],
    }));
  }

  const kJump = [
    K({ t: 2, h: -6, lF: [62, -24], lB: [-4, -40], aF: [62, 172], aB: [34, 172], fF: 120, fB: 40, hair: [-40, -30, -22, -16] }),
    K({ t: 14, h: 2, lF: [100, 10], lB: [58, -24], aF: [52, 150], aB: [28, 160], fF: 110, fB: 70, hair: [-120, -130, -140, -150] }),
    K({ t: 6, h: -2, lF: [30, 2], lB: [-12, -8], aF: [74, 140], aB: [44, 150], fF: 100, fB: 60, hair: [-140, -152, -162, -170] }),
  ];
  const kLand = [K({ t: 16, h: 6, lF: [64, -28], lB: [-40, -62], aF: [52, 138], aB: [30, 150], hair: [-80, -86, -94, -100] })];

  const kLight = [ // "Snap Kick": wind-up, wind-up, IMPACT, recovery, recovery
    K({ t: -2, lF: [62, -8], lB: [-18, -10], aF: [36, 148], aB: [10, 150], fF: 110 }),
    K({ t: -8, lF: [84, 16], lB: [-10, -6], aF: [30, 140], aB: [-20, 120], fF: 120, hair: [-96, -100, -106, -112] }),
    K({ t: -12, x: 66, lF: [56, 68], lB: [-6, -4], aF: [24, 132], aB: [-40, 100], fF: 104, hair: [-110, -118, -126, -132] }),
    K({ t: -6, x: 65, lF: [62, 12], lB: [-12, -8], aF: [32, 140], aB: [-6, 130], fF: 110 }),
    K({ t: 4, lF: [34, -4], lB: [-22, -10], aF: [40, 148], aB: [14, 158] }),
  ];

  const kHeavy = [ // "Rising Spin": 3 wind-up, 2 IMPACT, 2 recovery
    K({ t: 16, h: 4, lF: [40, -24], lB: [-34, -48], aF: [20, 60], aB: [-10, 40], hair: [-90, -95, -100, -105] }),
    K({ t: 4, h: -4, lF: [14, -4], lB: [-60, -82], aF: [-20, 40], aB: [60, 120], fB: -20, hair: [-70, -60, -55, -50] }),
    K({ t: 28, h: 10, lF: [6, -2], lB: [-104, -96], aF: [-60, -20], aB: [80, 100], fB: -10, hair: [60, 70, 80, 90] }),
    K({ t: -26, h: -10, lF: [102, 96], lB: [-4, -4], aF: [-50, -90], aB: [-30, -60], fF: 180, fB: 40, hair: [-60, -50, -40, -35] }),
    K({ t: -32, h: -12, lF: [126, 120], lB: [-2, -2], aF: [-70, -110], aB: [-40, -80], fF: 200, fB: 40, hair: [-30, -20, -10, 0] }),
    K({ t: -10, lF: [70, 20], lB: [-10, -6], aF: [20, 120], aB: [0, 140], fF: 110, hair: [-130, -140, -148, -156] }),
    K({ t: 4, lF: [36, -4], lB: [-22, -10], aF: [40, 150], aB: [20, 160] }),
  ];

  const kSpecial = [ // "Volt Arc": 3 wind-up (charging), 2 IMPACT, 3 recovery
    K({ t: -2, x: 63, aF: [-30, -70], aB: [30, 150], lF: [30, -6], lB: [-30, -14], spark: 3 }),
    K({ t: -8, x: 62, aF: [-60, -110], aB: [34, 160], lF: [36, -16], lB: [-34, -30], spark: 5, hair: [-110, -120, -130, -140] }),
    K({ t: -12, x: 61, aF: [-82, -150], aB: [40, 170], lF: [40, -22], lB: [-30, -36], spark: 7, hair: [-130, -142, -154, -164] }),
    K({ t: 18, x: 67, aF: [118, 112], aB: [-30, -10], lF: [46, 6], lB: [-38, -18], spark: 4, hair: [-90, -96, -104, -112] }),
    K({ t: 22, x: 68, aF: [88, 80], aB: [-36, -16], lF: [46, 6], lB: [-40, -20], spark: 2, hair: [-96, -102, -108, -116] }),
    K({ t: 16, x: 67, aF: [52, 92], aB: [-10, 40], lF: [42, 2], lB: [-36, -16] }),
    K({ t: 11, x: 66, aF: [44, 138], aB: [10, 120], lF: [36, -2], lB: [-30, -14] }),
    K({ t: 8, x: 65, aF: [42, 148], aB: [20, 158] }),
  ];

  const kHurt = [
    K({ t: -12, h: -16, aF: [30, 120], aB: [10, 130], lF: [24, -8], lB: [-28, -14], hair: [-60, -70, -80, -90] }),
    K({ t: -26, h: -24, x: 61, aF: [100, 150], aB: [80, 140], lF: [38, 10], lB: [-24, -24], hair: [-40, -40, -50, -60] }),
    K({ t: -10, h: -8, x: 62, aF: [50, 140], aB: [24, 150], lF: [30, -4], lB: [-28, -14], hair: [-80, -88, -96, -104] }),
  ];

  const kDefeat = [ // collapse to one knee
    K({ t: -22, h: -20, x: 62, aF: [70, 120], aB: [60, 110], lF: [32, 0], lB: [-26, -20], hair: [-50, -55, -65, -75] }),
    K({ t: 8, h: 12, x: 62, aF: [20, 40], aB: [10, 30], lF: [52, -14], lB: [-12, -50], hair: [-120, -130, -140, -150] }),
    K({ t: 22, h: 24, x: 60, lF: [80, 2], lB: [14, -70], fB: -40, aF: [30, 40], aB: [10, 20], hair: [-60, -44, -32, -24] }),
    K({ t: 32, h: 34, x: 58, lF: [84, 0], lB: [6, -88], fB: -95, aF: [70, 40], aB: [4, 4], hair: [-40, -24, -12, -4] }),
    K({ t: 36, h: 40, x: 58, lF: [86, 0], lB: [2, -92], fB: -98, aF: [74, 36], aB: [2, 0], hair: [-30, -14, -4, 2] }),
  ];

  const kWin = [ // cocky finger-point
    K({ t: 2, h: -2, lF: [14, 0], lB: [-12, -4], aF: [30, 60], aB: [-10, 30] }),
    K({ t: -2, h: -6, lF: [16, 0], lB: [-12, -4], aF: [88, 86], point: true, aB: [-34, 40], hair: [-110, -115, -120, -125] }),
    K({ t: -4, h: -10, lF: [16, 0], lB: [-12, -4], aF: [92, 88], point: true, aB: [-34, 40], hair: [-78, -88, -100, -112] }),
    K({ t: -3, h: -8, lF: [16, 0], lB: [-12, -4], aF: [90, 87], point: true, aB: [-34, 40], hair: [-96, -104, -112, -120] }),
  ];

  // ======================================================================
  // BROM — short, very wide, warm palette (iron-red / burnt orange / charcoal / ember seams)
  // ======================================================================
  const BC = {
    o: '#170d0b', chS: '#1f1b1b', ch: '#3a3434', chH: '#5c5450',
    irS: '#5e1f16', ir: '#9a3a20', irH: '#c9662c', irHH: '#e08a4e',
    ember: '#ff8a1c', emberH: '#ffd65a',
    skinS: '#6e4030', skin: '#a0684a', skinH: '#c48c66',
    pS: '#2e1814', p: '#4a2820', pH: '#6a3a2a',
  };
  const BPAL = Object.values(BC);
  const BRr = {
    torso: { o: BC.o, s: BC.irS, b: BC.ir, h: BC.irH },
    skin: { o: BC.o, s: BC.skinS, b: BC.skin, h: BC.skinH },
    skinB: { o: BC.o, s: BC.pS, b: BC.skinS, h: BC.skin },
    pants: { o: BC.o, s: BC.pS, b: BC.p, h: BC.pH },
    pantsB: { o: BC.o, s: BC.pS, b: BC.pS, h: BC.p },
    ch: { o: BC.o, s: BC.chS, b: BC.ch, h: BC.chH },
    chB: { o: BC.o, s: BC.chS, b: BC.chS, h: BC.ch },
    beard: { o: BC.o, s: BC.pS, b: BC.p, h: BC.pH },
  };
  const BD = {
    thigh: 22, shin: 20, foot: 11, torso: 33, neck: 2, headR: 8.5, uarm: 17, farm: 18,
    shDrop: 5, shOff: 4, hipOff: 5,
    rThigh: [8, 6.6], rShin: [6.4, 6], rFoot: 4.6, rUarm: [6.6, 5.8], rFarm: [6, 7.2], rFist: 6.4,
    torsoF: [13, 12.5, 16.5, 9], torsoB: [12, 11.5, 15, 9],
  };

  function bromLeg(ctx, L, toe, back, glow) {
    const [hip, knee, ankle] = L;
    shade(ctx, back ? BRr.pantsB : BRr.pants, capS(ctx, hip, knee, BD.rThigh[0], BD.rThigh[1]));
    shade(ctx, back ? BRr.pantsB : BRr.pants, capS(ctx, knee, ankle, BD.rShin[0], BD.rShin[1]));
    const bt = lerp(knee, ankle, 0.45);
    shade(ctx, back ? BRr.chB : BRr.ch, capS(ctx, bt, ankle, BD.rShin[1] + 0.8, BD.rShin[1] + 1.0));
    shade(ctx, back ? BRr.chB : BRr.ch, capS(ctx, ankle, toe, BD.rFoot, BD.rFoot * 0.85));
    // ember sole seam
    const d = norm(ankle, toe);
    const down = V(-d.y, d.x).y > 0 ? V(-d.y, d.x) : V(d.y, -d.x);
    ctx.fillStyle = back ? BC.irS : (glow ? BC.emberH : BC.ember);
    fillCapsule(ctx, add(add(ankle, down, BD.rFoot - 1.2), d, -1.5), add(add(toe, down, BD.rFoot * 0.85 - 1.2), d, 0.5), 0.7, 0.7);
  }

  function bromArm(ctx, A, fist, back, glow) {
    const [sh, el, wr] = A;
    shade(ctx, back ? BRr.skinB : BRr.skin, capS(ctx, sh, el, BD.rUarm[0], BD.rUarm[1]));
    shade(ctx, back ? BRr.chB : BRr.ch, capS(ctx, el, wr, BD.rFarm[0], BD.rFarm[1]));
    // ember seams on bracer
    const d = norm(el, wr), n = V(-d.y, d.x);
    ctx.fillStyle = back ? BC.irS : (glow ? BC.emberH : BC.ember);
    fillCapsule(ctx, add(lerp(el, wr, 0.3), n, 0), add(lerp(el, wr, 0.85), n, 0), 0.65, 0.65);
    fillCapsule(ctx, add(lerp(el, wr, 0.55), n, -3), add(lerp(el, wr, 0.55), n, 3), 0.6, 0.6);
    shade(ctx, back ? BRr.chB : BRr.ch, circS(ctx, fist, BD.rFist));
    // knuckle seam
    ctx.fillStyle = back ? BC.irS : (glow ? BC.emberH : BC.ember);
    const k = add(fist, d, BD.rFist - 2.2);
    fillCapsule(ctx, add(k, n, -2.6), add(k, n, 2.6), 0.7, 0.7);
  }

  function bromTorso(ctx, J, glow) {
    const u = J.up, f = J.fw;
    // trapezius slab
    shade(ctx, BRr.skin, ellS(ctx, add(J.neck, u, -3), 12, 5.5, J.t * R));
    shade(ctx, BRr.torso, torsoS(ctx, J.hip, J.t, J.tl, BD.torsoF, BD.torsoB));
    // plate seams (heated metal) clipped to torso
    ctx.save();
    ctx.beginPath(); window.SH.torsoPts(J.hip, J.t, J.tl, BD.torsoF, BD.torsoB, -1.2).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath(); ctx.clip();
    ctx.fillStyle = glow ? BC.emberH : BC.ember;
    fillCapsule(ctx, add(add(J.hip, u, J.tl * 0.46), f, -16), add(add(J.hip, u, J.tl * 0.46), f, 16), 0.6, 0.6);
    fillCapsule(ctx, add(add(J.hip, u, J.tl * 0.46), f, 4), add(add(J.hip, u, J.tl * 0.95), f, 5), 0.6, 0.6);
    ctx.fillStyle = BC.irHH;
    fillCapsule(ctx, add(add(J.hip, u, J.tl * 0.88), f, -8), add(add(J.hip, u, J.tl * 0.8), f, 10), 0.7, 0.7);
    // charcoal harness strap (shoulder to hip)
    ctx.fillStyle = BC.o;
    fillCapsule(ctx, add(add(J.hip, u, J.tl + 1), f, 9), add(add(J.hip, u, 4), f, -11), 3.6, 3.6);
    ctx.fillStyle = BC.ch;
    fillCapsule(ctx, add(add(J.hip, u, J.tl + 1), f, 9), add(add(J.hip, u, 4), f, -11), 2.5, 2.5);
    ctx.fillStyle = BC.chH;
    fillCapsule(ctx, add(add(J.hip, u, J.tl + 1), f, 8.2), add(add(J.hip, u, 4.5), f, -11.8), 0.6, 0.6);
    ctx.restore();
    // belt + ember buckle
    ctx.fillStyle = BC.o; fillCapsule(ctx, add(add(J.hip, u, 2.5), f, -13), add(add(J.hip, u, 2.5), f, 13.5), 3.1, 3.1);
    ctx.fillStyle = BC.ch; fillCapsule(ctx, add(add(J.hip, u, 2.7), f, -12.2), add(add(J.hip, u, 2.7), f, 12.8), 2.1, 2.1);
    ctx.fillStyle = BC.o; fillCircle(ctx, add(add(J.hip, u, 2.7), f, 8), 3);
    ctx.fillStyle = glow ? BC.emberH : BC.ember; fillCircle(ctx, add(add(J.hip, u, 2.7), f, 8), 1.8);
  }

  function bromHead(ctx, J) {
    const c = J.head, a = J.ht * R, u = upv(J.ht), f = fwv(J.ht);
    shade(ctx, BRr.skin, capS(ctx, J.neck, lerp(J.neck, c, 0.6), 7, 6.5));
    shade(ctx, BRr.skin, ellS(ctx, c, 7.6, 8.2, a));
    // ear
    ctx.fillStyle = BC.skinS; fillEllipse(ctx, add(add(c, f, -1.6), u, 0), 1.6, 2.4, a);
    // beard
    shade(ctx, BRr.beard, ellS(ctx, add(add(c, u, -4.4), f, 1.6), 6.6, 4.6, a));
    // heavy brow + eye
    ctx.fillStyle = BC.o; fillCapsule(ctx, add(add(c, u, 1.6), f, 2.4), add(add(c, u, 1.4), f, 6.6), 1.0, 1.0);
    const eye = add(add(c, f, 5.0), u, 0.1);
    ctx.fillStyle = BC.emberH; ctx.fillRect(Math.round(eye.x), Math.round(eye.y), 1, 1);
    ctx.fillStyle = BC.o; ctx.fillRect(Math.round(eye.x) - 1, Math.round(eye.y), 1, 1);
    // scalp highlight
    ctx.fillStyle = BC.skinH; fillEllipse(ctx, add(add(c, u, 5.2), f, -1), 2.6, 1.2, a);
  }

  function emberFlecks(ctx, c, n, seed, spread) {
    const rnd = rng(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? BC.ember : BC.emberH;
      const p = add(c, V(rnd() * 2 - 1, -rnd()), spread);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      if (i % 3 === 0) ctx.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 1);
    }
  }

  function drawBrom(ctx, P0, i) {
    const P = ground(P0, BD);
    const J = rig(P, BD);
    bromArm(ctx, J.armB, J.fistB, true, P.glow);
    bromLeg(ctx, J.legB, J.toeB, true, P.glow);
    bromTorso(ctx, J, P.glow);
    bromLeg(ctx, J.legF, J.toeF, false, P.glow);
    bromHead(ctx, J);
    bromArm(ctx, J.armF, J.fistF, false, P.glow);
    if (P.glow) emberFlecks(ctx, V(J.hip.x, 120), 10, 300 + i, 22);
  }

  // ---- Brom poses ----
  const BB = { x: 64, y: 78, t: 6, h: -2, aF: [30, 130], aB: [20, 140], lF: [22, -4], lB: [-22, -8], fF: 90, fB: 86 };
  const B = (o) => Object.assign({}, BB, o);

  const bIdle = [0, 1, 2, 1].map((b) => B({ t: 6 + b * 0.5, breath: b * 0.7, aF: [30 + b, 130 - b], aB: [20 + b, 140 - b], h: -2 - b * 0.6 }));

  const bWalk = [];
  for (let i = 0; i < 6; i++) {
    const ph = (i / 6) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
    bWalk.push(B({
      x: 64 + 1.2 * s, t: 6 + 3 * Math.abs(s),
      lF: [18 + 10 * s, -4 - 14 * Math.max(0, c)], lB: [-18 + 10 * s, -8 - 14 * Math.max(0, -c)],
      aF: [30 - 3 * s, 130], aB: [20 + 3 * s, 140],
    }));
  }

  const bJump = [
    B({ t: 0, lF: [50, -20], lB: [-20, -46], aF: [70, 160], aB: [50, 170] }),
    B({ t: 10, lF: [70, -10], lB: [30, -40], aF: [60, 140], aB: [40, 150], fB: 60 }),
    B({ t: 4, lF: [26, 4], lB: [-26, -4], aF: [92, 120], aB: [72, 110] }),
  ];
  const bLand = [B({ t: 18, lF: [60, -30], lB: [-56, -46], aF: [44, 92], aB: [32, 92] })];

  const bLight = [ // "Hook": 2 wind-up, IMPACT, 2 recovery
    B({ t: 2, x: 63, aF: [10, 110], aB: [24, 150] }),
    B({ t: 4, x: 62, aF: [-4, 100], aB: [26, 150] }),
    B({ t: 16, x: 67, aF: [92, 90], aB: [30, 160], lF: [30, -2], lB: [-24, -10] }),
    B({ t: 10, x: 66, aF: [60, 112], aB: [26, 150] }),
    B({ t: 7, x: 65, aF: [38, 128], aB: [22, 144] }),
  ];

  const bHeavy = [ // "Anvil Drop": 3 wind-up, 2 IMPACT, 2 long recovery
    B({ t: -2, aF: [120, 170], aB: [110, 170] }),
    B({ t: -10, aF: [168, 186], aB: [162, 184] }),
    B({ t: -16, x: 62, aF: [200, 214], aB: [194, 212], lF: [20, -2], lB: [-24, -6] }),
    B({ t: 24, x: 69, aF: [110, 100], aB: [104, 98], lF: [40, 0], lB: [-28, -12] }),
    B({ t: 34, x: 71, aF: [84, 62], aB: [80, 60], lF: [44, 4], lB: [-26, -14] }),
    B({ t: 30, x: 70, aF: [70, 50], aB: [66, 48], lF: [42, 2], lB: [-26, -12] }),
    B({ t: 16, x: 67, aF: [44, 110], aB: [30, 130], lF: [30, -2], lB: [-24, -10] }),
  ];

  const bSpecial = [ // "Forge Quake": crouch, hop, apex, stomp-down, IMPACT x2, 3 recovery
    B({ t: 14, lF: [50, -24], lB: [-50, -34], aF: [30, 40], aB: [24, 30] }),
    B({ t: 4, lift: 10, lF: [64, -18], lB: [-12, -56], aF: [150, 175], aB: [140, 170], fF: 110 }),
    B({ t: 0, lift: 16, lF: [86, 0], lB: [36, -30], aF: [170, 190], aB: [160, 185], fF: 100 }),
    B({ t: 10, lift: 7, lF: [34, 4], lB: [-20, -10], aF: [122, 120], aB: [112, 110] }),
    B({ t: 26, lF: [42, -6], lB: [-44, -20], aF: [40, 10], aB: [30, 6], glow: true }),
    B({ t: 28, lF: [42, -6], lB: [-44, -20], aF: [38, 8], aB: [28, 4], glow: true }),
    B({ t: 20, lF: [36, -6], lB: [-36, -16], aF: [34, 60], aB: [26, 60] }),
    B({ t: 12, aF: [34, 110], aB: [24, 120] }),
    B({ t: 8, aF: [31, 128], aB: [21, 138] }),
  ];

  const bHurt = [
    B({ t: 1, h: -10, x: 63, aF: [30, 124], aB: [20, 134] }),
    B({ t: -18, h: -22, x: 61, aF: [70, 130], aB: [60, 120], lF: [34, 8], lB: [-20, -18] }),
    B({ t: -6, h: -8, x: 62, aF: [34, 128], aB: [22, 136] }),
  ];

  const bDefeat = [ // slow topple backwards
    B({ t: -14, h: -14, aF: [60, 100], aB: [50, 90], lF: [28, 0], lB: [-18, -10] }),
    B({ t: -34, h: -20, x: 66, aF: [90, 110], aB: [80, 100], lF: [38, 10], lB: [-6, -4] }),
    B({ t: -58, h: -20, x: 72, aF: [120, 130], aB: [110, 130], lF: [60, 30], lB: [30, 20] }),
    B({ t: -80, h: -10, x: 78, aF: [150, 160], aB: [140, 150], lF: [78, 60], lB: [64, 50], fF: 150, fB: 140 }),
    B({ t: -92, h: -4, x: 80, aF: [-84, -92], aB: [-72, -88], lF: [88, 82], lB: [80, 76], fF: 170, fB: 160 }),
  ];

  const bWin = [ // slow single nod, arms folded
    B({ t: 0, h: 0, aF: [34, 100], aB: [30, 96], lF: [18, -2], lB: [-18, -6] }),
    B({ t: 2, h: 18, aF: [34, 100], aB: [30, 96], lF: [18, -2], lB: [-18, -6] }),
    B({ t: 4, h: 30, aF: [34, 100], aB: [30, 96], lF: [18, -2], lB: [-18, -6] }),
    B({ t: 0, h: 2, aF: [34, 100], aB: [30, 96], lF: [18, -2], lB: [-18, -6] }),
  ];

  window.SH.fighters = {
    kessa: {
      draw: drawKessa, palette: KPAL, dims: KD,
      anims: { idle: kIdle, walk: kWalk, jump: kJump, land: kLand, light: kLight, heavy: kHeavy, special: kSpecial, hurt: kHurt, defeat: kDefeat, win: kWin },
    },
    brom: {
      draw: drawBrom, palette: BPAL, dims: BD,
      anims: { idle: bIdle, walk: bWalk, jump: bJump, land: bLand, light: bLight, heavy: bHeavy, special: bSpecial, hurt: bHurt, defeat: bDefeat, win: bWin },
    },
  };
  window.SH.colors = { KC, BC };
})();
