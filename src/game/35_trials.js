/* ===== Панели испытаний: башня, подземелья, пробуждение ===== */
function renderTrials() {
  const seg = segHTML('trialseg', R.trialSeg, [['tower', 'Башня'], ['dungeon', 'Подземелья'], ['awaken', 'Пробуждение']]);
  const body = { tower: renderTower, dungeon: renderDungeons, awaken: renderAwaken }[R.trialSeg]();
  return seg + body;
}

/* ---------- башня ---------- */
const awBadges = () => S.aw.petals > 0 ? `<span class="chip plain"><img src="${A.miscIcon('petal', 32)}" alt="">${fmt(S.aw.petals)}</span>` : '';
// честная оценка сложности: прогоняем бой и смотрим время и исход
function fightTag(guard, stageEq) {
  const r = simFight(guard, stageEq);
  if (!r.win) return ['сложно', 'hard'];
  return r.t < 8 ? ['легко', 'easy'] : r.t < 20 ? ['на равных', 'even'] : ['сложно', 'hard'];
}
function renderTower() {
  const f = towerFloor(), open = towerOpen(), guard = towerGuardFor(Math.min(f, B.TOWER.floors));
  const tag = fightTag(guard, guard.stageEq), claimable = towerClaimable();
  const rw = towerRewardFor(Math.min(f, B.TOWER.floors));
  const canClaim = claimable;
  return `
    <section class="card tower-card">
      <div class="tower-head"><div><h2>Башня сакуры</h2>
        <p class="sub">Открыта с первого уровня · пройдено ярусов: <b>${S.tower.best}</b> из ${B.TOWER.floors}${open ? '' : ' · вершина достигнута'}</p></div>
        ${awBadges()}</div>
      <div class="tower-num"><span>ЯРУС</span><b>${open ? f : B.TOWER.floors}</b><span>из ${B.TOWER.floors}</span></div>
      <p class="sub">${esc(guard.name)} · мощь <b>${fmt(B.power(guard))}</b> · <span class="diff ${tag[1]}">${tag[0]}</span></p>
      <div class="btn-row">
        <button class="buy pink" data-act="tower-fight" ${open ? '' : 'disabled'}>${open ? 'В бой' : 'Вершина'}</button>
        <button class="buy ghost" data-act="tower-auto" ${open ? '' : 'disabled'}>Авто до поражения</button>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h3>Награда за ярус ${open ? f : B.TOWER.floors}</h3></div>
      <p class="sub">${rewardSummary(rw) || '—'}</p>
      <p class="note">За каждый 10-й ярус — лепестки сакуры и билеты призыва. Башня проходится один раз навсегда.</p>
    </section>
    <section class="card chest-card">
      <img src="${A.miscIcon('trophy', 64)}" alt="">
      <div class="row-main"><b>Недельная награда</b><span class="meta">За лучший результат недели: ${B.TOWER.weeklyGems(S.tower.best)} 💎</span></div>
      <button class="buy ${canClaim ? 'pink' : ''}" data-act="tower-claim" ${canClaim ? '' : 'disabled'}>${canClaim ? 'Забрать' : S.tower.reward ? 'Получено' : 'Пройдите ярус'}</button>
    </section>`;
}

/* ---------- подземелья ---------- */
function renderDungeons() {
  const d = S.dungeon;
  return `
    <section class="card dungeon-head">
      <img src="${A.miscIcon('key', 64)}" alt="">
      <div class="row-main"><b>Ключи подземелий: ${d.keys}</b><span class="meta">Каждый день дают ${B.DKEYS.perDay} ключа · обновление через ${left(msToMidnight())}</span></div>
      <div class="btn-row" style="width:100%">
        <button class="buy ad small" data-act="dungeon-adkey" ${d.ads >= B.DKEYS.adExtra ? 'disabled' : ''}>+1 за рекламу</button>
        <button class="buy ghost small" data-act="dungeon-key" data-cost="${B.DKEYS.gemCost}" data-cur="gem" ${d.buys >= B.DKEYS.gemMax || S.gems < B.DKEYS.gemCost ? 'disabled' : ''}><img src="${A.miscIcon('gem', 32)}" alt="">+1 за ${B.DKEYS.gemCost}</button>
      </div>
    </section>
    <ul class="rows">${B.DUNGEONS.map(dn => {
      const guard = B.dungeonGuard(dn.id, S.stage), rw = B.dungeonReward(dn.id, S.stage), tag = fightTag(guard, S.stage);
      const locked = (S.maxStage || 0) < dn.stage;
      return `<li class="row ${locked ? 'locked-row' : ''}"><img src="${A.miscIcon(dn.icon, 64)}" alt="">
        <div class="row-main"><b>${dn.name}</b><span class="meta">${locked ? `Откроется на этапе ${dn.stage}` : `${dn.desc} · <span class="diff ${tag[1]}">${tag[0]}</span>`}</span>
        <span class="val">${locked ? '—' : rewardSummary(rw)}</span></div>
        <button class="buy ${!locked && d.keys > 0 ? 'pink' : ''}" data-act="dungeon-go" data-id="${dn.id}" ${locked || d.keys <= 0 ? 'disabled' : ''}>${locked ? 'Этап ' + dn.stage : 'Войти'}</button></li>`;
    }).join('')}</ul>
    <p class="note">Подземелья — быстрый бой без риска: ключ тратится только при победе. Награда растёт вместе с вашим этапом.</p>`;
}

