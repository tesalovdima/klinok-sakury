/* ===== Ввод, офлайн-доход, запуск ===== */
function offline() {
  const from = R.offlineFrom || S.savedAt || Date.now(); R.offlineFrom = 0;
  const gap = (Date.now() - from) / 1000;
  const sec = Math.min(offlineHours() * 3600, gap);
  if (sec < 90) return;
  const comeback = gap >= 3 * 86400;
  const st = R.st, s = S.stage, z = zoneOf(s);
  const dps = st.atk * (1 + st.crit * (st.critDmg - 1)) * st.aspd * 1.3;
  const ttk = Math.max(1 / st.aspd, B.mHp(s) / dps) + 1.2;
  const kills = Math.floor(sec / ttk * .5);
  if (kills < 1) return;
  const rw = { gold: kills * B.mGold(s) * (1 + R.pb.goldPct + (st.goldPct || 0)), xp: kills * B.mXp(s) * xpMul(), top: dropGradeTop(z.z) };
  const roll = x => Math.floor(x) + (rnd() < x % 1 ? 1 : 0);
  rw.a = roll(kills * B.DROP.armorScroll * dropMul()); rw.w = roll(kills * B.DROP.weaponScroll * dropMul());
  rw.cry = Math.floor(kills * B.DROP.crystals * 2 * crystalMul(rw.top));
  const give = mul => {
    S.gold += rw.gold * mul; S.scrolls.a[rw.top] += rw.a * mul; S.scrolls.w[rw.top] += rw.w * mul; S.crystals += rw.cry * mul;
  };
  give(1); gainXp(rw.xp);
  if (comeback) grant({ gems: 150, petals: 5, summon: 1 });
  const st2 = { offline: rw };
  openModal(sheet('Пока вас не было', `${dur(sec)} ${heroName()} ${G('сражалась', 'сражался')} в зоне «${z.title}»`, `
    ${comeback ? '<p class="note">Бонус возвращения: <b>150 самоцветов, 5 лепестков и билет призыва</b>.</p>' : ''}
    <dl class="compare">
      <dt>Побеждено монстров</dt><dd>${fmt(kills)}</dd><dd></dd>
      <dt>Золото</dt><dd class="up">+${fmt(rw.gold)}</dd><dd></dd>
      <dt>Опыт</dt><dd class="up">+${fmt(rw.xp)}</dd><dd></dd>
      <dt>Свитки доспеха ${B.GRADES[rw.top].short}</dt><dd class="up">+${rw.a}</dd><dd></dd>
      <dt>Свитки оружия ${B.GRADES[rw.top].short}</dt><dd class="up">+${rw.w}</dd><dd></dd>
      <dt>Кристаллы</dt><dd class="up">+${fmt(rw.cry)}</dd><dd></dd>
    </dl>
    <div class="btn-row"><button class="buy ghost" data-act="close">Забрать</button><button class="buy ad" data-act="offline-x2">Удвоить за рекламу</button></div>`), st2);
  st2.give = give;
}

/* ---------- покупки роста: клик и удержание ---------- */
let holdTimer = 0, holdId = null, holdStart = null, holdFired = false;
function stopHold() { clearTimeout(holdTimer); holdId = null; holdStart = null; }
panel.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-grow]'); if (!b || b.disabled) return;
  AU.init();
  holdId = b.dataset.grow; holdStart = { x: e.clientX, y: e.clientY }; holdFired = false;
  let delay = 260;
  const rep = () => {
    if (!holdId) return;
    holdFired = true;
    if (!buyGrowth(holdId)) { stopHold(); return; }
    delay = Math.max(55, delay * .82); holdTimer = setTimeout(rep, delay);
  };
  holdTimer = setTimeout(rep, 420);
});
panel.addEventListener('pointermove', e => { if (holdStart && Math.hypot(e.clientX - holdStart.x, e.clientY - holdStart.y) > 10) stopHold(); });
document.addEventListener('contextmenu', e => { if (e.target.closest('#app, #intro, #modal')) e.preventDefault(); });
window.addEventListener('pointerup', () => { clearTimeout(holdTimer); holdId = null; holdStart = null; });
window.addEventListener('pointercancel', stopHold);
window.addEventListener('blur', stopHold);

