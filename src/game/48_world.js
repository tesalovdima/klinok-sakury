/* ---------- мировой босс: общий HP, вклад игроков, награды ----------
   Сервер считает урон всех игроков и хранит вклад. Клиент только показывает
   состояние и отправляет удар; награду выдаёт сервер один раз за босса. */

const World = {
  data: null, at: 0, busy: false, loading: false,
  async load(force) {
    if (!S || !S.hero || this.loading) return;
    if (!force && Date.now() - this.at < 12000) return;
    this.loading = true; this.at = Date.now();
    const ok = await NET.probe();
    const r = ok ? await NET.worldGet(S.pid) : null;
    this.loading = false;
    this.data = r && r.ok ? r : { off: true };
    if (R.tab === 'trials' && R.trialSeg === 'world') renderPanel();
  },
  async hit() {
    if (this.busy || !this.data || this.data.off || this.data.killed) return;
    this.busy = true; renderPanel();
    const dmg = Math.max(1, Math.round(R.power * 180));
    const r = await NET.worldHit({ pid: S.pid, name: heroName(), damage: dmg, level: S.level, power: R.power });
    this.busy = false;
    if (!r) {
      this.data = { off: true };
      toast('Сервер недоступен');
    } else if (!r.ok) {
      this.data = r;
      if (r.error === 'slow') toast(`Босс ещё не остыл: ${r.wait} с`);
      else if (r.error === 'killed') toast('Босс уже повержен — заберите награду');
    } else {
      this.at = Date.now();
      this.data = r;
      log(`Мировой босс: удар на ${fmt(r.hit)} урона.`, 'good');
      AU.sfx('hit');
    }
    renderPanel();
  },
  async claim() {
    const r = await NET.worldClaim(S.pid);
    if (!r || !r.ok || !r.rewards) { toast('Награда пока недоступна'); return; }
    grant(r.rewards, true);
    this.data = Object.assign({}, this.data, { claimable: false, rewards: r.rewards });
    toast('Награда босса: ' + rewardText(r.rewards));
    renderPanel();
  },
};

function renderWorld() {
  if (!unlockOk('world')) return lockCard('world', 'Мировой босс');
  const d = World.data;
  if (!d) { World.load(); return `<section class="card"><p class="sub">Загружаем мирового босса…</p></section>`; }
  if (d.off) return `<section class="card lock-card"><img src="${A.miscIcon('boss', 64)}" alt="">
    <div class="row-main"><b>Мировой босс</b><span class="meta">Общий босс живёт на сервере игры. На Яндекс Играх его нет.</span></div>
    <button class="buy ghost small" data-act="world-retry">Проверить</button></section>`;
  const wait = Math.max(0, (d.wait || 0) - Math.floor((Date.now() - (World.at || 0)) / 1000));
  const hpPct = Math.max(0, Math.min(100, d.hp / d.maxHp * 100));
  const top = (d.top || []).slice(0, 8);
  const dmg = Math.max(1, Math.round(R.power * 180));
  const killed = !!d.killed;
  return `
    <section class="card world-card">
      <div class="world-head"><img src="${A.miscIcon('boss', 64)}" alt="">
        <div><h2>${esc(d.name || 'Мировой босс')}</h2>
          <p class="sub">Общий босс · игроков в бою: <b>${d.players || 0}</b> · урон всех: <b>${fmt(d.maxHp - d.hp)}</b></p></div>
        <button class="link-btn" data-act="world-refresh">Обновить</button></div>
      <div class="bar hp big"><i style="width:${hpPct}%"></i></div>
      <p class="sub">${fmt(d.hp)} / ${fmt(d.maxHp)} HP · ${pct(d.hp / d.maxHp)}</p>
      ${killed ? `<div class="world-dead"><b>Босс повержен!</b>
        <span class="sub">${d.rewards ? 'Награда получена: ' + rewardText(d.rewards) : d.claimable ? 'Заберите награду за вклад' : 'Награды уже выданы'}</span>
        ${d.claimable ? `<button class="buy pink" data-act="world-claim">Забрать награду</button>` : ''}
        <span class="meta">Новый босс через ${left((d.respawnIn || 0) * 1000)}</span></div>`
      : `<div class="world-me"><span>Ваш вклад: <b>${fmt(d.myDamage || 0)}</b>${d.rank ? ` · место <b>#${d.rank}</b>` : ''}</span>
        <span class="sub">Удар: ~${fmt(dmg)} урона</span></div>`}
      ${top.length ? `<ul class="rows world-top">${top.map((r, i) => `<li class="row">
        <span class="place">${i + 1}</span><div class="row-main"><b>${esc(r.name)}</b></div><span class="val">${fmt(r.damage)}</span></li>`).join('')}</ul>`
      : '<p class="sub">Вы первый — нанесите удар, и ваш вклад появится в таблице.</p>'}
      <div class="btn-row">
        ${killed ? '' : `<button class="buy pink" data-act="world-hit" ${wait > 0 || World.busy ? 'disabled' : ''}>${World.busy ? 'Бьём…' : wait > 0 ? `Через ${wait} с` : 'Ударить'}</button>`}
        <button class="buy ghost" data-act="world-refresh">Обновить</button>
      </div>
      <p class="note">Удар раз в 45 секунд. Награда делится по вкладу: самоцветы, кристаллы и лепестки сакуры. Босс обновляется каждый день.</p>
    </section>
    <section class="card world-rewards">
      <div class="card-head"><h3>Награда за вклад</h3></div>
      <ul class="rows">
        <li class="row"><img src="${A.miscIcon('gem', 48)}" alt=""><div class="row-main"><b>Самоцветы</b><span class="meta">от 60 до 360 — зависит от доли урона</span></div></li>
        <li class="row"><img src="${A.miscIcon('crystal', 48)}" alt=""><div class="row-main"><b>Кристаллы</b><span class="meta">от 300 до 1800</span></div></li>
        <li class="row"><img src="${A.miscIcon('petal', 48)}" alt=""><div class="row-main"><b>Лепестки сакуры</b><span class="meta">1–3 за вклад в победу</span></div></li>
      </ul>
      <p class="note">Награда выдаётся один раз за босса. Чем выше место в топе — тем больше доля.</p>
    </section>
    <section class="card world-how">
      <div class="card-head"><h3>Как работает босс</h3></div>
      <ul class="bullets">
        <li>Удар раз в 45 секунд: урон зависит от вашей боевой мощи.</li>
        <li>HP общий — бьют все игроки сервера, вклад виден в топе.</li>
        <li>Каждый день новый босс. После победы следующий — через 10 минут.</li>
      </ul>
    </section>`;
}
