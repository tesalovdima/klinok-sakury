/* ===== Графика героя: девочка и мальчик, снаряжение каждого грейда ===== */
(() => {
  const A = ART;
  const { ell, rr, mix, dark, light, hexA, fillStroke, OUT, TAU, GRADE_COL, iconCanvas, iconCache, gem } = A;
  const SKIN = '#ffe7da', SKIN_SH = '#f7c2b0';

  /* ---------- волосы ---------- */
  const HAIRS = {
    girl: [
      { name: 'Сакура',  m: '#ff9ecd', sh: '#dd629c', hi: '#ffd7ec', eye: ['#3a1458', '#a03aa6', '#ff8ccf'], rib: '#e8435f' },
      { name: 'Лаванда', m: '#c9b8ff', sh: '#8f74d9', hi: '#efe8ff', eye: ['#1d2a5a', '#4a6ad0', '#9fd0ff'], rib: '#5c8de8' },
      { name: 'Полночь', m: '#45417a', sh: '#2a2852', hi: '#8b86d0', eye: ['#4a0f1e', '#c0304a', '#ff8a9b'], rib: '#e8435f' },
      { name: 'Янтарь',  m: '#ffb45c', sh: '#d9803a', hi: '#ffe2b0', eye: ['#1a3a2a', '#2f9a6a', '#8fe0b8'], rib: '#2f9a6a' },
    ],
    boy: [
      { name: 'Ночь',    m: '#353b6a', sh: '#1f2346', hi: '#7680c4', eye: ['#0f2a3a', '#2a8ab8', '#8fe0ff'] },
      { name: 'Серебро', m: '#e3e6f2', sh: '#a3a7c4', hi: '#ffffff', eye: ['#3a0f1e', '#c0304a', '#ff8a9b'] },
      { name: 'Пламя',   m: '#e8485c', sh: '#a82a3e', hi: '#ff9aa8', eye: ['#3a2a0a', '#d9a02a', '#ffe08a'] },
      { name: 'Пепел',   m: '#e8d29a', sh: '#b89a5a', hi: '#fff4d0', eye: ['#1d2a5a', '#4a6ad0', '#9fd0ff'] },
    ],
  };

  /* ---------- палитры грейдов ---------- */
  const GEAR = [
    { up: { m: '#f5f0e6', s: '#d6ccba', t: '#e0485c' }, lo: { m: '#3e4378', s: '#2c2f5a', t: '#e0485c' }, glove: '#efe6d6', boot: '#d9b98a', gem: '#e0485c', metal: '#c9cfd6' },
    { up: { m: '#7f9d5c', s: '#5f7c44', t: '#d4ad6c' }, lo: { m: '#6a5a3e', s: '#4f432d', t: '#c8a16a' }, glove: '#7a5a3a', boot: '#6b4a2e', gem: '#7fe07c', metal: '#b8bec6' },
    { up: { m: '#adc3dc', s: '#7f97b8', t: '#eef4fb' }, lo: { m: '#5f7ea8', s: '#465f84', t: '#dfe8f4' }, glove: '#b8c8dc', boot: '#8aa6c8', gem: '#5cbcff', metal: '#e6eef8' },
    { up: { m: '#8d6fd9', s: '#6a4fb5', t: '#e8ddff' }, lo: { m: '#5d48a6', s: '#45337f', t: '#e0d2ff' }, glove: '#8e78d8', boot: '#6e58b8', gem: '#9ef0ff', metal: '#e8ddff' },
    { up: { m: '#d9434f', s: '#a92d3b', t: '#ffd25c' }, lo: { m: '#8f2532', s: '#6b1b26', t: '#ffd25c' }, glove: '#c93b47', boot: '#a4303d', gem: '#ffd25c', metal: '#ffd25c' },
    { up: { m: '#fff6e0', s: '#ead6a5', t: '#ffc63a' }, lo: { m: '#f6ead0', s: '#d9c493', t: '#ffc63a' }, glove: '#fff1cc', boot: '#f4e2b0', gem: '#7fe3ff', metal: '#ffd760' },
    { up: { m: '#3b2556', s: '#26163a', t: '#ff62d4' }, lo: { m: '#2b1a40', s: '#1a0f2a', t: '#ff62d4' }, glove: '#3b2556', boot: '#2b1a40', gem: '#ff62d4', metal: '#8a6ab0' },
  ];
  const BASE = { up: { m: '#3d3764', s: '#2b2650', t: '#6d63a8' }, lo: { m: '#2f2a52', s: '#221e3e', t: '#6d63a8' }, boot: '#4a3d5e' };
  const JEWEL = ['#c98a4a', '#dfe6ee', '#4f8fe8', '#a46ae8', '#e0304a', '#7fe3ff', '#ff62d4'];

  const BLADE = [
    { b: '#c79a5e', e: '#e9c690', wood: true, grip: '#8a6238' },
    { b: '#d6dde6', e: '#ffffff', grip: '#2a2140', wrap: '#c94a6a', tsuba: '#5a5a66' },
    { b: '#b4d9ff', e: '#ffffff', grip: '#1d2a4a', wrap: '#5cbcff', tsuba: '#cbd8ea', tassel: '#3f8fe8' },
    { b: '#d3bfff', e: '#f7f2ff', grip: '#2a1d4a', wrap: '#bd8aff', tsuba: '#e8ddff', tassel: '#8a5ad8' },
    { b: '#ffbb98', e: '#fff2e4', grip: '#3a1418', wrap: '#ffcf5a', tsuba: '#ffcf5a', tassel: '#d9434f' },
    { b: '#fff0bd', e: '#ffffff', grip: '#f4e2b0', wrap: '#ffc63a', tsuba: '#ffd760', tassel: '#ffd760' },
    { b: '#2c1a3a', e: '#ff86e3', grip: '#1a0f2a', wrap: '#ff62d4', tsuba: '#3a2452', tassel: '#ff62d4' },
  ];
  const BLADE_LEN = [50, 56, 60, 64, 68, 72, 76];
  const pulse = (t, f = 4) => .6 + .4 * Math.sin(t * f);

  /* ====================================================================== */
  /* look: {body,hair,weapon:{g,e}|null,helmet,upper,lower,gloves,boots,neck,ear,aura,cosmetic}
     an:   {t, run, phase, swing(-1|0..1), hurt, dead, cast} */
  function drawHero(ctx, x, y, k, look, an) {
    const t = an.t, boy = look.body === 'boy';
    const H = HAIRS[boy ? 'boy' : 'girl'][look.hair || 0] || HAIRS.girl[0];
    ctx.save();
    ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(15,6,30,.3)'; ell(ctx, 2, 0, 26, 5.5); ctx.fill();
    if (an.dead) { ctx.globalAlpha = .45; ctx.translate(0, 4); }

    if (look.aura >= 0) {
      const c = GRADE_COL[look.aura], p = .55 + .25 * Math.sin(t * 3);
      const g = ctx.createRadialGradient(0, -52, 6, 0, -52, 70);
      g.addColorStop(0, hexA(c, 0)); g.addColorStop(.45, hexA(c, .28 * p)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ell(ctx, 0, -52, 52, 66); ctx.fill();
      ctx.strokeStyle = hexA(c, .5 * p); ctx.lineWidth = 1.5;
      ell(ctx, 0, -2, 30 + 4 * Math.sin(t * 2), 7); ctx.stroke();
    }
    if (look.cosmetic === 'petals') petalOrbit(ctx, t, false);

    const run = an.run, ph = an.phase;
    const bob = (run ? -Math.abs(Math.sin(ph)) * 3.2 : Math.sin(t * 2.4) * 1.1) - (an.cast > 0 ? Math.sin((1 - Math.min(1, an.cast / .4)) * Math.PI) * 5 : 0);
    let lean = an.swing >= 0 ? Math.sin(Math.min(1, an.swing * 1.6) * Math.PI) * .12 : (an.cast > 0 ? -.05 : run ? .08 : 0);
    if (an.cast > 0) lean += an.castType === 'single' ? .12 : an.castType === 'meteor' ? -.04 : 0;
    const hurtX = an.hurt > 0 ? Math.sin(an.hurt * 60) * 8 * an.hurt : 0;
    ctx.translate(hurtX, bob);
    ctx.rotate(lean);
    if (an.cast > 0) {
      const q = 1 - Math.min(1, an.cast / .4), s = Math.sin(q * Math.PI);
      if (an.castType === 'meteor') ctx.translate(0, -7 * s);
      else if (an.castType === 'cone' || an.castType === 'storm') ctx.rotate(-.07 * s);
      else if (an.castType === 'aoe') ctx.rotate(.06 * s);
    }

    const ug = look.upper, lg = look.lower;
    const U = ug >= 0 ? GEAR[ug].up : BASE.up, L = lg >= 0 ? GEAR[lg].lo : BASE.lo;
    const bootC = look.boots >= 0 ? GEAR[look.boots].boot : BASE.boot;

    backGear(ctx, ug, t, run, ph);
    if (!boy) ponytail(ctx, H, t, run, ph);
    const sh = run ? Math.sin(ph) : Math.sin(t * 2.4) * .15;
    backArm(ctx, U, look.gloves, sh, t);

    const legSwing = run ? Math.sin(ph) * .75 : 0;
    if (boy) {
      boyLeg(ctx, -5, -30, -legSwing + .05, L, lg, bootC, look.boots, true, t);
      boyHip(ctx, L, lg, t);
      boyLeg(ctx, 5, -30, legSwing - .02, L, lg, bootC, look.boots, false, t);
    } else {
      girlLeg(ctx, -4, -20, -legSwing + .05, bootC, look.boots, true, t);
      skirt(ctx, L, lg, t, run);
      girlLeg(ctx, 5, -20, legSwing - .02, bootC, look.boots, false, t);
    }
    torso(ctx, ug, U, t, boy);
    ctx.fillStyle = SKIN_SH; ctx.fillRect(-2.5, -61, 6, 5);
    if (look.neck >= 0) necklace(ctx, look.neck, t);
    head(ctx, t, look, an, H, boy);
    if (look.ear >= 0) earring(ctx, look.ear, t);
    pauldron(ctx, ug, U, t);
    swordArm(ctx, t, look, an, U);
    if (an.cast > 0) {
      const p = Math.min(1, an.cast / .4), c = an.castEl || '#ffe3f0';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .55 * Math.sin(p * Math.PI);
      const g = ctx.createRadialGradient(22, -78, 2, 22, -78, 46);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.35, c); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ell(ctx, 22, -78, 46, 46); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.4; ctx.globalAlpha = .5;
      ell(ctx, 22, -78, 20 + 8 * Math.sin(t * 12), 20 + 8 * Math.sin(t * 12)); ctx.stroke();
      ctx.restore();
    }
    if (look.cosmetic === 'petals') petalOrbit(ctx, t, true);
    ctx.restore();
  }

  function petalOrbit(ctx, t, front) {
    for (let i = 0; i < 6; i++) {
      const a = t * 1.4 + i * TAU / 6, z = Math.sin(a);
      if ((z > 0) !== front) continue;
      const px = Math.cos(a) * 30, py = -50 + Math.sin(a * 2 + i) * 18;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a * 2);
      ctx.fillStyle = i % 2 ? '#ffc4de' : '#ff8fc1'; ell(ctx, 0, 0, 3.4, 1.9); ctx.fill(); ctx.restore();
    }
  }

  /* ---------- спина: плащи и крылья ---------- */
  function capePath(ctx, wave, ragged) {
    ctx.beginPath();
    ctx.moveTo(-9, -55);
    ctx.bezierCurveTo(-22, -46, -30 + wave, -26, -34 + wave, -8);
    if (ragged) {
      const pts = [[-30 + wave, -12], [-27 + wave * .8, -5], [-23 + wave * .6, -11], [-19 + wave * .4, -4], [-16, -12]];
      for (const [px, py] of pts) ctx.lineTo(px, py);
    } else ctx.lineTo(-14, -12);
    ctx.bezierCurveTo(-10, -30, -4, -44, 6, -54);
    ctx.closePath();
  }
  function backGear(ctx, g, t, run, ph) {
    if (g < 3) return;
    const wave = Math.sin(t * 5 + (run ? ph : 0)) * (run ? 6 : 2);
    if (g === 5) wings(ctx, t, '#fffaf0', '#ffc63a', .78);
    if (g === 6) shards(ctx, t);
    if (g === 3) {
      // короткая накидка лунной стражи
      ctx.beginPath(); ctx.moveTo(-9, -56); ctx.bezierCurveTo(-18, -50, -22 + wave, -40, -24 + wave, -30);
      ctx.lineTo(-10, -32); ctx.bezierCurveTo(-6, -42, -2, -50, 6, -55); ctx.closePath();
      fillStroke(ctx, '#45337f', OUT, 2);
      ctx.strokeStyle = '#e8ddff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-24 + wave, -30); ctx.lineTo(-10, -32); ctx.stroke();
      return;
    }
    capePath(ctx, wave, g === 6);
    const C = { 4: ['#b32a3a', '#ffd25c'], 5: ['#fffaf0', '#ffc63a'], 6: ['#1e1030', '#ff62d4'] }[g];
    fillStroke(ctx, C[0], OUT, 2);
    ctx.save(); capePath(ctx, wave, g === 6); ctx.clip();
    ctx.fillStyle = dark(C[0], .25); ctx.fillRect(-40, -60, 14, 60);
    if (g === 4) { ctx.strokeStyle = hexA('#ffd25c', .6); ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14 - i * 6, -40 + i * 8); ctx.lineTo(-20 - i * 6 + wave * .5, -30 + i * 8); ctx.stroke(); } }
    if (g === 6) { ctx.strokeStyle = hexA('#ff62d4', .5 * pulse(t)); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-18 + wave * .4, -28, 5, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = C[1]; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-34 + wave, -8); ctx.lineTo(-14, -12); ctx.stroke();
  }
  function wings(ctx, t, fill, edge, alpha) {
    const flap = Math.sin(t * 2.6) * .12;
    for (const [ox, rot, a] of [[-2, -.2, alpha * .7], [-6, .05, alpha]]) {
      ctx.save(); ctx.translate(ox, -50); ctx.rotate(rot + flap); ctx.globalAlpha *= a;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-10, -22, -30, -34, -44, -30);
      ctx.quadraticCurveTo(-40, -22, -42, -16);
      ctx.quadraticCurveTo(-34, -12, -36, -4);
      ctx.quadraticCurveTo(-26, -2, -26, 6);
      ctx.quadraticCurveTo(-14, 4, -10, 10);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, -44, -20); g.addColorStop(0, fill); g.addColorStop(1, light(edge, .6));
      fillStroke(ctx, g, edge, 1.4);
      ctx.strokeStyle = hexA(edge, .6); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-22, -16, -40, -24); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(-22, -6, -34, -8); ctx.stroke();
      ctx.restore();
    }
  }
  function shards(ctx, t) {
    for (let i = 0; i < 5; i++) {
      const a = -2.4 + i * .32, r = 30 + (i % 2) * 6, bob = Math.sin(t * 2 + i) * 2;
      const px = Math.cos(a) * r - 4, py = -52 + Math.sin(a) * r + bob;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3.5, 0); ctx.lineTo(0, 9); ctx.lineTo(-3.5, 0); ctx.closePath();
      ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 8 * pulse(t, 3 + i);
      fillStroke(ctx, '#3a2452', '#ff62d4', 1.2); ctx.restore();
    }
  }

  /* ---------- волосы и голова ---------- */
  function ponytail(ctx, H, t, run, ph) {
    const sway = run ? Math.sin(ph) * 6 - 6 : Math.sin(t * 1.6) * 3;
    ctx.beginPath();
    ctx.moveTo(-14, -100);
    ctx.bezierCurveTo(-40, -104, -46 + sway, -84, -44 + sway, -62);
    ctx.bezierCurveTo(-43 + sway, -50, -50 + sway, -40, -56 + sway * 1.3, -34);
    ctx.bezierCurveTo(-40 + sway, -40, -30, -60, -26, -80);
    ctx.closePath();
    fillStroke(ctx, H.m, OUT, 2.2);
    ctx.beginPath(); ctx.moveTo(-30, -96); ctx.bezierCurveTo(-40, -88, -40 + sway, -70, -42 + sway, -58);
    ctx.strokeStyle = H.sh; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = H.rib; ell(ctx, -17, -99, 4.5, 3.5, .5); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke();
    ell(ctx, -21, -104, 3.4, 2.4, -.5); fillStroke(ctx, H.rib, OUT, 1.2);
  }
  function head(ctx, t, look, an, H, boy) {
    const hurt = an.hurt > 0, yell = an.swing >= 0 && an.swing < .7 || an.cast > 0;
    // задняя масса волос
    ctx.beginPath();
    if (boy) {
      ctx.moveTo(-24, -64);
      const pts = [[-33, -70], [-28, -76], [-39, -84], [-29, -90], [-36, -102], [-22, -102], [-20, -114], [-8, -108], [0, -118], [8, -110]];
      for (const [px, py] of pts) ctx.lineTo(px, py);
      ctx.bezierCurveTo(24, -114, 32, -98, 30, -86);
      ctx.lineTo(29, -70); ctx.lineTo(25, -62); ctx.lineTo(-20, -60);
    } else {
      ctx.moveTo(-26, -78);
      ctx.bezierCurveTo(-34, -112, 26, -122, 30, -88);
      ctx.bezierCurveTo(32, -76, 30, -66, 26, -60);
      ctx.lineTo(-24, -58);
      ctx.bezierCurveTo(-30, -64, -28, -72, -26, -78);
    }
    ctx.closePath();
    fillStroke(ctx, H.sh, OUT, 2.2);

    // лицо
    ctx.beginPath();
    ctx.moveTo(-18, -84);
    if (boy) { ctx.bezierCurveTo(-18, -70, -8, -61, 6, -60); ctx.bezierCurveTo(18, -60, 25, -70, 25, -84); }
    else { ctx.bezierCurveTo(-18, -68, -6, -60, 7, -60); ctx.bezierCurveTo(18, -60, 25, -70, 25, -84); }
    ctx.bezierCurveTo(25, -104, -18, -104, -18, -84);
    ctx.closePath();
    fillStroke(ctx, SKIN, OUT, 2.2);
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(232,150,140,.35)'; ell(ctx, 4, -91, 26, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = boy ? 'rgba(255,120,150,.22)' : 'rgba(255,120,150,.38)';
    ell(ctx, 19, -71, 4.5, 2.4); ctx.fill(); ell(ctx, -3, -71, 4, 2.2); ctx.fill();

    // глаза
    if (hurt) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
      for (const [ex, s] of [[14, 1], [0, .85]]) { ctx.beginPath(); ctx.moveTo(ex - 4 * s, -83); ctx.lineTo(ex + 3 * s, -79); ctx.lineTo(ex - 4 * s, -75); ctx.stroke(); }
    } else if (an.dead) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      for (const ex of [14, 0]) { ctx.beginPath(); ctx.moveTo(ex - 3.5, -82); ctx.lineTo(ex + 3.5, -76); ctx.moveTo(ex + 3.5, -82); ctx.lineTo(ex - 3.5, -76); ctx.stroke(); }
    } else {
      const blink = (t % 3.7) < .12;
      if (boy) { eye(ctx, 14.5, -79, 6.2, 8.2, blink, H.eye, true); eye(ctx, 0, -79, 5.1, 7.8, blink, H.eye, true); }
      else { eye(ctx, 14.5, -79, 6.6, 9.6, blink, H.eye, false); eye(ctx, 0, -79, 5.4, 9, blink, H.eye, false); }
    }
    // брови
    ctx.strokeStyle = H.sh; ctx.lineWidth = boy ? 2.4 : 1.6;
    if (boy) {
      ctx.beginPath(); ctx.moveTo(9, yell ? -91 : -92); ctx.lineTo(20, yell ? -95 : -94); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, yell ? -94 : -93); ctx.lineTo(4, yell ? -90 : -91.5); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(10, yell ? -92 : -93); ctx.quadraticCurveTo(15, yell ? -91 : -95, 20, yell ? -94 : -93); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -93); ctx.quadraticCurveTo(0, -95, 3, yell ? -91 : -93); ctx.stroke();
    }
    // рот
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.6;
    if (yell) { ctx.beginPath(); ctx.moveTo(6, -68); ctx.quadraticCurveTo(9, -63, 12, -68); ctx.closePath(); fillStroke(ctx, '#b0304a', OUT, 1.4); }
    else if (hurt) { ctx.beginPath(); ctx.moveTo(5, -66); ctx.lineTo(8, -68); ctx.lineTo(11, -66); ctx.stroke(); }
    else if (boy) { ctx.beginPath(); ctx.moveTo(6, -67); ctx.quadraticCurveTo(9.5, -66, 12, -67.5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(6, -67.5); ctx.quadraticCurveTo(9, -65.5, 11.5, -67.5); ctx.stroke(); }

    // чёлка
    ctx.beginPath();
    ctx.moveTo(-22, -80);
    ctx.bezierCurveTo(-28, -112, 30, -118, 29, -84);
    const pts = boy
      ? [[28, -76], [23, -90], [19, -78], [13, -94], [9, -80], [3, -97], [-3, -84], [-9, -98], [-13, -84], [-19, -92], [-21, -74]]
      : [[27, -80], [22, -92], [19, -84], [13, -94], [7, -86], [1, -95], [-5, -87], [-11, -96], [-16, -86], [-20, -76]];
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath();
    fillStroke(ctx, H.m, OUT, 2.2);
    ctx.strokeStyle = H.hi; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(2, -96, 15, -2.6, -1.4); ctx.stroke();
    // боковые пряди
    ctx.beginPath();
    if (boy) { ctx.moveTo(22, -92); ctx.lineTo(31, -74); ctx.lineTo(25, -80); ctx.lineTo(27, -66); ctx.lineTo(20, -82); }
    else { ctx.moveTo(22, -92); ctx.quadraticCurveTo(30, -78, 27, -60); ctx.quadraticCurveTo(24, -70, 20, -84); }
    ctx.closePath();
    fillStroke(ctx, H.m, OUT, 1.8);
    // ахоге
    ctx.beginPath();
    if (boy) { ctx.moveTo(4, -108); ctx.quadraticCurveTo(12 + Math.sin(t * 3) * 1.5, -118, 18, -114); }
    else { ctx.moveTo(2, -107); ctx.quadraticCurveTo(8 + Math.sin(t * 3) * 2, -122, 16, -116); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 4.2; ctx.stroke(); ctx.strokeStyle = H.m; ctx.lineWidth = 2.2; ctx.stroke();

    helmet(ctx, t, look.helmet, boy);
  }
  function eye(ctx, x, y, w, h, blink, E, boy) {
    if (blink) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x - w, y + 1); ctx.quadraticCurveTo(x, y + 4, x + w, y); ctx.stroke(); return;
    }
    ctx.fillStyle = '#fff'; ell(ctx, x, y, w, h); ctx.fill();
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, E[0]); g.addColorStop(.55, E[1]); g.addColorStop(1, E[2]);
    ctx.fillStyle = g; ell(ctx, x + .6, y + .6, w * .86, h * .9); ctx.fill();
    ctx.fillStyle = '#1a0a26'; ell(ctx, x + .8, y + .5, w * .42, h * .46); ctx.fill();
    ctx.fillStyle = '#fff'; ell(ctx, x - w * .3, y - h * .38, w * .32, h * .22); ctx.fill();
    ell(ctx, x + w * .35, y + h * .45, w * .16, h * .1); ctx.fill();
    ctx.strokeStyle = OUT;
    if (boy) {
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x - w - .5, y - h * .55); ctx.quadraticCurveTo(x, y - h - 1.4, x + w + 1, y - h * .7); ctx.stroke();
    } else {
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(x - w - .5, y - h * .45); ctx.quadraticCurveTo(x, y - h - 2.2, x + w + 1.5, y - h * .55); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + w + 1, y - h * .6); ctx.lineTo(x + w + 3, y - h * .25); ctx.stroke();
    }
  }

  function helmet(ctx, t, g, boy) {
    if (g < 0) {
      if (boy) return;
      ctx.save(); ctx.translate(22, -96);
      ctx.fillStyle = '#ffeaf3';
      for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ell(ctx, 0, -3, 2.2, 3); ctx.fill(); }
      ctx.fillStyle = '#ff5c8a'; ell(ctx, 0, 0, 1.4, 1.4); ctx.fill();
      ctx.restore();
      return;
    }
    if (g === 0) {
      ctx.beginPath(); ctx.moveTo(-20, -93); ctx.quadraticCurveTo(4, -101, 27, -92);
      ctx.lineTo(27, -87); ctx.quadraticCurveTo(4, -95, -20, -88); ctx.closePath();
      fillStroke(ctx, '#f7f4ee', OUT, 1.8);
      ctx.fillStyle = '#e0485c'; ell(ctx, 10, -93, 2.6, 2.6); ctx.fill();
      const w = Math.sin(t * 6) * 3;
      ctx.beginPath(); ctx.moveTo(-20, -91); ctx.quadraticCurveTo(-32, -96 + w, -40, -88 + w); ctx.lineTo(-37, -84 + w); ctx.quadraticCurveTo(-30, -90 + w, -20, -88); ctx.closePath();
      fillStroke(ctx, '#f7f4ee', OUT, 1.6);
      ctx.beginPath(); ctx.moveTo(-20, -89); ctx.quadraticCurveTo(-30, -86 + w, -36, -78 + w); ctx.lineTo(-33, -76 + w); ctx.quadraticCurveTo(-28, -84 + w, -20, -87); ctx.closePath();
      fillStroke(ctx, '#f7f4ee', OUT, 1.4);
      return;
    }
    if (g === 1) {
      // капюшон странника с кожаным ремешком
      ctx.beginPath(); ctx.moveTo(-24, -76); ctx.bezierCurveTo(-30, -116, 34, -122, 31, -84); ctx.lineTo(28, -88);
      ctx.bezierCurveTo(26, -110, -18, -110, -20, -84); ctx.closePath();
      fillStroke(ctx, '#6f8a4e', OUT, 2);
      ctx.strokeStyle = '#4f6a36'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.arc(4, -88, 22, -2.8, -.3); ctx.stroke(); ctx.setLineDash([]);
      rr(ctx, 5, -101, 12, 7, 2); fillStroke(ctx, '#c9cfd6', OUT, 1.4);
      ctx.fillStyle = '#7fe07c'; ell(ctx, 11, -97.5, 1.8, 1.8); ctx.fill();
      return;
    }
    if (g === 2) {
      ctx.beginPath(); ctx.moveTo(-22, -88); ctx.bezierCurveTo(-26, -118, 30, -122, 30, -88);
      ctx.quadraticCurveTo(4, -100, -22, -88); ctx.closePath();
      fillStroke(ctx, '#7f9fc6', OUT, 2.2);
      ctx.strokeStyle = '#e6eef8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(4, -95, 18, -2.7, -.5); ctx.stroke();
      ctx.fillStyle = '#e6eef8'; for (const rx of [-12, 0, 12, 22]) { ell(ctx, rx, -91 - (rx === 0 || rx === 12 ? 3 : 0), 1.2, 1.2); ctx.fill(); }
      // шейная пластина сикоро
      ctx.beginPath(); ctx.moveTo(-23, -88); ctx.quadraticCurveTo(-30, -78, -28, -70); ctx.lineTo(-22, -74); ctx.quadraticCurveTo(-22, -82, -18, -86); ctx.closePath();
      fillStroke(ctx, '#6a88b0', OUT, 1.6);
      ctx.beginPath(); ctx.moveTo(8, -104); ctx.quadraticCurveTo(0, -122, -8, -126); ctx.quadraticCurveTo(2, -116, 4, -104); ctx.closePath();
      fillStroke(ctx, '#ffd25c', OUT, 1.6);
      ctx.beginPath(); ctx.moveTo(14, -104); ctx.quadraticCurveTo(24, -120, 32, -122); ctx.quadraticCurveTo(22, -112, 18, -103); ctx.closePath();
      fillStroke(ctx, '#ffd25c', OUT, 1.6);
      return;
    }
    if (g === 3) {
      ctx.beginPath(); ctx.moveTo(-19, -92); ctx.quadraticCurveTo(4, -102, 27, -91);
      ctx.strokeStyle = OUT; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#e8ddff'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.save(); ctx.translate(8, -106);
      ctx.beginPath(); ctx.arc(0, 0, 7, .6, TAU - .6); ctx.arc(3, 0, 5.4, TAU - .9, .9, true); ctx.closePath();
      fillStroke(ctx, '#c9b8ff', OUT, 1.6);
      ctx.restore();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8 + s * 6, -99); ctx.lineTo(8 + s * 12, -104); ctx.lineTo(8 + s * 9, -98); ctx.closePath(); fillStroke(ctx, '#e8ddff', OUT, 1.1); }
      ctx.fillStyle = '#9ef0ff'; ctx.shadowColor = '#9ef0ff'; ctx.shadowBlur = 6; ell(ctx, 8, -98, 2, 2.6); ctx.fill(); ctx.shadowBlur = 0;
      return;
    }
    if (g === 4) {
      const w = Math.sin(t * 4) * 2;
      for (const [dy, c, len] of [[0, '#ff7a3c', 1], [-5, '#ffcf5a', .8]]) {
        ctx.beginPath(); ctx.moveTo(-10, -104 + dy); ctx.bezierCurveTo(-30 * len, -118 + w + dy, -46 * len, -108 + w + dy, -54 * len, -96 + w + dy);
        ctx.bezierCurveTo(-40 * len, -102 + dy, -26, -102 + dy, -12, -98 + dy); ctx.closePath();
        fillStroke(ctx, c, OUT, 1.8);
      }
      ctx.beginPath(); ctx.moveTo(-20, -92); ctx.quadraticCurveTo(4, -103, 27, -91); ctx.lineTo(27, -86); ctx.quadraticCurveTo(4, -97, -20, -87); ctx.closePath();
      fillStroke(ctx, '#d9434f', OUT, 1.8);
      ctx.beginPath(); ctx.moveTo(4, -97); ctx.lineTo(6, -108); ctx.lineTo(8, -102); ctx.lineTo(10, -112); ctx.lineTo(12, -97); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, 1.4);
      ctx.fillStyle = '#ff5a2c'; ell(ctx, 8, -96, 1.8, 1.8); ctx.fill();
      return;
    }
    if (g === 5) {
      ctx.strokeStyle = hexA('#ffe48a', .8 + .2 * Math.sin(t * 3)); ctx.lineWidth = 2.4;
      ell(ctx, 4, -122 + Math.sin(t * 2) * 1.5, 16, 4); ctx.stroke();
      ctx.strokeStyle = hexA('#fff8d0', .5); ctx.lineWidth = 5; ell(ctx, 4, -122 + Math.sin(t * 2) * 1.5, 16, 4); ctx.stroke();
      const cr = [[-14, -98], [-12, -110], [-5, -102], [3, -116], [10, -102], [18, -112], [22, -98]];
      ctx.beginPath(); cr.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.quadraticCurveTo(4, -94, -14, -98); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 1.8);
      for (const [px, py] of [[-12, -110], [3, -116], [18, -112]]) { ctx.fillStyle = '#fffbe8'; ell(ctx, px, py, 1.6, 1.6); ctx.fill(); }
      ctx.fillStyle = '#7fe3ff'; ell(ctx, 3, -103, 2.2, 2.6); ctx.fill();
      return;
    }
    ctx.beginPath(); ctx.moveTo(-20, -93); ctx.quadraticCurveTo(4, -102, 27, -92); ctx.lineTo(27, -87); ctx.quadraticCurveTo(4, -96, -20, -88); ctx.closePath();
    fillStroke(ctx, '#2b1a40', OUT, 1.8);
    for (const s of [-1, 1]) {
      ctx.beginPath(); const bx = s < 0 ? -10 : 18;
      ctx.moveTo(bx - 4, -97); ctx.quadraticCurveTo(bx + s * 10, -110, bx + s * 6, -126); ctx.quadraticCurveTo(bx + s * 2, -110, bx + 4, -97); ctx.closePath();
      fillStroke(ctx, '#3a2452', OUT, 1.6);
      ctx.strokeStyle = hexA('#ff62d4', .7 * pulse(t)); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, -100); ctx.quadraticCurveTo(bx + s * 6, -110, bx + s * 5, -120); ctx.stroke();
    }
    ctx.fillStyle = '#ff62d4'; ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 8;
    ell(ctx, 4, -96, 2.6, 2.6); ctx.fill(); ctx.shadowBlur = 0;
  }

  /* ---------- торс ---------- */
  function torsoPath(ctx, w) {
    ctx.beginPath();
    ctx.moveTo(-w, -57); ctx.quadraticCurveTo(0, -60, w + 1, -57);
    ctx.quadraticCurveTo(w + 3, -44, w, -33);
    ctx.lineTo(-w, -33);
    ctx.quadraticCurveTo(-w - 3, -44, -w, -57);
    ctx.closePath();
  }
  function torso(ctx, g, U, t, boy) {
    const w = boy ? 12 : 10;
    torsoPath(ctx, w); ctx.fillStyle = U.m; ctx.fill();
    ctx.save(); torsoPath(ctx, w); ctx.clip();
    ctx.fillStyle = U.s; ctx.fillRect(-w - 4, -60, 9, 30);
    torsoDetails(ctx, g, U, t, w);
    ctx.restore();
    torsoPath(ctx, w); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
    if (g === 0) { // узел оби
      ctx.beginPath(); ctx.moveTo(-w, -36); ctx.lineTo(-w - 7, -32); ctx.lineTo(-w - 4, -38); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 1.3);
      ctx.beginPath(); ctx.moveTo(-w, -36); ctx.lineTo(-w - 5, -29); ctx.lineTo(-w - 1, -31); ctx.closePath(); fillStroke(ctx, '#c93a4c', OUT, 1.3);
    }
  }
  function belt(ctx, c, buckle, w) {
    ctx.fillStyle = c; ctx.fillRect(-w - 4, -38, 2 * w + 8, 5);
    ctx.fillStyle = dark(c, .25); ctx.fillRect(-w - 4, -34.5, 2 * w + 8, 1.5);
    if (buckle) { rr(ctx, -2, -38.6, 6, 6, 1.2); fillStroke(ctx, buckle, OUT, 1); }
  }
  function torsoDetails(ctx, g, U, t, w) {
    ctx.lineCap = 'round';
    switch (g) {
      case -1:
        ctx.strokeStyle = U.t; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(3, -46); ctx.lineTo(10, -58); ctx.stroke();
        belt(ctx, '#8f6bd0', null, w); break;
      case 0:
        ctx.strokeStyle = U.t; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(3, -45); ctx.lineTo(10, -58); ctx.stroke();
        ctx.strokeStyle = dark(U.m, .2); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-8, -52); ctx.quadraticCurveTo(-4, -46, -7, -40); ctx.moveTo(9, -50); ctx.lineTo(7, -40); ctx.stroke();
        belt(ctx, '#e0485c', null, w); break;
      case 1:
        ctx.fillStyle = light(U.m, .18);
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(1, -48); ctx.lineTo(-7, -50); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, -58); ctx.lineTo(4, -48); ctx.lineTo(11, -50); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(w + 1, -57); ctx.lineTo(-w, -37); ctx.stroke();
        rr(ctx, 0, -49, 5, 5, 1); fillStroke(ctx, '#c9cfd6', OUT, .9);
        ctx.strokeStyle = hexA('#f2e2b8', .7); ctx.lineWidth = .8; ctx.setLineDash([1.6, 1.6]);
        ctx.beginPath(); ctx.moveTo(-w + 2, -55); ctx.lineTo(-w + 1, -39); ctx.moveTo(w - 1, -55); ctx.lineTo(w - 1, -39); ctx.stroke(); ctx.setLineDash([]);
        belt(ctx, '#5a3f26', '#c9cfd6', w);
        rr(ctx, 4, -37, 6, 6, 1.5); fillStroke(ctx, '#7a5a3a', OUT, 1); break;
      case 2:
        ctx.fillStyle = light(U.m, .35); ctx.fillRect(-w - 2, -59, 2 * w + 4, 4);
        ctx.strokeStyle = dark(U.m, .35); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-w, -49); ctx.quadraticCurveTo(0, -46, w + 2, -49); ctx.moveTo(-w, -42.5); ctx.quadraticCurveTo(0, -39.5, w + 2, -42.5); ctx.stroke();
        ctx.fillStyle = '#eef4fb';
        for (const ry of [-51, -44.5]) for (const rx of [-w + 3, w - 1]) { ell(ctx, rx, ry, 1, 1); ctx.fill(); }
        ctx.strokeStyle = hexA('#ffffff', .6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -56); ctx.lineTo(-4, -50); ctx.stroke();
        belt(ctx, '#3a4560', '#e6eef8', w); break;
      case 3:
        ctx.strokeStyle = U.t; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(1, -58); ctx.lineTo(1, -38); ctx.moveTo(-w, -48); ctx.lineTo(-3, -46); ctx.moveTo(w + 2, -48); ctx.lineTo(5, -46); ctx.stroke();
        ctx.save(); ctx.translate(1, -50);
        ctx.beginPath(); ctx.arc(0, 0, 4.4, .7, TAU - .7); ctx.arc(2, 0, 3.4, TAU - 1, 1, true); ctx.closePath();
        fillStroke(ctx, '#e8ddff', OUT, 1); ctx.restore();
        belt(ctx, '#45337f', null, w);
        ctx.fillStyle = '#9ef0ff'; ctx.shadowColor = '#9ef0ff'; ctx.shadowBlur = 5; ell(ctx, 1, -35.5, 2, 2); ctx.fill(); ctx.shadowBlur = 0; break;
      case 4:
        ctx.strokeStyle = U.t; ctx.lineWidth = 1.8;
        for (const y0 of [-53, -47.5, -42]) { ctx.beginPath(); ctx.moveTo(-w + 1, y0 - 3); ctx.lineTo(1, y0 + 1.5); ctx.lineTo(w + 1, y0 - 3); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(1, -58); ctx.lineTo(4, -54.5); ctx.lineTo(1, -51); ctx.lineTo(-2, -54.5); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, 1.1);
        belt(ctx, '#ffd25c', '#d9434f', w); break;
      case 5:
        ctx.beginPath(); ctx.moveTo(-6, -56); ctx.lineTo(8, -56); ctx.lineTo(7, -45); ctx.lineTo(1, -39); ctx.lineTo(-5, -45); ctx.closePath();
        fillStroke(ctx, '#ffd760', '#c99a2a', 1.2);
        ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = .9;
        ctx.beginPath(); ctx.arc(1, -48, 4, Math.PI, 0); ctx.stroke();
        ctx.strokeStyle = U.t; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(-w + 3, -44, 3, -1.5, 1.5); ctx.arc(w - 1, -44, 3, Math.PI - 1.5, Math.PI + 1.5); ctx.stroke();
        ctx.fillStyle = '#7fe3ff'; ell(ctx, 1, -49, 2, 2.4); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.stroke();
        belt(ctx, '#ffd760', '#fff6e0', w); break;
      case 6: {
        ctx.strokeStyle = dark(U.m, .4); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-w, -50); ctx.lineTo(1, -46); ctx.lineTo(w + 2, -50); ctx.stroke();
        const a = pulse(t);
        ctx.save(); ctx.strokeStyle = hexA('#ff62d4', a); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(-6, -56); ctx.lineTo(-3, -51); ctx.lineTo(-6, -45); ctx.moveTo(8, -56); ctx.lineTo(5, -51); ctx.lineTo(8, -45);
        ctx.moveTo(1 + 3, -41); ctx.arc(1, -41, 3, 0, TAU); ctx.stroke(); ctx.restore();
        belt(ctx, '#1a0f2a', null, w);
        ctx.fillStyle = '#ff62d4'; ell(ctx, 1, -35.5, 2, 2); ctx.fill(); break;
      }
    }
  }
  function pauldron(ctx, g, U, t) {
    if (g < 1) return;
    ctx.save(); ctx.translate(9, -54);
    if (g === 1) { ell(ctx, 0, 0, 6, 4.4, -.3); fillStroke(ctx, '#6b4a2e', OUT, 1.8); ctx.restore(); return; }
    if (g === 2) {
      ell(ctx, 0, 0, 7.5, 5.5, -.3); fillStroke(ctx, light(U.m, .15), OUT, 2);
      ell(ctx, .5, 1.5, 5.5, 3.6, -.3); ctx.strokeStyle = U.t; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#eef4fb'; ell(ctx, -3, -2, 1, 1); ctx.fill(); ell(ctx, 4, -1, 1, 1); ctx.fill();
    } else if (g === 3) {
      ell(ctx, 0, -1, 8, 5.5, -.3); fillStroke(ctx, U.m, OUT, 1.8);
      ell(ctx, 1, 2, 6.5, 4.2, -.3); fillStroke(ctx, light(U.m, .12), OUT, 1.6);
      ctx.strokeStyle = U.t; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(1, 1, 2.4, .6, TAU - .6); ctx.stroke();
    } else if (g === 4) {
      ctx.beginPath(); ctx.moveTo(-7, 3); ctx.quadraticCurveTo(-6, -6, -2, -8); ctx.lineTo(0, -3); ctx.lineTo(3, -10); ctx.lineTo(4, -3); ctx.lineTo(9, -7); ctx.quadraticCurveTo(9, 2, 6, 5); ctx.closePath();
      fillStroke(ctx, U.m, OUT, 1.8);
      ctx.strokeStyle = U.t; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 2); ctx.quadraticCurveTo(0, -2, 6, 3); ctx.stroke();
    } else if (g === 5) {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate(-.9 + i * .35);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -9, 0, -15); ctx.quadraticCurveTo(-3, -9, 0, 0); fillStroke(ctx, '#fffaf0', '#c99a2a', 1);
        ctx.restore();
      }
      ell(ctx, 0, 0, 7.5, 5.5, -.3); fillStroke(ctx, '#ffd760', OUT, 1.8);
      ctx.fillStyle = '#7fe3ff'; ell(ctx, .5, .5, 1.6, 1.6); ctx.fill();
    } else if (g === 6) {
      for (const [sx, h] of [[-4, 10], [0, 13], [4, 10]]) {
        ctx.beginPath(); ctx.moveTo(sx - 2.4, -2); ctx.lineTo(sx + 1, -2 - h); ctx.lineTo(sx + 2.4, -2); ctx.closePath(); fillStroke(ctx, '#2b1a40', OUT, 1.3);
      }
      ell(ctx, 0, 0, 7.5, 5.5, -.3); fillStroke(ctx, U.m, OUT, 1.8);
      ctx.strokeStyle = hexA('#ff62d4', pulse(t)); ctx.lineWidth = 1.2; ell(ctx, .5, .5, 4, 2.6, -.3); ctx.stroke();
    }
    ctx.restore();
  }
  function necklace(ctx, g, t) {
    ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e3ddd0'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-5, -58); ctx.quadraticCurveTo(1, -51, 7, -58); ctx.stroke();
    const c = JEWEL[g];
    ctx.beginPath(); ctx.moveTo(1, -55.5); ctx.lineTo(3, -53); ctx.lineTo(1, -50.5); ctx.lineTo(-1, -53); ctx.closePath();
    if (g >= 5) { ctx.shadowColor = c; ctx.shadowBlur = 6; }
    fillStroke(ctx, c, OUT, .8); ctx.shadowBlur = 0;
  }
  function earring(ctx, g, t) {
    const sw = Math.sin(t * 3) * .15;
    ctx.save(); ctx.translate(-15, -70); ctx.rotate(sw);
    ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e3ddd0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 4); ctx.stroke();
    const c = JEWEL[g];
    if (g >= 5) { ctx.shadowColor = c; ctx.shadowBlur = 5; }
    ell(ctx, 0, 6, 1.9, 2.4); fillStroke(ctx, c, OUT, .8); ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ---------- нижняя часть: юбка (девочка) и хакама (мальчик) ---------- */
  function skirtPath(ctx, fl) {
    ctx.beginPath();
    ctx.moveTo(-11, -35); ctx.lineTo(11, -35);
    ctx.quadraticCurveTo(17, -26, 19 + fl, -15);
    ctx.quadraticCurveTo(0, -11 + fl, -19 - fl, -15);
    ctx.quadraticCurveTo(-16, -26, -11, -35);
    ctx.closePath();
  }
  function skirt(ctx, L, g, t, run) {
    const fl = run ? Math.sin(t * 13 * 2) * 1.5 : Math.sin(t * 2) * .6;
    if (g === 5) { // нижний слой
      ctx.beginPath(); ctx.moveTo(-12, -30); ctx.quadraticCurveTo(-18, -18, -21 - fl, -11); ctx.quadraticCurveTo(0, -7 + fl, 21 + fl, -11); ctx.quadraticCurveTo(18, -18, 12, -30); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 1.8);
    }
    skirtPath(ctx, fl); ctx.fillStyle = L.m; ctx.fill();
    ctx.save(); skirtPath(ctx, fl); ctx.clip();
    ctx.fillStyle = L.s; ctx.fillRect(-22, -36, 14, 30);
    ctx.strokeStyle = dark(L.m, .35); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3, -33); ctx.lineTo(-6, -13); ctx.moveTo(5, -33); ctx.lineTo(8, -13); ctx.stroke();
    const hem = -17 + fl * .5;
    switch (g) {
      case -1: case 0: ctx.fillStyle = L.t; ctx.fillRect(-22, hem, 44, 2.2); break;
      case 1:
        ctx.strokeStyle = hexA('#f2e2b8', .8); ctx.lineWidth = .9; ctx.setLineDash([1.8, 1.8]);
        ctx.beginPath(); ctx.moveTo(-20, hem + .5); ctx.lineTo(20, hem + .5); ctx.stroke(); ctx.setLineDash([]);
        rr(ctx, -12, -34, 6, 6, 1.4); fillStroke(ctx, '#7a5a3a', OUT, 1); break;
      case 2:
        for (const px of [-11, 2]) { rr(ctx, px, -33, 9, 14, 2); fillStroke(ctx, '#adc3dc', OUT, 1.2); ctx.fillStyle = '#eef4fb'; ell(ctx, px + 2.2, -30.5, .9, .9); ctx.fill(); ell(ctx, px + 6.8, -30.5, .9, .9); ctx.fill(); }
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem, 44, 1.6); break;
      case 3:
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem - 1, 44, 2.4);
        ctx.strokeStyle = hexA(L.t, .6); ctx.lineWidth = .9; ctx.beginPath();
        for (const px of [-14, -6, 2, 10]) { ctx.moveTo(px, -32); ctx.lineTo(px + (px > 0 ? 1.5 : -1.5), hem - 1); } ctx.stroke(); break;
      case 4:
        for (const px of [-12, 1]) {
          ctx.beginPath(); ctx.moveTo(px, -33); ctx.lineTo(px + 11, -33); ctx.lineTo(px + 10, -21); ctx.lineTo(px + 5.5, -17); ctx.lineTo(px + 1, -21); ctx.closePath();
          fillStroke(ctx, '#a92d3b', '#ffd25c', 1.2);
        }
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem, 44, 1.8); break;
      case 5:
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem - 1, 44, 2.6);
        ctx.fillStyle = '#7fe3ff';
        for (let px = -16; px <= 16; px += 6) { ctx.beginPath(); ctx.moveTo(px, hem - 3.5); ctx.lineTo(px + 1.6, hem - 2); ctx.lineTo(px, hem - .5); ctx.lineTo(px - 1.6, hem - 2); ctx.closePath(); ctx.fill(); }
        break;
      case 6:
        ctx.save(); ctx.fillStyle = hexA('#ff62d4', pulse(t)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6; ctx.fillRect(-22, hem, 44, 1.6); ctx.restore();
        for (const px of [-10, -2, 6]) { ctx.beginPath(); ctx.moveTo(px, -33); ctx.lineTo(px + 7, -33); ctx.lineTo(px + 3.5, -20); ctx.closePath(); fillStroke(ctx, '#3b2556', OUT, 1); }
        break;
    }
    ctx.restore();
    skirtPath(ctx, fl); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
  }
  function boyHip(ctx, L, g, t) {
    ctx.beginPath(); ctx.moveTo(-12, -36); ctx.lineTo(12, -36); ctx.lineTo(14, -26); ctx.quadraticCurveTo(0, -23, -14, -26); ctx.closePath();
    ctx.fillStyle = L.m; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = L.s; ctx.fillRect(-16, -37, 10, 14);
    ctx.strokeStyle = dark(L.m, .35); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -34); ctx.lineTo(-4, -24); ctx.moveTo(5, -34); ctx.lineTo(6, -24); ctx.stroke();
    if (g === 2) { for (const px of [-11, 3]) { rr(ctx, px, -35, 8, 9, 2); fillStroke(ctx, '#adc3dc', OUT, 1); } }
    if (g === 4) { for (const px of [-12, 2]) { ctx.beginPath(); ctx.moveTo(px, -35); ctx.lineTo(px + 10, -35); ctx.lineTo(px + 5, -25); ctx.closePath(); fillStroke(ctx, '#a92d3b', '#ffd25c', 1); } }
    if (g === 6) { for (const px of [-9, 1]) { ctx.beginPath(); ctx.moveTo(px, -35); ctx.lineTo(px + 7, -35); ctx.lineTo(px + 3.5, -25); ctx.closePath(); fillStroke(ctx, '#3b2556', OUT, 1); } }
    ctx.restore();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-12, -36); ctx.lineTo(12, -36); ctx.lineTo(14, -26); ctx.quadraticCurveTo(0, -23, -14, -26); ctx.closePath(); ctx.stroke();
  }
  function boyLeg(ctx, hx, hy, a, L, g, bootC, bootG, back, t) {
    const len = 26;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-a);
    const col = back ? dark(L.m, .18) : L.m;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(6.5, len - 8); ctx.quadraticCurveTo(0, len - 6, -6.5, len - 8); ctx.closePath();
    fillStroke(ctx, col, OUT, 2);
    ctx.save(); ctx.clip();
    if (g === 3 || g === 5) { ctx.fillStyle = L.t; ctx.fillRect(-7, len - 11, 14, 2.2); }
    if (g === 4) { ctx.fillStyle = L.t; ctx.fillRect(3.4, 0, 1.6, len); }
    if (g === 6) { ctx.fillStyle = hexA('#ff62d4', pulse(t)); ctx.fillRect(3.4, 0, 1.4, len); }
    if (g === 1) { rr(ctx, -3, 8, 6, 5, 1); fillStroke(ctx, light(L.m, .15), null); }
    ctx.restore();
    if (g === 2 || g === 4 || g === 6) { // наколенник
      ell(ctx, 0, len * .42, 4.2, 3.4); fillStroke(ctx, g === 2 ? '#e6eef8' : g === 4 ? '#ffd25c' : '#3a2452', OUT, 1.2);
    }
    ctx.restore();
    const fx = hx + Math.sin(a) * len, fy = hy + Math.cos(a) * len;
    boot(ctx, fx, fy, a, bootC, bootG, back, t);
  }
  function girlLeg(ctx, hx, hy, a, bootC, bootG, back, t) {
    const len = 18;
    const fx = hx + Math.sin(a) * len, fy = hy + Math.cos(a) * len;
    ctx.strokeStyle = OUT; ctx.lineWidth = 8.6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.strokeStyle = bootG === 0 ? (back ? '#e6dfd2' : '#f8f4ec') : (back ? '#241d38' : '#30284a'); ctx.lineWidth = 6.2; ctx.stroke();
    if (bootG === 2 || bootG === 4 || bootG === 6) {
      const kx = hx + Math.sin(a) * len * .45, ky = hy + Math.cos(a) * len * .45;
      ell(ctx, kx, ky, 3.6, 3); fillStroke(ctx, bootG === 2 ? '#e6eef8' : bootG === 4 ? '#ffd25c' : '#3a2452', OUT, 1.1);
    }
    boot(ctx, fx, fy, a, bootC, bootG, back, t);
  }
  function bootShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(-4.5, -9); ctx.lineTo(4, -9); ctx.lineTo(4.5, -3);
    ctx.quadraticCurveTo(11, -3, 11, 1.5); ctx.lineTo(-5, 1.5); ctx.closePath();
  }
  function boot(ctx, fx, fy, a, c, g, back, t) {
    if (g === -2) return;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(a * .4);
    if (g === 0) { // таби и дзори
      bootShape(ctx); fillStroke(ctx, back ? '#e6dfd2' : '#f8f4ec', OUT, 1.8);
      rr(ctx, -5.5, .5, 17, 3, 1.4); fillStroke(ctx, '#d9b98a', OUT, 1.2);
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(1, -2); ctx.lineTo(6, .5); ctx.stroke();
      ctx.restore(); return;
    }
    bootShape(ctx); fillStroke(ctx, back ? dark(c, .2) : c, OUT, 2);
    switch (g) {
      case -1: break;
      case 1:
        ctx.fillStyle = light(c, .2); ctx.fillRect(-4.5, -9, 9, 2.4);
        ctx.strokeStyle = '#f2e2b8'; ctx.lineWidth = .9; ctx.beginPath();
        ctx.moveTo(-1, -6); ctx.lineTo(3, -4); ctx.moveTo(3, -6); ctx.lineTo(-1, -4); ctx.stroke(); break;
      case 2:
        rr(ctx, -5, -10, 10, 5, 1.5); fillStroke(ctx, '#e6eef8', OUT, 1.2);
        ctx.fillStyle = '#7f97b8'; ctx.fillRect(4, -2.5, 6, 1.2); break;
      case 3:
        ctx.fillStyle = '#e8ddff'; ctx.fillRect(-4.5, -9, 9, 2.2);
        ctx.strokeStyle = '#e8ddff'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(0, -4, 1.8, .6, TAU - .6); ctx.stroke(); break;
      case 4:
        ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-3, -13); ctx.lineTo(-1, -9); ctx.lineTo(1, -14); ctx.lineTo(3, -9); ctx.lineTo(5, -12); ctx.lineTo(5, -7); ctx.closePath();
        fillStroke(ctx, '#ffd25c', OUT, 1.1); break;
      case 5:
        ctx.fillStyle = '#ffd760'; ctx.fillRect(-4.5, -9, 9, 2); ctx.fillRect(-5, .2, 16, 1.4);
        ctx.save(); ctx.translate(-4, -6); ctx.rotate(-.4 + Math.sin(t * 4) * .1);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-7, -3, -9, -8); ctx.quadraticCurveTo(-4, -6, 0, -3); ctx.closePath();
        fillStroke(ctx, '#fffaf0', '#c99a2a', 1); ctx.restore(); break;
      case 6:
        for (const sx of [-3, 1]) { ctx.beginPath(); ctx.moveTo(sx, -9); ctx.lineTo(sx + 1.5, -14); ctx.lineTo(sx + 3, -9); ctx.closePath(); fillStroke(ctx, '#3a2452', OUT, 1); }
        ctx.save(); ctx.fillStyle = hexA('#ff62d4', pulse(t)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 5; ctx.fillRect(-5, .3, 16, 1.2); ctx.restore(); break;
    }
    ctx.restore();
  }

  /* ---------- руки, наручи, катана ---------- */
  function bracer(ctx, sx, sy, hx, hy, g, t, back) {
    if (g < 0) return;
    const p0 = .5, p1 = .92;
    const x0 = sx + (hx - sx) * p0, y0 = sy + (hy - sy) * p0, x1 = sx + (hx - sx) * p1, y1 = sy + (hy - sy) * p1;
    const G = GEAR[g], c = back ? dark(G.glove, .2) : G.glove;
    ctx.strokeStyle = OUT; ctx.lineWidth = 10.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang) * 4, ny = Math.cos(ang) * 4;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    ctx.lineWidth = 1.1;
    switch (g) {
      case 0: ctx.strokeStyle = '#c9bca4'; ctx.beginPath(); for (const q of [.3, .7]) { const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q; ctx.moveTo(px - nx, py - ny); ctx.lineTo(px + nx * .6 + (x1 - x0) * .12, py + ny * .6 + (y1 - y0) * .12); } ctx.stroke(); break;
      case 1: ctx.strokeStyle = light(c, .3); ctx.beginPath(); ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.stroke(); break;
      case 2: ctx.strokeStyle = '#7f97b8'; ctx.beginPath(); ctx.moveTo(mx - nx, my - ny); ctx.lineTo(mx + nx, my + ny); ctx.stroke(); ctx.fillStyle = '#eef4fb'; ell(ctx, mx + (x1 - x0) * .2, my + (y1 - y0) * .2, .9, .9); ctx.fill(); break;
      case 3: ctx.strokeStyle = '#e8ddff'; ctx.beginPath(); ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.stroke(); ctx.fillStyle = '#9ef0ff'; ell(ctx, mx, my, 1.4, 1.4); ctx.fill(); break;
      case 4:
        ctx.fillStyle = '#ffd25c';
        for (const q of [.25, .6]) { const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q; ctx.beginPath(); ctx.moveTo(px - nx, py - ny); ctx.lineTo(px - nx * 2.2 + (x1 - x0) * .1, py - ny * 2.2 + (y1 - y0) * .1); ctx.lineTo(px - nx + (x1 - x0) * .18, py - ny + (y1 - y0) * .18); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, .8); }
        break;
      case 5: ctx.strokeStyle = '#ffd760'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.stroke(); ctx.fillStyle = '#7fe3ff'; ell(ctx, mx, my, 1.5, 1.5); ctx.fill(); break;
      case 6:
        for (const q of [.3, .65]) { const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q; ctx.beginPath(); ctx.moveTo(px - nx * .8, py - ny * .8); ctx.lineTo(px - nx * 2.3, py - ny * 2.3); ctx.lineTo(px - nx * .8 + (x1 - x0) * .15, py - ny * .8 + (y1 - y0) * .15); ctx.closePath(); fillStroke(ctx, '#2b1a40', OUT, .8); }
        ctx.save(); ctx.strokeStyle = hexA('#ff62d4', pulse(t)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + nx * .4, y0 + ny * .4); ctx.lineTo(x1 + nx * .4, y1 + ny * .4); ctx.stroke(); ctx.restore(); break;
    }
  }
  function backArm(ctx, U, gg, sh, t) {
    const sx = -7, sy = -52, a = 1.75 + sh * .7;
    const hx = sx + Math.cos(a) * 15, hy = sy + Math.sin(a) * 15;
    ctx.strokeStyle = OUT; ctx.lineWidth = 9.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = U.s; ctx.lineWidth = 7; ctx.stroke();
    bracer(ctx, sx, sy, hx, hy, gg, t, true);
    ctx.fillStyle = gg >= 1 ? dark(GEAR[gg].glove, .15) : SKIN_SH; ell(ctx, hx, hy, 3.6, 3.6); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function swordArm(ctx, t, look, an, U) {
    let sa;
    const idle = -1.25 + Math.sin(t * 2.4) * .05;
    if (an.swing >= 0) {
      const p = an.swing, combo = an.combo || 0;
      const A0 = combo === 1 ? 1.0 : combo === 2 ? -3.25 : -2.75;
      const A1 = combo === 1 ? -2.3 : combo === 2 ? 1.35 : .75;
      if (p < .28) sa = idle + (A0 - idle) * A.easeOut(p / .28);
      else if (p < .55) sa = A0 + (A1 - A0) * A.easeIn((p - .28) / .27);
      else sa = A1 + (idle - A1) * A.easeInOut((p - .55) / .45);
    } else if (an.cast > 0) {
      const c = an.castType;
      if (c === 'single') sa = -.35 + Math.sin(t * 30) * .08;
      else if (c === 'meteor') sa = -2.95 + Math.sin(t * 18) * .1;
      else if (c === 'aoe' || c === 'cone') sa = -2.2 + Math.sin(t * 20) * .45;
      else if (c === 'multi' || c === 'storm') sa = -.75 + Math.sin(t * 28) * .55;
      else sa = -1.9 - Math.sin(an.cast * Math.PI) * .6;
    }
    else if (an.run) sa = -.55 + Math.sin(an.phase) * .1;
    else sa = idle;
    const sx = 7, sy = -53, aa = sa * .55 + .55;
    const hx = sx + Math.cos(aa) * 15, hy = sy + Math.sin(aa) * 15;
    ctx.strokeStyle = OUT; ctx.lineWidth = 9.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = U.m; ctx.lineWidth = 7; ctx.stroke();
    bracer(ctx, sx, sy, hx, hy, look.gloves, t, false);
    if (look.weapon) drawKatana(ctx, hx, hy, sa, look.weapon.g, look.weapon.e, t);
    const gc = look.gloves >= 1 ? GEAR[look.gloves].glove : SKIN;
    ctx.fillStyle = gc; ell(ctx, hx, hy, 4, 4); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke();
    if (look.gloves === 0) { ctx.strokeStyle = '#efe6d6'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx, hy, 2.6, aa + 2.4, aa + 3.8); ctx.stroke(); }
  }

  function drawKatana(ctx, hx, hy, a, g, e, t, scale = 1) {
    const C = BLADE[g], s = scale, len = BLADE_LEN[g] * s;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // кисточка у навершия
    if (C.tassel) {
      const dx = Math.sin(a), dy = Math.cos(a), sw = Math.sin(t * 4) * 2.5 * s;
      const px = -12 * s, ex = px + dx * 11 * s + sw * dy * .3, ey = dy * 11 * s - sw * dx * .3;
      ctx.strokeStyle = OUT; ctx.lineWidth = 3.2 * s; ctx.beginPath(); ctx.moveTo(px, 0); ctx.quadraticCurveTo(px + dx * 5 * s + sw, dy * 5 * s, ex, ey); ctx.stroke();
      ctx.strokeStyle = C.tassel; ctx.lineWidth = 1.8 * s; ctx.stroke();
      ell(ctx, ex, ey, 2.2 * s, 2.2 * s); fillStroke(ctx, C.tassel, OUT, 1 * s);
    }
    // рукоять
    ctx.strokeStyle = OUT; ctx.lineWidth = 5.4 * s; ctx.beginPath(); ctx.moveTo(-12 * s, 0); ctx.lineTo(3 * s, 0); ctx.stroke();
    ctx.strokeStyle = C.grip; ctx.lineWidth = 3.4 * s; ctx.stroke();
    if (C.wrap) {
      ctx.strokeStyle = C.wrap; ctx.lineWidth = 1 * s;
      for (let i = -10; i < 2; i += 3) { ctx.beginPath(); ctx.moveTo(i * s, -1.6 * s); ctx.lineTo((i + 1.5) * s, 1.6 * s); ctx.stroke(); }
    }
    if (g === 6) { ell(ctx, -13 * s, 0, 2 * s, 2 * s); ctx.fillStyle = '#ff62d4'; ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6 * s; ctx.fill(); ctx.shadowBlur = 0; }
    // клинок
    const glow = A.enchGlow(e, t);
    const blade = () => {
      ctx.beginPath();
      ctx.moveTo(4 * s, -2.2 * s);
      if (g === 6) {
        // зазубренный обух клинка бездны
        const n = 7;
        for (let i = 1; i <= n; i++) {
          const q = i / n, bx = 4 * s + (len - 4 * s) * q, by = -2.2 * s - (len * .06 + 1.4 * s) * q * q;
          ctx.lineTo(bx - 3 * s, by - 2.6 * s); ctx.lineTo(bx, by);
        }
      } else ctx.quadraticCurveTo(len * .55, -3.8 * s, len, -1.2 * s - len * .06);
      ctx.quadraticCurveTo(len * .6, 2.6 * s, 4 * s, 2.2 * s);
      ctx.closePath();
    };
    if (glow) {
      ctx.save();
      ctx.shadowColor = glow; ctx.shadowBlur = (10 + Math.min(e, 16) * .9) * s;
      blade(); ctx.fillStyle = glow; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .35 + .2 * Math.sin(t * 6);
      ctx.lineWidth = 6 * s; ctx.strokeStyle = glow; blade(); ctx.stroke();
      ctx.restore();
    }
    blade(); fillStroke(ctx, C.b, OUT, 1.6 * s);
    ctx.strokeStyle = C.e; ctx.lineWidth = 1.1 * s;
    ctx.beginPath(); ctx.moveTo(8 * s, 1.2 * s); ctx.quadraticCurveTo(len * .6, 1.6 * s, len - 3 * s, -len * .06); ctx.stroke();
    if (g === 2) { // хамон-волна
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .9 * s; ctx.beginPath();
      for (let x = 8; x < BLADE_LEN[g] - 6; x += 2) { const y = Math.sin(x * .55) * .7 - (x / BLADE_LEN[g]) * BLADE_LEN[g] * .04; x === 8 ? ctx.moveTo(x * s, y * s) : ctx.lineTo(x * s, y * s); }
      ctx.stroke();
    }
    if (g === 3) { ctx.strokeStyle = hexA('#bd8aff', .8); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(8 * s, -.4 * s); ctx.quadraticCurveTo(len * .5, -1.6 * s, len * .8, -len * .05); ctx.stroke(); }
    if (g === 4) {
      ctx.globalAlpha = .75; ctx.fillStyle = '#ff7a3c';
      for (let i = 0; i < 4; i++) { const px = len * (.3 + i * .16), fl = Math.sin(t * 12 + i) * 1.5; ell(ctx, px, -4 * s - fl, 2 * s, 3.5 * s); ctx.fill(); }
      ctx.fillStyle = '#ffd25c'; for (let i = 0; i < 3; i++) { const px = len * (.36 + i * .18); ell(ctx, px, -3.4 * s, 1 * s, 1.8 * s); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (g === 5) {
      ctx.strokeStyle = '#ffc63a'; ctx.lineWidth = .9 * s; ctx.beginPath(); ctx.moveTo(8 * s, -.6 * s); ctx.lineTo(len * .7, -len * .045); ctx.stroke();
      const sp = (t * 1.5) % 1, px = 8 * s + (len - 12 * s) * sp;
      ctx.save(); ctx.translate(px, -len * .03 * sp); ctx.fillStyle = '#ffffff'; ctx.rotate(t * 4);
      ctx.fillRect(-.6 * s, -3 * s, 1.2 * s, 6 * s); ctx.fillRect(-3 * s, -.6 * s, 6 * s, 1.2 * s); ctx.restore();
    }
    if (g === 6) {
      ctx.save(); ctx.strokeStyle = hexA('#ff62d4', pulse(t, 5)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6 * s; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); for (let i = 0; i < 4; i++) { const px = (10 + i * 14) * s; ctx.moveTo(px, -.5 * s); ctx.lineTo(px + 4 * s, -1.8 * s); ctx.lineTo(px + 8 * s, -.5 * s); } ctx.stroke(); ctx.restore();
    }
    // цуба
    if (!C.wood) tsuba(ctx, g, s, C, t);
    ctx.restore();
  }
  function tsuba(ctx, g, s, C, t) {
    switch (g) {
      case 1: case 2:
        ell(ctx, 3.5 * s, 0, 2.2 * s, 5.4 * s); fillStroke(ctx, C.tsuba, OUT, 1.4 * s);
        if (g === 2) { ctx.fillStyle = OUT; ell(ctx, 3.5 * s, -2.6 * s, .7 * s, .9 * s); ctx.fill(); ell(ctx, 3.5 * s, 2.6 * s, .7 * s, .9 * s); ctx.fill(); }
        break;
      case 3:
        ctx.save(); ctx.translate(3.5 * s, 0);
        ctx.beginPath(); ctx.arc(0, 0, 6 * s, -2.2, 2.2); ctx.arc(-2.5 * s, 0, 4.4 * s, 1.9, -1.9, true); ctx.closePath();
        fillStroke(ctx, C.tsuba, OUT, 1.2 * s); ctx.restore(); break;
      case 4:
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(3.5 * s, 0); ctx.quadraticCurveTo(7 * s, sg * 4 * s, 2 * s, sg * 8 * s); ctx.quadraticCurveTo(1 * s, sg * 3 * s, 3.5 * s, 0); fillStroke(ctx, C.tsuba, OUT, 1.1 * s); }
        ell(ctx, 3.5 * s, 0, 1.8 * s, 2.6 * s); fillStroke(ctx, '#d9434f', OUT, 1 * s); break;
      case 5:
        for (const sg of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(3.5 * s, 0); ctx.quadraticCurveTo(0, sg * 6 * s, -4 * s, sg * 10 * s); ctx.quadraticCurveTo(1 * s, sg * 7 * s, 2 * s, sg * 6 * s);
          ctx.quadraticCurveTo(2 * s, sg * 3 * s, 3.5 * s, 0); fillStroke(ctx, '#fffaf0', '#c99a2a', 1 * s);
        }
        ell(ctx, 3.5 * s, 0, 2 * s, 3 * s); fillStroke(ctx, C.tsuba, OUT, 1.1 * s); break;
      case 6:
        ell(ctx, 3.5 * s, 0, 2.2 * s, 5 * s); fillStroke(ctx, C.tsuba, OUT, 1.2 * s);
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2.5 * s, sg * 4 * s); ctx.lineTo(5 * s, sg * 9 * s); ctx.lineTo(4.6 * s, sg * 3.5 * s); ctx.closePath(); fillStroke(ctx, '#2b1a40', OUT, 1 * s); }
        break;
    }
  }

  /* ---------- иконки предметов ---------- */
  function itemIcon(slot, g, size = 96) {
    const key = 'it' + slot + g + '_' + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const G = GEAR[g], t = 1.2;
    switch (slot) {
      case 'weapon': drawKatana(ctx, 15, 51, -.86, g, 0, t, .74); break;
      case 'helmet':
        ctx.save(); ctx.translate(29, 104); ctx.scale(.72, .72);
        ctx.fillStyle = 'rgba(20,14,44,.55)'; ell(ctx, 4, -84, 21, 19); ctx.fill();
        helmet(ctx, t, g, true); ctx.restore(); break;
      case 'upper':
        ctx.save(); ctx.translate(32, 108); ctx.scale(1.55, 1.55);
        if (g >= 4) { const C = { 4: '#b32a3a', 5: '#fffaf0', 6: '#1e1030' }[g]; ctx.beginPath(); ctx.moveTo(-10, -57); ctx.lineTo(-17, -32); ctx.lineTo(14, -32); ctx.lineTo(11, -57); ctx.closePath(); fillStroke(ctx, C, OUT, 1.6); }
        torso(ctx, g, G.up, t, true); pauldron(ctx, g, G.up, t);
        ctx.save(); ctx.scale(-1, 1); pauldron(ctx, g, G.up, t); ctx.restore();
        ctx.restore(); break;
      case 'lower':
        ctx.save(); ctx.translate(32, 66); ctx.scale(1.3, 1.3);
        boyLeg(ctx, -5, -30, .08, G.lo, g, '#00000000', -2, false, t);
        boyLeg(ctx, 5, -30, -.08, G.lo, g, '#00000000', -2, false, t);
        boyHip(ctx, G.lo, g, t); ctx.restore(); break;
      case 'gloves': {
        const gc = g >= 1 ? G.glove : '#f2e8d8';
        ctx.beginPath(); ctx.moveTo(20, 50); ctx.lineTo(20, 34); ctx.quadraticCurveTo(14, 28, 14, 20); ctx.lineTo(18, 18); ctx.lineTo(22, 26);
        ctx.lineTo(22, 10); ctx.lineTo(27, 10); ctx.lineTo(28, 24); ctx.lineTo(30, 8); ctx.lineTo(35, 8); ctx.lineTo(35, 24); ctx.lineTo(38, 10); ctx.lineTo(43, 11); ctx.lineTo(42, 26);
        ctx.lineTo(45, 16); ctx.lineTo(50, 18); ctx.lineTo(46, 36); ctx.lineTo(46, 50); ctx.closePath();
        fillStroke(ctx, gc, OUT, 2.2);
        const cuff = [ '#efe6d6', '#5a3f26', '#adc3dc', '#6a4fb5', '#a92d3b', '#fff6e0', '#26163a'][g];
        if (g === 4) { ctx.beginPath(); ctx.moveTo(17, 42); ctx.lineTo(21, 34); ctx.lineTo(25, 41); ctx.lineTo(30, 32); ctx.lineTo(35, 41); ctx.lineTo(41, 34); ctx.lineTo(45, 42); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, 1.6); }
        if (g === 6) { for (const sx of [21, 31, 41]) { ctx.beginPath(); ctx.moveTo(sx - 3, 42); ctx.lineTo(sx, 32); ctx.lineTo(sx + 3, 42); ctx.closePath(); fillStroke(ctx, '#3a2452', OUT, 1.4); } }
        rr(ctx, 16, 41, 34, 16, 3); fillStroke(ctx, cuff, OUT, 2);
        ctx.lineWidth = 1.6;
        if (g === 0) { ctx.strokeStyle = '#c9bca4'; ctx.beginPath(); for (const x of [22, 30, 38]) { ctx.moveTo(x, 43); ctx.lineTo(x + 6, 55); } ctx.stroke(); }
        if (g === 1) { ctx.strokeStyle = '#f2e2b8'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(19, 44); ctx.lineTo(47, 44); ctx.moveTo(19, 54); ctx.lineTo(47, 54); ctx.stroke(); ctx.setLineDash([]); }
        if (g === 2) { ctx.strokeStyle = '#7f97b8'; ctx.beginPath(); ctx.moveTo(16, 49); ctx.lineTo(50, 49); ctx.stroke(); ctx.fillStyle = '#eef4fb'; for (const x of [20, 46]) { ell(ctx, x, 45, 1.4, 1.4); ctx.fill(); ell(ctx, x, 53, 1.4, 1.4); ctx.fill(); } }
        if (g === 3) { ctx.strokeStyle = '#e8ddff'; ctx.strokeRect(18, 43, 30, 12); ctx.beginPath(); ctx.arc(33, 49, 3.6, .7, TAU - .7); ctx.stroke(); }
        if (g === 4) { ctx.strokeStyle = '#ffd25c'; ctx.beginPath(); ctx.moveTo(16, 49); ctx.lineTo(50, 49); ctx.stroke(); }
        if (g === 5) { ctx.fillStyle = '#ffd760'; ctx.fillRect(16, 43, 34, 3); ctx.fillRect(16, 52, 34, 3); ctx.fillStyle = '#7fe3ff'; ell(ctx, 33, 49, 3, 3); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); }
        if (g === 6) { ctx.save(); ctx.strokeStyle = '#ff62d4'; ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.moveTo(19, 49); ctx.lineTo(47, 49); ctx.stroke(); ctx.restore(); }
        break;
      }
      case 'boots':
        ctx.save(); ctx.translate(26, 50); ctx.scale(2.6, 2.6);
        ctx.strokeStyle = OUT; ctx.lineWidth = 8.6; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -8); ctx.stroke();
        ctx.strokeStyle = g === 0 ? '#f8f4ec' : dark(G.boot, .1); ctx.lineWidth = 6.2; ctx.stroke();
        boot(ctx, 0, 0, 0, G.boot, g, false, t); ctx.restore(); break;
      case 'neck':
        ctx.strokeStyle = OUT; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.arc(32, 14, 20, .25, Math.PI - .25); ctx.stroke();
        ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e8e2d6'; ctx.lineWidth = 2.4; ctx.stroke();
        if (g >= 3) { ctx.fillStyle = JEWEL[g]; for (const a of [.7, 1.2, 1.94, 2.44]) { ell(ctx, 32 + Math.cos(a) * 20, 14 + Math.sin(a) * 20, 2, 2); ctx.fill(); } }
        gem(ctx, 32, 44, 9, JEWEL[g]); break;
      case 'ear':
        ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(32, 16, 8, Math.PI, 0); ctx.lineTo(40, 26); ctx.stroke();
        ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e3ddd0'; ctx.lineWidth = 2; ctx.stroke();
        gem(ctx, 32, 40, 8, JEWEL[g]);
        if (g >= 5) { ctx.fillStyle = '#ffffff'; ell(ctx, 42, 34, 1.4, 1.4); ctx.fill(); } break;
      case 'ring':
        ctx.strokeStyle = OUT; ctx.lineWidth = 8.5; ell(ctx, 32, 38, 15, 13); ctx.stroke();
        ctx.strokeStyle = g >= 4 ? '#ffd760' : g >= 2 ? '#e8eef4' : '#d9a066'; ctx.lineWidth = 5; ctx.stroke();
        if (g >= 5) { ctx.strokeStyle = hexA(JEWEL[g], .7); ctx.lineWidth = 1.2; ell(ctx, 32, 38, 15, 13); ctx.stroke(); }
        gem(ctx, 32, 22, 8, JEWEL[g]); break;
    }
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  // портрет для карточек выбора и иконки вкладки
  function heroIcon(body, hair, size = 64) {
    const key = 'hero' + body + hair + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 64, 64); ctx.clip();
    drawHero(ctx, 29, 94, .72, { body, hair, weapon: null, helmet: -1, upper: -1, lower: -1, gloves: -1, boots: -1, neck: -1, ear: -1, aura: -1 }, { t: 1, run: 0, phase: 0, swing: -1, hurt: 0, dead: false, cast: 0 });
    ctx.restore();
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  Object.assign(ART, { drawHero, drawKatana, itemIcon, heroIcon, HAIRS, GEAR, JEWEL });
})();
