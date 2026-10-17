/* ===== Графика: аниме-героиня, монстры, фоны, иконки ===== */
const ART = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- утилиты ---------- */
  function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const dark = (c, t = .3) => mix(c, '#1a0f2a', t);
  const light = (c, t = .3) => mix(c, '#ffffff', t);
  function hash(n) { n = (n << 13) ^ n; return 1 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824; } // -1..1
  const h01 = n => (hash(n) + 1) / 2;
  function fillStroke(ctx, fill, stroke, lw) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }

  /* ---------- палитры экипировки ---------- */
  const OUT = '#2b1532';
  const GRADE_COL = ['#cfc5b0', '#7fe07c', '#5cbcff', '#bd8aff', '#ff9156', '#ffd760', '#ff5fd2'];

  function enchGlow(e, t = 0) {
    if (e >= 16) return `hsl(${(t * 120) % 360},100%,65%)`;
    if (e >= 13) return '#ffd04a';
    if (e >= 10) return '#ff5b6e';
    if (e >= 7) return '#b47cff';
    if (e >= 4) return '#6fd3ff';
    return null;
  }

  function hexA(c, a) {
    if (c.startsWith('hsl')) return c.replace('hsl', 'hsla').replace(')', `,${a})`);
    const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`;
  }
  const easeOut = x => 1 - (1 - x) * (1 - x), easeIn = x => x * x, easeInOut = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  /* ---------- монстры ---------- */
  // m: {type, pal:{a,b,c,e}, flash, boss, t, atk(0..1)}
  const MON = {};
  const F = (m, c) => m.flash > 0 ? '#ffffff' : (m.tintA > 0 ? mix(c, m.tintC, m.tintA) : c);
  function monEyes(ctx, m, x1, x2, y, s = 1, angry = false) {
    for (const ex of [x1, x2]) {
      ctx.fillStyle = F(m, '#2a1238'); ell(ctx, ex, y, 3.2 * s, 4.4 * s); ctx.fill();
      ctx.fillStyle = m.pal.e || '#ffffff'; ell(ctx, ex - 1 * s, y - 1.6 * s, 1.3 * s, 1.5 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, ex + .9 * s, y + 1.6 * s, .7 * s, .6 * s); ctx.fill();
    }
    if (angry) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x1 - 4 * s, y - 7 * s); ctx.lineTo(x1 + 3 * s, y - 5 * s); ctx.moveTo(x2 + 4 * s, y - 7 * s); ctx.lineTo(x2 - 3 * s, y - 5 * s); ctx.stroke();
    }
  }
  function blush(ctx, x1, x2, y) { ctx.fillStyle = 'rgba(255,110,150,.4)'; ell(ctx, x1, y, 3, 1.6); ctx.fill(); ell(ctx, x2, y, 3, 1.6); ctx.fill(); }

  MON.slime = { top: 34, draw(ctx, m) {
    const sq = 1 + .07 * Math.sin(m.t * 6) + (m.atk > 0 ? .15 * Math.sin(m.atk * Math.PI) : 0);
    const w = 22 * sq, h = 24 / sq;
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w * 1.05, -h * 1.35, w * 1.05, -h * 1.35, w, 0); ctx.quadraticCurveTo(0, 3, -w, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, F(m, m.pal.b)); g.addColorStop(1, F(m, m.pal.a));
    fillStroke(ctx, g, dark(m.pal.a, .55), 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, -w * .45, -h * .78, 5, 3, -.5); ctx.fill(); ell(ctx, -w * .2, -h * .92, 1.6, 1.4); ctx.fill();
    monEyes(ctx, m, -9, 2, -h * .5, 1, m.boss);
    blush(ctx, -14, 7, -h * .32);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6, -h * .3); ctx.quadraticCurveTo(-4.5, -h * .22, -3, -h * .3); ctx.quadraticCurveTo(-1.5, -h * .22, 0, -h * .3); ctx.stroke();
  } };

  MON.mushroom = { top: 46, draw(ctx, m) {
    const hop = Math.abs(Math.sin(m.t * 5)) * 3 + (m.atk > 0 ? Math.sin(m.atk * Math.PI) * 6 : 0);
    ctx.translate(0, -hop);
    ctx.fillStyle = F(m, dark(m.pal.c, .3)); ell(ctx, -6, -1, 4, 2.5); ctx.fill(); ell(ctx, 6, -1, 4, 2.5); ctx.fill();
    rr(ctx, -11, -26, 22, 25, 9); fillStroke(ctx, F(m, m.pal.c), OUT, 2);
    monEyes(ctx, m, -6, 3, -13, .85, m.boss);
    blush(ctx, -9, 6, -8);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(-1.5, -8, 2, .2, Math.PI - .2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24, -24); ctx.bezierCurveTo(-24, -50, 24, -50, 24, -24); ctx.quadraticCurveTo(0, -18, -24, -24); ctx.closePath();
    fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    ctx.fillStyle = F(m, '#fff6ee');
    for (const [sx, sy, r] of [[-12, -34, 4], [3, -40, 3.4], [13, -30, 3.6], [-3, -28, 2.4]]) { ell(ctx, sx, sy, r, r * .85); ctx.fill(); }
  } };

  MON.bat = { top: 66, fly: true, draw(ctx, m) {
    const y = -44 + Math.sin(m.t * 4) * 5, fl = Math.sin(m.t * 18);
    ctx.fillStyle = 'rgba(15,6,30,.2)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 14 : 0, y);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 8, -2);
      ctx.quadraticCurveTo(s * 22, -16 - fl * 8, s * 30, -4 - fl * 10);
      ctx.quadraticCurveTo(s * 24, -2, s * 22, 4 - fl * 4); ctx.quadraticCurveTo(s * 17, 0, s * 14, 6);
      ctx.quadraticCurveTo(s * 10, 2, s * 8, 4); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 2);
    }
    ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-11, -20); ctx.lineTo(-3, -12); ctx.moveTo(9, -8); ctx.lineTo(11, -20); ctx.lineTo(3, -12);
    ctx.fillStyle = F(m, m.pal.a); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke();
    ell(ctx, 0, 0, 13, 12); fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    monEyes(ctx, m, -6, 3, -2, .8, true);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-1.5, 9); ctx.lineTo(0, 5); ctx.fill();
  } };

  MON.goblin = { top: 52, draw(ctx, m) {
    const step = Math.sin(m.t * 8) * 2, sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0;
    ctx.fillStyle = F(m, dark(m.pal.a, .2)); ell(ctx, -5 + step, -2, 4, 3); ctx.fill(); ell(ctx, 5 - step, -2, 4, 3); ctx.fill();
    rr(ctx, -10, -20, 20, 18, 6); fillStroke(ctx, F(m, m.pal.c), OUT, 2);
    // дубина
    ctx.save(); ctx.translate(-10, -14); ctx.rotate(-.6 - sw * 1.6);
    rr(ctx, -3, -26, 7, 26, 3); fillStroke(ctx, F(m, '#9a6a3c'), OUT, 1.8);
    ell(ctx, .5, -27, 6, 6); fillStroke(ctx, F(m, '#7c5230'), OUT, 1.8);
    ctx.restore();
    // голова и уши
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -36); ctx.lineTo(s * 28, -44); ctx.lineTo(s * 12, -28); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 2); }
    ell(ctx, 0, -34, 15, 14); fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    monEyes(ctx, m, -6, 4, -36, .85, true);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-6, -27); ctx.lineTo(4, -27); ctx.lineTo(2, -24); ctx.lineTo(-4, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  } };

  MON.golem = { top: 64, draw(ctx, m) {
    const sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0, br = Math.sin(m.t * 2) * 1;
    ctx.fillStyle = F(m, m.pal.b);
    rr(ctx, -16, -12, 12, 12, 3); fillStroke(ctx, F(m, m.pal.b), OUT, 2); rr(ctx, 4, -12, 12, 12, 3); fillStroke(ctx, F(m, m.pal.b), OUT, 2);
    rr(ctx, -21, -46 + br, 42, 36, 10); fillStroke(ctx, F(m, m.pal.a), OUT, 2.4);
    ctx.strokeStyle = dark(m.pal.a, .4); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-12, -40 + br); ctx.lineTo(-6, -32 + br); ctx.lineTo(-10, -24 + br); ctx.moveTo(10, -18 + br); ctx.lineTo(15, -26 + br); ctx.stroke();
    ctx.fillStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(-2, -30 + br); ctx.lineTo(3, -24 + br); ctx.lineTo(-2, -18 + br); ctx.lineTo(-7, -24 + br); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, -13, -64 + br, 26, 20, 7); fillStroke(ctx, F(m, light(m.pal.a, .1)), OUT, 2.2);
    ctx.fillStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 6;
    rr(ctx, -9, -57 + br, 6, 3.4, 1.5); ctx.fill(); rr(ctx, 1, -57 + br, 6, 3.4, 1.5); ctx.fill(); ctx.shadowBlur = 0;
    if (m.pal.c) { ctx.fillStyle = F(m, m.pal.c); ell(ctx, -6, -64 + br, 8, 3); ctx.fill(); ell(ctx, 14, -44 + br, 5, 2.4); ctx.fill(); }
    ctx.save(); ctx.translate(-20, -40 + br); ctx.rotate(.3 + sw * -1.2);
    rr(ctx, -7, 0, 13, 24, 6); fillStroke(ctx, F(m, m.pal.b), OUT, 2); ctx.restore();
  } };

  MON.ghost = { top: 58, fly: true, draw(ctx, m) {
    const y = -30 + Math.sin(m.t * 3) * 4;
    ctx.fillStyle = 'rgba(15,6,30,.16)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0, y);
    ctx.globalAlpha *= .92;
    ctx.beginPath(); ctx.moveTo(-17, 10);
    ctx.bezierCurveTo(-20, -34, 20, -34, 17, 10);
    for (let i = 0; i <= 4; i++) { const px = 17 - i * 8.5, py = 10 + (i % 2 ? -5 : 2) + Math.sin(m.t * 6 + i) * 2; ctx.lineTo(px, py); }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -24, 0, 12); g.addColorStop(0, F(m, m.pal.b)); g.addColorStop(1, F(m, m.pal.a));
    fillStroke(ctx, g, dark(m.pal.a, .6), 2);
    monEyes(ctx, m, -7, 3, -8, .9, m.boss);
    ctx.fillStyle = '#3a1a48'; ell(ctx, -2, 1, 3, 3.6); ctx.fill();
    ctx.fillStyle = '#ff8fb1'; ell(ctx, -2, 3.4, 1.8, 1.3); ctx.fill();
    blush(ctx, -11, 7, -2);
  } };

  MON.imp = { top: 52, draw(ctx, m) {
    const hop = Math.abs(Math.sin(m.t * 6)) * 3 + (m.atk > 0 ? Math.sin(m.atk * Math.PI) * 6 : 0);
    ctx.translate(0, -hop);
    const fl = Math.sin(m.t * 14);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 8, -30); ctx.quadraticCurveTo(s * 24, -46 - fl * 4, s * 26, -26); ctx.quadraticCurveTo(s * 18, -30, s * 10, -22); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 1.8);
    }
    ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(26, -8, 22, -24); ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = F(m, m.pal.a); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -24); ctx.lineTo(18, -30); ctx.lineTo(27, -28); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 1.4);
    ctx.fillStyle = F(m, dark(m.pal.a, .3)); ell(ctx, -5, -2, 3.5, 3); ctx.fill(); ell(ctx, 5, -2, 3.5, 3); ctx.fill();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -38); ctx.quadraticCurveTo(s * 14, -50, s * 10, -54); ctx.quadraticCurveTo(s * 9, -46, s * 2, -40); ctx.closePath(); fillStroke(ctx, F(m, m.pal.c), OUT, 1.6); }
    ell(ctx, 0, -22, 15, 16); fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    for (const ex of [-6, 4]) {
      ctx.fillStyle = '#ffe55c'; ell(ctx, ex, -25, 3.6, 4.2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#2a1238'; ell(ctx, ex, -25, 1, 3.4); ctx.fill();
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -15); ctx.quadraticCurveTo(-1, -10, 6, -15); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(-4, -11); ctx.lineTo(-3, -13.5); ctx.moveTo(3, -14); ctx.lineTo(4, -11); ctx.lineTo(5, -14); ctx.fill();
  } };

  MON.skull = { top: 64, draw(ctx, m) {
    const step = Math.sin(m.t * 7) * 2, sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0;
    ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(-5 + step, 0); ctx.moveTo(4, -16); ctx.lineTo(5 - step, 0); ctx.stroke();
    ctx.strokeStyle = F(m, '#ece6dc'); ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, -11, -34, 22, 20, 5); fillStroke(ctx, F(m, m.pal.b), OUT, 2.2);
    ctx.strokeStyle = m.pal.e; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-7, -28); ctx.lineTo(7, -28); ctx.moveTo(-7, -23); ctx.lineTo(7, -23); ctx.stroke();
    ctx.save(); ctx.translate(-12, -26); ctx.rotate(-1.1 - sw * 1.3);
    drawKatanaSimple(ctx, m.flash > 0 ? '#ffffff' : '#9aa0b8');
    ctx.restore();
    ell(ctx, 0, -48, 15, 14); fillStroke(ctx, F(m, '#f4efe6'), OUT, 2.2);
    rr(ctx, -8, -38, 16, 7, 2); fillStroke(ctx, F(m, '#f4efe6'), OUT, 1.8);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -4; i <= 4; i += 4) { ctx.moveTo(i, -38); ctx.lineTo(i, -31); } ctx.stroke();
    ctx.fillStyle = '#1a0d24'; ell(ctx, -6, -48, 4.4, 5); ctx.fill(); ell(ctx, 5, -48, 4.4, 5); ctx.fill();
    ctx.fillStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 8; ell(ctx, -6, -48, 1.8, 2.2); ctx.fill(); ell(ctx, 5, -48, 1.8, 2.2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(-14, -54); ctx.quadraticCurveTo(0, -70, 14, -54); ctx.lineTo(10, -58); ctx.quadraticCurveTo(0, -64, -10, -58); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 1.8);
  } };
  function drawKatanaSimple(ctx, c) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.stroke();
  }

  MON.wisp = { top: 58, fly: true, draw(ctx, m) {
    const y = -26 + Math.sin(m.t * 3.4) * 4;
    ctx.fillStyle = 'rgba(15,6,30,.16)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0, y);
    for (let i = 0; i < 3; i++) {
      const a = Math.sin(m.t * 5 + i * 2) * .3;
      ctx.save(); ctx.rotate(.5 + i * .35 + a);
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(26, 6, 30, -4); ctx.quadraticCurveTo(22, 0, 4, -4); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 1.6); ctx.restore();
    }
    const fl = Math.sin(m.t * 10) * 2;
    ctx.beginPath(); ctx.moveTo(0, 14);
    ctx.bezierCurveTo(-18, 14, -18, -8, -6, -18 - fl); ctx.quadraticCurveTo(-2, -10, 0, -26 + fl);
    ctx.quadraticCurveTo(3, -10, 7, -18 + fl); ctx.bezierCurveTo(18, -8, 18, 14, 0, 14); ctx.closePath();
    const g = ctx.createRadialGradient(0, 4, 2, 0, 0, 20); g.addColorStop(0, F(m, '#fff7d6')); g.addColorStop(.5, F(m, m.pal.b)); g.addColorStop(1, F(m, m.pal.a));
    ctx.shadowColor = m.pal.b; ctx.shadowBlur = 12; fillStroke(ctx, g, dark(m.pal.a, .4), 2); ctx.shadowBlur = 0;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -12); ctx.lineTo(s * 12, -24); ctx.lineTo(s * 13, -10); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 1.4); }
    monEyes(ctx, m, -5, 4, 0, .8, m.boss);
    blush(ctx, -9, 8, 5);
  } };

  MON.crystal = { top: 62, fly: true, draw(ctx, m) {
    const y = -32 + Math.sin(m.t * 2.6) * 4;
    ctx.fillStyle = 'rgba(15,6,30,.16)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0, y);
    for (let i = 0; i < 3; i++) {
      const a = m.t * 1.6 + i * TAU / 3, ox = Math.cos(a) * 22, oy = Math.sin(a) * 7;
      ctx.beginPath(); ctx.moveTo(ox, oy - 5); ctx.lineTo(ox + 3, oy); ctx.lineTo(ox, oy + 5); ctx.lineTo(ox - 3, oy); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 1.2);
    }
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(15, -6); ctx.lineTo(9, 16); ctx.lineTo(-9, 16); ctx.lineTo(-15, -6); ctx.closePath();
    const g = ctx.createLinearGradient(-15, -26, 15, 16); g.addColorStop(0, F(m, light(m.pal.b, .4))); g.addColorStop(1, F(m, m.pal.a));
    fillStroke(ctx, g, dark(m.pal.a, .55), 2.2);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(-4, -4); ctx.lineTo(-9, 16); ctx.moveTo(-4, -4); ctx.lineTo(15, -6); ctx.stroke();
    monEyes(ctx, m, -5, 4, 0, .8, m.boss);
    blush(ctx, -9, 8, 5);
  } };

  function drawCrown(ctx, top) {
    ctx.save(); ctx.translate(0, -top - 4);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-11, -10); ctx.lineTo(-5, -5); ctx.lineTo(0, -13); ctx.lineTo(5, -5); ctx.lineTo(11, -10); ctx.lineTo(10, 0); ctx.closePath();
    fillStroke(ctx, '#ffd760', OUT, 1.6);
    ctx.fillStyle = '#ff4f73'; ell(ctx, 0, -4, 1.8, 1.8); ctx.fill();
    ctx.restore();
  }

  /* ---------- особый облик боссов ---------- */
  const flyY = (m, base, f, a) => base + Math.sin(m.t * f) * a;
  const atkX = m => m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0;
  const BOSS_DECOR = {
    slime: {
      front(ctx, m) {
        const sq = 1 + .07 * Math.sin(m.t * 6), h = 24 / sq;
        // жемчужное ожерелье королевы
        for (let i = 0; i < 7; i++) {
          const a = -2.5 + i * .37, px = Math.cos(a) * 15, py = -h * .18 + Math.sin(a) * -4 + 6;
          ctx.fillStyle = F(m, '#fff4fb'); ell(ctx, px, py, 2.1, 2.1); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.stroke();
        }
        // капли-слуги
        for (let i = 0; i < 3; i++) {
          const a = m.t * 1.6 + i * TAU / 3, px = Math.cos(a) * 30, py = -14 + Math.sin(a * 2) * 4 - Math.abs(Math.sin(m.t * 5 + i)) * 6;
          ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.quadraticCurveTo(px + 5, py, px, py + 3); ctx.quadraticCurveTo(px - 5, py, px, py - 6);
          fillStroke(ctx, F(m, m.pal.b), dark(m.pal.a, .5), 1.2);
        }
      },
    },
    bat: {
      back(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -44, 4, 5));
        const w = Math.sin(m.t * 3) * 3;
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(-16, 18, -12 + w, 30); ctx.lineTo(0, 24); ctx.lineTo(12 - w, 30); ctx.quadraticCurveTo(16, 18, 10, -4); ctx.closePath();
        fillStroke(ctx, F(m, '#5a1428'), OUT, 1.8);
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-11, 16, -8 + w, 24); ctx.lineTo(0, 20); ctx.lineTo(8 - w, 24); ctx.quadraticCurveTo(11, 16, 8, 0); ctx.closePath();
        ctx.fillStyle = F(m, '#d9434f'); ctx.fill();
      },
      front(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -44, 4, 5));
        ctx.beginPath(); ctx.moveTo(-12, 6); ctx.lineTo(-16, 14); ctx.lineTo(-6, 10); ctx.lineTo(0, 14); ctx.lineTo(6, 10); ctx.lineTo(16, 14); ctx.lineTo(12, 6); ctx.closePath();
        fillStroke(ctx, F(m, '#f4f0ff'), OUT, 1.4);
        ctx.fillStyle = F(m, '#d9434f'); ell(ctx, 0, 9, 2.4, 2.4); ctx.fill();
      },
    },
    golem: {
      back(ctx, m) {
        for (let i = 0; i < 4; i++) {
          const a = m.t * .9 + i * TAU / 4, px = Math.cos(a) * 34, py = -36 + Math.sin(a) * 10;
          ctx.save(); ctx.translate(px, py); ctx.rotate(a);
          rr(ctx, -5, -4, 10, 8, 2); fillStroke(ctx, F(m, m.pal.b), OUT, 1.4); ctx.restore();
        }
      },
      front(ctx, m) {
        const br = Math.sin(m.t * 2), pulse = .55 + .45 * Math.sin(m.t * 4);
        ctx.save(); ctx.globalAlpha *= pulse; ctx.strokeStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 8; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(-9, -26 + br, 5, 0, TAU); ctx.moveTo(12, -40 + br); ctx.lineTo(16, -34 + br); ctx.lineTo(12, -28 + br); ctx.lineTo(16, -22 + br); ctx.stroke();
        ctx.restore();
        for (const sx of [-14, 14]) {
          ctx.beginPath(); ctx.moveTo(sx - 4, -46 + br); ctx.lineTo(sx, -58 + br); ctx.lineTo(sx + 4, -46 + br); ctx.closePath();
          fillStroke(ctx, F(m, '#9fe3ff'), OUT, 1.4);
        }
      },
    },
    crystal: {
      back(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -32, 2.6, 4));
        for (let i = 0; i < 6; i++) {
          const a = -m.t * 1.1 + i * TAU / 6, px = Math.cos(a) * 34, py = Math.sin(a) * 12;
          ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
          ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(4, 0); ctx.lineTo(0, 9); ctx.lineTo(-4, 0); ctx.closePath();
          fillStroke(ctx, F(m, m.pal.b), OUT, 1.2); ctx.restore();
        }
      },
      front(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -32, 2.6, 4));
        const sp = [[-10, -22, -14, -36], [-4, -26, -5, -42], [3, -26, 4, -44], [10, -22, 14, -36]];
        for (const [x1, y1, x2, y2] of sp) {
          ctx.beginPath(); ctx.moveTo(x1 - 3, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1 + 3, y1); ctx.closePath();
          fillStroke(ctx, F(m, '#e6f8ff'), OUT, 1.3);
        }
      },
    },
    wisp: {
      back(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -26, 3.4, 4));
        for (let i = 0; i < 9; i++) {
          const a = -2.1 + i * .3 + Math.sin(m.t * 3 + i * .7) * .12;
          ctx.save(); ctx.rotate(a);
          ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(10, -16, 4, -40); ctx.quadraticCurveTo(-4, -18, -6, 2); ctx.closePath();
          fillStroke(ctx, F(m, i % 2 ? m.pal.a : '#ff8a4c'), OUT, 1.5);
          ctx.fillStyle = F(m, '#fff4d6'); ell(ctx, 4, -36, 3, 5, .2); ctx.fill();
          ctx.restore();
        }
      },
      front(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -26, 3.4, 4));
        // кицунэби: блуждающие огни
        for (let i = 0; i < 3; i++) {
          const a = m.t * 2 + i * TAU / 3, px = Math.cos(a) * 30, py = Math.sin(a) * 14 - 6;
          const g = ctx.createRadialGradient(px, py, 1, px, py, 7);
          g.addColorStop(0, '#fffbe0'); g.addColorStop(.5, '#7fd8ff'); g.addColorStop(1, 'rgba(127,216,255,0)');
          ctx.fillStyle = g; ell(ctx, px, py, 7, 7); ctx.fill();
        }
      },
    },
    skull: {
      back(ctx, m) {
        const w = Math.sin(m.t * 3) * 3;
        ctx.beginPath(); ctx.moveTo(-12, -34);
        ctx.lineTo(-20 + w, -2); ctx.lineTo(-14 + w, -6); ctx.lineTo(-10 + w, 0); ctx.lineTo(-4 + w, -5); ctx.lineTo(2 + w, 0); ctx.lineTo(8, -5); ctx.lineTo(12, -34); ctx.closePath();
        fillStroke(ctx, F(m, '#2a1838'), OUT, 1.6);
        ctx.strokeStyle = F(m, '#ff62d4'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, -33); ctx.lineTo(12, -33); ctx.stroke();
      },
      front(ctx, m) {
        // рога и двуручник
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(s * 8, -58); ctx.quadraticCurveTo(s * 22, -64, s * 20, -80); ctx.quadraticCurveTo(s * 16, -66, s * 4, -62); ctx.closePath();
          fillStroke(ctx, F(m, '#3a2452'), OUT, 1.6);
        }
        const sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0;
        ctx.save(); ctx.translate(-16, -24); ctx.rotate(-1.25 - sw * 1.5);
        ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-4, -48); ctx.lineTo(0, -56); ctx.lineTo(4, -48); ctx.lineTo(3, 0); ctx.closePath();
        fillStroke(ctx, F(m, '#3a2452'), OUT, 1.6);
        ctx.strokeStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 6; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -48); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.strokeStyle = F(m, '#8a6ab0'); ctx.lineWidth = 2.4; ctx.stroke();
        ctx.restore();
      },
    },
  };
  for (const type in BOSS_DECOR) {
    const base = MON[type].draw, d = BOSS_DECOR[type];
    MON[type].draw = (ctx, m) => {
      if (!m.boss) return base(ctx, m);
      if (d.back) { ctx.save(); d.back(ctx, m); ctx.restore(); }
      ctx.save(); base(ctx, m); ctx.restore();
      if (d.front) { ctx.save(); d.front(ctx, m); ctx.restore(); }
    };
  }

  function drawMonster(ctx, x, y, k, m) {
    const def = MON[m.type];
    ctx.save(); ctx.translate(x, y + (m.oy || 0) * k);
    const sc = k * (m.scale || 1);
    ctx.scale(sc * (1 + (m.sq || 0)), sc * (1 - (m.sq || 0)));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (m.dieT > 0) {
      if (m.boss) { ctx.globalAlpha = (Math.floor(m.dieT * 24) % 2 ? .45 : 1) * Math.max(0, 1 - Math.max(0, m.dieT - .8) * 3); ctx.translate(Math.sin(m.dieT * 70) * 2, 0); }
      else { ctx.globalAlpha = Math.max(0, 1 - m.dieT * 2.4); ctx.translate(0, -m.dieT * 20); ctx.rotate(m.dieT * .6); }
    }
    const cy = -def.top * .5;
    if (m.boss) {
      const rage = m.enr ? 1 : 0;
      const g = ctx.createRadialGradient(0, cy, 4, 0, cy, def.top * 1.1);
      const c = rage ? '255,40,60' : '255,60,110';
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.7, `rgba(${c},${.18 + .1 * rage + .08 * Math.sin(m.t * (4 + rage * 6))})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ell(ctx, 0, cy, def.top * 1.1, def.top * 1.1); ctx.fill();
    }
    if (m.wind > 0) {
      const p = m.wind, r = def.top * (.7 + p * .5);
      const g = ctx.createRadialGradient(0, cy, 2, 0, cy, r);
      g.addColorStop(0, `rgba(255,240,180,${.5 * p})`); g.addColorStop(1, 'rgba(255,120,80,0)');
      ctx.fillStyle = g; ell(ctx, 0, cy, r, r); ctx.fill();
    }
    if (!def.fly) { ctx.fillStyle = 'rgba(15,6,30,.26)'; ell(ctx, 0, 0, 20, 4.5); ctx.fill(); }
    ctx.save();
    if (m.atk > 0 && !def.fly) ctx.translate(-Math.sin(m.atk * Math.PI) * 8, 0);
    if (m.boss && !m.dieT) { const br = 1 + Math.sin(m.t * 2.2) * .025; ctx.translate(0, cy); ctx.scale(1 / br, br); ctx.translate(0, -cy); }
    def.draw(ctx, m);
    ctx.restore();
    if (m.boss && m.type === 'slime') drawCrown(ctx, 22 / (1 + .07 * Math.sin(m.t * 6)) + (m.hopT > 0 ? 0 : 0));
    if (m.boss && m.type === 'bat') drawCrown(ctx, 54 - Math.sin(m.t * 4) * 5);
    if (m.wind > 0) {
      // знак угрозы над боссом
      const p = Math.min(1, m.wind * 3), yy = -def.top - 22 - Math.sin(m.t * 18) * 1.5;
      ctx.save(); ctx.translate(0, yy); ctx.scale(p / Math.max(.5, m.scale * .55), p / Math.max(.5, m.scale * .55));
      ell(ctx, 0, 0, 9, 10); fillStroke(ctx, '#ff3d5c', '#ffffff', 2);
      ctx.fillStyle = '#ffffff'; rr(ctx, -1.6, -6.5, 3.2, 8, 1.5); ctx.fill(); ell(ctx, 0, 5, 1.8, 1.8); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  const monTop = type => MON[type].top;

  /* ---------- фоны зон ---------- */
  // z: конфиг зоны из игры; scroll: пройденное расстояние; t: время
  const skyCache = new Map();
  function drawBackground(ctx, W, H, gy, z, scroll, t) {
    const key = z.id + W + 'x' + H;
    let sky = skyCache.get(key);
    if (!sky) {
      sky = ctx.createLinearGradient(0, 0, 0, gy);
      z.sky.forEach((c, i) => sky.addColorStop(i / (z.sky.length - 1), c));
      skyCache.clear(); skyCache.set(key, sky);
    }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy + 2);
    const k = H / 300;
    // звёзды
    if (z.stars) {
      for (let i = 0; i < 46; i++) {
        const sx = h01(i * 7 + 1) * W, sy = h01(i * 13 + 5) * gy * .6;
        const tw = .4 + .6 * Math.abs(Math.sin(t * (1 + h01(i)) + i));
        ctx.fillStyle = `rgba(255,255,255,${.7 * tw})`; ctx.fillRect(sx, sy, 1.6 * k, 1.6 * k);
      }
    }
    // светило
    if (z.orb) {
      const ox = W * z.orb.x, oy = gy * z.orb.y, r = z.orb.r * k;
      const g = ctx.createRadialGradient(ox, oy, r * .4, ox, oy, r * 3);
      g.addColorStop(0, hexA(z.orb.glow, .55)); g.addColorStop(1, hexA(z.orb.glow, 0));
      ctx.fillStyle = g; ctx.fillRect(ox - r * 3, oy - r * 3, r * 6, r * 6);
      ctx.fillStyle = z.orb.c; ell(ctx, ox, oy, r, r); ctx.fill();
      if (z.orb.moon) { ctx.fillStyle = hexA(z.sky[0], .9); ell(ctx, ox + r * .45, oy - r * .2, r * .85, r * .85); ctx.fill(); }
    }
    // облака
    if (z.clouds) {
      ctx.fillStyle = z.clouds;
      for (let i = 0; i < 5; i++) {
        const cx = ((h01(i * 31) * W * 1.6 - (scroll * .05 + t * 6) + W * 2) % (W * 1.6)) - W * .2, cy = gy * (.12 + .3 * h01(i * 17));
        const s = (.7 + .6 * h01(i * 3)) * k;
        ell(ctx, cx, cy, 30 * s, 9 * s); ctx.fill(); ell(ctx, cx + 18 * s, cy - 6 * s, 18 * s, 10 * s); ctx.fill(); ell(ctx, cx - 16 * s, cy - 3 * s, 14 * s, 8 * s); ctx.fill();
      }
    }
    // горы: два слоя
    z.far.forEach((L, li) => {
      ctx.fillStyle = L.c;
      ctx.beginPath(); ctx.moveTo(0, gy);
      const off = scroll * L.p;
      for (let x = 0; x <= W + 8; x += 8) {
        const X = (x + off) / k * L.f;
        const yy = gy - (L.base + L.amp * (.55 * Math.sin(X + li * 2) + .3 * Math.sin(X * 2.3 + 1.7) + .15 * Math.sin(X * 5.7 + .4))) * k;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W, gy); ctx.closePath(); ctx.fill();
      if (L.snow) {
        ctx.save(); ctx.clip();
        ctx.fillStyle = L.snow; ctx.fillRect(0, gy - (L.base + L.amp * .7) * k, W, L.amp * .4 * k);
        ctx.restore();
      }
    });
    // средний план
    const sp = 140 * k, off = scroll * .45;
    const i0 = Math.floor(off / sp) - 1, i1 = Math.floor((off + W) / sp) + 1;
    for (let i = i0; i <= i1; i++) {
      if (h01(i * 9 + z.seed) < .25) continue;
      const px = i * sp - off + h01(i * 3 + z.seed) * sp * .5;
      const s = (.75 + .45 * h01(i * 5 + z.seed)) * k;
      PROPS[z.prop](ctx, px, gy - 2 * k, s, z, i, t);
    }
    // земля
    ctx.fillStyle = z.ground[0]; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = z.ground[1]; ctx.fillRect(0, gy, W, 5 * k);
    ctx.fillStyle = z.ground[2];
    const gs = 46 * k, go = scroll % gs;
    for (let x = -go; x < W + gs; x += gs) {
      const ii = Math.round((x + scroll) / gs);
      rr(ctx, x, gy + (14 + 10 * h01(ii)) * k, (16 + 12 * h01(ii * 7)) * k, 4 * k, 2 * k); ctx.fill();
    }
    // травинки на кромке
    ctx.strokeStyle = z.ground[3]; ctx.lineWidth = 2 * k; ctx.lineCap = 'round';
    const ts = 18 * k, to = scroll % ts;
    ctx.beginPath();
    for (let x = -to; x < W + ts; x += ts) {
      const ii = Math.round((x + scroll) / ts), hh = (3 + 4 * h01(ii * 11)) * k;
      ctx.moveTo(x, gy + 3 * k); ctx.lineTo(x - 2 * k, gy - hh); ctx.moveTo(x + 3 * k, gy + 3 * k); ctx.lineTo(x + 4 * k, gy - hh * .7);
    }
    ctx.stroke();
  }

  const PROPS = {
    sakura(ctx, x, y, s, z, i, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#7a4a52';
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-2, -30, -10, -60); ctx.lineTo(-4, -62); ctx.quadraticCurveTo(4, -40, 6, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3, -40); ctx.quadraticCurveTo(12, -50, 22, -58); ctx.lineTo(20, -54); ctx.quadraticCurveTo(10, -46, -2, -36); ctx.fill();
      const blobs = [[-12, -66, 22], [10, -70, 20], [24, -58, 14], [-26, -56, 14], [0, -84, 18], [-4, -56, 14]];
      ctx.fillStyle = '#f7a6c8'; for (const [bx, by, r] of blobs) { ell(ctx, bx, by, r, r * .82); ctx.fill(); }
      ctx.fillStyle = '#ffd0e4'; for (const [bx, by, r] of blobs) { ell(ctx, bx - r * .2, by - r * .25, r * .6, r * .45); ctx.fill(); }
      ctx.restore();
    },
    pine(ctx, x, y, s, z, i) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = z.propC[1]; ctx.fillRect(-3, -14, 6, 14);
      for (let j = 0; j < 4; j++) {
        const w = 26 - j * 5, yy = -12 - j * 18;
        ctx.fillStyle = z.propC[0]; ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(0, yy - 30); ctx.lineTo(w, yy); ctx.closePath(); ctx.fill();
        if (z.propC[2]) { ctx.fillStyle = z.propC[2]; ctx.beginPath(); ctx.moveTo(-w * .55, yy - 13); ctx.lineTo(0, yy - 30); ctx.lineTo(w * .55, yy - 13); ctx.quadraticCurveTo(0, yy - 18, -w * .55, yy - 13); ctx.fill(); }
      }
      ctx.restore();
    },
    ruin(ctx, x, y, s, z, i) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const hgt = 40 + h01(i * 13) * 50;
      ctx.fillStyle = z.propC[0]; ctx.fillRect(-9, -hgt, 18, hgt);
      ctx.fillStyle = z.propC[1]; ctx.fillRect(-9, -hgt, 5, hgt);
      ctx.fillStyle = z.propC[2]; ctx.fillRect(-13, -hgt - 6, 26, 7); ctx.fillRect(-13, -6, 26, 6);
      if (h01(i * 3) > .5) { ctx.save(); ctx.translate(18, -6); ctx.rotate(-.2); ctx.fillStyle = z.propC[0]; ctx.fillRect(0, -10, 30, 10); ctx.restore(); }
      ctx.restore();
    },
    spire(ctx, x, y, s, z, i, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const hgt = 50 + h01(i * 13) * 60;
      ctx.fillStyle = z.propC[0];
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, -hgt); ctx.lineTo(4, -hgt * .8); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = z.propC[1]; ctx.lineWidth = 2; ctx.globalAlpha = .6 + .4 * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(1, -hgt * .3); ctx.lineTo(-3, -hgt * .55); ctx.stroke();
      ctx.restore();
    },
    tower(ctx, x, y, s, z, i, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const hgt = 70 + h01(i * 13) * 50;
      ctx.fillStyle = z.propC[0]; ctx.fillRect(-12, -hgt, 24, hgt);
      ctx.beginPath(); ctx.moveTo(-16, -hgt); ctx.lineTo(0, -hgt - 34); ctx.lineTo(16, -hgt); ctx.closePath(); ctx.fill();
      ctx.fillStyle = z.propC[1];
      for (let j = 0; j < 3; j++) { if (h01(i * 7 + j) > .35) { ctx.globalAlpha = .7 + .3 * Math.sin(t * 3 + j + i); rr(ctx, -3, -hgt + 14 + j * 22, 6, 9, 3); ctx.fill(); } }
      ctx.restore();
    },
  };

  /* ---------- иконки предметов ---------- */
  function iconCanvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
  const iconCache = new Map();
  function gem(ctx, x, y, r, c) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y - r * .2); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y - r * .2); ctx.closePath();
    fillStroke(ctx, c, OUT, 2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(x - r * .5, y - r * .3); ctx.lineTo(x, y - r * .8); ctx.lineTo(x + r * .1, y - r * .25); ctx.closePath(); ctx.fill();
  }

  // kind: 'weapon' | 'armor'; blessed: bool
  function scrollIcon(kind, g, blessed, size = 64) {
    const key = 'scr' + kind + g + blessed + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64); ctx.lineJoin = 'round';
    if (blessed) {
      const gr = ctx.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,140,.8)'); gr.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
    }
    ctx.save(); ctx.translate(32, 32); ctx.rotate(-.5);
    rr(ctx, -18, -14, 36, 28, 3); fillStroke(ctx, '#f6ecd2', OUT, 2.2);
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.2;
    for (let i = -6; i <= 6; i += 6) { ctx.beginPath(); ctx.moveTo(-12, i); ctx.lineTo(12, i); ctx.stroke(); }
    for (const sx of [-20, 20]) { rr(ctx, sx - 4, -17, 8, 34, 4); fillStroke(ctx, '#e6d3a6', OUT, 2); }
    const rib = kind === 'weapon' ? '#e0485c' : '#4f8fe8';
    ctx.fillStyle = rib; ctx.fillRect(-3, -14, 6, 28);
    ell(ctx, 0, 0, 8, 8); fillStroke(ctx, blessed ? '#ffd760' : GRADE_COL[g], OUT, 2);
    ctx.fillStyle = OUT; ctx.font = '900 9px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['', 'D', 'C', 'B', 'A', 'S', 'R'][g] || '', 0, .5);
    ctx.restore();
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  function miscIcon(type, size = 48) {
    const key = 'misc' + type + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const P = MISC[type]; if (P) P(ctx);
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }
  const MISC = {
    gold(ctx) {
      ell(ctx, 32, 32, 24, 24); fillStroke(ctx, '#ffc93d', OUT, 3);
      ctx.fillStyle = '#ffe58f'; ell(ctx, 26, 25, 12, 9, -.6); ctx.fill();
      rr(ctx, 26, 26, 12, 12, 2); fillStroke(ctx, '#d99a1e', OUT, 2.4);
    },
    lantern(ctx) {
      ctx.fillStyle = '#3a1620'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.strokeStyle = '#ffd760'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(32, 5); ctx.lineTo(32, 14); ctx.stroke();
      rr(ctx, 22, 10, 20, 5, 2); fillStroke(ctx, '#ffd760', OUT, 1.8);
      rr(ctx, 17, 15, 30, 30, 11); fillStroke(ctx, '#ff7a3c', OUT, 2.4);
      rr(ctx, 23, 20, 18, 20, 7); fillStroke(ctx, '#ffd760', OUT, 1.6);
      rr(ctx, 28, 25, 8, 10, 3); ctx.fillStyle = '#fff6d0'; ctx.fill();
      rr(ctx, 22, 43, 20, 5, 2); fillStroke(ctx, '#ffd760', OUT, 1.8);
      ctx.fillStyle = '#ffd760'; ell(ctx, 32, 50, 3, 3); ctx.fill();
    },
    crystal(ctx) {
      const shard = (x, y, w, h, c) => { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h * .6); ctx.lineTo(x + w * .8, y); ctx.lineTo(x - w * .8, y); ctx.lineTo(x - w, y - h * .6); ctx.closePath(); fillStroke(ctx, c, OUT, 2.2); };
      shard(20, 54, 9, 28, '#8fd8ff'); shard(44, 54, 9, 26, '#b9a2ff'); shard(32, 56, 12, 44, '#d4f3ff');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(29, 18); ctx.lineTo(27, 44); ctx.stroke();
    },
    atk(ctx) { api.drawKatana(ctx, 14, 52, -.86, 1, 0, 0, .8); },
    hp(ctx) {
      ctx.beginPath(); ctx.moveTo(32, 54); ctx.bezierCurveTo(4, 36, 8, 10, 32, 22); ctx.bezierCurveTo(56, 10, 60, 36, 32, 54); ctx.closePath();
      fillStroke(ctx, '#ff5d78', OUT, 2.6); ctx.fillStyle = '#ffb3c1'; ell(ctx, 22, 26, 6, 4, -.6); ctx.fill();
    },
    regen(ctx) {
      ell(ctx, 32, 32, 22, 22); fillStroke(ctx, '#74e0a8', OUT, 2.6);
      ctx.fillStyle = '#fff'; rr(ctx, 28, 18, 8, 28, 2); ctx.fill(); rr(ctx, 18, 28, 28, 8, 2); ctx.fill();
    },
    crit(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 25; ctx.lineTo(32 + Math.cos(a) * r, 34 + Math.sin(a) * r); }
      ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 2.6);
    },
    critDmg(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 12 : 26; ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
      ctx.closePath(); fillStroke(ctx, '#ff8a4c', OUT, 2.4);
      ell(ctx, 32, 32, 7, 7); ctx.fillStyle = '#fff2c2'; ctx.fill();
    },
    aspd(ctx) {
      for (const [dx, c] of [[-8, '#7cc8ff'], [8, '#bfe6ff']]) {
        ctx.beginPath(); ctx.moveTo(18 + dx, 14); ctx.lineTo(36 + dx, 32); ctx.lineTo(18 + dx, 50); ctx.lineTo(26 + dx, 32); ctx.closePath(); fillStroke(ctx, c, OUT, 2.4);
      }
    },
    bag(ctx) {
      ctx.beginPath(); ctx.moveTo(14, 26); ctx.quadraticCurveTo(12, 56, 32, 56); ctx.quadraticCurveTo(52, 56, 50, 26); ctx.closePath();
      fillStroke(ctx, '#b07a48', OUT, 2.6);
      ctx.beginPath(); ctx.moveTo(18, 26); ctx.quadraticCurveTo(32, 14, 46, 26); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffd760'; ell(ctx, 32, 38, 5, 5); ctx.fill();
    },
    map(ctx) {
      ctx.beginPath(); ctx.moveTo(10, 16); ctx.lineTo(24, 10); ctx.lineTo(40, 16); ctx.lineTo(54, 10); ctx.lineTo(54, 48); ctx.lineTo(40, 54); ctx.lineTo(24, 48); ctx.lineTo(10, 54); ctx.closePath();
      fillStroke(ctx, '#f2e2b8', OUT, 2.4);
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 2.4; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(16, 44); ctx.quadraticCurveTo(30, 20, 46, 26); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#e0485c'; ell(ctx, 46, 26, 3.5, 3.5); ctx.fill();
    },
    shop(ctx) {
      ctx.beginPath(); ctx.moveTo(10, 24); ctx.lineTo(16, 12); ctx.lineTo(48, 12); ctx.lineTo(54, 24); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 2.4);
      rr(ctx, 14, 24, 36, 28, 2); fillStroke(ctx, '#f2e2b8', OUT, 2.4);
      rr(ctx, 26, 34, 12, 18, 2); fillStroke(ctx, '#8a5a3a', OUT, 2);
    },
    hero(ctx) {
      ell(ctx, 32, 26, 15, 15); fillStroke(ctx, '#ffe7da', OUT, 2.4);
      ctx.beginPath(); ctx.moveTo(15, 26); ctx.bezierCurveTo(12, 6, 52, 6, 49, 26); ctx.lineTo(42, 18); ctx.lineTo(36, 24); ctx.lineTo(30, 16); ctx.lineTo(24, 24); ctx.lineTo(20, 18); ctx.closePath();
      fillStroke(ctx, '#ff9ecd', OUT, 2.2);
      ctx.beginPath(); ctx.moveTo(14, 58); ctx.quadraticCurveTo(14, 42, 32, 42); ctx.quadraticCurveTo(50, 42, 50, 58); ctx.closePath(); fillStroke(ctx, '#8d6fd9', OUT, 2.4);
    },
    skills(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ell(ctx, 32 + Math.cos(a) * 12, 32 + Math.sin(a) * 12, 10, 10); fillStroke(ctx, '#ffb3d6', OUT, 2); }
      ell(ctx, 32, 32, 6, 6); fillStroke(ctx, '#ffd760', OUT, 2);
    },
    // навыки
    sk_petal(ctx) {
      ctx.fillStyle = '#3a1f5c'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.translate(32, 32); ctx.rotate(i * TAU / 5);
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(-11, -14, 0, -24); ctx.quadraticCurveTo(11, -14, 0, -2); ctx.closePath();
        fillStroke(ctx, i % 2 ? '#ffb3d6' : '#ff7eb6', OUT, 1.8); ctx.restore();
      }
      ell(ctx, 32, 32, 7, 7); fillStroke(ctx, '#ffd760', OUT, 1.8);
    },
    sk_moon(ctx) {
      ctx.fillStyle = '#1b2350'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.arc(30, 31, 18, -1.3, 1.7); ctx.arc(39, 28, 16, 1.9, -1.0, true); ctx.closePath();
      fillStroke(ctx, '#cfeaff', OUT, 2.2);
      ell(ctx, 46, 18, 2.4, 2.4); ctx.fillStyle = '#ffe55c'; ctx.fill();
      ell(ctx, 18, 46, 1.8, 1.8); ctx.fill();
    },
    sk_spirit(ctx) {
      ctx.fillStyle = '#4a1620'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(32, 54); ctx.bezierCurveTo(12, 50, 14, 30, 24, 20); ctx.quadraticCurveTo(26, 30, 30, 30); ctx.quadraticCurveTo(28, 18, 36, 8); ctx.quadraticCurveTo(38, 22, 44, 24); ctx.bezierCurveTo(54, 34, 50, 52, 32, 54); ctx.closePath();
      fillStroke(ctx, '#ff8a4c', OUT, 2); ctx.fillStyle = '#ffe28a'; ell(ctx, 32, 42, 7, 9); ctx.fill();
    },
    sk_thunder(ctx) {
      ctx.fillStyle = '#26214a'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(36, 8); ctx.lineTo(18, 36); ctx.lineTo(30, 36); ctx.lineTo(24, 58); ctx.lineTo(46, 26); ctx.lineTo(34, 26); ctx.closePath();
      fillStroke(ctx, '#ffe55c', OUT, 2);
    },
    sk_bloom(ctx) {
      ctx.fillStyle = '#183a2c'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(32, 32); ctx.rotate(i * TAU / 5); ell(ctx, 0, -11, 7, 11); fillStroke(ctx, '#ffd0e4', OUT, 1.6); ctx.restore(); }
      ell(ctx, 32, 32, 6, 6); fillStroke(ctx, '#74e0a8', OUT, 1.6);
    },
    sk_flame(ctx) {
      ctx.fillStyle = '#451a1a'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(32, 54); ctx.bezierCurveTo(14, 50, 16, 30, 26, 18); ctx.quadraticCurveTo(28, 30, 33, 28); ctx.quadraticCurveTo(31, 14, 40, 7); ctx.quadraticCurveTo(40, 22, 47, 26); ctx.bezierCurveTo(55, 36, 50, 52, 32, 54); ctx.closePath();
      fillStroke(ctx, '#ff7a3c', OUT, 2); ctx.fillStyle = '#ffd25c'; ell(ctx, 32, 41, 7, 10); ctx.fill();
    },
    sk_frost(ctx) {
      ctx.fillStyle = '#152a48'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(32 + (i - 1) * 13, 30 + (i === 1 ? -4 : 6)); ctx.rotate((i - 1) * .35); ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(8, 0); ctx.lineTo(0, 18); ctx.lineTo(-8, 0); ctx.closePath(); fillStroke(ctx, i === 1 ? '#eaf8ff' : '#8fd8ff', OUT, 1.6); ctx.restore(); }
    },
    sk_quake(ctx) {
      ctx.fillStyle = '#3b2a18'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, 48); ctx.lineTo(22, 34); ctx.lineTo(28, 40); ctx.lineTo(36, 24); ctx.lineTo(44, 34); ctx.lineTo(52, 46); ctx.closePath();
      fillStroke(ctx, '#c9a15c', OUT, 2); ctx.strokeStyle = '#ffd760'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(22, 34); ctx.lineTo(28, 44); ctx.lineTo(34, 38); ctx.stroke();
    },
    sk_storm(ctx) {
      ctx.fillStyle = '#173a38'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(32, 32); ctx.rotate(-.5 + i * .55); ctx.beginPath(); ctx.arc(0, 0, 20 - i * 4, -1.2, 1.3); ctx.strokeStyle = i === 1 ? '#eafff6' : '#8fe0c0'; ctx.lineWidth = 4 - i; ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, 46); ctx.lineTo(44, 18); ctx.stroke();
    },
    sk_meteor(ctx) {
      ctx.fillStyle = '#2a1738'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.strokeStyle = '#ff7a3c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(14, 50); ctx.lineTo(30, 34); ctx.stroke();
      ell(ctx, 38, 26, 13, 13); fillStroke(ctx, '#ffcf5a', OUT, 2.2);
      ctx.fillStyle = '#ff7a3c'; ell(ctx, 43, 30, 5, 5); ctx.fill();
      ell(ctx, 10, 54, 2, 2); ctx.fillStyle = '#ffd760'; ctx.fill();
      ell(ctx, 20, 40, 1.6, 1.6); ctx.fill();
    },
    lock(ctx) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(32, 26, 11, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = '#c9c2d8'; ctx.lineWidth = 4; ctx.stroke();
      rr(ctx, 16, 26, 32, 26, 5); fillStroke(ctx, '#ffd760', OUT, 2.6);
      ctx.fillStyle = OUT; ell(ctx, 32, 37, 3.4, 3.4); ctx.fill(); ctx.fillRect(30.5, 37, 3, 8);
    },
  };

  /* ---------- магический круг заточки ---------- */
  function drawMagicCircle(ctx, cx, cy, R, t, power, color) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';
    const c = color;
    const g = ctx.createRadialGradient(0, 0, R * .1, 0, 0, R * 1.2);
    g.addColorStop(0, hexA(c, .35 + .3 * power)); g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g; ell(ctx, 0, 0, R * 1.2, R * 1.2); ctx.fill();
    ctx.strokeStyle = hexA(c, .9); ctx.lineWidth = 2;
    ell(ctx, 0, 0, R, R); ctx.stroke(); ell(ctx, 0, 0, R * .86, R * .86); ctx.stroke();
    ctx.save(); ctx.rotate(t * (.4 + power * 3));
    ctx.lineWidth = 1.6;
    for (let tri = 0; tri < 2; tri++) {
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) { const a = tri * Math.PI / 3 + i * TAU / 3 - Math.PI / 2; const px = Math.cos(a) * R * .84, py = Math.sin(a) * R * .84; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    // руны по кольцу
    for (let i = 0; i < 16; i++) {
      ctx.save(); ctx.rotate(i * TAU / 16); ctx.translate(0, -R * .93);
      ctx.beginPath(); const v = i % 4;
      if (v === 0) { ctx.moveTo(-3, -3); ctx.lineTo(3, 3); ctx.moveTo(3, -3); ctx.lineTo(-3, 3); }
      else if (v === 1) { ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); }
      else if (v === 2) { ctx.arc(0, 0, 3, 0, TAU); }
      else { ctx.moveTo(-3, 3); ctx.lineTo(0, -4); ctx.lineTo(3, 3); }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    ctx.save(); ctx.rotate(-t * (.7 + power * 4));
    ctx.setLineDash([6, 8]); ctx.lineWidth = 1.4; ell(ctx, 0, 0, R * .55, R * .55); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ell(ctx, Math.cos(a) * R * .55, Math.sin(a) * R * .55, 3, 3); ctx.fillStyle = hexA(c, .9); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }

  const api = {
    drawMonster, monTop, MON, drawBackground, scrollIcon, miscIcon, drawMagicCircle,
    enchGlow, GRADE_COL, hexA, mix, light, dark, ell, rr, h01, hash, fillStroke, OUT, TAU, clamp,
    iconCanvas, iconCache, gem, easeOut, easeIn, easeInOut, MISC,
  };
  return api;
})();