/* ---------- все кнопки ---------- */
document.addEventListener('click', async e => {
  if (!S) return;
  AU.init();
  const g = e.target.closest('[data-grow]');
  if (g) { if (holdFired) holdFired = false; else if (!g.disabled) buyGrowth(g.dataset.grow); return; }
  if (e.target === modal && modalState && !modalState.busy) { closeModal(); return; }
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const act = b.dataset.act;
  switch (act) {
    case 'mult': R.mult = b.dataset.v === 'max' ? 'max' : +b.dataset.v; renderPanel(); break;
    case 'heroseg': R.heroSeg = b.dataset.v; renderPanel(); break;
    case 'petseg': R.petSeg = b.dataset.v; renderPanel(); break;
    case 'trialseg': R.trialSeg = b.dataset.v; renderPanel(); if (R.trialSeg === 'world') World.load(true); break;
    case 'world-hit': World.hit(); break;
    case 'world-claim': World.claim(); break;
    case 'world-refresh': World.load(true); break;
    case 'world-retry': NET.probe(true).then(ok => { World.load(true); if (!ok) toast('Сервер недоступен'); }); break;
    case 'socialseg': R.socialSeg = b.dataset.v; renderPanel(); Social.enter(); break;
    case 'event-open': openEvent(); break;
    case 'event-tab': R.eventTab = b.dataset.v; openEvent(R.eventTab); break;
    case 'event-claim': eventClaim(+b.dataset.i); break;
    case 'event-claim-all': eventClaimAll(); break;
    case 'event-buy': eventBuy(b.dataset.id); break;
    case 'lantern-open': openLantern(); break;
    case 'lantern-tab': R.lanternTab = b.dataset.v; openLantern(R.lanternTab); break;
    case 'lantern-claim': lanternClaim(+b.dataset.i); break;
    case 'lantern-claim-all': lanternClaimAll(); break;
    case 'lantern-buy': lanternBuy(b.dataset.id); break;
    case 'chat-send': Social.send(); break;
    case 'board-refresh': Social.loadBoard(); break;
    case 'chat-retry': NET.probe(true).then(ok => { renderPanel(); Social.enter(); if (!ok) toast('Сервер недоступен'); }); break;
    // испытания
    case 'tower-fight': towerFightStart(); break;
    case 'tower-auto': towerAuto(); break;
    case 'tower-claim': towerClaim(); renderPanel(); break;
    case 'dungeon-go': dungeonOpen(b.dataset.id); break;
    case 'dungeon-x2': if (modalState && modalState.duel) dungeonX2(modalState); break;
    case 'dungeon-adkey': await Monet.adKey(); if (R.tab === 'trials') renderPanel(); break;
    case 'dungeon-key': {
      if (S.gems < B.DKEYS.gemCost || S.dungeon.buys >= B.DKEYS.gemMax) break;
      S.gems -= B.DKEYS.gemCost; S.dungeon.buys++; S.dungeon.keys++;
      AU.sfx('buy'); renderPanel(); break;
    }
    case 'awaken-ask': openAwakenAsk(); break;
    case 'awaken-yes': {
      closeModal();
      const gain = awakenGain();
      if (doAwaken()) { banner('Пробуждение', `+${gain} лепестков`, '#ff8fc1'); renderPanel(); }
      break;
    }
    case 'aw-buy': if (buyAw(b.dataset.id)) renderPanel(); break;
    case 'reroll': {
      const it = itemById(+b.dataset.id);
      if (it && rerollOpts(it)) { openItem(it.id); toast('Грань перекована'); }
      break;
    }
    case 'chapter-claim': if (chapterClaim()) { if (modalState && modalState.quests) openQuests('story'); else renderPanel(); updateSideButtons(); } break;
    case 'fund-claim': if (fundClaim(+b.dataset.l)) { if (modalState && modalState.quests) openQuests(); else renderPanel(); } break;
    case 'look': openIntro(true); break;
    case 'item': openItem(+b.dataset.id); break;
    case 'slot': R.shopTab = 'gear'; R.shopGrade = unlockedGrade(); setTab('shop'); toast(`${B.SLOT[b.dataset.slot].name}: выберите в магазине`); break;
    case 'close': closeModal(); break;
    case 'equip': equip(+b.dataset.id); closeModal(); renderPanel(); break;
    case 'unequip': unequip(+b.dataset.id); closeModal(); renderPanel(); break;
    case 'enchant': openEnchant(+b.dataset.id); break;
    case 'pick': if (modalState && !modalState.busy) { modalState.kind = b.dataset.v; rerenderEnchant(modalState); } break;
    case 'do-enchant': doEnchant(); break;
    case 'auto-enchant': autoEnchant(); break;
    case 'auto-stop': {
      const st = modalState;
      if (st && st.enchant && !st.autoRun) {
        st.autoStop = +b.dataset.n;
        S.settings.autoEnchantTo = st.autoStop;
        saveLocal(); rerenderEnchant(st);
      }
      break;
    }
    case 'auto-stop-run': {
      const st = modalState;
      if (st && st.enchant) { st.autoRun = false; st.resumeAuto = false; toast('Авто остановлено'); }
      break;
    }
    case 'buy-again': {
      const st = modalState;
      const it = buyItem(b.dataset.slot, +b.dataset.g, { silent: true });
      if (it) {
        toast(`Куплено заново: ${itemName(it)}`);
        if (st && st.enchant) {
          st.item = it.id; st.busy = false; st.autoRun = false;
          rerenderEnchant(st);
          if (st.resumeAuto) setTimeout(() => autoEnchant(), 250);
        } else { closeModal(); renderPanel(); }
      }
      break;
    }
    case 'buy-scrolls': R.shopTab = 'scrolls'; R.scrollGrade = +b.dataset.g; closeModal(); setTab('shop'); break;
    case 'sell': {
      const it = itemById(+b.dataset.id); if (!it || isEquipped(it)) break;
      const p = B.sellPrice(it.slot, it.g); S.gold += p; removeItem(it.id);
      toast(`Продано за ${fmt(p)} золота`); closeModal(); renderPanel(); break;
    }
    case 'crystallize': {
      const it = itemById(+b.dataset.id); if (!it || isEquipped(it)) break;
      const c = B.crystalYield(it.slot, it.g, it.e); S.crystals += c; removeItem(it.id);
      log(`${itemName(it)} кристаллизован: +${fmt(c)} ${plural(c, CRY_W)}.`, 'sys');
      toast(`+${fmt(c)} ${plural(c, CRY_W)}`); closeModal(); renderPanel(); break;
    }
    case 'goshop': R.shopTab = 'gear'; R.shopGrade = +b.dataset.g; closeModal(); setTab('shop'); break;
    case 'skill-toggle': {
      const id = b.dataset.id;
      if (S.skills[id]) {
        const sc = panel ? panel.scrollTop : 0;
        S.skillOn[id] = S.skillOn[id] === false; saveLocal(); renderPanel();
        if (panel) panel.scrollTop = sc;
        toast(`${SK[id].name}: ${S.skillOn[id] ? 'включено' : 'выключено'}`);
      }
      break;
    }
    case 'learn': {
      const s = SK[b.dataset.sk];
      if (S.sp > 0 && S.level >= s.unlock && S.skills[s.id] < SKILL_MAX) { S.sp--; S.skills[s.id]++; AU.sfx('buy'); if (S.skills[s.id] === 1) log(`Изучен навык «${s.name}».`, 'good'); renderPanel(); updateHudStatic(); }
      break;
    }
    case 'shoptab': R.shopTab = b.dataset.v; renderPanel(); break;
    case 'shopgrade': R.shopGrade = +b.dataset.g; renderPanel(); break;
    case 'scrollgrade': R.scrollGrade = +b.dataset.g; renderPanel(); break;
    case 'buyitem': buyItem(b.dataset.slot, +b.dataset.g); renderPanel(); break;
    case 'buyscroll': buyScroll(b.dataset.k, +b.dataset.g); renderPanel(); break;
    case 'travel': travel(+b.dataset.s); break;
    case 'reset': $('resetZone').innerHTML = '<p class="note warn">Весь прогресс, питомцы и рейтинг будут удалены без возможности вернуть.</p><div class="btn-row" style="width:100%"><button class="buy danger" data-act="reset-yes">Удалить прогресс</button><button class="buy ghost" data-act="reset-no">Отмена</button></div>'; break;
    case 'reset-no': openSettings(); break;
    case 'reset-yes': closeModal(); applyState(newState()); saveLocal(); Cloud.push(); openIntro(false); break;
    // питомцы
    case 'summon': if (modalState && modalState.results) closeModal(); summon(+b.dataset.n, b.dataset.m); break;
    case 'summon-ad': Monet.adSummon(); break;
    case 'sum-skip': skipSummon(); break;
    case 'sum-close': closeModal(); renderPanel(); break;
    case 'rates': openRates(); break;
    case 'pet': openPet(b.dataset.id); break;
    case 'expo-start': expoStart(b.dataset.id); break;
    case 'expo-claim': expoClaim(); break;
    case 'expo-speed': expoSpeed(); break;
    case 'setpet': S.pets.active = b.dataset.id; recalc(); closeModal(); renderPanel(); toast(`${B.PET[S.pets.active].name} теперь ваш спутник`); AU.sfx('pet'); break;
    // арена
    case 'fight': arenaFight(+b.dataset.i); break;
    case 'fight-skip': skipFight(); break;
    case 'fight-close': closeModal(); renderPanel(); break;
    case 'fight-again': { const i = 1; closeModal(); renderPanel(); arenaFight(i); break; }
    case 'arena-reroll': S.arena.seed++; renderPanel(); break;
    case 'arena-claim': {
      if (S.arena.rewardDay === dayKey()) break;
      S.arena.rewardDay = dayKey(); grant({ gems: B.LEAGUES[B.league(S.arena.rating)].daily }); renderPanel(); break;
    }
    case 'arena-refill': {
      if (S.gems < B.ARENA.refillCost || S.arena.buys >= B.ARENA.refillMax) { toast('Не хватает самоцветов'); break; }
      S.gems -= B.ARENA.refillCost; S.arena.buys++; S.arena.tickets = B.ARENA.tickets; AU.sfx('buy'); renderPanel(); break;
    }
    // задания
    case 'qtab': questTab = b.dataset.v; openQuests(); break;
    case 'qclaim': {
      const d = B.DAILY.find(x => x.id === b.dataset.id);
      if (!d || S.quests.claimed[d.id] || (S.quests.prog[d.id] || 0) < d.goal) break;
      S.quests.claimed[d.id] = true; passXp(B.QUEST_XP); grant({ gems: d.gems, scrollsA: d.scrollsA }); openQuests(); break;
    }
    case 'qchest': if (!S.quests.chest && B.DAILY.every(d => S.quests.claimed[d.id])) { S.quests.chest = true; passXp(B.DAILY_CHEST.xp); grant({ gems: B.DAILY_CHEST.gems }); openQuests(); } break;
    case 'wclaim': {
      const w = B.WEEKLY.find(x => x.id === b.dataset.id);
      if (!w || S.weekly.claimed[w.id] || (S.weekly.prog[w.id] || 0) < w.goal) break;
      S.weekly.claimed[w.id] = true; grant(w.rw); openQuests('week'); break;
    }
    case 'wchest': if (!S.weekly.chest && B.WEEKLY.every(w => S.weekly.claimed[w.id])) { S.weekly.chest = true; grant(B.WEEKLY_CHEST); openQuests('week'); } break;
    case 'ach-claim': {
      const a = B.ACH.find(x => x.id === b.dataset.id), i = S.ach[a.id] || 0;
      if (i < a.tiers.length && statValue(a.stat) >= a.tiers[i]) { S.ach[a.id] = i + 1; grant({ gems: a.gems[i] }); openQuests(); }
      break;
    }
    case 'login-claim': if (S.login.last !== dayKey()) { const rw = B.LOGIN[S.login.idx % 7]; S.login.idx++; S.login.last = dayKey(); grant(rw); openQuests(); } break;
    case 'monthly-claim': if (S.shop.monthlyUntil > Date.now() && S.shop.monthlyDay !== dayKey()) { S.shop.monthlyDay = dayKey(); grant({ gems: B.IAP_BY.monthly.daily }); openQuests(); } break;
    case 'pass-claim': {
      const t = +b.dataset.t, kind = b.dataset.k, list = kind === 'free' ? S.pass.free : S.pass.prem;
      if (passLevel() < t || list.includes(t) || (kind === 'prem' && !S.pass.premium)) break;
      list.push(t); grant(B.passReward(t, kind === 'prem')); openQuests(); break;
    }
    // монетизация
    case 'iap': Monet.purchase(b.dataset.id); break;
    case 'gemshop': Monet.gemShop(b.dataset.id); renderPanel(); break;
    case 'ad-gems': Monet.adGems(); break;
    case 'ad-boost': Monet.adBoost(); break;
    case 'offline-x2': {
      const st = modalState; if (!st || !st.give) break;
      if (await Monet.rewarded('offline')) { st.give(1); toast('Награда удвоена'); }
      closeModal(); break;
    }
    case 'test-yes': if (modalState && modalState.done) modalState.done(true); break;
    case 'test-no': if (modalState && modalState.done) modalState.done(false); break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
  if (e.key === 'Enter' && e.target && e.target.id === 'chatInput') { e.preventDefault(); Social.send(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'volMusic') { S.settings.music = e.target.value / 100; AU.setVolume('music', S.settings.music); }
  if (e.target.id === 'volSfx') { S.settings.sfx = e.target.value / 100; AU.setVolume('sfx', S.settings.sfx); }
});
document.addEventListener('change', e => { if (e.target.id === 'volSfx') AU.sfx('coin'); if (e.target.id === 'volMusic' || e.target.id === 'volSfx') saveLocal(); });
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { AU.sfx('click'); setTab(b.dataset.tab); } });
hud.bossBtn.addEventListener('click', () => { if (S.kills >= B.STAGE_KILLS && !R.boss) startBoss(); });
hud.autoBtn.addEventListener('click', () => { S.autoBoss = !S.autoBoss; updateHudStatic(); toast(S.autoBoss ? 'Босс будет вызываться сам' : 'Вы остаётесь на этапе'); });
$('stageBtn').addEventListener('click', openMap);
hud.settingsBtn.addEventListener('click', openSettings);
hud.questBtn.addEventListener('click', () => openQuests());
hud.giftBtn.addEventListener('click', openGift);
hud.gemBtn.addEventListener('click', () => { R.shopTab = 'gems'; setTab('shop'); });
hud.skillDock.addEventListener('click', e => {
  const b = e.target.closest('[data-sk]'); if (!b) return;
  const id = b.dataset.sk, f = frontMonster(), eng = f && f.x <= standX(f) + 3;
  if (S.skills[id] && R.cd[id] <= 0 && (R.mp || 0) >= SK[id].mp && !R.hero.dead && (id === 'bloom' || eng)) cast(id);
});

