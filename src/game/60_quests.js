/* ===== Задания, достижения, вход, пропуск сезона ===== */
function dailyReset() {
  if (!S) return;
  const today = dayKey();
  const q = S.quests;
  if (q.day !== today) { q.day = today; q.prog = {}; q.claimed = {}; q.chest = false; }
  const a = S.arena;
  if (a.day !== today) { a.day = today; a.tickets = Math.max(a.tickets, B.ARENA.tickets); a.buys = 0; }
  if (S.ads.day !== today) { S.ads.day = today; S.ads.gems = 0; S.ads.freeSummon = false; S.ads.boosts = 0; }
  const d = S.dungeon;
  if (d.day !== today) { d.day = today; d.keys = B.DKEYS.perDay; d.ads = 0; d.buys = 0; }
  const wk = weekKey();
  if (S.tower.week !== wk) { S.tower.week = wk; S.tower.reward = 0; }
  const season = B.seasonOf(Date.now());
  if (S.pass.season !== season) S.pass = { season, xp: 0, free: [], prem: [], premium: false };
}
function quest(id, n = 1) {
  if (!S) return;
  dailyReset();
  const d = B.DAILY.find(x => x.id === id); if (!d) return;
  const before = S.quests.prog[id] || 0;
  if (before >= d.goal) return;
  S.quests.prog[id] = Math.min(d.goal, before + n);
  if (S.quests.prog[id] >= d.goal) { toast(`Задание выполнено: ${d.name}`); updateSideButtons(); }
}
function questsReady() {
  if (!S) return 0;
  let n = 0;
  for (const d of B.DAILY) if ((S.quests.prog[d.id] || 0) >= d.goal && !S.quests.claimed[d.id]) n++;
  if (!S.quests.chest && B.DAILY.every(d => S.quests.claimed[d.id])) n++;
  n += achReady().length;
  n += chaptersReady();
  n += fundClaimable().length;
  if (S.login.last !== dayKey()) n++;
  if (S.shop.monthlyUntil > Date.now() && S.shop.monthlyDay !== dayKey()) n++;
  const lvl = passLevel();
  for (let t = 1; t <= lvl; t++) { if (!S.pass.free.includes(t)) n++; if (S.pass.premium && !S.pass.prem.includes(t)) n++; }
  return n;
}
const passLevel = () => Math.min(B.PASS.tiers, Math.floor(S.pass.xp / B.PASS.xpPer));
function passXp(n) {
  if (!S) return;
  dailyReset();
  const before = passLevel();
  S.pass.xp += n;
  if (passLevel() > before) { toast(`Пропуск сакуры: уровень ${passLevel()}`); updateSideButtons(); }
}
function statValue(stat) {
  if (stat === 'maxStage') return S.maxStage;
  if (stat === 'bestStage') return Math.max(S.bestStage || 0, S.maxStage);
  if (stat === 'level') return S.level;
  if (stat === 'petsOwned') return petsOwnedCount();
  if (stat === 'towerBest') return S.tower.best;
  return S.stats[stat] || 0;
}
function achReady() { return B.ACH.filter(a => { const i = S.ach[a.id] || 0; return i < a.tiers.length && statValue(a.stat) >= a.tiers[i]; }); }
let achNotified = '', chapterNotified = -1;
function checkAch() {
  const r = achReady().map(a => a.id + (S.ach[a.id] || 0)).join();
  if (r && r !== achNotified) { achNotified = r; updateSideButtons(); }
  const p = chapterProgress();
  if (p && p.done && chapterNotified !== S.chapter.idx) {
    chapterNotified = S.chapter.idx;
    toast(`Глава «${p.c.title}»: награда ждёт`);
    updateSideButtons();
  }
}

