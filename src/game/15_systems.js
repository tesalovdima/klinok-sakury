/* ===== Системы мета-прогресса: пробуждение, башня, подземелья, главы, фонд ===== */

/* ---------- общие помощники ---------- */
function weekKey(d = new Date()) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (t.getDay() + 6) % 7;                       // понедельник = 0
  t.setDate(t.getDate() - day);
  return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
}
function anyEquippedGrade(min = 1) {
  return B.SLOTS.some(sl => { const id = S.equip[sl.id]; const it = id && itemById(id); return it && it.g >= min; });
}
function rewardSummary(rw) { return rewardText(rw); }

/* ---------- быстрый бой для башни и подземелий ----------
   Считаем бой по средним значениям: так игрок видит честный прогноз,
   а не проигрывает из-за одной неудачной серии критов. */
function simFight(enemy, stageEq) {
  const st = R.st;
  const kDef = B.defK(stageEq);
  const heroRed = st.def / (st.def + kDef);
  const enemyRed = enemy.def / (enemy.def + kDef);
  let hp = st.hp, ehp = enemy.hp, t = 0;
  let hT = 1 / st.aspd, eT = 1.2;
  const dps = st.atk * (1 - enemyRed) * (1 + st.crit * (st.critDmg - 1)) * st.aspd;
  const taken = enemy.atk * (1 - heroRed);
  for (let i = 0; i < 1600 && hp > 0 && ehp > 0; i++) {
    const step = .05;
    t += step;
    hp = Math.min(st.hp, hp + st.regen * step);
    hT -= step; eT -= step;
    if (hT <= 0) { hT += 1 / st.aspd; ehp -= st.atk * (1 - enemyRed) * (1 + st.crit * (st.critDmg - 1)); }
    if (eT <= 0) { eT += 1.25; hp -= taken; }
  }
  return { win: ehp <= 0 && hp > 0, t, hp: Math.max(0, hp), ehp: Math.max(0, ehp), heroMax: st.hp, enemyMax: enemy.hp, dps, taken };
}

/* ---------- башня сакуры ---------- */
const towerFloor = () => S.tower.floor + 1;
const towerOpen = () => towerFloor() <= B.TOWER.floors;
const towerGuardFor = f => B.towerGuard(f);
function towerRewardFor(f) { return B.TOWER.reward(f); }
function towerClaimable() { return S.tower.week === weekKey() && !S.tower.reward && S.tower.best > 0; }
function towerWeeklyGems() { return B.TOWER.weeklyGems(S.tower.best); }

function towerClaim() {
  if (!towerClaimable()) return;
  const g = towerWeeklyGems();
  S.tower.reward = g;
  grant({ gems: g });
  saveLocal();
}

/* ---------- подземелья ---------- */
/* ---------- пробуждение ---------- */
const awakenGain = () => B.AW.gain(S.maxStage);
const canAwaken = () => S.maxStage >= B.AW.unlockStage;
function awLevel(id) { return S.aw.lvl[id] || 0; }
function buyAw(id) {
  const n = B.AW_BY[id];
  if (!n) return false;
  const l = awLevel(id);
  if (l >= n.max) return false;
  const cost = B.awCost(n, l);
  if (S.aw.petals < cost) { toast('Не хватает лепестков'); return false; }
  S.aw.petals -= cost; S.aw.lvl[id] = l + 1;
  recalc(); updateHudStatic();
  AU.sfx('buy');
  saveLocal();
  return true;
}
function doAwaken() {
  if (!canAwaken()) return false;
  const gain = awakenGain();
  S.aw.petals += gain;
  S.aw.count++;
  S.stats.awakenings++;
  S.bestStage = Math.max(S.bestStage || 0, S.maxStage);
  // сброс похода, но не коллекций
  S.maxStage = 0; S.stage = 0; S.level = 1; S.xp = 0; S.gold = 0; S.sp = 0; S.kills = 0;
  for (const g of B.GROWTH) S.growth[g.id] = 0;
  for (const s of SKILLS) S.skills[s.id] = 0;
  const start = Math.min(B.AW.unlockStage - 10, Math.floor(B.awBonus(S.aw.lvl).start));
  if (start > 0) { S.stage = start; S.maxStage = start; }
  R.monsters = []; R.boss = null; R.bossPending = false; R.warn = 0; R.bossCd = 0; R.bossFails = 0; R.fx = [];
  recalc(); R.hero.hp = R.st.hp; R.hero.dead = 0;
  updateHudStatic(); updateMusic();
  checkAch();
  log(`Пробуждение ${S.aw.count}: получено ${gain} лепестков. Путь начинается заново, но снаряжение и питомцы с вами.`, 'good');
  saveLocal(); Cloud.push();
  return true;
}

/* ---------- фонд сакуры ---------- */
function fundClaimable() {
  if (!S.fund.owned) return [];
  return B.FUND.levels.filter(l => S.level >= l && !S.fund.claimed.includes(l));
}
function fundClaim(level) {
  if (!S.fund.owned || S.level < level || S.fund.claimed.includes(level)) return false;
  S.fund.claimed.push(level);
  grant({ gems: B.FUND.gems });
  saveLocal();
  return true;
}
function fundUi() {
  const total = B.FUND.levels.length;
  const got = S.fund.claimed.length;
  const current = B.FUND.levels.find(l => S.level >= l && !S.fund.claimed.includes(l));
  const next = B.FUND.levels.find(l => S.level < l) || B.FUND.levels[B.FUND.levels.length - 1];
  return { total, got, current, next, totalGems: B.FUND_TOTAL };
}