/* ---------- запуск ---------- */
function applyState(o) {
  S = o;
  R.monsters = []; R.boss = null; R.bossPending = false; R.warn = 0; R.fx = [];
  R.bossCd = 0; R.bossFails = 0; R.towerRun = false;
  R.st = null; dailyReset(); recalc(); R.hero.hp = R.st.hp; R.hero.dead = 0;
  R.shopGrade = unlockedGrade(); Arena.opp = null;
  AU.setVolume('music', S.settings.music); AU.setVolume('sfx', S.settings.sfx);
  updateHudStatic(); updateHud(); renderPanel(); updateMusic();
}
async function start(hot) {
  const isHot = !!(hot && hot.S);
  // Платформу инициализируем до чтения сохранения: на iOS нужен safeStorage из SDK.
  await Promise.race([P.init(), new Promise(r => setTimeout(r, 4000))]);
  const local = isHot ? null : loadLocal();
  R.hadLocal = isHot || !!local;
  S = (isHot && migrate(hot.S)) || local || newState();
  equipBestAll();
  ensureEvent();
  R.offlineFrom = local ? S.savedAt : 0;
  if (isHot && ['hero', 'gear', 'pets', 'arena', 'trials', 'shop'].includes(hot.tab)) R.tab = hot.tab;
  dailyReset();
  for (const el of document.querySelectorAll('[data-ic]')) el.src = A.miscIcon(el.dataset.ic, 64);
  $('icGold').src = A.miscIcon('gold', 40); $('icGem').src = A.miscIcon('gem', 40);
  hud.skillDock.innerHTML = SKILLS.map(s => `<button class="sk locked" data-sk="${s.id}" aria-label="${s.name}"><img src="${skillIcon(s.icon, 64)}" alt=""></button>`).join('');
  AU.setVolume('music', S.settings.music); AU.setVolume('sfx', S.settings.sfx);
  resize();
  recalc(); R.hero.hp = R.st.hp;
  ensureArenaSeason();
  R.shopGrade = unlockedGrade();
  updateHudStatic(); updateHud();
  for (const b of document.querySelectorAll('#tabs [data-tab]')) b.setAttribute('aria-selected', b.dataset.tab === R.tab ? 'true' : 'false');
  renderPanel();
  new ResizeObserver(() => { resize(); if (R.tab === 'gear') setupDoll(); if (R.tab === 'pets') setupPetStage(); }).observe(battle);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { saveLocal(); Cloud.push(); AU.pause('hidden'); P.gameplay(false); }
    else { last = performance.now(); AU.resume('hidden'); if (S.hero) P.gameplay(true); }
  });
  window.addEventListener('pagehide', saveLocal);
  P.on('pause', () => { R.paused = true; AU.pause('platform'); });
  P.on('resume', () => { R.paused = false; last = performance.now(); AU.resume('platform'); });
  requestAnimationFrame(frame);
  window.claude?.hot?.snapshot?.(() => ({ S, tab: R.tab }));

  P.ready();
  if (P.mode === 'yandex') Monet.restore();
  await Cloud.init();
  if (!S.hero) { R.pendingOffline = !isHot && R.hadLocal; openIntro(false); return; }
  P.gameplay(true);
  if (!isHot) {
    log(`С возвращением, ${heroName()}! Зона «${zoneOf(S.stage).title}».`, 'sys');
    offline();
  }
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? null);

/* ---------- отладочный доступ для проверки и поддержки: ?debug ---------- */
if (/[?&]debug\b/.test(location.search)) {
  window.__KS = {
    get S() { return S; }, R, B, SKILLS, ZONES, zoneOf, recalc, applyState, saveLocal, renderPanel, setTab, grant, openModal, sheet, closeModal,
    addPet, summon, startBoss, bossWin, dailyReset, buyItem, openItem, openEnchant, autoEnchant, doEnchant,
    addEventCoins, openEvent, eventClaim, eventBuy, ensureEvent, cast, monsterHit, quest, openQuests,
    addLantern, addLanternDrop, openLantern, lanternClaim, lanternBuy, ensureLantern, AU, updateMusic,
    expoStart, expoClaim, expoSpeed, renderExpo, offline,
  };
}
