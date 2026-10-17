/* ===== Монетизация: покупки, реклама за награду, межэкранная реклама ===== */
const Monet = {
  adsOn: () => true,
  giftReady() { return S && (S.ads.gems < B.ADS.gemsPerDay || !S.ads.freeSummon || Date.now() > S.boost.goldUntil); },
  async maybeInterstitial() {
    if (!S || S.shop.noAds || P.mode !== 'yandex') return;
    if (S.maxStage < 10) return;                                  // не мешаем в начале игры
    if (Date.now() - R.sessionStart < 240000) return;             // первые 4 минуты сессии — без рекламы
    if (Date.now() - R.lastInter < B.ADS.interstitialGap * 1000) return;
    R.lastInter = Date.now();
    await P.interstitial();
  },
  async rewarded(place) {
    const ok = await P.rewarded(place);
    if (!ok) { toast('Награда не получена: реклама не досмотрена'); return false; }
    quest('ad');
    return true;
  },
  async adGems() {
    if (S.ads.gems >= B.ADS.gemsPerDay) return;
    if (!await this.rewarded('gems')) return;
    S.ads.gems++; grant({ gems: B.ADS.gems });
    refreshAfterReward();
  },
  async adBoost() {
    if (S.ads.boosts >= 6) { toast('На сегодня хватит: возвращайтесь завтра'); return; }
    if (!await this.rewarded('boost')) return;
    S.boost.goldUntil = Math.max(Date.now(), S.boost.goldUntil) + B.ADS.goldBoostMin * 60000;
    S.ads.boosts++;
    toast(`Золото ×2 на ${B.ADS.goldBoostMin} минут`); AU.sfx('buff');
    refreshAfterReward();
  },
  async adSummon() {
    if (S.ads.freeSummon) return;
    if (!await this.rewarded('summon')) return;
    S.ads.freeSummon = true;
    summon(1, 'free');
  },
  async purchase(id) {
    const p = B.IAP_BY[id]; if (!p) return;
    if (p.once && ((id === 'starter' && S.shop.starter) || (id === 'noads' && S.shop.noAds))) return;
    if (id === 'pass' && S.pass.premium) return;
    const res = await P.purchase(id);
    if (!res.ok) return;
    this.grantIAP(id);
    saveLocal(); Cloud.push();
    if (res.token && id !== 'noads') await P.consume(res.token);
  },
  grantIAP(id) {
    const p = B.IAP_BY[id];
    switch (id) {
      case 'starter': S.shop.starter = true; grant({ gems: p.gems, pet: p.pet, scrollsA: p.scrollsA, blessedA: p.blessedA }); break;
      case 'monthly': S.shop.monthlyUntil = Math.max(Date.now(), S.shop.monthlyUntil) + p.days * 864e5; grant({ gems: p.gems }); break;
      case 'fund': S.fund.owned = true; grant({ gems: B.FUND.bonus }); toast(`Фонд сакуры открыт: ${B.FUND.gems} 💎 за каждый уровень`); break;
      case 'pass': S.pass.premium = true; toast('Премиум-дорожка пропуска открыта'); AU.sfx('legend'); break;
      case 'noads': S.shop.noAds = true; toast('Межэкранная реклама отключена навсегда'); AU.sfx('success'); break;
      default: {
        // первая покупка самоцветов удваивается
        let gems = p.gems + (p.bonus || 0);
        if (!S.shop.firstTopup && p.gems) { gems *= 2; S.shop.firstTopup = true; toast('Первая покупка самоцветов удвоена!'); }
        grant({ gems });
      }
    }
    log(`Покупка: ${p.name}. Спасибо за поддержку!`, 'good');
    refreshAfterReward();
  },
  async adKey() {
    if (S.dungeon.ads >= B.DKEYS.adExtra) { toast('Сегодня больше нельзя'); return; }
    if (!await this.rewarded('key')) return;
    S.dungeon.ads++; S.dungeon.keys++;
    toast('+1 ключ подземелья');
    refreshAfterReward();
  },
  // незавершённые покупки и постоянные права при запуске
  async restore() {
    const list = await P.purchases();
    for (const pu of list) {
      if (pu.productID === 'noads') { S.shop.noAds = true; continue; }
      if (B.IAP_BY[pu.productID]) { this.grantIAP(pu.productID); saveLocal(); await Cloud.push(); await P.consume(pu.purchaseToken); }
    }
  },
  renderShop() {
    const offers = [];
    const card = (p, icon, desc, extra = '') => {
      const pr = P.price(p.id, p.rub);
      return `<li class="offer ${p.id}"><img src="${A.miscIcon(icon, 64)}" alt=""><div class="row-main"><b>${p.name}</b>${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<p>${desc}</p>${extra}</div>
        <button class="buy pink" data-act="iap" data-id="${p.id}">${pr.icon ? `<img src="${pr.icon}" alt="">` : ''}${pr.text}</button></li>`;
    };
    const I = B.IAP_BY;
    if (!S.shop.starter) offers.push(card(I.starter, 'starter', `${I.starter.gems} 💎, эпический питомец ${B.PET[I.starter.pet].name}, ${I.starter.scrollsA} свитков доспеха и ${I.starter.blessedA} благословенных.`));
    if (!S.fund.owned) offers.push(card(I.fund, 'starter', `${B.FUND.gems} 💎 за каждый из ${B.FUND.levels.length} рубежей уровня, всего ${B.FUND_TOTAL} 💎. Плюс ${B.FUND.bonus} 💎 сразу.`, `<span class="meta">Выплаты на уровнях ${B.FUND.levels[0]}–${B.FUND.levels[B.FUND.levels.length - 1]}</span>`));
    const mLeft = S.shop.monthlyUntil - Date.now();
    offers.push(card(I.monthly, 'moon', `${I.monthly.gems} 💎 сразу и ещё 100 💎 каждый день 30 дней: всего ${I.monthly.gems + 3000} 💎.`, mLeft > 0 ? `<span class="meta">Активна ещё ${left(mLeft)}</span>` : ''));
    if (!S.pass.premium) offers.push(card(I.pass, 'pass', 'Премиум-дорожка текущего сезона: самоцветы за каждый уровень, свитки, билеты и мифический дракон.'));
    if (!S.shop.noAds) offers.push(card(I.noads, 'noads', 'Убирает рекламу между этапами. Бонусы за просмотр остаются по желанию.'));
    const packs = B.IAP.filter(p => p.id.startsWith('gems_')).map(p => {
      const pr = P.price(p.id, p.rub);
      const dbl = !S.shop.firstTopup && p.gems ? `<i class="pack-badge">×2</i>` : '';
      return `<button class="gem-pack" data-act="iap" data-id="${p.id}">${dbl}<img src="${A.miscIcon('gem', 64)}" alt=""><b>${fmt(p.gems)}${p.bonus ? `<small>+${p.bonus}</small>` : ''}</b><span>${pr.icon ? `<img src="${pr.icon}" alt="">` : ''}${pr.text}</span></button>`;
    }).join('');
    const g = dropGradeTop(zoneOf(S.stage).z), GS = B.GEM_SHOP;
    const spend = [
      ['gold', 'gold', `${fmt(B.mGold(S.stage) * GS.gold.kills)} золота`, 'Мешок золота по ценам текущего этапа', GS.gold.gems],
      ['scrollsA5', 'quests', `5 свитков доспеха ${B.GRADES[g].short}`, 'Грейд вашей текущей зоны', GS.scrollsA5.gems],
      ['blessedA', 'quests', `Благословенный свиток доспеха ${B.GRADES[g].short}`, 'При неудаче вещь не ломается', GS.blessedA.gems],
      ['blessedW', 'quests', `Благословенный свиток оружия ${B.GRADES[g].short}`, 'При неудаче вещь не ломается', GS.blessedW.gems],
      ['key', 'key', 'Ключ подземелья', 'Ещё один заход в любое подземелье', GS.key.gems],
    ].map(([id, icon, name, desc, cost]) => `<li class="row"><img src="${id.startsWith('blessed') ? A.scrollIcon(id === 'blessedW' ? 'weapon' : 'armor', g, true) : id === 'scrollsA5' ? A.scrollIcon('armor', g, false) : A.miscIcon(icon, 64)}" alt="">
      <div class="row-main"><b>${name}</b><span class="meta">${desc}</span></div>
      <button class="buy ${cost > S.gems ? 'poor' : ''}" data-act="gemshop" data-id="${id}" data-cost="${cost}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">${cost}</button></li>`).join('');
    return `
      <ul class="offers">${offers.join('')}</ul>
      <div class="card-head" style="margin:0"><h3>Самоцветы</h3><span class="sub">У вас ${fmt(S.gems)} 💎</span></div>
      <div class="gem-packs">${packs}</div>
      ${P.mode === 'local' ? '<p class="note">Тестовая версия: покупка проходит без оплаты. На Яндекс Играх цены и оплату показывает площадка.</p>' : ''}
      <div class="card-head" style="margin:0"><h3>Обмен самоцветов</h3></div>
      <ul class="rows">${spend}</ul>
      <div class="card-head" style="margin:0"><h3>Бонусы за рекламу</h3></div>
      ${adRows()}`;
  },
  gemShop(id) {
    const GS = B.GEM_SHOP, cost = GS[id].gems, g = dropGradeTop(zoneOf(S.stage).z);
    if (S.gems < cost) { toast('Не хватает самоцветов'); return; }
    S.gems -= cost;
    if (id === 'gold') S.gold += B.mGold(S.stage) * GS.gold.kills;
    if (id === 'scrollsA5') S.scrolls.a[g] += 5;
    if (id === 'blessedA') S.scrolls.ba[g] += 1;
    if (id === 'blessedW') S.scrolls.bw[g] += 1;
    if (id === 'key') S.dungeon.keys += 1;
    R.dirtyBank = true; AU.sfx('buy'); toast('Готово'); saveLocal();
  },
};
function adRows() {
  const gl = S.boost.goldUntil - Date.now();
  return `<ul class="rows">
    <li class="row"><img src="${A.miscIcon('gem', 64)}" alt=""><div class="row-main"><b>${B.ADS.gems} самоцветов</b><span class="meta">Осталось сегодня: ${B.ADS.gemsPerDay - S.ads.gems} из ${B.ADS.gemsPerDay}</span></div>
      <button class="buy ad" data-act="ad-gems" ${S.ads.gems >= B.ADS.gemsPerDay ? 'disabled' : ''}>Смотреть</button></li>
    <li class="row"><img src="${A.miscIcon('boost', 64)}" alt=""><div class="row-main"><b>Золото ×2 на ${B.ADS.goldBoostMin} минут</b><span class="meta">${gl > 0 ? `Активно ещё ${left(gl)}, повторный просмотр продлит` : 'Удваивает золото с монстров и боссов'}</span></div>
      <button class="buy ad" data-act="ad-boost">Смотреть</button></li>
    <li class="row"><img src="${A.miscIcon('summon', 64)}" alt=""><div class="row-main"><b>Бесплатный призыв</b><span class="meta">${S.ads.freeSummon ? 'Уже получен сегодня' : 'Один раз в день'}</span></div>
      <button class="buy ad" data-act="summon-ad" ${S.ads.freeSummon ? 'disabled' : ''}>Смотреть</button></li>
  </ul>`;
}
function refreshAfterReward() {
  updateSideButtons(); updateHud();
  if (modalState && modalState.quests) openQuests();
  else if (modalState && modalState.gift) openGift();
  else if (!modalState) renderPanel();
}
function openGift() {
  openModal(sheet('Бонусы', 'Посмотрите короткую рекламу и получите награду', adRows() +
    (P.mode === 'local' ? '<p class="note">Тестовая версия: награда выдаётся сразу. На Яндекс Играх перед ней покажется реклама.</p>' : '')), { gift: true });
}