/* ---------- пробуждение ---------- */
function renderAwaken() {
  const gain = awakenGain(), open = canAwaken(), aw = B.awBonus(S.aw.lvl);
  const startStage = Math.min(B.AW.unlockStage - 10, Math.floor(aw.start));
  return `
    <section class="card awaken-hero">
      <div class="tower-head"><div><h2>Путь сакуры</h2>
        <p class="sub">Пробуждений: <b>${S.aw.count}</b> · лепестки копятся навсегда</p></div>
        <span class="chip plain"><img src="${A.miscIcon('petal', 32)}" alt="">${fmt(S.aw.petals)}</span></div>
      <p class="sub">${open ? `Сейчас вы получите <b>${gain}</b> лепестков. Сбросятся этап, уровень и тренировка; снаряжение, питомцы, самоцветы и кристаллы останутся.` : `Пробуждение открывается на этапе ${B.AW.unlockStage}. Сейчас рекорд: этап ${zoneOf(Math.max(S.bestStage || 0, S.maxStage)).num}.`}</p>
      <div class="btn-row">
        <button class="buy pink wide" data-act="awaken-ask" ${open ? '' : 'disabled'}>${open ? `Пробудиться · +${gain} лепестков` : 'Ещё не открыто'}</button>
      </div>
      <p class="note">После пробуждения вы начнёте с этапа ${startStage + 1}: «Память пути» ведёт вперёд.</p>
    </section>
    <div class="card-head" style="margin:0"><h3>Древо вечности</h3><span class="sub">Бонусы навсегда</span></div>
    <ul class="rows awaken-tree">${B.AW_NODES.map(n => {
      const l = awLevel(n.id), maxed = l >= n.max, cost = B.awCost(n, l);
      const cur = n.fmt === 'pct' ? '+' + pct(n.val(l)) : n.fmt === 'hours' ? `${n.val(l)} ч` : n.fmt === 'sec' ? `${n.val(l)} с` : `${n.val(l)}`;
      const next = maxed ? cur : n.fmt === 'pct' ? '+' + pct(n.val(l + 1)) : n.fmt === 'hours' ? `${n.val(l + 1)} ч` : n.fmt === 'sec' ? `${n.val(l + 1)} с` : `${n.val(l + 1)}`;
      return `<li class="row"><img src="${A.miscIcon(n.id === 'start' ? 'pass' : n.id === 'offline' ? 'moon' : n.id === 'ench' ? 'quests' : n.id === 'bossTime' ? 'boss' : n.id === 'pet' ? 'paw' : n.id === 'crit' ? 'crit' : 'petal', 64)}" alt="">
        <div class="row-main"><b>${n.name}</b><span class="meta">${n.desc}: ${cur}${maxed ? ' · максимум' : ` → <em>${next}</em>`}</span></div>
        <button class="buy ${S.aw.petals < cost || maxed ? 'poor' : ''}" data-act="aw-buy" data-id="${n.id}" ${maxed ? 'disabled' : ''}>
          <img src="${A.miscIcon('petal', 32)}" alt="">${maxed ? 'Макс' : cost}</button></li>`;
    }).join('')}</ul>
    <p class="note">Древо усиливает весь прогресс сразу: атаку, золото, опыт, заточку и офлайн-доход.</p>`;
}

