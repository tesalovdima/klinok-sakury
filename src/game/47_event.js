/* ---------- сезонное событие «Праздник сакуры» ----------
   Валюта события — ханами. Она копится с убийств, боссов, подземелий,
   арены и башни, тратится в магазине события. Сезон длится 14 дней и
   начинается заново, поэтому событие всегда доступно новым игрокам. */

function eventInfo() {
  const span = B.EVENT.seasonDays * 864e5, now = Date.now();
  let idx = Math.floor((now - B.EVENT.epoch) / span);
  if (!Number.isFinite(idx) || idx < 0) idx = 0;
  const start = B.EVENT.epoch + idx * span;
  return { idx, start, end: start + span, left: start + span - now };
}

function ensureEvent() {
  const info = eventInfo();
  if (!S.event || typeof S.event !== 'object') S.event = { season: info.idx, coins: 0, total: 0, claimed: [], bought: {}, day: '', today: 0 };
  if (S.event.season !== info.idx) {
    S.event.season = info.idx;
    S.event.coins = 0;
    S.event.total = 0;
    S.event.claimed = [];
    S.event.bought = {};
    S.event.day = '';
    S.event.today = 0;
  }
  if (!Array.isArray(S.event.claimed)) S.event.claimed = [];
  if (!S.event.bought || typeof S.event.bought !== 'object') S.event.bought = {};
  return info;
}

function addEventCoins(n, src) {
  if (!S || !n) return;
  ensureEvent();
  if (src === 'kill') {
    const d = dayKey();
    if (S.event.day !== d) { S.event.day = d; S.event.today = 0; }
    if (S.event.today >= B.EVENT.killCap) return;
    n = Math.min(n, B.EVENT.killCap - S.event.today);
    if (n <= 0) return;
    S.event.today += n;
  }
  S.event.coins += n;
  S.event.total += n;
  if (Date.now() - (R.evSave || 0) > 5000) { R.evSave = Date.now(); saveLocal(); }
}
function addLanternDrop(src) {
  if (src === 'kill') { if (rnd() < B.LANTERN.killChance) addLantern(1, 'kill'); }
  else addLantern(B.LANTERN[src] || 0, src);
}

function eventReadyCount() {
  ensureEvent();
  return B.EVENT.milestones.reduce((n, m, i) => n + (!S.event.claimed.includes(i) && S.event.total >= m.at ? 1 : 0), 0);
}

function eventBannerHTML() {
  const info = ensureEvent();
  const ready = eventReadyCount();
  const readyTxt = ready ? ` · ${ready} ${plural(ready, ['награда', 'награды', 'наград'])}` : '';
  return `<section class="card event-card">
    <div class="ev-badge"><img src="${A.miscIcon('petal', 64)}" alt=""></div>
    <div class="row-main"><b>${B.EVENT.name}${readyTxt}</b>
      <span class="meta">Сезон ${info.idx + 1} · до конца ${left(info.left)}</span>
      <span class="ev-coins">${fmt(S.event.coins)} ханами</span></div>
    <button class="buy pink small" data-act="event-open">Открыть</button>
  </section>`;
}

function trackHTML() {
  return `<ul class="rows ev-track">${B.EVENT.milestones.map((m, i) => {
    const claimed = S.event.claimed.includes(i), ready = S.event.total >= m.at;
    const w = Math.min(100, S.event.total / m.at * 100);
    return `<li class="row ev-row ${claimed ? 'done' : ready ? 'ready' : ''}">
      <img src="${A.miscIcon('petal', 48)}" alt="">
      <div class="row-main"><b>${rewardText(m.rw)}</b>
        <div class="bar mini"><i style="width:${w}%"></i></div>
        <span class="meta">${fmt(Math.min(S.event.total, m.at))} / ${fmt(m.at)} ханами</span></div>
      ${claimed ? '<span class="val ok">получено</span>' : ready
        ? `<button class="buy pink small" data-act="event-claim" data-i="${i}">Забрать</button>`
        : '<span class="val">🔒</span>'}
    </li>`;
  }).join('')}</ul>`;
}

function shopHTML() {
  return `<ul class="rows">${B.EVENT.shop.map(s => {
    const used = S.event.bought[s.id] || 0, leftN = s.limit - used;
    const can = leftN > 0 && S.event.coins >= s.cost;
    return `<li class="row"><img src="${A.miscIcon(s.ico, 48)}" alt="">
      <div class="row-main"><b>${s.name}</b><span class="meta">${rewardText(s.rw)} · осталось ${leftN} из ${s.limit}</span></div>
      <button class="buy ${can ? 'pink' : 'ghost'}" data-act="event-buy" data-id="${s.id}" ${can ? '' : 'disabled'}>
        <img src="${A.miscIcon('petal', 28)}" alt="">${s.cost}</button>
    </li>`;
  }).join('')}</ul>`;
}

