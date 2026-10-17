// Симуляция прогрессии для подбора баланса: node sim.js [часы] [порог пробуждения]
// Моделирует: покупки, заточку с искрой и откатом, грань (в среднем), пробуждение, башню.
const B = require('./src/balance.js');
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function run(hours = 8, awAt = 60, verbose = true) {
  const S = {
    s: 0, gold: 0, xp: 0, L: 1, growth: {}, gear: { weapon: { g: 0, e: 0, pt: 0 }, upper: { g: 0, e: 0, pt: 0 } },
    kills: 0, scr: { weapon: [0, 0, 0, 0, 0, 0, 0], armor: [0, 0, 0, 0, 0, 0, 0] }, cry: 0, breaks: 0, deaths: 0, bossFails: 0,
    petals: 0, awLvl: {}, awCount: 0, tower: 0, bestStage: 0,
  };
  B.GROWTH.forEach(g => S.growth[g.id] = 0);
  B.AW_NODES.forEach(n => S.awLvl[n.id] = 0);
  const aw = () => B.awBonus(S.awLvl);
  let t = 0; const T = hours * 3600; const marks = [];
  const gearList = () => Object.entries(S.gear).filter(([, v]) => v).map(([slot, v]) => ({ slot, g: v.g, e: v.e }));
  const stats = () => B.heroStats(S.L, S.growth, gearList(), { atkPct: aw().atkPct, hpPct: aw().hpPct, crit: aw().crit, goldPct: aw().goldPct, xpPct: aw().xpPct, dropPct: aw().dropPct });
  const metric = (st) => {
    const dps = st.atk * (1 + st.crit * (st.critDmg - 1)) * st.aspd;
    const red = st.def / (st.def + B.defK(S.s));
    const ehp = st.hp / (1 - red) + st.regen * 8;
    return Math.log(dps) + .7 * Math.log(ehp);
  };
  const goldMul = () => 1 + aw().goldPct;
  const xpMul = () => 1 + aw().xpPct;
  const dropMul = () => 1 + aw().dropPct;

  function towerClimb() {
    const st = stats();
    for (let f = S.tower + 1; f <= B.TOWER.floors; f++) {
      const g = B.towerGuard(f);
      const kDef = B.defK(g.stageEq);
      const heroRed = st.def / (st.def + kDef), eRed = g.def / (g.def + kDef);
      const dps = st.atk * (1 - eRed) * (1 + st.crit * (st.critDmg - 1)) * st.aspd;
      const ttk = g.hp / Math.max(1, dps);
      const inc = g.atk * (1 - heroRed);
      const taken = inc * (1 + Math.max(0, ttk - 1.2) / 1.25);
      const regen = st.regen * ttk;
      if (ttk <= 40 && taken - regen < st.hp) { S.tower = f; S.petals += (f % 10 === 0 ? 4 + Math.floor(f / 12) : 0); S.gemsDummy = (S.gemsDummy || 0); }
      else break;
    }
  }

  function awaken() {
    const gain = B.AW.gain(S.s);
    S.petals += gain; S.awCount++;
    S.bestStage = Math.max(S.bestStage, S.s);
    S.s = Math.min(B.AW.unlockStage - 10, Math.floor(aw().start)); S.L = 1; S.xp = 0; S.gold = 0;
    for (const g of B.GROWTH) S.growth[g.id] = 0;
    // тратим лепестки на древо: сначала атака/здоровье, затем стадия/золото
    for (const order of ['atk', 'hp', 'gold', 'xp', 'drop', 'crit', 'start', 'ench', 'offline', 'pet', 'bossTime']) {
      const n = B.AW_BY[order];
      while (S.awLvl[order] < n.max && S.petals >= B.awCost(n, S.awLvl[order])) {
        S.petals -= B.awCost(n, S.awLvl[order]); S.awLvl[order]++;
      }
    }
    if (S.petals > 0) { S.gold += 0; }
  }

  let lastZone = -1, nextAw = awAt, failsHere = 0, lastStage = 0;
  while (t < T) {
    // покупки
    for (let guard = 0; guard < 200; guard++) {
      const base = metric(stats()); let best = null;
      for (const g of B.GROWTH) {
        const l = S.growth[g.id]; if (l >= g.max) continue;
        const cost = g.cost(l); S.growth[g.id]++; const d = metric(stats()) - base; S.growth[g.id]--;
        const r = d / cost; if (!best || r > best.r) best = { r, cost, apply: () => S.growth[g.id]++ };
      }
      let gb = 0; B.GRADES.forEach((gr, i) => { if (gr.lvl <= S.L) gb = i; });
      for (const sl of B.SLOTS) for (let g = 0; g <= gb; g++) {
        const cur = S.gear[sl.id]; if (cur && cur.g >= g) continue;
        const cost = B.price(sl.id, g); const old = S.gear[sl.id];
        S.gear[sl.id] = { g, e: 0, pt: 0 }; const d = metric(stats()) - base; S.gear[sl.id] = old;
        const r = d / cost; if (!best || r > best.r) best = { r, cost, apply: () => S.gear[sl.id] = { g, e: 0, pt: 0 } };
      }
      if (!best || best.cost > S.gold) break;
      S.gold -= best.cost; best.apply();
    }
    // заточка
    for (const [slot, it] of Object.entries(S.gear)) {
      if (!it || it.g === 0) continue;
      const kind = slot === 'weapon' ? 'weapon' : 'armor';
      while (S.scr[kind][it.g] > 0 && it.e < (it.e < 3 ? 99 : 8)) {
        S.scr[kind][it.g]--;
        const target = it.e + 1;
        const ch = Math.min(.95, B.enchChance(target) + Math.min(B.ENCH.pityMax, it.pt * B.ENCH.pityStep) + aw().ench);
        if (rnd() < ch) { it.e = target; it.pt = 0; }
        else if (target >= B.ENCH.destroyFrom) { S.cry += B.crystalYield(slot, it.g, it.e); S.gear[slot] = null; S.breaks++; break; }
        else { it.e = B.ENCH.fallback; it.pt++; }
      }
    }
    // кристаллы -> свитки доспеха высшего грейда
    const topG = Math.max(...Object.values(S.gear).filter(Boolean).map(v => v.g));
    if (topG > 0) while (S.cry >= B.SCROLL_COST.armor[topG]) { S.cry -= B.SCROLL_COST.armor[topG]; S.scr.armor[topG]++; }

    const st = stats();
    const dps = st.atk * (1 + st.crit * (st.critDmg - 1)) * st.aspd * 1.7;
    const red = st.def / (st.def + B.defK(S.s));
    const ttk = Math.max(1 / st.aspd, B.mHp(S.s) / dps);
    const inc = B.mAtk(S.s) * (1 - red) * .8 * 1.3;
    const net = inc - st.regen;
    let kt = ttk + .6;
    if (net > 0) { const deaths = (net * ttk) / st.hp; S.deaths += deaths; kt += deaths * 3; }
    t += kt; S.kills++;
    S.gold += B.mGold(S.s) * goldMul(); S.xp += B.mXp(S.s) * xpMul();
    const z = Math.floor(S.s / 10);
    if (rnd() < B.DROP.armorScroll * dropMul()) S.scr.armor[B.zoneDropGrade(z, rnd)]++;
    if (rnd() < B.DROP.weaponScroll * dropMul()) S.scr.weapon[B.zoneDropGrade(z, rnd)]++;
    if (S.kills >= 10) {
      S.kills = 0;
      const hpB = B.mHp(S.s) * B.BOSS.hp, ttkB = hpB / dps;
      const incB = B.mAtk(S.s) * B.BOSS.atk * (1 - red) * .8 - st.regen;
      const ok = ttkB <= B.BOSS.time + aw().bossTime && incB * ttkB < st.hp;
      t += Math.min(ttkB, B.BOSS.time + aw().bossTime) + 1;
      if (ok) {
        S.gold += B.mGold(S.s) * B.BOSS.gold * goldMul(); S.xp += B.mXp(S.s) * B.BOSS.xp * xpMul();
        S.scr[rnd() < .6 ? 'armor' : 'weapon'][B.zoneDropGrade(z, rnd)]++;
        S.s++;
        S.bestStage = Math.max(S.bestStage, S.s);
        failsHere = 0;
        towerClimb();
      } else {
        S.bossFails++; failsHere++;
        if (process.env.DBG && S.bossFails < 12) console.log('BOSSFAIL s=' + S.s + ' dps=' + Math.round(dps) + ' hpB=' + Math.round(hpB) + ' ttkB=' + ttkB.toFixed(1) + ' incB=' + Math.round(incB) + ' hp=' + Math.round(st.hp) + ' regen=' + Math.round(st.regen) + ' time=' + (B.BOSS.time + aw().bossTime));
      }
    }
    while (S.xp >= B.xpNeed(S.L)) { S.xp -= B.xpNeed(S.L); S.L++; }
    // пробуждение: только когда этап действительно упёрся
    if (S.s >= B.AW.unlockStage && failsHere >= 12) {
      const was = S.s;
      failsHere = 0;
      awaken();
      if (verbose) console.log(`t=${(t / 60).toFixed(0).padStart(5)}м ПРОБУЖДЕНИЕ #${S.awCount} с этапа ${was}: лепестков ${S.petals}, старт с этапа ${S.s + 1}, башня ${S.tower}`);
    }
    const nz = Math.floor(S.s / 10);
    if (nz !== lastZone || S.s === B.AW.unlockStage) {
      lastZone = nz;
      const gr = B.SLOTS.map(sl => S.gear[sl.id] ? B.GRADES[S.gear[sl.id].g].short + '+' + S.gear[sl.id].e : '--').join(' ');
      marks.push({ s: S.s });
      if (verbose) console.log(`t=${(t / 60).toFixed(1).padStart(6)}м s=${String(S.s).padStart(4)} L=${String(S.L).padStart(3)} atkG=${S.growth.atk} hpG=${S.growth.hp} bf=${S.bossFails} br=${S.breaks} aw=${S.awCount} pet=${S.petals} tw=${S.tower} | ${gr}`);
    }
  }
  return S;
}
const hours = +process.argv[2] || 8, awAt = +process.argv[3] || 60;
const R = run(hours, awAt);
console.log(`\nИТОГО за ${hours} ч: этап ${R.s} (рекорд ${R.bestStage}), ур. ${R.L}, пробуждений ${R.awCount}, башня ${R.tower}, заточка до +${Math.max(0, ...Object.values(R.gear).filter(Boolean).map(g => g.e))}, сломано ${R.breaks}`);