/* ---------- главы: сюжетный онбординг ---------- */
const CHAPTERS = [
  { id: 'kills',  title: 'Первые шаги',    text: 'Монстры гибнут сами — вам нужно лишь направлять силу. Победите 10 монстров.', goal: 10, of: () => S.stats.kills, rw: { gems: 60, scrollsA: 2 } },
  { id: 'geard',  title: 'Грейд D',        text: 'На 8-м уровне откроется грейд D. Купите и наденьте любой предмет этого грейда.', goal: 1, of: () => anyEquippedGrade(1) ? 1 : 0, rw: { gems: 80, scrollsA: 2 } },
  { id: 'ench',   title: 'Кузнец',         text: 'Свитки заточки падают из монстров. Заточите надетый предмет — до +3 это безопасно.', goal: 1, of: () => S.stats.enchants, rw: { gems: 60, scrollsA: 3 } },
  { id: 'boss',   title: 'Первый босс',    text: 'Победив 10 монстров, вызовите босса этапа. Победа откроет новый этап.', goal: 1, of: () => S.stats.bosses, rw: { gems: 100, summon: 1 } },
  { id: 'pet',    title: 'Спутник',        text: 'Призовите питомца: он бьёт врагов и усиливает героя. Билет уже есть.', goal: 1, of: () => S.stats.summons, rw: { gems: 100, summon: 1 } },
  { id: 'arena',  title: 'Арена',          text: 'Сразись на арене. Даже поражение даёт самоцветы и опыт пропуска.', goal: 1, of: () => S.arena.fights, rw: { gems: 80, scrollsW: 3 } },
  { id: 'tower',  title: 'Первый ярус',    text: 'Башня сакуры — проверка силы. Пройдите первый ярус.', goal: 1, of: () => S.tower.best, rw: { gems: 100, keys: 1 } },
  { id: 'ench6',  title: 'Искра удачи',    text: 'Заточите предмет до +6. С +8 неудача может разрушить вещь — берегите её.', goal: 6, of: () => S.stats.best, rw: { gems: 150, blessedA: 1 } },
  { id: 'stage3', title: 'Третий круг',    text: 'Дойдите до этапа 3-1. В новых зонах падают свитки высших грейдов.', goal: 20, of: () => Math.max(S.bestStage || 0, S.maxStage), rw: { gems: 180, crystalsK: 2 } },
  { id: 'dungeon',title: 'Подземелья',     text: 'Подземелья дают золото, свитки и кристаллы. Ключи обновляются каждый день.', goal: 1, of: () => S.stats.dungeonRuns, rw: { gems: 150, keys: 2 } },
  { id: 'awaken', title: 'Пробуждение',    text: 'Дойдите до 50-го этапа и совершите пробуждение: вечные бонусы останутся навсегда.', goal: 1, of: () => S.stats.awakenings, rw: { gems: 400, petals: 15 } },
  { id: 'stage7', title: 'Седьмой круг',   text: 'Дойдите до этапа 7-1 и откройте легендарные грейды снаряжения.', goal: 60, of: () => Math.max(S.bestStage || 0, S.maxStage), rw: { gems: 600, summon: 3 } },
  { id: 'deep',   title: 'Глубина',        text: 'Дойдите до этапа 10-1. Дальше начинается бесконечный путь.', goal: 90, of: () => Math.max(S.bestStage || 0, S.maxStage), rw: { gems: 900, petals: 20 } },
];
function chapterCurrent() { return CHAPTERS[S.chapter.idx] || null; }
function chapterProgress() {
  const c = chapterCurrent(); if (!c) return null;
  const v = Math.min(c.goal, c.of() || 0);
  return { c, v, done: v >= c.goal };
}
function chapterClaim() {
  const p = chapterProgress();
  if (!p || !p.done) return false;
  S.chapter.idx++;
  grant(p.c.rw);
  log(`Глава «${p.c.title}» завершена.`, 'good');
  AU.sfx('success');
  saveLocal();
  return true;
}
function chaptersReady() { const p = chapterProgress(); return p && p.done ? 1 : 0; }

/* ---------- перековка грани ---------- */
function rerollOpts(it) {
  if (!it || it.g === 0) return false;
  const cost = B.rerollCost(it.g);
  if (S.crystals < cost) { toast(`Нужно ${fmt(cost)} ${plural(cost, CRY_W)}`); return false; }
  S.crystals -= cost;
  const before = JSON.stringify(it.opts);
  for (let i = 0; i < 8; i++) { it.opts = B.rollOpts(rnd, it.g); if (JSON.stringify(it.opts) !== before) break; }
  it.pt = 0;
  S.stats.rerolls++;
  recalc();
  AU.sfx('charge');
  saveLocal();
  return true;
}