/* ---------- дуэль на канвасе ---------- */
function duelMonster(guard) {
  const z = zoneOf(S.stage), pick = z.mons[Math.floor(rnd() * z.mons.length)];
  return {
    type: pick[0], pal: pick[1], name: guard.name, boss: true, x: 0, hp: guard.hp, maxHp: guard.hp, dmg: guard.atk,
    t: 0, atkT: 0, atk: 0, pend: 0, flash: 0, dieT: 0, scale: 1.65, oy: 0, sq: 0, wind: 0, enr: false, tintA: 0, tintC: '#fff',
  };
}
function openDuel(opt) {
  const { guard, res, kind, floor, id } = opt;
  const dm = duelMonster(guard);
  const gname = guard.name || 'Страж подземелья';
  const st = { duel: true, kind, floor, id, guard, res, dm, t: 0, hitA: 0, hitB: 0, applied: false, x2: false };
  const title = kind === 'tower' ? 'Башня сакуры' : B.DUNGEON_BY[id].name;
  const sub = kind === 'tower' ? `Ярус ${floor} · мощь ${fmt(B.power(guard))}` : `Страж · мощь ${fmt(B.power(guard))}`;
  openModal(sheet(title, sub, `
    <div class="duel"><canvas id="duelCv"></canvas>
      <div class="duel-bars"><div><span>${esc(heroName())}</span><div class="bar hp"><i id="dMe"></i></div></div>
      <div class="r"><span>${esc(gname)}</span><div class="bar hp"><i id="dOp"></i></div></div></div>
      <div class="forge-result" id="duelRes"></div></div>
    <div id="duelBtns" class="btn-row"><button class="buy ghost" data-act="close">Закрыть</button></div>`, { noClose: true, cls: 'duel-sheet' }), st);
  const cv = $('duelCv');
  if (!cv) return;
  const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const c = cv.getContext('2d');
  let lastT = performance.now();
  const dur = Math.max(.7, Math.min(2.2, res.t / 3));
  const loop = now => {
    if (modalState !== st) return;
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; st.t += dt;
    const p = Math.min(1, st.t / dur);
    const hpNow = res.heroMax - (res.heroMax - res.hp) * p;
    const opNow = res.enemyMax - (res.enemyMax - res.ehp) * p;
    const me = $('dMe'), op = $('dOp');
    if (me) me.style.width = clamp(hpNow / res.heroMax * 100, 0, 100) + '%';
    if (op) op.style.width = clamp(opNow / res.enemyMax * 100, 0, 100) + '%';
    c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
    const gy = r.height * .82, k = r.height / 300;
    A.drawBackground(c, r.width, r.height, gy, ARENA_ZONE, 0, st.t);
    A.drawHero(c, r.width * .3, gy, k * 1.05, R.look, { t: st.t, run: 0, phase: 0, swing: swingAt(st.t, 2.4), hurt: 0, dead: p >= 1 && !res.win, cast: 0 });
    c.save(); c.translate(r.width * .72, 0); c.scale(-1, 1);
    A.drawMonster(c, 0, gy, k, { ...dm, t: st.t, atk: Math.max(0, Math.sin(st.t * 2.4) - .6), flash: 0, dieT: p >= 1 && res.win ? .2 : 0 });
    c.restore();
    if (p >= 1 && !st.applied) {
      st.applied = true;
      $('duelRes').className = 'forge-result ' + (res.win ? 'ok' : 'bad');
      $('duelRes').innerHTML = res.win ? 'Победа!' : 'Не хватает сил';
      applyDuelResult(st);
    }
  };
  st.raf = requestAnimationFrame(loop);
}
function swingAt(t, rate) { const m = (t * rate) % 1; return m < .42 ? m / .42 : -1; }
function applyDuelResult(st) {
  const b = $('duelBtns');
  if (st.kind === 'tower') {
    if (st.res.win) {
      const rw = towerClear(st.floor);
      AU.sfx('victory');
      $('duelRes').innerHTML = `Победа!<small>${rewardSummary(rw)}</small>`;
      const next = S.tower.floor + 1;
      b.innerHTML = `<button class="buy ghost" data-act="close">Закрыть</button>${next <= B.TOWER.floors ? `<button class="buy pink" data-act="tower-fight">Ярус ${next}</button>` : ''}`;
    } else {
      AU.sfx('fail');
      $('duelRes').innerHTML = `Страж сильнее<small>Усильте снаряжение, грань и древо пробуждения</small>`;
      b.innerHTML = `<button class="buy ghost" data-act="close">Закрыть</button><button class="buy" data-act="tower-fight">Ещё раз</button>`;
    }
    renderPanel();
  } else {
    const d = S.dungeon;
    if (st.res.win) {
      d.keys--; d.runs++; S.stats.dungeonRuns++;
      const rw = B.dungeonReward(st.id, S.stage);
      grant(rw);
      quest('dungeon'); passXp(12); checkAch(); saveLocal();
      st.rw = rw;
      AU.sfx('victory');
      $('duelRes').innerHTML = `Победа!<small>${rewardSummary(rw)}</small>`;
      b.innerHTML = `<button class="buy ghost" data-act="close">Забрать</button><button class="buy ad" data-act="dungeon-x2">×2 за рекламу</button><button class="buy" data-act="dungeon-go" data-id="${st.id}">Ещё</button>`;
    } else {
      AU.sfx('fail');
      $('duelRes').innerHTML = `Страж сильнее<small>Ключ не потрачен: усильте снаряжение</small>`;
      b.innerHTML = `<button class="buy ghost" data-act="close">Закрыть</button><button class="buy" data-act="dungeon-go" data-id="${st.id}">Ещё раз</button>`;
    }
    renderPanel();
  }
}

