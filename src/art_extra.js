/* ===== Дополнительные иконки интерфейса версии 3 ===== */
(() => {
  const A = ART;
  const { ell, rr, fillStroke, OUT, TAU } = A;

  function petal5(ctx, cx, cy, r, c1, c2) {
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate(i * TAU / 5); ctx.translate(0, -r * .62);
      ell(ctx, 0, 0, r * .42, r * .58); ctx.fillStyle = i % 2 ? c2 : c1; ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    ell(ctx, 0, 0, r * .3, r * .3); fillStroke(ctx, '#ffd760', OUT, 1.8);
    ell(ctx, -r * .1, -r * .12, r * .12, r * .09); ctx.fillStyle = '#fff3c0'; ctx.fill();
  }

  Object.assign(A.MISC, {
    petal(ctx) {
      ctx.save(); ctx.translate(32, 32); petal5(ctx, 0, 0, 26, '#ff8fc1', '#ffb3d6'); ctx.restore();
    },
    petalSmall(ctx) {
      ctx.save(); ctx.translate(32, 32); petal5(ctx, 0, 0, 20, '#ffb3d6', '#ffcbe2'); ctx.restore();
    },
    key(ctx) {
      ctx.save(); ctx.translate(32, 31); ctx.rotate(-.55);
      ell(ctx, 0, -15, 10.5, 10.5); fillStroke(ctx, '#ffd760', OUT, 3);
      ell(ctx, 0, -15, 4.6, 4.6); fillStroke(ctx, '#ff8fc1', OUT, 2);
      ctx.beginPath(); ctx.moveTo(-3.4, -6); ctx.lineTo(3.4, -6); ctx.lineTo(3.4, 20); ctx.lineTo(-3.4, 20); ctx.closePath();
      fillStroke(ctx, '#ffe08f', OUT, 2.4);
      ell(ctx, -5, -17.5, 3.4, 2.2, -.5); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(3.4, 12); ctx.lineTo(12, 12); ctx.lineTo(12, 17); ctx.lineTo(7.5, 17); ctx.lineTo(7.5, 21.5); ctx.lineTo(3.4, 21.5); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 2.2);
      ctx.restore();
    },
    tower(ctx) {
      ctx.save(); ctx.translate(32, 33);
      const roof = (y, w, c) => {
        ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y - 10, w, y); ctx.lineTo(w - 5, y + 7); ctx.lineTo(-w + 5, y + 7); ctx.closePath();
        fillStroke(ctx, c, OUT, 2.2);
      };
      // основание
      ctx.beginPath(); ctx.moveTo(-15, 26); ctx.lineTo(15, 26); ctx.lineTo(11, -2); ctx.lineTo(-11, -2); ctx.closePath();
      fillStroke(ctx, '#4a3d86', OUT, 2.4);
      // окна
      for (const wy of [4, 14]) { rr(ctx, -3.4, wy, 6.8, 7, 2.6); fillStroke(ctx, wy === 4 ? '#ffd760' : '#ff8fc1', OUT, 1.6); }
      roof(2, 17, '#bd8aff'); roof(-10, 13, '#ff8fc1'); roof(-20, 9, '#ffd760');
      // шпиль с лепестком
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(3, -22); ctx.lineTo(-3, -22); ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 1.6);
      ell(ctx, 0, -33, 3.2, 2.4); ctx.fillStyle = '#ffb3d6'; ctx.fill();
      ctx.restore();
    },
    boss(ctx) {
      ctx.save(); ctx.translate(32, 33);
      // рога
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 9, -10); ctx.quadraticCurveTo(s * 25, -26, s * 23, -2); ctx.quadraticCurveTo(s * 18, -9, s * 8, -6); ctx.closePath();
        fillStroke(ctx, '#c9b8ff', OUT, 2.2);
      }
      // череп
      ctx.beginPath(); ctx.moveTo(-14, -10); ctx.quadraticCurveTo(0, -18, 14, -10); ctx.quadraticCurveTo(16, 6, 7, 14); ctx.lineTo(4, 22); ctx.lineTo(-4, 22); ctx.lineTo(-7, 14); ctx.quadraticCurveTo(-16, 6, -14, -10); ctx.closePath();
      fillStroke(ctx, '#3a2452', OUT, 2.4);
      // глаза
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 3, -4); ctx.lineTo(s * 11, -2); ctx.lineTo(s * 9, 3); ctx.lineTo(s * 4, 1); ctx.closePath();
        ctx.fillStyle = '#ff5d73'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      }
      // нос и зубы
      ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(2, 8); ctx.lineTo(-2, 8); ctx.closePath(); ctx.fillStyle = '#24123a'; ctx.fill();
      ctx.strokeStyle = '#c9b8ff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); for (let x = -6; x <= 6; x += 4) { ctx.moveTo(x, 12); ctx.lineTo(x, 17); } ctx.stroke();
      ctx.restore();
    },
  });
})();
