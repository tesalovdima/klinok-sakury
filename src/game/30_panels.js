/* ===== Панели: герой, снаряжение, заточка, магазин, карта, настройки ===== */
const panel = $('panel');
function renderPanel() {
  if (!S || !S.hero) { panel.innerHTML = ''; return; }
  const fn = { hero: renderHero, gear: renderGear, pets: renderPets, arena: renderArena, trials: renderTrials, social: renderSocial, shop: renderShop }[R.tab];
  panel.innerHTML = fn ? fn() : '';
  if (R.tab === 'gear') setupDoll();
  if (R.tab === 'pets') setupPetStage();
  if (R.tab === 'arena') Arena.onOpen();
}
function setTab(t) {
  R.tab = t;
  for (const b of document.querySelectorAll('#tabs [data-tab]')) b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false');
  renderPanel(); panel.scrollTop = 0;
  if (t === 'social') Social.enter();
}
const segHTML = (act, cur, items) => `<div class="seg" role="group">${items.map(([v, l, dot]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}${dot ? '<i class="mini-dot"></i>' : ''}</button>`).join('')}</div>`;

/* ---------- герой ---------- */
const GROWTH_ICON = { atk: 'atk', hp: 'hp', regen: 'regen', crit: 'crit', critDmg: 'critDmg', aspd: 'aspd' };
function growthVal(g, l) { const v = g.val(l); return g.fmt === 'pct' ? '+' + pct(v) : g.fmt === 'regen' ? fmt(v) + '/с' : fmt(v); }
function growthBatch(g) {
  const l0 = S.growth[g.id]; let n = 0, cost = 0;
  const want = R.mult === 'max' ? 1e4 : R.mult;
  while (n < want && l0 + n < g.max) {
    const c = Math.ceil(g.cost(l0 + n));
    if (R.mult === 'max' && cost + c > S.gold && n > 0) break;
    cost += c; n++;
    if (R.mult === 'max' && cost > S.gold) break;
  }
  return { n, cost };
}
function statCells() {
  const st = R.st;
  return [
    ['Атака', fmt(st.atk)], ['Здоровье', fmt(st.hp)], ['Защита', fmt(st.def)], ['Восстановление', fmt(st.regen) + '/с'],
    ['Шанс крита', pct(st.crit)], ['Урон крита', pct(st.critDmg)], ['Уклонение', pct(R.dodge || 0)], ['Скорость атаки', st.aspd.toFixed(2) + '/с'], ['Золото', '+' + pct(goldMul() - 1)],
  ];
}
function renderHero() {
  const spReady = S.sp > 0 && SKILLS.some(s => S.level >= s.unlock && S.skills[s.id] < SKILL_MAX);
  const cp = chapterProgress();
  const chIdx = Math.min(S.chapter.idx + 1, CHAPTERS.length);
  const chapter = !cp ? '' : `<section class="card chapter-card ${cp.done ? 'done' : ''}">
      <img src="${A.miscIcon('quests', 64)}" alt="">
      <div class="row-main"><b>Глава ${chIdx} · ${cp.c.title}</b><span class="meta">${cp.c.text}</span>
        <div class="bar mini"><i style="width:${Math.min(100, cp.v / cp.c.goal * 100)}%"></i></div>
        <span class="meta">${fmt(cp.v)} / ${fmt(cp.c.goal)}</span></div>
      ${cp.done ? `<button class="buy pink" data-act="chapter-claim">Забрать</button>` : ''}
    </section>`;
  const f = fundUi();
  const fundCard = S.fund.owned && f.current ? `<section class="card chest-card"><img src="${A.miscIcon('starter', 64)}" alt="">
      <div class="row-main"><b>Фонд сакуры</b><span class="meta">Уровень ${f.current} достигнут · ${B.FUND.gems} 💎</span></div>
      <button class="buy pink" data-act="fund-claim" data-l="${f.current}">Забрать</button></section>` : '';
  return `
    ${chapter}
    ${fundCard}
    ${eventBannerHTML()}
    ${lanternBannerHTML()}
    <section class="card hero-card">
      <img class="portrait" src="${A.heroIcon(S.hero.body, S.hero.hair, 128)}" alt="">
      <div class="hero-meta"><h2>${esc(heroName())}</h2><span class="power">Боевая мощь<b id="powerVal">${fmt(R.power)}</b></span></div>
      <button class="buy ghost small" data-act="look">Облик</button>
      <dl class="stat-grid" id="statGrid">${statCells().map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
    </section>
    ${segHTML('heroseg', R.heroSeg, [['growth', 'Тренировка'], ['skills', `Навыки${S.sp ? ` · ${S.sp}` : ''}`, spReady]])}
    ${R.heroSeg === 'skills' ? renderSkills() : renderGrowth()}`;
}
function renderGrowth() {
  return `<p class="sub">Тратьте золото на рост характеристик. Зажмите кнопку, чтобы покупать серией.</p>
    <div class="seg" role="group" aria-label="Сколько уровней покупать">
      ${[[1, '×1'], [10, '×10'], [100, '×100'], ['max', 'Макс']].map(([v, l]) => `<button data-act="mult" data-v="${v}" aria-pressed="${R.mult === v}">${l}</button>`).join('')}
    </div>
    <ul class="rows" id="growthRows">${B.GROWTH.map(g => growthRow(g)).join('')}</ul>`;
}
function growthRow(g) {
  const l = S.growth[g.id], maxed = l >= g.max, b = growthBatch(g);
  return `<li class="row" data-row="${g.id}">
    <img class="ico-badge" src="${A.miscIcon(GROWTH_ICON[g.id], 64)}" alt="">
    <div class="row-main"><b>${g.name}</b><span class="meta" data-f="lv">Ур. ${l}${maxed ? ' · максимум' : ''}</span>
    <span class="val" data-f="val">${growthVal(g, l)}${maxed ? '' : ` → <em>${growthVal(g, l + b.n)}</em>`}</span></div>
    <button class="buy ${b.cost > S.gold ? 'poor' : ''}" data-grow="${g.id}" data-cost="${b.cost}" ${maxed ? 'disabled' : ''}>
      <img src="${A.miscIcon('gold', 32)}" alt=""><span data-f="cost">${maxed ? 'Макс' : fmt(b.cost)}</span></button>
  </li>`;
}
function patchHero() {
  if (R.tab !== 'hero') return;
  const pv = $('powerVal'); if (pv) pv.textContent = fmt(R.power);
  const sg = $('statGrid'); if (sg) sg.innerHTML = statCells().map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
  for (const g of B.GROWTH) {
    const row = panel.querySelector(`[data-row="${g.id}"]`); if (!row) continue;
    const l = S.growth[g.id], maxed = l >= g.max, b = growthBatch(g);
    row.querySelector('[data-f="lv"]').textContent = `Ур. ${l}${maxed ? ' · максимум' : ''}`;
    row.querySelector('[data-f="val"]').innerHTML = `${growthVal(g, l)}${maxed ? '' : ` → <em>${growthVal(g, l + b.n)}</em>`}`;
    const btn = row.querySelector('[data-grow]');
    btn.dataset.cost = b.cost; btn.disabled = maxed; btn.classList.toggle('poor', b.cost > S.gold);
    btn.querySelector('[data-f="cost"]').textContent = maxed ? 'Макс' : fmt(b.cost);
  }
}
function buyGrowth(id) {
  const g = B.GROWTH_BY[id], b = growthBatch(g);
  if (!b.n || b.cost > S.gold) return false;
  S.gold -= b.cost; S.growth[id] += b.n;
  quest('growth', b.n);
  recalc(); patchHero(); AU.sfx('buy');
  return true;
}
function renderSkills() {
  const list = SKILLS.slice().sort((a, b) => a.unlock - b.unlock);
  return `<p class="sub">Очко навыка даётся за каждый уровень. Изученные навыки срабатывают сами, тратя ману. Иконки на сцене показывают перезарядку, по ним можно нажать.</p>
    <ul class="rows">${list.map(s => {
      const l = S.skills[s.id], open = S.level >= s.unlock, maxed = l >= SKILL_MAX;
      const el = ELEMENTS[s.el];
      const btn = !open ? `<button class="buy" disabled>Ур. ${s.unlock}</button>`
        : maxed ? '<button class="buy" disabled>Максимум</button>'
        : `<button class="buy pink" data-act="learn" data-sk="${s.id}" ${S.sp > 0 ? '' : 'disabled'}>${l ? 'Улучшить' : 'Изучить'}</button>`;
      return `<li class="row"><img src="${skillIcon(s.icon, 64)}" alt="" style="${open ? '' : 'filter:grayscale(1) brightness(.6)'}">
        <div class="row-main"><b>${s.name} <small class="el" style="color:${el.color}">${el.name}</small></b>
        <span class="meta">${l ? `Ур. ${l}/${SKILL_MAX}` : open ? 'Не изучен' : `Откроется на уровне ${s.unlock}`} · ${s.mp} маны · перезарядка ${s.cd} с</span>
        <p>${s.desc(Math.max(1, l))}</p></div>${btn}</li>`;
    }).join('')}</ul>`;
}

/* ---------- снаряжение ---------- */
function lockCard(id, title) {
  const u = B.UNLOCK[id] || {};
  const cur = u.stage != null ? `Сейчас этап ${zoneOf(S.maxStage).num}.` : `Сейчас уровень ${S.level}.`;
  return `<section class="card lock-card"><img src="${A.miscIcon('lock', 64)}" alt="">
    <div class="row-main"><b>${title}</b><span class="meta">Откроется на ${unlockLabel(id)}. ${cur}</span></div></section>`;
}
const DOLL = { left: ['helmet', 'upper', 'lower'], right: ['weapon', 'gloves', 'boots'], bottom: ['neck', 'ear', 'ring'] };
function slotTile(slot) {
  const id = S.equip[slot], it = id && itemById(id);
  if (it) return tileHTML(it, `data-act="item" data-id="${it.id}"`);
  return `<button class="tile empty" data-act="slot" data-slot="${slot}" aria-label="${B.SLOT[slot].name}: пусто"><span class="slot-name">${B.SLOT[slot].name}</span></button>`;
}
function bankHTML() {
  const chips = [];
  const keys = [['w', 'weapon', false], ['a', 'armor', false], ['bw', 'weapon', true], ['ba', 'armor', true]];
  for (let g = 1; g < NG; g++) for (const [k, kind, bl] of keys) {
    const n = S.scrolls[k][g]; if (!n) continue;
    chips.push(`<span class="chip g${g}" title="${bl ? 'Благословенный свиток' : 'Свиток'}: ${kind === 'weapon' ? 'оружие' : 'доспех'}, ${B.GRADES[g].label}"><img src="${A.scrollIcon(kind, g, bl)}" alt=""><span class="gtext">${B.GRADES[g].short}</span>${n}</span>`);
  }
  return chips.length ? chips.join('') : '<p class="sub">Свитков пока нет. Они выпадают из монстров: в каждой зоне свой грейд.</p>';
}
function setLine() {
  const st = R.st;
  if (st.set) return `<p class="set-line">Сет <b class="gtext g${st.set.g}">${B.GRADES[st.set.g].label}</b>: здоровье +15%, защита +10%${st.set.glow ? ', сияние: атака +10%' : '. Заточите все части на +6 для сияния'}.</p>`;
  const parts = B.ARMOR_SET.map(s => S.equip[s] && itemById(S.equip[s])).filter(Boolean);
  if (!parts.length) return '<p class="set-line">Наденьте 5 частей доспеха одного грейда, чтобы получить бонус сета.</p>';
  const best = {}; parts.forEach(p => best[p.g] = (best[p.g] || 0) + 1);
  const [g, n] = Object.entries(best).sort((a, b) => b[1] - a[1])[0];
  return `<p class="set-line">Сет <b class="gtext g${g}">${B.GRADES[g].label}</b>: ${n} из 5 частей.</p>`;
}
function renderGear() {
  const bag = S.items.filter(i => !isEquipped(i)).sort((a, b) => b.g - a.g || b.e - a.e || a.slot.localeCompare(b.slot));
  const cn = codexCount(), cm = codexMax();
  return `
    <section class="card">
      <div class="doll">
        <div class="doll-col">${DOLL.left.map(slotTile).join('')}</div>
        <div class="doll-center"><canvas id="dollCv"></canvas></div>
        <div class="doll-col">${DOLL.right.map(slotTile).join('')}</div>
      </div>
      <div class="doll-bottom">${DOLL.bottom.map(slotTile).join('')}</div>
      ${setLine()}
    </section>
    <section class="card codex-card">
      <div class="card-head"><h3>Коллекция снаряжения</h3><span class="sub">${cn} / ${cm}</span></div>
      <div class="bar mini"><i style="width:${cn / cm * 100}%"></i></div>
      <p class="note">Каждая новая вещь навсегда даёт +0,2% атаки и здоровья. Сейчас: <b class="cry-text">+${pct(codexBonus())}</b>.</p>
    </section>
    <section class="card">
      <div class="card-head"><h3>Свитки заточки</h3><span class="cur cry inline"><img src="${A.miscIcon('crystal', 40)}" alt=""><b>${fmt(S.crystals)}</b></span></div>
      <div class="scroll-bank" id="scrollBank">${bankHTML()}</div>
    </section>
    <section class="card">
      <div class="card-head"><h3>Сумка</h3><span class="sub">${bag.length} ${plural(bag.length, ['предмет', 'предмета', 'предметов'])}</span></div>
      ${bag.length ? `<div class="bag">${bag.map(it => tileHTML(it, `data-act="item" data-id="${it.id}"`)).join('')}</div>` : '<p class="empty-note">Сумка пуста. Купленное снаряжение, которое не надето, попадает сюда.</p>'}
    </section>`;
}
let dollCtx = null, dollCv = null;
function setupDoll() {
  dollCv = $('dollCv'); if (!dollCv) return;
  const r = dollCv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  dollCv.width = Math.round(r.width * d); dollCv.height = Math.round(r.height * d);
  dollCtx = dollCv.getContext('2d'); dollCtx.setTransform(d, 0, 0, d, 0, 0);
  dollCv._w = r.width; dollCv._h = r.height;
  drawDoll();
}
function drawDoll() {
  if (!dollCtx || !dollCv || !dollCv.isConnected) return;
  const w = dollCv._w, h = dollCv._h;
  dollCtx.clearRect(0, 0, w, h);
  dollCtx.fillStyle = 'rgba(255,143,193,.12)'; A.ell(dollCtx, w / 2, h - 16, w * .36, 9); dollCtx.fill();
  const k = h / 150;
  A.drawHero(dollCtx, w / 2 - 6 * k, h - 14, k, R.look, { t: R.t, run: 0, phase: 0, swing: -1, hurt: 0, dead: false, cast: 0 });
}

/* ---------- карточка предмета ---------- */
function compareRows(slot, g, e, opts, vsSt) {
  const cur = itemTotals({ slot, g, e, opts });
  return Object.keys(cur).map(k => {
    const v = cur[k], o = vsSt ? (vsSt[k] || 0) : null;
    const cls = o === null ? '' : v > o + 1e-9 ? 'up' : v < o - 1e-9 ? 'down' : '';
    return `<dt>${STAT_LABEL[k] || k}</dt><dd class="${cls}">${statStr(k, v)}</dd><dd>${o === null ? '' : 'сейчас ' + statStr(k, o)}</dd>`;
  }).join('');
}
function optsHTML(it) {
  if (it.g === 0) return '<p class="note">Предметы без грейда нельзя заточить или перековать.</p>';
  const opts = it.opts || [];
  const cost = B.rerollCost(it.g);
  const rows = opts.length ? opts.map(o => `<span class="opt-chip">${B.OPT_BY[o.k] ? B.OPT_BY[o.k].name : o.k} <b>${statStr(o.k, o.v)}</b></span>`).join('')
    : '<span class="note">Грань пуста — перекуйте, чтобы получить свойства.</span>';
  return `<div class="opts-block"><div class="opts-head"><b>Грань предмета</b><span class="sub">${opts.length} из ${B.optCount(it.g)}</span></div>
    <div class="opt-chips">${rows}</div>
    <button class="buy ghost small ${S.crystals >= cost ? '' : 'poor'}" data-act="reroll" data-id="${it.id}">Перековать · <img src="${A.miscIcon('crystal', 32)}" alt="">${fmt(cost)}</button></div>`;
}
function openItem(id) {
  const it = itemById(id); if (!it) return;
  const eq = isEquipped(it), gr = B.GRADES[it.g];
  const eqId = S.equip[it.slot], eqIt = !eq && eqId && itemById(eqId);
  const vs = eqIt ? itemTotals(eqIt) : null;
  const lvOk = gradeUnlocked(it.g), k = scrollKind(it.slot), canEnch = it.g > 0 && it.e < B.MAX_ENCH;
  openModal(sheet(`<span class="gtext g${it.g}">${itemName(it)}</span>`, `${B.SLOT[it.slot].name} · ${gr.label}${eq ? ' · надето' : ''}`, `
    <dl class="compare">${compareRows(it.slot, it.g, it.e, it.opts, vs)}</dl>
    ${optsHTML(it)}
    ${!lvOk ? `<p class="note warn">Нужен этап ${gr.stage}, чтобы надеть этот предмет.</p>` : ''}
    ${it.g === 0 ? '' : `<p class="note">Свитков ${B.GRADES[it.g].short} для ${k === 'w' ? 'оружия' : 'доспехов'}: обычных ${S.scrolls[k][it.g]}, благословенных ${S.scrolls['b' + k][it.g]}.</p>`}
    <div class="btn-row">
      ${eq ? `<button class="buy ghost" data-act="unequip" data-id="${it.id}">Снять</button>` : `<button class="buy" data-act="equip" data-id="${it.id}" ${lvOk ? '' : 'disabled'}>Надеть</button>`}
      <button class="buy pink" data-act="enchant" data-id="${it.id}" ${canEnch ? '' : 'disabled'}>${it.e >= B.MAX_ENCH ? `Максимум +${B.MAX_ENCH}` : 'Заточить'}</button>
    </div>
    ${eq ? '' : `<div class="btn-row">
      <button class="buy ghost" data-act="sell" data-id="${it.id}"><img src="${A.miscIcon('gold', 32)}" alt="">Продать за ${fmt(B.sellPrice(it.slot, it.g))}</button>
      <button class="buy ghost" data-act="crystallize" data-id="${it.id}"><img src="${A.miscIcon('crystal', 32)}" alt="">Кристаллизовать: ${fmt(B.crystalYield(it.slot, it.g, it.e))}</button>
    </div>`}`, { icon: tileHTML(it, 'tabindex="-1"') }), { item: id });
}
function equip(id) {
  const it = itemById(id); if (!it || !gradeUnlocked(it.g)) return;
  S.equip[it.slot] = it.id; recalc();
  log(`Надето: ${itemName(it)}.`, 'sys');
}
function unequip(id) { const it = itemById(id); if (!it) return; if (S.equip[it.slot] === it.id) S.equip[it.slot] = null; recalc(); }
function removeItem(id) { const it = itemById(id); if (!it) return; if (S.equip[it.slot] === id) S.equip[it.slot] = null; S.items = S.items.filter(i => i.id !== id); }

/* ---------- заточка ---------- */
function enchantHTML(it, st) {
  const k = scrollKind(it.slot), info = enchInfo(it), target = info.target, ch = info.ch;
  const nN = S.scrolls[k][it.g], nB = S.scrolls['b' + k][it.g];
  if (st.kind === 'n' && !nN && nB) st.kind = 'b';
  if (st.kind === 'b' && !nB && nN) st.kind = 'n';
  const have = st.kind === 'n' ? nN : nB;
  const cls = info.safe ? 'safe' : info.destructive ? 'deadly' : 'risky';
  const now = itemTotals(it), nxt = B.itemStats(it.slot, it.g, target);
  const kindName = k === 'w' ? 'оружие' : 'доспех', cy = B.crystalYield(it.slot, it.g, it.e);
  const maxed = it.e >= B.MAX_ENCH;
  const stops = [3, 5, 7, 10, 13, 16, 20].filter(n => n > B.SAFE);
  return sheet('Заточка', `<span class="gtext g${it.g}">${itemName(it)}</span>`, `
    <div class="forge"><canvas id="forgeCv"></canvas>${tileHTML(it, 'id="forgeTile" tabindex="-1"')}<div class="forge-result" id="forgeRes"></div></div>
    ${maxed ? `<p class="chance safe">Достигнута максимальная заточка <b>+${B.MAX_ENCH}</b></p>` : `
    <div class="ench-line"><span class="gtext g${it.g}">+${it.e}</span><span class="arrow">→</span><span>+${target}</span></div>
    <p class="chance ${cls}">Шанс успеха <b>${Math.round(ch * 100)}%</b>${info.safe ? ' · безопасно до +3' : info.pity > 0 ? ` · искра +${Math.round(info.pity * 100)}%` : ''}</p>
    <dl class="compare">${Object.keys(nxt).map(s => `<dt>${STAT_LABEL[s]}</dt><dd>${statStr(s, now[s])}</dd><dd class="up">${statStr(s, nxt[s])}</dd>`).join('')}</dl>
    <div class="scroll-pick" role="group" aria-label="Свиток">
      <button data-act="pick" data-v="n" aria-pressed="${st.kind === 'n'}" ${nN ? '' : 'disabled'}><img src="${A.scrollIcon(k === 'w' ? 'weapon' : 'armor', it.g, false)}" alt=""><b>Свиток: ${kindName} ${B.GRADES[it.g].short}</b><span>Есть ${nN}</span></button>
      <button data-act="pick" data-v="b" aria-pressed="${st.kind === 'b'}" ${nB ? '' : 'disabled'}><img src="${A.scrollIcon(k === 'w' ? 'weapon' : 'armor', it.g, true)}" alt=""><b>Благословенный</b><span>Есть ${nB}</span></button>
    </div>
    ${info.safe ? '<p class="note">Безопасная заточка: предмет не пострадает.</p>'
      : st.kind === 'b' ? '<p class="note">Благословенный свиток: при неудаче заточка сбросится до +0, предмет уцелеет.</p>'
      : info.destructive ? `<p class="note warn">При неудаче предмет разрушится и превратится в ${fmt(cy)} ${plural(cy, CRY_W)}. Выше +7 рискуйте только с запасом.</p>`
      : `<p class="note">При неудаче заточка откатится до +${B.ENCH.fallback}, предмет уцелеет. Каждая неудача даёт искру: +6% к следующей попытке.</p>`}
    ${have ? `<div class="btn-row">
        <button class="buy pink" data-act="do-enchant" ${st.autoRun ? 'disabled' : ''}>Заточить</button>
        ${st.autoRun ? '<button class="buy ghost" data-act="auto-stop-run">Стоп</button>' : `<button class="buy ghost" data-act="auto-enchant">Авто до +${st.autoStop}</button>`}
      </div>
      <div class="auto-row" role="group" aria-label="Авто-заточка до">
        <span>Авто до</span>
        ${stops.map(n => `<button class="auto-stop ${st.autoStop === n ? 'on' : ''}" data-act="auto-stop" data-n="${n}" ${st.autoRun ? 'disabled' : ''}>+${n}</button>`).join('')}
      </div>
      <p class="note auto-status" id="autoStatus">${st.autoRun ? 'Авто-заточка идёт…' : 'Авто точит, пока не достигнет цели, не кончатся свитки или не сломается вещь.'}</p>`
      : `<button class="buy wide" data-act="buy-scrolls" data-g="${it.g}">Нет свитков: купить в магазине</button>`}`}`);
}
function openEnchant(id) {
  const it = itemById(id); if (!it || it.g === 0) return;
  const prev = modalState && modalState.enchant ? modalState : null;
  const st = {
    enchant: true, item: id, kind: prev ? prev.kind : 'n', busy: false, power: 0, parts: [], t: 0, color: '#ff8fc1',
    autoRun: false, autoStop: S.settings.autoEnchantTo || 7, breaks: 0,
  };
  openModal(enchantHTML(it, st), st);
  startForge(st);
}
function startForge(st) {
  const cv = $('forgeCv'); if (!cv) return;
  const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const c = cv.getContext('2d');
  let lastT = performance.now();
  const loop = now => {
    if (!modalState || modalState !== st) return;
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; st.t += dt;
    c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
    A.drawMagicCircle(c, r.width / 2, r.height / 2, Math.min(r.width, r.height) * .4, st.t, st.power, st.color);
    for (const p of st.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    st.parts = st.parts.filter(p => p.t < p.life);
    for (const p of st.parts) {
      c.save(); c.globalAlpha = 1 - p.t / p.life; c.fillStyle = p.c; c.translate(p.x, p.y); c.rotate(p.t * 6);
      if (p.shard) { c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .6, 0); c.lineTo(0, p.s); c.lineTo(-p.s * .6, 0); c.closePath(); c.fill(); }
      else { c.fillRect(-p.s / 2, -p.s * 1.5, p.s, p.s * 3); c.fillRect(-p.s * 1.5, -p.s / 2, p.s * 3, p.s); }
      c.restore();
    }
  };
  st.raf = requestAnimationFrame(loop);
  st.cv = r;
}
function burst(st, color, shard, n) {
  const w = st.cv.width, h = st.cv.height;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, sp = 80 + rnd() * 220;
    st.parts.push({ x: w / 2, y: h / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: shard ? 260 : 40, t: 0, life: .8 + rnd() * .6, c: Array.isArray(color) ? color[i % color.length] : color, s: 3 + rnd() * 4, shard });
  }
}
/* одно испытание: меняет состояние и возвращает исход */
function enchantOnce(it, key) {
  const target = it.e + 1, info = enchInfo(it), blessed = key[0] === 'b';
  S.stats.enchants++; quest('enchant');
  S.scrolls[key][it.g]--;
  if (rnd() < info.ch) {
    it.e = target; it.pt = 0;
    S.stats.best = Math.max(S.stats.best, target);
    autoEquipBest(it.slot);
    recalc(); checkAch(); updateSideButtons();
    return { r: 'ok', target };
  }
  if (blessed) {
    const was = it.e; it.e = 0; it.pt = 0; recalc();
    return { r: 'reset', was };
  }
  if (info.destructive) {
    const cry = B.crystalYield(it.slot, it.g, it.e), nm = itemName(it), slot = it.slot, g = it.g;
    removeItem(it.id); S.crystals += cry; S.stats.breaks++; autoEquipBest(slot); recalc();
    return { r: 'destroyed', cry, nm, slot, g };
  }
  const was = it.e; it.e = B.ENCH.fallback; it.pt = (it.pt || 0) + 1; recalc();
  return { r: 'fell', was, to: B.ENCH.fallback, pt: it.pt };
}
function showEnchantResult(st, out, it) {
  const res = $('forgeRes'), tile = $('forgeTile');
  if (!res) return;
  if (out.r === 'ok') {
    st.color = '#ffd760'; burst(st, ['#ffd760', '#ffffff', '#ff8fc1'], false, 34);
    res.className = 'forge-result ok'; res.innerHTML = `+${out.target} Успех!`;
    if (it) log(`${B.NAMES[it.slot][it.g]} заточен до +${out.target}.`, 'good');
    AU.sfx('success');
  } else if (out.r === 'reset') {
    st.color = '#7cc8ff'; burst(st, ['#7cc8ff', '#ffffff'], false, 22);
    res.className = 'forge-result reset'; res.innerHTML = `Неудача<small>Благословение спасло предмет: +${out.was} → +0.</small>`;
    AU.sfx('fail');
  } else if (out.r === 'fell') {
    st.color = '#ff9a5c'; burst(st, ['#ff9a5c', '#ffffff'], false, 22);
    res.className = 'forge-result reset'; res.innerHTML = `Неудача<small>+${out.was} → +${out.to}. Искра +${Math.round(Math.min(B.ENCH.pityMax, out.pt * B.ENCH.pityStep) * 100)}%.</small>`;
    AU.sfx('fail');
  } else if (out.r === 'destroyed') {
    st.color = '#ff5d73'; burst(st, ['#ff5d73', '#bfe9ff', '#ffffff'], true, 40);
    if (tile) tile.classList.add('shatter');
    res.className = 'forge-result bad'; res.innerHTML = `Предмет разрушен<small>+${fmt(out.cry)} ${plural(out.cry, CRY_W)}</small>`;
    AU.sfx('fail'); if (!RM) R.shake = .25;
  }
}
function doEnchant() {
  const st = modalState; if (!st || !st.enchant || st.busy || st.autoRun) return;
  const it = itemById(st.item); if (!it || it.e >= B.MAX_ENCH) return;
  const k = scrollKind(it.slot), key = (st.kind === 'b' ? 'b' : '') + k;
  if (S.scrolls[key][it.g] <= 0) return;
  st.busy = true;
  modal.querySelectorAll('button').forEach(b => b.disabled = true);
  AU.sfx('charge');
  const t0 = performance.now(), D = RM ? 250 : 900;
  const ramp = () => {
    if (modalState !== st) return;
    const p = Math.min(1, (performance.now() - t0) / D);
    st.power = p;
    if (p < 1) requestAnimationFrame(ramp);
    else {
      const out = enchantOnce(it, key);
      showEnchantResult(st, out, it);
      saveLocal();
      setTimeout(() => {
        if (modalState !== st) return;
        st.busy = false; st.power = 0; st.color = '#ff8fc1';
        if (out.r === 'destroyed') { handleBreak(st, out); return; }
        rerenderEnchant(st);
      }, out.r === 'destroyed' ? (RM ? 500 : 1200) : (RM ? 350 : 900));
      if (R.tab === 'gear') renderPanel();
    }
  };
  requestAnimationFrame(ramp);
}
/* авто-заточка до выбранного уровня */
async function autoEnchant() {
  const st = modalState;
  if (!st || !st.enchant || st.autoRun) return;
  const it0 = itemById(st.item); if (!it0) return;
  st.autoRun = true;
  st.resumeAuto = true;
  modal.querySelectorAll('button').forEach(b => b.disabled = true);
  let steps = 0;
  while (modalState === st && st.autoRun) {
    const it = itemById(st.item);
    if (!it || it.e >= st.autoStop || it.e >= B.MAX_ENCH) break;
    const k = scrollKind(it.slot);
    let key = (st.kind === 'b' ? 'b' : '') + k;
    if (S.scrolls[key][it.g] <= 0) {
      const alt = key[0] === 'b' ? k : 'b' + k;
      if (S.scrolls[alt][it.g] > 0) key = alt; else break;
    }
    st.busy = true; st.power = 0;
    const rampT0 = performance.now(), rampD = RM ? 60 : 220;
    while (performance.now() - rampT0 < rampD && modalState === st) {
      st.power = Math.min(1, (performance.now() - rampT0) / rampD);
      await new Promise(r => setTimeout(r, 25));
    }
    const out = enchantOnce(it, key);
    steps++;
    showEnchantResult(st, out, it);
    const cur = itemById(st.item);
    const label = $('autoStatus');
    if (label) label.textContent = `${cur ? '+' + cur.e : '—'} · шаг ${steps} · свитков ${cur ? S.scrolls[(st.kind === 'b' ? 'b' : '') + scrollKind(cur.slot)][cur.g] : 0}`;
    saveLocal();
    await new Promise(r => setTimeout(r, RM ? 100 : 260));
    if (out.r === 'destroyed') {
      st.autoRun = false;
      st.breaks = (st.breaks || 0) + 1;
      st.resumeAuto = !!S.settings.autoBuyBreak && st.breaks < 2;
      handleBreak(st, out);
      return;
    }
  }
  st.autoRun = false;
  st.busy = false;
  st.resumeAuto = false;
  saveLocal();
  if (modalState === st) {
    const it = itemById(st.item);
    if (it && it.e >= st.autoStop) toast(`Достигнуто +${it.e}`);
    else if (it) toast('Свитки закончились');
    rerenderEnchant(st);
  }
  if (R.tab === 'gear') renderPanel();
}
/* при сломе: результат, галочка «покупать заново» и кнопка */
function handleBreak(st, out) {
  st.busy = false;
  const sh = modal.querySelector('.sheet'); if (!sh) return;
  const price = B.price(out.slot, out.g);
  const on = !!S.settings.autoBuyBreak;
  const autoBuy = on && S.gold >= price;
  sh.querySelectorAll('.ench-line,.chance,.compare,.scroll-pick,.note,.wide,.auto-row,.btn-row,.forge-result,.auto-status').forEach(n => n.remove());
  sh.insertAdjacentHTML('beforeend', `
    <p class="note warn">${out.nm} разрушен и превратился в ${fmt(out.cry)} ${plural(out.cry, CRY_W)}.${(st.breaks || 0) >= 2 ? ' Авто остановлено после двух поломок.' : ''}</p>
    <label class="check-row"><input type="checkbox" id="autoBuyBox" ${on ? 'checked' : ''}><span>Покупать заново при сломе</span></label>
    <p class="note">Новый ${B.NAMES[out.slot][out.g]} стоит ${fmt(price)} золота. У вас ${fmt(S.gold)}.</p>
    <div class="btn-row">
      <button class="buy" data-act="buy-again" data-slot="${out.slot}" data-g="${out.g}" ${S.gold >= price ? '' : 'disabled'}>Купить заново за ${fmt(price)}</button>
      <button class="buy ghost" data-act="close">Закрыть</button>
    </div>`);
  const box = $('autoBuyBox');
  if (box) box.addEventListener('change', () => { S.settings.autoBuyBreak = box.checked; saveLocal(); });
  if (autoBuy) {
    setTimeout(() => {
      if (modalState !== st) return;
      const bought = buyItem(out.slot, out.g, { silent: true });
      if (bought) {
        toast(`Куплено заново: ${itemName(bought)}`);
        st.item = bought.id; st.busy = false; st.autoRun = false;
        rerenderEnchant(st);
        if (st.resumeAuto && modalState === st) setTimeout(() => autoEnchant(), RM ? 150 : 350);
      }
    }, RM ? 400 : 1100);
  }
}
function rerenderEnchant(st) {
  const it = itemById(st.item); if (!it) return;
  const sh = modal.querySelector('.sheet'); if (!sh) return;
  const tmp = document.createElement('div'); tmp.innerHTML = enchantHTML(it, st);
  const fresh = tmp.firstElementChild;
  const oldForge = sh.querySelector('.forge');
  const freshForge = fresh.querySelector('.forge');
  const freshRes = freshForge.querySelector('.forge-result');
  freshForge.replaceWith(oldForge);
  const nt = document.createElement('div'); nt.innerHTML = tileHTML(it, 'id="forgeTile" tabindex="-1"');
  oldForge.querySelector('.tile').replaceWith(nt.firstElementChild);
  let res = oldForge.querySelector('.forge-result');
  if (!res && freshRes) { oldForge.appendChild(freshRes); res = freshRes; }
  if (res) { res.className = 'forge-result'; res.innerHTML = ''; }
  sh.replaceWith(fresh);
}

/* ---------- магазин ---------- */
function unlockedGrade() { let g = 0; B.GRADES.forEach((gr, i) => { if (gradeUnlocked(i)) g = i; }); return g; }
function renderShop() {
  const seg = segHTML('shoptab', R.shopTab, [['gear', 'Снаряжение'], ['scrolls', 'Свитки'], ['gems', 'Самоцветы', !hud.shopDot.hidden]]);
  if (R.shopTab === 'scrolls') return seg + renderScrollShop();
  if (R.shopTab === 'gems') return seg + Monet.renderShop();
  const g = R.shopGrade, gr = B.GRADES[g], lvOk = gradeUnlocked(g);
  const chips = `<div class="grade-chips" role="group" aria-label="Грейд">${B.GRADES.map((x, i) =>
    `<button class="g${i}" data-act="shopgrade" data-g="${i}" aria-pressed="${i === g}">${x.short}${!gradeUnlocked(i) ? `<small>эт. ${x.stage}</small>` : ''}</button>`).join('')}</div>`;
  const rows = B.SLOTS.map(sl => {
    const p = B.price(sl.id, g), st = B.itemStats(sl.id, g, 0);
    const main = Object.keys(st).map(k => `${STAT_LABEL[k]} ${statStr(k, st[k])}`).join(', ');
    const own = S.items.filter(i => i.slot === sl.id && i.g === g).length;
    return `<li class="row">${tileHTML({ slot: sl.id, g, e: 0 }, 'tabindex="-1"')}
      <div class="row-main"><b class="gtext g${g}">${B.NAMES[sl.id][g]}</b><span class="meta">${sl.name}${own ? ` · у вас: ${own}` : ''}</span><span class="val">${main}</span></div>
      ${lvOk ? `<button class="buy ${p > S.gold ? 'poor' : ''}" data-act="buyitem" data-slot="${sl.id}" data-g="${g}" data-cost="${p}"><img src="${A.miscIcon('gold', 32)}" alt="">${fmt(p)}</button>`
        : `<button class="buy" disabled>Этап ${gr.stage}</button>`}</li>`;
  }).join('');
  return `${seg}${chips}
    <p class="sub">${lvOk ? `${gr.label}: надевается лучшая по силе и заточке вещь слота. Старая уходит в сумку.` : `${gr.label} откроется на этапе ${gr.stage}.`}</p>
    <ul class="rows">${rows}</ul>`;
}
function renderScrollShop() {
  const g = R.scrollGrade;
  const chips = `<div class="grade-chips" role="group" aria-label="Грейд свитков">${B.GRADES.slice(1).map((x, j) => {
    const i = j + 1; return `<button class="g${i}" data-act="scrollgrade" data-g="${i}" aria-pressed="${i === g}">${x.short}</button>`; }).join('')}</div>`;
  const items = [
    ['w', 'weapon', false, 'Свиток: улучшить оружие', B.SCROLL_COST.weapon[g]],
    ['a', 'armor', false, 'Свиток: улучшить доспех', B.SCROLL_COST.armor[g]],
    ['bw', 'weapon', true, 'Благословенный свиток: оружие', B.SCROLL_COST.weapon[g] * B.BLESS_MULT],
    ['ba', 'armor', true, 'Благословенный свиток: доспех', B.SCROLL_COST.armor[g] * B.BLESS_MULT],
  ];
  return `${chips}
    <p class="sub">Кристаллы дают разрушенные при заточке вещи, кристаллизация из сумки и монстры. У вас <b class="cry-text">${fmt(S.crystals)}</b> ${plural(S.crystals, CRY_W)}.</p>
    <ul class="rows">${items.map(([k, kind, bl, name, cost]) => `<li class="row">
      <img src="${A.scrollIcon(kind, g, bl)}" alt="">
      <div class="row-main"><b>${name} (${B.GRADES[g].short})</b><span class="meta">В запасе: ${S.scrolls[k][g]}</span>
      <span class="val">${bl ? 'При неудаче заточка сбрасывается до +0' : 'При неудаче выше +3 предмет разрушается'}</span></div>
      <button class="buy ${cost > S.crystals ? 'poor' : ''}" data-act="buyscroll" data-k="${k}" data-g="${g}" data-cost="${cost}" data-cur="cry"><img src="${A.miscIcon('crystal', 32)}" alt="">${fmt(cost)}</button></li>`).join('')}</ul>`;
}
function buyItem(slot, g, opts = {}) {
  const p = B.price(slot, g);
  if (!gradeUnlocked(g)) { toast(`Грейд откроется на этапе ${B.GRADES[g].stage}`); return null; }
  if (S.gold < p) { toast('Не хватает золота'); return null; }
  S.gold -= p;
  const it = { id: S.nextId++, slot, g, e: 0, pt: 0, opts: B.rollOpts(rnd, g) };
  S.items.push(it);
  if (!S.codex[slot + ':' + g]) { S.codex[slot + ':' + g] = 1; log(`Коллекция: ${B.NAMES[slot][g]} (${B.GRADES[g].short}) добавлен.`, 'good'); }
  const best = autoEquipBest(slot);
  recalc();
  if (!opts.silent) {
    if (best && best.id === it.id) toast(`Надето: ${itemName(it)}`);
    else toast(`${itemName(it)} в сумке${best ? ` · надет ${itemName(best)}` : ''}`);
  }
  log(`Куплено: ${itemName(it)}.`, 'sys');
  AU.sfx('buy');
  return it;
}
function buyScroll(k, g) {
  const base = k.endsWith('w') ? B.SCROLL_COST.weapon[g] : B.SCROLL_COST.armor[g];
  const cost = base * (k[0] === 'b' ? B.BLESS_MULT : 1);
  if (S.crystals < cost) { toast('Не хватает кристаллов'); return; }
  S.crystals -= cost; S.scrolls[k][g]++;
  AU.sfx('buy'); toast('Свиток добавлен в запас');
}

/* ---------- карта ---------- */
const thumbs = new Map();
function zoneThumb(z) {
  const key = z % ZONES.length;
  if (thumbs.has(key)) return thumbs.get(key);
  const c = document.createElement('canvas'); c.width = 520; c.height = 144;
  const x = c.getContext('2d');
  A.drawBackground(x, 520, 144, 120, ZONES[key], 300 + key * 170, 2);
  x.fillStyle = 'rgba(15,8,35,.25)'; x.fillRect(0, 0, 520, 144);
  const url = c.toDataURL('image/jpeg', .8); thumbs.set(key, url); return url;
}
function openMap() {
  const maxZ = Math.floor(S.maxStage / 10), cards = [];
  for (let z = maxZ; z >= 0; z--) {
    const Z = zoneOf(z * 10), top = dropGradeTop(z);
    const stages = Array.from({ length: 10 }, (_, i) => {
      const s = z * 10 + i, open = s <= S.maxStage;
      return `<button data-act="travel" data-s="${s}" class="${s === S.stage ? 'here' : ''} ${s < S.maxStage ? 'boss-done' : ''}" ${open ? '' : 'disabled'} aria-label="Этап ${Z.z + 1}-${i + 1}">${i + 1}</button>`;
    }).join('');
    cards.push(`<section class="card zone">
      <div class="zone-art" style="background-image:url(${zoneThumb(z)})"><h3>${Z.z + 1}. ${Z.title}</h3></div>
      <div class="zone-body"><p class="sub">Свитки грейда <b class="gtext g${top}">${B.GRADES[top].short}</b>${top > 1 ? ' и ниже' : ''} · босс: ${Z.boss[2]}</p>
      <div class="stages">${stages}</div></div></section>`);
  }
  openModal(sheet('Карта', `Рекорд: этап ${zoneOf(S.maxStage).num}. Чтобы остаться на этапе и фармить, выключите «Авто» у кнопки босса.`, cards.join('')));
}
function travel(s) {
  if (s > S.maxStage) return;
  S.stage = s; S.kills = 0; R.boss = null; R.bossPending = false; R.warn = 0; R.monsters = [];
  const z = zoneOf(s);
  log(`Переход: ${z.title}, этап ${z.num}.`, 'sys');
  closeModal(); updateHudStatic(); updateMusic();
}

/* ---------- настройки ---------- */
function openSettings() {
  const cloud = Cloud.kind === 'yandex' ? 'Прогресс сохраняется в аккаунте Яндекс Игр.' : Cloud.kind === 'artifact' ? 'Прогресс сохраняется в браузере и в облаке, доступен на других устройствах.' : 'Прогресс сохраняется в этом браузере.';
  openModal(sheet('Настройки', esc(heroName()) + ` · уровень ${S.level}`, `
    <label class="slider"><img src="${A.miscIcon('music', 40)}" alt=""><span>Музыка</span><input type="range" id="volMusic" min="0" max="100" value="${Math.round(S.settings.music * 100)}"></label>
    <label class="slider"><img src="${A.miscIcon('crit', 40)}" alt=""><span>Эффекты</span><input type="range" id="volSfx" min="0" max="100" value="${Math.round(S.settings.sfx * 100)}"></label>
    <div class="btn-row"><button class="buy ghost" data-act="look">Сменить облик и имя</button></div>
    <p class="note">${cloud}</p>
    ${P.mode === 'local' ? '<p class="note">Тестовая версия: реклама и покупки работают в демонстрационном режиме, деньги не списываются. На Яндекс Играх их обрабатывает площадка.</p>' : ''}
    <div class="danger-zone" id="resetZone"><button class="link-btn" data-act="reset">Начать игру заново</button></div>
    <p class="note version">Клинок Сакуры · версия 4.1</p>`));
}