/* ---------- выдача наград ---------- */
function rewardText(rw) {
  const g = dropGradeTop(zoneOf(S.stage).z), out = [];
  if (rw.gems) out.push(`${rw.gems} 💎`);
  if (rw.petals) out.push(`${rw.petals} ${plural(rw.petals, ['лепесток', 'лепестка', 'лепестков'])}`);
  if (rw.keys) out.push(`${rw.keys} ${plural(rw.keys, ['ключ', 'ключа', 'ключей'])}`);
  if (rw.goldKills) out.push(`${fmt(B.mGold(S.stage) * rw.goldKills)} золота`);
  if (rw.gold) out.push(`${fmt(rw.gold)} золота`);
  if (rw.xp) out.push(`${fmt(rw.xp)} опыта`);
  if (rw.scrollsA) out.push(`${rw.scrollsA} св. доспеха ${B.GRADES[g].short}`);
  if (rw.scrollsW) out.push(`${rw.scrollsW} св. оружия ${B.GRADES[g].short}`);
  if (rw.blessedA) out.push(`${rw.blessedA} благ. доспеха ${B.GRADES[g].short}`);
  if (rw.blessedW) out.push(`${rw.blessedW} благ. оружия ${B.GRADES[g].short}`);
  if (rw.crystals) out.push(`${fmt(rw.crystals)} кристаллов`);
  if (rw.crystalsK) out.push(`${fmt(50 * crystalMul(g))} кристаллов`);
  if (rw.summon) out.push(`${rw.summon} ${plural(rw.summon, ['билет', 'билета', 'билетов'])} призыва`);
  if (rw.pet) out.push(`питомец ${B.PET[rw.pet].name}`);
  if (rw.cosmetic) out.push('аура лепестков');
  return out.join(', ');
}
function grant(rw, silent) {
  const g = dropGradeTop(zoneOf(S.stage).z);
  if (rw.gems) S.gems += rw.gems;
  if (rw.petals) S.aw.petals += rw.petals;
  if (rw.keys) S.dungeon.keys += rw.keys;
  if (rw.goldKills) S.gold += B.mGold(S.stage) * rw.goldKills;
  if (rw.gold) S.gold += rw.gold;
  if (rw.scrollsA) S.scrolls.a[g] += rw.scrollsA;
  if (rw.scrollsW) S.scrolls.w[g] += rw.scrollsW;
  if (rw.blessedA) S.scrolls.ba[g] += rw.blessedA;
  if (rw.blessedW) S.scrolls.bw[g] += rw.blessedW;
  if (rw.crystals) S.crystals += rw.crystals;
  if (rw.crystalsK) S.crystals += 50 * crystalMul(g);
  if (rw.summon) S.gacha.tickets += rw.summon;
  if (rw.pet) addPet(rw.pet);
  if (rw.cosmetic && !S.shop.cosmetics.includes(rw.cosmetic)) { S.shop.cosmetics.push(rw.cosmetic); S.shop.cosmetic = rw.cosmetic; }
  if (rw.xp) gainXp(rw.xp);
  R.dirtyBank = true;
  recalc(); checkAch(); saveLocal(); updateSideButtons();
  const t = rewardText(rw);
  if (t && !silent) toast('Получено: ' + t);
  AU.sfx('success');
}