function openEvent(tab) {
  const info = ensureEvent();
  R.eventTab = tab || R.eventTab || 'track';
  const ready = B.EVENT.milestones.map((m, i) => i).filter(i => !S.event.claimed.includes(i) && S.event.total >= B.EVENT.milestones[i].at);
  const tabs = [['track', `Награды${ready.length ? ' · ' + ready.length : ''}`], ['shop', 'Магазин']]
    .map(([v, l]) => `<button data-act="event-tab" data-v="${v}" aria-pressed="${R.eventTab === v}">${l}</button>`).join('');
  openModal(sheet(B.EVENT.name, `Сезон ${info.idx + 1} · до конца ${left(info.left)}`, `
    <div class="event-banner"><span>${B.EVENT.name}</span></div>
    <div class="ev-balance"><img src="${A.miscIcon('petal', 40)}" alt=""><b>${fmt(S.event.coins)}</b><span>ханами</span></div>
    <div class="ev-tabs" role="group">${tabs}</div>
    ${R.eventTab === 'shop' ? shopHTML() : trackHTML()}
    ${R.eventTab === 'track' && ready.length > 1 ? `<button class="buy pink ev-all" data-act="event-claim-all">Забрать всё · ${ready.length}</button>` : ''}
    <p class="note">Ханами падают с монстров (до ${B.EVENT.killCap} в день), боссов, подземелий, арены и башни. Сезон меняется каждые ${B.EVENT.seasonDays} дней.</p>
  `));
}

function eventClaim(i) {
  ensureEvent();
  const m = B.EVENT.milestones[i];
  if (!m || S.event.claimed.includes(i) || S.event.total < m.at) return;
  S.event.claimed.push(i);
  grant(m.rw, true);
  toast('Награда праздника: ' + rewardText(m.rw));
  saveLocal();
  openEvent('track');
}

function eventClaimAll() {
  ensureEvent();
  const got = [];
  B.EVENT.milestones.forEach((m, i) => {
    if (S.event.claimed.includes(i) || S.event.total < m.at) return;
    S.event.claimed.push(i);
    grant(m.rw, true);
    got.push(rewardText(m.rw));
  });
  if (!got.length) return;
  toast('Праздник: ' + got.join(', '));
  saveLocal();
  openEvent('track');
}

function eventBuy(id) {
  ensureEvent();
  const s = B.EVENT.shop.find(x => x.id === id);
  if (!s) return;
  const used = S.event.bought[id] || 0;
  if (used >= s.limit || S.event.coins < s.cost) return;
  S.event.coins -= s.cost;
  S.event.bought[id] = used + 1;
  grant(s.rw, true);
  toast('Куплено: ' + rewardText(s.rw));
  saveLocal();
  openEvent('shop');
}

