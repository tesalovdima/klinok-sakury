/* ===== Арена: асинхронные бои, рейтинг, лиги ===== */
function seeded(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
const SHADOWS = [2350, 2150, 1980, 1820, 1690, 1560, 1440, 1330, 1230, 1150, 1080, 1020, 960].map((r, i) => ({ name: B.BOT_NAMES[(i * 7 + 3) % B.BOT_NAMES.length], rating: r, shadow: true }));

const Arena = {
  players: [], lastFetch: 0, lastPush: 0, opp: null, oppSeed: -1, netPlayers: [],
  cloudReady() { this.push(); },
  async netPush() {
    if (!S || !S.hero) return;
    const ok = await NET.probe();
    if (!ok) return;
    const L = R.look, st = R.st;
    await NET.arenaPush({
      pid: S.pid, name: heroName(), rating: S.arena.rating, power: Math.round(R.power), level: S.level,
      body: S.hero.body, hair: S.hero.hair,
      st: { atk: st.atk, hp: st.hp, def: st.def, crit: st.crit, critDmg: st.critDmg, aspd: st.aspd },
      look: { weapon: L.weapon, helmet: L.helmet, upper: L.upper, lower: L.lower, gloves: L.gloves, boots: L.boots, neck: L.neck, ear: L.ear, aura: L.aura },
    });
  },
  sanitize(id, d) {
    if (!d || typeof d !== 'object') return null;
    const num = (v, lo, hi) => { v = Number(v); return isFinite(v) ? clamp(v, lo, hi) : lo; };
    const st = d.stats || d.st || {};
    const lk = d.look || {};
    const gr = v => Math.round(num(v, -1, 6));
    const lg = d.body === 'boy' ? 'boy' : 'girl';
    return {
      id: id || d.pid, pid: d.pid || id, real: true, name: String(d.name || 'Игрок').slice(0, 14), rating: Math.round(num(d.rating, 0, 9999)), power: num(d.power, 0, 1e300), level: Math.round(num(d.level, 1, 9999)),
      body: lg, hair: Math.round(num(d.hair ?? lk.hair, 0, 3)),
      st: { atk: num(st.atk, 1, 1e300), hp: num(st.hp, 1, 1e300), def: num(st.def, 0, 1e300), crit: num(st.crit, 0, .9), critDmg: num(st.critDmg, 1, 50), aspd: num(st.aspd, .5, 12) },
      look: { body: lg, hair: Math.round(num(d.hair ?? lk.hair, 0, 3)), weapon: lk.weapon && gr(lk.weapon.g) >= 0 ? { g: gr(lk.weapon.g), e: Math.round(num(lk.weapon.e, 0, 20)) } : null, helmet: gr(lk.helmet), upper: gr(lk.upper), lower: gr(lk.lower), gloves: gr(lk.gloves), boots: gr(lk.boots), neck: gr(lk.neck), ear: gr(lk.ear), aura: gr(lk.aura) },
    };
  },
  async refresh() {
    await NET.probe();
    if (NET.online) {
      try {
        const r = await NET.arenaList(S.pid, S.arena.rating, R.power);
        if (r && Array.isArray(r.players)) this.players = r.players.map(p => this.sanitize(p.pid, p)).filter(Boolean);
      } catch (e) { }
      this.netPlayers = this.players;
      if (this.players.length) return;
    }
    if (!Cloud.db) return;
    try {
      const snap = await Cloud.db.collection('arena').orderBy('rating', 'desc').limit(60).get();
      this.players = snap.docs.map(d => this.sanitize(d.id, d.data())).filter(Boolean);
    } catch (e) { }
  },
  async push() {
    if (!Cloud.db || !S || !S.hero || Date.now() - this.lastPush < 15000) return;
    this.lastPush = Date.now();
    const L = R.look, st = R.st;
    try {
      await Cloud.db.doc('arena/' + Cloud.uid).set({
        name: heroName(), body: S.hero.body, hair: S.hero.hair, level: S.level, rating: S.arena.rating, power: R.power,
        stats: { atk: st.atk, hp: st.hp, def: st.def, crit: st.crit, critDmg: st.critDmg, aspd: st.aspd },
        look: { wg: L.weapon ? L.weapon.g : -1, we: L.weapon ? L.weapon.e : 0, helmet: L.helmet, upper: L.upper, lower: L.lower, gloves: L.gloves, boots: L.boots, neck: L.neck, ear: L.ear, aura: L.aura },
        updatedAt: Date.now(),
      });
    } catch (e) { }
  },
  onOpen() {
    if (Date.now() - this.lastFetch > 30000) {
      this.lastFetch = Date.now();
      this.push();
      this.netPush();
      this.refresh().then(() => {
        Arena.opp = null; Arena.oppSeed = -1;
        if (R.tab === 'arena' && this.players.length) renderPanel();
      });
    }
  },
};

/* Соперники: в первую очередь реальные игроки с сервера, боты — только фон.
   Статы реального игрока приводим к нашей мощи, чтобы не было «неубиваемых». */
const BOT_F = [.84, .95, 1.02];
function scaledStats(st, k) {
  return { atk: Math.max(1, st.atk * k), hp: Math.max(1, st.hp * k), def: Math.max(0, st.def * k), crit: Math.min(.9, st.crit), critDmg: st.critDmg, aspd: clamp(st.aspd, .5, 12) };
}
function genOpponents() {
  const r = seeded(S.arena.seed + S.level * 13 + Math.floor(S.arena.rating)), g0 = unlockedGrade();
  const list = BOT_F.map((base, i) => {
    const f = base * (.97 + r() * .05);
    const st = scaledStats({ atk: R.st.atk, hp: R.st.hp, def: R.st.def, crit: R.st.crit, critDmg: R.st.critDmg, aspd: R.st.aspd }, f);
    const body = r() < .5 ? 'girl' : 'boy', hair = Math.floor(r() * 4);
    const g = clamp(g0 + (f > 1.01 ? 1 : f < .9 ? -1 : 0), 0, 6);
    const e = Math.floor(r() * 7);
    return {
      name: B.BOT_NAMES[Math.floor(r() * B.BOT_NAMES.length)], body, hair, st, power: B.power(st),
      rating: Math.max(0, Math.round(S.arena.rating + (f - 1) * 350 + (r() - .5) * 60)),
      look: { body, hair, weapon: { g, e }, helmet: r() < .7 ? g : -1, upper: g, lower: g, gloves: g, boots: g, neck: g, ear: g, aura: g >= 4 && e >= 6 ? g : -1 },
      real: false,
    };
  });
  // реальные соперники: до двух ближайших по рейтингу
  const cands = [...(Arena.netPlayers || []), ...Arena.players]
    .filter(p => p && p.st && p.pid !== S.pid && p.id !== S.pid)
    .sort((a, b) => Math.abs(a.rating - S.arena.rating) - Math.abs(b.rating - S.arena.rating));
  const used = new Set();
  for (let slot = 1; slot >= 0 && cands.length; slot--) {
    const p = cands.find(x => !used.has(x.pid || x.id));
    if (!p) break;
    used.add(p.pid || p.id);
    const desired = R.power * (slot === 1 ? .92 : 1.04);
    const basePower = B.power(p.st) || p.power || 1;
    const k = clamp(Math.sqrt(desired / Math.max(1, basePower)), .78, 1.12);
    list[slot] = { ...p, st: scaledStats(p.st, k), power: B.power(scaledStats(p.st, k)), real: true };
  }
  return list;
}
function opponents() {
  if (!Arena.opp || Arena.oppSeed !== S.arena.seed) { Arena.opp = genOpponents(); Arena.oppSeed = S.arena.seed; }
  return Arena.opp;
}
function boardHTML() {
  const rows = [...Arena.players.filter(p => p.id !== Cloud.uid), ...SHADOWS, { name: heroName(), rating: S.arena.rating, me: true }]
    .sort((a, b) => b.rating - a.rating);
  const myIdx = rows.findIndex(r => r.me);
  const show = rows.slice(0, 12);
  if (myIdx >= 12) show.push(rows[myIdx]);
  return show.map(p => {
    const lg = B.LEAGUES[B.league(p.rating)];
    return `<li class="${p.me ? 'me' : ''}"><span class="place">${rows.indexOf(p) + 1}</span><span class="nm">${esc(p.name)}${p.shadow ? '<small>тень</small>' : p.real ? '<small class="pl">игрок</small>' : ''}</span><span class="lg" style="color:${lg.color}">${lg.name}</span><b>${p.rating}</b></li>`;
  }).join('');
}
/* ---------- сезоны арены ---------- */
function ensureArenaSeason() {
  const info = B.arenaSeason();
  if (!S || !S.arena) return info;
  const a = S.arena;
  if (!Array.isArray(a.history)) a.history = [];
  if (a.season === info.idx) return info;
  const had = a.season >= 0 && (a.fights > 0 || a.wins > 0 || a.losses > 0);
  if (had) {
    const rw = B.arenaSeasonReward(a.rating);
    a.history.unshift({ season: info.idx, rating: a.rating, league: B.league(a.rating), reward: rw, wins: a.wins, losses: a.losses });
    a.history = a.history.slice(0, 5);
    const prev = info.idx;
    a.rating = B.ARENA.start; a.wins = 0; a.losses = 0; a.fights = 0; a.buys = 0; a.seed = 1;
    a.tickets = B.ARENA.tickets; a.day = ''; a.rewardDay = '';
    a.season = info.idx;
    grant(rw, true);
    toast(`Сезон арены ${prev} завершён: награда ${rewardText(rw)}`);
    log(`Сезон арены ${prev} завершён. Рейтинг сброшен до ${B.ARENA.start}, награда выдана.`, 'good');
  } else {
    a.season = info.idx;
  }
  saveLocal();
  return info;
}

function renderArena() {
  if (!unlockOk('arena')) return lockCard('arena', 'Арена');
  const season = ensureArenaSeason();
  const a = S.arena, li = B.league(a.rating), lg = B.LEAGUES[li], next = B.LEAGUES[li + 1];
  const canClaim = a.rewardDay !== dayKey();
  const ops = opponents();
  const sr = B.arenaSeasonReward(a.rating);
  const hist = (a.history || []).slice(0, 3);
  return `
    <section class="card league-card" style="--lg:${lg.color}">
      <div class="badge"><img src="${A.miscIcon('trophy', 64)}" alt=""></div>
      <div class="league-meta"><h2>${lg.name}</h2><p class="sub">Рейтинг <b>${a.rating}</b>${next ? ` · до лиги «${next.name}» ${next.min - a.rating}` : ''}</p>
        <p class="sub">Побед ${a.wins} · поражений ${a.losses}</p></div>
      <button class="buy ${canClaim ? 'pink' : ''} small" data-act="arena-claim" ${canClaim ? '' : 'disabled'}><img src="${A.miscIcon('gem', 32)}" alt="">${canClaim ? `+${lg.daily}` : 'Завтра'}</button>
    </section>
    <section class="card season-card">
      <div class="card-head"><h3>Сезон ${season.num}</h3><span class="sub">до конца ${left(season.left)}</span></div>
      <p class="sub">Награда за лигу «${lg.name}»: ${rewardText(sr)}</p>
      ${hist.length ? `<ul class="rows season-hist">${hist.map(h => `<li class="row season-row">
        <img src="${A.miscIcon('trophy', 48)}" alt="">
        <div class="row-main"><b>Сезон ${h.season} · ${B.LEAGUES[h.league].name}</b>
          <span class="meta">${h.rating} рейтинга · ${h.wins}–${h.losses}</span>
          <span class="meta">Награда: ${rewardText(h.reward)}</span></div></li>`).join('')}</ul>`
      : '<p class="note">Пока нет завершённых сезонов. Играйте бои до конца недели — награда придёт автоматически.</p>'}
    </section>
    <div class="ticket-row">
      <span class="chip plain"><img src="${A.miscIcon('ticket', 32)}" alt="">Билеты ${a.tickets}/${B.ARENA.tickets}</span>
      ${a.tickets < B.ARENA.tickets && a.buys < B.ARENA.refillMax ? `<button class="buy ghost small ${S.gems < B.ARENA.refillCost ? 'poor' : ''}" data-act="arena-refill" data-cost="${B.ARENA.refillCost}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">Пополнить за ${B.ARENA.refillCost}</button>` : `<span class="sub">Новые билеты через ${left(msToMidnight())}</span>`}
    </div>
    <div class="card-head" style="margin:0"><h3>Соперники</h3><button class="link-btn" data-act="arena-reroll">Другие соперники</button></div>
    <ul class="rows">${ops.map((o, i) => {
      const win = B.eloDelta(a.rating, o.rating, true), lose = B.eloDelta(a.rating, o.rating, false);
      const diff = o.power / Math.max(1, R.power);
      const tag = diff < .92 ? ['легко', 'easy'] : diff > 1.1 ? ['сложно', 'hard'] : ['на равных', 'even'];
      return `<li class="row opp"><img class="ava" src="${A.heroIcon(o.body, o.hair, 96)}" alt="">
        <div class="row-main"><b>${esc(o.name)}${o.real ? ' <small class="pl">игрок</small>' : ''}</b>
        <span class="meta">Мощь ${fmt(o.power)} · рейтинг ${o.rating}</span>
        <span class="val"><span class="diff ${tag[1]}">${tag[0]}</span> победа +${win}, поражение ${lose}</span></div>
        <button class="buy pink" data-act="fight" data-i="${i}" ${a.tickets > 0 ? '' : 'disabled'}>В бой</button></li>`;
    }).join('')}</ul>
    <section class="card"><div class="card-head"><h3>Таблица лиги</h3><span class="sub">${Cloud.db ? 'Игроки, которым открыта игра, и тени арены' : 'Тени арены'}</span></div>
      <ol class="board" id="arenaBoard">${boardHTML()}</ol></section>`;
}

/* ---------- бой на арене ---------- */
function arenaFight(i) {
  const o = opponents()[i]; if (!o) return;
  if (S.arena.tickets <= 0) { toast('Билеты закончились'); return; }
  S.arena.tickets--; S.arena.fights++;
  const mk = (name, look, st) => ({ name, look, st, max: st.hp * B.ARENA.hpMul, hp: st.hp * B.ARENA.hpMul, timer: rnd() * .4, swing: -1, hit: false, hurt: 0, n: 0 });
  const F = { me: mk(heroName(), R.look, { ...R.st }), op: mk(o.name, o.look, o.st), opp: o, t: 0, over: false, fx: [] };
  const st = { music: 'arena', fight: F, busy: true };
  openModal(sheet('Арена', `${esc(heroName())} против ${esc(o.name)}`, `
    <div class="fight-stage"><canvas id="fightCv"></canvas>
      <div class="fight-bars"><div><span>${esc(heroName())}</span><div class="bar hp"><i id="fMe"></i></div></div>
      <div class="r"><span>${esc(o.name)}</span><div class="bar hp"><i id="fOp"></i></div></div></div>
      <div class="forge-result" id="fightRes"></div></div>
    <div class="btn-row" id="fightBtns"><button class="buy ghost" data-act="fight-skip">Пропустить</button></div>`, { noClose: true }), st);
  const cv = $('fightCv'), r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const c = cv.getContext('2d');
  let lastT = performance.now();
  const loop = now => {
    if (modalState !== st) return;
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    if (!F.over) fightStep(F, dt, true);
    drawFight(c, r.width, r.height, d, F);
    $('fMe').style.width = clamp(F.me.hp / F.me.max * 100, 0, 100) + '%';
    $('fOp').style.width = clamp(F.op.hp / F.op.max * 100, 0, 100) + '%';
    if (F.over && !F.done) arenaResult(st);
  };
  st.raf = requestAnimationFrame(loop);
}
function fightStep(F, dt, visual) {
  F.t += dt;
  for (const [a, b, side] of [[F.me, F.op, 1], [F.op, F.me, -1]]) {
    if (a.hurt > 0) a.hurt -= dt;
    a.timer += dt * a.st.aspd;
    if (a.swing < 0 && a.timer >= 1) { a.timer = 0; a.swing = 0; a.hit = false; }
    if (a.swing >= 0) {
      a.swing += dt / .34;
      if (!a.hit && a.swing >= .45) {
        a.hit = true; a.n++;
        const crit = rnd() < a.st.crit, special = a.n % 4 === 0;
        const dmg = B.pvpHit(a.st.atk, b.st.def) * (crit ? a.st.critDmg : 1) * (special ? 2.2 : 1) * (.9 + rnd() * .2);
        b.hp -= dmg; b.hurt = .2;
        if (visual) {
          F.fx.push({ type: 'num', side: -side, t: 0, text: fmt(dmg) + (crit ? '!' : ''), c: special ? '#ff8fc1' : crit ? '#ffcf4a' : '#ffffff', big: crit || special });
          F.fx.push({ type: 'slash', side: -side, t: 0, c: special ? '#ff8fc1' : crit ? '#ffd760' : '#ffffff', big: special });
          AU.sfx(special ? 'skill' : crit ? 'crit' : 'hit');
        }
      }
      if (a.swing >= 1) a.swing = -1;
    }
  }
  if (F.me.hp <= 0 || F.op.hp <= 0 || F.t >= 30) {
    F.over = true;
    F.win = F.op.hp <= 0 && F.me.hp > 0 ? true : F.me.hp <= 0 ? false : F.me.hp / F.me.max >= F.op.hp / F.op.max;
  }
  F.fx = F.fx.filter(f => (f.t += dt) < .8);
}
function drawFight(c, w, h, d, F) {
  c.setTransform(d, 0, 0, d, 0, 0);
  const gy = h * .8, k = h / 300;
  A.drawBackground(c, w, h, gy, ARENA_ZONE, 0, F.t);
  const lx = w * .3, rx = w * .7;
  const an = f => ({ t: F.t, run: 0, phase: 0, swing: f.swing, hurt: Math.max(0, f.hurt), dead: f.hp <= 0, cast: 0 });
  A.drawHero(c, lx, gy, k * 1.05, F.me.look, an(F.me));
  c.save(); c.translate(rx, gy); c.scale(-1, 1); A.drawHero(c, 0, 0, k * 1.05, F.op.look, an(F.op)); c.restore();
  for (const f of F.fx) {
    const x = f.side > 0 ? rx : lx, p = f.t / .8;
    if (f.type === 'num') {
      c.save(); c.globalAlpha = 1 - p; txt(c, f.text, x + (f.side > 0 ? -10 : 10) * k, gy - (120 + p * 40) * k, (f.big ? 20 : 14) * Math.sqrt(k), f.c); c.restore();
    } else {
      c.save(); c.globalAlpha = Math.max(0, 1 - p * 3); c.globalCompositeOperation = 'lighter'; c.strokeStyle = f.c; c.lineWidth = (f.big ? 10 : 5) * k; c.lineCap = 'round';
      c.beginPath(); c.arc(x, gy - 60 * k, 40 * k, f.side > 0 ? 2.2 : -.9, f.side > 0 ? 4 : .9); c.stroke(); c.restore();
    }
  }
}
function arenaResult(st) {
  const F = st.fight; F.done = true; st.busy = false;
  const a = S.arena, o = F.opp;
  const delta = B.eloDelta(a.rating, o.rating, F.win);
  a.rating = Math.max(0, a.rating + delta);
  const gems = F.win ? B.ARENA.winGems : B.ARENA.loseGems;
  S.gems += gems;
  if (F.win) { a.wins++; S.stats.arenaWins++; addEventCoins(B.EVENT.arena, 'arena'); addLanternDrop('arena'); } else a.losses++;
  a.seed++;
  quest('arena'); passXp(B.PASS.arenaXp); checkAch();
  const res = $('fightRes');
  res.className = 'forge-result ' + (F.win ? 'ok' : 'bad');
  res.innerHTML = `${F.win ? 'Победа!' : 'Поражение'}<small>Рейтинг ${delta >= 0 ? '+' : ''}${delta} · +${gems} ${plural(gems, GEM_W)}</small>`;
  AU.sfx(F.win ? 'victory' : 'fail');
  $('fightBtns').innerHTML = `<button class="buy ghost" data-act="fight-close">Закрыть</button>${a.tickets > 0 ? '<button class="buy pink" data-act="fight-again">Следующий бой</button>' : ''}`;
  saveLocal(); Arena.lastPush = 0; Arena.push();
  if (a.fights % 3 === 0) st.onClose = () => Monet.maybeInterstitial();
}
function skipFight() {
  const st = modalState; if (!st || !st.fight || st.fight.over) return;
  let guard = 0;
  while (!st.fight.over && guard++ < 2000) fightStep(st.fight, .05, false);
}