/* ---------- окно заданий ---------- */
let questTab = 'daily';
function openQuests(tab) {
  if (tab) questTab = tab;
  dailyReset();
  const tabs = segHTML('qtab', questTab, [['story', 'Сюжет', chaptersReady() > 0 || fundClaimable().length > 0], ['daily', 'Задания'], ['pass', 'Пропуск'], ['ach', 'Достижения', achReady().length > 0], ['login', 'Вход', S.login.last !== dayKey()]]);
  const body = { story: questsStory, daily: questsDaily, pass: questsPass, ach: questsAch, login: questsLogin }[questTab]();
  openModal(sheet('Задания и награды', `Обновление через ${left(msToMidnight())}`, tabs + body, { cls: 'quests-sheet' }), { quests: true });
}
function questsStory() {
  const cur = chapterProgress(), f = fundUi();
  const list = CHAPTERS.map((c, i) => {
    const done = i < S.chapter.idx, now = i === S.chapter.idx;
    const v = now && cur ? cur.v : done ? c.goal : 0;
    return `<li class="row quest ${done ? 'got' : ''}"><img src="${A.miscIcon(done ? 'trophy' : 'quests', 64)}" alt="">
      <div class="row-main"><b>Глава ${i + 1} · ${c.title}</b>
        <div class="bar mini"><i style="width:${Math.min(100, v / c.goal * 100)}%"></i></div>
        <span class="meta">${done ? 'Пройдена' : `${fmt(v)}/${fmt(c.goal)} · ${rewardText(c.rw)}`}</span></div>
      ${done ? '<button class="buy" disabled>Готово</button>' : now && cur && cur.done ? `<button class="buy pink" data-act="chapter-claim">Забрать</button>` : `<button class="buy" disabled>${now ? 'В процессе' : 'Впереди'}</button>`}</li>`;
  }).join('');
  return `<p class="sub">Сюжет ведёт от первого удара до бесконечного пути. Награды щедрые: они ускоряют старт.</p>
    ${S.fund.owned ? `<section class="card chest-card"><img src="${A.miscIcon('starter', 64)}" alt="">
      <div class="row-main"><b>Фонд сакуры</b><span class="meta">${f.current ? `Уровень ${f.current}: ${B.FUND.gems} 💎 ждут` : `Следующая выплата на уровне ${f.next}`} · получено ${f.got} из ${f.total}</span></div>
      ${f.current ? `<button class="buy pink" data-act="fund-claim" data-l="${f.current}">Забрать</button>` : '<span class="sub">Фонд</span>'}</section>` : ''}
    <ul class="rows">${list}</ul>`;
}
function questsDaily() {
  const q = S.quests;
  const rows = B.DAILY.map(d => {
    const p = q.prog[d.id] || 0, done = p >= d.goal, got = q.claimed[d.id];
    const adQ = d.id === 'ad' && !done;
    return `<li class="row quest ${got ? 'got' : ''}"><img src="${A.miscIcon('quests', 64)}" alt="">
      <div class="row-main"><b>${d.name}</b><div class="bar mini"><i style="width:${p / d.goal * 100}%"></i></div><span class="meta">${p}/${d.goal} · ${d.gems} 💎${d.scrollsA ? ` + ${d.scrollsA} свитка` : ''} · +${B.QUEST_XP} опыта пропуска</span></div>
      ${got ? '<button class="buy" disabled>Получено</button>' : done ? `<button class="buy pink" data-act="qclaim" data-id="${d.id}">Забрать</button>` : adQ && Monet.adsOn() ? '<button class="buy ad" data-act="ad-gems">Смотреть</button>' : '<button class="buy" disabled>В процессе</button>'}</li>`;
  }).join('');
  const all = B.DAILY.every(d => q.claimed[d.id]);
  const month = S.shop.monthlyUntil > Date.now();
  return `<ul class="rows">${rows}</ul>
    <section class="card chest-card"><img src="${A.miscIcon('chest', 64)}" alt=""><div class="row-main"><b>Сундук дня</b><span class="meta">Выполните все задания: ${B.DAILY_CHEST.gems} 💎 и опыт пропуска</span></div>
      ${q.chest ? '<button class="buy" disabled>Открыт</button>' : `<button class="buy ${all ? 'pink' : ''}" data-act="qchest" ${all ? '' : 'disabled'}>Открыть</button>`}</section>
    ${month ? `<section class="card chest-card"><img src="${A.miscIcon('moon', 64)}" alt=""><div class="row-main"><b>Лунная карта</b><span class="meta">100 💎 каждый день · осталось ${left(S.shop.monthlyUntil - Date.now())}</span></div>
      ${S.shop.monthlyDay === dayKey() ? '<button class="buy" disabled>Получено</button>' : '<button class="buy pink" data-act="monthly-claim">Забрать</button>'}</section>` : ''}`;
}
function questsPass() {
  const lvl = passLevel(), xpIn = S.pass.xp - lvl * B.PASS.xpPer, end = B.seasonEnd(S.pass.season);
  const tiers = [];
  for (let t = 1; t <= B.PASS.tiers; t++) {
    const fr = B.passReward(t, false), pr = B.passReward(t, true), open = lvl >= t;
    const fGot = S.pass.free.includes(t), pGot = S.pass.prem.includes(t);
    const cell = (rw, got, kind) => {
      const can = open && !got && (kind === 'free' || S.pass.premium);
      return `<button class="pass-cell ${kind} ${got ? 'got' : ''} ${can ? 'can' : ''}" data-act="pass-claim" data-t="${t}" data-k="${kind}" ${can ? '' : 'disabled'}>${rewardText(rw).replace(/, /g, '<br>')}${kind === 'prem' && !S.pass.premium ? '<i class="lock"></i>' : ''}</button>`;
    };
    tiers.push(`<div class="pass-tier ${open ? 'open' : ''}"><span class="tier-n">${t}</span>${cell(fr, fGot, 'free')}${cell(pr, pGot, 'prem')}</div>`);
  }
  return `<section class="card pass-head"><img src="${A.miscIcon('pass', 64)}" alt="">
      <div class="row-main"><b>Пропуск сакуры · уровень ${lvl}/${B.PASS.tiers}</b><div class="bar mini"><i style="width:${lvl >= B.PASS.tiers ? 100 : xpIn / B.PASS.xpPer * 100}%"></i></div>
      <span class="meta">${lvl >= B.PASS.tiers ? 'Сезон пройден' : `${xpIn}/${B.PASS.xpPer} опыта`} · сезон закончится через ${left(end - Date.now())}</span></div></section>
    ${S.pass.premium ? '<p class="note">Премиум-дорожка открыта: забирайте обе награды.</p>' : `<button class="buy pink wide" data-act="iap" data-id="pass">Открыть премиум-дорожку · ${P.price('pass', B.IAP_BY.pass.rub).text}</button>
      <p class="note">Премиум даёт 60 💎 за уровень, благословенные свитки, билеты призыва, мифического дракона Тэнрю и ауру лепестков на 30-м уровне.</p>`}
    <p class="note">Опыт пропуска дают задания дня, боссы и бои на арене.</p>
    <div class="pass-cols"><span></span><span>Бесплатно</span><span>Премиум</span></div>
    <div class="pass-list">${tiers.join('')}</div>`;
}
function questsAch() {
  return `<ul class="rows">${B.ACH.map(a => {
    const i = S.ach[a.id] || 0, done = i >= a.tiers.length;
    const goal = done ? a.tiers[a.tiers.length - 1] : a.tiers[i], v = statValue(a.stat), can = !done && v >= goal;
    return `<li class="row quest ${done ? 'got' : ''}"><img src="${A.miscIcon('trophy', 64)}" alt="">
      <div class="row-main"><b>${a.name(goal)}</b><div class="bar mini"><i style="width:${Math.min(100, v / goal * 100)}%"></i></div>
      <span class="meta">${fmt(Math.min(v, goal))}/${fmt(goal)} · ступень ${Math.min(i + 1, a.tiers.length)} из ${a.tiers.length}${done ? '' : ` · ${a.gems[i]} 💎`}</span></div>
      ${done ? '<button class="buy" disabled>Все ступени</button>' : `<button class="buy ${can ? 'pink' : ''}" data-act="ach-claim" data-id="${a.id}" ${can ? '' : 'disabled'}>${can ? 'Забрать' : 'В процессе'}</button>`}</li>`;
  }).join('')}</ul>`;
}
function questsLogin() {
  const today = S.login.last !== dayKey(), cur = S.login.idx % 7;
  const cells = B.LOGIN.map((rw, i) => {
    const isNow = i === cur && today;
    return `<div class="login-day ${i < cur ? 'got' : ''} ${isNow ? 'now' : ''}"><span>День ${i + 1}</span><img src="${A.miscIcon(rw.gems ? 'gem' : rw.summon ? 'summon' : rw.goldKills ? 'gold' : 'quests', 64)}" alt=""><b>${rewardText(rw)}</b></div>`;
  }).join('');
  return `<p class="sub">Заходите каждый день: награды идут по кругу из семи дней, пропуск не сбрасывает прогресс.</p>
    <div class="login-grid">${cells}</div>
    <button class="buy ${today ? 'pink' : ''} wide" data-act="login-claim" ${today ? '' : 'disabled'}>${today ? 'Забрать награду дня' : `Следующая награда через ${left(msToMidnight())}`}</button>`;
}