/* очистка яруса: состояние + награда (без всплывашек) */
function towerClear(f, silent) {
  const rw = towerRewardFor(f);
  S.tower.floor = f;
  S.tower.best = Math.max(S.tower.best, f);
  grant(rw, silent);
  quest('tower'); passXp(18);
  checkAch(); saveLocal();
  return rw;
}

/* ---------- запуск боя ---------- */
function towerFightStart() {
  if (!towerOpen()) return;
  const f = towerFloor(), guard = towerGuardFor(f);
  openDuel({ kind: 'tower', floor: f, guard, res: simFight(guard, guard.stageEq) });
}
function towerAuto() {
  if (!towerOpen()) return;
  let n = 0, total = {};
  const from = towerFloor();
  while (towerOpen() && n < 30) {
    const f = towerFloor(), g = towerGuardFor(f);
    const res = simFight(g, g.stageEq);
    if (!res.win) break;
    const rw = towerClear(f, true);
    for (const k in rw) total[k] = (total[k] || 0) + rw[k];
    n++;
  }
  drawTowerSummary(from - 1, n, total);
}
function drawTowerSummary(from, n, total) {
  const f = towerFloor(), g = towerGuardFor(Math.min(f, B.TOWER.floors)), tag = fightTag(g, g.stageEq);
  openModal(sheet('Авто-подъём', n ? `Пройдено ${n} ${plural(n, ['ярус', 'яруса', 'ярусов'])}` : 'Ни одного яруса', `
    <dl class="compare"><dt>Было</dt><dd>ярус ${from + 1}</dd><dd></dd><dt>Стало</dt><dd class="up">ярус ${S.tower.best}</dd><dd></dd>
      ${Object.keys(total).length ? `<dt>Награды</dt><dd class="up">${rewardSummary(total)}</dd><dd></dd>` : ''}
      ${f <= B.TOWER.floors ? `<dt>Следующий страж</dt><dd>${fmt(B.power(g))}</dd><dd><span class="diff ${tag[1]}">${tag[0]}</span></dd>` : ''}
    </dl>
    ${n ? '' : '<p class="note">Страж очередного яруса сильнее героя. Прокачайте снаряжение, грань и древо пробуждения.</p>'}
    <div class="btn-row"><button class="buy ghost" data-act="close">Закрыть</button><button class="buy pink" data-act="tower-fight" ${towerOpen() ? '' : 'disabled'}>В бой</button></div>`), { towerSum: true });
  renderPanel();
  AU.sfx(n ? 'victory' : 'fail');
}

/* ---------- подземелье: вход ---------- */
function dungeonOpen(id) {
  dailyReset();
  const d = S.dungeon;
  if (d.keys <= 0) { toast('Ключи закончились'); return; }
  const guard = B.dungeonGuard(id, S.stage);
  openDuel({ kind: 'dungeon', id, guard, res: simFight(guard, S.stage) });
}
function dungeonX2(st) {
  if (!st.rw || st.x2) return;
  Monet.rewarded('dungeon').then(ok => {
    if (!ok) return;
    st.x2 = true;
    grant(st.rw);
    toast('Награда удвоена');
    if (modalState === st) closeModal();
    renderPanel();
  });
}

/* ---------- окно пробуждения ---------- */
function openAwakenAsk() {
  const gain = awakenGain();
  if (!canAwaken()) { toast(`Пробуждение откроется на этапе ${B.AW.unlockStage}`); return; }
  const startStage = Math.min(B.AW.unlockStage - 10, Math.floor(B.awBonus(S.aw.lvl).start));
  openModal(sheet('Пробуждение', `Вы получите ${gain} лепестков`, `
    <dl class="compare">
      <dt>Лепестки</dt><dd class="up">+${gain}</dd><dd></dd>
      <dt>Сбросится</dt><dd>этап, уровень, тренировка</dd><dd></dd>
      <dt>Останется</dt><dd>снаряжение, грань, питомцы</dd><dd></dd>
      <dt>Останется</dt><dd>самоцветы, кристаллы, свитки</dd><dd></dd>
      <dt>Новый старт</dt><dd>этап ${startStage + 1}</dd><dd></dd>
    </dl>
    <p class="note">Древо вечности даёт вечные бонусы. Каждое пробуждение с более высокого этапа приносит больше лепестков.</p>
    <div class="btn-row"><button class="buy ghost" data-act="close">Позже</button><button class="buy pink" data-act="awaken-yes">Пробудиться</button></div>`), { awaken: true });
}
