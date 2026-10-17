/* ===== Графика питомцев и новых иконок ===== */
(() => {
  const A = ART;
  const { ell, rr, mix, dark, light, hexA, fillStroke, OUT, TAU, iconCanvas, iconCache, gem } = A;
  const RAR_COL = ['#c9c2d8', '#5cbcff', '#bd8aff', '#ffd760', '#ff5fd2'];

  function petEyes(ctx, x1, x2, y, s, c, blink) {
    for (const ex of [x1, x2]) {
      if (blink) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 2.4 * s, y); ctx.quadraticCurveTo(ex, y + 1.8 * s, ex + 2.4 * s, y); ctx.stroke(); continue; }
      ctx.fillStyle = OUT; ell(ctx, ex, y, 2.6 * s, 3.4 * s); ctx.fill();
      ctx.fillStyle = c; ell(ctx, ex, y + 1 * s, 1.8 * s, 1.6 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, ex - .8 * s, y - 1.3 * s, 1 * s, 1.1 * s); ctx.fill();
    }
  }
  function cheeks(ctx, x1, x2, y) { ctx.fillStyle = 'rgba(255,110,150,.45)'; ell(ctx, x1, y, 2.6, 1.4); ctx.fill(); ell(ctx, x2, y, 2.6, 1.4); ctx.fill(); }

  const SP = {
    sprite(ctx, p, t, bl) {
      const P = p.pal, fl = Math.sin(t * 16) * .5;
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 11, -4); ctx.rotate(s * (.5 + fl * .4)); ell(ctx, s * 4, 0, 6, 3.4); ctx.fillStyle = hexA('#ffffff', .7); ctx.fill(); ctx.strokeStyle = hexA(P.e, .6); ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      ell(ctx, 0, 0, 12.5, 11.5); fillStroke(ctx, P.a, OUT, 2);
      ctx.fillStyle = hexA('#ffffff', .65); ell(ctx, -4.5, -5, 4, 2.6, -.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(2, -19, 9, -19); ctx.quadraticCurveTo(7, -12, 0, -11); fillStroke(ctx, P.b, OUT, 1.4);
      petEyes(ctx, -4, 4.5, 0, 1, P.e, bl); cheeks(ctx, -8, 8.5, 4);
    },
    bunny(ctx, p, t, bl) {
      const P = p.pal, ear = Math.sin(t * 2.4) * .08;
      for (const [s, r] of [[-1, -.2], [1, .25]]) {
        ctx.save(); ctx.translate(s * 5, -9); ctx.rotate(r + ear * s);
        ell(ctx, 0, -9, 4.2, 10); fillStroke(ctx, P.a, OUT, 1.8);
        ell(ctx, 0, -9, 2, 7); ctx.fillStyle = P.b; ctx.fill(); ctx.restore();
      }
      ell(ctx, -12, 5, 4, 4); fillStroke(ctx, '#ffffff', OUT, 1.4);
      ell(ctx, 0, 1, 13, 11.5); fillStroke(ctx, P.a, OUT, 2);
      petEyes(ctx, -4, 5, 0, 1, P.e, bl); cheeks(ctx, -8, 9, 4.5);
      ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(2, 4); ctx.lineTo(1, 5.5); ctx.closePath(); ctx.fill();
      if (p.r >= 1) { ctx.fillStyle = P.b; ell(ctx, 7, -10, 2.4, 2.4); ctx.fill(); }
    },
    cat(ctx, p, t, bl) {
      const P = p.pal, tw = Math.sin(t * 3) * 3;
      ctx.strokeStyle = OUT; ctx.lineWidth = 5.6; ctx.beginPath(); ctx.moveTo(-9, 6); ctx.quadraticCurveTo(-20, 4, -17 + tw * .3, -9 + tw); ctx.stroke();
      ctx.strokeStyle = P.a; ctx.lineWidth = 3.4; ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 11, -5); ctx.lineTo(s * 12, -17); ctx.lineTo(s * 3, -10); ctx.closePath(); fillStroke(ctx, P.a, OUT, 1.8);
        ctx.beginPath(); ctx.moveTo(s * 10, -7); ctx.lineTo(s * 10.6, -13.6); ctx.lineTo(s * 5, -10); ctx.closePath(); ctx.fillStyle = '#ffb3c8'; ctx.fill();
      }
      ell(ctx, 0, 1, 13.5, 11.5); fillStroke(ctx, P.a, OUT, 2);
      ell(ctx, 0, 6, 7, 4.6); ctx.fillStyle = P.b; ctx.fill();
      if (p.id === 'tsuki') { ctx.save(); ctx.translate(0, -6); ctx.beginPath(); ctx.arc(0, 0, 3, .7, TAU - .7); ctx.arc(1.4, 0, 2.3, TAU - 1, 1, true); ctx.closePath(); ctx.fillStyle = '#ffd760'; ctx.fill(); ctx.restore(); }
      else { ctx.strokeStyle = dark(P.a, .3); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(-1, -6); ctx.moveTo(2, -10); ctx.lineTo(2, -6); ctx.stroke(); }
      // кошачьи глаза-щёлки
      for (const ex of [-4.5, 5]) {
        if (bl) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 2.4, 0); ctx.quadraticCurveTo(ex, -1.6, ex + 2.4, 0); ctx.stroke(); continue; }
        ell(ctx, ex, 0, 2.8, 3.2); fillStroke(ctx, P.e, OUT, 1.2);
        ctx.fillStyle = OUT; ell(ctx, ex, 0, .8, 2.6); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - 1, -1.2, .8, .8); ctx.fill();
      }
      ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.beginPath();
      ctx.moveTo(-8, 4); ctx.lineTo(-15, 3); ctx.moveTo(-8, 5.5); ctx.lineTo(-15, 6.5); ctx.moveTo(9, 4); ctx.lineTo(16, 3); ctx.moveTo(9, 5.5); ctx.lineTo(16, 6.5); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, 4.5); ctx.quadraticCurveTo(0, 6, 1, 4.5); ctx.quadraticCurveTo(2, 6, 3, 4.5); ctx.stroke();
    },
    owl(ctx, p, t, bl) {
      const P = p.pal, fl = Math.sin(t * 10) * .25, phoenix = p.r >= 3;
      if (phoenix) {
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-6, 10); ctx.rotate(2.2 + i * .35 + Math.sin(t * 3 + i) * .08); ell(ctx, 0, -12, 3, 11); fillStroke(ctx, i % 2 ? P.b : P.a, OUT, 1.3); ctx.restore(); }
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-2 + i * 4, -11); ctx.rotate(-.4 + i * .4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -6, 0, -11 - Math.sin(t * 8 + i) * 1.5); ctx.quadraticCurveTo(-3, -6, 0, 0); fillStroke(ctx, i === 1 ? P.b : P.a, OUT, 1.2); ctx.restore(); }
      }
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 11, 3); ctx.rotate(s * (.2 + fl)); ell(ctx, 0, 0, 4, 8); fillStroke(ctx, dark(P.a, .15), OUT, 1.6); ctx.restore(); }
      ell(ctx, 0, 2, 12, 13.5); fillStroke(ctx, P.a, OUT, 2);
      ell(ctx, 0, 7, 7.5, 7.5); ctx.fillStyle = P.b; ctx.fill();
      if (!phoenix) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 9, -7); ctx.lineTo(s * 10, -16); ctx.lineTo(s * 4, -10); ctx.closePath(); fillStroke(ctx, P.a, OUT, 1.5); }
      for (const ex of [-4.5, 4.5]) { ell(ctx, ex, -1, 5, 5); fillStroke(ctx, '#ffffff', OUT, 1.4); }
      petEyes(ctx, -4.5, 4.5, -1, 1, P.e, bl);
      ctx.beginPath(); ctx.moveTo(-1.6, 3); ctx.lineTo(1.6, 3); ctx.lineTo(0, 6); ctx.closePath(); fillStroke(ctx, '#ffb43a', OUT, 1);
    },
    fox(ctx, p, t, bl) {
      const P = p.pal, n = [1, 1, 2, 5, 9][p.r];
      for (let i = 0; i < n; i++) {
        const a = n === 1 ? -2.4 : -2.9 + i * (1.5 / Math.max(1, n - 1)) + Math.sin(t * 2.4 + i) * .06;
        ctx.save(); ctx.translate(-6, 6); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(7, -8, 2, -20); ctx.quadraticCurveTo(-5, -10, -3, 0); ctx.closePath();
        fillStroke(ctx, P.a, OUT, 1.4);
        ctx.beginPath(); ctx.moveTo(2, -20); ctx.quadraticCurveTo(4.5, -15, 3.6, -12); ctx.quadraticCurveTo(0, -14, -1.6, -13); ctx.closePath(); ctx.fillStyle = P.b; ctx.fill();
        ctx.restore();
      }
      ell(ctx, 1, 8, 8, 6); fillStroke(ctx, P.a, OUT, 1.8);
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 10, -8); ctx.lineTo(s * 11, -22); ctx.lineTo(s * 2, -12); ctx.closePath(); fillStroke(ctx, P.a, OUT, 1.8);
        ctx.beginPath(); ctx.moveTo(s * 9, -10); ctx.lineTo(s * 9.6, -18); ctx.lineTo(s * 4.4, -12); ctx.closePath(); ctx.fillStyle = P.b; ctx.fill();
      }
      ell(ctx, 0, -2, 12.5, 10.5); fillStroke(ctx, P.a, OUT, 2);
      ctx.beginPath(); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(0, 10, 9, 2); ctx.quadraticCurveTo(0, 5, -9, 2); ctx.fillStyle = light(P.b, .5); ctx.fill();
      if (p.r >= 3) { ctx.save(); ctx.strokeStyle = P.e; ctx.lineWidth = 1.4; if (p.r === 4) { ctx.shadowColor = P.e; ctx.shadowBlur = 6; } ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(0, -8); ctx.lineTo(1, -12); ctx.moveTo(-8, -3); ctx.lineTo(-11, -1); ctx.moveTo(8, -3); ctx.lineTo(11, -1); ctx.stroke(); ctx.restore(); }
      for (const ex of [-4.5, 4.5]) {
        if (bl || p.r === 3) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 2.6, -2); ctx.quadraticCurveTo(ex, -4.4, ex + 2.6, -2); ctx.stroke(); }
        else { ctx.fillStyle = OUT; ell(ctx, ex, -2, 2.4, 3); ctx.fill(); ctx.fillStyle = p.r === 4 ? '#ff62d4' : '#ffd760'; ell(ctx, ex, -1.4, 1.5, 1.6); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - .8, -3.2, .8, .9); ctx.fill(); }
      }
      ctx.fillStyle = OUT; ell(ctx, 0, 2.2, 1.4, 1); ctx.fill();
    },
    dragon(ctx, p, t, bl) {
      const P = p.pal, fl = Math.sin(t * 8) * .3;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 7, -6); ctx.rotate(s * (-.3 + fl));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 14, -10); ctx.lineTo(s * 12, -2); ctx.lineTo(s * 16, 2); ctx.lineTo(s * 9, 4); ctx.closePath();
        fillStroke(ctx, hexA(P.b, .9), OUT, 1.4); ctx.restore();
      }
      ctx.strokeStyle = OUT; ctx.lineWidth = 6.4; ctx.beginPath(); ctx.moveTo(-8, 8); ctx.quadraticCurveTo(-18, 12, -20, 2 + Math.sin(t * 3) * 2); ctx.stroke();
      ctx.strokeStyle = P.a; ctx.lineWidth = 4.2; ctx.stroke();
      ctx.save(); ctx.translate(-20, 2 + Math.sin(t * 3) * 2); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-4, 0); ctx.lineTo(0, 4); ctx.lineTo(2, 0); ctx.closePath(); fillStroke(ctx, P.b, OUT, 1.1); ctx.restore();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -10); ctx.quadraticCurveTo(s * 9, -16, s * 7, -21); ctx.quadraticCurveTo(s * 6, -15, s * 2, -11); ctx.closePath(); fillStroke(ctx, p.r === 4 ? '#fff8de' : light(P.b, .2), OUT, 1.3); }
      ell(ctx, 0, 1, 12.5, 12); fillStroke(ctx, P.a, OUT, 2);
      ell(ctx, 1, 6, 7, 5.6); ctx.fillStyle = P.b; ctx.fill();
      ctx.strokeStyle = dark(P.b, .15); ctx.lineWidth = .8; ctx.beginPath(); for (const y of [3.5, 6.5]) { ctx.moveTo(-4, y); ctx.lineTo(6, y); } ctx.stroke();
      if (p.r === 4) { ctx.strokeStyle = '#d9434f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8, 2); ctx.quadraticCurveTo(16, 4 + Math.sin(t * 4) * 2, 20, -1); ctx.moveTo(8, 3.5); ctx.quadraticCurveTo(15, 9, 19, 7 + Math.sin(t * 4 + 1) * 2); ctx.stroke(); }
      petEyes(ctx, -4, 5, -2, 1, P.e, bl); cheeks(ctx, -8, 9, 3);
    },
  };

  // pet: объект питомца из баланса {id, sp, r, pal}
  function drawPet(ctx, x, y, k, pet, t, opt = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const c = RAR_COL[pet.r];
    if (pet.r >= 1 && !opt.flat) {
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 22 + pet.r * 2);
      g.addColorStop(0, hexA(c, .0)); g.addColorStop(.6, hexA(c, .16 + .05 * pet.r)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ell(ctx, 0, 0, 22 + pet.r * 2, 22 + pet.r * 2); ctx.fill();
    }
    if (pet.r === 4 && !opt.flat) {
      ctx.save(); ctx.rotate(t * .8); ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = `hsla(${i * 60 + t * 90},90%,70%,.7)`; ctx.beginPath(); ctx.arc(0, 0, 20, i * TAU / 6, i * TAU / 6 + .6); ctx.stroke(); }
      ctx.restore();
    }
    if (opt.attack > 0) ctx.scale(1 + opt.attack * .15, 1 - opt.attack * .1);
    SP[pet.sp](ctx, pet, t, (t + pet.r * .7) % 4.1 < .12);
    if (pet.r >= 3 && !opt.flat) {
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + i * TAU / 3, px = Math.cos(a) * 18, py = Math.sin(a) * 8 - 4, s = 1.2 + Math.sin(t * 6 + i) * .6;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(px - .5, py - s * 2, 1, s * 4); ctx.fillRect(px - s * 2, py - .5, s * 4, 1);
      }
    }
    if (pet.r === 4) {
      ctx.save(); ctx.translate(2, -16);
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-7, -6); ctx.lineTo(-3, -3); ctx.lineTo(0, -8); ctx.lineTo(3, -3); ctx.lineTo(7, -6); ctx.lineTo(6, 0); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 1.2); ctx.restore();
    }
    ctx.restore();
  }

  function petIcon(pet, size = 96, stars = 0, locked = false) {
    const key = 'pet' + pet.id + size + '_' + stars + locked;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64);
    const col = RAR_COL[pet.r];
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, mix(col, '#2a2350', .55)); g.addColorStop(1, '#1a1534');
    rr(ctx, 1, 1, 62, 62, 10); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    if (locked) ctx.globalAlpha = .9;
    drawPet(ctx, 32, 32, 1.25, pet, 1.3, { flat: true });
    if (locked) {
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(20,14,40,.82)'; ctx.fillRect(0, 0, 64, 64); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#a99fd4'; ctx.font = '900 22px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 32, 33);
    }
    if (stars > 0) {
      for (let i = 0; i < stars; i++) {
        const sx = 32 + (i - (stars - 1) / 2) * 9, sy = 56;
        ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 1.9 : 4.2; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath();
        fillStroke(ctx, '#ffd760', OUT, 1);
      }
    }
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  /* ---------- дополнительные иконки интерфейса ---------- */
  Object.assign(A.MISC, {
    gem(ctx) {
      ctx.beginPath(); ctx.moveTo(32, 56); ctx.lineTo(8, 26); ctx.lineTo(18, 12); ctx.lineTo(46, 12); ctx.lineTo(56, 26); ctx.closePath();
      const g = ctx.createLinearGradient(8, 12, 56, 56); g.addColorStop(0, '#ffc2e6'); g.addColorStop(.5, '#ff6fc0'); g.addColorStop(1, '#9a5cff');
      fillStroke(ctx, g, OUT, 2.6);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(56, 26); ctx.moveTo(18, 12); ctx.lineTo(26, 26); ctx.lineTo(32, 56); ctx.moveTo(46, 12); ctx.lineTo(38, 26); ctx.lineTo(32, 56); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(20, 16); ctx.lineTo(25, 16); ctx.lineTo(22, 22); ctx.closePath(); ctx.fill();
    },
    paw(ctx) {
      ell(ctx, 32, 40, 13, 11); fillStroke(ctx, '#ffb3d6', OUT, 2.4);
      for (const [x, y] of [[16, 24], [26, 15], [38, 15], [48, 24]]) { ell(ctx, x, y, 5.5, 6.5); fillStroke(ctx, '#ffb3d6', OUT, 2.2); }
    },
    arena(ctx) {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(32, 34); ctx.rotate(s * .78);
        rr(ctx, -3, -26, 6, 34, 2); fillStroke(ctx, '#dfe6ee', OUT, 2);
        rr(ctx, -8, 6, 16, 4, 2); fillStroke(ctx, '#ffd760', OUT, 2);
        rr(ctx, -2.5, 10, 5, 10, 2); fillStroke(ctx, '#7a4a8a', OUT, 2);
        ctx.restore();
      }
    },
    quests(ctx) {
      rr(ctx, 14, 8, 36, 48, 4); fillStroke(ctx, '#f6ecd2', OUT, 2.6);
      ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2;
      for (const y of [22, 32, 42]) { ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(42, y); ctx.stroke(); }
      ctx.strokeStyle = '#2f9a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 22); ctx.lineTo(21, 25); ctx.lineTo(25, 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, 32); ctx.lineTo(21, 35); ctx.lineTo(25, 28); ctx.stroke();
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(21.5, 42, 3, 0, TAU); ctx.stroke();
    },
    gift(ctx) {
      rr(ctx, 12, 28, 40, 28, 3); fillStroke(ctx, '#ff8fc1', OUT, 2.6);
      rr(ctx, 9, 20, 46, 10, 3); fillStroke(ctx, '#ffb3d6', OUT, 2.6);
      ctx.fillStyle = '#ffd760'; ctx.fillRect(28, 20, 8, 36); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(28, 20, 8, 36);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(32, 20); ctx.quadraticCurveTo(32 + s * 16, 2, 32 + s * 4, 18); fillStroke(ctx, '#ffd760', OUT, 2); }
    },
    settings(ctx) {
      ctx.save(); ctx.translate(32, 32);
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 18 : 23; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); fillStroke(ctx, '#c9c2d8', OUT, 2.4);
      ell(ctx, 0, 0, 7, 7); fillStroke(ctx, '#2a2350', OUT, 2.2);
      ctx.restore();
    },
    ticket(ctx) {
      ctx.beginPath(); ctx.moveTo(8, 18); ctx.lineTo(56, 18); ctx.lineTo(56, 28); ctx.arc(56, 32, 4, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(56, 46); ctx.lineTo(8, 46); ctx.lineTo(8, 36); ctx.arc(8, 32, 4, Math.PI / 2, -Math.PI / 2, true); ctx.closePath();
      fillStroke(ctx, '#ffcf5a', OUT, 2.4);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#b07a1e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(22, 20); ctx.lineTo(22, 44); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(40, 32); ctx.rotate(.78); rr(ctx, -2, -10, 4, 18, 1.5); fillStroke(ctx, '#dfe6ee', OUT, 1.6); ctx.restore();
    },
    pass(ctx) {
      ctx.save(); ctx.translate(32, 30);
      for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ell(ctx, 0, -12, 8, 12); fillStroke(ctx, '#ffc2dc', OUT, 2); }
      ell(ctx, 0, 0, 7, 7); fillStroke(ctx, '#ffd760', OUT, 2);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(22, 46); ctx.lineTo(18, 60); ctx.lineTo(26, 56); ctx.lineTo(30, 62); ctx.lineTo(32, 48); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 1.8);
      ctx.beginPath(); ctx.moveTo(42, 46); ctx.lineTo(46, 60); ctx.lineTo(38, 56); ctx.lineTo(34, 62); ctx.lineTo(32, 48); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 1.8);
    },
    moon(ctx) {
      rr(ctx, 8, 14, 48, 36, 5); fillStroke(ctx, '#2f2a6a', OUT, 2.4);
      ctx.save(); ctx.translate(30, 32); ctx.beginPath(); ctx.arc(0, 0, 11, .7, TAU - .7); ctx.arc(5, 0, 9, TAU - 1, 1, true); ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 1.8); ctx.restore();
      ctx.fillStyle = '#fff'; for (const [x, y] of [[44, 22], [48, 40], [16, 42]]) { ell(ctx, x, y, 1.4, 1.4); ctx.fill(); }
    },
    noads(ctx) {
      rr(ctx, 10, 16, 44, 32, 5); fillStroke(ctx, '#dfe6ee', OUT, 2.4);
      ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(28, 24); ctx.lineTo(40, 32); ctx.lineTo(28, 40); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 5; ell(ctx, 32, 32, 22, 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, 48); ctx.lineTo(48, 16); ctx.stroke();
    },
    boost(ctx) {
      ell(ctx, 26, 34, 18, 18); fillStroke(ctx, '#ffc93d', OUT, 2.6);
      rr(ctx, 20, 28, 12, 12, 2); fillStroke(ctx, '#d99a1e', OUT, 2);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.font = '900 18px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText('×2', 46, 16); ctx.fillText('×2', 46, 16);
    },
    chest(ctx) {
      rr(ctx, 10, 28, 44, 26, 3); fillStroke(ctx, '#b07a48', OUT, 2.6);
      ctx.beginPath(); ctx.moveTo(10, 30); ctx.quadraticCurveTo(10, 12, 32, 12); ctx.quadraticCurveTo(54, 12, 54, 30); ctx.closePath(); fillStroke(ctx, '#c98a52', OUT, 2.6);
      ctx.fillStyle = '#ffd760'; ctx.fillRect(10, 28, 44, 5); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(10, 28, 44, 5);
      rr(ctx, 27, 30, 10, 12, 2); fillStroke(ctx, '#ffd760', OUT, 2);
    },
    trophy(ctx) {
      ctx.beginPath(); ctx.moveTo(18, 10); ctx.lineTo(46, 10); ctx.quadraticCurveTo(46, 36, 32, 38); ctx.quadraticCurveTo(18, 36, 18, 10); ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 2.6);
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(16, 18, 6, 1.5, 4.7); ctx.arc(48, 18, 6, -1.6, 1.6); ctx.stroke();
      rr(ctx, 28, 38, 8, 10, 1); fillStroke(ctx, '#d99a1e', OUT, 2); rr(ctx, 18, 48, 28, 8, 2); fillStroke(ctx, '#7a4a8a', OUT, 2);
    },
    login(ctx) {
      rr(ctx, 10, 14, 44, 42, 5); fillStroke(ctx, '#fff6ee', OUT, 2.6);
      ctx.fillStyle = '#e0485c'; ctx.fillRect(11, 15, 42, 11);
      ctx.fillStyle = OUT; for (const x of [22, 42]) rr(ctx, x - 2, 9, 4, 10, 2), ctx.fill();
      ctx.fillStyle = '#ff8fc1'; ctx.font = '900 18px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('7', 32, 42);
    },
    summon(ctx) {
      const g = ctx.createRadialGradient(28, 26, 2, 32, 32, 24); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#ffb3d6'); g.addColorStop(1, '#9a5cff');
      ell(ctx, 32, 32, 22, 22); fillStroke(ctx, g, OUT, 2.6);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(32, 32, 15, -2.4, -1.2); ctx.stroke();
      ctx.save(); ctx.translate(32, 33); ctx.fillStyle = '#fff';
      ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 3 : 8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
    },
    starter(ctx) {
      A.MISC.chest(ctx);
      ctx.save(); ctx.translate(38, 4); ctx.scale(.4, .4); A.MISC.gem(ctx); ctx.restore();
    },
    music(ctx) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 46); ctx.lineTo(24, 14); ctx.lineTo(48, 10); ctx.lineTo(48, 40); ctx.stroke();
      ell(ctx, 18, 46, 7, 5.5, -.3); fillStroke(ctx, '#ff8fc1', OUT, 2.2); ell(ctx, 42, 40, 7, 5.5, -.3); fillStroke(ctx, '#ff8fc1', OUT, 2.2);
    },
  });

  Object.assign(ART, { drawPet, petIcon, RAR_COL });
})();