/* ---------- тестовый режим: подтверждение покупки или награды ---------- */
P.setLocalUI((kind, id) => new Promise(resolve => {
  const prev = modalState;
  const back = () => { if (prev && prev.quests) openQuests(); else if (prev && prev.gift) openGift(); };
  if (kind === 'ad') { resolve(true); return; }
  const p = B.IAP_BY[id];
  const st = {
    resolve: v => { resolve(v); },
    onClose: null,
  };
  openModal(sheet('Тестовая покупка', 'Деньги не списываются', `
    <section class="card chest-card"><img src="${A.miscIcon(id.startsWith('gems') ? 'gem' : id === 'monthly' ? 'moon' : id === 'noads' ? 'noads' : id === 'pass' ? 'pass' : 'starter', 64)}" alt="">
    <div class="row-main"><b>${p.name}</b><span class="meta">${p.rub} ₽ в релизной версии</span></div></section>
    <p class="note">Это демонстрация покупки. В версии для Яндекс Игр откроется окно оплаты площадки.</p>
    <div class="btn-row"><button class="buy ghost" data-act="test-no">Отмена</button><button class="buy pink" data-act="test-yes">Получить (тест)</button></div>`), st);
  st.done = v => { st.resolve = null; closeModal(); back(); resolve(v); };
}));
