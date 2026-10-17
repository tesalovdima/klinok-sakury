// Грубая симуляция прогрессии для подбора баланса
const B = require('./src/balance.js');
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function run(hours = 8, verbose = true) {
  const S = { s: 0, gold: 0, xp: 0, L: 1, growth: {}, gear: { weapon: { g: 0, e: 0 }, upper: { g: 0, e: 0 } }, kills: 0,
    scr: { weapon: [0,0,0,0,0,0,0], armor: [0,0,0,0,0,0,0] }, cry: 0, breaks: 0, deaths: 0, bossFails: 0 };
  B.GROWTH.forEach(g => S.growth[g.id] = 0);
  let t = 0; const T = hours * 3600; const marks = [];
  const gearList = () => Object.entries(S.gear).filter(([, v]) => v).map(([slot, v]) => ({ slot, g: v.g, e: v.e }));
  const stats = () => B.heroStats(S.L, S.growth, gearList());
  const metric = (st) => {
    const dps = st.atk * (1 + st.crit * (st.critDmg - 1)) * st.aspd;
    const red = st.def / (st.def + B.defK(S.s));
    const ehp = st.hp / (1 - red) + st.regen * 8;
    return Math.log(dps) + .7 * Math.log(ehp);
  };
  let lastZone = -1;
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
        S.gear[sl.id] = { g, e: 0 }; const d = metric(stats()) - base; S.gear[sl.id] = old;
        const r = d / cost; if (!best || r > best.r) best = { r, cost, apply: () => S.gear[sl.id] = { g, e: 0 } };
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
        if (rnd() < B.enchChance(it.e + 1)) it.e++;
        else { S.cry += B.crystalYield(slot, it.g, it.e); S.gear[slot] = null; S.breaks++; break; }
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
    S.gold += B.mGold(S.s); S.xp += B.mXp(S.s);
    const z = Math.floor(S.s / 10);
    if (rnd() < B.DROP.armorScroll) S.scr.armor[B.zoneDropGrade(z, rnd)]++;
    if (rnd() < B.DROP.weaponScroll) S.scr.weapon[B.zoneDropGrade(z, rnd)]++;
    if (S.kills >= 10) {
      S.kills = 0;
      const hpB = B.mHp(S.s) * B.BOSS.hp, ttkB = hpB / dps;
      const incB = B.mAtk(S.s) * B.BOSS.atk * (1 - red) * .8 - st.regen;
      const ok = ttkB <= B.BOSS.time && incB * ttkB < st.hp;
      t += Math.min(ttkB, B.BOSS.time) + 1;
      if (ok) {
        S.gold += B.mGold(S.s) * B.BOSS.gold; S.xp += B.mXp(S.s) * B.BOSS.xp;
        S.scr[rnd() < .6 ? 'armor' : 'weapon'][B.zoneDropGrade(z, rnd)]++;
        S.s++;
      } else S.bossFails++;
    }
    while (S.xp >= B.xpNeed(S.L)) { S.xp -= B.xpNeed(S.L); S.L++; }
    const nz = Math.floor(S.s / 10);
    if (nz !== lastZone || (S.s % 5 === 0 && marks.at(-1)?.s !== S.s)) {
      lastZone = nz;
      const gr = B.SLOTS.map(sl => S.gear[sl.id] ? B.GRADES[S.gear[sl.id].g].short + '+' + S.gear[sl.id].e : '--').join(' ');
      marks.push({ s: S.s });
      if (verbose) console.log(`t=${(t/60).toFixed(1).padStart(6)}м s=${String(S.s).padStart(3)} L=${String(S.L).padStart(3)} atkG=${S.growth.atk} hpG=${S.growth.hp} cr=${S.growth.crit} cd=${S.growth.critDmg} as=${S.growth.aspd} ttk=${ttk.toFixed(2)} dth=${S.deaths.toFixed(1)} bf=${S.bossFails} br=${S.breaks} | ${gr}`);
    }
  }
  return S;
}
run(+process.argv[2] || 8);