/* ---------- событие «Ночь фонарей» ---------- */
function lanternInfo() {
  const span = B.LANTERN.seasonDays * 864e5, now = Date.now();
  let idx = Math.floor((now - B.LANTERN.epoch) / span);
  if (!Number.isFinite(idx) || idx < 0) idx = 0;
  const start = B.LANTERN.epoch + idx * span;
  return { idx, start, end: start + span, left: start + span - now };
}
function ensureLantern() {
  const info = lanternInfo();
  if (!S.lantern || typeof S.lantern !== 'object') S.lantern = { season: info.idx, coins: 0, total: 0, claimed: [], bought: {}, day: '', today: 0 };
  if (S.lantern.season !== info.idx) {
    S.lantern = { season: info.idx, coins: 0, total: 0, claimed: [], bought: {}, day: '', today: 0 };
  }
  if (!Array.isArray(S.lantern.claimed)) S.lantern.claimed = [];
  if (!S.lantern.bought || typeof S.lantern.bought !== 'object') S.lantern.bought = {};
  return info;
}
function addLantern(n, src) {
  if (!S || !n) return;
  ensureLantern();
  if (src === 'kill') {
    const d = dayKey();
    if (S.lantern.day !== d) { S.lantern.day = d; S.lantern.today = 0; }
    if (S.lantern.today >= B.LANTERN.killCap) return;
    n = Math.min(n, B.LANTERN.killCap - S.lantern.today);
    if (n <= 0) return;
    S.lantern.today += n;
  }
  S.lantern.coins += n;
  S.lantern.total += n;
  if (Date.now() - (R.lnSave || 0) > 5000) { R.lnSave = Date.now(); saveLocal(); }
}
function lanternReadyCount() {
  ensureLantern();
  return B.LANTERN.milestones.reduce((n, m, i) => n + (!S.lantern.claimed.includes(i) && S.lantern.total >= m.at ? 1 : 0), 0);
}
function lanternBannerHTML() {
  const info = ensureLantern();
  const ready = lanternReadyCount();
  const readyTxt = ready ? ` · ${ready} ${plural(ready, ['награда', 'награды', 'наград'])}` : '';
  return `<section class="card event-card lantern-card">
    <div class="ev-badge"><img src="${A.miscIcon('lantern', 64)}" alt=""></div>
    <div class="row-main"><b>${B.LANTERN.name}${readyTxt}</b>
      <span class="meta">Сезон ${info.idx + 1} · до конца ${left(info.left)}</span>
      <span class="ev-coins">${fmt(S.lantern.coins)} фонариков</span></div>
    <button class="buy pink small" data-act="lantern-open">Открыть</button>
  </section>`;
}
function lanternTrackHTML() {
  return `<ul class="rows ev-track">${B.LANTERN.milestones.map((m, i) => {
    const claimed = S.lantern.claimed.includes(i), ready = S.lantern.total >= m.at;
    const w = Math.min(100, S.lantern.total / m.at * 100);
    return `<li class="row ev-row ${claimed ? 'done' : ready ? 'ready' : ''}">
      <img src="${A.miscIcon('lantern', 48)}" alt="">
      <div class="row-main"><b>${rewardText(m.rw)}</b>
        <div class="bar mini"><i style="width:${w}%"></i></div>
        <span class="meta">${fmt(Math.min(S.lantern.total, m.at))} / ${fmt(m.at)} фонариков</span></div>
      ${claimed ? '<span class="val ok">получено</span>' : ready
        ? `<button class="buy pink small" data-act="lantern-claim" data-i="${i}">Забрать</button>`
        : '<span class="val">🔒</span>'}
    </li>`;
  }).join('')}</ul>`;
}
function lanternShopHTML() {
  return `<ul class="rows">${B.LANTERN.shop.map(s => {
    const used = S.lantern.bought[s.id] || 0, leftN = s.limit - used;
    const can = leftN > 0 && S.lantern.coins >= s.cost;
    return `<li class="row"><img src="${A.miscIcon(s.ico, 48)}" alt="">
      <div class="row-main"><b>${s.name}</b><span class="meta">${rewardText(s.rw)} · осталось ${leftN} из ${s.limit}</span></div>
      <button class="buy ${can ? 'pink' : 'ghost'}" data-act="lantern-buy" data-id="${s.id}" ${can ? '' : 'disabled'}>
        <img src="${A.miscIcon('lantern', 28)}" alt="">${s.cost}</button>
    </li>`;
  }).join('')}</ul>`;
}
function openLantern(tab) {
  const info = ensureLantern();
  R.lanternTab = tab || R.lanternTab || 'track';
  const ready = B.LANTERN.milestones.map((m, i) => i).filter(i => !S.lantern.claimed.includes(i) && S.lantern.total >= B.LANTERN.milestones[i].at);
  const tabs = [['track', `Награды${ready.length ? ' · ' + ready.length : ''}`], ['shop', 'Магазин']]
    .map(([v, l]) => `<button data-act="lantern-tab" data-v="${v}" aria-pressed="${R.lanternTab === v}">${l}</button>`).join('');
  openModal(sheet(B.LANTERN.name, `Сезон ${info.idx + 1} · до конца ${left(info.left)}`, `
    <div class="event-banner lantern"><span>${B.LANTERN.name}</span></div>
    <div class="ev-balance"><img src="${A.miscIcon('lantern', 40)}" alt=""><b>${fmt(S.lantern.coins)}</b><span>фонариков</span></div>
    <div class="ev-tabs" role="group">${tabs}</div>
    ${R.lanternTab === 'shop' ? lanternShopHTML() : lanternTrackHTML()}
    ${R.lanternTab === 'track' && ready.length > 1 ? `<button class="buy pink ev-all" data-act="lantern-claim-all">Забрать всё · ${ready.length}</button>` : ''}
    <p class="note">Фонарики падают с монстров (до ${B.LANTERN.killCap} в день), боссов, подземелий, арены и башни. Сезон меняется каждые ${B.LANTERN.seasonDays} дней.</p>
  `));
}
function lanternClaim(i) {
  ensureLantern();
  const m = B.LANTERN.milestones[i];
  if (!m || S.lantern.claimed.includes(i) || S.lantern.total < m.at) return;
  S.lantern.claimed.push(i);
  grant(m.rw, true);
  toast('Награда ночи: ' + rewardText(m.rw));
  saveLocal();
  openLantern('track');
}
function lanternClaimAll() {
  ensureLantern();
  const got = [];
  B.LANTERN.milestones.forEach((m, i) => {
    if (S.lantern.claimed.includes(i) || S.lantern.total < m.at) return;
    S.lantern.claimed.push(i);
    grant(m.rw, true);
    got.push(rewardText(m.rw));
  });
  if (!got.length) return;
  toast('Ночь фонарей: ' + got.join(', '));
  saveLocal();
  openLantern('track');
}
function lanternBuy(id) {
  ensureLantern();
  const s = B.LANTERN.shop.find(x => x.id === id);
  if (!s) return;
  const used = S.lantern.bought[id] || 0;
  if (used >= s.limit || S.lantern.coins < s.cost) return;
  S.lantern.coins -= s.cost;
  S.lantern.bought[id] = used + 1;
  grant(s.rw, true);
  toast('Куплено: ' + rewardText(s.rw));
  saveLocal();
  openLantern('shop');
}
