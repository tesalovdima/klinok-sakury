/* ===== Баланс: грейды, предметы, монстры, рост ===== */
const BAL = (() => {
  const GRADES = [
    { id: 'NG', label: 'Без грейда', short: 'NG', lvl: 1,  stage: 0,   color: '#cfc5b0' },
    { id: 'D',  label: 'Грейд D',    short: 'D',  lvl: 6,  stage: 6,   color: '#7fe07c' },
    { id: 'C',  label: 'Грейд C',    short: 'C',  lvl: 20, stage: 28,  color: '#5cbcff' },
    { id: 'B',  label: 'Грейд B',    short: 'B',  lvl: 38, stage: 50,  color: '#bd8aff' },
    { id: 'A',  label: 'Грейд A',    short: 'A',  lvl: 58, stage: 80,  color: '#ff9156' },
    { id: 'S',  label: 'Грейд S',    short: 'S',  lvl: 82, stage: 110, color: '#ffd760' },
    { id: 'R',  label: 'Грейд R',    short: 'R',  lvl: 110, stage: 140, color: '#ff5fd2' },
  ];
  const GM = [1, 5, 22, 90, 360, 1400, 5500];                     // множитель статов грейда
  const GP = [30, 300, 2500, 18000, 130000, 800000, 3.6e6];        // цена оружия грейда

  const SLOTS = [
    { id: 'weapon', name: 'Оружие',   kind: 'weapon', pf: 1 },
    { id: 'helmet', name: 'Шлем',     kind: 'armor',  pf: .35 },
    { id: 'upper',  name: 'Доспех',   kind: 'armor',  pf: .6 },
    { id: 'lower',  name: 'Поножи',   kind: 'armor',  pf: .45 },
    { id: 'gloves', name: 'Перчатки', kind: 'armor',  pf: .35 },
    { id: 'boots',  name: 'Сапоги',   kind: 'armor',  pf: .35 },
    { id: 'neck',   name: 'Ожерелье', kind: 'jewel',  pf: .4 },
    { id: 'ear',    name: 'Серьга',   kind: 'jewel',  pf: .35 },
    { id: 'ring',   name: 'Кольцо',   kind: 'jewel',  pf: .35 },
  ];
  const SLOT = Object.fromEntries(SLOTS.map(s => [s.id, s]));
  const ARMOR_SET = ['helmet', 'upper', 'lower', 'gloves', 'boots'];

  const NAMES = {
    weapon: ['Бамбуковый боккэн', 'Стальная катана', 'Клинок ночного ветра', 'Катана лунного серпа', 'Клинок алого феникса', 'Небесная сакура', 'Клинок бездны'],
    helmet: ['Повязка ученика', 'Капюшон странника', 'Кабуто ронина', 'Диадема лунной стражи', 'Венец феникса', 'Корона небесной сакуры', 'Рогатый шлем бездны'],
    upper:  ['Кимоно ученика', 'Куртка странника', 'Кираса ронина', 'Латы лунной стражи', 'Доспех феникса', 'Облачение небесной сакуры', 'Панцирь бездны'],
    lower:  ['Хакама ученика', 'Штаны странника', 'Поножи ронина', 'Юбка-латы лунной стражи', 'Поножи феникса', 'Хакама небесной сакуры', 'Поножи бездны'],
    gloves: ['Обмотки ученика', 'Перчатки странника', 'Наручи ронина', 'Рукавицы лунной стражи', 'Когти феникса', 'Длани небесной сакуры', 'Латные перчатки бездны'],
    boots:  ['Сандалии ученика', 'Сапоги странника', 'Сапоги ронина', 'Поступь лунной стражи', 'Сапоги феникса', 'Шаги небесной сакуры', 'Сапоги бездны'],
    neck:   ['Медное ожерелье', 'Серебряное ожерелье', 'Сапфировое ожерелье', 'Аметистовое ожерелье', 'Рубиновое ожерелье', 'Звёздное ожерелье', 'Ожерелье бездны'],
    ear:    ['Медная серьга', 'Серебряная серьга', 'Сапфировая серьга', 'Аметистовая серьга', 'Рубиновая серьга', 'Звёздная серьга', 'Серьга бездны'],
    ring:   ['Медное кольцо', 'Серебряное кольцо', 'Сапфировое кольцо', 'Аметистовое кольцо', 'Рубиновое кольцо', 'Звёздное кольцо', 'Кольцо бездны'],
  };

  /* Заточка в духе Lineage 2: до +3 безопасно, дальше риск разрушения.
     Выше +16 открывается «легендарная» зона: шансы ниже, но и прирост крупнее. */
  const SAFE = 3, MAX_ENCH = 20;
  const CHANCE = { 4: .70, 5: .66, 6: .62, 7: .58, 8: .54, 9: .50, 10: .46, 11: .42, 12: .38, 13: .34, 14: .30, 15: .26, 16: .22, 17: .18, 18: .15, 19: .12, 20: .09 };
  const enchChance = target => target <= SAFE ? 1 : (CHANCE[target] ?? .08);
  const enchMult = e => 1 + .1 * Math.min(e, SAFE) + .2 * Math.max(0, e - SAFE);

  function itemStats(slot, g, e = 0) {
    const m = GM[g], em = enchMult(e), r = {};
    switch (slot) {
      case 'weapon': r.atk = 60 * m * em; break;
      case 'helmet': r.def = 8 * m * em; r.hp = 90 * m * em; break;
      case 'upper':  r.def = 18 * m * em; r.hp = 200 * m * em; break;
      case 'lower':  r.def = 12 * m * em; r.hp = 130 * m * em; break;
      case 'gloves': r.def = 6 * m * em; r.atkPct = [.03, .05, .07, .09, .12, .15, .18][g] * em; break;
      case 'boots':  r.def = 6 * m * em; r.hp = 80 * m * em; break;
      case 'neck':   r.hpPct = [.04, .06, .09, .12, .16, .2, .25][g] * em; r.regenPct = [.002, .003, .004, .005, .006, .008, .01][g] * em; break;
      case 'ear':    r.crit = [.01, .015, .02, .03, .04, .05, .06][g] * (1 + (em - 1) * .5); break;
      case 'ring':   r.critDmg = [.08, .12, .2, .3, .4, .55, .7][g] * em; break;
    }
    return r;
  }
  const price = (slot, g) => Math.round(GP[g] * SLOT[slot].pf);
  const sellPrice = (slot, g) => Math.floor(price(slot, g) * .2);
  const CRY = [2, 20, 60, 160, 420, 1100, 2800];
  const crMul = g => [1, 1, 2, 4, 8, 16, 32][Math.min(6, Math.max(0, g))];
  const crystalYield = (slot, g, e = 0) => Math.round(CRY[g] * (slot === 'weapon' ? 2 : 1) * (1 + .15 * e));
  // стоимость свитков в кристаллах (NG свитков нет)
  const SCROLL_COST = {
    weapon: [0, 70, 210, 560, 1500, 3900, 9800],
    armor:  [0, 22, 66, 180, 470, 1200, 3000],
  };
  const BLESS_MULT = 7;

  /* Монстры по глобальному индексу этапа s.
     Этапы растут заметно медленнее, чем в 2.x: грейды C/B/A/S/R — это часы, а не минуты. */
  const curve = (s, a, b) => s <= 62 ? Math.pow(a, s) : Math.pow(a, 62) * Math.pow(b, s - 62);
  const mHp   = s => 45 * curve(s, 1.16, 1.065);
  const mAtk  = s => 3.0 * curve(s, 1.145, 1.05);
  const mGold = s => 3.4 * curve(s, 1.165, 1.08);
  const mXp   = s => 4.5 * curve(s, 1.13, 1.06);
  const defK  = s => 14 * curve(s, 1.175, 1.075);
  const BOSS = { hp: 8, atk: 1.45, gold: 10, xp: 8, time: 32 };
  const STAGE_KILLS = 15;

  /* Рост за золото.
     Крит и скорость атаки — долгосрочные вложения: стоимость polynomial × мягкий
     процент, чтобы потолок +90% крита и +1000% скорости был достижим в теории. */
  const GROWTH = [
    { id: 'atk',     name: 'Атака',            val: l => 1.5 * l * Math.pow(1.012, l),  cost: l => 6 * Math.pow(1.08, l),   max: 3000, fmt: 'int' },
    { id: 'hp',      name: 'Здоровье',         val: l => 12 * l * Math.pow(1.012, l),   cost: l => 6 * Math.pow(1.08, l),   max: 3000, fmt: 'int' },
    { id: 'regen',   name: 'Восстановление',   val: l => .5 * l * Math.pow(1.012, l),   cost: l => 9 * Math.pow(1.085, l),  max: 3000, fmt: 'regen' },
    { id: 'crit',    name: 'Шанс крита',       val: l => .002 * l,                     cost: l => 16 * Math.pow(l + 1, 1.9) * Math.pow(1.006, l), max: 450,  fmt: 'pct' },
    { id: 'critDmg', name: 'Урон крита',       val: l => .02 * l,                      cost: l => 30 * Math.pow(1.1, l),   max: 300,  fmt: 'pct' },
    { id: 'aspd',    name: 'Скорость атаки',   val: l => .01 * l,                      cost: l => 28 * Math.pow(l + 1, 2.0) * Math.pow(1.008, l), max: 1000, fmt: 'pct' },
  ];
  const GROWTH_BY = Object.fromEntries(GROWTH.map(g => [g.id, g]));

  const xpNeed = L => Math.round(12 * Math.pow(1.145, L - 1));
  const BASE = { atk: 8, hp: 100, crit: .05, critDmg: 1.5, aspd: 1, regen: 1 };
  const CRIT_CAP = .9;

  /* Итоговые характеристики героя. gear: [{slot,g,e,opts}] */
  function heroStats(level, growth, gear, extra = {}) {
    const gv = id => GROWTH_BY[id].val(growth[id] || 0);
    let atkFlat = BASE.atk + gv('atk'), hpFlat = BASE.hp + gv('hp'), def = 0;
    let atkPct = extra.atkPct || 0, hpPct = extra.hpPct || 0, defPct = 0;
    let crit = BASE.crit + gv('crit') + (extra.crit || 0), critDmg = BASE.critDmg + gv('critDmg') + (extra.critDmg || 0);
    let regenFlat = BASE.regen + gv('regen'), regenPct = 0;
    let goldPct = extra.goldPct || 0, xpPct = extra.xpPct || 0, dropPct = extra.dropPct || 0;
    const bySlot = {};
    for (const it of gear) {
      bySlot[it.slot] = it;
      const st = itemStats(it.slot, it.g, it.e);
      const os = optStats(it.opts);
      atkFlat += st.atk || 0; hpFlat += st.hp || 0; def += st.def || 0;
      atkPct += st.atkPct || 0; hpPct += st.hpPct || 0; crit += st.crit || 0;
      critDmg += st.critDmg || 0; regenPct += st.regenPct || 0;
      for (const k in os) {
        if (k === 'atkPct') atkPct += os[k];
        else if (k === 'hpPct') hpPct += os[k];
        else if (k === 'defPct') defPct += os[k];
        else if (k === 'crit') crit += os[k];
        else if (k === 'critDmg') critDmg += os[k];
        else if (k === 'goldPct') goldPct += os[k];
        else if (k === 'xpPct') xpPct += os[k];
        else if (k === 'dropPct') dropPct += os[k];
      }
    }
    const set = armorSet(bySlot);
    // Экипировка даёт весомые прибавки: каждая часть сета и полный комплект.
    const armorPieces = ARMOR_SET.filter(s => bySlot[s]).length;
    atkPct += .02 * armorPieces;
    hpPct += .03 * armorPieces;
    if (set) { hpPct += .18; defPct += .12; atkPct += .08; }
    if (set && set.glow) atkPct += .10;
    if (SLOTS.every(s => bySlot[s.id])) { atkPct += .05; hpPct += .05; }
    const lvA = 1 + .04 * (level - 1), lvH = 1 + .04 * (level - 1);
    const atk = atkFlat * lvA * (1 + atkPct) * (1 + (extra.atkBuff || 0));
    const hp = hpFlat * lvH * (1 + hpPct);
    def *= (1 + defPct);
    return {
      atk, hp, def,
      crit: Math.min(CRIT_CAP, crit), critDmg,
      aspd: BASE.aspd + gv('aspd'),
      regen: regenFlat * lvH + hp * regenPct,
      goldPct, xpPct, dropPct,
      set, armorPieces,
    };
  }
  // полный сет: 5 частей доспехов одного грейда; сияние при всех >= +6
  function armorSet(bySlot) {
    const parts = ARMOR_SET.map(s => bySlot[s]);
    if (parts.some(p => !p)) return null;
    const g = parts[0].g;
    if (parts.some(p => p.g !== g)) return null;
    return { g, glow: parts.every(p => p.e >= 6) };
  }
  const power = st => Math.round(st.atk * (1 + st.crit * (st.critDmg - 1)) * st.aspd * 4 + st.hp * .5 + st.def * 3);

  /* Какой грейд свитков падает в зоне (индекс зоны -> [основной, шанс нижнего]) */
  const ZONE_DROP = [1, 2, 3, 4, 5, 6];
  const zoneDropGrade = (z, rnd) => {
    const top = ZONE_DROP[Math.min(z, ZONE_DROP.length - 1)];
    if (top > 1 && rnd() < .35) return 1 + Math.floor(rnd() * (top - 1));
    return top;
  };
  const DROP = { armorScroll: .05, weaponScroll: .016, blessed: .0015, crystals: .08, bossBlessed: .12 };

  /* ===== Самоцветы, питомцы, призыв ===== */
  const RAR = [
    { id: 'N',   name: 'Обычный',     color: '#c9c2d8' },
    { id: 'R',   name: 'Редкий',      color: '#5cbcff' },
    { id: 'SR',  name: 'Эпический',   color: '#bd8aff' },
    { id: 'SSR', name: 'Легендарный', color: '#ffd760' },
    { id: 'UR',  name: 'Мифический',  color: '#ff5fd2' },
  ];
  const PET_BONUS = {
    atkPct:  { name: 'Атака',         v: [.05, .10, .18, .30, .50], pct: true },
    hpPct:   { name: 'Здоровье',      v: [.06, .12, .22, .36, .60], pct: true },
    goldPct: { name: 'Золото',        v: [.08, .15, .25, .40, .70], pct: true },
    xpPct:   { name: 'Опыт',          v: [.08, .15, .25, .40, .70], pct: true },
    dropPct: { name: 'Шанс свитков',  v: [.05, .10, .18, .30, .50], pct: true },
    crit:    { name: 'Шанс крита',    v: [.01, .02, .03, .05, .08], pct: true },
    critDmg: { name: 'Урон крита',    v: [.10, .20, .35, .60, 1.0], pct: true },
  };
  const PETS = [
    { id: 'moti',    name: 'Моти',     sp: 'sprite', r: 0, bonus: 'goldPct', pal: { a: '#8fe08a', b: '#d4ffc9', e: '#2a6b3a' }, el: '#b8ff9a' },
    { id: 'pushok',  name: 'Пушок',    sp: 'bunny',  r: 0, bonus: 'hpPct',   pal: { a: '#fff6f8', b: '#ffc2d6', e: '#e2588f' }, el: '#ffd0e4' },
    { id: 'hu',      name: 'Совёнок Ху', sp: 'owl',  r: 0, bonus: 'xpPct',   pal: { a: '#b48a5e', b: '#f2dcb8', e: '#ffb43a' }, el: '#f2dcb8' },
    { id: 'ryzhik',  name: 'Рыжик',    sp: 'cat',    r: 1, bonus: 'atkPct',  pal: { a: '#ffa04a', b: '#fff0dc', e: '#5ac85a' }, el: '#ffb36b' },
    { id: 'yuki',    name: 'Юки',      sp: 'bunny',  r: 1, bonus: 'dropPct', pal: { a: '#cfeaff', b: '#7cc8ff', e: '#2f7fd8' }, el: '#bfe9ff' },
    { id: 'kaze',    name: 'Кадзе',    sp: 'owl',    r: 1, bonus: 'crit',    pal: { a: '#6fa8e8', b: '#e0f0ff', e: '#ffe55c' }, el: '#9ad0ff' },
    { id: 'tsuki',   name: 'Цуки',     sp: 'cat',    r: 2, bonus: 'critDmg', pal: { a: '#6a4fb5', b: '#e2d6ff', e: '#ffd760' }, el: '#c9b8ff' },
    { id: 'hibana',  name: 'Хибана',   sp: 'fox',    r: 2, bonus: 'atkPct',  pal: { a: '#ff7a3c', b: '#fff2e0', e: '#3a1458' }, el: '#ffcf5a' },
    { id: 'koori',   name: 'Коори',    sp: 'dragon', r: 2, bonus: 'hpPct',   pal: { a: '#8fd8ff', b: '#ffffff', e: '#2f7fd8' }, el: '#cff2ff' },
    { id: 'tamamo',  name: 'Тамамо',   sp: 'fox',    r: 3, bonus: 'atkPct',  pal: { a: '#fffaf2', b: '#ff8fc1', e: '#d9434f' }, el: '#ffb3d6' },
    { id: 'hoo',     name: 'Хоо',      sp: 'owl',    r: 3, bonus: 'goldPct', pal: { a: '#ff5a3c', b: '#ffd760', e: '#3a1458' }, el: '#ff9a4c' },
    { id: 'midori',  name: 'Мидори',   sp: 'dragon', r: 3, bonus: 'critDmg', pal: { a: '#3fbf8a', b: '#d8ffe8', e: '#ffd760' }, el: '#74e0a8' },
    { id: 'tenryu',  name: 'Тэнрю',    sp: 'dragon', r: 4, bonus: 'atkPct',  pal: { a: '#ffd760', b: '#fff8de', e: '#d9434f' }, el: '#fff0a0' },
    { id: 'yami',    name: 'Ями',      sp: 'fox',    r: 4, bonus: 'critDmg', pal: { a: '#2b1a40', b: '#ff62d4', e: '#ff62d4' }, el: '#ff62d4' },
    { id: 'kitsune', name: 'Кицунэ',   sp: 'fox',    r: 3, bonus: 'crit',    pal: { a: '#ffd760', b: '#fff8e0', e: '#d9437f' }, el: '#ffd760' },
    { id: 'tsuru',   name: 'Цуру',     sp: 'dragon', r: 3, bonus: 'hpPct',   pal: { a: '#ffffff', b: '#ffd0e4', e: '#d9434f' }, el: '#ffffff' },
    { id: 'sakura',  name: 'Сакура-тян', sp: 'fox',  r: 2, bonus: 'atkPct',  pal: { a: '#ffb7d5', b: '#fff0f6', e: '#d9437f' }, el: '#ffd0e4', event: true },
  ];
  const PET = Object.fromEntries(PETS.map(p => [p.id, p]));
  const PET_ATK = [.4, .6, .9, 1.4, 2.2];          // урон питомца в долях атаки героя
  const PET_DUPES = [1, 2, 3, 4];                    // дубликатов до следующей звезды
  const PET_MAX_STARS = 5;
  const starMult = st => 1 + .25 * (st - 1);
  const petValue = (pet, stars) => PET_BONUS[pet.bonus].v[pet.r] * starMult(stars);
  const COLLECTION_SHARE = .2;
  const GACHA = {
    rates: [.55, .30, .115, .03, .005],
    cost1: 150, cost10: 1350, first10: 490,   // первый десяток со скидкой — крючок на старте
    pity: 50,               // гарантированный легендарный или выше
    urInPity: .15,
  };
  function rollRarity(rnd, pityHit, minR = 0) {
    if (pityHit) return rnd() < GACHA.urInPity ? 4 : 3;
    let x = rnd(), r = 0, acc = 0;
    for (; r < GACHA.rates.length; r++) { acc += GACHA.rates[r]; if (x < acc) break; }
    return Math.max(minR, Math.min(4, r));
  }
  // бонусы всех питомцев: активный даёт полный бонус, остальные 20% (коллекция)
  function petBonuses(owned, active) {
    const out = { atkPct: 0, hpPct: 0, goldPct: 0, xpPct: 0, dropPct: 0, crit: 0, critDmg: 0 };
    for (const id in owned) {
      const p = PET[id]; if (!p) continue;
      const v = petValue(p, owned[id].stars);
      out[p.bonus] += id === active ? v : v * COLLECTION_SHARE;
    }
    return out;
  }

  /* ===== Арена ===== */
  const LEAGUES = [
    { name: 'Бронза',  min: 0,    daily: 50,  color: '#d99a62' },
    { name: 'Серебро', min: 1100, daily: 90,  color: '#c9d6e6' },
    { name: 'Золото',  min: 1250, daily: 140, color: '#ffd760' },
    { name: 'Платина', min: 1450, daily: 210, color: '#7fe3d8' },
    { name: 'Алмаз',   min: 1700, daily: 300, color: '#8fc8ff' },
    { name: 'Мастер',  min: 2000, daily: 420, color: '#ff5fd2' },
  ];
  const league = r => { let i = 0; LEAGUES.forEach((l, j) => { if (r >= l.min) i = j; }); return i; };
  const ARENA = { start: 1000, K: 32, tickets: 5, refillCost: 60, refillMax: 3, winGems: 20, loseGems: 5, hpMul: 1.05, seasonDays: 7, seasonEpoch: Date.UTC(2026, 9, 5) };
  const arenaSeason = (now = Date.now()) => {
    const span = ARENA.seasonDays * 864e5;
    let idx = Math.floor((now - ARENA.seasonEpoch) / span);
    if (!Number.isFinite(idx) || idx < 0) idx = 0;
    const start = ARENA.seasonEpoch + idx * span;
    return { idx, num: idx + 1, start, end: start + span, left: start + span - now };
  };
  const arenaSeasonReward = rating => {
    const i = league(rating);
    return { gems: 60 + 60 * i, crystals: 200 + 250 * i, petals: Math.floor(i / 2), summon: i >= 2 ? 1 : 0 };
  };
  const eloExpect = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
  const eloDelta = (a, b, win) => Math.round(ARENA.K * ((win ? 1 : 0) - eloExpect(a, b)));
  // урон в PvP: защита режет не более 45% и мягче, чтобы бои не были вечными
  const pvpHit = (atk, def) => atk * (1 - Math.min(.45, def / (def + 6 * atk)));
  const BOT_NAMES = ['Акира', 'Юкино', 'Харуто', 'Мио', 'Рин', 'Кайто', 'Сора', 'Хината', 'Рэйдзи', 'Аой', 'Кэнта', 'Нацуми', 'Сюн', 'Мэй', 'Такуми', 'Кохару', 'Рэн', 'Сакура', 'Даити', 'Юи', 'Итиро', 'Хонока', 'Ямато', 'Кирара'];

  /* ===== Задания, достижения, вход, пропуск ===== */
  const DAILY = [
    { id: 'kills',   name: 'Победить 150 монстров',      goal: 150, gems: 50 },
    { id: 'bosses',  name: 'Победить 3 боссов',           goal: 3,   gems: 60 },
    { id: 'enchant', name: 'Заточить снаряжение 3 раза',  goal: 3,   gems: 50, scrollsA: 2 },
    { id: 'growth',  name: 'Улучшить рост 20 раз',        goal: 20,  gems: 40 },
    { id: 'arena',   name: 'Провести 3 боя на арене',     goal: 3,   gems: 60 },
    { id: 'summon',  name: 'Призвать питомца',            goal: 1,   gems: 40 },
    { id: 'dungeon', name: 'Пройти подземелье',           goal: 1,   gems: 60, crystalsK: 1 },
    { id: 'tower',   name: 'Пройти ярус башни',           goal: 1,   gems: 50, petals: 2 },
    { id: 'exped',   name: 'Завершить экспедицию',        goal: 1,   gems: 40, crystalsK: 1 },
    { id: 'ad',      name: 'Получить бонус за рекламу',   goal: 1,   gems: 50 },
  ];
  const DAILY_CHEST = { gems: 150, xp: 200 };
  const WEEKLY = [
    { id: 'kills',   name: 'Победить 1500 монстров',        goal: 1500, rw: { gems: 80 } },
    { id: 'bosses',  name: 'Победить 20 боссов',             goal: 20,   rw: { gems: 120, crystals: 300 } },
    { id: 'arena',   name: 'Провести 10 боёв на арене',      goal: 10,   rw: { gems: 100, summon: 1 } },
    { id: 'dungeon', name: 'Пройти 5 подземелий',            goal: 5,    rw: { crystals: 500 } },
    { id: 'tower',   name: 'Пройти 5 ярусов башни',          goal: 5,    rw: { petals: 3 } },
    { id: 'enchant', name: 'Заточить снаряжение 15 раз',     goal: 15,   rw: { gems: 90, scrollsA: 2 } },
    { id: 'exped',   name: 'Завершить 3 экспедиции',         goal: 3,    rw: { petals: 3 } },
  ];
  const WEEKLY_CHEST = { gems: 300, crystals: 1000, summon: 3, petals: 5 };
  const EXPO = [
    { id: 'patrol', name: 'Садовый патруль', hours: 1, rw: { goldKills: 250, crystals: 80 } },
    { id: 'night',  name: 'Ночной дозор',    hours: 4, rw: { crystals: 600, petals: 2 } },
    { id: 'sky',    name: 'Небесный поход',  hours: 8, rw: { gems: 45, petals: 4, summon: 1 } },
  ];
  const QUEST_XP = 120;
  const ACH = [
    { id: 'stage',  stat: 'bestStage', name: v => `Дойти до этапа ${Math.floor(v / 10) + 1}-${v % 10 + 1}`, tiers: [10, 20, 30, 40, 50, 60, 80, 100, 150, 200, 300], gems: [50, 80, 100, 150, 200, 250, 300, 400, 500, 700, 1000] },
    { id: 'level',  stat: 'level',    name: v => `Достичь ${v} уровня`, tiers: [10, 20, 30, 40, 50, 60, 70, 90], gems: [40, 60, 80, 100, 150, 200, 300, 400] },
    { id: 'kills',  stat: 'kills',    name: v => `Победить ${v.toLocaleString('ru-RU')} монстров`, tiers: [500, 2000, 10000, 50000, 200000, 1000000], gems: [40, 80, 150, 250, 400, 800] },
    { id: 'ench',   stat: 'best',     name: v => `Заточить вещь до +${v}`, tiers: [4, 7, 10, 13, 16, 18, 20], gems: [30, 80, 150, 300, 600, 900, 1500] },
    { id: 'summon', stat: 'summons',  name: v => `Призвать питомцев ${v} раз`, tiers: [10, 50, 150, 400], gems: [50, 120, 250, 500] },
    { id: 'arena',  stat: 'arenaWins', name: v => `Победить на арене ${v} раз`, tiers: [5, 25, 100, 300], gems: [50, 120, 250, 500] },
    { id: 'pets',   stat: 'petsOwned', name: v => `Собрать ${v} разных питомцев`, tiers: [3, 6, 10, 14], gems: [60, 150, 300, 600] },
    { id: 'tower',  stat: 'towerBest', name: v => `Пройти ${v} ярусов башни`, tiers: [1, 10, 25, 50, 80, 120], gems: [50, 120, 250, 450, 700, 1200] },
    { id: 'awaken', stat: 'awakenings', name: v => `Совершить пробуждение ${v} раз`, tiers: [1, 3, 6, 10], gems: [200, 400, 700, 1200] },
    { id: 'dungeon',stat: 'dungeonRuns', name: v => `Пройти подземелий ${v} раз`, tiers: [1, 10, 40, 120], gems: [40, 100, 220, 450] },
  ];
  const LOGIN = [
    { gems: 50 }, { goldKills: 250 }, { scrollsA: 3 }, { gems: 100 }, { blessedA: 1 }, { summon: 1 }, { gems: 300, petals: 5 },
  ];
  const PASS = { tiers: 30, xpPer: 1000, seasonDays: 28, epoch: Date.UTC(2026, 9, 1), bossXp: 15, arenaXp: 30 };

  /* ---------- сезонное событие ---------- */
  const EVENT = {
    id: 'hanami',
    name: 'Праздник сакуры',
    seasonDays: 14,
    epoch: Date.UTC(2026, 9, 15),
    killChance: .12,
    killCap: 900,
    boss: 10,
    dungeon: 40,
    arena: 15,
    tower: 12,
    awaken: 150,
    milestones: [
      { at: 300,  rw: { gems: 40 } },
      { at: 700,  rw: { crystals: 300 } },
      { at: 1200, rw: { scrollsW: 2, summon: 1 } },
      { at: 1800, rw: { petals: 5 } },
      { at: 2600, rw: { gems: 100, crystals: 600 } },
      { at: 3600, rw: { scrollsA: 3, scrollsW: 2 } },
      { at: 4800, rw: { petals: 10, gems: 150 } },
      { at: 6000, rw: { pet: 'sakura', gems: 100 } },
    ],
    shop: [
      { id: 'gems',    name: 'Самоцветы ×50',   ico: 'gem',     cost: 150, limit: 5,  rw: { gems: 50 } },
      { id: 'crystal', name: 'Кристаллы ×250',  ico: 'crystal', cost: 100, limit: 10, rw: { crystals: 250 } },
      { id: 'scroll',  name: 'Свитки оружия ×2', ico: 'scroll',  cost: 180, limit: 5,  rw: { scrollsW: 2 } },
      { id: 'ticket',  name: 'Билет призыва',   ico: 'ticket',  cost: 90,  limit: 10, rw: { summon: 1 } },
      { id: 'petal',   name: 'Лепестки ×6',     ico: 'petal',   cost: 450, limit: 3,  rw: { petals: 6 } },
      { id: 'gold',    name: 'Золото',          ico: 'gold',    cost: 80,  limit: 20, rw: { goldKills: 30 } },
    ],
  };
  const LANTERN = {
    id: 'lantern',
    name: 'Ночь фонарей',
    seasonDays: 14,
    epoch: Date.UTC(2026, 9, 22),
    killChance: .08,
    killCap: 600,
    boss: 8,
    dungeon: 30,
    arena: 10,
    tower: 8,
    awaken: 100,
    milestones: [
      { at: 200,  rw: { gems: 30 } },
      { at: 500,  rw: { crystals: 250 } },
      { at: 900,  rw: { scrollsA: 2, summon: 1 } },
      { at: 1400, rw: { petals: 4 } },
      { at: 2100, rw: { gems: 80, crystals: 500 } },
      { at: 3000, rw: { petals: 10, gems: 120 } },
    ],
    shop: [
      { id: 'gems',    name: 'Самоцветы ×50',    ico: 'gem',     cost: 120, limit: 5,  rw: { gems: 50 } },
      { id: 'crystal', name: 'Кристаллы ×250',   ico: 'crystal', cost: 80,  limit: 10, rw: { crystals: 250 } },
      { id: 'ticket',  name: 'Билет призыва',    ico: 'ticket',  cost: 70,  limit: 10, rw: { summon: 1 } },
      { id: 'petal',   name: 'Лепестки ×6',      ico: 'petal',   cost: 400, limit: 3,  rw: { petals: 6 } },
      { id: 'scroll',  name: 'Свитки брони ×2',  ico: 'scroll',  cost: 150, limit: 5,  rw: { scrollsA: 2 } },
    ],
  };
  function passReward(tier, prem) {          // tier: 1..30
    if (prem) {
      if (tier === 30) return { pet: 'tenryu', cosmetic: 'petals', petals: 20 };
      if (tier % 10 === 0) return { summon: 2, petals: 8 };
      if (tier % 5 === 0) return { blessedA: 2, blessedW: 1 };
      return tier % 2 ? { gems: 60 } : { scrollsA: 3, scrollsW: 1 };
    }
    if (tier === 30) return { petals: 10 };
    if (tier % 10 === 0) return { summon: 1 };
    if (tier % 5 === 0) return { gems: 100 };
    return [{ goldKills: 150 }, { scrollsA: 2 }, { crystalsK: 1 }, { scrollsW: 1 }][tier % 4];
  }
  const seasonOf = now => Math.floor((now - PASS.epoch) / (PASS.seasonDays * 864e5));
  const seasonEnd = season => PASS.epoch + (season + 1) * PASS.seasonDays * 864e5;

  /* ===== Фонд сакуры: покупка, которая возвращает самоцветы за уровни ===== */
  const FUND = { id: 'fund', rub: 399, gems: 150, bonus: 900, levels: [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60] };
  const FUND_REWARD = FUND.gems;
  const FUND_TOTAL = FUND.gems * FUND.levels.length + FUND.bonus;

  /* ===== Магазин: покупки и самоцветы ===== */
  const IAP = [
    { id: 'starter', name: 'Стартовый набор', rub: 99, once: true, gems: 800, pet: 'hibana', scrollsA: 10, blessedA: 2, tag: 'Один раз' },
    { id: 'monthly', name: 'Лунная карта',    rub: 299, gems: 300, daily: 100, days: 30, tag: '3300 💎 за месяц' },
    { id: 'fund',    name: 'Фонд сакуры',     rub: 399, tag: `${FUND_TOTAL} 💎 за уровни` },
    { id: 'pass',    name: 'Пропуск сакуры',  rub: 399, tag: 'Сезон' },
    { id: 'noads',   name: 'Без рекламы',     rub: 249, once: true, tag: 'Навсегда' },
    { id: 'gems_s',  name: 'Горсть самоцветов',  rub: 99,   gems: 300 },
    { id: 'gems_m',  name: 'Мешочек самоцветов', rub: 249,  gems: 1100, bonus: 100 },
    { id: 'gems_l',  name: 'Сундук самоцветов',  rub: 649,  gems: 3200, bonus: 400 },
    { id: 'gems_xl', name: 'Сокровищница',       rub: 1490, gems: 8000, bonus: 1500 },
    { id: 'gems_xxl',name: 'Сакура бездны',      rub: 2990, gems: 17000, bonus: 4000 },
  ];
  const IAP_BY = Object.fromEntries(IAP.map(p => [p.id, p]));
  const GEM_SHOP = {
    gold: { gems: 100, kills: 400 },
    scrollsA5: { gems: 100 },
    blessedA: { gems: 150 },
    blessedW: { gems: 380 },
    key: { gems: 30 },
  };
  const ADS = { gems: 40, gemsPerDay: 3, goldBoostMin: 20, interstitialGap: 180 };

  /* Заточка без излишней жестокости: до +7 неудача лишь откатывает к +3,
     разрушение начинается с +8. Каждая неудача даёт «искру» +6% к следующей попытке. */
  const ENCH = { destroyFrom: 8, fallback: 3, pityStep: .06, pityMax: .36 };

  /* ===== Грань предмета: случайные свойства, которые перековываются =====
     Как «атрибуты» в Lineage 2: одна и та же вещь грейда может быть лучше или хуже.
     Это даёт смысл фармить свой грейд и тратить кристаллы на перековку. */
  const ITEM_OPTS = [
    { k: 'atkPct',  lo: .02,  hi: .05,  name: 'Атака' },
    { k: 'hpPct',   lo: .03,  hi: .07,  name: 'Здоровье' },
    { k: 'defPct',  lo: .03,  hi: .07,  name: 'Защита' },
    { k: 'crit',    lo: .006, hi: .02,  name: 'Шанс крита' },
    { k: 'critDmg', lo: .03,  hi: .10,  name: 'Урон крита' },
    { k: 'goldPct', lo: .03,  hi: .08,  name: 'Золото' },
    { k: 'xpPct',   lo: .03,  hi: .08,  name: 'Опыт' },
    { k: 'dropPct', lo: .02,  hi: .06,  name: 'Свитки' },
  ];
  const OPT_BY = Object.fromEntries(ITEM_OPTS.map(o => [o.k, o]));
  const optCount = g => g >= 4 ? 2 : g >= 1 ? 1 : 0;
  const OPT_ROLL = [1, 1, 2, 4, 8, 16, 32];
  function rollOpts(rnd, g) {
    const n = optCount(g), used = new Set(), out = [];
    for (let i = 0; i < n; i++) {
      const pool = ITEM_OPTS.filter(o => !used.has(o.k));
      if (!pool.length) break;
      const o = pool[Math.floor(rnd() * pool.length)];
      used.add(o.k);
      const base = o.lo + (o.hi - o.lo) * rnd();
      out.push({ k: o.k, v: +(base * (1 + .35 * g)).toFixed(4) });
    }
    return out;
  }
  function optStats(opts) {
    const out = {};
    for (const o of opts || []) out[o.k] = (out[o.k] || 0) + o.v;
    return out;
  }
  const rerollCost = g => Math.round(22 * OPT_ROLL[Math.min(6, Math.max(0, g))]);

  /* ===== Пробуждение (перерождение) =====
     Сброс этапа, уровня и роста за золото, но снаряжение, питомцы и коллекции остаются.
     Лепестки сакуры покупают вечные бонусы — так игра не заканчивается на последнем этапе. */
  const AW = {
    unlockStage: 50,
    gain: peak => Math.floor(3 * Math.pow(Math.max(0, peak) / 10, 1.45)),
  };
  const AW_NODES = [
    { id: 'atk',     name: 'Сила клинка',  desc: 'Атака',              max: 20, base: 2, val: l => .06 * l, fmt: 'pct' },
    { id: 'hp',      name: 'Стойкость',    desc: 'Здоровье',           max: 20, base: 2, val: l => .06 * l, fmt: 'pct' },
    { id: 'gold',    name: 'Дар сакуры',   desc: 'Золото',             max: 15, base: 2, val: l => .12 * l, fmt: 'pct' },
    { id: 'xp',      name: 'Озарение',     desc: 'Опыт',               max: 15, base: 2, val: l => .12 * l, fmt: 'pct' },
    { id: 'drop',    name: 'Зов лепестков',desc: 'Шанс свитков',       max: 10, base: 3, val: l => .08 * l, fmt: 'pct' },
    { id: 'crit',    name: 'Точность',     desc: 'Шанс крита',         max: 10, base: 3, val: l => .015 * l, fmt: 'pct' },
    { id: 'start',   name: 'Память пути',  desc: 'Старт после пробуждения', max: 10, base: 2, val: l => 4 * l, fmt: 'int' },
    { id: 'offline', name: 'Тишина',       desc: 'Офлайн-доход',       max: 8,  base: 4, val: l => 2 * l, fmt: 'hours' },
    { id: 'ench',    name: 'Мастерство',   desc: 'Шанс заточки',       max: 8,  base: 4, val: l => .015 * l, fmt: 'pct' },
    { id: 'bossTime',name: 'Терпение',     desc: 'Время на босса',     max: 5,  base: 5, val: l => 3 * l, fmt: 'sec' },
    { id: 'pet',     name: 'Единство',     desc: 'Урон питомца',       max: 10, base: 3, val: l => .15 * l, fmt: 'pct' },
  ];
  const AW_BY = Object.fromEntries(AW_NODES.map(n => [n.id, n]));
  const awCost = (node, l) => Math.round(node.base * Math.pow(l + 1, 1.55));
  function awBonus(lvl) {
    const l = id => (lvl && lvl[id]) || 0;
    return {
      atkPct: .06 * l('atk'), hpPct: .06 * l('hp'), goldPct: .12 * l('gold'), xpPct: .12 * l('xp'),
      dropPct: .08 * l('drop'), crit: .015 * l('crit'), start: 4 * l('start'),
      offline: 2 * l('offline'), ench: .015 * l('ench'), bossTime: 3 * l('bossTime'), pet: .15 * l('pet'),
    };
  }

  /* ===== Башня сакуры: вечная проверка силы ===== */
  const TOWER = {
    floors: 120,
    stageEq: f => 2 + (f - 1) * 1.35,
    hp: 7, atk: 1.0, def: .9,
    weeklyGems: best => 40 + Math.floor(best * 3),
    reward(f) {
      const se = this.stageEq(f), g = Math.min(6, 1 + Math.floor(f / 18));
      const r = { gold: Math.round(mGold(se) * 25), crystals: Math.round(14 * crMul(g) * (1 + f * .06)) };
      if (f % 5 === 0) r.gems = 25 + (f % 10 === 0 ? 25 : 0);
      if (f % 3 === 0) r.scrollsA = 1 + Math.floor(f / 30);
      if (f % 10 === 0) { r.petals = 4 + Math.floor(f / 12); r.summon = 1; }
      return r;
    },
  };
  function towerGuard(f) {
    const se = TOWER.stageEq(f), loop = Math.floor((f - 1) / 6);
    return {
      stageEq: se, hp: mHp(se) * TOWER.hp, atk: mAtk(se) * TOWER.atk, def: defK(se) * TOWER.def,
      crit: .03, critDmg: 1.5, aspd: 1, regen: 0,
      name: `Страж ${f}-го яруса`, loop,
    };
  }

  /* ===== Подземелья дня ===== */
  const DUNGEONS = [
    { id: 'gold',    name: 'Золотая жила',      icon: 'gold',    stage: 6,  desc: 'Золото с монстров' },
    { id: 'scrolls', name: 'Архив свитков',     icon: 'quests',  stage: 20, desc: 'Свитки заточки топового грейда' },
    { id: 'crystal', name: 'Кристальная шахта', icon: 'crystal', stage: 38, desc: 'Кристаллы для перековки' },
    { id: 'xp',      name: 'Зал памяти',        icon: 'hp',      stage: 55, desc: 'Опыт уровня' },
    { id: 'petals',  name: 'Сакуровый склеп',   icon: 'petal',   stage: 62, desc: 'Лепестки и кристаллы' },
    { id: 'blessed', name: 'Благословенный зал', icon: 'scroll', stage: 75, desc: 'Благословенные свитки' },
  ];
  const DUNGEON_BY = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));
  const DKEYS = { perDay: 3, adExtra: 2, gemCost: 40, gemMax: 3 };
  function dungeonGuard(id, stage) {
    const m = { gold: 1, scrolls: .9, crystal: 1, xp: .8, petals: 1.1, blessed: 1.2 }[id] || 1;
    return { hp: mHp(stage) * 9 * m, atk: mAtk(stage) * .85, def: defK(stage) * .7, crit: .05, critDmg: 1.5, aspd: 1, regen: 0 };
  }
  function dungeonReward(id, stage) {
    const g = Math.min(6, 1 + Math.floor(stage / 12));
    switch (id) {
      case 'gold':    return { gold: Math.round(mGold(stage) * 60) };
      case 'scrolls': return { scrollsA: 2 + Math.floor(stage / 30), scrollsW: 1, blessedA: stage >= 30 ? 1 : 0 };
      case 'crystal': return { crystals: Math.round(30 * crMul(g) * 2) };
      case 'xp':      return { xp: Math.round(mXp(stage) * 70) };
      case 'petals':  return { petals: 1 + Math.floor(stage / 35), crystals: Math.round(40 * crMul(g)) };
      case 'blessed': return { blessedA: 1, blessedW: stage >= 80 ? 1 : 0, scrollsA: 1 };
    }
    return {};
  }

  /* ===== Когда открывается контент ===== */
  const UNLOCK = {
    pets:      { level: 5,  label: 'уровень 5' },
    arena:     { stage: 12, label: 'этап 12' },
    world:     { stage: 15, label: 'этап 15' },
    dungeon:   { stage: 6,  label: 'этап 6' },
    awakening: { stage: 50, label: 'этап 50' },
    chat:      { stage: 8,  label: 'этап 8' },
    pass:      { level: 5,  label: 'уровень 5' },
    shop:      { level: 3,  label: 'уровень 3' },
  };

  return {
    RAR, PET_BONUS, PETS, PET, PET_ATK, PET_DUPES, PET_MAX_STARS, starMult, petValue, COLLECTION_SHARE, GACHA, rollRarity, petBonuses,
    LEAGUES, league, ARENA, eloExpect, eloDelta, pvpHit, BOT_NAMES, UNLOCK, CRIT_CAP, arenaSeason, arenaSeasonReward,
    DAILY, DAILY_CHEST, WEEKLY, WEEKLY_CHEST, EXPO, QUEST_XP, ACH, LOGIN, PASS, passReward, seasonOf, seasonEnd, EVENT, LANTERN,
    IAP, IAP_BY, GEM_SHOP, ADS, FUND, FUND_TOTAL,
    GRADES, GM, GP, SLOTS, SLOT, ARMOR_SET, NAMES, SAFE, MAX_ENCH, enchChance, enchMult, ENCH,
    itemStats, price, sellPrice, crystalYield, SCROLL_COST, BLESS_MULT,
    ITEM_OPTS, OPT_BY, optCount, optStats, rollOpts, rerollCost,
    AW, AW_NODES, AW_BY, awCost, awBonus,
    TOWER, towerGuard, DUNGEONS, DUNGEON_BY, DKEYS, dungeonGuard, dungeonReward,
    mHp, mAtk, mGold, mXp, defK, BOSS, STAGE_KILLS, GROWTH, GROWTH_BY, xpNeed, BASE, heroStats, armorSet, power,
    zoneDropGrade, DROP,
  };
})();


/* ===== Графика: аниме-героиня, монстры, фоны, иконки ===== */
const ART = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- утилиты ---------- */
  function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const dark = (c, t = .3) => mix(c, '#1a0f2a', t);
  const light = (c, t = .3) => mix(c, '#ffffff', t);
  function hash(n) { n = (n << 13) ^ n; return 1 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824; } // -1..1
  const h01 = n => (hash(n) + 1) / 2;
  function fillStroke(ctx, fill, stroke, lw) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }

  /* ---------- палитры экипировки ---------- */
  const OUT = '#2b1532';
  const GRADE_COL = ['#cfc5b0', '#7fe07c', '#5cbcff', '#bd8aff', '#ff9156', '#ffd760', '#ff5fd2'];

  function enchGlow(e, t = 0) {
    if (e >= 16) return `hsl(${(t * 120) % 360},100%,65%)`;
    if (e >= 13) return '#ffd04a';
    if (e >= 10) return '#ff5b6e';
    if (e >= 7) return '#b47cff';
    if (e >= 4) return '#6fd3ff';
    return null;
  }

  function hexA(c, a) {
    if (c.startsWith('hsl')) return c.replace('hsl', 'hsla').replace(')', `,${a})`);
    const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`;
  }
  const easeOut = x => 1 - (1 - x) * (1 - x), easeIn = x => x * x, easeInOut = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  /* ---------- монстры ---------- */
  // m: {type, pal:{a,b,c,e}, flash, boss, t, atk(0..1)}
  const MON = {};
  const F = (m, c) => m.flash > 0 ? '#ffffff' : (m.tintA > 0 ? mix(c, m.tintC, m.tintA) : c);
  function monEyes(ctx, m, x1, x2, y, s = 1, angry = false) {
    for (const ex of [x1, x2]) {
      ctx.fillStyle = F(m, '#2a1238'); ell(ctx, ex, y, 3.2 * s, 4.4 * s); ctx.fill();
      ctx.fillStyle = m.pal.e || '#ffffff'; ell(ctx, ex - 1 * s, y - 1.6 * s, 1.3 * s, 1.5 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, ex + .9 * s, y + 1.6 * s, .7 * s, .6 * s); ctx.fill();
    }
    if (angry) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x1 - 4 * s, y - 7 * s); ctx.lineTo(x1 + 3 * s, y - 5 * s); ctx.moveTo(x2 + 4 * s, y - 7 * s); ctx.lineTo(x2 - 3 * s, y - 5 * s); ctx.stroke();
    }
  }
  function blush(ctx, x1, x2, y) { ctx.fillStyle = 'rgba(255,110,150,.4)'; ell(ctx, x1, y, 3, 1.6); ctx.fill(); ell(ctx, x2, y, 3, 1.6); ctx.fill(); }

  MON.slime = { top: 34, draw(ctx, m) {
    const sq = 1 + .07 * Math.sin(m.t * 6) + (m.atk > 0 ? .15 * Math.sin(m.atk * Math.PI) : 0);
    const w = 22 * sq, h = 24 / sq;
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w * 1.05, -h * 1.35, w * 1.05, -h * 1.35, w, 0); ctx.quadraticCurveTo(0, 3, -w, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, F(m, m.pal.b)); g.addColorStop(1, F(m, m.pal.a));
    fillStroke(ctx, g, dark(m.pal.a, .55), 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, -w * .45, -h * .78, 5, 3, -.5); ctx.fill(); ell(ctx, -w * .2, -h * .92, 1.6, 1.4); ctx.fill();
    monEyes(ctx, m, -9, 2, -h * .5, 1, m.boss);
    blush(ctx, -14, 7, -h * .32);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6, -h * .3); ctx.quadraticCurveTo(-4.5, -h * .22, -3, -h * .3); ctx.quadraticCurveTo(-1.5, -h * .22, 0, -h * .3); ctx.stroke();
  } };

  MON.mushroom = { top: 46, draw(ctx, m) {
    const hop = Math.abs(Math.sin(m.t * 5)) * 3 + (m.atk > 0 ? Math.sin(m.atk * Math.PI) * 6 : 0);
    ctx.translate(0, -hop);
    ctx.fillStyle = F(m, dark(m.pal.c, .3)); ell(ctx, -6, -1, 4, 2.5); ctx.fill(); ell(ctx, 6, -1, 4, 2.5); ctx.fill();
    rr(ctx, -11, -26, 22, 25, 9); fillStroke(ctx, F(m, m.pal.c), OUT, 2);
    monEyes(ctx, m, -6, 3, -13, .85, m.boss);
    blush(ctx, -9, 6, -8);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(-1.5, -8, 2, .2, Math.PI - .2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24, -24); ctx.bezierCurveTo(-24, -50, 24, -50, 24, -24); ctx.quadraticCurveTo(0, -18, -24, -24); ctx.closePath();
    fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    ctx.fillStyle = F(m, '#fff6ee');
    for (const [sx, sy, r] of [[-12, -34, 4], [3, -40, 3.4], [13, -30, 3.6], [-3, -28, 2.4]]) { ell(ctx, sx, sy, r, r * .85); ctx.fill(); }
  } };

  MON.bat = { top: 66, fly: true, draw(ctx, m) {
    const y = -44 + Math.sin(m.t * 4) * 5, fl = Math.sin(m.t * 18);
    ctx.fillStyle = 'rgba(15,6,30,.2)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 14 : 0, y);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 8, -2);
      ctx.quadraticCurveTo(s * 22, -16 - fl * 8, s * 30, -4 - fl * 10);
      ctx.quadraticCurveTo(s * 24, -2, s * 22, 4 - fl * 4); ctx.quadraticCurveTo(s * 17, 0, s * 14, 6);
      ctx.quadraticCurveTo(s * 10, 2, s * 8, 4); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 2);
    }
    ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-11, -20); ctx.lineTo(-3, -12); ctx.moveTo(9, -8); ctx.lineTo(11, -20); ctx.lineTo(3, -12);
    ctx.fillStyle = F(m, m.pal.a); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke();
    ell(ctx, 0, 0, 13, 12); fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    monEyes(ctx, m, -6, 3, -2, .8, true);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-1.5, 9); ctx.lineTo(0, 5); ctx.fill();
  } };

  MON.goblin = { top: 52, draw(ctx, m) {
    const step = Math.sin(m.t * 8) * 2, sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0;
    ctx.fillStyle = F(m, dark(m.pal.a, .2)); ell(ctx, -5 + step, -2, 4, 3); ctx.fill(); ell(ctx, 5 - step, -2, 4, 3); ctx.fill();
    rr(ctx, -10, -20, 20, 18, 6); fillStroke(ctx, F(m, m.pal.c), OUT, 2);
    // дубина
    ctx.save(); ctx.translate(-10, -14); ctx.rotate(-.6 - sw * 1.6);
    rr(ctx, -3, -26, 7, 26, 3); fillStroke(ctx, F(m, '#9a6a3c'), OUT, 1.8);
    ell(ctx, .5, -27, 6, 6); fillStroke(ctx, F(m, '#7c5230'), OUT, 1.8);
    ctx.restore();
    // голова и уши
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -36); ctx.lineTo(s * 28, -44); ctx.lineTo(s * 12, -28); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 2); }
    ell(ctx, 0, -34, 15, 14); fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    monEyes(ctx, m, -6, 4, -36, .85, true);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-6, -27); ctx.lineTo(4, -27); ctx.lineTo(2, -24); ctx.lineTo(-4, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  } };

  MON.golem = { top: 64, draw(ctx, m) {
    const sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0, br = Math.sin(m.t * 2) * 1;
    ctx.fillStyle = F(m, m.pal.b);
    rr(ctx, -16, -12, 12, 12, 3); fillStroke(ctx, F(m, m.pal.b), OUT, 2); rr(ctx, 4, -12, 12, 12, 3); fillStroke(ctx, F(m, m.pal.b), OUT, 2);
    rr(ctx, -21, -46 + br, 42, 36, 10); fillStroke(ctx, F(m, m.pal.a), OUT, 2.4);
    ctx.strokeStyle = dark(m.pal.a, .4); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-12, -40 + br); ctx.lineTo(-6, -32 + br); ctx.lineTo(-10, -24 + br); ctx.moveTo(10, -18 + br); ctx.lineTo(15, -26 + br); ctx.stroke();
    ctx.fillStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(-2, -30 + br); ctx.lineTo(3, -24 + br); ctx.lineTo(-2, -18 + br); ctx.lineTo(-7, -24 + br); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, -13, -64 + br, 26, 20, 7); fillStroke(ctx, F(m, light(m.pal.a, .1)), OUT, 2.2);
    ctx.fillStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 6;
    rr(ctx, -9, -57 + br, 6, 3.4, 1.5); ctx.fill(); rr(ctx, 1, -57 + br, 6, 3.4, 1.5); ctx.fill(); ctx.shadowBlur = 0;
    if (m.pal.c) { ctx.fillStyle = F(m, m.pal.c); ell(ctx, -6, -64 + br, 8, 3); ctx.fill(); ell(ctx, 14, -44 + br, 5, 2.4); ctx.fill(); }
    ctx.save(); ctx.translate(-20, -40 + br); ctx.rotate(.3 + sw * -1.2);
    rr(ctx, -7, 0, 13, 24, 6); fillStroke(ctx, F(m, m.pal.b), OUT, 2); ctx.restore();
  } };

  MON.ghost = { top: 58, fly: true, draw(ctx, m) {
    const y = -30 + Math.sin(m.t * 3) * 4;
    ctx.fillStyle = 'rgba(15,6,30,.16)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0, y);
    ctx.globalAlpha *= .92;
    ctx.beginPath(); ctx.moveTo(-17, 10);
    ctx.bezierCurveTo(-20, -34, 20, -34, 17, 10);
    for (let i = 0; i <= 4; i++) { const px = 17 - i * 8.5, py = 10 + (i % 2 ? -5 : 2) + Math.sin(m.t * 6 + i) * 2; ctx.lineTo(px, py); }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -24, 0, 12); g.addColorStop(0, F(m, m.pal.b)); g.addColorStop(1, F(m, m.pal.a));
    fillStroke(ctx, g, dark(m.pal.a, .6), 2);
    monEyes(ctx, m, -7, 3, -8, .9, m.boss);
    ctx.fillStyle = '#3a1a48'; ell(ctx, -2, 1, 3, 3.6); ctx.fill();
    ctx.fillStyle = '#ff8fb1'; ell(ctx, -2, 3.4, 1.8, 1.3); ctx.fill();
    blush(ctx, -11, 7, -2);
  } };

  MON.imp = { top: 52, draw(ctx, m) {
    const hop = Math.abs(Math.sin(m.t * 6)) * 3 + (m.atk > 0 ? Math.sin(m.atk * Math.PI) * 6 : 0);
    ctx.translate(0, -hop);
    const fl = Math.sin(m.t * 14);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 8, -30); ctx.quadraticCurveTo(s * 24, -46 - fl * 4, s * 26, -26); ctx.quadraticCurveTo(s * 18, -30, s * 10, -22); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 1.8);
    }
    ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(26, -8, 22, -24); ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = F(m, m.pal.a); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -24); ctx.lineTo(18, -30); ctx.lineTo(27, -28); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 1.4);
    ctx.fillStyle = F(m, dark(m.pal.a, .3)); ell(ctx, -5, -2, 3.5, 3); ctx.fill(); ell(ctx, 5, -2, 3.5, 3); ctx.fill();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -38); ctx.quadraticCurveTo(s * 14, -50, s * 10, -54); ctx.quadraticCurveTo(s * 9, -46, s * 2, -40); ctx.closePath(); fillStroke(ctx, F(m, m.pal.c), OUT, 1.6); }
    ell(ctx, 0, -22, 15, 16); fillStroke(ctx, F(m, m.pal.a), OUT, 2.2);
    for (const ex of [-6, 4]) {
      ctx.fillStyle = '#ffe55c'; ell(ctx, ex, -25, 3.6, 4.2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#2a1238'; ell(ctx, ex, -25, 1, 3.4); ctx.fill();
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -15); ctx.quadraticCurveTo(-1, -10, 6, -15); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(-4, -11); ctx.lineTo(-3, -13.5); ctx.moveTo(3, -14); ctx.lineTo(4, -11); ctx.lineTo(5, -14); ctx.fill();
  } };

  MON.skull = { top: 64, draw(ctx, m) {
    const step = Math.sin(m.t * 7) * 2, sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0;
    ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(-5 + step, 0); ctx.moveTo(4, -16); ctx.lineTo(5 - step, 0); ctx.stroke();
    ctx.strokeStyle = F(m, '#ece6dc'); ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, -11, -34, 22, 20, 5); fillStroke(ctx, F(m, m.pal.b), OUT, 2.2);
    ctx.strokeStyle = m.pal.e; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-7, -28); ctx.lineTo(7, -28); ctx.moveTo(-7, -23); ctx.lineTo(7, -23); ctx.stroke();
    ctx.save(); ctx.translate(-12, -26); ctx.rotate(-1.1 - sw * 1.3);
    drawKatanaSimple(ctx, m.flash > 0 ? '#ffffff' : '#9aa0b8');
    ctx.restore();
    ell(ctx, 0, -48, 15, 14); fillStroke(ctx, F(m, '#f4efe6'), OUT, 2.2);
    rr(ctx, -8, -38, 16, 7, 2); fillStroke(ctx, F(m, '#f4efe6'), OUT, 1.8);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -4; i <= 4; i += 4) { ctx.moveTo(i, -38); ctx.lineTo(i, -31); } ctx.stroke();
    ctx.fillStyle = '#1a0d24'; ell(ctx, -6, -48, 4.4, 5); ctx.fill(); ell(ctx, 5, -48, 4.4, 5); ctx.fill();
    ctx.fillStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 8; ell(ctx, -6, -48, 1.8, 2.2); ctx.fill(); ell(ctx, 5, -48, 1.8, 2.2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(-14, -54); ctx.quadraticCurveTo(0, -70, 14, -54); ctx.lineTo(10, -58); ctx.quadraticCurveTo(0, -64, -10, -58); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 1.8);
  } };
  function drawKatanaSimple(ctx, c) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.stroke();
  }

  MON.wisp = { top: 58, fly: true, draw(ctx, m) {
    const y = -26 + Math.sin(m.t * 3.4) * 4;
    ctx.fillStyle = 'rgba(15,6,30,.16)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0, y);
    for (let i = 0; i < 3; i++) {
      const a = Math.sin(m.t * 5 + i * 2) * .3;
      ctx.save(); ctx.rotate(.5 + i * .35 + a);
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(26, 6, 30, -4); ctx.quadraticCurveTo(22, 0, 4, -4); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 1.6); ctx.restore();
    }
    const fl = Math.sin(m.t * 10) * 2;
    ctx.beginPath(); ctx.moveTo(0, 14);
    ctx.bezierCurveTo(-18, 14, -18, -8, -6, -18 - fl); ctx.quadraticCurveTo(-2, -10, 0, -26 + fl);
    ctx.quadraticCurveTo(3, -10, 7, -18 + fl); ctx.bezierCurveTo(18, -8, 18, 14, 0, 14); ctx.closePath();
    const g = ctx.createRadialGradient(0, 4, 2, 0, 0, 20); g.addColorStop(0, F(m, '#fff7d6')); g.addColorStop(.5, F(m, m.pal.b)); g.addColorStop(1, F(m, m.pal.a));
    ctx.shadowColor = m.pal.b; ctx.shadowBlur = 12; fillStroke(ctx, g, dark(m.pal.a, .4), 2); ctx.shadowBlur = 0;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -12); ctx.lineTo(s * 12, -24); ctx.lineTo(s * 13, -10); ctx.closePath(); fillStroke(ctx, F(m, m.pal.a), OUT, 1.4); }
    monEyes(ctx, m, -5, 4, 0, .8, m.boss);
    blush(ctx, -9, 8, 5);
  } };

  MON.crystal = { top: 62, fly: true, draw(ctx, m) {
    const y = -32 + Math.sin(m.t * 2.6) * 4;
    ctx.fillStyle = 'rgba(15,6,30,.16)'; ell(ctx, 0, 0, 12, 3); ctx.fill();
    ctx.translate(m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0, y);
    for (let i = 0; i < 3; i++) {
      const a = m.t * 1.6 + i * TAU / 3, ox = Math.cos(a) * 22, oy = Math.sin(a) * 7;
      ctx.beginPath(); ctx.moveTo(ox, oy - 5); ctx.lineTo(ox + 3, oy); ctx.lineTo(ox, oy + 5); ctx.lineTo(ox - 3, oy); ctx.closePath();
      fillStroke(ctx, F(m, m.pal.b), OUT, 1.2);
    }
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(15, -6); ctx.lineTo(9, 16); ctx.lineTo(-9, 16); ctx.lineTo(-15, -6); ctx.closePath();
    const g = ctx.createLinearGradient(-15, -26, 15, 16); g.addColorStop(0, F(m, light(m.pal.b, .4))); g.addColorStop(1, F(m, m.pal.a));
    fillStroke(ctx, g, dark(m.pal.a, .55), 2.2);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(-4, -4); ctx.lineTo(-9, 16); ctx.moveTo(-4, -4); ctx.lineTo(15, -6); ctx.stroke();
    monEyes(ctx, m, -5, 4, 0, .8, m.boss);
    blush(ctx, -9, 8, 5);
  } };

  function drawCrown(ctx, top) {
    ctx.save(); ctx.translate(0, -top - 4);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-11, -10); ctx.lineTo(-5, -5); ctx.lineTo(0, -13); ctx.lineTo(5, -5); ctx.lineTo(11, -10); ctx.lineTo(10, 0); ctx.closePath();
    fillStroke(ctx, '#ffd760', OUT, 1.6);
    ctx.fillStyle = '#ff4f73'; ell(ctx, 0, -4, 1.8, 1.8); ctx.fill();
    ctx.restore();
  }

  /* ---------- особый облик боссов ---------- */
  const flyY = (m, base, f, a) => base + Math.sin(m.t * f) * a;
  const atkX = m => m.atk > 0 ? -Math.sin(m.atk * Math.PI) * 12 : 0;
  const BOSS_DECOR = {
    slime: {
      front(ctx, m) {
        const sq = 1 + .07 * Math.sin(m.t * 6), h = 24 / sq;
        // жемчужное ожерелье королевы
        for (let i = 0; i < 7; i++) {
          const a = -2.5 + i * .37, px = Math.cos(a) * 15, py = -h * .18 + Math.sin(a) * -4 + 6;
          ctx.fillStyle = F(m, '#fff4fb'); ell(ctx, px, py, 2.1, 2.1); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.stroke();
        }
        // капли-слуги
        for (let i = 0; i < 3; i++) {
          const a = m.t * 1.6 + i * TAU / 3, px = Math.cos(a) * 30, py = -14 + Math.sin(a * 2) * 4 - Math.abs(Math.sin(m.t * 5 + i)) * 6;
          ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.quadraticCurveTo(px + 5, py, px, py + 3); ctx.quadraticCurveTo(px - 5, py, px, py - 6);
          fillStroke(ctx, F(m, m.pal.b), dark(m.pal.a, .5), 1.2);
        }
      },
    },
    bat: {
      back(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -44, 4, 5));
        const w = Math.sin(m.t * 3) * 3;
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(-16, 18, -12 + w, 30); ctx.lineTo(0, 24); ctx.lineTo(12 - w, 30); ctx.quadraticCurveTo(16, 18, 10, -4); ctx.closePath();
        fillStroke(ctx, F(m, '#5a1428'), OUT, 1.8);
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-11, 16, -8 + w, 24); ctx.lineTo(0, 20); ctx.lineTo(8 - w, 24); ctx.quadraticCurveTo(11, 16, 8, 0); ctx.closePath();
        ctx.fillStyle = F(m, '#d9434f'); ctx.fill();
      },
      front(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -44, 4, 5));
        ctx.beginPath(); ctx.moveTo(-12, 6); ctx.lineTo(-16, 14); ctx.lineTo(-6, 10); ctx.lineTo(0, 14); ctx.lineTo(6, 10); ctx.lineTo(16, 14); ctx.lineTo(12, 6); ctx.closePath();
        fillStroke(ctx, F(m, '#f4f0ff'), OUT, 1.4);
        ctx.fillStyle = F(m, '#d9434f'); ell(ctx, 0, 9, 2.4, 2.4); ctx.fill();
      },
    },
    golem: {
      back(ctx, m) {
        for (let i = 0; i < 4; i++) {
          const a = m.t * .9 + i * TAU / 4, px = Math.cos(a) * 34, py = -36 + Math.sin(a) * 10;
          ctx.save(); ctx.translate(px, py); ctx.rotate(a);
          rr(ctx, -5, -4, 10, 8, 2); fillStroke(ctx, F(m, m.pal.b), OUT, 1.4); ctx.restore();
        }
      },
      front(ctx, m) {
        const br = Math.sin(m.t * 2), pulse = .55 + .45 * Math.sin(m.t * 4);
        ctx.save(); ctx.globalAlpha *= pulse; ctx.strokeStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 8; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(-9, -26 + br, 5, 0, TAU); ctx.moveTo(12, -40 + br); ctx.lineTo(16, -34 + br); ctx.lineTo(12, -28 + br); ctx.lineTo(16, -22 + br); ctx.stroke();
        ctx.restore();
        for (const sx of [-14, 14]) {
          ctx.beginPath(); ctx.moveTo(sx - 4, -46 + br); ctx.lineTo(sx, -58 + br); ctx.lineTo(sx + 4, -46 + br); ctx.closePath();
          fillStroke(ctx, F(m, '#9fe3ff'), OUT, 1.4);
        }
      },
    },
    crystal: {
      back(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -32, 2.6, 4));
        for (let i = 0; i < 6; i++) {
          const a = -m.t * 1.1 + i * TAU / 6, px = Math.cos(a) * 34, py = Math.sin(a) * 12;
          ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
          ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(4, 0); ctx.lineTo(0, 9); ctx.lineTo(-4, 0); ctx.closePath();
          fillStroke(ctx, F(m, m.pal.b), OUT, 1.2); ctx.restore();
        }
      },
      front(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -32, 2.6, 4));
        const sp = [[-10, -22, -14, -36], [-4, -26, -5, -42], [3, -26, 4, -44], [10, -22, 14, -36]];
        for (const [x1, y1, x2, y2] of sp) {
          ctx.beginPath(); ctx.moveTo(x1 - 3, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1 + 3, y1); ctx.closePath();
          fillStroke(ctx, F(m, '#e6f8ff'), OUT, 1.3);
        }
      },
    },
    wisp: {
      back(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -26, 3.4, 4));
        for (let i = 0; i < 9; i++) {
          const a = -2.1 + i * .3 + Math.sin(m.t * 3 + i * .7) * .12;
          ctx.save(); ctx.rotate(a);
          ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(10, -16, 4, -40); ctx.quadraticCurveTo(-4, -18, -6, 2); ctx.closePath();
          fillStroke(ctx, F(m, i % 2 ? m.pal.a : '#ff8a4c'), OUT, 1.5);
          ctx.fillStyle = F(m, '#fff4d6'); ell(ctx, 4, -36, 3, 5, .2); ctx.fill();
          ctx.restore();
        }
      },
      front(ctx, m) {
        ctx.translate(atkX(m), flyY(m, -26, 3.4, 4));
        // кицунэби: блуждающие огни
        for (let i = 0; i < 3; i++) {
          const a = m.t * 2 + i * TAU / 3, px = Math.cos(a) * 30, py = Math.sin(a) * 14 - 6;
          const g = ctx.createRadialGradient(px, py, 1, px, py, 7);
          g.addColorStop(0, '#fffbe0'); g.addColorStop(.5, '#7fd8ff'); g.addColorStop(1, 'rgba(127,216,255,0)');
          ctx.fillStyle = g; ell(ctx, px, py, 7, 7); ctx.fill();
        }
      },
    },
    skull: {
      back(ctx, m) {
        const w = Math.sin(m.t * 3) * 3;
        ctx.beginPath(); ctx.moveTo(-12, -34);
        ctx.lineTo(-20 + w, -2); ctx.lineTo(-14 + w, -6); ctx.lineTo(-10 + w, 0); ctx.lineTo(-4 + w, -5); ctx.lineTo(2 + w, 0); ctx.lineTo(8, -5); ctx.lineTo(12, -34); ctx.closePath();
        fillStroke(ctx, F(m, '#2a1838'), OUT, 1.6);
        ctx.strokeStyle = F(m, '#ff62d4'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, -33); ctx.lineTo(12, -33); ctx.stroke();
      },
      front(ctx, m) {
        // рога и двуручник
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(s * 8, -58); ctx.quadraticCurveTo(s * 22, -64, s * 20, -80); ctx.quadraticCurveTo(s * 16, -66, s * 4, -62); ctx.closePath();
          fillStroke(ctx, F(m, '#3a2452'), OUT, 1.6);
        }
        const sw = m.atk > 0 ? Math.sin(m.atk * Math.PI) : 0;
        ctx.save(); ctx.translate(-16, -24); ctx.rotate(-1.25 - sw * 1.5);
        ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-4, -48); ctx.lineTo(0, -56); ctx.lineTo(4, -48); ctx.lineTo(3, 0); ctx.closePath();
        fillStroke(ctx, F(m, '#3a2452'), OUT, 1.6);
        ctx.strokeStyle = m.pal.e; ctx.shadowColor = m.pal.e; ctx.shadowBlur = 6; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -48); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.strokeStyle = F(m, '#8a6ab0'); ctx.lineWidth = 2.4; ctx.stroke();
        ctx.restore();
      },
    },
  };
  for (const type in BOSS_DECOR) {
    const base = MON[type].draw, d = BOSS_DECOR[type];
    MON[type].draw = (ctx, m) => {
      if (!m.boss) return base(ctx, m);
      if (d.back) { ctx.save(); d.back(ctx, m); ctx.restore(); }
      ctx.save(); base(ctx, m); ctx.restore();
      if (d.front) { ctx.save(); d.front(ctx, m); ctx.restore(); }
    };
  }

  function drawMonster(ctx, x, y, k, m) {
    const def = MON[m.type];
    ctx.save(); ctx.translate(x, y + (m.oy || 0) * k);
    const sc = k * (m.scale || 1);
    ctx.scale(sc * (1 + (m.sq || 0)), sc * (1 - (m.sq || 0)));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (m.dieT > 0) {
      if (m.boss) { ctx.globalAlpha = (Math.floor(m.dieT * 24) % 2 ? .45 : 1) * Math.max(0, 1 - Math.max(0, m.dieT - .8) * 3); ctx.translate(Math.sin(m.dieT * 70) * 2, 0); }
      else { ctx.globalAlpha = Math.max(0, 1 - m.dieT * 2.4); ctx.translate(0, -m.dieT * 20); ctx.rotate(m.dieT * .6); }
    }
    const cy = -def.top * .5;
    if (m.boss) {
      const rage = m.enr ? 1 : 0;
      const g = ctx.createRadialGradient(0, cy, 4, 0, cy, def.top * 1.1);
      const c = rage ? '255,40,60' : '255,60,110';
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.7, `rgba(${c},${.18 + .1 * rage + .08 * Math.sin(m.t * (4 + rage * 6))})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ell(ctx, 0, cy, def.top * 1.1, def.top * 1.1); ctx.fill();
    }
    if (m.wind > 0) {
      const p = m.wind, r = def.top * (.7 + p * .5);
      const g = ctx.createRadialGradient(0, cy, 2, 0, cy, r);
      g.addColorStop(0, `rgba(255,240,180,${.5 * p})`); g.addColorStop(1, 'rgba(255,120,80,0)');
      ctx.fillStyle = g; ell(ctx, 0, cy, r, r); ctx.fill();
    }
    if (!def.fly) { ctx.fillStyle = 'rgba(15,6,30,.26)'; ell(ctx, 0, 0, 20, 4.5); ctx.fill(); }
    ctx.save();
    if (m.atk > 0 && !def.fly) ctx.translate(-Math.sin(m.atk * Math.PI) * 8, 0);
    if (m.boss && !m.dieT) { const br = 1 + Math.sin(m.t * 2.2) * .025; ctx.translate(0, cy); ctx.scale(1 / br, br); ctx.translate(0, -cy); }
    def.draw(ctx, m);
    ctx.restore();
    if (m.boss && m.type === 'slime') drawCrown(ctx, 22 / (1 + .07 * Math.sin(m.t * 6)) + (m.hopT > 0 ? 0 : 0));
    if (m.boss && m.type === 'bat') drawCrown(ctx, 54 - Math.sin(m.t * 4) * 5);
    if (m.wind > 0) {
      // знак угрозы над боссом
      const p = Math.min(1, m.wind * 3), yy = -def.top - 22 - Math.sin(m.t * 18) * 1.5;
      ctx.save(); ctx.translate(0, yy); ctx.scale(p / Math.max(.5, m.scale * .55), p / Math.max(.5, m.scale * .55));
      ell(ctx, 0, 0, 9, 10); fillStroke(ctx, '#ff3d5c', '#ffffff', 2);
      ctx.fillStyle = '#ffffff'; rr(ctx, -1.6, -6.5, 3.2, 8, 1.5); ctx.fill(); ell(ctx, 0, 5, 1.8, 1.8); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  const monTop = type => MON[type].top;

  /* ---------- фоны зон ---------- */
  // z: конфиг зоны из игры; scroll: пройденное расстояние; t: время
  const skyCache = new Map();
  function drawBackground(ctx, W, H, gy, z, scroll, t) {
    const key = z.id + W + 'x' + H;
    let sky = skyCache.get(key);
    if (!sky) {
      sky = ctx.createLinearGradient(0, 0, 0, gy);
      z.sky.forEach((c, i) => sky.addColorStop(i / (z.sky.length - 1), c));
      skyCache.clear(); skyCache.set(key, sky);
    }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy + 2);
    const k = H / 300;
    // звёзды
    if (z.stars) {
      for (let i = 0; i < 46; i++) {
        const sx = h01(i * 7 + 1) * W, sy = h01(i * 13 + 5) * gy * .6;
        const tw = .4 + .6 * Math.abs(Math.sin(t * (1 + h01(i)) + i));
        ctx.fillStyle = `rgba(255,255,255,${.7 * tw})`; ctx.fillRect(sx, sy, 1.6 * k, 1.6 * k);
      }
    }
    // светило
    if (z.orb) {
      const ox = W * z.orb.x, oy = gy * z.orb.y, r = z.orb.r * k;
      const g = ctx.createRadialGradient(ox, oy, r * .4, ox, oy, r * 3);
      g.addColorStop(0, hexA(z.orb.glow, .55)); g.addColorStop(1, hexA(z.orb.glow, 0));
      ctx.fillStyle = g; ctx.fillRect(ox - r * 3, oy - r * 3, r * 6, r * 6);
      ctx.fillStyle = z.orb.c; ell(ctx, ox, oy, r, r); ctx.fill();
      if (z.orb.moon) { ctx.fillStyle = hexA(z.sky[0], .9); ell(ctx, ox + r * .45, oy - r * .2, r * .85, r * .85); ctx.fill(); }
    }
    // облака
    if (z.clouds) {
      ctx.fillStyle = z.clouds;
      for (let i = 0; i < 5; i++) {
        const cx = ((h01(i * 31) * W * 1.6 - (scroll * .05 + t * 6) + W * 2) % (W * 1.6)) - W * .2, cy = gy * (.12 + .3 * h01(i * 17));
        const s = (.7 + .6 * h01(i * 3)) * k;
        ell(ctx, cx, cy, 30 * s, 9 * s); ctx.fill(); ell(ctx, cx + 18 * s, cy - 6 * s, 18 * s, 10 * s); ctx.fill(); ell(ctx, cx - 16 * s, cy - 3 * s, 14 * s, 8 * s); ctx.fill();
      }
    }
    // горы: два слоя
    z.far.forEach((L, li) => {
      ctx.fillStyle = L.c;
      ctx.beginPath(); ctx.moveTo(0, gy);
      const off = scroll * L.p;
      for (let x = 0; x <= W + 8; x += 8) {
        const X = (x + off) / k * L.f;
        const yy = gy - (L.base + L.amp * (.55 * Math.sin(X + li * 2) + .3 * Math.sin(X * 2.3 + 1.7) + .15 * Math.sin(X * 5.7 + .4))) * k;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W, gy); ctx.closePath(); ctx.fill();
      if (L.snow) {
        ctx.save(); ctx.clip();
        ctx.fillStyle = L.snow; ctx.fillRect(0, gy - (L.base + L.amp * .7) * k, W, L.amp * .4 * k);
        ctx.restore();
      }
    });
    // средний план
    const sp = 140 * k, off = scroll * .45;
    const i0 = Math.floor(off / sp) - 1, i1 = Math.floor((off + W) / sp) + 1;
    for (let i = i0; i <= i1; i++) {
      if (h01(i * 9 + z.seed) < .25) continue;
      const px = i * sp - off + h01(i * 3 + z.seed) * sp * .5;
      const s = (.75 + .45 * h01(i * 5 + z.seed)) * k;
      PROPS[z.prop](ctx, px, gy - 2 * k, s, z, i, t);
    }
    // земля
    ctx.fillStyle = z.ground[0]; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = z.ground[1]; ctx.fillRect(0, gy, W, 5 * k);
    ctx.fillStyle = z.ground[2];
    const gs = 46 * k, go = scroll % gs;
    for (let x = -go; x < W + gs; x += gs) {
      const ii = Math.round((x + scroll) / gs);
      rr(ctx, x, gy + (14 + 10 * h01(ii)) * k, (16 + 12 * h01(ii * 7)) * k, 4 * k, 2 * k); ctx.fill();
    }
    // травинки на кромке
    ctx.strokeStyle = z.ground[3]; ctx.lineWidth = 2 * k; ctx.lineCap = 'round';
    const ts = 18 * k, to = scroll % ts;
    ctx.beginPath();
    for (let x = -to; x < W + ts; x += ts) {
      const ii = Math.round((x + scroll) / ts), hh = (3 + 4 * h01(ii * 11)) * k;
      ctx.moveTo(x, gy + 3 * k); ctx.lineTo(x - 2 * k, gy - hh); ctx.moveTo(x + 3 * k, gy + 3 * k); ctx.lineTo(x + 4 * k, gy - hh * .7);
    }
    ctx.stroke();
  }

  const PROPS = {
    sakura(ctx, x, y, s, z, i, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#7a4a52';
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-2, -30, -10, -60); ctx.lineTo(-4, -62); ctx.quadraticCurveTo(4, -40, 6, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3, -40); ctx.quadraticCurveTo(12, -50, 22, -58); ctx.lineTo(20, -54); ctx.quadraticCurveTo(10, -46, -2, -36); ctx.fill();
      const blobs = [[-12, -66, 22], [10, -70, 20], [24, -58, 14], [-26, -56, 14], [0, -84, 18], [-4, -56, 14]];
      ctx.fillStyle = '#f7a6c8'; for (const [bx, by, r] of blobs) { ell(ctx, bx, by, r, r * .82); ctx.fill(); }
      ctx.fillStyle = '#ffd0e4'; for (const [bx, by, r] of blobs) { ell(ctx, bx - r * .2, by - r * .25, r * .6, r * .45); ctx.fill(); }
      ctx.restore();
    },
    pine(ctx, x, y, s, z, i) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = z.propC[1]; ctx.fillRect(-3, -14, 6, 14);
      for (let j = 0; j < 4; j++) {
        const w = 26 - j * 5, yy = -12 - j * 18;
        ctx.fillStyle = z.propC[0]; ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(0, yy - 30); ctx.lineTo(w, yy); ctx.closePath(); ctx.fill();
        if (z.propC[2]) { ctx.fillStyle = z.propC[2]; ctx.beginPath(); ctx.moveTo(-w * .55, yy - 13); ctx.lineTo(0, yy - 30); ctx.lineTo(w * .55, yy - 13); ctx.quadraticCurveTo(0, yy - 18, -w * .55, yy - 13); ctx.fill(); }
      }
      ctx.restore();
    },
    ruin(ctx, x, y, s, z, i) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const hgt = 40 + h01(i * 13) * 50;
      ctx.fillStyle = z.propC[0]; ctx.fillRect(-9, -hgt, 18, hgt);
      ctx.fillStyle = z.propC[1]; ctx.fillRect(-9, -hgt, 5, hgt);
      ctx.fillStyle = z.propC[2]; ctx.fillRect(-13, -hgt - 6, 26, 7); ctx.fillRect(-13, -6, 26, 6);
      if (h01(i * 3) > .5) { ctx.save(); ctx.translate(18, -6); ctx.rotate(-.2); ctx.fillStyle = z.propC[0]; ctx.fillRect(0, -10, 30, 10); ctx.restore(); }
      ctx.restore();
    },
    spire(ctx, x, y, s, z, i, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const hgt = 50 + h01(i * 13) * 60;
      ctx.fillStyle = z.propC[0];
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, -hgt); ctx.lineTo(4, -hgt * .8); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = z.propC[1]; ctx.lineWidth = 2; ctx.globalAlpha = .6 + .4 * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(1, -hgt * .3); ctx.lineTo(-3, -hgt * .55); ctx.stroke();
      ctx.restore();
    },
    tower(ctx, x, y, s, z, i, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const hgt = 70 + h01(i * 13) * 50;
      ctx.fillStyle = z.propC[0]; ctx.fillRect(-12, -hgt, 24, hgt);
      ctx.beginPath(); ctx.moveTo(-16, -hgt); ctx.lineTo(0, -hgt - 34); ctx.lineTo(16, -hgt); ctx.closePath(); ctx.fill();
      ctx.fillStyle = z.propC[1];
      for (let j = 0; j < 3; j++) { if (h01(i * 7 + j) > .35) { ctx.globalAlpha = .7 + .3 * Math.sin(t * 3 + j + i); rr(ctx, -3, -hgt + 14 + j * 22, 6, 9, 3); ctx.fill(); } }
      ctx.restore();
    },
  };

  /* ---------- иконки предметов ---------- */
  function iconCanvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
  const iconCache = new Map();
  function gem(ctx, x, y, r, c) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y - r * .2); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y - r * .2); ctx.closePath();
    fillStroke(ctx, c, OUT, 2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(x - r * .5, y - r * .3); ctx.lineTo(x, y - r * .8); ctx.lineTo(x + r * .1, y - r * .25); ctx.closePath(); ctx.fill();
  }

  // kind: 'weapon' | 'armor'; blessed: bool
  function scrollIcon(kind, g, blessed, size = 64) {
    const key = 'scr' + kind + g + blessed + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64); ctx.lineJoin = 'round';
    if (blessed) {
      const gr = ctx.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,140,.8)'); gr.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
    }
    ctx.save(); ctx.translate(32, 32); ctx.rotate(-.5);
    rr(ctx, -18, -14, 36, 28, 3); fillStroke(ctx, '#f6ecd2', OUT, 2.2);
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.2;
    for (let i = -6; i <= 6; i += 6) { ctx.beginPath(); ctx.moveTo(-12, i); ctx.lineTo(12, i); ctx.stroke(); }
    for (const sx of [-20, 20]) { rr(ctx, sx - 4, -17, 8, 34, 4); fillStroke(ctx, '#e6d3a6', OUT, 2); }
    const rib = kind === 'weapon' ? '#e0485c' : '#4f8fe8';
    ctx.fillStyle = rib; ctx.fillRect(-3, -14, 6, 28);
    ell(ctx, 0, 0, 8, 8); fillStroke(ctx, blessed ? '#ffd760' : GRADE_COL[g], OUT, 2);
    ctx.fillStyle = OUT; ctx.font = '900 9px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['', 'D', 'C', 'B', 'A', 'S', 'R'][g] || '', 0, .5);
    ctx.restore();
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  function miscIcon(type, size = 48) {
    const key = 'misc' + type + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const P = MISC[type]; if (P) P(ctx);
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }
  const MISC = {
    gold(ctx) {
      ell(ctx, 32, 32, 24, 24); fillStroke(ctx, '#ffc93d', OUT, 3);
      ctx.fillStyle = '#ffe58f'; ell(ctx, 26, 25, 12, 9, -.6); ctx.fill();
      rr(ctx, 26, 26, 12, 12, 2); fillStroke(ctx, '#d99a1e', OUT, 2.4);
    },
    lantern(ctx) {
      ctx.fillStyle = '#3a1620'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.strokeStyle = '#ffd760'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(32, 5); ctx.lineTo(32, 14); ctx.stroke();
      rr(ctx, 22, 10, 20, 5, 2); fillStroke(ctx, '#ffd760', OUT, 1.8);
      rr(ctx, 17, 15, 30, 30, 11); fillStroke(ctx, '#ff7a3c', OUT, 2.4);
      rr(ctx, 23, 20, 18, 20, 7); fillStroke(ctx, '#ffd760', OUT, 1.6);
      rr(ctx, 28, 25, 8, 10, 3); ctx.fillStyle = '#fff6d0'; ctx.fill();
      rr(ctx, 22, 43, 20, 5, 2); fillStroke(ctx, '#ffd760', OUT, 1.8);
      ctx.fillStyle = '#ffd760'; ell(ctx, 32, 50, 3, 3); ctx.fill();
    },
    crystal(ctx) {
      const shard = (x, y, w, h, c) => { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h * .6); ctx.lineTo(x + w * .8, y); ctx.lineTo(x - w * .8, y); ctx.lineTo(x - w, y - h * .6); ctx.closePath(); fillStroke(ctx, c, OUT, 2.2); };
      shard(20, 54, 9, 28, '#8fd8ff'); shard(44, 54, 9, 26, '#b9a2ff'); shard(32, 56, 12, 44, '#d4f3ff');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(29, 18); ctx.lineTo(27, 44); ctx.stroke();
    },
    atk(ctx) { api.drawKatana(ctx, 14, 52, -.86, 1, 0, 0, .8); },
    hp(ctx) {
      ctx.beginPath(); ctx.moveTo(32, 54); ctx.bezierCurveTo(4, 36, 8, 10, 32, 22); ctx.bezierCurveTo(56, 10, 60, 36, 32, 54); ctx.closePath();
      fillStroke(ctx, '#ff5d78', OUT, 2.6); ctx.fillStyle = '#ffb3c1'; ell(ctx, 22, 26, 6, 4, -.6); ctx.fill();
    },
    regen(ctx) {
      ell(ctx, 32, 32, 22, 22); fillStroke(ctx, '#74e0a8', OUT, 2.6);
      ctx.fillStyle = '#fff'; rr(ctx, 28, 18, 8, 28, 2); ctx.fill(); rr(ctx, 18, 28, 28, 8, 2); ctx.fill();
    },
    crit(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 25; ctx.lineTo(32 + Math.cos(a) * r, 34 + Math.sin(a) * r); }
      ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 2.6);
    },
    critDmg(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 12 : 26; ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
      ctx.closePath(); fillStroke(ctx, '#ff8a4c', OUT, 2.4);
      ell(ctx, 32, 32, 7, 7); ctx.fillStyle = '#fff2c2'; ctx.fill();
    },
    aspd(ctx) {
      for (const [dx, c] of [[-8, '#7cc8ff'], [8, '#bfe6ff']]) {
        ctx.beginPath(); ctx.moveTo(18 + dx, 14); ctx.lineTo(36 + dx, 32); ctx.lineTo(18 + dx, 50); ctx.lineTo(26 + dx, 32); ctx.closePath(); fillStroke(ctx, c, OUT, 2.4);
      }
    },
    bag(ctx) {
      ctx.beginPath(); ctx.moveTo(14, 26); ctx.quadraticCurveTo(12, 56, 32, 56); ctx.quadraticCurveTo(52, 56, 50, 26); ctx.closePath();
      fillStroke(ctx, '#b07a48', OUT, 2.6);
      ctx.beginPath(); ctx.moveTo(18, 26); ctx.quadraticCurveTo(32, 14, 46, 26); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffd760'; ell(ctx, 32, 38, 5, 5); ctx.fill();
    },
    map(ctx) {
      ctx.beginPath(); ctx.moveTo(10, 16); ctx.lineTo(24, 10); ctx.lineTo(40, 16); ctx.lineTo(54, 10); ctx.lineTo(54, 48); ctx.lineTo(40, 54); ctx.lineTo(24, 48); ctx.lineTo(10, 54); ctx.closePath();
      fillStroke(ctx, '#f2e2b8', OUT, 2.4);
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 2.4; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(16, 44); ctx.quadraticCurveTo(30, 20, 46, 26); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#e0485c'; ell(ctx, 46, 26, 3.5, 3.5); ctx.fill();
    },
    shop(ctx) {
      ctx.beginPath(); ctx.moveTo(10, 24); ctx.lineTo(16, 12); ctx.lineTo(48, 12); ctx.lineTo(54, 24); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 2.4);
      rr(ctx, 14, 24, 36, 28, 2); fillStroke(ctx, '#f2e2b8', OUT, 2.4);
      rr(ctx, 26, 34, 12, 18, 2); fillStroke(ctx, '#8a5a3a', OUT, 2);
    },
    hero(ctx) {
      ell(ctx, 32, 26, 15, 15); fillStroke(ctx, '#ffe7da', OUT, 2.4);
      ctx.beginPath(); ctx.moveTo(15, 26); ctx.bezierCurveTo(12, 6, 52, 6, 49, 26); ctx.lineTo(42, 18); ctx.lineTo(36, 24); ctx.lineTo(30, 16); ctx.lineTo(24, 24); ctx.lineTo(20, 18); ctx.closePath();
      fillStroke(ctx, '#ff9ecd', OUT, 2.2);
      ctx.beginPath(); ctx.moveTo(14, 58); ctx.quadraticCurveTo(14, 42, 32, 42); ctx.quadraticCurveTo(50, 42, 50, 58); ctx.closePath(); fillStroke(ctx, '#8d6fd9', OUT, 2.4);
    },
    skills(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ell(ctx, 32 + Math.cos(a) * 12, 32 + Math.sin(a) * 12, 10, 10); fillStroke(ctx, '#ffb3d6', OUT, 2); }
      ell(ctx, 32, 32, 6, 6); fillStroke(ctx, '#ffd760', OUT, 2);
    },
    // навыки
    sk_petal(ctx) {
      ctx.fillStyle = '#3a1f5c'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.translate(32, 32); ctx.rotate(i * TAU / 5);
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(-11, -14, 0, -24); ctx.quadraticCurveTo(11, -14, 0, -2); ctx.closePath();
        fillStroke(ctx, i % 2 ? '#ffb3d6' : '#ff7eb6', OUT, 1.8); ctx.restore();
      }
      ell(ctx, 32, 32, 7, 7); fillStroke(ctx, '#ffd760', OUT, 1.8);
    },
    sk_moon(ctx) {
      ctx.fillStyle = '#1b2350'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.arc(30, 31, 18, -1.3, 1.7); ctx.arc(39, 28, 16, 1.9, -1.0, true); ctx.closePath();
      fillStroke(ctx, '#cfeaff', OUT, 2.2);
      ell(ctx, 46, 18, 2.4, 2.4); ctx.fillStyle = '#ffe55c'; ctx.fill();
      ell(ctx, 18, 46, 1.8, 1.8); ctx.fill();
    },
    sk_spirit(ctx) {
      ctx.fillStyle = '#4a1620'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(32, 54); ctx.bezierCurveTo(12, 50, 14, 30, 24, 20); ctx.quadraticCurveTo(26, 30, 30, 30); ctx.quadraticCurveTo(28, 18, 36, 8); ctx.quadraticCurveTo(38, 22, 44, 24); ctx.bezierCurveTo(54, 34, 50, 52, 32, 54); ctx.closePath();
      fillStroke(ctx, '#ff8a4c', OUT, 2); ctx.fillStyle = '#ffe28a'; ell(ctx, 32, 42, 7, 9); ctx.fill();
    },
    sk_thunder(ctx) {
      ctx.fillStyle = '#26214a'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(36, 8); ctx.lineTo(18, 36); ctx.lineTo(30, 36); ctx.lineTo(24, 58); ctx.lineTo(46, 26); ctx.lineTo(34, 26); ctx.closePath();
      fillStroke(ctx, '#ffe55c', OUT, 2);
    },
    sk_bloom(ctx) {
      ctx.fillStyle = '#183a2c'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(32, 32); ctx.rotate(i * TAU / 5); ell(ctx, 0, -11, 7, 11); fillStroke(ctx, '#ffd0e4', OUT, 1.6); ctx.restore(); }
      ell(ctx, 32, 32, 6, 6); fillStroke(ctx, '#74e0a8', OUT, 1.6);
    },
    sk_flame(ctx) {
      ctx.fillStyle = '#451a1a'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(32, 54); ctx.bezierCurveTo(14, 50, 16, 30, 26, 18); ctx.quadraticCurveTo(28, 30, 33, 28); ctx.quadraticCurveTo(31, 14, 40, 7); ctx.quadraticCurveTo(40, 22, 47, 26); ctx.bezierCurveTo(55, 36, 50, 52, 32, 54); ctx.closePath();
      fillStroke(ctx, '#ff7a3c', OUT, 2); ctx.fillStyle = '#ffd25c'; ell(ctx, 32, 41, 7, 10); ctx.fill();
    },
    sk_frost(ctx) {
      ctx.fillStyle = '#152a48'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(32 + (i - 1) * 13, 30 + (i === 1 ? -4 : 6)); ctx.rotate((i - 1) * .35); ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(8, 0); ctx.lineTo(0, 18); ctx.lineTo(-8, 0); ctx.closePath(); fillStroke(ctx, i === 1 ? '#eaf8ff' : '#8fd8ff', OUT, 1.6); ctx.restore(); }
    },
    sk_quake(ctx) {
      ctx.fillStyle = '#3b2a18'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, 48); ctx.lineTo(22, 34); ctx.lineTo(28, 40); ctx.lineTo(36, 24); ctx.lineTo(44, 34); ctx.lineTo(52, 46); ctx.closePath();
      fillStroke(ctx, '#c9a15c', OUT, 2); ctx.strokeStyle = '#ffd760'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(22, 34); ctx.lineTo(28, 44); ctx.lineTo(34, 38); ctx.stroke();
    },
    sk_storm(ctx) {
      ctx.fillStyle = '#173a38'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(32, 32); ctx.rotate(-.5 + i * .55); ctx.beginPath(); ctx.arc(0, 0, 20 - i * 4, -1.2, 1.3); ctx.strokeStyle = i === 1 ? '#eafff6' : '#8fe0c0'; ctx.lineWidth = 4 - i; ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, 46); ctx.lineTo(44, 18); ctx.stroke();
    },
    sk_meteor(ctx) {
      ctx.fillStyle = '#2a1738'; ell(ctx, 32, 32, 28, 28); ctx.fill();
      ctx.strokeStyle = '#ff7a3c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(14, 50); ctx.lineTo(30, 34); ctx.stroke();
      ell(ctx, 38, 26, 13, 13); fillStroke(ctx, '#ffcf5a', OUT, 2.2);
      ctx.fillStyle = '#ff7a3c'; ell(ctx, 43, 30, 5, 5); ctx.fill();
      ell(ctx, 10, 54, 2, 2); ctx.fillStyle = '#ffd760'; ctx.fill();
      ell(ctx, 20, 40, 1.6, 1.6); ctx.fill();
    },
    lock(ctx) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(32, 26, 11, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = '#c9c2d8'; ctx.lineWidth = 4; ctx.stroke();
      rr(ctx, 16, 26, 32, 26, 5); fillStroke(ctx, '#ffd760', OUT, 2.6);
      ctx.fillStyle = OUT; ell(ctx, 32, 37, 3.4, 3.4); ctx.fill(); ctx.fillRect(30.5, 37, 3, 8);
    },
  };

  /* ---------- магический круг заточки ---------- */
  function drawMagicCircle(ctx, cx, cy, R, t, power, color) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';
    const c = color;
    const g = ctx.createRadialGradient(0, 0, R * .1, 0, 0, R * 1.2);
    g.addColorStop(0, hexA(c, .35 + .3 * power)); g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g; ell(ctx, 0, 0, R * 1.2, R * 1.2); ctx.fill();
    ctx.strokeStyle = hexA(c, .9); ctx.lineWidth = 2;
    ell(ctx, 0, 0, R, R); ctx.stroke(); ell(ctx, 0, 0, R * .86, R * .86); ctx.stroke();
    ctx.save(); ctx.rotate(t * (.4 + power * 3));
    ctx.lineWidth = 1.6;
    for (let tri = 0; tri < 2; tri++) {
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) { const a = tri * Math.PI / 3 + i * TAU / 3 - Math.PI / 2; const px = Math.cos(a) * R * .84, py = Math.sin(a) * R * .84; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    // руны по кольцу
    for (let i = 0; i < 16; i++) {
      ctx.save(); ctx.rotate(i * TAU / 16); ctx.translate(0, -R * .93);
      ctx.beginPath(); const v = i % 4;
      if (v === 0) { ctx.moveTo(-3, -3); ctx.lineTo(3, 3); ctx.moveTo(3, -3); ctx.lineTo(-3, 3); }
      else if (v === 1) { ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); }
      else if (v === 2) { ctx.arc(0, 0, 3, 0, TAU); }
      else { ctx.moveTo(-3, 3); ctx.lineTo(0, -4); ctx.lineTo(3, 3); }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    ctx.save(); ctx.rotate(-t * (.7 + power * 4));
    ctx.setLineDash([6, 8]); ctx.lineWidth = 1.4; ell(ctx, 0, 0, R * .55, R * .55); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ell(ctx, Math.cos(a) * R * .55, Math.sin(a) * R * .55, 3, 3); ctx.fillStyle = hexA(c, .9); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }

  const api = {
    drawMonster, monTop, MON, drawBackground, scrollIcon, miscIcon, drawMagicCircle,
    enchGlow, GRADE_COL, hexA, mix, light, dark, ell, rr, h01, hash, fillStroke, OUT, TAU, clamp,
    iconCanvas, iconCache, gem, easeOut, easeIn, easeInOut, MISC,
  };
  return api;
})();

/* ===== Графика героя: девочка и мальчик, снаряжение каждого грейда ===== */
(() => {
  const A = ART;
  const { ell, rr, mix, dark, light, hexA, fillStroke, OUT, TAU, GRADE_COL, iconCanvas, iconCache, gem } = A;
  const SKIN = '#ffe7da', SKIN_SH = '#f7c2b0';

  /* ---------- волосы ---------- */
  const HAIRS = {
    girl: [
      { name: 'Сакура',  m: '#ff9ecd', sh: '#dd629c', hi: '#ffd7ec', eye: ['#3a1458', '#a03aa6', '#ff8ccf'], rib: '#e8435f' },
      { name: 'Лаванда', m: '#c9b8ff', sh: '#8f74d9', hi: '#efe8ff', eye: ['#1d2a5a', '#4a6ad0', '#9fd0ff'], rib: '#5c8de8' },
      { name: 'Полночь', m: '#45417a', sh: '#2a2852', hi: '#8b86d0', eye: ['#4a0f1e', '#c0304a', '#ff8a9b'], rib: '#e8435f' },
      { name: 'Янтарь',  m: '#ffb45c', sh: '#d9803a', hi: '#ffe2b0', eye: ['#1a3a2a', '#2f9a6a', '#8fe0b8'], rib: '#2f9a6a' },
    ],
    boy: [
      { name: 'Ночь',    m: '#353b6a', sh: '#1f2346', hi: '#7680c4', eye: ['#0f2a3a', '#2a8ab8', '#8fe0ff'] },
      { name: 'Серебро', m: '#e3e6f2', sh: '#a3a7c4', hi: '#ffffff', eye: ['#3a0f1e', '#c0304a', '#ff8a9b'] },
      { name: 'Пламя',   m: '#e8485c', sh: '#a82a3e', hi: '#ff9aa8', eye: ['#3a2a0a', '#d9a02a', '#ffe08a'] },
      { name: 'Пепел',   m: '#e8d29a', sh: '#b89a5a', hi: '#fff4d0', eye: ['#1d2a5a', '#4a6ad0', '#9fd0ff'] },
    ],
  };

  /* ---------- палитры грейдов ---------- */
  const GEAR = [
    { up: { m: '#f5f0e6', s: '#d6ccba', t: '#e0485c' }, lo: { m: '#3e4378', s: '#2c2f5a', t: '#e0485c' }, glove: '#efe6d6', boot: '#d9b98a', gem: '#e0485c', metal: '#c9cfd6' },
    { up: { m: '#7f9d5c', s: '#5f7c44', t: '#d4ad6c' }, lo: { m: '#6a5a3e', s: '#4f432d', t: '#c8a16a' }, glove: '#7a5a3a', boot: '#6b4a2e', gem: '#7fe07c', metal: '#b8bec6' },
    { up: { m: '#adc3dc', s: '#7f97b8', t: '#eef4fb' }, lo: { m: '#5f7ea8', s: '#465f84', t: '#dfe8f4' }, glove: '#b8c8dc', boot: '#8aa6c8', gem: '#5cbcff', metal: '#e6eef8' },
    { up: { m: '#8d6fd9', s: '#6a4fb5', t: '#e8ddff' }, lo: { m: '#5d48a6', s: '#45337f', t: '#e0d2ff' }, glove: '#8e78d8', boot: '#6e58b8', gem: '#9ef0ff', metal: '#e8ddff' },
    { up: { m: '#d9434f', s: '#a92d3b', t: '#ffd25c' }, lo: { m: '#8f2532', s: '#6b1b26', t: '#ffd25c' }, glove: '#c93b47', boot: '#a4303d', gem: '#ffd25c', metal: '#ffd25c' },
    { up: { m: '#fff6e0', s: '#ead6a5', t: '#ffc63a' }, lo: { m: '#f6ead0', s: '#d9c493', t: '#ffc63a' }, glove: '#fff1cc', boot: '#f4e2b0', gem: '#7fe3ff', metal: '#ffd760' },
    { up: { m: '#3b2556', s: '#26163a', t: '#ff62d4' }, lo: { m: '#2b1a40', s: '#1a0f2a', t: '#ff62d4' }, glove: '#3b2556', boot: '#2b1a40', gem: '#ff62d4', metal: '#8a6ab0' },
  ];
  const BASE = { up: { m: '#3d3764', s: '#2b2650', t: '#6d63a8' }, lo: { m: '#2f2a52', s: '#221e3e', t: '#6d63a8' }, boot: '#4a3d5e' };
  const JEWEL = ['#c98a4a', '#dfe6ee', '#4f8fe8', '#a46ae8', '#e0304a', '#7fe3ff', '#ff62d4'];

  const BLADE = [
    { b: '#c79a5e', e: '#e9c690', wood: true, grip: '#8a6238' },
    { b: '#d6dde6', e: '#ffffff', grip: '#2a2140', wrap: '#c94a6a', tsuba: '#5a5a66' },
    { b: '#b4d9ff', e: '#ffffff', grip: '#1d2a4a', wrap: '#5cbcff', tsuba: '#cbd8ea', tassel: '#3f8fe8' },
    { b: '#d3bfff', e: '#f7f2ff', grip: '#2a1d4a', wrap: '#bd8aff', tsuba: '#e8ddff', tassel: '#8a5ad8' },
    { b: '#ffbb98', e: '#fff2e4', grip: '#3a1418', wrap: '#ffcf5a', tsuba: '#ffcf5a', tassel: '#d9434f' },
    { b: '#fff0bd', e: '#ffffff', grip: '#f4e2b0', wrap: '#ffc63a', tsuba: '#ffd760', tassel: '#ffd760' },
    { b: '#2c1a3a', e: '#ff86e3', grip: '#1a0f2a', wrap: '#ff62d4', tsuba: '#3a2452', tassel: '#ff62d4' },
  ];
  const BLADE_LEN = [50, 56, 60, 64, 68, 72, 76];
  const pulse = (t, f = 4) => .6 + .4 * Math.sin(t * f);

  /* ====================================================================== */
  /* look: {body,hair,weapon:{g,e}|null,helmet,upper,lower,gloves,boots,neck,ear,aura,cosmetic}
     an:   {t, run, phase, swing(-1|0..1), hurt, dead, cast} */
  function drawHero(ctx, x, y, k, look, an) {
    const t = an.t, boy = look.body === 'boy';
    const H = HAIRS[boy ? 'boy' : 'girl'][look.hair || 0] || HAIRS.girl[0];
    ctx.save();
    ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(15,6,30,.3)'; ell(ctx, 2, 0, 26, 5.5); ctx.fill();
    if (an.dead) { ctx.globalAlpha = .45; ctx.translate(0, 4); }

    if (look.aura >= 0) {
      const c = GRADE_COL[look.aura], p = .55 + .25 * Math.sin(t * 3);
      const g = ctx.createRadialGradient(0, -52, 6, 0, -52, 70);
      g.addColorStop(0, hexA(c, 0)); g.addColorStop(.45, hexA(c, .28 * p)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ell(ctx, 0, -52, 52, 66); ctx.fill();
      ctx.strokeStyle = hexA(c, .5 * p); ctx.lineWidth = 1.5;
      ell(ctx, 0, -2, 30 + 4 * Math.sin(t * 2), 7); ctx.stroke();
    }
    if (look.cosmetic === 'petals') petalOrbit(ctx, t, false);

    const run = an.run, ph = an.phase;
    const bob = (run ? -Math.abs(Math.sin(ph)) * 3.2 : Math.sin(t * 2.4) * 1.1) - (an.cast > 0 ? Math.sin((1 - Math.min(1, an.cast / .4)) * Math.PI) * 5 : 0);
    let lean = an.swing >= 0 ? Math.sin(Math.min(1, an.swing * 1.6) * Math.PI) * .12 : (an.cast > 0 ? -.05 : run ? .08 : 0);
    if (an.cast > 0) lean += an.castType === 'single' ? .12 : an.castType === 'meteor' ? -.04 : 0;
    const hurtX = an.hurt > 0 ? Math.sin(an.hurt * 60) * 8 * an.hurt : 0;
    ctx.translate(hurtX, bob);
    ctx.rotate(lean);
    if (an.swing >= 0) {
      const s = Math.sin(Math.min(1, an.swing * 1.3) * Math.PI);
      ctx.translate(s * 3, -s * 1.2);
      ctx.transform(1, 0, -.1 * s, 1, 0, 0);
    }
    if (an.cast > 0) {
      const q = 1 - Math.min(1, an.cast / .4), s = Math.sin(q * Math.PI);
      if (an.castType === 'meteor') ctx.translate(0, -7 * s);
      else if (an.castType === 'cone' || an.castType === 'storm') ctx.rotate(-.07 * s);
      else if (an.castType === 'aoe') ctx.rotate(.06 * s);
    }

    const ug = look.upper, lg = look.lower;
    const U = ug >= 0 ? GEAR[ug].up : BASE.up, L = lg >= 0 ? GEAR[lg].lo : BASE.lo;
    const bootC = look.boots >= 0 ? GEAR[look.boots].boot : BASE.boot;

    backGear(ctx, ug, t, run, ph);
    if (!boy) ponytail(ctx, H, t, run, ph);
    const sh = run ? Math.sin(ph) : Math.sin(t * 2.4) * .15;
    backArm(ctx, U, look.gloves, sh, t);

    const legSwing = run ? Math.sin(ph) * .75 : 0;
    if (boy) {
      boyLeg(ctx, -5, -30, -legSwing + .05, L, lg, bootC, look.boots, true, t);
      boyHip(ctx, L, lg, t);
      boyLeg(ctx, 5, -30, legSwing - .02, L, lg, bootC, look.boots, false, t);
    } else {
      girlLeg(ctx, -4, -20, -legSwing + .05, bootC, look.boots, true, t);
      skirt(ctx, L, lg, t, run);
      girlLeg(ctx, 5, -20, legSwing - .02, bootC, look.boots, false, t);
    }
    torso(ctx, ug, U, t, boy);
    ctx.fillStyle = SKIN_SH; ctx.fillRect(-2.5, -61, 6, 5);
    if (look.neck >= 0) necklace(ctx, look.neck, t);
    head(ctx, t, look, an, H, boy);
    if (look.ear >= 0) earring(ctx, look.ear, t);
    pauldron(ctx, ug, U, t);
    swordArm(ctx, t, look, an, U);
    if (an.cast > 0) {
      const p = Math.min(1, an.cast / .4), c = an.castEl || '#ffe3f0';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .55 * Math.sin(p * Math.PI);
      const g = ctx.createRadialGradient(22, -78, 2, 22, -78, 46);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.35, c); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ell(ctx, 22, -78, 46, 46); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.4; ctx.globalAlpha = .5;
      ell(ctx, 22, -78, 20 + 8 * Math.sin(t * 12), 20 + 8 * Math.sin(t * 12)); ctx.stroke();
      ctx.restore();
    }
    if (look.cosmetic === 'petals') petalOrbit(ctx, t, true);
    ctx.restore();
  }

  function petalOrbit(ctx, t, front) {
    for (let i = 0; i < 6; i++) {
      const a = t * 1.4 + i * TAU / 6, z = Math.sin(a);
      if ((z > 0) !== front) continue;
      const px = Math.cos(a) * 30, py = -50 + Math.sin(a * 2 + i) * 18;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a * 2);
      ctx.fillStyle = i % 2 ? '#ffc4de' : '#ff8fc1'; ell(ctx, 0, 0, 3.4, 1.9); ctx.fill(); ctx.restore();
    }
  }

  /* ---------- спина: плащи и крылья ---------- */
  function capePath(ctx, wave, ragged) {
    ctx.beginPath();
    ctx.moveTo(-9, -55);
    ctx.bezierCurveTo(-22, -46, -30 + wave, -26, -34 + wave, -8);
    if (ragged) {
      const pts = [[-30 + wave, -12], [-27 + wave * .8, -5], [-23 + wave * .6, -11], [-19 + wave * .4, -4], [-16, -12]];
      for (const [px, py] of pts) ctx.lineTo(px, py);
    } else ctx.lineTo(-14, -12);
    ctx.bezierCurveTo(-10, -30, -4, -44, 6, -54);
    ctx.closePath();
  }
  function backGear(ctx, g, t, run, ph) {
    if (g < 3) return;
    const wave = Math.sin(t * 5 + (run ? ph : 0)) * (run ? 6 : 2);
    if (g === 5) wings(ctx, t, '#fffaf0', '#ffc63a', .78);
    if (g === 6) shards(ctx, t);
    if (g === 3) {
      // короткая накидка лунной стражи
      ctx.beginPath(); ctx.moveTo(-9, -56); ctx.bezierCurveTo(-18, -50, -22 + wave, -40, -24 + wave, -30);
      ctx.lineTo(-10, -32); ctx.bezierCurveTo(-6, -42, -2, -50, 6, -55); ctx.closePath();
      fillStroke(ctx, '#45337f', OUT, 2);
      ctx.strokeStyle = '#e8ddff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-24 + wave, -30); ctx.lineTo(-10, -32); ctx.stroke();
      return;
    }
    capePath(ctx, wave, g === 6);
    const C = { 4: ['#b32a3a', '#ffd25c'], 5: ['#fffaf0', '#ffc63a'], 6: ['#1e1030', '#ff62d4'] }[g];
    fillStroke(ctx, C[0], OUT, 2);
    ctx.save(); capePath(ctx, wave, g === 6); ctx.clip();
    ctx.fillStyle = dark(C[0], .25); ctx.fillRect(-40, -60, 14, 60);
    if (g === 4) { ctx.strokeStyle = hexA('#ffd25c', .6); ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14 - i * 6, -40 + i * 8); ctx.lineTo(-20 - i * 6 + wave * .5, -30 + i * 8); ctx.stroke(); } }
    if (g === 6) { ctx.strokeStyle = hexA('#ff62d4', .5 * pulse(t)); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-18 + wave * .4, -28, 5, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = C[1]; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-34 + wave, -8); ctx.lineTo(-14, -12); ctx.stroke();
  }
  function wings(ctx, t, fill, edge, alpha) {
    const flap = Math.sin(t * 2.6) * .12;
    for (const [ox, rot, a] of [[-2, -.2, alpha * .7], [-6, .05, alpha]]) {
      ctx.save(); ctx.translate(ox, -50); ctx.rotate(rot + flap); ctx.globalAlpha *= a;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-10, -22, -30, -34, -44, -30);
      ctx.quadraticCurveTo(-40, -22, -42, -16);
      ctx.quadraticCurveTo(-34, -12, -36, -4);
      ctx.quadraticCurveTo(-26, -2, -26, 6);
      ctx.quadraticCurveTo(-14, 4, -10, 10);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, -44, -20); g.addColorStop(0, fill); g.addColorStop(1, light(edge, .6));
      fillStroke(ctx, g, edge, 1.4);
      ctx.strokeStyle = hexA(edge, .6); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-22, -16, -40, -24); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(-22, -6, -34, -8); ctx.stroke();
      ctx.restore();
    }
  }
  function shards(ctx, t) {
    for (let i = 0; i < 5; i++) {
      const a = -2.4 + i * .32, r = 30 + (i % 2) * 6, bob = Math.sin(t * 2 + i) * 2;
      const px = Math.cos(a) * r - 4, py = -52 + Math.sin(a) * r + bob;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3.5, 0); ctx.lineTo(0, 9); ctx.lineTo(-3.5, 0); ctx.closePath();
      ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 8 * pulse(t, 3 + i);
      fillStroke(ctx, '#3a2452', '#ff62d4', 1.2); ctx.restore();
    }
  }

  /* ---------- волосы и голова ---------- */
  function ponytail(ctx, H, t, run, ph) {
    const sway = run ? Math.sin(ph) * 6 - 6 : Math.sin(t * 1.6) * 3;
    ctx.beginPath();
    ctx.moveTo(-14, -100);
    ctx.bezierCurveTo(-40, -104, -46 + sway, -84, -44 + sway, -62);
    ctx.bezierCurveTo(-43 + sway, -50, -50 + sway, -40, -56 + sway * 1.3, -34);
    ctx.bezierCurveTo(-40 + sway, -40, -30, -60, -26, -80);
    ctx.closePath();
    fillStroke(ctx, H.m, OUT, 2.2);
    ctx.beginPath(); ctx.moveTo(-30, -96); ctx.bezierCurveTo(-40, -88, -40 + sway, -70, -42 + sway, -58);
    ctx.strokeStyle = H.sh; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = H.rib; ell(ctx, -17, -99, 4.5, 3.5, .5); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke();
    ell(ctx, -21, -104, 3.4, 2.4, -.5); fillStroke(ctx, H.rib, OUT, 1.2);
  }
  function head(ctx, t, look, an, H, boy) {
    const hurt = an.hurt > 0, yell = an.swing >= 0 && an.swing < .7 || an.cast > 0;
    // задняя масса волос
    ctx.beginPath();
    if (boy) {
      ctx.moveTo(-24, -64);
      const pts = [[-33, -70], [-28, -76], [-39, -84], [-29, -90], [-36, -102], [-22, -102], [-20, -114], [-8, -108], [0, -118], [8, -110]];
      for (const [px, py] of pts) ctx.lineTo(px, py);
      ctx.bezierCurveTo(24, -114, 32, -98, 30, -86);
      ctx.lineTo(29, -70); ctx.lineTo(25, -62); ctx.lineTo(-20, -60);
    } else {
      ctx.moveTo(-26, -78);
      ctx.bezierCurveTo(-34, -112, 26, -122, 30, -88);
      ctx.bezierCurveTo(32, -76, 30, -66, 26, -60);
      ctx.lineTo(-24, -58);
      ctx.bezierCurveTo(-30, -64, -28, -72, -26, -78);
    }
    ctx.closePath();
    fillStroke(ctx, H.sh, OUT, 2.2);

    // лицо
    ctx.beginPath();
    ctx.moveTo(-18, -84);
    if (boy) { ctx.bezierCurveTo(-18, -70, -8, -61, 6, -60); ctx.bezierCurveTo(18, -60, 25, -70, 25, -84); }
    else { ctx.bezierCurveTo(-18, -68, -6, -60, 7, -60); ctx.bezierCurveTo(18, -60, 25, -70, 25, -84); }
    ctx.bezierCurveTo(25, -104, -18, -104, -18, -84);
    ctx.closePath();
    fillStroke(ctx, SKIN, OUT, 2.2);
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(232,150,140,.35)'; ell(ctx, 4, -91, 26, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = boy ? 'rgba(255,120,150,.22)' : 'rgba(255,120,150,.38)';
    ell(ctx, 19, -71, 4.5, 2.4); ctx.fill(); ell(ctx, -3, -71, 4, 2.2); ctx.fill();

    // глаза
    if (hurt) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
      for (const [ex, s] of [[14, 1], [0, .85]]) { ctx.beginPath(); ctx.moveTo(ex - 4 * s, -83); ctx.lineTo(ex + 3 * s, -79); ctx.lineTo(ex - 4 * s, -75); ctx.stroke(); }
    } else if (an.dead) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      for (const ex of [14, 0]) { ctx.beginPath(); ctx.moveTo(ex - 3.5, -82); ctx.lineTo(ex + 3.5, -76); ctx.moveTo(ex + 3.5, -82); ctx.lineTo(ex - 3.5, -76); ctx.stroke(); }
    } else {
      const blink = (t % 3.7) < .12;
      if (boy) { eye(ctx, 14.5, -79, 6.2, 8.2, blink, H.eye, true); eye(ctx, 0, -79, 5.1, 7.8, blink, H.eye, true); }
      else { eye(ctx, 14.5, -79, 6.6, 9.6, blink, H.eye, false); eye(ctx, 0, -79, 5.4, 9, blink, H.eye, false); }
    }
    // брови
    ctx.strokeStyle = H.sh; ctx.lineWidth = boy ? 2.4 : 1.6;
    if (boy) {
      ctx.beginPath(); ctx.moveTo(9, yell ? -91 : -92); ctx.lineTo(20, yell ? -95 : -94); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, yell ? -94 : -93); ctx.lineTo(4, yell ? -90 : -91.5); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(10, yell ? -92 : -93); ctx.quadraticCurveTo(15, yell ? -91 : -95, 20, yell ? -94 : -93); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -93); ctx.quadraticCurveTo(0, -95, 3, yell ? -91 : -93); ctx.stroke();
    }
    // рот
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.6;
    if (yell) { ctx.beginPath(); ctx.moveTo(6, -68); ctx.quadraticCurveTo(9, -63, 12, -68); ctx.closePath(); fillStroke(ctx, '#b0304a', OUT, 1.4); }
    else if (hurt) { ctx.beginPath(); ctx.moveTo(5, -66); ctx.lineTo(8, -68); ctx.lineTo(11, -66); ctx.stroke(); }
    else if (boy) { ctx.beginPath(); ctx.moveTo(6, -67); ctx.quadraticCurveTo(9.5, -66, 12, -67.5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(6, -67.5); ctx.quadraticCurveTo(9, -65.5, 11.5, -67.5); ctx.stroke(); }

    // чёлка
    ctx.beginPath();
    ctx.moveTo(-22, -80);
    ctx.bezierCurveTo(-28, -112, 30, -118, 29, -84);
    const pts = boy
      ? [[28, -76], [23, -90], [19, -78], [13, -94], [9, -80], [3, -97], [-3, -84], [-9, -98], [-13, -84], [-19, -92], [-21, -74]]
      : [[27, -80], [22, -92], [19, -84], [13, -94], [7, -86], [1, -95], [-5, -87], [-11, -96], [-16, -86], [-20, -76]];
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath();
    fillStroke(ctx, H.m, OUT, 2.2);
    ctx.strokeStyle = H.hi; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(2, -96, 15, -2.6, -1.4); ctx.stroke();
    // боковые пряди
    ctx.beginPath();
    if (boy) { ctx.moveTo(22, -92); ctx.lineTo(31, -74); ctx.lineTo(25, -80); ctx.lineTo(27, -66); ctx.lineTo(20, -82); }
    else { ctx.moveTo(22, -92); ctx.quadraticCurveTo(30, -78, 27, -60); ctx.quadraticCurveTo(24, -70, 20, -84); }
    ctx.closePath();
    fillStroke(ctx, H.m, OUT, 1.8);
    // ахоге
    ctx.beginPath();
    if (boy) { ctx.moveTo(4, -108); ctx.quadraticCurveTo(12 + Math.sin(t * 3) * 1.5, -118, 18, -114); }
    else { ctx.moveTo(2, -107); ctx.quadraticCurveTo(8 + Math.sin(t * 3) * 2, -122, 16, -116); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 4.2; ctx.stroke(); ctx.strokeStyle = H.m; ctx.lineWidth = 2.2; ctx.stroke();

    helmet(ctx, t, look.helmet, boy);
  }
  function eye(ctx, x, y, w, h, blink, E, boy) {
    if (blink) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x - w, y + 1); ctx.quadraticCurveTo(x, y + 4, x + w, y); ctx.stroke(); return;
    }
    ctx.fillStyle = '#fff'; ell(ctx, x, y, w, h); ctx.fill();
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, E[0]); g.addColorStop(.55, E[1]); g.addColorStop(1, E[2]);
    ctx.fillStyle = g; ell(ctx, x + .6, y + .6, w * .86, h * .9); ctx.fill();
    ctx.fillStyle = '#1a0a26'; ell(ctx, x + .8, y + .5, w * .42, h * .46); ctx.fill();
    ctx.fillStyle = '#fff'; ell(ctx, x - w * .3, y - h * .38, w * .32, h * .22); ctx.fill();
    ell(ctx, x + w * .35, y + h * .45, w * .16, h * .1); ctx.fill();
    ctx.strokeStyle = OUT;
    if (boy) {
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x - w - .5, y - h * .55); ctx.quadraticCurveTo(x, y - h - 1.4, x + w + 1, y - h * .7); ctx.stroke();
    } else {
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(x - w - .5, y - h * .45); ctx.quadraticCurveTo(x, y - h - 2.2, x + w + 1.5, y - h * .55); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + w + 1, y - h * .6); ctx.lineTo(x + w + 3, y - h * .25); ctx.stroke();
    }
  }

  function helmet(ctx, t, g, boy) {
    if (g < 0) {
      if (boy) return;
      ctx.save(); ctx.translate(22, -96);
      ctx.fillStyle = '#ffeaf3';
      for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ell(ctx, 0, -3, 2.2, 3); ctx.fill(); }
      ctx.fillStyle = '#ff5c8a'; ell(ctx, 0, 0, 1.4, 1.4); ctx.fill();
      ctx.restore();
      return;
    }
    if (g === 0) {
      ctx.beginPath(); ctx.moveTo(-20, -93); ctx.quadraticCurveTo(4, -101, 27, -92);
      ctx.lineTo(27, -87); ctx.quadraticCurveTo(4, -95, -20, -88); ctx.closePath();
      fillStroke(ctx, '#f7f4ee', OUT, 1.8);
      ctx.fillStyle = '#e0485c'; ell(ctx, 10, -93, 2.6, 2.6); ctx.fill();
      const w = Math.sin(t * 6) * 3;
      ctx.beginPath(); ctx.moveTo(-20, -91); ctx.quadraticCurveTo(-32, -96 + w, -40, -88 + w); ctx.lineTo(-37, -84 + w); ctx.quadraticCurveTo(-30, -90 + w, -20, -88); ctx.closePath();
      fillStroke(ctx, '#f7f4ee', OUT, 1.6);
      ctx.beginPath(); ctx.moveTo(-20, -89); ctx.quadraticCurveTo(-30, -86 + w, -36, -78 + w); ctx.lineTo(-33, -76 + w); ctx.quadraticCurveTo(-28, -84 + w, -20, -87); ctx.closePath();
      fillStroke(ctx, '#f7f4ee', OUT, 1.4);
      return;
    }
    if (g === 1) {
      // капюшон странника с кожаным ремешком
      ctx.beginPath(); ctx.moveTo(-24, -76); ctx.bezierCurveTo(-30, -116, 34, -122, 31, -84); ctx.lineTo(28, -88);
      ctx.bezierCurveTo(26, -110, -18, -110, -20, -84); ctx.closePath();
      fillStroke(ctx, '#6f8a4e', OUT, 2);
      ctx.strokeStyle = '#4f6a36'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.arc(4, -88, 22, -2.8, -.3); ctx.stroke(); ctx.setLineDash([]);
      rr(ctx, 5, -101, 12, 7, 2); fillStroke(ctx, '#c9cfd6', OUT, 1.4);
      ctx.fillStyle = '#7fe07c'; ell(ctx, 11, -97.5, 1.8, 1.8); ctx.fill();
      return;
    }
    if (g === 2) {
      ctx.beginPath(); ctx.moveTo(-22, -88); ctx.bezierCurveTo(-26, -118, 30, -122, 30, -88);
      ctx.quadraticCurveTo(4, -100, -22, -88); ctx.closePath();
      fillStroke(ctx, '#7f9fc6', OUT, 2.2);
      ctx.strokeStyle = '#e6eef8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(4, -95, 18, -2.7, -.5); ctx.stroke();
      ctx.fillStyle = '#e6eef8'; for (const rx of [-12, 0, 12, 22]) { ell(ctx, rx, -91 - (rx === 0 || rx === 12 ? 3 : 0), 1.2, 1.2); ctx.fill(); }
      // шейная пластина сикоро
      ctx.beginPath(); ctx.moveTo(-23, -88); ctx.quadraticCurveTo(-30, -78, -28, -70); ctx.lineTo(-22, -74); ctx.quadraticCurveTo(-22, -82, -18, -86); ctx.closePath();
      fillStroke(ctx, '#6a88b0', OUT, 1.6);
      ctx.beginPath(); ctx.moveTo(8, -104); ctx.quadraticCurveTo(0, -122, -8, -126); ctx.quadraticCurveTo(2, -116, 4, -104); ctx.closePath();
      fillStroke(ctx, '#ffd25c', OUT, 1.6);
      ctx.beginPath(); ctx.moveTo(14, -104); ctx.quadraticCurveTo(24, -120, 32, -122); ctx.quadraticCurveTo(22, -112, 18, -103); ctx.closePath();
      fillStroke(ctx, '#ffd25c', OUT, 1.6);
      return;
    }
    if (g === 3) {
      ctx.beginPath(); ctx.moveTo(-19, -92); ctx.quadraticCurveTo(4, -102, 27, -91);
      ctx.strokeStyle = OUT; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#e8ddff'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.save(); ctx.translate(8, -106);
      ctx.beginPath(); ctx.arc(0, 0, 7, .6, TAU - .6); ctx.arc(3, 0, 5.4, TAU - .9, .9, true); ctx.closePath();
      fillStroke(ctx, '#c9b8ff', OUT, 1.6);
      ctx.restore();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8 + s * 6, -99); ctx.lineTo(8 + s * 12, -104); ctx.lineTo(8 + s * 9, -98); ctx.closePath(); fillStroke(ctx, '#e8ddff', OUT, 1.1); }
      ctx.fillStyle = '#9ef0ff'; ctx.shadowColor = '#9ef0ff'; ctx.shadowBlur = 6; ell(ctx, 8, -98, 2, 2.6); ctx.fill(); ctx.shadowBlur = 0;
      return;
    }
    if (g === 4) {
      const w = Math.sin(t * 4) * 2;
      for (const [dy, c, len] of [[0, '#ff7a3c', 1], [-5, '#ffcf5a', .8]]) {
        ctx.beginPath(); ctx.moveTo(-10, -104 + dy); ctx.bezierCurveTo(-30 * len, -118 + w + dy, -46 * len, -108 + w + dy, -54 * len, -96 + w + dy);
        ctx.bezierCurveTo(-40 * len, -102 + dy, -26, -102 + dy, -12, -98 + dy); ctx.closePath();
        fillStroke(ctx, c, OUT, 1.8);
      }
      ctx.beginPath(); ctx.moveTo(-20, -92); ctx.quadraticCurveTo(4, -103, 27, -91); ctx.lineTo(27, -86); ctx.quadraticCurveTo(4, -97, -20, -87); ctx.closePath();
      fillStroke(ctx, '#d9434f', OUT, 1.8);
      ctx.beginPath(); ctx.moveTo(4, -97); ctx.lineTo(6, -108); ctx.lineTo(8, -102); ctx.lineTo(10, -112); ctx.lineTo(12, -97); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, 1.4);
      ctx.fillStyle = '#ff5a2c'; ell(ctx, 8, -96, 1.8, 1.8); ctx.fill();
      return;
    }
    if (g === 5) {
      ctx.strokeStyle = hexA('#ffe48a', .8 + .2 * Math.sin(t * 3)); ctx.lineWidth = 2.4;
      ell(ctx, 4, -122 + Math.sin(t * 2) * 1.5, 16, 4); ctx.stroke();
      ctx.strokeStyle = hexA('#fff8d0', .5); ctx.lineWidth = 5; ell(ctx, 4, -122 + Math.sin(t * 2) * 1.5, 16, 4); ctx.stroke();
      const cr = [[-14, -98], [-12, -110], [-5, -102], [3, -116], [10, -102], [18, -112], [22, -98]];
      ctx.beginPath(); cr.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.quadraticCurveTo(4, -94, -14, -98); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 1.8);
      for (const [px, py] of [[-12, -110], [3, -116], [18, -112]]) { ctx.fillStyle = '#fffbe8'; ell(ctx, px, py, 1.6, 1.6); ctx.fill(); }
      ctx.fillStyle = '#7fe3ff'; ell(ctx, 3, -103, 2.2, 2.6); ctx.fill();
      return;
    }
    ctx.beginPath(); ctx.moveTo(-20, -93); ctx.quadraticCurveTo(4, -102, 27, -92); ctx.lineTo(27, -87); ctx.quadraticCurveTo(4, -96, -20, -88); ctx.closePath();
    fillStroke(ctx, '#2b1a40', OUT, 1.8);
    for (const s of [-1, 1]) {
      ctx.beginPath(); const bx = s < 0 ? -10 : 18;
      ctx.moveTo(bx - 4, -97); ctx.quadraticCurveTo(bx + s * 10, -110, bx + s * 6, -126); ctx.quadraticCurveTo(bx + s * 2, -110, bx + 4, -97); ctx.closePath();
      fillStroke(ctx, '#3a2452', OUT, 1.6);
      ctx.strokeStyle = hexA('#ff62d4', .7 * pulse(t)); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, -100); ctx.quadraticCurveTo(bx + s * 6, -110, bx + s * 5, -120); ctx.stroke();
    }
    ctx.fillStyle = '#ff62d4'; ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 8;
    ell(ctx, 4, -96, 2.6, 2.6); ctx.fill(); ctx.shadowBlur = 0;
  }

  /* ---------- торс ---------- */
  function torsoPath(ctx, w) {
    ctx.beginPath();
    ctx.moveTo(-w, -57); ctx.quadraticCurveTo(0, -60, w + 1, -57);
    ctx.quadraticCurveTo(w + 3, -44, w, -33);
    ctx.lineTo(-w, -33);
    ctx.quadraticCurveTo(-w - 3, -44, -w, -57);
    ctx.closePath();
  }
  function torso(ctx, g, U, t, boy) {
    const w = boy ? 12 : 10;
    torsoPath(ctx, w); ctx.fillStyle = U.m; ctx.fill();
    ctx.save(); torsoPath(ctx, w); ctx.clip();
    ctx.fillStyle = U.s; ctx.fillRect(-w - 4, -60, 9, 30);
    torsoDetails(ctx, g, U, t, w);
    ctx.restore();
    torsoPath(ctx, w); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
    if (g === 0) { // узел оби
      ctx.beginPath(); ctx.moveTo(-w, -36); ctx.lineTo(-w - 7, -32); ctx.lineTo(-w - 4, -38); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 1.3);
      ctx.beginPath(); ctx.moveTo(-w, -36); ctx.lineTo(-w - 5, -29); ctx.lineTo(-w - 1, -31); ctx.closePath(); fillStroke(ctx, '#c93a4c', OUT, 1.3);
    }
  }
  function belt(ctx, c, buckle, w) {
    ctx.fillStyle = c; ctx.fillRect(-w - 4, -38, 2 * w + 8, 5);
    ctx.fillStyle = dark(c, .25); ctx.fillRect(-w - 4, -34.5, 2 * w + 8, 1.5);
    if (buckle) { rr(ctx, -2, -38.6, 6, 6, 1.2); fillStroke(ctx, buckle, OUT, 1); }
  }
  function torsoDetails(ctx, g, U, t, w) {
    ctx.lineCap = 'round';
    switch (g) {
      case -1:
        ctx.strokeStyle = U.t; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(3, -46); ctx.lineTo(10, -58); ctx.stroke();
        belt(ctx, '#8f6bd0', null, w); break;
      case 0:
        ctx.strokeStyle = U.t; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(3, -45); ctx.lineTo(10, -58); ctx.stroke();
        ctx.strokeStyle = dark(U.m, .2); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-8, -52); ctx.quadraticCurveTo(-4, -46, -7, -40); ctx.moveTo(9, -50); ctx.lineTo(7, -40); ctx.stroke();
        belt(ctx, '#e0485c', null, w); break;
      case 1:
        ctx.fillStyle = light(U.m, .18);
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(1, -48); ctx.lineTo(-7, -50); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, -58); ctx.lineTo(4, -48); ctx.lineTo(11, -50); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(w + 1, -57); ctx.lineTo(-w, -37); ctx.stroke();
        rr(ctx, 0, -49, 5, 5, 1); fillStroke(ctx, '#c9cfd6', OUT, .9);
        ctx.strokeStyle = hexA('#f2e2b8', .7); ctx.lineWidth = .8; ctx.setLineDash([1.6, 1.6]);
        ctx.beginPath(); ctx.moveTo(-w + 2, -55); ctx.lineTo(-w + 1, -39); ctx.moveTo(w - 1, -55); ctx.lineTo(w - 1, -39); ctx.stroke(); ctx.setLineDash([]);
        belt(ctx, '#5a3f26', '#c9cfd6', w);
        rr(ctx, 4, -37, 6, 6, 1.5); fillStroke(ctx, '#7a5a3a', OUT, 1); break;
      case 2:
        ctx.fillStyle = light(U.m, .35); ctx.fillRect(-w - 2, -59, 2 * w + 4, 4);
        ctx.strokeStyle = dark(U.m, .35); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-w, -49); ctx.quadraticCurveTo(0, -46, w + 2, -49); ctx.moveTo(-w, -42.5); ctx.quadraticCurveTo(0, -39.5, w + 2, -42.5); ctx.stroke();
        ctx.fillStyle = '#eef4fb';
        for (const ry of [-51, -44.5]) for (const rx of [-w + 3, w - 1]) { ell(ctx, rx, ry, 1, 1); ctx.fill(); }
        ctx.strokeStyle = hexA('#ffffff', .6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -56); ctx.lineTo(-4, -50); ctx.stroke();
        belt(ctx, '#3a4560', '#e6eef8', w); break;
      case 3:
        ctx.strokeStyle = U.t; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(1, -58); ctx.lineTo(1, -38); ctx.moveTo(-w, -48); ctx.lineTo(-3, -46); ctx.moveTo(w + 2, -48); ctx.lineTo(5, -46); ctx.stroke();
        ctx.save(); ctx.translate(1, -50);
        ctx.beginPath(); ctx.arc(0, 0, 4.4, .7, TAU - .7); ctx.arc(2, 0, 3.4, TAU - 1, 1, true); ctx.closePath();
        fillStroke(ctx, '#e8ddff', OUT, 1); ctx.restore();
        belt(ctx, '#45337f', null, w);
        ctx.fillStyle = '#9ef0ff'; ctx.shadowColor = '#9ef0ff'; ctx.shadowBlur = 5; ell(ctx, 1, -35.5, 2, 2); ctx.fill(); ctx.shadowBlur = 0; break;
      case 4:
        ctx.strokeStyle = U.t; ctx.lineWidth = 1.8;
        for (const y0 of [-53, -47.5, -42]) { ctx.beginPath(); ctx.moveTo(-w + 1, y0 - 3); ctx.lineTo(1, y0 + 1.5); ctx.lineTo(w + 1, y0 - 3); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(1, -58); ctx.lineTo(4, -54.5); ctx.lineTo(1, -51); ctx.lineTo(-2, -54.5); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, 1.1);
        belt(ctx, '#ffd25c', '#d9434f', w); break;
      case 5:
        ctx.beginPath(); ctx.moveTo(-6, -56); ctx.lineTo(8, -56); ctx.lineTo(7, -45); ctx.lineTo(1, -39); ctx.lineTo(-5, -45); ctx.closePath();
        fillStroke(ctx, '#ffd760', '#c99a2a', 1.2);
        ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = .9;
        ctx.beginPath(); ctx.arc(1, -48, 4, Math.PI, 0); ctx.stroke();
        ctx.strokeStyle = U.t; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(-w + 3, -44, 3, -1.5, 1.5); ctx.arc(w - 1, -44, 3, Math.PI - 1.5, Math.PI + 1.5); ctx.stroke();
        ctx.fillStyle = '#7fe3ff'; ell(ctx, 1, -49, 2, 2.4); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.stroke();
        belt(ctx, '#ffd760', '#fff6e0', w); break;
      case 6: {
        ctx.strokeStyle = dark(U.m, .4); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-w, -50); ctx.lineTo(1, -46); ctx.lineTo(w + 2, -50); ctx.stroke();
        const a = pulse(t);
        ctx.save(); ctx.strokeStyle = hexA('#ff62d4', a); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(-6, -56); ctx.lineTo(-3, -51); ctx.lineTo(-6, -45); ctx.moveTo(8, -56); ctx.lineTo(5, -51); ctx.lineTo(8, -45);
        ctx.moveTo(1 + 3, -41); ctx.arc(1, -41, 3, 0, TAU); ctx.stroke(); ctx.restore();
        belt(ctx, '#1a0f2a', null, w);
        ctx.fillStyle = '#ff62d4'; ell(ctx, 1, -35.5, 2, 2); ctx.fill(); break;
      }
    }
  }
  function pauldron(ctx, g, U, t) {
    if (g < 1) return;
    ctx.save(); ctx.translate(9, -54);
    if (g === 1) { ell(ctx, 0, 0, 6, 4.4, -.3); fillStroke(ctx, '#6b4a2e', OUT, 1.8); ctx.restore(); return; }
    if (g === 2) {
      ell(ctx, 0, 0, 7.5, 5.5, -.3); fillStroke(ctx, light(U.m, .15), OUT, 2);
      ell(ctx, .5, 1.5, 5.5, 3.6, -.3); ctx.strokeStyle = U.t; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#eef4fb'; ell(ctx, -3, -2, 1, 1); ctx.fill(); ell(ctx, 4, -1, 1, 1); ctx.fill();
    } else if (g === 3) {
      ell(ctx, 0, -1, 8, 5.5, -.3); fillStroke(ctx, U.m, OUT, 1.8);
      ell(ctx, 1, 2, 6.5, 4.2, -.3); fillStroke(ctx, light(U.m, .12), OUT, 1.6);
      ctx.strokeStyle = U.t; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(1, 1, 2.4, .6, TAU - .6); ctx.stroke();
    } else if (g === 4) {
      ctx.beginPath(); ctx.moveTo(-7, 3); ctx.quadraticCurveTo(-6, -6, -2, -8); ctx.lineTo(0, -3); ctx.lineTo(3, -10); ctx.lineTo(4, -3); ctx.lineTo(9, -7); ctx.quadraticCurveTo(9, 2, 6, 5); ctx.closePath();
      fillStroke(ctx, U.m, OUT, 1.8);
      ctx.strokeStyle = U.t; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 2); ctx.quadraticCurveTo(0, -2, 6, 3); ctx.stroke();
    } else if (g === 5) {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate(-.9 + i * .35);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -9, 0, -15); ctx.quadraticCurveTo(-3, -9, 0, 0); fillStroke(ctx, '#fffaf0', '#c99a2a', 1);
        ctx.restore();
      }
      ell(ctx, 0, 0, 7.5, 5.5, -.3); fillStroke(ctx, '#ffd760', OUT, 1.8);
      ctx.fillStyle = '#7fe3ff'; ell(ctx, .5, .5, 1.6, 1.6); ctx.fill();
    } else if (g === 6) {
      for (const [sx, h] of [[-4, 10], [0, 13], [4, 10]]) {
        ctx.beginPath(); ctx.moveTo(sx - 2.4, -2); ctx.lineTo(sx + 1, -2 - h); ctx.lineTo(sx + 2.4, -2); ctx.closePath(); fillStroke(ctx, '#2b1a40', OUT, 1.3);
      }
      ell(ctx, 0, 0, 7.5, 5.5, -.3); fillStroke(ctx, U.m, OUT, 1.8);
      ctx.strokeStyle = hexA('#ff62d4', pulse(t)); ctx.lineWidth = 1.2; ell(ctx, .5, .5, 4, 2.6, -.3); ctx.stroke();
    }
    ctx.restore();
  }
  function necklace(ctx, g, t) {
    ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e3ddd0'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-5, -58); ctx.quadraticCurveTo(1, -51, 7, -58); ctx.stroke();
    const c = JEWEL[g];
    ctx.beginPath(); ctx.moveTo(1, -55.5); ctx.lineTo(3, -53); ctx.lineTo(1, -50.5); ctx.lineTo(-1, -53); ctx.closePath();
    if (g >= 5) { ctx.shadowColor = c; ctx.shadowBlur = 6; }
    fillStroke(ctx, c, OUT, .8); ctx.shadowBlur = 0;
  }
  function earring(ctx, g, t) {
    const sw = Math.sin(t * 3) * .15;
    ctx.save(); ctx.translate(-15, -70); ctx.rotate(sw);
    ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e3ddd0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 4); ctx.stroke();
    const c = JEWEL[g];
    if (g >= 5) { ctx.shadowColor = c; ctx.shadowBlur = 5; }
    ell(ctx, 0, 6, 1.9, 2.4); fillStroke(ctx, c, OUT, .8); ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ---------- нижняя часть: юбка (девочка) и хакама (мальчик) ---------- */
  function skirtPath(ctx, fl) {
    ctx.beginPath();
    ctx.moveTo(-11, -35); ctx.lineTo(11, -35);
    ctx.quadraticCurveTo(17, -26, 19 + fl, -15);
    ctx.quadraticCurveTo(0, -11 + fl, -19 - fl, -15);
    ctx.quadraticCurveTo(-16, -26, -11, -35);
    ctx.closePath();
  }
  function skirt(ctx, L, g, t, run) {
    const fl = run ? Math.sin(t * 13 * 2) * 1.5 : Math.sin(t * 2) * .6;
    if (g === 5) { // нижний слой
      ctx.beginPath(); ctx.moveTo(-12, -30); ctx.quadraticCurveTo(-18, -18, -21 - fl, -11); ctx.quadraticCurveTo(0, -7 + fl, 21 + fl, -11); ctx.quadraticCurveTo(18, -18, 12, -30); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 1.8);
    }
    skirtPath(ctx, fl); ctx.fillStyle = L.m; ctx.fill();
    ctx.save(); skirtPath(ctx, fl); ctx.clip();
    ctx.fillStyle = L.s; ctx.fillRect(-22, -36, 14, 30);
    ctx.strokeStyle = dark(L.m, .35); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3, -33); ctx.lineTo(-6, -13); ctx.moveTo(5, -33); ctx.lineTo(8, -13); ctx.stroke();
    const hem = -17 + fl * .5;
    switch (g) {
      case -1: case 0: ctx.fillStyle = L.t; ctx.fillRect(-22, hem, 44, 2.2); break;
      case 1:
        ctx.strokeStyle = hexA('#f2e2b8', .8); ctx.lineWidth = .9; ctx.setLineDash([1.8, 1.8]);
        ctx.beginPath(); ctx.moveTo(-20, hem + .5); ctx.lineTo(20, hem + .5); ctx.stroke(); ctx.setLineDash([]);
        rr(ctx, -12, -34, 6, 6, 1.4); fillStroke(ctx, '#7a5a3a', OUT, 1); break;
      case 2:
        for (const px of [-11, 2]) { rr(ctx, px, -33, 9, 14, 2); fillStroke(ctx, '#adc3dc', OUT, 1.2); ctx.fillStyle = '#eef4fb'; ell(ctx, px + 2.2, -30.5, .9, .9); ctx.fill(); ell(ctx, px + 6.8, -30.5, .9, .9); ctx.fill(); }
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem, 44, 1.6); break;
      case 3:
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem - 1, 44, 2.4);
        ctx.strokeStyle = hexA(L.t, .6); ctx.lineWidth = .9; ctx.beginPath();
        for (const px of [-14, -6, 2, 10]) { ctx.moveTo(px, -32); ctx.lineTo(px + (px > 0 ? 1.5 : -1.5), hem - 1); } ctx.stroke(); break;
      case 4:
        for (const px of [-12, 1]) {
          ctx.beginPath(); ctx.moveTo(px, -33); ctx.lineTo(px + 11, -33); ctx.lineTo(px + 10, -21); ctx.lineTo(px + 5.5, -17); ctx.lineTo(px + 1, -21); ctx.closePath();
          fillStroke(ctx, '#a92d3b', '#ffd25c', 1.2);
        }
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem, 44, 1.8); break;
      case 5:
        ctx.fillStyle = L.t; ctx.fillRect(-22, hem - 1, 44, 2.6);
        ctx.fillStyle = '#7fe3ff';
        for (let px = -16; px <= 16; px += 6) { ctx.beginPath(); ctx.moveTo(px, hem - 3.5); ctx.lineTo(px + 1.6, hem - 2); ctx.lineTo(px, hem - .5); ctx.lineTo(px - 1.6, hem - 2); ctx.closePath(); ctx.fill(); }
        break;
      case 6:
        ctx.save(); ctx.fillStyle = hexA('#ff62d4', pulse(t)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6; ctx.fillRect(-22, hem, 44, 1.6); ctx.restore();
        for (const px of [-10, -2, 6]) { ctx.beginPath(); ctx.moveTo(px, -33); ctx.lineTo(px + 7, -33); ctx.lineTo(px + 3.5, -20); ctx.closePath(); fillStroke(ctx, '#3b2556', OUT, 1); }
        break;
    }
    ctx.restore();
    skirtPath(ctx, fl); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
  }
  function boyHip(ctx, L, g, t) {
    ctx.beginPath(); ctx.moveTo(-12, -36); ctx.lineTo(12, -36); ctx.lineTo(14, -26); ctx.quadraticCurveTo(0, -23, -14, -26); ctx.closePath();
    ctx.fillStyle = L.m; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = L.s; ctx.fillRect(-16, -37, 10, 14);
    ctx.strokeStyle = dark(L.m, .35); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -34); ctx.lineTo(-4, -24); ctx.moveTo(5, -34); ctx.lineTo(6, -24); ctx.stroke();
    if (g === 2) { for (const px of [-11, 3]) { rr(ctx, px, -35, 8, 9, 2); fillStroke(ctx, '#adc3dc', OUT, 1); } }
    if (g === 4) { for (const px of [-12, 2]) { ctx.beginPath(); ctx.moveTo(px, -35); ctx.lineTo(px + 10, -35); ctx.lineTo(px + 5, -25); ctx.closePath(); fillStroke(ctx, '#a92d3b', '#ffd25c', 1); } }
    if (g === 6) { for (const px of [-9, 1]) { ctx.beginPath(); ctx.moveTo(px, -35); ctx.lineTo(px + 7, -35); ctx.lineTo(px + 3.5, -25); ctx.closePath(); fillStroke(ctx, '#3b2556', OUT, 1); } }
    ctx.restore();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-12, -36); ctx.lineTo(12, -36); ctx.lineTo(14, -26); ctx.quadraticCurveTo(0, -23, -14, -26); ctx.closePath(); ctx.stroke();
  }
  function boyLeg(ctx, hx, hy, a, L, g, bootC, bootG, back, t) {
    const len = 26;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-a);
    const col = back ? dark(L.m, .18) : L.m;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(6.5, len - 8); ctx.quadraticCurveTo(0, len - 6, -6.5, len - 8); ctx.closePath();
    fillStroke(ctx, col, OUT, 2);
    ctx.save(); ctx.clip();
    if (g === 3 || g === 5) { ctx.fillStyle = L.t; ctx.fillRect(-7, len - 11, 14, 2.2); }
    if (g === 4) { ctx.fillStyle = L.t; ctx.fillRect(3.4, 0, 1.6, len); }
    if (g === 6) { ctx.fillStyle = hexA('#ff62d4', pulse(t)); ctx.fillRect(3.4, 0, 1.4, len); }
    if (g === 1) { rr(ctx, -3, 8, 6, 5, 1); fillStroke(ctx, light(L.m, .15), null); }
    ctx.restore();
    if (g === 2 || g === 4 || g === 6) { // наколенник
      ell(ctx, 0, len * .42, 4.2, 3.4); fillStroke(ctx, g === 2 ? '#e6eef8' : g === 4 ? '#ffd25c' : '#3a2452', OUT, 1.2);
    }
    ctx.restore();
    const fx = hx + Math.sin(a) * len, fy = hy + Math.cos(a) * len;
    boot(ctx, fx, fy, a, bootC, bootG, back, t);
  }
  function girlLeg(ctx, hx, hy, a, bootC, bootG, back, t) {
    const len = 18;
    const fx = hx + Math.sin(a) * len, fy = hy + Math.cos(a) * len;
    ctx.strokeStyle = OUT; ctx.lineWidth = 8.6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.strokeStyle = bootG === 0 ? (back ? '#e6dfd2' : '#f8f4ec') : (back ? '#241d38' : '#30284a'); ctx.lineWidth = 6.2; ctx.stroke();
    if (bootG === 2 || bootG === 4 || bootG === 6) {
      const kx = hx + Math.sin(a) * len * .45, ky = hy + Math.cos(a) * len * .45;
      ell(ctx, kx, ky, 3.6, 3); fillStroke(ctx, bootG === 2 ? '#e6eef8' : bootG === 4 ? '#ffd25c' : '#3a2452', OUT, 1.1);
    }
    boot(ctx, fx, fy, a, bootC, bootG, back, t);
  }
  function bootShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(-4.5, -9); ctx.lineTo(4, -9); ctx.lineTo(4.5, -3);
    ctx.quadraticCurveTo(11, -3, 11, 1.5); ctx.lineTo(-5, 1.5); ctx.closePath();
  }
  function boot(ctx, fx, fy, a, c, g, back, t) {
    if (g === -2) return;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(a * .4);
    if (g === 0) { // таби и дзори
      bootShape(ctx); fillStroke(ctx, back ? '#e6dfd2' : '#f8f4ec', OUT, 1.8);
      rr(ctx, -5.5, .5, 17, 3, 1.4); fillStroke(ctx, '#d9b98a', OUT, 1.2);
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(1, -2); ctx.lineTo(6, .5); ctx.stroke();
      ctx.restore(); return;
    }
    bootShape(ctx); fillStroke(ctx, back ? dark(c, .2) : c, OUT, 2);
    switch (g) {
      case -1: break;
      case 1:
        ctx.fillStyle = light(c, .2); ctx.fillRect(-4.5, -9, 9, 2.4);
        ctx.strokeStyle = '#f2e2b8'; ctx.lineWidth = .9; ctx.beginPath();
        ctx.moveTo(-1, -6); ctx.lineTo(3, -4); ctx.moveTo(3, -6); ctx.lineTo(-1, -4); ctx.stroke(); break;
      case 2:
        rr(ctx, -5, -10, 10, 5, 1.5); fillStroke(ctx, '#e6eef8', OUT, 1.2);
        ctx.fillStyle = '#7f97b8'; ctx.fillRect(4, -2.5, 6, 1.2); break;
      case 3:
        ctx.fillStyle = '#e8ddff'; ctx.fillRect(-4.5, -9, 9, 2.2);
        ctx.strokeStyle = '#e8ddff'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(0, -4, 1.8, .6, TAU - .6); ctx.stroke(); break;
      case 4:
        ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-3, -13); ctx.lineTo(-1, -9); ctx.lineTo(1, -14); ctx.lineTo(3, -9); ctx.lineTo(5, -12); ctx.lineTo(5, -7); ctx.closePath();
        fillStroke(ctx, '#ffd25c', OUT, 1.1); break;
      case 5:
        ctx.fillStyle = '#ffd760'; ctx.fillRect(-4.5, -9, 9, 2); ctx.fillRect(-5, .2, 16, 1.4);
        ctx.save(); ctx.translate(-4, -6); ctx.rotate(-.4 + Math.sin(t * 4) * .1);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-7, -3, -9, -8); ctx.quadraticCurveTo(-4, -6, 0, -3); ctx.closePath();
        fillStroke(ctx, '#fffaf0', '#c99a2a', 1); ctx.restore(); break;
      case 6:
        for (const sx of [-3, 1]) { ctx.beginPath(); ctx.moveTo(sx, -9); ctx.lineTo(sx + 1.5, -14); ctx.lineTo(sx + 3, -9); ctx.closePath(); fillStroke(ctx, '#3a2452', OUT, 1); }
        ctx.save(); ctx.fillStyle = hexA('#ff62d4', pulse(t)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 5; ctx.fillRect(-5, .3, 16, 1.2); ctx.restore(); break;
    }
    ctx.restore();
  }

  /* ---------- руки, наручи, катана ---------- */
  function bracer(ctx, sx, sy, hx, hy, g, t, back) {
    if (g < 0) return;
    const p0 = .5, p1 = .92;
    const x0 = sx + (hx - sx) * p0, y0 = sy + (hy - sy) * p0, x1 = sx + (hx - sx) * p1, y1 = sy + (hy - sy) * p1;
    const G = GEAR[g], c = back ? dark(G.glove, .2) : G.glove;
    ctx.strokeStyle = OUT; ctx.lineWidth = 10.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang) * 4, ny = Math.cos(ang) * 4;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    ctx.lineWidth = 1.1;
    switch (g) {
      case 0: ctx.strokeStyle = '#c9bca4'; ctx.beginPath(); for (const q of [.3, .7]) { const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q; ctx.moveTo(px - nx, py - ny); ctx.lineTo(px + nx * .6 + (x1 - x0) * .12, py + ny * .6 + (y1 - y0) * .12); } ctx.stroke(); break;
      case 1: ctx.strokeStyle = light(c, .3); ctx.beginPath(); ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.stroke(); break;
      case 2: ctx.strokeStyle = '#7f97b8'; ctx.beginPath(); ctx.moveTo(mx - nx, my - ny); ctx.lineTo(mx + nx, my + ny); ctx.stroke(); ctx.fillStyle = '#eef4fb'; ell(ctx, mx + (x1 - x0) * .2, my + (y1 - y0) * .2, .9, .9); ctx.fill(); break;
      case 3: ctx.strokeStyle = '#e8ddff'; ctx.beginPath(); ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.stroke(); ctx.fillStyle = '#9ef0ff'; ell(ctx, mx, my, 1.4, 1.4); ctx.fill(); break;
      case 4:
        ctx.fillStyle = '#ffd25c';
        for (const q of [.25, .6]) { const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q; ctx.beginPath(); ctx.moveTo(px - nx, py - ny); ctx.lineTo(px - nx * 2.2 + (x1 - x0) * .1, py - ny * 2.2 + (y1 - y0) * .1); ctx.lineTo(px - nx + (x1 - x0) * .18, py - ny + (y1 - y0) * .18); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, .8); }
        break;
      case 5: ctx.strokeStyle = '#ffd760'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.stroke(); ctx.fillStyle = '#7fe3ff'; ell(ctx, mx, my, 1.5, 1.5); ctx.fill(); break;
      case 6:
        for (const q of [.3, .65]) { const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q; ctx.beginPath(); ctx.moveTo(px - nx * .8, py - ny * .8); ctx.lineTo(px - nx * 2.3, py - ny * 2.3); ctx.lineTo(px - nx * .8 + (x1 - x0) * .15, py - ny * .8 + (y1 - y0) * .15); ctx.closePath(); fillStroke(ctx, '#2b1a40', OUT, .8); }
        ctx.save(); ctx.strokeStyle = hexA('#ff62d4', pulse(t)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + nx * .4, y0 + ny * .4); ctx.lineTo(x1 + nx * .4, y1 + ny * .4); ctx.stroke(); ctx.restore(); break;
    }
  }
  function backArm(ctx, U, gg, sh, t) {
    const sx = -7, sy = -52, a = 1.75 + sh * .7;
    const hx = sx + Math.cos(a) * 15, hy = sy + Math.sin(a) * 15;
    ctx.strokeStyle = OUT; ctx.lineWidth = 9.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = U.s; ctx.lineWidth = 7; ctx.stroke();
    bracer(ctx, sx, sy, hx, hy, gg, t, true);
    ctx.fillStyle = gg >= 1 ? dark(GEAR[gg].glove, .15) : SKIN_SH; ell(ctx, hx, hy, 3.6, 3.6); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function swordArm(ctx, t, look, an, U) {
    let sa;
    const idle = -1.25 + Math.sin(t * 2.4) * .05;
    if (an.swing >= 0) {
      const p = an.swing, combo = an.combo || 0;
      const A0 = combo === 1 ? 1.0 : combo === 2 ? -3.25 : -2.75;
      const A1 = combo === 1 ? -2.3 : combo === 2 ? 1.35 : .75;
      if (p < .28) sa = idle + (A0 - idle) * A.easeOut(p / .28);
      else if (p < .55) sa = A0 + (A1 - A0) * A.easeIn((p - .28) / .27);
      else sa = A1 + (idle - A1) * A.easeInOut((p - .55) / .45);
    } else if (an.cast > 0) {
      const c = an.castType;
      if (c === 'single') sa = -.35 + Math.sin(t * 30) * .08;
      else if (c === 'meteor') sa = -2.95 + Math.sin(t * 18) * .1;
      else if (c === 'aoe' || c === 'cone') sa = -2.2 + Math.sin(t * 20) * .45;
      else if (c === 'multi' || c === 'storm') sa = -.75 + Math.sin(t * 28) * .55;
      else sa = -1.9 - Math.sin(an.cast * Math.PI) * .6;
    }
    else if (an.run) sa = -.55 + Math.sin(an.phase) * .1;
    else sa = idle;
    const sx = 7, sy = -53, aa = sa * .55 + .55;
    const hx = sx + Math.cos(aa) * 15, hy = sy + Math.sin(aa) * 15;
    ctx.strokeStyle = OUT; ctx.lineWidth = 9.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = U.m; ctx.lineWidth = 7; ctx.stroke();
    bracer(ctx, sx, sy, hx, hy, look.gloves, t, false);
    if (look.weapon) drawKatana(ctx, hx, hy, sa, look.weapon.g, look.weapon.e, t);
    const gc = look.gloves >= 1 ? GEAR[look.gloves].glove : SKIN;
    ctx.fillStyle = gc; ell(ctx, hx, hy, 4, 4); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke();
    if (look.gloves === 0) { ctx.strokeStyle = '#efe6d6'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx, hy, 2.6, aa + 2.4, aa + 3.8); ctx.stroke(); }
  }

  function drawKatana(ctx, hx, hy, a, g, e, t, scale = 1) {
    const C = BLADE[g], s = scale, len = BLADE_LEN[g] * s;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // кисточка у навершия
    if (C.tassel) {
      const dx = Math.sin(a), dy = Math.cos(a), sw = Math.sin(t * 4) * 2.5 * s;
      const px = -12 * s, ex = px + dx * 11 * s + sw * dy * .3, ey = dy * 11 * s - sw * dx * .3;
      ctx.strokeStyle = OUT; ctx.lineWidth = 3.2 * s; ctx.beginPath(); ctx.moveTo(px, 0); ctx.quadraticCurveTo(px + dx * 5 * s + sw, dy * 5 * s, ex, ey); ctx.stroke();
      ctx.strokeStyle = C.tassel; ctx.lineWidth = 1.8 * s; ctx.stroke();
      ell(ctx, ex, ey, 2.2 * s, 2.2 * s); fillStroke(ctx, C.tassel, OUT, 1 * s);
    }
    // рукоять
    ctx.strokeStyle = OUT; ctx.lineWidth = 5.4 * s; ctx.beginPath(); ctx.moveTo(-12 * s, 0); ctx.lineTo(3 * s, 0); ctx.stroke();
    ctx.strokeStyle = C.grip; ctx.lineWidth = 3.4 * s; ctx.stroke();
    if (C.wrap) {
      ctx.strokeStyle = C.wrap; ctx.lineWidth = 1 * s;
      for (let i = -10; i < 2; i += 3) { ctx.beginPath(); ctx.moveTo(i * s, -1.6 * s); ctx.lineTo((i + 1.5) * s, 1.6 * s); ctx.stroke(); }
    }
    if (g === 6) { ell(ctx, -13 * s, 0, 2 * s, 2 * s); ctx.fillStyle = '#ff62d4'; ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6 * s; ctx.fill(); ctx.shadowBlur = 0; }
    // клинок
    const glow = A.enchGlow(e, t);
    const blade = () => {
      ctx.beginPath();
      ctx.moveTo(4 * s, -2.2 * s);
      if (g === 6) {
        // зазубренный обух клинка бездны
        const n = 7;
        for (let i = 1; i <= n; i++) {
          const q = i / n, bx = 4 * s + (len - 4 * s) * q, by = -2.2 * s - (len * .06 + 1.4 * s) * q * q;
          ctx.lineTo(bx - 3 * s, by - 2.6 * s); ctx.lineTo(bx, by);
        }
      } else ctx.quadraticCurveTo(len * .55, -3.8 * s, len, -1.2 * s - len * .06);
      ctx.quadraticCurveTo(len * .6, 2.6 * s, 4 * s, 2.2 * s);
      ctx.closePath();
    };
    if (glow) {
      ctx.save();
      ctx.shadowColor = glow; ctx.shadowBlur = (10 + Math.min(e, 16) * .9) * s;
      blade(); ctx.fillStyle = glow; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .35 + .2 * Math.sin(t * 6);
      ctx.lineWidth = 6 * s; ctx.strokeStyle = glow; blade(); ctx.stroke();
      ctx.restore();
    }
    blade(); fillStroke(ctx, C.b, OUT, 1.6 * s);
    ctx.strokeStyle = C.e; ctx.lineWidth = 1.1 * s;
    ctx.beginPath(); ctx.moveTo(8 * s, 1.2 * s); ctx.quadraticCurveTo(len * .6, 1.6 * s, len - 3 * s, -len * .06); ctx.stroke();
    if (g === 2) { // хамон-волна
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .9 * s; ctx.beginPath();
      for (let x = 8; x < BLADE_LEN[g] - 6; x += 2) { const y = Math.sin(x * .55) * .7 - (x / BLADE_LEN[g]) * BLADE_LEN[g] * .04; x === 8 ? ctx.moveTo(x * s, y * s) : ctx.lineTo(x * s, y * s); }
      ctx.stroke();
    }
    if (g === 3) { ctx.strokeStyle = hexA('#bd8aff', .8); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(8 * s, -.4 * s); ctx.quadraticCurveTo(len * .5, -1.6 * s, len * .8, -len * .05); ctx.stroke(); }
    if (g === 4) {
      ctx.globalAlpha = .75; ctx.fillStyle = '#ff7a3c';
      for (let i = 0; i < 4; i++) { const px = len * (.3 + i * .16), fl = Math.sin(t * 12 + i) * 1.5; ell(ctx, px, -4 * s - fl, 2 * s, 3.5 * s); ctx.fill(); }
      ctx.fillStyle = '#ffd25c'; for (let i = 0; i < 3; i++) { const px = len * (.36 + i * .18); ell(ctx, px, -3.4 * s, 1 * s, 1.8 * s); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (g === 5) {
      ctx.strokeStyle = '#ffc63a'; ctx.lineWidth = .9 * s; ctx.beginPath(); ctx.moveTo(8 * s, -.6 * s); ctx.lineTo(len * .7, -len * .045); ctx.stroke();
      const sp = (t * 1.5) % 1, px = 8 * s + (len - 12 * s) * sp;
      ctx.save(); ctx.translate(px, -len * .03 * sp); ctx.fillStyle = '#ffffff'; ctx.rotate(t * 4);
      ctx.fillRect(-.6 * s, -3 * s, 1.2 * s, 6 * s); ctx.fillRect(-3 * s, -.6 * s, 6 * s, 1.2 * s); ctx.restore();
    }
    if (g === 6) {
      ctx.save(); ctx.strokeStyle = hexA('#ff62d4', pulse(t, 5)); ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6 * s; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); for (let i = 0; i < 4; i++) { const px = (10 + i * 14) * s; ctx.moveTo(px, -.5 * s); ctx.lineTo(px + 4 * s, -1.8 * s); ctx.lineTo(px + 8 * s, -.5 * s); } ctx.stroke(); ctx.restore();
    }
    // цуба
    if (!C.wood) tsuba(ctx, g, s, C, t);
    ctx.restore();
  }
  function tsuba(ctx, g, s, C, t) {
    switch (g) {
      case 1: case 2:
        ell(ctx, 3.5 * s, 0, 2.2 * s, 5.4 * s); fillStroke(ctx, C.tsuba, OUT, 1.4 * s);
        if (g === 2) { ctx.fillStyle = OUT; ell(ctx, 3.5 * s, -2.6 * s, .7 * s, .9 * s); ctx.fill(); ell(ctx, 3.5 * s, 2.6 * s, .7 * s, .9 * s); ctx.fill(); }
        break;
      case 3:
        ctx.save(); ctx.translate(3.5 * s, 0);
        ctx.beginPath(); ctx.arc(0, 0, 6 * s, -2.2, 2.2); ctx.arc(-2.5 * s, 0, 4.4 * s, 1.9, -1.9, true); ctx.closePath();
        fillStroke(ctx, C.tsuba, OUT, 1.2 * s); ctx.restore(); break;
      case 4:
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(3.5 * s, 0); ctx.quadraticCurveTo(7 * s, sg * 4 * s, 2 * s, sg * 8 * s); ctx.quadraticCurveTo(1 * s, sg * 3 * s, 3.5 * s, 0); fillStroke(ctx, C.tsuba, OUT, 1.1 * s); }
        ell(ctx, 3.5 * s, 0, 1.8 * s, 2.6 * s); fillStroke(ctx, '#d9434f', OUT, 1 * s); break;
      case 5:
        for (const sg of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(3.5 * s, 0); ctx.quadraticCurveTo(0, sg * 6 * s, -4 * s, sg * 10 * s); ctx.quadraticCurveTo(1 * s, sg * 7 * s, 2 * s, sg * 6 * s);
          ctx.quadraticCurveTo(2 * s, sg * 3 * s, 3.5 * s, 0); fillStroke(ctx, '#fffaf0', '#c99a2a', 1 * s);
        }
        ell(ctx, 3.5 * s, 0, 2 * s, 3 * s); fillStroke(ctx, C.tsuba, OUT, 1.1 * s); break;
      case 6:
        ell(ctx, 3.5 * s, 0, 2.2 * s, 5 * s); fillStroke(ctx, C.tsuba, OUT, 1.2 * s);
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2.5 * s, sg * 4 * s); ctx.lineTo(5 * s, sg * 9 * s); ctx.lineTo(4.6 * s, sg * 3.5 * s); ctx.closePath(); fillStroke(ctx, '#2b1a40', OUT, 1 * s); }
        break;
    }
  }

  /* ---------- иконки предметов ---------- */
  function itemIcon(slot, g, size = 96) {
    const key = 'it' + slot + g + '_' + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const G = GEAR[g], t = 1.2;
    switch (slot) {
      case 'weapon': drawKatana(ctx, 15, 51, -.86, g, 0, t, .74); break;
      case 'helmet':
        ctx.save(); ctx.translate(29, 104); ctx.scale(.72, .72);
        ctx.fillStyle = 'rgba(20,14,44,.55)'; ell(ctx, 4, -84, 21, 19); ctx.fill();
        helmet(ctx, t, g, true); ctx.restore(); break;
      case 'upper':
        ctx.save(); ctx.translate(32, 108); ctx.scale(1.55, 1.55);
        if (g >= 4) { const C = { 4: '#b32a3a', 5: '#fffaf0', 6: '#1e1030' }[g]; ctx.beginPath(); ctx.moveTo(-10, -57); ctx.lineTo(-17, -32); ctx.lineTo(14, -32); ctx.lineTo(11, -57); ctx.closePath(); fillStroke(ctx, C, OUT, 1.6); }
        torso(ctx, g, G.up, t, true); pauldron(ctx, g, G.up, t);
        ctx.save(); ctx.scale(-1, 1); pauldron(ctx, g, G.up, t); ctx.restore();
        ctx.restore(); break;
      case 'lower':
        ctx.save(); ctx.translate(32, 66); ctx.scale(1.3, 1.3);
        boyLeg(ctx, -5, -30, .08, G.lo, g, '#00000000', -2, false, t);
        boyLeg(ctx, 5, -30, -.08, G.lo, g, '#00000000', -2, false, t);
        boyHip(ctx, G.lo, g, t); ctx.restore(); break;
      case 'gloves': {
        const gc = g >= 1 ? G.glove : '#f2e8d8';
        ctx.beginPath(); ctx.moveTo(20, 50); ctx.lineTo(20, 34); ctx.quadraticCurveTo(14, 28, 14, 20); ctx.lineTo(18, 18); ctx.lineTo(22, 26);
        ctx.lineTo(22, 10); ctx.lineTo(27, 10); ctx.lineTo(28, 24); ctx.lineTo(30, 8); ctx.lineTo(35, 8); ctx.lineTo(35, 24); ctx.lineTo(38, 10); ctx.lineTo(43, 11); ctx.lineTo(42, 26);
        ctx.lineTo(45, 16); ctx.lineTo(50, 18); ctx.lineTo(46, 36); ctx.lineTo(46, 50); ctx.closePath();
        fillStroke(ctx, gc, OUT, 2.2);
        const cuff = [ '#efe6d6', '#5a3f26', '#adc3dc', '#6a4fb5', '#a92d3b', '#fff6e0', '#26163a'][g];
        if (g === 4) { ctx.beginPath(); ctx.moveTo(17, 42); ctx.lineTo(21, 34); ctx.lineTo(25, 41); ctx.lineTo(30, 32); ctx.lineTo(35, 41); ctx.lineTo(41, 34); ctx.lineTo(45, 42); ctx.closePath(); fillStroke(ctx, '#ffd25c', OUT, 1.6); }
        if (g === 6) { for (const sx of [21, 31, 41]) { ctx.beginPath(); ctx.moveTo(sx - 3, 42); ctx.lineTo(sx, 32); ctx.lineTo(sx + 3, 42); ctx.closePath(); fillStroke(ctx, '#3a2452', OUT, 1.4); } }
        rr(ctx, 16, 41, 34, 16, 3); fillStroke(ctx, cuff, OUT, 2);
        ctx.lineWidth = 1.6;
        if (g === 0) { ctx.strokeStyle = '#c9bca4'; ctx.beginPath(); for (const x of [22, 30, 38]) { ctx.moveTo(x, 43); ctx.lineTo(x + 6, 55); } ctx.stroke(); }
        if (g === 1) { ctx.strokeStyle = '#f2e2b8'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(19, 44); ctx.lineTo(47, 44); ctx.moveTo(19, 54); ctx.lineTo(47, 54); ctx.stroke(); ctx.setLineDash([]); }
        if (g === 2) { ctx.strokeStyle = '#7f97b8'; ctx.beginPath(); ctx.moveTo(16, 49); ctx.lineTo(50, 49); ctx.stroke(); ctx.fillStyle = '#eef4fb'; for (const x of [20, 46]) { ell(ctx, x, 45, 1.4, 1.4); ctx.fill(); ell(ctx, x, 53, 1.4, 1.4); ctx.fill(); } }
        if (g === 3) { ctx.strokeStyle = '#e8ddff'; ctx.strokeRect(18, 43, 30, 12); ctx.beginPath(); ctx.arc(33, 49, 3.6, .7, TAU - .7); ctx.stroke(); }
        if (g === 4) { ctx.strokeStyle = '#ffd25c'; ctx.beginPath(); ctx.moveTo(16, 49); ctx.lineTo(50, 49); ctx.stroke(); }
        if (g === 5) { ctx.fillStyle = '#ffd760'; ctx.fillRect(16, 43, 34, 3); ctx.fillRect(16, 52, 34, 3); ctx.fillStyle = '#7fe3ff'; ell(ctx, 33, 49, 3, 3); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); }
        if (g === 6) { ctx.save(); ctx.strokeStyle = '#ff62d4'; ctx.shadowColor = '#ff62d4'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.moveTo(19, 49); ctx.lineTo(47, 49); ctx.stroke(); ctx.restore(); }
        break;
      }
      case 'boots':
        ctx.save(); ctx.translate(26, 50); ctx.scale(2.6, 2.6);
        ctx.strokeStyle = OUT; ctx.lineWidth = 8.6; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -8); ctx.stroke();
        ctx.strokeStyle = g === 0 ? '#f8f4ec' : dark(G.boot, .1); ctx.lineWidth = 6.2; ctx.stroke();
        boot(ctx, 0, 0, 0, G.boot, g, false, t); ctx.restore(); break;
      case 'neck':
        ctx.strokeStyle = OUT; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.arc(32, 14, 20, .25, Math.PI - .25); ctx.stroke();
        ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e8e2d6'; ctx.lineWidth = 2.4; ctx.stroke();
        if (g >= 3) { ctx.fillStyle = JEWEL[g]; for (const a of [.7, 1.2, 1.94, 2.44]) { ell(ctx, 32 + Math.cos(a) * 20, 14 + Math.sin(a) * 20, 2, 2); ctx.fill(); } }
        gem(ctx, 32, 44, 9, JEWEL[g]); break;
      case 'ear':
        ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(32, 16, 8, Math.PI, 0); ctx.lineTo(40, 26); ctx.stroke();
        ctx.strokeStyle = g >= 4 ? '#ffd760' : '#e3ddd0'; ctx.lineWidth = 2; ctx.stroke();
        gem(ctx, 32, 40, 8, JEWEL[g]);
        if (g >= 5) { ctx.fillStyle = '#ffffff'; ell(ctx, 42, 34, 1.4, 1.4); ctx.fill(); } break;
      case 'ring':
        ctx.strokeStyle = OUT; ctx.lineWidth = 8.5; ell(ctx, 32, 38, 15, 13); ctx.stroke();
        ctx.strokeStyle = g >= 4 ? '#ffd760' : g >= 2 ? '#e8eef4' : '#d9a066'; ctx.lineWidth = 5; ctx.stroke();
        if (g >= 5) { ctx.strokeStyle = hexA(JEWEL[g], .7); ctx.lineWidth = 1.2; ell(ctx, 32, 38, 15, 13); ctx.stroke(); }
        gem(ctx, 32, 22, 8, JEWEL[g]); break;
    }
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  // портрет для карточек выбора и иконки вкладки
  function heroIcon(body, hair, size = 64) {
    const key = 'hero' + body + hair + size;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 64, 64); ctx.clip();
    drawHero(ctx, 29, 94, .72, { body, hair, weapon: null, helmet: -1, upper: -1, lower: -1, gloves: -1, boots: -1, neck: -1, ear: -1, aura: -1 }, { t: 1, run: 0, phase: 0, swing: -1, hurt: 0, dead: false, cast: 0 });
    ctx.restore();
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  Object.assign(ART, { drawHero, drawKatana, itemIcon, heroIcon, HAIRS, GEAR, JEWEL });
})();

/* ===== Графика питомцев и новых иконок ===== */
(() => {
  const A = ART;
  const { ell, rr, mix, dark, light, hexA, fillStroke, OUT, TAU, iconCanvas, iconCache, gem } = A;
  const RAR_COL = ['#c9c2d8', '#5cbcff', '#bd8aff', '#ffd760', '#ff5fd2'];

  function petEyes(ctx, x1, x2, y, s, c, blink) {
    for (const ex of [x1, x2]) {
      if (blink) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 2.4 * s, y); ctx.quadraticCurveTo(ex, y + 1.8 * s, ex + 2.4 * s, y); ctx.stroke(); continue; }
      ctx.fillStyle = OUT; ell(ctx, ex, y, 2.6 * s, 3.4 * s); ctx.fill();
      ctx.fillStyle = c; ell(ctx, ex, y + 1 * s, 1.8 * s, 1.6 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, ex - .8 * s, y - 1.3 * s, 1 * s, 1.1 * s); ctx.fill();
    }
  }
  function cheeks(ctx, x1, x2, y) { ctx.fillStyle = 'rgba(255,110,150,.45)'; ell(ctx, x1, y, 2.6, 1.4); ctx.fill(); ell(ctx, x2, y, 2.6, 1.4); ctx.fill(); }

  const SP = {
    sprite(ctx, p, t, bl) {
      const P = p.pal, fl = Math.sin(t * 16) * .5;
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 11, -4); ctx.rotate(s * (.5 + fl * .4)); ell(ctx, s * 4, 0, 6, 3.4); ctx.fillStyle = hexA('#ffffff', .7); ctx.fill(); ctx.strokeStyle = hexA(P.e, .6); ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      ell(ctx, 0, 0, 12.5, 11.5); fillStroke(ctx, P.a, OUT, 2);
      ctx.fillStyle = hexA('#ffffff', .65); ell(ctx, -4.5, -5, 4, 2.6, -.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(2, -19, 9, -19); ctx.quadraticCurveTo(7, -12, 0, -11); fillStroke(ctx, P.b, OUT, 1.4);
      petEyes(ctx, -4, 4.5, 0, 1, P.e, bl); cheeks(ctx, -8, 8.5, 4);
    },
    bunny(ctx, p, t, bl) {
      const P = p.pal, ear = Math.sin(t * 2.4) * .08;
      for (const [s, r] of [[-1, -.2], [1, .25]]) {
        ctx.save(); ctx.translate(s * 5, -9); ctx.rotate(r + ear * s);
        ell(ctx, 0, -9, 4.2, 10); fillStroke(ctx, P.a, OUT, 1.8);
        ell(ctx, 0, -9, 2, 7); ctx.fillStyle = P.b; ctx.fill(); ctx.restore();
      }
      ell(ctx, -12, 5, 4, 4); fillStroke(ctx, '#ffffff', OUT, 1.4);
      ell(ctx, 0, 1, 13, 11.5); fillStroke(ctx, P.a, OUT, 2);
      petEyes(ctx, -4, 5, 0, 1, P.e, bl); cheeks(ctx, -8, 9, 4.5);
      ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(2, 4); ctx.lineTo(1, 5.5); ctx.closePath(); ctx.fill();
      if (p.r >= 1) { ctx.fillStyle = P.b; ell(ctx, 7, -10, 2.4, 2.4); ctx.fill(); }
    },
    cat(ctx, p, t, bl) {
      const P = p.pal, tw = Math.sin(t * 3) * 3;
      ctx.strokeStyle = OUT; ctx.lineWidth = 5.6; ctx.beginPath(); ctx.moveTo(-9, 6); ctx.quadraticCurveTo(-20, 4, -17 + tw * .3, -9 + tw); ctx.stroke();
      ctx.strokeStyle = P.a; ctx.lineWidth = 3.4; ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 11, -5); ctx.lineTo(s * 12, -17); ctx.lineTo(s * 3, -10); ctx.closePath(); fillStroke(ctx, P.a, OUT, 1.8);
        ctx.beginPath(); ctx.moveTo(s * 10, -7); ctx.lineTo(s * 10.6, -13.6); ctx.lineTo(s * 5, -10); ctx.closePath(); ctx.fillStyle = '#ffb3c8'; ctx.fill();
      }
      ell(ctx, 0, 1, 13.5, 11.5); fillStroke(ctx, P.a, OUT, 2);
      ell(ctx, 0, 6, 7, 4.6); ctx.fillStyle = P.b; ctx.fill();
      if (p.id === 'tsuki') { ctx.save(); ctx.translate(0, -6); ctx.beginPath(); ctx.arc(0, 0, 3, .7, TAU - .7); ctx.arc(1.4, 0, 2.3, TAU - 1, 1, true); ctx.closePath(); ctx.fillStyle = '#ffd760'; ctx.fill(); ctx.restore(); }
      else { ctx.strokeStyle = dark(P.a, .3); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(-1, -6); ctx.moveTo(2, -10); ctx.lineTo(2, -6); ctx.stroke(); }
      // кошачьи глаза-щёлки
      for (const ex of [-4.5, 5]) {
        if (bl) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 2.4, 0); ctx.quadraticCurveTo(ex, -1.6, ex + 2.4, 0); ctx.stroke(); continue; }
        ell(ctx, ex, 0, 2.8, 3.2); fillStroke(ctx, P.e, OUT, 1.2);
        ctx.fillStyle = OUT; ell(ctx, ex, 0, .8, 2.6); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - 1, -1.2, .8, .8); ctx.fill();
      }
      ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.beginPath();
      ctx.moveTo(-8, 4); ctx.lineTo(-15, 3); ctx.moveTo(-8, 5.5); ctx.lineTo(-15, 6.5); ctx.moveTo(9, 4); ctx.lineTo(16, 3); ctx.moveTo(9, 5.5); ctx.lineTo(16, 6.5); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, 4.5); ctx.quadraticCurveTo(0, 6, 1, 4.5); ctx.quadraticCurveTo(2, 6, 3, 4.5); ctx.stroke();
    },
    owl(ctx, p, t, bl) {
      const P = p.pal, fl = Math.sin(t * 10) * .25, phoenix = p.r >= 3;
      if (phoenix) {
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-6, 10); ctx.rotate(2.2 + i * .35 + Math.sin(t * 3 + i) * .08); ell(ctx, 0, -12, 3, 11); fillStroke(ctx, i % 2 ? P.b : P.a, OUT, 1.3); ctx.restore(); }
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-2 + i * 4, -11); ctx.rotate(-.4 + i * .4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -6, 0, -11 - Math.sin(t * 8 + i) * 1.5); ctx.quadraticCurveTo(-3, -6, 0, 0); fillStroke(ctx, i === 1 ? P.b : P.a, OUT, 1.2); ctx.restore(); }
      }
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 11, 3); ctx.rotate(s * (.2 + fl)); ell(ctx, 0, 0, 4, 8); fillStroke(ctx, dark(P.a, .15), OUT, 1.6); ctx.restore(); }
      ell(ctx, 0, 2, 12, 13.5); fillStroke(ctx, P.a, OUT, 2);
      ell(ctx, 0, 7, 7.5, 7.5); ctx.fillStyle = P.b; ctx.fill();
      if (!phoenix) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 9, -7); ctx.lineTo(s * 10, -16); ctx.lineTo(s * 4, -10); ctx.closePath(); fillStroke(ctx, P.a, OUT, 1.5); }
      for (const ex of [-4.5, 4.5]) { ell(ctx, ex, -1, 5, 5); fillStroke(ctx, '#ffffff', OUT, 1.4); }
      petEyes(ctx, -4.5, 4.5, -1, 1, P.e, bl);
      ctx.beginPath(); ctx.moveTo(-1.6, 3); ctx.lineTo(1.6, 3); ctx.lineTo(0, 6); ctx.closePath(); fillStroke(ctx, '#ffb43a', OUT, 1);
    },
    fox(ctx, p, t, bl) {
      const P = p.pal, n = [1, 1, 2, 5, 9][p.r];
      for (let i = 0; i < n; i++) {
        const a = n === 1 ? -2.4 : -2.9 + i * (1.5 / Math.max(1, n - 1)) + Math.sin(t * 2.4 + i) * .06;
        ctx.save(); ctx.translate(-6, 6); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(7, -8, 2, -20); ctx.quadraticCurveTo(-5, -10, -3, 0); ctx.closePath();
        fillStroke(ctx, P.a, OUT, 1.4);
        ctx.beginPath(); ctx.moveTo(2, -20); ctx.quadraticCurveTo(4.5, -15, 3.6, -12); ctx.quadraticCurveTo(0, -14, -1.6, -13); ctx.closePath(); ctx.fillStyle = P.b; ctx.fill();
        ctx.restore();
      }
      ell(ctx, 1, 8, 8, 6); fillStroke(ctx, P.a, OUT, 1.8);
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 10, -8); ctx.lineTo(s * 11, -22); ctx.lineTo(s * 2, -12); ctx.closePath(); fillStroke(ctx, P.a, OUT, 1.8);
        ctx.beginPath(); ctx.moveTo(s * 9, -10); ctx.lineTo(s * 9.6, -18); ctx.lineTo(s * 4.4, -12); ctx.closePath(); ctx.fillStyle = P.b; ctx.fill();
      }
      ell(ctx, 0, -2, 12.5, 10.5); fillStroke(ctx, P.a, OUT, 2);
      ctx.beginPath(); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(0, 10, 9, 2); ctx.quadraticCurveTo(0, 5, -9, 2); ctx.fillStyle = light(P.b, .5); ctx.fill();
      if (p.r >= 3) { ctx.save(); ctx.strokeStyle = P.e; ctx.lineWidth = 1.4; if (p.r === 4) { ctx.shadowColor = P.e; ctx.shadowBlur = 6; } ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(0, -8); ctx.lineTo(1, -12); ctx.moveTo(-8, -3); ctx.lineTo(-11, -1); ctx.moveTo(8, -3); ctx.lineTo(11, -1); ctx.stroke(); ctx.restore(); }
      for (const ex of [-4.5, 4.5]) {
        if (bl || p.r === 3) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 2.6, -2); ctx.quadraticCurveTo(ex, -4.4, ex + 2.6, -2); ctx.stroke(); }
        else { ctx.fillStyle = OUT; ell(ctx, ex, -2, 2.4, 3); ctx.fill(); ctx.fillStyle = p.r === 4 ? '#ff62d4' : '#ffd760'; ell(ctx, ex, -1.4, 1.5, 1.6); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - .8, -3.2, .8, .9); ctx.fill(); }
      }
      ctx.fillStyle = OUT; ell(ctx, 0, 2.2, 1.4, 1); ctx.fill();
    },
    dragon(ctx, p, t, bl) {
      const P = p.pal, fl = Math.sin(t * 8) * .3;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 7, -6); ctx.rotate(s * (-.3 + fl));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 14, -10); ctx.lineTo(s * 12, -2); ctx.lineTo(s * 16, 2); ctx.lineTo(s * 9, 4); ctx.closePath();
        fillStroke(ctx, hexA(P.b, .9), OUT, 1.4); ctx.restore();
      }
      ctx.strokeStyle = OUT; ctx.lineWidth = 6.4; ctx.beginPath(); ctx.moveTo(-8, 8); ctx.quadraticCurveTo(-18, 12, -20, 2 + Math.sin(t * 3) * 2); ctx.stroke();
      ctx.strokeStyle = P.a; ctx.lineWidth = 4.2; ctx.stroke();
      ctx.save(); ctx.translate(-20, 2 + Math.sin(t * 3) * 2); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-4, 0); ctx.lineTo(0, 4); ctx.lineTo(2, 0); ctx.closePath(); fillStroke(ctx, P.b, OUT, 1.1); ctx.restore();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -10); ctx.quadraticCurveTo(s * 9, -16, s * 7, -21); ctx.quadraticCurveTo(s * 6, -15, s * 2, -11); ctx.closePath(); fillStroke(ctx, p.r === 4 ? '#fff8de' : light(P.b, .2), OUT, 1.3); }
      ell(ctx, 0, 1, 12.5, 12); fillStroke(ctx, P.a, OUT, 2);
      ell(ctx, 1, 6, 7, 5.6); ctx.fillStyle = P.b; ctx.fill();
      ctx.strokeStyle = dark(P.b, .15); ctx.lineWidth = .8; ctx.beginPath(); for (const y of [3.5, 6.5]) { ctx.moveTo(-4, y); ctx.lineTo(6, y); } ctx.stroke();
      if (p.r === 4) { ctx.strokeStyle = '#d9434f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8, 2); ctx.quadraticCurveTo(16, 4 + Math.sin(t * 4) * 2, 20, -1); ctx.moveTo(8, 3.5); ctx.quadraticCurveTo(15, 9, 19, 7 + Math.sin(t * 4 + 1) * 2); ctx.stroke(); }
      petEyes(ctx, -4, 5, -2, 1, P.e, bl); cheeks(ctx, -8, 9, 3);
    },
  };

  // pet: объект питомца из баланса {id, sp, r, pal}
  function drawPet(ctx, x, y, k, pet, t, opt = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const c = RAR_COL[pet.r];
    if (pet.r >= 1 && !opt.flat) {
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 22 + pet.r * 2);
      g.addColorStop(0, hexA(c, .0)); g.addColorStop(.6, hexA(c, .16 + .05 * pet.r)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ell(ctx, 0, 0, 22 + pet.r * 2, 22 + pet.r * 2); ctx.fill();
    }
    if (pet.r === 4 && !opt.flat) {
      ctx.save(); ctx.rotate(t * .8); ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = `hsla(${i * 60 + t * 90},90%,70%,.7)`; ctx.beginPath(); ctx.arc(0, 0, 20, i * TAU / 6, i * TAU / 6 + .6); ctx.stroke(); }
      ctx.restore();
    }
    if (opt.attack > 0) ctx.scale(1 + opt.attack * .15, 1 - opt.attack * .1);
    SP[pet.sp](ctx, pet, t, (t + pet.r * .7) % 4.1 < .12);
    if (pet.r >= 3 && !opt.flat) {
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + i * TAU / 3, px = Math.cos(a) * 18, py = Math.sin(a) * 8 - 4, s = 1.2 + Math.sin(t * 6 + i) * .6;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(px - .5, py - s * 2, 1, s * 4); ctx.fillRect(px - s * 2, py - .5, s * 4, 1);
      }
    }
    if (pet.r === 4) {
      ctx.save(); ctx.translate(2, -16);
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-7, -6); ctx.lineTo(-3, -3); ctx.lineTo(0, -8); ctx.lineTo(3, -3); ctx.lineTo(7, -6); ctx.lineTo(6, 0); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 1.2); ctx.restore();
    }
    ctx.restore();
  }

  function petIcon(pet, size = 96, stars = 0, locked = false) {
    const key = 'pet' + pet.id + size + '_' + stars + locked;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = iconCanvas(size), ctx = c.getContext('2d');
    ctx.scale(size / 64, size / 64);
    const col = RAR_COL[pet.r];
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, mix(col, '#2a2350', .55)); g.addColorStop(1, '#1a1534');
    rr(ctx, 1, 1, 62, 62, 10); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    if (locked) ctx.globalAlpha = .9;
    drawPet(ctx, 32, 32, 1.25, pet, 1.3, { flat: true });
    if (locked) {
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(20,14,40,.82)'; ctx.fillRect(0, 0, 64, 64); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#a99fd4'; ctx.font = '900 22px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 32, 33);
    }
    if (stars > 0) {
      for (let i = 0; i < stars; i++) {
        const sx = 32 + (i - (stars - 1) / 2) * 9, sy = 56;
        ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 1.9 : 4.2; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath();
        fillStroke(ctx, '#ffd760', OUT, 1);
      }
    }
    const url = c.toDataURL(); iconCache.set(key, url); return url;
  }

  /* ---------- дополнительные иконки интерфейса ---------- */
  Object.assign(A.MISC, {
    gem(ctx) {
      ctx.beginPath(); ctx.moveTo(32, 56); ctx.lineTo(8, 26); ctx.lineTo(18, 12); ctx.lineTo(46, 12); ctx.lineTo(56, 26); ctx.closePath();
      const g = ctx.createLinearGradient(8, 12, 56, 56); g.addColorStop(0, '#ffc2e6'); g.addColorStop(.5, '#ff6fc0'); g.addColorStop(1, '#9a5cff');
      fillStroke(ctx, g, OUT, 2.6);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(56, 26); ctx.moveTo(18, 12); ctx.lineTo(26, 26); ctx.lineTo(32, 56); ctx.moveTo(46, 12); ctx.lineTo(38, 26); ctx.lineTo(32, 56); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(20, 16); ctx.lineTo(25, 16); ctx.lineTo(22, 22); ctx.closePath(); ctx.fill();
    },
    paw(ctx) {
      ell(ctx, 32, 40, 13, 11); fillStroke(ctx, '#ffb3d6', OUT, 2.4);
      for (const [x, y] of [[16, 24], [26, 15], [38, 15], [48, 24]]) { ell(ctx, x, y, 5.5, 6.5); fillStroke(ctx, '#ffb3d6', OUT, 2.2); }
    },
    arena(ctx) {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(32, 34); ctx.rotate(s * .78);
        rr(ctx, -3, -26, 6, 34, 2); fillStroke(ctx, '#dfe6ee', OUT, 2);
        rr(ctx, -8, 6, 16, 4, 2); fillStroke(ctx, '#ffd760', OUT, 2);
        rr(ctx, -2.5, 10, 5, 10, 2); fillStroke(ctx, '#7a4a8a', OUT, 2);
        ctx.restore();
      }
    },
    quests(ctx) {
      rr(ctx, 14, 8, 36, 48, 4); fillStroke(ctx, '#f6ecd2', OUT, 2.6);
      ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2;
      for (const y of [22, 32, 42]) { ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(42, y); ctx.stroke(); }
      ctx.strokeStyle = '#2f9a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 22); ctx.lineTo(21, 25); ctx.lineTo(25, 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, 32); ctx.lineTo(21, 35); ctx.lineTo(25, 28); ctx.stroke();
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(21.5, 42, 3, 0, TAU); ctx.stroke();
    },
    gift(ctx) {
      rr(ctx, 12, 28, 40, 28, 3); fillStroke(ctx, '#ff8fc1', OUT, 2.6);
      rr(ctx, 9, 20, 46, 10, 3); fillStroke(ctx, '#ffb3d6', OUT, 2.6);
      ctx.fillStyle = '#ffd760'; ctx.fillRect(28, 20, 8, 36); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(28, 20, 8, 36);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(32, 20); ctx.quadraticCurveTo(32 + s * 16, 2, 32 + s * 4, 18); fillStroke(ctx, '#ffd760', OUT, 2); }
    },
    settings(ctx) {
      ctx.save(); ctx.translate(32, 32);
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 18 : 23; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); fillStroke(ctx, '#c9c2d8', OUT, 2.4);
      ell(ctx, 0, 0, 7, 7); fillStroke(ctx, '#2a2350', OUT, 2.2);
      ctx.restore();
    },
    ticket(ctx) {
      ctx.beginPath(); ctx.moveTo(8, 18); ctx.lineTo(56, 18); ctx.lineTo(56, 28); ctx.arc(56, 32, 4, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(56, 46); ctx.lineTo(8, 46); ctx.lineTo(8, 36); ctx.arc(8, 32, 4, Math.PI / 2, -Math.PI / 2, true); ctx.closePath();
      fillStroke(ctx, '#ffcf5a', OUT, 2.4);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#b07a1e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(22, 20); ctx.lineTo(22, 44); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(40, 32); ctx.rotate(.78); rr(ctx, -2, -10, 4, 18, 1.5); fillStroke(ctx, '#dfe6ee', OUT, 1.6); ctx.restore();
    },
    pass(ctx) {
      ctx.save(); ctx.translate(32, 30);
      for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ell(ctx, 0, -12, 8, 12); fillStroke(ctx, '#ffc2dc', OUT, 2); }
      ell(ctx, 0, 0, 7, 7); fillStroke(ctx, '#ffd760', OUT, 2);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(22, 46); ctx.lineTo(18, 60); ctx.lineTo(26, 56); ctx.lineTo(30, 62); ctx.lineTo(32, 48); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 1.8);
      ctx.beginPath(); ctx.moveTo(42, 46); ctx.lineTo(46, 60); ctx.lineTo(38, 56); ctx.lineTo(34, 62); ctx.lineTo(32, 48); ctx.closePath(); fillStroke(ctx, '#e0485c', OUT, 1.8);
    },
    moon(ctx) {
      rr(ctx, 8, 14, 48, 36, 5); fillStroke(ctx, '#2f2a6a', OUT, 2.4);
      ctx.save(); ctx.translate(30, 32); ctx.beginPath(); ctx.arc(0, 0, 11, .7, TAU - .7); ctx.arc(5, 0, 9, TAU - 1, 1, true); ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 1.8); ctx.restore();
      ctx.fillStyle = '#fff'; for (const [x, y] of [[44, 22], [48, 40], [16, 42]]) { ell(ctx, x, y, 1.4, 1.4); ctx.fill(); }
    },
    noads(ctx) {
      rr(ctx, 10, 16, 44, 32, 5); fillStroke(ctx, '#dfe6ee', OUT, 2.4);
      ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(28, 24); ctx.lineTo(40, 32); ctx.lineTo(28, 40); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0485c'; ctx.lineWidth = 5; ell(ctx, 32, 32, 22, 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, 48); ctx.lineTo(48, 16); ctx.stroke();
    },
    boost(ctx) {
      ell(ctx, 26, 34, 18, 18); fillStroke(ctx, '#ffc93d', OUT, 2.6);
      rr(ctx, 20, 28, 12, 12, 2); fillStroke(ctx, '#d99a1e', OUT, 2);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.font = '900 18px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText('×2', 46, 16); ctx.fillText('×2', 46, 16);
    },
    chest(ctx) {
      rr(ctx, 10, 28, 44, 26, 3); fillStroke(ctx, '#b07a48', OUT, 2.6);
      ctx.beginPath(); ctx.moveTo(10, 30); ctx.quadraticCurveTo(10, 12, 32, 12); ctx.quadraticCurveTo(54, 12, 54, 30); ctx.closePath(); fillStroke(ctx, '#c98a52', OUT, 2.6);
      ctx.fillStyle = '#ffd760'; ctx.fillRect(10, 28, 44, 5); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(10, 28, 44, 5);
      rr(ctx, 27, 30, 10, 12, 2); fillStroke(ctx, '#ffd760', OUT, 2);
    },
    trophy(ctx) {
      ctx.beginPath(); ctx.moveTo(18, 10); ctx.lineTo(46, 10); ctx.quadraticCurveTo(46, 36, 32, 38); ctx.quadraticCurveTo(18, 36, 18, 10); ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 2.6);
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(16, 18, 6, 1.5, 4.7); ctx.arc(48, 18, 6, -1.6, 1.6); ctx.stroke();
      rr(ctx, 28, 38, 8, 10, 1); fillStroke(ctx, '#d99a1e', OUT, 2); rr(ctx, 18, 48, 28, 8, 2); fillStroke(ctx, '#7a4a8a', OUT, 2);
    },
    login(ctx) {
      rr(ctx, 10, 14, 44, 42, 5); fillStroke(ctx, '#fff6ee', OUT, 2.6);
      ctx.fillStyle = '#e0485c'; ctx.fillRect(11, 15, 42, 11);
      ctx.fillStyle = OUT; for (const x of [22, 42]) rr(ctx, x - 2, 9, 4, 10, 2), ctx.fill();
      ctx.fillStyle = '#ff8fc1'; ctx.font = '900 18px "Russo One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('7', 32, 42);
    },
    summon(ctx) {
      const g = ctx.createRadialGradient(28, 26, 2, 32, 32, 24); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#ffb3d6'); g.addColorStop(1, '#9a5cff');
      ell(ctx, 32, 32, 22, 22); fillStroke(ctx, g, OUT, 2.6);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(32, 32, 15, -2.4, -1.2); ctx.stroke();
      ctx.save(); ctx.translate(32, 33); ctx.fillStyle = '#fff';
      ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 3 : 8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
    },
    starter(ctx) {
      A.MISC.chest(ctx);
      ctx.save(); ctx.translate(38, 4); ctx.scale(.4, .4); A.MISC.gem(ctx); ctx.restore();
    },
    music(ctx) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 46); ctx.lineTo(24, 14); ctx.lineTo(48, 10); ctx.lineTo(48, 40); ctx.stroke();
      ell(ctx, 18, 46, 7, 5.5, -.3); fillStroke(ctx, '#ff8fc1', OUT, 2.2); ell(ctx, 42, 40, 7, 5.5, -.3); fillStroke(ctx, '#ff8fc1', OUT, 2.2);
    },
  });

  Object.assign(ART, { drawPet, petIcon, RAR_COL });
})();

/* ===== Дополнительные иконки интерфейса версии 3 ===== */
(() => {
  const A = ART;
  const { ell, rr, fillStroke, OUT, TAU } = A;

  function petal5(ctx, cx, cy, r, c1, c2) {
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate(i * TAU / 5); ctx.translate(0, -r * .62);
      ell(ctx, 0, 0, r * .42, r * .58); ctx.fillStyle = i % 2 ? c2 : c1; ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    ell(ctx, 0, 0, r * .3, r * .3); fillStroke(ctx, '#ffd760', OUT, 1.8);
    ell(ctx, -r * .1, -r * .12, r * .12, r * .09); ctx.fillStyle = '#fff3c0'; ctx.fill();
  }

  Object.assign(A.MISC, {
    petal(ctx) {
      ctx.save(); ctx.translate(32, 32); petal5(ctx, 0, 0, 26, '#ff8fc1', '#ffb3d6'); ctx.restore();
    },
    petalSmall(ctx) {
      ctx.save(); ctx.translate(32, 32); petal5(ctx, 0, 0, 20, '#ffb3d6', '#ffcbe2'); ctx.restore();
    },
    key(ctx) {
      ctx.save(); ctx.translate(32, 31); ctx.rotate(-.55);
      ell(ctx, 0, -15, 10.5, 10.5); fillStroke(ctx, '#ffd760', OUT, 3);
      ell(ctx, 0, -15, 4.6, 4.6); fillStroke(ctx, '#ff8fc1', OUT, 2);
      ctx.beginPath(); ctx.moveTo(-3.4, -6); ctx.lineTo(3.4, -6); ctx.lineTo(3.4, 20); ctx.lineTo(-3.4, 20); ctx.closePath();
      fillStroke(ctx, '#ffe08f', OUT, 2.4);
      ell(ctx, -5, -17.5, 3.4, 2.2, -.5); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(3.4, 12); ctx.lineTo(12, 12); ctx.lineTo(12, 17); ctx.lineTo(7.5, 17); ctx.lineTo(7.5, 21.5); ctx.lineTo(3.4, 21.5); ctx.closePath();
      fillStroke(ctx, '#ffd760', OUT, 2.2);
      ctx.restore();
    },
    tower(ctx) {
      ctx.save(); ctx.translate(32, 33);
      const roof = (y, w, c) => {
        ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y - 10, w, y); ctx.lineTo(w - 5, y + 7); ctx.lineTo(-w + 5, y + 7); ctx.closePath();
        fillStroke(ctx, c, OUT, 2.2);
      };
      // основание
      ctx.beginPath(); ctx.moveTo(-15, 26); ctx.lineTo(15, 26); ctx.lineTo(11, -2); ctx.lineTo(-11, -2); ctx.closePath();
      fillStroke(ctx, '#4a3d86', OUT, 2.4);
      // окна
      for (const wy of [4, 14]) { rr(ctx, -3.4, wy, 6.8, 7, 2.6); fillStroke(ctx, wy === 4 ? '#ffd760' : '#ff8fc1', OUT, 1.6); }
      roof(2, 17, '#bd8aff'); roof(-10, 13, '#ff8fc1'); roof(-20, 9, '#ffd760');
      // шпиль с лепестком
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(3, -22); ctx.lineTo(-3, -22); ctx.closePath(); fillStroke(ctx, '#ffd760', OUT, 1.6);
      ell(ctx, 0, -33, 3.2, 2.4); ctx.fillStyle = '#ffb3d6'; ctx.fill();
      ctx.restore();
    },
    chat(ctx) {
      ctx.beginPath();
      ctx.moveTo(9, 13); ctx.quadraticCurveTo(9, 6, 17, 6); ctx.lineTo(47, 6);
      ctx.quadraticCurveTo(55, 6, 55, 14); ctx.lineTo(55, 38);
      ctx.quadraticCurveTo(55, 45, 47, 45); ctx.lineTo(27, 45); ctx.lineTo(15, 56);
      ctx.lineTo(17, 45); ctx.quadraticCurveTo(9, 45, 9, 38); ctx.closePath();
      fillStroke(ctx, '#4a3d86', OUT, 2.6);
      for (const x of [22, 32, 42]) { ell(ctx, x, 25.5, 3.4, 3.4); ctx.fillStyle = '#ff8fc1'; ctx.fill(); }
    },
    boss(ctx) {      ctx.save(); ctx.translate(32, 33);
      // рога
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 9, -10); ctx.quadraticCurveTo(s * 25, -26, s * 23, -2); ctx.quadraticCurveTo(s * 18, -9, s * 8, -6); ctx.closePath();
        fillStroke(ctx, '#c9b8ff', OUT, 2.2);
      }
      // череп
      ctx.beginPath(); ctx.moveTo(-14, -10); ctx.quadraticCurveTo(0, -18, 14, -10); ctx.quadraticCurveTo(16, 6, 7, 14); ctx.lineTo(4, 22); ctx.lineTo(-4, 22); ctx.lineTo(-7, 14); ctx.quadraticCurveTo(-16, 6, -14, -10); ctx.closePath();
      fillStroke(ctx, '#3a2452', OUT, 2.4);
      // глаза
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 3, -4); ctx.lineTo(s * 11, -2); ctx.lineTo(s * 9, 3); ctx.lineTo(s * 4, 1); ctx.closePath();
        ctx.fillStyle = '#ff5d73'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      }
      // нос и зубы
      ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(2, 8); ctx.lineTo(-2, 8); ctx.closePath(); ctx.fillStyle = '#24123a'; ctx.fill();
      ctx.strokeStyle = '#c9b8ff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); for (let x = -6; x <= 6; x += 4) { ctx.moveTo(x, 12); ctx.lineTo(x, 17); } ctx.stroke();
      ctx.restore();
    },
  });
})();

/* ===== Звук: процедурная музыка и эффекты на Web Audio ===== */
const AUDIO = (() => {
  let ctx = null, master, comp, musicBus, musicFilter, sfxBus, delay, delayFb, delaySend, noiseBuf;
  const L = {};                                   // слои музыки: drums, bass, pad, lead, arp
  const vol = { music: .55, sfx: .75 };
  const pauses = new Set();
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended' && !pauses.size) ctx.resume().catch(() => { }); return true; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .25;
    master = ctx.createGain(); master.gain.value = .9;
    master.connect(comp); comp.connect(ctx.destination);
    musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 18000; musicFilter.Q.value = .6;
    musicBus = ctx.createGain(); musicBus.connect(musicFilter); musicFilter.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    delay = ctx.createDelay(1.5); delayFb = ctx.createGain(); delayFb.gain.value = .32;
    delaySend = ctx.createGain(); delaySend.gain.value = .28;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3200;
    delaySend.connect(delay); delay.connect(dlp); dlp.connect(delayFb); delayFb.connect(delay); dlp.connect(musicBus);
    for (const k of ['drums', 'bass', 'pad', 'lead', 'arp']) { L[k] = ctx.createGain(); L[k].connect(musicBus); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVol();
    if (pauses.size) ctx.suspend().catch(() => { });
    return true;
  }
  function applyVol() {
    if (!ctx) return;
    musicBus.gain.setTargetAtTime(vol.music * .8, ctx.currentTime, .05);
    sfxBus.gain.setTargetAtTime(vol.sfx, ctx.currentTime, .05);
  }
  function setVolume(kind, v) { vol[kind] = Math.max(0, Math.min(1, v)); applyVol(); }
  function pause(reason) { pauses.add(reason); if (ctx && ctx.state === 'running') ctx.suspend().catch(() => { }); }
  function resume(reason) { pauses.delete(reason); if (ctx && !pauses.size && ctx.state === 'suspended') ctx.resume().catch(() => { }); }
  function muffle(on) { if (ctx) musicFilter.frequency.setTargetAtTime(on ? 1100 : 18000, ctx.currentTime, .25); }

  /* ---------- инструменты ---------- */
  function voice(t, midi, dur, o, out) {
    const f = mtof(midi), g = ctx.createGain();
    const v = o.vol, a = o.a ?? .005, dcy = o.d ?? .12, sus = o.s ?? .6, rel = o.r ?? .08;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setTargetAtTime(v * sus, t + a, dcy / 3);
    g.gain.setTargetAtTime(0, t + dur, rel / 3);
    let node = g;
    if (o.cut) {
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = o.q ?? 1;
      fl.frequency.setValueAtTime(o.cut * (o.env ? 2.2 : 1), t); if (o.env) fl.frequency.setTargetAtTime(o.cut, t, .08);
      fl.connect(g); node = fl;
    }
    const n = o.voices || 1, stop = t + dur + rel * 2 + .05;
    for (let i = 0; i < n; i++) {
      const osc = ctx.createOscillator(); osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(f, t);
      if (n > 1) osc.detune.value = (i - (n - 1) / 2) * (o.spread || 12);
      if (o.vib) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + .25); lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(stop); }
      const og = ctx.createGain(); og.gain.value = 1 / n; osc.connect(og); og.connect(node);
      osc.start(t); osc.stop(stop);
    }
    g.connect(out);
    if (o.send) g.connect(delaySend);
  }
  function bell(t, midi, dur, volume, out, send) {
    const f = mtof(midi), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine'; car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * .05, t + .6);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(volume, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + Math.max(.4, dur * 2));
    car.connect(g); g.connect(out); if (send) g.connect(delaySend);
    const stop = t + Math.max(.4, dur * 2) + .05; car.start(t); mod.start(t); car.stop(stop); mod.stop(stop);
  }
  function noise(t, dur, volume, type, freq, q, out) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q || .7;
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  function kick(t, v = .9) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .32);
    o.connect(g); g.connect(L.drums); o.start(t); o.stop(t + .35);
  }
  const snare = (t, v = .45) => { noise(t, .16, v, 'bandpass', 1900, .8, L.drums); voice(t, 52, .05, { type: 'triangle', vol: v * .6, d: .05, s: 0, r: .04 }, L.drums); };
  const hat = (t, v = .14, open = false) => noise(t, open ? .14 : .035, v, 'highpass', 7500, .7, L.drums);
  const crash = (t, v = .16) => noise(t, 1.2, v, 'highpass', 5000, .5, L.drums);

  /* ---------- темы ---------- */
  const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], hmin: [0, 2, 3, 5, 7, 8, 11] };
  const CH = { M: [0, 4, 7], m: [0, 3, 7] };
  const THEMES = {
    menu:   { bpm: 92,  root: 55, mode: 'maj',  prog: [[5, 'M'], [7, 'M'], [4, 'm'], [9, 'm']], lead: 'bell',   drums: 0, arp: 1, seed: 11 },
    z0:     { bpm: 124, root: 53, mode: 'maj',  prog: [[5, 'M'], [7, 'M'], [4, 'm'], [9, 'm']], lead: 'square', drums: 1, arp: 1, seed: 3 },
    z1:     { bpm: 112, root: 57, mode: 'min',  prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], lead: 'tri',   drums: 1, arp: 1, seed: 7 },
    z2:     { bpm: 118, root: 50, mode: 'hmin', prog: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'M']], lead: 'saw',   drums: 1, arp: 0, seed: 13 },
    z3:     { bpm: 128, root: 52, mode: 'min',  prog: [[0, 'm'], [10, 'M'], [8, 'M'], [10, 'M']], lead: 'bell', drums: 1, arp: 1, seed: 17 },
    z4:     { bpm: 140, root: 48, mode: 'min',  prog: [[0, 'm'], [10, 'M'], [8, 'M'], [7, 'M']], lead: 'saw',   drums: 2, arp: 0, seed: 19 },
    z5:     { bpm: 132, root: 54, mode: 'hmin', prog: [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M']], lead: 'square', drums: 1, arp: 1, seed: 23 },
    z6:     { bpm: 108, root: 57, mode: 'maj',  prog: [[0, 'M'], [5, 'M'], [7, 'M'], [9, 'm']], lead: 'bell',   drums: 1, arp: 1, seed: 41 },
    z7:     { bpm: 116, root: 50, mode: 'hmin', prog: [[0, 'm'], [8, 'M'], [5, 'm'], [7, 'M']], lead: 'tri',    drums: 1, arp: 1, seed: 43 },
    boss:   { bpm: 158, root: 52, mode: 'hmin', prog: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'M']], lead: 'saw',   drums: 2, arp: 0, seed: 29, bass16: true },
    arena:  { bpm: 150, root: 50, mode: 'min',  prog: [[0, 'm'], [10, 'M'], [8, 'M'], [10, 'M']], lead: 'square', drums: 2, arp: 0, seed: 31, bass16: true },
    summon: { bpm: 100, root: 60, mode: 'maj',  prog: [[0, 'M'], [5, 'M'], [9, 'm'], [7, 'M']], lead: 'bell',   drums: 0, arp: 1, seed: 37 },
    hanami: { bpm: 104, root: 57, mode: 'maj',  prog: [[0, 'M'], [5, 'M'], [7, 'M'], [9, 'm']], lead: 'bell',   drums: 1, arp: 1, seed: 47 },
    lantern:{ bpm: 96,  root: 52, mode: 'hmin', prog: [[0, 'm'], [5, 'm'], [7, 'M'], [8, 'M']], lead: 'tri',    drums: 1, arp: 1, seed: 53 },
  };
  const RHYTHMS = [
    [0, 4, 6, 8, 12], [0, 2, 4, 8, 10, 12, 14], [0, 3, 6, 8, 12, 14], [0, 4, 8, 10, 12],
    [0, 2, 4, 6, 8, 12], [0, 6, 8, 12, 14], [0, 3, 4, 8, 11, 12],
  ];
  function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

  // мелодия на 8 тактов: A A' B A'' с опорой на аккорды
  function compose(th) {
    const r = rng(th.seed), sc = SCALES[th.mode], lo = th.root + 12, hi = th.root + 26;
    const degreeNotes = []; for (let o = 0; o < 3; o++) for (const d of sc) degreeNotes.push(th.root + o * 12 + d);
    const inRange = degreeNotes.filter(n => n >= lo && n <= hi);
    const nearest = (target, pool) => pool.reduce((b, n) => Math.abs(n - target) < Math.abs(b - target) ? n : b, pool[0]);
    let prev = nearest(th.root + 19, inRange);
    const makeBar = (bi, rhythm) => {
      const [cr, cq] = th.prog[bi % 4], chordPcs = CH[cq].map(x => (th.root + cr + x) % 12);
      const chordPool = inRange.filter(n => chordPcs.includes(n % 12));
      const notes = [];
      rhythm.forEach((pos, i) => {
        let n;
        if (pos === 0 || pos === 8) n = nearest(prev + (r() < .5 ? -2 : 2), chordPool);
        else { const idx = inRange.indexOf(nearest(prev, inRange)); n = inRange[Math.max(0, Math.min(inRange.length - 1, idx + Math.round((r() - .5) * 4)))]; }
        const next = rhythm[i + 1] ?? 16;
        notes.push({ pos, n, len: Math.max(1, next - pos) });
        prev = n;
      });
      return notes;
    };
    const rA = RHYTHMS[Math.floor(r() * RHYTHMS.length)], rB = RHYTHMS[Math.floor(r() * RHYTHMS.length)];
    const bars = [];
    bars[0] = makeBar(0, rA); bars[1] = makeBar(1, rB); bars[2] = makeBar(2, rA); bars[3] = makeBar(3, [0, 4, 8]);
    bars[4] = bars[0]; bars[5] = makeBar(1, rA); bars[6] = makeBar(2, rB);
    const [cr] = th.prog[3]; const end = nearest(th.root + 12 + cr + 12, inRange);
    bars[7] = [{ pos: 0, n: nearest(end + 2, inRange), len: 4 }, { pos: 4, n: end, len: 12 }];
    return bars;
  }

  let cur = null, pending = null, timer = 0, stopped = true;
  function play(id) {
    if (!init()) return;
    const th = THEMES[id]; if (!th) return;
    if (cur && cur.id === id && !pending) return;
    if (pending && pending.id === id) return;
    const next = { id, th, bars: th.bars || (th.bars = compose(th)), bar: 0, step: 0 };
    if (!cur) { cur = next; cur.time = ctx.currentTime + .08; layerTargets(cur, true); }
    else pending = next;
    if (stopped) { stopped = false; clearInterval(timer); timer = setInterval(tick, 25); }
  }
  function stop() { stopped = true; clearInterval(timer); cur = null; pending = null; }
  function layerTargets(s, now) {
    const t = now ? ctx.currentTime : s.time;
    const set = (k, v) => L[k].gain.setTargetAtTime(v, t, .05);
    set('drums', s.th.drums ? 1 : 0); set('bass', 1); set('pad', 1); set('lead', 1); set('arp', s.th.arp ? 1 : 0);
  }
  function tick() {
    if (!ctx || ctx.state !== 'running' || !cur) return;
    const ahead = ctx.currentTime + .14;
    if (cur.time < ctx.currentTime - .5) cur.time = ctx.currentTime + .05;
    while (cur.time < ahead) {
      const quick = pending && (pending.id === 'boss' || pending.id === 'arena');
      if (pending && (cur.step === 0 || (quick && cur.step % 4 === 0))) {
        pending.time = cur.time; cur = pending; pending = null; layerTargets(cur, false);
        if (cur.th.drums) crash(cur.time, .14);
      }
      step(cur, cur.time);
      cur.time += 60 / cur.th.bpm / 4;
      cur.step++;
      if (cur.step >= 16) { cur.step = 0; cur.bar = (cur.bar + 1) % 8; }
    }
  }
  function step(s, t) {
    const th = s.th, st = s.step, bar = s.bar, [cr, cq] = th.prog[bar % 4];
    const chord = CH[cq].map(x => th.root + cr + x);
    const sixteenth = 60 / th.bpm / 4;
    // ударные
    if (th.drums) {
      const fill = bar === 7 && st >= 12;
      if (th.drums === 2) {
        if (st % 4 === 0) kick(t);
        if (st === 4 || st === 12) snare(t);
        if (fill) snare(t, .3);
        hat(t, st % 2 ? .07 : .12, st % 4 === 2);
      } else {
        if (st === 0 || st === 8 || (st === 10 && bar % 2)) kick(t, .8);
        if (st === 4 || st === 12) snare(t, .38);
        if (fill && st % 2) snare(t, .26);
        if (st % 2 === 0) hat(t, st % 4 === 2 ? .11 : .07, st === 14);
      }
      if (st === 0 && bar === 0) crash(t, .12);
    }
    // бас
    const bRoot = th.root - 12 + cr;
    if (th.bass16) { if (st % 2 === 0 || th.drums === 2) voice(t, bRoot + (st % 8 === 6 ? 12 : 0), sixteenth * .9, { type: 'sawtooth', vol: .2, cut: 700, q: 2, env: true, d: .08, s: .5, r: .04 }, L.bass); }
    else if (th.drums) { if (st % 2 === 0) voice(t, bRoot + (st % 4 === 2 ? 12 : 0), sixteenth * 1.7, { type: 'square', vol: .13, cut: 900, env: true, d: .1, s: .5, r: .05 }, L.bass); }
    else if (st === 0 || st === 8) voice(t, bRoot, sixteenth * 7, { type: 'triangle', vol: .28, a: .02, d: .4, s: .7, r: .2 }, L.bass);
    // аккорды
    if (th.drums) {
      if ([0, 3, 6, 10, 12].includes(st)) for (const n of chord) voice(t, n + 12, sixteenth * (st === 12 ? 3.5 : 2), { type: 'sawtooth', vol: .05, cut: 2400, env: true, voices: 2, spread: 14, d: .1, s: .55, r: .1 }, L.pad);
    } else if (st === 0) for (const n of chord) voice(t, n + 12, sixteenth * 15, { type: 'sawtooth', vol: .045, a: .25, cut: 1500, voices: 2, spread: 16, d: .8, s: .8, r: .6 }, L.pad);
    // арпеджио
    if (th.arp) {
      const seq = [0, 1, 2, 1], n = chord[seq[st % 4]] + 24 + (st >= 8 ? 0 : 0);
      if (th.drums || st % 2 === 0) bell(t, n, sixteenth, th.drums ? .035 : .05, L.arp, true);
    }
    // мелодия
    for (const nt of s.bars[bar]) if (nt.pos === st) {
      const dur = nt.len * sixteenth * .92;
      if (th.lead === 'bell') bell(t, nt.n + 12, dur, .1, L.lead, true);
      else if (th.lead === 'tri') voice(t, nt.n + 12, dur, { type: 'triangle', vol: .22, a: .01, d: .2, s: .7, r: .12, vib: dur > .3, send: true }, L.lead);
      else if (th.lead === 'saw') voice(t, nt.n + 12, dur, { type: 'sawtooth', vol: .1, cut: 3200, q: 1.5, env: true, voices: 2, spread: 10, d: .2, s: .7, r: .1, vib: dur > .3, send: true }, L.lead);
      else voice(t, nt.n + 12, dur, { type: 'square', vol: .08, cut: 3800, d: .15, s: .7, r: .08, vib: dur > .3, send: true }, L.lead);
    }
  }

  /* ---------- звуковые эффекты ---------- */
  let lastHit = 0;
  function sfx(type) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime, o = sfxBus;
    const tone = (f, at, dur, wave, v, f2) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = wave; osc.frequency.setValueAtTime(f, t + at); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
      g.gain.setValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
      osc.connect(g); g.connect(o); osc.start(t + at); osc.stop(t + at + dur + .02);
    };
    const hiss = (at, dur, v, f, type = 'bandpass') => noise(t + at, dur, v, type, f, .8, o);
    switch (type) {
      case 'hit': if (t - lastHit < .06) return; lastHit = t; hiss(0, .09, .12, 2400); tone(180, 0, .08, 'triangle', .05, 90); break;
      case 'crit': hiss(0, .14, .16, 3200); tone(520, 0, .12, 'square', .03, 260); break;
      case 'coin': tone(1320, 0, .07, 'square', .018); tone(1760, .06, .1, 'square', .018); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .2, 'triangle', .06)); break;
      case 'warning': for (let i = 0; i < 3; i++) { tone(880, i * .32, .14, 'square', .05, 660); tone(440, i * .32 + .14, .14, 'square', .04, 330); } break;
      case 'land': tone(90, 0, .45, 'sine', .35, 30); hiss(0, .5, .25, 300, 'lowpass'); break;
      case 'windup': tone(200, 0, .8, 'sawtooth', .04, 900); break;
      case 'slam': tone(70, 0, .4, 'sine', .3, 30); hiss(0, .35, .2, 600, 'lowpass'); break;
      case 'shot': hiss(0, .25, .12, 1200); tone(600, 0, .2, 'sawtooth', .03, 200); break;
      case 'rage': tone(110, 0, .7, 'sawtooth', .07, 55); hiss(0, .6, .12, 500); break;
      case 'victory': [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, i * .09, .3, 'square', .04); tone(f / 2, i * .09, .3, 'triangle', .05); }); break;
      case 'skill': hiss(0, .25, .1, 1200); tone(880, 0, .2, 'sine', .05, 1760); break;
      case 'explode': hiss(0, .5, .35, 180); tone(70, 0, .4, 'sine', .12, 32); break;
      case 'dodge': hiss(0, .18, .15, 900); tone(600, 0, .12, 'sine', .04, 1200); break;
      case 'thunder': hiss(0, .3, .2, 600); break;
      case 'buff': [392, 523, 659].forEach((f, i) => tone(f, i * .06, .25, 'sine', .05)); break;
      case 'charge': tone(220, 0, 1.1, 'sine', .04, 880); break;
      case 'success': [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .07, .3, 'triangle', .07)); break;
      case 'fail': hiss(0, .5, .2, 900); tone(330, 0, .5, 'sawtooth', .05, 80); break;
      case 'buy': tone(988, 0, .06, 'square', .03); tone(1319, .05, .08, 'square', .03); break;
      case 'click': tone(1200, 0, .03, 'square', .015); break;
      case 'pet': tone(1568, 0, .08, 'sine', .04, 2093); break;
      case 'orb': tone(660, 0, .5, 'sine', .05, 1320); hiss(0, .4, .05, 4000, 'highpass'); break;
      case 'reveal': [1047, 1319, 1568].forEach((f, i) => tone(f, i * .05, .25, 'triangle', .05)); break;
      case 'legend': [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => { tone(f, i * .07, .5, 'triangle', .06); tone(f * 1.5, i * .07 + .02, .4, 'sine', .03); }); hiss(0, 1.2, .08, 6000, 'highpass'); break;
    }
  }

  const probe = () => { if (!ctx) return null; const an = ctx.createAnalyser(); an.fftSize = 2048; comp.connect(an); return an; };
  return { probe, init, play, stop, sfx, setVolume, vol, pause, resume, muffle, get current() { return cur && cur.id; }, get ready() { return !!ctx; } };
})();

/* ===== Платформа: Яндекс Игры или локальный тестовый режим ===== */
const PLATFORM = (() => {
  let ysdk = null, payments = null, player = null, mode = 'local';
  const listeners = { pause: [], resume: [] };
  let catalog = {};
  let localUI = null;          // окно тестовой покупки/награды из игры
  let safeStore;               // безопасное хранилище Яндекс Игр (нужно на iOS)

  async function init() {
    if (typeof window.YaGames === 'undefined') return mode;
    try {
      ysdk = await window.YaGames.init();
      mode = 'yandex';
      try { ysdk.on('game_api_pause', () => listeners.pause.forEach(f => f())); ysdk.on('game_api_resume', () => listeners.resume.forEach(f => f())); } catch (e) { }
      try { payments = await ysdk.getPayments(); } catch (e) { payments = null; }
      try { player = await ysdk.getPlayer(); } catch (e) { player = null; }
      if (payments) {
        try { const list = await payments.getCatalog(); for (const p of list) catalog[p.id] = p; } catch (e) { }
      }
    } catch (e) { mode = 'local'; ysdk = null; }
    safeStore = undefined;                 // после init хранилище площадки можно запросить
    return mode;
  }
  const ready = () => { try { ysdk?.features?.LoadingAPI?.ready(); } catch (e) { } };
  const gameplay = on => { try { on ? ysdk?.features?.GameplayAPI?.start() : ysdk?.features?.GameplayAPI?.stop(); } catch (e) { } };
  const lang = () => { try { return ysdk?.environment?.i18n?.lang || 'ru'; } catch (e) { return 'ru'; } };

  // реклама за награду: true, если награда положена
  function rewarded(place) {
    if (mode !== 'yandex') return localUI ? localUI('ad', place) : Promise.resolve(true);
    return new Promise(res => {
      let got = false;
      try {
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => listeners.pause.forEach(f => f('ad')),
            onRewarded: () => { got = true; },
            onClose: () => { listeners.resume.forEach(f => f('ad')); res(got); },
            onError: () => { listeners.resume.forEach(f => f('ad')); res(false); },
          },
        });
      } catch (e) { res(false); }
    });
  }
  function interstitial() {
    if (mode !== 'yandex') return Promise.resolve(false);
    return new Promise(res => {
      try {
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => listeners.pause.forEach(f => f('ad')),
            onClose: shown => { listeners.resume.forEach(f => f('ad')); res(!!shown); },
            onError: () => { listeners.resume.forEach(f => f('ad')); res(false); },
          },
        });
      } catch (e) { res(false); }
    });
  }

  // покупка: {ok, token}
  async function purchase(id) {
    if (mode !== 'yandex') { const ok = localUI ? await localUI('buy', id) : false; return { ok, token: null }; }
    if (!payments) return { ok: false };
    try { const p = await payments.purchase({ id }); return { ok: true, token: p.purchaseToken }; }
    catch (e) { return { ok: false }; }
  }
  async function consume(token) { if (mode === 'yandex' && payments && token) { try { await payments.consumePurchase(token); } catch (e) { } } }
  async function purchases() {
    if (mode !== 'yandex' || !payments) return [];
    try { return await payments.getPurchases(); } catch (e) { return []; }
  }
  // цена из каталога площадки (с её валютой) или в рублях для теста
  function price(id, rub) {
    const p = catalog[id];
    if (p) return { text: p.priceValue, icon: (() => { try { return p.getPriceCurrencyImage('small'); } catch (e) { return null; } })() };
    return { text: rub + ' ₽', icon: null };
  }

  async function loadCloud() {
    if (!player) return null;
    try { const d = await player.getData(['save']); return d && d.save ? d.save : null; } catch (e) { return null; }
  }
  async function saveCloud(str) {
    if (!player) return false;
    try { await player.setData({ save: str }, false); return true; } catch (e) { return false; }
  }

  return {
    init, ready, gameplay, lang, rewarded, interstitial, purchase, consume, purchases, price, loadCloud, saveCloud,
    on: (ev, f) => listeners[ev].push(f),
    setLocalUI: f => { localUI = f; },
    // localStorage-совместимое хранилище площадки; до init() возвращает null
    getStorage() {
      if (safeStore !== undefined) return safeStore;
      try { safeStore = ysdk && typeof ysdk.getStorage === 'function' ? ysdk.getStorage() : null; }
      catch (e) { safeStore = null; }
      return safeStore;
    },
    get mode() { return mode; },
  };
})();

/* ===== Сеть: чат, рейтинг и реальные соперники на своём сервере =====
   Работает, только если страница отдана сервером с /api. На Яндекс Играх
   и локально без бэкенда все методы возвращают null, игра остаётся офлайновой. */
const NET = (() => {
  let online = false, checkedAt = 0, pending = null;

  function url(path) {
    const base = (typeof location !== 'undefined' && location.origin && location.origin !== 'null') ? '' : '';
    return base + path;
  }
  async function req(path, opts = {}, ms = 5000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url(path), {
        cache: 'no-store',
        headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
        method: opts.method || 'GET',
        body: opts.body,
        signal: ctl.signal,
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
    finally { clearTimeout(t); }
  }
  async function probe(force) {
    if (!force && pending) return pending;
    if (!force && Date.now() - checkedAt < 30000) return online;
    checkedAt = Date.now();
    pending = (async () => {
      const r = await req('/api/health', {}, 3000);
      online = !!(r && r.ok);
      pending = null;
      return online;
    })();
    return pending;
  }
  return {
    probe,
    get online() { return online; },
    chatList: since => req('/api/chat' + (since ? `?since=${encodeURIComponent(since)}` : '')),
    chatSend: (pid, name, text) => req('/api/chat', { method: 'POST', body: JSON.stringify({ pid, name, text }) }),
    boardTop: () => req('/api/board'),
    boardPush: p => req('/api/board', { method: 'POST', body: JSON.stringify(p) }),
    arenaList: (pid, rating, power) => req(`/api/arena?pid=${encodeURIComponent(pid)}&rating=${Math.round(rating)}&power=${Math.round(power)}`),
    arenaPush: p => req('/api/arena', { method: 'POST', body: JSON.stringify(p) }),
    worldGet: pid => req('/api/world?pid=' + encodeURIComponent(pid)),
    worldHit: p => req('/api/world', { method: 'POST', body: JSON.stringify(p) }),
    worldClaim: pid => req('/api/world/claim', { method: 'POST', body: JSON.stringify({ pid }) }),
  };
})();

const TUTO_GUIDE='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAEAAElEQVR42ux9d7xdVZX/d+29z7n91eS99EoIJBBCh1BCUxHFHlQsozP2NjrIjDpqjH0cR38z6hTb2EUyKjqiSBED0juBBNJ7z+vvtnP2Xr8/9j7lvndfCqKSTE4+EfPqLWevvfZ3fQtw7Dp2/R+/lixZItP//n8/+38v/urP//UNzJwBQMxMR+tzl8fe/mPX/9Vr6dKlYsWKFbRq1SrDzGrGyZNeN+fsuZ+58Y5bPrxm87olulKmXy6/8XcAxIoVK/jYK3bsOnYdJQs/vfldf/2PLrn8Zc+/fdErzuPpLzqJx7/4eDPnHeeaV//9a+rrNz9xfup7jl3HrmPXkd3vJwv/ht/cMPd173jNt+ctWqDbZnVw/ozucN4Xrwpeue7/mRfc/7FwzpKF/K5l73msn7nzaD0KqGN3xLHr/8LFzEREwHLo/WtXTv3AFz73d5/5xpfetHL1k21oyfJxb1scTrv0LDl+/iwoTyLTXRIbZrXqR594YsG3vvPlKwB8/6rlV0kA+lgBOHYdu46ga/HixYqIQgB4zVuufvel7/irj25ev2lCf30Ys975wvCkN14hWrrbJEkBU61SPaghm2/hKZeewVufvpV37e59BYDvz7tq3lGHAxw71xy7jvazPq1YsSLcPLx30uIXX/CL2269+auPPb1qQutrzgwv+O9rzNkfuFq2TGgjXauQrlRIEEFIAQSaJpw6TwxkND/++MMv/o8ffuOKZVhmRk4McGwKcOw6dj03R3v//u//bphZDKrd7/ryv33pv++75e6zMjM7wwXvfxVOu/Zq0XrcBNL1KlGoiaQAkT3iEwGsDfKtJVSGBszmWx5UMkTLYw88/uNVq1YRAD7WARy7jl3PycM+CIBcvny5Xr1z9YxTLjj5Vz/89v989fG7Hp028/LTw8XfvlYe//YXUzA8QHpwiAQBEAm2x+RWty0CNPnsk0WtPcO9weDi36+850QA5miaCBzrAI5dR9dc/+IVDIA/+e8fffFH/+nzP12zfs3pQ32D4dlL38CnfvkdEiUPulwmKQUgBAhu8RMDBJBd+5AgcN2gZVInBvbs1FvufSpX7h8SD935wI0rVqw4arqAYyDgseuoafmXLVummTn30re+8pPf//cfXLN202Y6/gNXhse/8EzZfvIsDA33QhkioQTYrfl4HbNb+XEnwDBkAMPUfdaJtOG7d2PThvUvYuYiEQ25qQIfKwDHrmPXX3S8ByKCWL58ub7+1u/Pu+BFZ3zz8Sc3nFsBmzM/+SZz/AeulAYh1Ycr9mYXBAIDnKz8aBWTBQAIAAwAFoCpVTFu4WzRcspUvXtvz7TPfftfrgTw46uuukrgKBgJHjsCHLuO6Jb/4otXEADzgY+++zXf/No3r195/1NzS2fOCi694SNiwgtOF2ZomKgWQJAAyDb8xMzReR9kd/to92cwUucCsGH4hTz5JMymG+4VpmLGPfX46u9eddVVfAwEPHYdu/6yLb8BYC563fM/9b1v//jHazZuGzflleeG5//wA6owqZN4YICUAKQUEACEAZPb8EeuXk7/ZWYDwJBtL0zVYOolC0Xh+C7evXPn2Xc/9NBcAHw0gIHHOoBj15F2EQC5atUq/al/u2ZmmBHfeOC2+94xHNbMRf/zYTPvgy+XgphQD0koYbdyZrvsiQAiu+MjfeanZNOPPuKOAkSACBl+Poud96/Tcl/Zr3N551233XVnV1eXWLVqFR/DAI5dx64/J50X0O/7zNsu/dqXvvudXZv2TWmbOzW84MtvFJMuWSiCoSFSQoAFudO9bfdB5HZ9i/ZFRSBCACjG/+OP218WwQWSMHnRXKy5+0Y8+uhjL2DmzxGRwTEQ8Nh17PrztPxEpJlZXPKyiz5x3bdu+PCeTfu8Ga9cFJz7tXcor7uIcGgIUkq3xA2YmdktbW5Y3nYCEDUFjWOAGCRMGg4CdGCobeF0sWuwH2279p/aX90zC8B6ZhZHciE4dgQ4dh0RCr5Vy1fpNWvWtFx+5WU/eujOB98xnJXinH96s1mwbInknADKNRJSkl3Z7PZtdjBXtL9zk+l9hPfRyI+ASBARQBDg0KDY2Yq+tdtM36rt2X3l/sfuue3uR1atWnVEHwOOgYDHruf8eR/LoW+49fp5S/5qyU0PPvDoy4PpLcEZX/5rnvOOFwqjNWRoSEhhd3E2qVVuaX0UzfwNRXwfEFN88m+CACRlgG0HwMyQmSwmLTqJe/r6sG3dxssAYPny5XxsCnDsOnbhTyPkAaDf+/43XnXtBz+y4vEHVp5bnN0dXvyTa9WcV51PQV8fJAkicrcxG47O9Cae87nFn2rpBdsbX3Bq6bvCIKKJYIQeum8mQQiDgMadNItMRuHpx5++hJm7AJgj2Sfg2BHg2PWcFfIA4Gs+854P3PCrm7++4bGNhYkvWxie8/33y/Gzp4CHyiR9SaDIqYORBvt4BNAffZ6YHNeH0pB//G8CoeHTRESwlGHBgPI96n14k+HBcmlgcMv9v/vtXatWrVolj9RjwLEO4Nj1XNv11fLly/W6neu6Xv+xd1x33e9/96UdpQrmfvByfd433i9bp4wDl6sQSgJs4l3fzu2jQT4li59Hnyk43vGpcRqYhgSYACZQNC4gQIcGudYcOo6fZOphiHXbtp2BY1OAY9ex649f+MuWLaNly5ZpAOY39/78gqtf/bpvrN2/dW7LFXPD89/yJtF1/GyBcgWo1Ig8GVP20lTeBONjiDSKH00C012BU/2JmAAUfScj4QRSzDW2HzHgjET7gim04bo70du//0w3mjT/NzAABh27XY9dz/KOLxyjT3/3nu+e+OI3vezf3vWBD9+6emDL3K4XnRKe8Q9vlBNmziTqHybBTCSl2/WNW6w06m985uc06AcIIkhhV361HCAYqoF0Iz6ARgixgRnIAqjVQupadKKgtiI2PLXtzAfW/HQmjmBWoDgsQCY+aEEuXrpYLVmyRC5ZskQuXbpUHM3e6ceuPw3AF1F5H9z84OznvfLir3z09R++/+bv/PK91bacf+FPP6JP+6c3S5X3wJWKY/URiC2Rn1M7N7mdyfH8G5RCYGMBP0GoG0ZvfxW9++qolYGwwggqoT06uL2NIwwh7gY4+UNAGITwxrfR+DOO1739ldIPv3/L+QDgjEJwJI5ZDoeJJYnoQAooseT6JTTvyXn8iU98go8GueSx61lv9WNM/gvf/Oy5P/vpr967b/ueK7Y9valVzRyP6ZefEZ780SVCteYoqFTIDeLtTk5p7W76Jk6BeA4BZGYQMaSQqAcGgwM1VMsaYUhgDfhSIu8rZLIask2CnDcAp4ADSg8FSZAAwCEj11Lix//5l+Hjn/+p99JXvuDrP/rG9W93gLo+KgvAr3714xPv2f3op7fu2zWzVgvLmWxhXV76TxrGllyxuOUlF1y545J5i/YQUWVUh7EYYknXEr7++uvNsYLwf/aSkcIWAN619H3nP/nI4x/YvGbTlZuf3uRl2/NY8L6XhjP/9oVClLIk6wasNRlBMMbAbr7suDocn98pPpe6P1ETyvZrGYShoTr6++rQdYJ0X8dsz/ZKChRyhEwrIPLKHhmcF0AjG4BARFZLqA38fB4771it73zzv8qTTzn+4T/84g/nEFFw1HYA71v6ths2dPW9dG8mwK5H1llNRX8IHgzgwUebVxjI5Eu7T5gy7fFxkybcWvI77v7IW67dSESDo37fEoglWIJjBeGov2jJkiVi+fLl8cL/289ec/ZNP73pmj0bd7yit6dXtkzvxinvujI87sqzRO7ESVSuDCLUmogEmCz7xrjdPN6VIw5/wyKlUcSeWk2jf6CGynAI0hKSBZiTyQATQIIhJVBoBQodGegY9Gu2OFwRMIAUCuFwzfzmxZ8U7TXu/8K/XXPyyxe/e6vrcMxRVQCYueXNf/+mR+6ubpp+xmf+2vDwsBjeu4MHtu8Bhuq0f+1OMbRxDw2t34tiRxv0cB1ZVkFrqW1Hwc883jqu4+GJ3ZMffNWrX/vAZbPP3T2yQ1i8eLHo6uo61iHg6BHsXHXVVWL58uVxO3zVm666cvVjq9+3ZcPmi/r7B1T7tC4+9S2X61mvvVS0HTeF6uEwatUKtGAKiGHY0nmjeT4jKgJunk/cWABYQIAgiGBCYKivhsGhEGzs51gTyIj4Zo8GCERW8iuzGpMmFgAJ1GHsBpf66gaJIAPSEDw/xzdf/QU2D26lN/3tqy/91DVfvn3JkiUy/bxxNIwBf3b3z6at3rZtfLldSyFJyJY2ku1taJs3nwmMqdAIKjUzsGknC5a8f+UG9Dy81tuzt3/60Oat08V6vjKfzePOe+7ee/4Vi54u5FvvOvH0eTd/+UNfvI+IhlesWGFSRizHjgxH+MJ3GJFmZvroFz9/8W2/uvHdv/jJL19Rq1QxYd4sPvtDrw5PeO1loji9W1bDIdSH+sACpKQHgmYNjWiunxrwjdqpiG0XEBF3JCTqQwZDe0MEVYZSBBO3+yI5HkSjLAZI2CoQBoAJGMojCJMIgDgeezVqCJgBKEHjL5ynd6/aoYYGaicDuB1HIw9goD48pa+vtygmtbPK+tCDdXDICGoO4yOCkhkaN/84kAG6Tp7D4VUXmWCoyvvWbOS+Rzfznsc2ij2besZv27Z1vKya89euffof7v393WtPPv/kh2fPn3fPyeec/uAn33TtY0Q0hBUwy7F8VEFIt5LHrudYF7kE6YVf+sBHP/Cy+Qvnv3XLpq0XDPUPYtrcWeb8v3m5mf+mF4jM+A5ZxhCq5TJ8AZK+j9BoDtnEc3k9ctFx468TroUHG5AQQCjRvz9Apc9AGIIkQqidA1BcAFI/KJ7rWzqw1oRKLUCpkIEkERcfSusHKfkgM0MIRmlGF57qGcC61etPAYDly5cffQVg57odEyv7h6g0ZY4RQpGmAEJQzKqwBmoGerhuidumTkYSiVwek844haectRC1WhVh/5AZ3tNjBh7ZwDt/86Rcs3n7HDlUm7Pp5i2vvv/+e3HTL29ce8WbrnzIaHps/LTuB7/y6X9+uI3aeqKCEI8fFy+mY0cGPJdQfYPl0MxceOv73vqm4xfOf8+ePftOGOzrxQmnzzVXv/tvzGkvep6slvJyAP0Yqg5BCkLOy6POmuscoJo6mAsIy/BrWHONO38EzhkpUSszBvfUYarWyRcw0ByReMit2NH2P/YI4X6yAeqBowmnMAA0dQwgkABMqNHa3QFIgd6dfXOARIJwVGEA77n2/R+48aZffan9vRfqU9/6YlEfGCIIEZ/DOMWnJkevZLYvpnFnN5ICpMDCVyBIUKgRViumsns/967bgR1/eELuvWsd1fcOgish2kpt6BrXsb00oeOhXL5w+9ypsx4+6dITnnjrorf2NHn8YunSpcfGjn/+hQ8nhBFX/fVVr16zcsOH1q9Zs2BoYBCnXXSmfu1734xFL3yeyOfa0FPrQ5lrFEpwlTSqXEeF66hxiBppVLiGKgIErDFkAlQ5iM/+af9O4XZxErYN7+sLMdzDkEZAOuMfMtHUPjb8S93mTiIs0lgAQYORKzAmTM7BkLEdCCHFAwBSECMpDZAQCPor5rcv+5xoL2PzU0+sPYmIhkbYDhz5HUBtqJYdrtXQ3VlwuIkVUxhXseNqaRIGhiuuJNzXMhgcMIX1evxyCqlEZtoETJ49DVOedya4b1jv37CV92/ahj23rhKbV+6ePHjTU5NVjV9yr1Dw/yu75aznnXfbtDmz72NTW/Xl//jnJ6fRtB4AetmyZXA3pFyy5NiE4U+98COk+3s3fOvsRS9Y/MnVq1Y/v2/7Xpx61mnhuz78fjrzogtFvrUNvdV+DJf7oASQIZ8FhyAISLIDOUOAYcCQgnY7N5hH7diUmu9LSQjqjP376qgOA5IkQAxtku6eObICI3c/usmBQHw/xnu6rQHQAUNrBqnUOZ+Snb9hx7StLnLFPPyWHIZ27en66je+OgnAmqVLl5LjOhwdBWDX/t5sZbgCEqOboqSwcszKZGezEjVgydGLYP0V3NlOg0gzuFKzZ7FcQU48Yz5PPONk8Kuej8Ft+0zf+i1mxy2PYWDjHtH3xLZpj9z1wJtX/uHhNyslcf6t92w/cdHJK8dP7v7DGeefd/u/vO8TDxJRffnyFH5guwOz7BPLOMViPHY9s0s6rj6u/ci1Z6z4/R8+vvQfPn35tm07vRlzZuj3ffA9eN1b3y79fAn9tX70DvdCSIISnnvpDcCAIQOfAUM+QsBuJFDQbBBCpyS60Qo0sVTXExKVIcb+vXWEIUEJcoIgSmkBqIHAk+b1UuQA3IDo2SKgQ8AYk1oQFj+Iutz4Z0VjSM2QeY86Tp5utjy8IffwI/dMA7DmSGMEHrQAFDtb2YQhoKTFZ9Nnp2gxjwBrqIn6KjZnTH8dAxCWYCFChh6oEzk6ZkvXOGqZMkFMW3wmGzCG9+/XvQ9t5J2/fwK9j2yUex7ePLm2bsvkzfl1l6+590nc9IOfPnHWSy7+7ZmLzvzt2694/YMLFizoBWCWLVsGLEPcHcybN4/TbLRj1yGz9/T3vveN46776U///rvf+e83DPb1ZzOFAj78qY+GL7v61bKjuwvloIre4f2AFFBSwcQ0XYZgQkZ4YA5RJ0YGEgwFhoIAQ8OghgCGtR3ncULyARhEAgN9Gn37Q7CRUDBu1yeQSQS/xNyw8GPhj4BbzNHxIMEWBBEES0S9P43yC6bGJAIIe95VAoUpbcYII7bv2jn1SAQCD1oABvt6qoKBWt+wlVwyu5bKRAWRx9YOpYsAjUJ0mahBfkGuGBAYuhaCa6ElgRGh1NIpW54/ATOefx4b1Lm2ZZ/Z88DTvPfJzVj/gxWyf/WGk/jJdSetuu2Ba37xX9dtm3P6SY+MH9fx+wuef+Etn/+7Tz0ddQfpHW3x4sW04qKLDI4VhLEMOEW067/8lS953z9+fNlHtm7e1g0C3vg3rw/fee3fiVlzTpADYRkDlUEQEaRSMA7Rjzj6wlFsie1y1yQBBrJQYGRgjEFGeAjMIAwZEEkIsBPxWRlK/74AA/0hhCH3OUp4/6Pkv6mAP7KYAUTEL6CYJZiWEhnWCENpyxEbAARDI5RBsaFodAcJiIyACQJM6Bw3+6gcA07qnjCc8TPQYTSfNbGLCKVXNFPknhSfn2hEDT3QCmMwyBDHFSUiY1jcBToICXUNEEhCUGHyBMyaNgkzXqn5xHe/kHuf2mm2/M+9pm/1Vjm0a/+U7Y8/OWVdwFc+efdDwXX/+YO1J5558p0nnTb/1uPmnbzqs+/7yBYiGlqxYgWwYkVcEFIdgsExA04NQH/zm/95xne+/92P3/irm66s1+p42ZKXhW97zzvFaYvOkVoResq9ICHgkUJAxi0eu7zSRUACCNg663gQznmHYADUEWLIVDGkq/ENZLEmgbo26N1bRXWIIZ3tB5vE1otpZOc52twLZAM+IvSPmUftVIYYoTFgkjEAaSLwMV1Yop8rCDCgjmndCKCxfu3TC4/EScBBC8DwwDB0YCCFZVtRdM6ixGqpQY9N6dZtjJYAI7xaXUlt0BNyyqfJcjiZLd5DhhhhLYhGNlRq7UDxvPE067zThUYN1a37df+6HbzloVXY9r8Pe/u398zb/MCmeWsfWPn2bPGX9e/9+ze2nXrhGXfMnj/ndlnKP3DdP31zLRGFIzuEpUuXPmeLATPTJz7xCQIalWjLly/HkiVLGr52OZYDyzHq4wAwb968+F1ZtWoVLV++nJcvX66ZubDk9a/82Kc+99n3b16/JTNr9gz9lre9jd7+vndLL5tHT6UXYchQUtnOOb0ImQEWtrUXJjbjdGx6SBNtCQKAQlUo7K8OIISBgIDh2MITvXtrKA9qKLcwG4+b5FD/Bot/B0In0mArVLWPxzSUioQXQCAY7TYvZtudcuIvMgqYdLBGrlQCC4Igv/Uw9rsjpwAU/ELoQcAMVW0zJggQ6UhFajjaNyFQuhYL4KafSTk1pCoApwEEkdQDdsIQW5bJ8jwCA6oxDELySaI4YZLonjoVsy8+G/W/fS2XywNm5y2P8e6HNtD2x9f5O3+/atb2NZtmPfnAo2+SpGqn/P7BJxdfecmjXZMnPHzWeWfffu0b/nZVNF0YUQz+rEeFaJFHC9wVKGNPTzTmYxnrHHqo59MPf+zDF5x+9qn/9Ngjj5+rA4Nr/uH94d9f+yHZ1dmNvZU+lId7IJS0RzWny2fiBG2npE0WILiDXOy5xyzizZKFwP5gEAOmAk8IGBa2ZyDCUEWjWmZ4JAFj2/6G/XV0vocL/0g+asjdn4QU9p+e7EdFQ0Brjr2EG9g/nNCCHPfNdqVhiOzEFpLFHIb6h7uYuUBEw5wyETniC4BfLFWEVKjtH7KYHQSIRDzjR7pCEjXb7mEaoEBqCq00+o1wY4GIVBxMMc/AYhDEgm2rKAVBknN4CUIK6yGIGL4QyBQ6xIRXXQHvVQpVXTV7H3ma9+3azk//6l70Pr0t88Rdj51mApyWy2X++ne/uLm64NwFD7W1tN155qJFN/zL0s/fN0YxMH9CHr27d8de5Mxc+No3vzRxUveE8WvXbm5vay0VwtrQpO3b93RNnTpjqL29o/+hxx8ttHe0F4v5Qn7fvj2qrWPc8EB/by9I9BRzLfs72wr7hfBq5XJQHj+lJSgP1Bf84Ic/ft23vvnNK3v271OXXHRJ+HfXXCMuf8ELZS2so2eoH6wAKT0EqfeI3AKPiTrcBIVzd4Et3pbNBxYY4Aq2B3tBQiD6Y79VAtq1lHGIHzf3+UOS+hP9PuY0gWhkMgCNenwMhg4ZFjBI8Q8okh6metqYicgwgog8if6hvu7f33vDeADDrjM7OjqAbEGE2UwGtaEqjDucUQSkxCAJNbTvzdRU7CpxmlTBSM98KUW6aHKis1s/mDlGiSVZ5pgEQRFBgliAIIQVhhBAgiSUBomgBiBAi/Ko44zT+AScjgtf/FLUUTO7713F+57ewk/dcj+e/t3D2SceePw8E+K8xx95/IMnL1r4hwld43994pln/Pbf/vFzj6eKAS1ZskT8kZwDcnNjN/wgk9aUM3P2Rz/676n33ffQSRyY43v7e6ft27V3ihG65eLF50yo1sOJ2XymNNA7JABGNp/Fnr37MKG7G9lsDps2b4XyJDzPA4yBISCT8REGAYaGy6hUqsjnsqGnVF36Ure1dZTu+v3dUJ7Ah//xI/qTSz8tAWCoPAQigu8phByCCRDMYOh40bGb4TfL26MUZ0Q4kw7jzvg7g17USMODTO4NJkjykBUAWaJAwg/gxu1DOJyIRKwgTM38bDWihoeW3KvxhMHt2KwNoNmClhGSwcYpDaODa9LNsDGQhSxUIQNd5eLqNU+1A9h0VGEA1eqwKFcqaFO2MnKaAcgj89R4lLM6OwDGaAMhBUhYgYZhtrt1ypstLgM8oplAitDhPmHvO4YEQ5DFJ1Tk3goJDwQPxIItsquEcLsMEdVDO3okwSWRoynnXETqHIEr/up16O3ZZzb99j5ec/NDfNfNv1cr7370opXARXffdvenjltw/P0nzDvhJ7OPm3nrv376X59evny5jjkHS0B8PR9SMYg88Fwxib++n/s7//Yt7160e9fu83KZ7IKLLrloerVandI/MNASVEJIMujp7cH4ri5kMj6kl0FR5Hj2cRNN/8AQ+9kMZs0+kcMwoIzv49RTT2cplS0AAti9azc6OtrhZzLYsGGjMGAqlUqqr2e/qlSq6OzqMs9/3gvMiy6/Qiw87TRRrlahdQil7G2inVIOnAZqTcz8JBCaD4XcgoSxC41t2EaVAwyaMhR5DhQU7mdKCCORExGz1EAwxY1g1MQLsoU+Xs4m6UTSEmLGaJuvaNdPm4Qa7bpM+yQhGDCQjpFII3wIAG0MRE5Rpr1kwk2DsnfXQPFIcwc6OA8glw9aiiXU9pQtKkrU1GkVTXd9wAQag/tChHXAUwJ+TkLlBcizCxfCIntsGMnUxaRtHppyCyKXCeXQYEUEBYIiBQmJDAQUFAQTJIT9ays5W284AcUEzwhAV8AM8kjx5I4JdNJrr6bSa9+M7Vs2m02r1prbfvprPHDb7zPrHl9zwbrH11xQKGaHF56/8LZTT19w3SWXP+/3b3jhG3ZieaxolEuWLMFI8ZJd9KsIWG7Sx4cPfeia0+9/+JGLdu/YeeE5J5996o5de6YODZYxeeJEeJ6Pjs52TJg4Uc+fP59PPOF4DA0O4bTTT8f48eOpra2NOtraIYQgA0NSSGQyWbBhCEGQQh3c5RHgar2KoB6iVCxGgD2Gy8MgIigl41Y40d1HxpvSdgGCG+O2xsDAbL9m4gWpIDDXn4Td4QAGUEWNGZoNDFsnn7wkSAEEgXGHA7s4bdR3lPzn7hQ2rku0+7dwDYDhxhLAPPJeSsqB1nZUKChtLhIVOrYfS48D2UB4ClIpNnUDDqjlqBsDtuRahlkzKAgIJrRtPI0mScQmrY0jU5T7NcJhAUCgXmPUhzSIQpBH8DMSXo4gfYbyJaQQgLCtqqak5ROJHDs5R7rbTAAQxFCk4EPBh4QPCY8lCAqKOaaf+hzdhASl7fcrIigSkKRYsYBXFWBTR4UDTJo2lWZNO04+//IXYfe+beau364w13/7u1jz8KrCo3949CUr73/sJTf/7827zn/h+b9tKXYsv/H6X9xOROUU2BZNTBsW/Y9//I0T/+Nb33/Fvj09L/zmt75z9r69+xUAeL7COectMnOOP9684PLLMX5cJ02dMpU62tpFW1srRCrGwcCAjUGodXzeZQbq9Xq8AI2pxXtgs+yb6B0TQsD3PQyXhxEBWEKIEQU3odAkx3HbuzHr+ONkEM/8DZFDLDEKexcAsqzQSQWUvByGOcAgB6izRs2GcyPwDNaoPahV6xDS2XZFc0Bmixe4R6ajR6i1O2LYYhBlBUYuQDF0PQrWFzBGQ7MGkXIFIPEDNO6Ri5SQiEAI2c5AarUAazds6jj6eACzJ/d5hWw42FtWzIaFkEiGr80wf/cvAUATdFXGoBBHBAxD0HVCUGWIgcDejF4I6QHKA2QWEFkB5Ql4Krrh3IJnC9RQ6mZUbsfPQCELBQVp/5dtpIMku9srsniBYIDIasQ9JniQ8Dg6Rkh4QkJCgCshqmydnjrbuui1r3uTfPGrX4re3fvMjT/+mbnhRz+lNU+smrB9w66/Ukr81fTZU59acOq83y04+7Sffv8/vn8HEYXRa/L5L31y/spHnr5kzZoNz7v2g0sv3r5zV5GNwYTJE/CyV74kfNWSqzBz+gyx8NRTKZ/Jxys9NCG0NqhWarDuOK4NR9T+UmPGRer9EIIO6P2aLgla64ZFj5GmeKngDAEBih8Hp5Wy7sydduvh5PxN0fdH2I+AYYYiiRJJ5ISPGmwBMKwBSSiQjz4uQ7noL8MMwwbahNCuq1Ak4AkJpRQ8qZCRCkIQqmzQU626Vt4h8xFwndaxuEMFQaQWfoovwCOSwjj1KksJUcrCUwqTJ03wjj458I7d/SDUaThQ1aEq8tkCEJqG81ATslRqbOdmrDDuBk5aKgiKpzocEsKAUeNIsRVC+hLZLCGbJ2QKGSifoBwb0bAGk4C1ghDIGEKGkt1fQtnFDoJn7BOVEBYnIAKzgMe2DVVQ8BgQJOPjggUXGUJYZIGDEAO1HnjSw5QJU+kDH/yw/Ov3vROrn1hlfvajH5u7bv2DWPfYUyfs8HDC5o1b3nXczTPvP/P0hU/mWorlgYHB2f/5lW9c2Nvbl+/vG0SulMcrX/OK8GUvezmdc+Y5NHvGrHjBl2sVDJaHksUmEszDLniJxtu2IcR2hGvFWHTW0ePYpmOr1HsZEW8ECZAxECSgycQLP8LciSw1V1ByHBAxSJhC3cn67AsWUI6IIwyBhQKRdiAhwYcEESE0GmEYgMHwhEBXvgWtuRwK2Rw6MnlklAdPKiih4AkF6RH6TQ2/Xv0EdKABko5ghBGpwNSIWnGiYknnBSSHBbaPNRpMaQNdrYMFMFjuO/qYgFe96AW9N/38l8N7+7bkTbXKnC9Q2oY5IVJwAxaQJmVok3KEHIMrTJErUFSlGdBVwlAVKPcbkF9BLg+USj4KBQUpIyKS/d1CKCgWdgeHgmQJwYBPhAwL5xpjC4At4wQ/tdg9EBRL92+rLefo3GldYSGlAgEIagH6uBe+9HDGaWfS2actkvuG92Lt46v0f3/jm3zjD38u+/s2nbUeOKu9sxX9gwOYPXMOPvjBt4WnnX4qps+aIY4/fq70oFDXAYYqSetNrm2lMQhUTTiYz1Dp3bx7a/qVnOz0kSXXyLJii3yy8wu2MlsISh0bRrzhzpVHOnq5gIB2RwcLL9qfqiDQqjLoaulEd6kVrbkcStksspAwxGADBIYRxjgEQ2hAaGNpyZRevmLEqxc9kEi+ntyCo19FWxZEVOg0w8tkkGkvYLAWQnH+6OsAZs2a36+h+001GG+GA5adAibFp7K2TOk2KgWeCIClRfyTzzTSgbhhx0oTgQSILJgDMLgODNaBwf4qMllCqdXHuNYMfE9CGQKZCAi0qL8kAQWCD4JHMqaeRl2BgoCyQ0M3RrT/jhd8pPloMJ1mSMdoYyFhwChXygAbtHh5XHDuBeLcc8/Fmvd/ELf+6jf6Rz+5nndt2Yr3/90H8O63v0fMmjFTWvQ4RLVSRdUwhJRul6cRz7+5LJabLlpOWV5RagRzIOyPmhQCOsiXcuz5QGwgnaQX5MC9yIjDjfsEW/IOpzCcUc/N8fMZBAiCx8mtYLTG+ZNnI2SDYiaHnLTdT4VD1E2ImlvoxhVrSRQfRwQB5TBE3Rh4qTuTmh2W3PcZBxpSBHJQI1ktDUfb20OAQoP6/mEYhNjf31MCgD17ltPRFA020Fpq3ZPZieP0cN35p0eiiDRyzym5ZFLho8U/WhqUiDGYR7cO8VvJyYuv3JcEFYN9lRBDPWV0d/qY2dEO5QA+6fZ5xQI+u9EgSUgiSCb3X1hMAAogF/roxj8N7LAG6KzxObDbCSUIJBQMMwYrw1AksGDBApy94Azxyte+GvfedReueukStJVaMTg8BCKrbCOSUDJqsUfsxsxjs6jHWtJN6KpNm4BnwliI3yhy/ZJx/H6CgXAufnaBC2PfWy0AZezozsQLjEccVRgmEt245+2xKygGkIIwzi8gsL0EgiB03R6QcctaAahZdXlsGGKYoTyJWhBYDYADD6k5FShxCOKRI040cSVM6MMGDPIIqsW3XY9ic9QlAxERE8yu+kAZwz0DTJTELWHUlDXVOkU6AY3R7Swf5H5Mz3bhUh+Z7H8NINnu7mHNYPO2MtZtH4AgezsSWbFJtPApOtezgs/SLXyLEZATpcRTBm5wgIVwIybhwEfJ9ncLCDhGtJ1F28k1lJAAAUPVMnrK/Zg5fQbe9vq3QPkehsrDUNKDoozdOVKkh2ZFppmWgtI22COHpHwIi/hZyIixs5Wob7KIhEg9JgskughuEhAsYomuaLDvJteLwbX/kWow4nEI+CwBAxhDFisge0BThqAMg4y9JaIRr30v7U+WLDBcrgEm+djIVy09Ckx/hkalAjS+9hyZmQj7+8MMQ5JELpNz2QCLj65w0P7y0HYogaHBQXtYY3uqEpxEKpqGl9O424NSxK1GYgY45fYW27SmrJsoBbs2BMJQarcj+MLD9n1DkGCcPXUyyIQQ7NtF6RB+CUCy3a0RAVlkiSNxHHTc2nFq3EhOfkrOwYTAwirdZIpwFtNfHUdckMUWavU66qYOXyprXgGTPK90KL3bURvQ5jSmwqNb17Q1y6jP8VhI/hiL/YBwwAgk0BGvpCPHMMOKbBxIadhAEKygh+A6M7tDJ6TghDcgmaDd96V5+EQCEgY+BDRMfC6IFGFR4Yzlxql7SzjWaX+5AhmXpxSQRyN3I/dqizF8SA9UUI0B1zTCegjl+eFRmQ3Y0dW2DaEG7+x34EzUJiW8txEynhj0EyNmwKNHVoj93uKFxA31IlWX0+GPFB0UkRHAxv2DeHT7bmSkD+lIQb5DkhXs9ICJklFQpE6j1C6QnqrFXHDtmI8U3y/R7iVYQmgJwRLEjojMBGnsCysJUFJCOporImecEW40zUxVGtcfJX+bhGI138H52Wn/R/5cBgTbAkckUjAqOdIVgYQ7TlkYJYZSI95GNJ4V0XQDtvWXI/ZnwRE2ExFzKOkqIt2AO68Lx10gSwlHEGj0VcsO/6FUtU79/4YpiHt3dERZStXFhrqaMhwx1hmIBkN71KmFGgC6urr4qCoA3RMmbgwHy9A7BoSr/Ugy2e05PU5xQLKAoxa5cYwygt4be7wnBcC23iMmDaPaYKcHh9WMZITCur37sbavH0opex4UduYsHe+cYFtJK2ZyKH9E8aSIVcapzoVcrXAad0oZSzZ4TzCYDAgmPiLEDDMaAY4ezrKjA3TmdIgL91C3ND6EL4oLsnE6DLu4JUu3qNk56yY0LbsgI/6F+yiJpF13C5bI4jO+03WQk+RKYQFdNOl14r9RwXElUUqBoWoFg7VaDAymmxym1Hiv0fJ/hFcAjz7iIgkPJSEQVAPUawEMGEFQDY66KQAATJnUvaGQLZpddz4tWGuwI4xEpM5ECSaQsIVdxZZmpLFzohlPVWEa4f0eca9p5A0c4yzcsMgAhpESf9i2Dh1+FrOyHWBj4ndeOLtnGwApYpmnSQlDEsaanU9H8yAeIQaJHnuaAJOcI6OWPio4zfprHnEbH2jxUfMdnA/j7G5GHrFGSQsP0iaMgMPYKi+lA8KisakbCcDAWLATALGCEcaO+sg40J9AJBsUeSZpr+LdXRNDG4e9kLBsv1gZmtL+p1ICGZajsLs6hJrR8IUXHzkajpvc2EORscSpKHg8/Xgah52cdKIkLA9gsErZXAaFQrF2VB4BPnbNtZtz2dye4X19VK6UmRwry1qDN2FVu0IAYniKGhZr1B3QiMYeaVzAtdIR71wg1TIiIcZE5+dAh6iHATwidOVLgGEQG0vbTIVJakehhSOOGhirZ2ceVfmZTNKuU3q6RqPSaNMcOUphFqLBTeZQkDk63MDmxp2KeESRdT9NEkiJ0T+ZDjckOmmfBQMey/gGsu2/RNScy2ikSsn7LYkgScXAoODkeBc39RwdnyyY65O0xJ6I+BsVlkieG6UHE9mxsSDUdIiNfT3uJmkM+qS063Bj6le8gTUUaKbRxy1OHA0IgFYgP5fBnDlze4/GDoCA0v5sPrsZfm1CbXCIvc52sB59AzFxrNUnwJ69PVuVqelcuiGtLQbI4gXFI8TBlNTfwIQwYGSlwoRiCRNaWtBVLKHkZ9ACBWPY2U/bXcM0mBhrZ0ttb7ukE2AoptTjSMAqQYk7CaVxywg/YNgdznEMJOB4BjioGdqBHS4O5Q0iV7DYPR+ABYE8Aa5rcLluG6qs19hp8aHCAtz0n4IIvnPq0WRitJ9isJXjUXEkmmRyRBrnvRe7B8YOUMIdE1zyD5zdmNHuqEWNO3pq/3cZcxgMawhNiCAMEWoNJYV1tBKioZlPv7wGgBYGBiIFC1JzSJRAzAaQArVKBaYaAszo3bunfDQWAEFE+vQzF66trd929tBT27j14vEIa4FFW9OnpFTHRNHIjNz5mBpnsbEdKDXiA2mANvZ3iHYdhwwaMCaVWjCppQWdhSKKvgX+mA10qEHSj9/sqIugka0sRUvZNDRChpIACk57oSOdU08xGGhJL8mtIsmdcUfaUh+Ui0cpthodAoBHaUaC7ZrcsUz4gCmHqK7vR33rIHi4An9CAaUzpkOzSbEweKwxwcHxAAfyKSvqRsAGAVkCF9jEBDE2CeBmmG2AR9y/i+RIFW0AEVeAk9ckAwFNCiHXk3snEuQwx9r96NtzXhYXzp6L3QOD2Fsewv7hYfTVq6jpAIYIQkgotkcMimQ+UdIVR1MfMQL243QzYB+mJNSGKxx6JPyCH06fNrkfaLRZO0o6AKCtY/wq+cQq7F+/DRMvPo0ZhkR6bpKa2NkX0bmwkU4WGTWNeWysyqOcZKLFat+AjJI4oasb09rboJhgDDsVl114eeEjL7wUldPWco6dXiICk32jDTFYOJFRxGyLUGU28Y6fFrfE9OMUWmzbV8tTlw4GbJw58ZinfWqYodCBMT1nrBmp4gxR7LlnhD2X1tb1o7Z6D/RAHSSkDbysWJUcNy+3h4ABpII3GligCdnKxPMhexyyUZ8Uq+hGhn2J+L5JHHt5JN/RbRoZ4aGuDTSHEMQwkQltyrFHsdvJIVCSWXR05HBiZzeqOsRQvYrdlUGs7+/B/vIwdGgcDSmp1NH7OMZt2nifw9qCl3fvB+8ehN8+YeCUM87af9RhAEuWLGEAyOQKT0MT+p/cRAZhsjaJKJ6ZjwC8TLwGUngBjW5x0/PctEnjKEScAY8EprSUAKMRhBrGcHJmZEJJ+PAh4iSZ9F5nf5iOgTomHXciaS4NU6Jo55TTVHz25ATZjtpVK0l247FDmMI1G9/xKEXPSDSfIXwJUTVAOUzi2NjSaKEZ5Qe2o3z/TvCABikJlgRNDNbG4RwEbkqI5YMv/lFfkbx/MpZh27M+E4GEBIR7fRhWXIVGhmUDsWnUpDP5bR4IeeHZ93aEeIlGIP0SEsIQAq0R1ANIY1DyfZwwbjzmdnZCESCVfZzpFGAXWzOiMI9wN6CG+5WzRjHvq4JCDJ500pkDAPCJT3zi6BkDRu3M8afM25IvFnTPw5tFWKs6SvBooURUshPnIE5y1sgmwzCZBqu3RuHJ6KXBztlBMGOgWsOTO3eDhKXxytRNJISER9IZf3A89012K7Z58bC2VM4CxuXPp+g3qc2bjWnYyJkbx04RC9Aj5zo06vbGiDFSY9s/ygR11PIz1hZLAgSF+pp9GHhwEyClHXA6E01BAuWHd6K2tg9SEozi2LeRmZ0t9ghA9pAFRY3inwaLrXgEDPgQTmBFEGQQDVKs3J4h0l0TpxV4iGnYaZZpXBTcfeVBICd8eKxiHmG6wEfek2SMU5MICKHAZMlEda3hSwVtNIQgeIKgpGV1QlA8Hkz/7BjIbMaHEAI8VIcJGMWW7H4Aw2nNw1FRAKJq9o5r3r1Jet7u+s4+qu/rYyg52l8dI4atltYNiqcFfGB8y91JxNywK1GcSGAgpcDGvb3Yunc/lKDkDWOGF5NLKKaWEidAriaCJtjjAMnEXqzZ/hf1NelPmgRJtjuagAcJnxQ8Uk4nL1KV7eC7KhrGTSMFPnbhsidAVY2hR7djYOUeeBNaIYqeU64wpCdQWbMPwcYByIyHgFxzm7K4ZkMNY9GDn/VpzFEkN8Eso1dSkUIWHjyWUO41kiRiM1kryEqmI8TJNCWmZfPoXZgJkMTIkIAvZCzqGjlNEm7aQKn5MhE7sVKA1mwWnYUW1EKNgI3FAWQyWZJEjYnEsYcB4uIlOHlvh7bvYyKgrbt1jfN/EEdSyMwhaQEA0NzSpP3FlpanzN4KKjv3G/IE+CD3DpvEt42auf2Oug9pBD/bvnmG3agvCGECDU8I9A6UQSayAU3+eG6UE/HDRwJdWkQsRQEN0dCGNLi+xiCCSG7yiOfuVIWKhO04KPI/E4dBu6MDNN6JkaXwPNBAgL67N6G6fg9UZx752V3QgQaRBnkS9R1DGHpsFyCAgEOHlsMRtVJS60Ob+jYhwaQps81tP+OdHNagJQcPOXjwnTODoKR1J3dPxHqKhqHa6GEopZjkEoQMBHKQ8DldBlLgcly/jTUuge06DQw8AZw9bQpOmzIZE9raIIX1GrAU54RNOJK4SiP+wk25qpt7oDUw2Gd6D3OmeuQQgaJJwAWXXvzItu2bLulfvQPjz5jPaGJ/zmnDBQJIcjQ3aVxmY+YJJqaMgdFgw8gphXGFAtryeYwvFlHM+FBEMMY4zr9dgIpkA42TiEc0r8kv1WQpqRyr/jgeGdqJhUsxNnaSEbWnwjHZFOziJxaA08MRNWPUjaXL5TFktxzvsiKjoLeXMfjwFmCwCngKhVkdYI9ANQOWEqKuMbRyp3Vfcm1/PBkQjhdvbIzVs3Nr8oHpiI7/IWDNPCQTAjDqAEJH1GGOtB4c3yzcIAO3C5dTwrB45sEUH/OGSSMkk0TRR5iNMU4YxqkOwN6QoRFQpDGzowUTOwroKbdgW38fdg4NoabrFtJkNxvg5OiYbgwjijNBozw8BOUDpQmlHuAojAZzSCCwfDkyrS0Po8rou2cTyTcI1CMG2JigqSVmEHG8O9IB7qWoXQ90CEmErkIJk9raMa6QQzHj23vYwJ1nAWFsOybcolVx8Hujn3t6ohtLPY1bKpyMgDiVbRYLkkVkVhF5CAp4ZEkvFO1c7J4jjwUdU/N5Pzc/DYAA4SnU1vah/Mh2sLGkC7+riMzkNrv7gyGURHXjfoT7q4AnYdikrK5HxK6JBsv7Z3jRCFdNHmtUEeM5KqL9EiGAQQh7DDOsba8sEGcEGGcnRs6yDSmmZ8QAFBER02k9DASYgBBA6CzTYpPSiLpNDMECBiIO9QiNBjGjI5dBa348xtcK2NS7B8KXbhyZ6sSowfWaoudG2qA2MARPKEwa3/20XSsAlh9lTMClDgh8+1+9/rHO7vHVfXc/LXXPYIwDOPp3432S4mlDpG08G61mojkwgRHCIDQhulqKOHvmTCyaORPHdbSh6HtgY9t/ow3IJOwy4c7zEhIeZLx4gUb7cB5VeIzVKkeAYFwsHFDFyTSYHAvNtvsidfZM5sgjpbwHJAAx0CRs3d7kSkAIifJjuzB432YgtIxGkEDh+C63w1nQikKD4Q09jpRlQdBkTkUNHRVzMmVoNgd4xk1A02lCY/8sCPAhkYfFB3woCIeZpN8nEYmHSI6Q56YjwxOdiHKmL5KcC1Rk6sIydjCOYr4jqbElIlmTWEkSUjO0Nij6HqZPGI98NtPAmuZRFdPFm0kBPVxH/1O7pC98TGufst6u/yVHHxU4AgJf9ZJXbS+2t+3t37gXA09vZcrYXWfMeSlb12+hGgNB0jTaaHlpw8j5Hs6ZMQvnzZyJycUcDGsEOgQZA89EVNukMlNqHi3IikjiuXxqFyJHGIlGZsROuRZnEgoIVmCnb49Gl7GAxeUiilT2HcXPmxp/z+HI7ighTzBrkC+BoQD9d27E8GO73DgNMDUNb3IJqrsADsP4+9gY5Od0Qk0t2kNIyBBCxlgFITnPsuCUnS8d2tI/UBAaHwKUyI2IhwCQhUCeFQrwkCUPPisn2bY4ARoAt9QdQ6MP5YIIGUgoV4MlWbZfxEGxUweXP+GOFCICJN2kiIUdVWhoSAaK0ocQ0o2CaUz9gBACYTVgE4YEJSotkzv3H2kkoEMuAA4IFETUN2nGjAdrAzX0PbyZpRBseAw+ezRSEQKe73Bfcm8tp/LcHUMs43k4f8ZMzGhtAWmNwJiU4Ybb4dyRI9YGUHKu9SOmIROUkY2EmtTISbjFT25XjXYYFgYiZXSRBp08B2yRIz6lmX/cxDcOY7jiN+6MjfN/oSTCLQPo+f161Lf2QfgWsAQbsC+RmzveqS4p1kAwgMzMNrSfNw0d501DZmIBJjRA6OyqKJE8c3zOFmNM8sem/jfmOI4tWThgEYhxRJsunYVEHj7y5MMnBZ9ULCyO2n4RjQYpEd+kOf2CAQ+WGyJSHxMk3H0jHLlIOOVn0p8RUwxii7iAC2RJoSBUrFAUzoSEUiNlsIFUCuU9PRjYug8Tp03qf8Pr39BzpHEAcJiwMAFAa1f3Ct/LYN9Dm0ftdkyNOX/G7c5eJtHgN7s/QmiUcjm05HzUTA3StXUR2i7c/xecvjES7oEiASVUzNQ3wgGPDc5CIpGqpinJlLjLgyl2CbKocCokgrhhNn0wvPzAozVKW+xAMqHy2F4M3LMFNByCMp5r6QkcMvwZbVDji2Ct42Se+PcGIQwMVHcOLedNRsvZk0AFBVPT9jkLG76SaBf5GXb+h5aLmp4XcNPKkLB9BOwOXoCHLCe5Dip2+EkDuikGo0hRuYnteBAKnluoCgLKOJDXaT1iP0hj743IM9K4z3nu+xUDOXgoqQw8IVOjy6j42K3FkxLlvb0cDATIKG/PxNLE3iONA3BYBWDp0qUMAC996RUruiZPqm381f1yePVWRiZjUWaKlO+NvnbMDJURYGEaiUJx9hpBConechm7h2uQ0otHV3ELmBKZxIYhlNh4ZZ3tF5xjD8cD+2R/E3Gll81Jt47dx7CAkTLOIDxKomlkhSNhoDeD8kcp0JO/aQYNEVA2GLpnGypP77N4iXQiqGihZwWyc8ajodOiRqEBgcChgWaDzIwWdFw2E4WTu8FSggMHCDq7subt+V9qemVfEwmBDEnkSSEPDzn27IJ0XUFUtKUr6tF0gB1XwnIygAwJZFwPIZzvYnS8kLBUYeGUjJJtmIxyuJGCQJalxSjIQ5E9FISCIorJCdJ1pOTA7Z6N25kDBqTa4TgAdCRxAA6rAEQZdm962ZInOzo71tZ6ytS7diuTkhaVd6GPhMYdygAQnoDwjEVo06YMRHHKShBqrN61A3XDifKO0rbjtq2LjCMiXz1f2PZRMCdndIqoG42gJEdGpjHHjhPFIQn3WNgi/4IbpK3EIm5iLPpPh+DSQWOIbCyzkZRAfdcAhjf1pKyT3A4pBDg09uzfmQVCnRbAjzKrJOelZwIGMoTiKePRfsF0FE/qgurM25+pTSqCtYG7eeD7lg9NskyjWMV8yIVAwAGF5KFAHnJQ8NkSrTy3UIVbyIIThaEgiscb5JiIKnIOcpMh5fwFo85AmWRP90nZCDkT+T1K+GyzIrLIoCB8ZIS0Yz+HFwhBMAg5LFcBAJlsZtMz6KiPuCMAW8o9BZOnTbvHGMKuO9ayIsFMzWKBkyZdSSCTkSnZ8Ogf7UnC/qEhPLZtJ7SUsfLP+vnb5QrWMbgHZxKRM751+wXgxVZVSZgoUZpZmJydQYk4iTjRIUhYC6qIFBKn7zgMYyThhA/XVit6jYQAhxr+5BLyp0+AyQkYzTB1O+lAYGA8QmZ2J6IXmA7B9peIAA2EQQDq9JCd34GW86egcFIXDETirdekteexzjB0mJZEdBCXIR7L3MS+rh4p5MlDxmU8KBbwouhXErHMm9z4MIKSydHLlSD4BHjk9Ae2Ujg8R0CRw3WMdYP2yYMiGx1DDhyWsLkROUiUkEFR5iyeIuwmYkyA7Q+tp4KfwfwFJ9/ldDM4mgtA/AQnTOr+VT6Xw87frxS1viHLy7egCTX46SHSdBMyBd8JgqipDhAMeEJhS08PHt+xHZDK8fljoxlAiHgDEo4bLgVF+4J9o51nnYhn9ylKLjWcDKxqn6xaJSb5gK1rMCmn6EtozGgQLdEYyr2xDP5o9NCfBZDx0DJ/Atovno3i2VPgn9AJNaUEGp+DP6cDfmfRJquknsbYTP7U8yQCjIGuhzCCIEqeLX4iTco6TBuyQ4kbofSZ/ZmNFAENBSBLCj7Z6C9BsM5AUR9ABBYELSInYecrCasZkY4n4Iso9AVxTJzHZC3jHcCXYSADCZ/s3ywpZFm6qDkfOfhogY8WYQ8YXsbjvs17eM+KNdLPZsOFJy948kicABz2wY+ZiYiYmdvmnTR/5Zrt66ZcfvsyPW7+cTKslS2nmpPRaQPkFUjs21aDCUWMpo9U/5IbGgc6wOzxnTh90mSQdvLcFA+bnMlnTvjIsJfYQjtxkJ3hc8pz3+HfrjDE+XTk2XO+sDbTKgoLFSomsEi2TjFRDr0C4B8ygZIPkLMxohhIAfKsw44OLNeBG9Jsm1AnmQ/RLsQexYgcg9Af4SVwuPkAh/O1jEMzOKGR32qHsjWEqJKVAQfMqJOGgYYmA8PWbVhHMiBmaIpUI5z6azu/kA3qbGAocYOqgRGQQeh+R5jyua6zRsAaLBiGA4TCoA81CvyQN914r/nFi/9Zzp49e8tDD91+alvbtJ5ofRy1HUB6HGgEPWD66tj3+ydYeh4bE1NY0+pdp7RjSEXwsmI0b6BBS8hgY+AJibV79uLebVsQiigfj+PzvT27ZeCz3fvJJDczN5iNOtTfJH70ghNyiXAnAcEWSY7ovTJWpQnr9utmGk5/d4AKygdl1Y/ukTk+huj9ZYS9NQgpwNLOrsGm+TJljMFSHym0tXVCeoTa2h5UHt0TI9p8oAX5RzEGD+AzcgjSg3SBtOd3S8JSwp7jhQsoUbHpd8qbkVN/YR2EFaw9uQ+yHQVHrk02MEaRhA8FjywA6Llw2Qz5yIsssuwhhywKyKLD5NGCPPbet4ZBhO7JE9a2tU3rafTIPkoLAAAsXrxYAMC8k+b/NiMVtv32EdLlKqT0UraYnNq5IjWXQSYvGhxZ2a7OhIrrVH/MBr5U2Lh3P+7etAFDRsftu2AD5RRh5IIy43l34lWc4ouNthkiRHFWwuUFsGWUCRGz0OId0tmCR0CVGKHy4zEH3ge613mEHNhK4cxwFYN3bkT58V0I+2sQSoGUTFqBJiXkYBZjTAyRkSiv68HQql2o7uiD3le2HQcfsAQ0yn7xbOsIDuXLLDfDcwtdgZF1C1U6pqaKwOGoO3QJT/HYOI5NswXBg0TWCYkyLJBhAd9YEZkF/0Q8hrRfq5AjDznKoIAslZDlDhRQ3dxvqcQd7SuPVADwGT3oiy66yADAokuff1OhVBzY87unZO/KDayyGYYxDabZ6XuWmeHnBVQmEm6MjT0zbPpvxlPY2LMXD2xcC4pSYYRCjpQF6mJ2XjIBoDEoieR200jeqVhCCnuU8CJgKa38c98XYQmSomESHRZV7uBugO63hYzMpBao7jzKj+3F4B1bMXDfFui9wxBSWpZgKmX3wEbjlHIuJvQ/tAUDj2wHG4OwHqC6s9+CWSmi7VhhIXToFIBnoDI8FNoBuyIg4vfcd6nBwtGx7aJ1ug1hadwi7dRMEaOEIA1Dsv3+DCvkoJBlhQykPfezggc7WfJdofDZQwYeZdhDXmRIDWrsW72N8pkMJk+ZfP+RCgA+owKwbNkyA4CufctbNk+ZOesPQd1gx68fMJDSJbgBTEyRIUjE9zdsIBWj0CqsgaVocgCgJCsDRKiGdXRkM1jQPR2ZOPUvaQMB4+5z0ZjzlgagOX0zJ8wy6VJplXOfjVxraIRfJDlKqYwVAc3a7QP3wc2/cqSwlqA1UDxlIuSkAsxggGDjIPru2IT+uzahvnkACAnCV1ZbwQfwGohMQaXA0KM7UVu1H4ql68QItT1DQN0c3BGMxkIU6E/cEXCDA78NDolm+gxlpCPuWG8/ZRielq5AuE7RMQGT/02Fz0QOxCTgGftzfSNdsrSMx48+FDLwkIWPLFuyUskroLJ9H+9Zs022tHcMvemdr33wSAUAn3HbsmTJEnsMWHjmT4qZPLbedD/VB3oglIjgplG7IJP1r8gVJfwCQdtMqZiimoTkWEVI3YRo9bJ4wayTMaXUBjbJThCbcY4YxtGYIJhwHYRLDCIJRZFNtXRCFKcN4ARqj8Y+ER308HFUbhp52rx8WEM7FgKtZ02GaJGudkkEWwcxcPdW9N+2AbUn9oKrGuSrJK1opLxA2GDN4Ud3ovZ0H6SfsU/LEIQSCPur0PvLENHxYgyn3NHjQIpj3Z69tp8PiJ0QRz4DLpLM0XyVswnLkGcdghwALNmGyNp3TDomJxJ3HyESg1q2OhAFYTsMYycEmXjx22OBD4EMFHwjUaAcb1u9gav9VZQKufXnzFu8Oc2T+T9RAK6//noDAD/69n/eNGn69J37Ht8pBx/ZZHw/AzaMURYbLvfegvwGpU4PIuMsoUU0yk0QoIBD5ITCxTNOQIefhQ41lJvxx1oATnZsSvngp0eMcSKUAwM9kvCEhBJWNeaxgowdfEQiWmGC4MhaLImsOnSN/EE6BB5jcZCLmiootJw7FchIcKDBvrSS174qBh/ZiYHb1qO+eh8IEqwao9UNAUoIDD68A5Un94KUiFmEEVbCIaO2Z8gdAw4i8aNmds2Hcy6gw6ISN38ctghIl0VgiT6WByLB9gjnAD/JBGksWcgWCZHkVEaaaHLEYBLxvRRxBKJEaY9dt+kUhooEhLGU4VUrHmYiYNzEzgeJqH6kuQD90QUgNQ3YM2PucStQBTb/6n4WQjLH5o4i5QaUEFkMETyP0drtQRRgRzjJEN4x9TTOn34cunIFhNo4Coh9M5Gy5KYRbjGNHm5OGOJaSU9I69uHKCZcNBiBRD/EGoAQpEAcMCogDtL00sHPuNzU/aTpodsEGqIjg7YLp8C0KJjAAIJgFABfwQxpDD+0E4N3bQFVGPASs22ZkRhevReVp3pA0nNuu5zKW7QdWm3XALimAcEHhxabLnhqcub6YwrBARhIqcRp5Qg6HkvH+rMEIOWQe5XOKWSL/nscvY9o8HmIpMrR9MAmH0u3ORAUW6NZ5b4n6/noHdyPDU+tpYzn4YQT5t3uOmLCEXo9Y+QyetILzjrruy2trbz+e38QQ2t3QPlZJ54hGnUOpmSnzmYExnV5KLQTDNmQDyIg0AFOnzATs1o6YHQI5do15aSesV88R4IS0UA+SRuKwWW++ySsyIQiXriIF32040cLPeISROmzkkWDUekzPuPSoXW+HLH5QgPVmcO4xTMgunOWC6SEJVMpAnkKwdZB9N+1GTQY2COREKg81YPhJ/aBlAdu4EBFRC0iqQR0XxXBviHLSORDHfAfZKXzn4qiwiPCSa0tmO+Sg3LkISPtsU5BQLGMd/4og1CNSB5KwOOE8SkcjdhzNmYZth1BhhRltEAxk+V967fxhjsfk20drUPnnHLGA0fy+f+PKgDLly/XAOifP/rRW2bOnfPA8J5hseW2R7X0PTZxJrtoaCXZqe9ISLAxkMKgvdNHx4QsvByjqquY09GNk8dNggnCeOf1yLruSifYsVXAJLvqCH1NHE3JBE8oFy2VkhFDWlYZEyTbN1vGlFJqsPWItSBNGX5jI9p0yPd3cy0hkYAJDETBw/jzpsGbUURoAJYSkE63kJUIdg5jcPUeeJkMEGiU1/YAVedc7CxTiIRb+w5rkSA2TPUdgyljBj4MjCM93jkcTPBwyQEHqkUU247loFCAQhEWzfdcoffdES/KGvTYnvUlN9K/3asUKz+FwwQ8FrESVTLgQWLNE08yVTQmdHU//db3vGfjkXz+fzZml4KI9KTJE76Xz+Sw9hu3Eg+UASljJxpqNHlOztnOqguGkS8odHVnMX/KBJw0cRKYw5hPoGA94CjlARDZgKFJSq8bqUNCOKGQdDNd4ViCcLN/kai7InpxClMQqfSb+Ch8yJFddHjroqmDoDVcNKF1BR535hS0LOgGsgphyFY3oBnke6hsG0Rl5wBEVqL9/GnwZraA6wxoJhJJXHfahRdECHYOgcohCSmbZY8fYkLQM3+GfxSryJmiRIQvj62QqEQ+smS7vUgsJJyBZ1L0RcwolSaaDrh/i+g+oZgrImKXaeCpex5iZqC9rfMeIgrSHjL/5wpAJBH+8NJPLu+cNGFX72Nb5e5bHjMql3GK3GQ/TqKe0ovMFQnD6PSKOK69Cz45zz/BDc6xEbhDxoVKsoynACJi7TmNlw9l0WES9hyIpDWUcV/CSZgnpyK/MDI8I9UR8OG1/vwMidgNViHEgLEBKMW5neg8fxoK88ZBdeUgWjNAToICoLy211qDFSTaF01C63mTSI3Pgk0IrhlraR6ZWjAghIQeqiHYPQiSDgtx16EpHQ/BBuiPqhqMgzON03NjWxA8COTJQxYKKpITR52cIwjZDYHgGetZKF1EubWtsfdQ9LXCTRYy0kOlOox1Dz8pcr6PU0455dYjef6PZ68XgwBgzn/+8//rnptvfdvEy+aHz/v1x2U9qJMSANtkihFJq5z4wRMhwx4mqg60cw4FeMiQgseAJIkMKcvU0gTBCqEy8TxfxOd3YR1wI6SflEPwjaP3KvfGi8QzvqEFTEVMuXETuaQhj+UInjr/hd4mssIqKUBSgAMGBxqmHLp8ANiC4A78wpOgwKC+dxjlTX0Idw6Bq6HtBqR9sUwYIju1HaVzp1oFIo3SfvCBOcI0WvnXJPXpsIaGo1LMaSzj9Fi6DaYUTsMw2iCAQV0CdWjUOUDoWCpsbBCscZLsunSCM/fLddrCPgFuKeP5vGPnNn7lKReJ8bnWvQ8/9ruF48efuONI5P8/m0cAwIGBc48//nvjJnTrXXevEftWrGYvm4WxNybxmKMvu4Ct9NOaOpJLeBQkEk4+2wbMUMoOpuGmM7YQRN/vRoCj3FkoNS0Yo+NN2IAuz46e/Yp5cP8tag6EEdk8+noIAw14BNHuQ47LQnZkkGzhZGXFBHiTSmg7dwraL5uJwmkT4HUVAUUwmiFYIthbhikHYDkadEs6gmaOPiMWP6Uz2xsXPx3WhOlghCnE4aax3sN9jdYhiIFioYj2Qgvy0ofHQAYeMvBcbFlkCCpATiIsmOFFEvCU4tOO/yQJBnIqi6cfetJUe8sotZRWjxt3ws7URAz/dwuAAwO/+ZWv3D1lxrSbdLkm1v3gDiOEsn6BDb50nO7W4ssTKqUgMvH3CNc1GBLQgqElpw4Q7H6uFXUI92bKaBbsznGKFZSh2GKKRviXUYo6m16Cgil1JPhz7v80JtjIsdQ3oSojNGBtAMP2XqTY38R+T2CgtQG1ZJCf14XShVPRev5U5OaOg+zMQ7NBMFCDFJQi+NDIsW9zzRPzIQ0Fnq3XjJv4DxMDJrTTnFKhBJICt995B772n/+OrZs3wvN8MBvnKSAdDYDixCLPdZCU4pjEDlIOwxLGjqA3PP4EAKCzs+NBt/AljvDrWREwLFmyRBARv+ylL/5iqVQyG268Twyu2QyVzboJUwoUI6QEOXChDU6+CwMFdm26Y3bBtvIRr51iaqgjfzhih+TojaVUnFOE4kd/Il1AY5NKkZU4jY7zOzSvvz+9UIabmYwRABkh/DSmOSs5rYGph2BiyHF5FE+ZgNYLZ6D94tlQbTm7iEbs4COLAP3JDe9ozM6IR7E+CUbb4lYsFMFg/OgnP8QLr7wCL7z8crznne/GIw8/iKzKwBjtSGESHntQEdeDrB2dEGk2aBIBFoFDnpIol/tw6w2/FvlcFpdcdvGdR8P5/1krAMuXLzcA6KMf+ugfOid031PbNyi2fv9OraSygB6BIuuvyNE1asWZAQ3tgix1IrhhToU1J3y/OD8uspB2ss9ISBD5dxIlbySPGHOlNfmUtuFyj0eMYv+NGHvhT2OoeaDotNGUYjooP3GUtM+xIlkzTKjBiiBbfFBGJE5JB7M1JaKx012anvKewWs2OnYWKQWlMRpaaxQLRRQLRfzy17/ABRdegNe95vW483d3wpcKUkrs29tjlRyMOKg2SpIWICij4qRn2/FJZxYKx8xmsNbwPB9Pr13DG59aLwrFQv/ChQseAo7s+T+eZQkjuy4gPOPMs76S9TNY9Z3baHjHbpCv2LCxTkDUiBFF6GxV1xCYmgVjnD03ueilCL21/zaxqINT6b8CJrYOE3GEt4i5CNRAcRejybvUKNqhBlDpgIG5Y4h8+I/AWvlwGJmJzfHhZBGkcrhZH77mlxpIXnTwmndYlmJjcAVcRqQONYp5u/B/u+ImvPRVV+KlL3oZHn7gERRKBWSzPowx0FpjwsRuRIkUUZpQFPce3WNRMZAkoaIth0VsLU6GoaTk6779I1Or1DFtxtQ7Xv7y124FQE4Yd6wAALE+gK7/4Q9vmDxt6qMD23rk1u/dpTMqB80MEW0d1Lh7EWzUli8UkszXxmFa1DVYj78U14/RcHanEfujSI0GhXEjP0JDdBaN8OchIBU5/gwXazMD32e1CLA7RfEBOghusgppDIYiHXYSCEUifDqIHOKPKHT2mGPF4zpk5DN5lIpF3H3/XVjy2lfihZddgV/+9FcotrSgWCiAa3XoIIwDXTdt2QQD6WziE9wyHkuTiclh0Z3nmchohKBAlFE+Bgb78Mhtf4AQArOPP+6WI1n//ycrACl9QG3S9OlfzPoZbPj+3VTtG4bwPCaLshKlzqWRi2tJ5pAlz8py3bhLpPL5hKveCiP1dAkmLKJugNO57sLRehGLhyQn8c6U6o6jYmDPgOLA/u7c1NUQzfLxnt0JAY0G5Uat2ciL+WAa/LFyicdq6+kAncAhbOiHaArawIYEoAMNSQKlQhFrNjyFd777Lbho8UX4n+t+Bl9lkS+1QFfKCDNF8MIroFUBYVADAEyYPAkGYdzxsPOoiHICiK1BjRWaOdyJrJrQYwFoZj/r8VMrn+SNT22QpWIhnDvruLuBhANzrAA0XgaAuOPWW38ybeaMO3eu3iBXf/5nJq+yMAYxI83+F5AEtMgsWpBDhhUycOILUpAu6TeK9BKJWiimdlq0n1Mij2iUI2P/9zhZhpJEmPQhllKoujWdlHGXzIcysTsEPJ+fRXyMntVBJB/6nkyHigkc/CVqkH9zyvAo9Z1GaxjNKBVbUAvK+NRnP4qzzzkX//nv3wKgkC+1IqxVEAwOIJw4F/ryd0Kf81KormmACZOsxbij5ETqTcm/BduU2QhhMMRxaIkAkEMGa+57lI021D6ufdUnP/m5J4Ajm/77pywAvGTJEiKi8IT58z+Zy2R5zdd/i6F1u+FlsgzDEMIq8xVJtIosWkUOWfjIwINkF8aR4u1TNJtNh8JE9mDkFixFbrEi7hSEcwdmxxOI33iBxDU3JfohHjmMPlSIrclWFu04YxmfPpO2mEcAFofNLTg48EhjuQPhwK8HjTG9H8twbKR7PKV0EcwGodYoFIooFAr4/o++i0XnLcLHP/4ZlKsBsq0t4KCO2uAg1MTjoS76K+AF70bQPs1mvGY7IN10rs71lDlM6n02nFDVoxg5ashascn2JBDUq/jdTbeyFIRLLrnof4modqTTf/+UBSASCYlf/uxnt5585jk3VAaq8v6PfFermrGu+0SQQlBOKLSKArLsOQVWZPfsTu5OjikNuaDG1K3qZL7xzs/UIAcGG5BJsuGjcMxR9t7RMZat6i+ym6bYi4YPYYGJg+vp6VBPvXRghxw6YF9yuAbeh34e51FhX8+s6HBz8NRNihGGGsK1+/c/dBde9sor8cbXvQmr12xGoX0cUA0Q9g9Adc6Cd8nbEF7xQdTmXYJQ+kCooVUG3DkJLj0eg4N9Fsmn5LhmiEecZmwnwGnPBFjHpWK+gEcefIDvv/MeWWopcnvn+N8BR8f4D39KIGPp0qUAgOdf8eJlpba2yvrl94htv32IvWyRhbaz15y0oo0MKcvbdjLdCIyJ5voxN4s4RvkVOAUh0ijLJ8ECiYmoGLF/UWyMYe2mHPvbpQ0JiEPE6wjNrb9GQ9+HaiB2aCesZ4dLf1jTiUOoJQkewKNoU3xAizHAGANjDErFEtgYfPpzS3HBosX41Y23oOu4OZCGUdm3H6p9JtRFb0H44mtQP+E8aCnAupaKClPW/8AdAYYHBmPCFBPHi5+dLTiDYVx3KGIdgNWfgA378HDXrXdyvRLSwlMXPPHFz3/x3rQhzrECgAP6BopPf/iax05aePJXlPLEimu+Zaq79kJ5WfikUBJZKrCHHDwo4UcGTvFUS1CC2gsX9pBm/0Uab4nIyME5wpjExScxgRBN2/AIM5CIosZcxzBGos2BTb9phAUhH4Z77+GM3g4vcutgvnvP5jWyCFDjJjvaI4UZOtTI5/PIZbO47rof4/wLLsDHPvJJyHwBuUIRPes3gqgE/8zXIrzyWrvj+x6MqdpFTzLmhBADKttm7eYA9PUNJeFnPFKBzXGYrDBx0GRsY09EqAU1rHzoMQYAKXJ3EFHZpWPxsQJwiPfEh6+59ovjJ03cMbxxj3zis9dzURY5wx7aOIMMZeDDs61+amwnkKj72I3spIvtivIBRWQJzQkZSCCVHEzC+g06Si+lo6YdQOhFXQcl2v8D6fjokOb9h7rPP1Ox8HP/4ib/GKmk1qGGEBLFYgkrH34EL33JS/Ha116Nx7esQa6zHboWoDocQs4+H/SiD6F2xssR+j44HHYxbbLRaIIBNgbI5iCEva17ewaSoTI1ahkizYdBFCbCMM5tGYaRy+SwYcMG3PuHuymfz6Ozc/ytR1v7/6cuAAZLlogrrrhi7wWLL/hMPl+gx79zq9l2xwPoVG2c0R6y5FEU7mEFGhEDz3rWR0lAChFf20lZDbuRIDu9toSIuN4pxiDDxK446Vx5aSLXF3KJs0nuHv1R4zv6o7wADoFW8BwVhDZamYz5mAkw2lhpc7GEoFbF0o9/FBdccCF+dfOv0TKhBXI4QH1/L9BxPNTz/w7hpe9CvWuqW/jsFn5Ky8FoGAsboUDSt0eAoUHX6tMoBMMmSBibMESRhb3tFIxhysgMfnXDDTzYMyC7u7v2/uQnP7r7udr+MzNdf/31cunSpYe9ntWf9JFZirD4yfd+8I1Zd8++auP6DYvv/ccfhJf87vkyC7DHkpQQJIzl7Qm20dxpdxYVAXuUUDYFJY5D5AyCZGQj3eAWbHGBKGQ0YpSn04WbyVwjReLhLkA6iPUFjZqz059jhT9rzMNDkjCRQ1m4cbAXtfulUgvqQQ0///n/4J+/8Hncc+9DyBfyaCu1YmDvIITIwj/xAvA5V6OabwfqZQC6USY4iodBCVap8mB3Ww/0DkBDIzoBUooEFp39ndIkZVeXlLKMyjBA8Dx/K4D9hz2E+TMs/KuWXyWISNsX6bl3BOClS5eCiII3v+ftb++a0L1v/R9W0k2f+gZ3+O0QGi6IU8QuPok5g9v5nXlnJN5QlEh7BIl4/GeNIF1GoNsRrAFI4vkvndebolR4eHQe5JEdPI0agh18KXHqf8fm6R2djX8TsNM94VBrCCFQKrXgD3evwGXPex5e+5rX4tGHVyKfz6FcraCvpx9kGC0X/jXCy96PIFMABcOuM0sYz8RjhAlGrFDhgYXtEspDw9AIYowgwh3SRSOifHNqEhDhQ52dnQwwuid097hFRs+V8d+S65dIIuLlVy3XzDzu4W13X/a7O364mJnlc6kAYNmyZWbJkiXy4x/4h6dPPnnBp3K5rLzhi980T97/IFqyLUzO9Ve5xe3FjqwydmaVMVWTk8UcWTpHgR0EgEy8UGXK+JFcErCCgCekGxtyaryVJu/RARb3H0mmGWXw8Uwz+OjZ+co/ocSRiMiwgdYhSsUSqtUqPvKxD+Py578Q9975B2RzeVR0iGq1hoWFbiwoTYBmBg/vAkwVhoOY0kupwJM4PaYZ5mJcKECEMxgbDSoi+xBuJDVyJB4bMdGRQqEaVrDowvNpyuxpqFQr05m54DxS/qL12LX5tPyq5XqYefKXbv7i0jd//T0PfOaH/3XLvWue/PTh3iTqz/GgnVpQ3nrzzV+fe+IJr1r71JoL/vWN/xD+x10/l9nWPHOobUAHAxmWkKwAEb1xkTcbINmSfkhEIz6Ow7qIE/lmFBQfyYgFhM39c8ow4BDScSm6U3iMUM9nKvSh0ew+PjQ/PEr1F4Rn5rJPIxzKRz0lOmwLjyZKS0YYamSzWSjp4Rc/vwEf+9jHsPLJJ1DI52CkQn//ACbnW3Be61RM94sISaBfV7Dr8ZuRnbMIg6XJEGF91DsUyTk47ulTzB0wWHog6dkjQH8/wiC0/pOGG2LTInEQsRuuEjn8xwbTBGGA8RO7REtrK697+unZH/n4B04DcOdVV10lnmm7/SzI7uWyZcs0AHzz/utf84r3vfSLe3v2TO5TAJTPmfE6l+I94VBOK38uQQMvXbqUiai69NOf+ZsJkyf1bH16vfjiOz/MecpCAvFODyEgiF3ct93fFdvPk/u3JBm799i5f2LjRc4aOmIMyjgHfjQxl5vl87gW0f6Xm9iB/LFbJh/210fjNU558HNTsg4OKhPmgw4s6JBAzrFQDaOdf2GhhO3bd+Btb38LXvaKl2PV6ieQyWYwXKmgQ3p4ycS5uLr7RMzxi9AcQgmDcztmgcsDCO67HorDOC5upCsrx8YnCbvTTnAMWAhnSgt0tLTCl57tLFIHs6Y92wjwVxtDmUwWM2bP0uWhYbF98/YL3Hb259/12e36y5frMpenvvOfP/Cjn//kuh9v3LZxcn1Se3jy1S8MlGQK60YjSdZ7bhwBRh4FXveqV619wYte9K6W1lbx++U38nVf+g9uz7YC2sRe7tYkxBYBz8VBWRyA4wccjfWiYqGMiA0/BaKxYdoYcqy7nsdgvv0pITM+yOH5EPM1Rtl0/RGHhjG8QBvxjAOoeJgRBAHy+QIy2Qy+8d9fx6JF5+IbX/8W2tuL8LI+8izwgq7ZePOkBTg9Pw4KjFAwlFAImTHdz2NOWxeq6++Hv3sNWPmxvRtc5FmjTXMi2mASdgSYy0Kw3aCFtmk+0fvZoI2MNCBx7kPDm8BgRlZkMGXqZNS1wZNrnzrDdrN/XgxgyZIlchktMwD4Y1/92PuuvvaN99274rbXPrVytZ5z9Qv1JcveKbNZn2q7emBq9RpR3MLxc6oApGjC8jtf//pPzjr7zH9uaW2R//6Pn+eHbrsTnYUOl9pqdQJKCHhuLGgz3dKz+oS9BQBK2a4BhoFQg0IDoZGwukYN5g7P4ydN8KE/ktPPz5g30OTbxvBZPHQS04H8iJuDmI3ORAYgq70HAaViC554ciUuv+JyvO2v347e/fup2JJHdaiGU3JdePXkk3B2qRs+M6qsE9q3gOsCDRaUJiLDBuGmhyFFSryV3vHdJmE7cQZl86DWTmDcJIhCK2DspC6oB9BGJ2aj3OAhDzaIx4DJguBYRAYQ5p00nwCgp7d/pgPYzJ8Dl43P+suX66c3PrLwbz/3vt/c9Lub/vW+u++bmD1jbnjel98npr7gXKEFsH/zdpR39qBjQsfQ4Z5LxV9gdGEAiFtvvvXvL3veZTezgfzwG96r1z78ONoyRUiD1OgvgvKEEwpFHZ9w3AGBrPCASh05JTGu0IKuYic6im1oLbbC9zzr9Kqtg4wx5rBd/RqWFvEhmnc1ymtGLjCmw0Dh+ADF6llw6j7EwKLmMiEmBHWNQr4ANoyPf+xjWHzhhbj1ptvQ2dEGT0pMQQ6vmjgXF7VNRjsTqiZEXabrFzktBiFkg0kqj/G5IsLND4MqPdaslIxNlI7HtdreBdkSRNs4oKUD8LM2CEqbeFSnMjY0lB3gyynwlVPeFI1PKSIKEQIEmDN/LpEAakN65h333TfNLc4/aQFYvHixcmxa/pflX3jrX3/4fXf8/KYbLx8e54enfOQNZs77Xin9GeMR1KtkoFHnEFozhuoDtefaGLCpb0AUK3bJZZd8YXzX+NrenbvEt77wb0yhgRIu15WdcIiQEHZScc+kgdZMEStu+R2ef+FlePVLr8I73vJ2fPQfP4z/+s+v4dc3/S/2798Hz/dRLJRQLBRRyBdAbFlogTbQbGkiLqb0EPb3Q+EG0AHXLoEOL2rs2Zg702F8AY91MmlEDY0xILhd/4kn8cLLX4hPffrTECTQ1taC6tAwLi1048WdMzDJz0JDIxSWai0MUouSG7gCOQCT8m0w/Tsg9mwASQnmADAa0KG9AwotQGc3uHU84BcTSDQ6ujkmoBIqzn7gZtqEJv1YyhAZga6je+JE6urq1r3797Z++wdfPQUAVq1aRX/KXX/FihVh76YVM9/890tu+PHPbvj6kzu3l9ovXRgu+MTfyInPP5OEYOh6nVgCoWBUghAiYGSyrbXD7QAU/gLX8uXL9ZIlS+R73vGe26688sr/uvFXN75v+7YdoWGWkqRV80X24LCmDdbEQcR6AGYNBYUtm7fhsZVP4Kl161CrVBt+z7Tp0zF/wUk47bSFOG3h6Tj+hDmYc9zxyOXyAIBQ11ELAmitQWRAQqYMSpvZ6ommg0FqSgFqDLDgpp6EY3/kWUEYDuHHcrNVz03oEJym8YYoFIqoBwE++9nP4otf/CIGhgbR0dGBgYFBhFpjXKkdnYVWSGbSRrBoeJV4xGQj9YoaYALlIUkAu9eDJs8DwhCUzYOzOXC2AKhMFEeR2PxERdWEsE0mkPE9kEdAgCSJagwdJDWpifWgju6JXZg2Yxo/9NButLTmZ1kY8FkHAmnxYshly5aFAHDNl659x6s+9vFlD9z+WBdmdOrzv/IO6lwwW6Jagx4eIiFtWjSFDMNMYWA4rGv07+6rPbeYgAcuAgBAXRM772M2UEpRzsugVq+BSBC7kWtaUy6jjABKEHxjQggh4HkefClhgqplnRlgy+bN2LJ5M37zvzcCnkKhVMRZZ5+D42ceh1PPWICLLroYUydOQkuhFYBBJajBBKE1L5GUUiM2PwnHEeR84Labm+00Y47SqNmxiZ+RI29TUtOhiZxH1SYiy7WHQaFQwuqnV+O9730fbrvlVrS0tCDj+ejp7bUx3oKwvzqMh+oDeF5uHIQTaFG6uDRO8OKxnGbGBFVAkSTKO9dDSIJumwDOFizQxw7rIdNwjEgJAuLHP332NHjwQIZBUjpfQcTjVBqjxiXmo0yeyvC02TPxwL0PYN2Tm+a6QQA/k9191apVtHzecuZPMBMRMzMtX75cXHXVVXrFCoQbK4/MeP8HP/rVH133Py/auWkXJjxvXrjgH14jO06ehXBwmCQR4Nm4d0qy+RAODcPLKsw74bihnzm9gltfz90C4B4kt7V2FrO5DFRWufk+uR0+tdhSLj7RnFkYAQODUlsJUkroeg1cGgcxbzFQL0MN7YPo2QXUyuBKGYY1akNl3P6bm3A7AOSzmDhxImZMnIhLnn8pFl+yGAtOOAHdnd0AFAw0atW67Q4AkBAN6cM4UFwYj+XRdyATYPrTMAG5cbY/korMTYXNoy8dhshkM1DSw398/T/xkQ9/BH09vWjr6EB5aAj1et0KbAgwzOBaFet7duHMSR3ojHz5OGW1Fj2u1GtATNBgFISN9hqUBqK1DZxvB8K6PQZEaAQns/+0FRrrMLbrHzdxQkMBT+LE0DBdGCldJrYWFHYLEpg9fw4AYM+e/bMPB1NdunSp+P3vfy9WrFih0waitIyiYwYD0MzsLf3XD7zrlVe++UOrV66ZUGvPhCe990ViwQdfIeERzNAQSSndY+M43o0dGaa8rwf1gRq2bt01eLgdyl+sAETX8cfNpEIhj2KxBB8eqlyL0VqKMwSFS/8RsbgjknN0dHTYncEY6EwJ+tyrwZ4CBcNAeQBieD+wZTVoz0bIvVug0A9JjLBWQ+/u3di9bTvuue8BfP7fvobjp03CyQtPwYXnLsLFFyzG7JkzkcsWAQDVWhU6DC3qLNKegdRgXjpSB8sjEomaDvEbQhP4YPShZ9gFjFYlHApgyGCY0KBQKGLfvj34u2uuxfe/9z0oz0cul0Of2/WJbIGM6LRSCAxUKlgz3IfzS11Uh2afaXQ/krLnkhCQnoIvBDw/A66XIYYHgFybhexjb4jRrw07JqDliti1NlCuuPQpN7FggnHKv4ZJIlMcWiPiomiNaAyAOSfMIQColsMOZlZEFHIT1zhmpquuukq43ZfdojcAcNNt151yx8r73lhqaZv13jdf84kiFR9j5qmb9t570sve9uIP/eG2uy7cv70PradNDRd96S2y+5x54KEqKGSy6sbIyFbEgDSRBU6z0zuQa8tj3LiuIQBYvGcxrcCKI6MAbNm0VdVqNUyYMMF6A0XnfjCIpHP/NU6olbgACZKomwBTp09HqVTEwP79kBAwRiMMQjs0zrYDuQ5Q11yQCaAq/UDvDoS71oK3rYPZvwMq7AOxAfoHsfrJdVj9xFO4/ts/REtrC0484QScf8kFeN7zno9zzjobrYVWO17SddTrdZvO6/LDBYnRCzUKKXDedH/s9k5NEnfosDOHR5uYoFlhIkvqkVIhV8jj5ttuxnvf9R6sWbMWfjaLMAhQq+kGGTWn6GdRIVjVvxsLCx3IYeTrQ/FNLYSE9ASI7HiAtEGr8rF9sB9UHgSEbHiy3GDkmmY2CkCHMGENggROO3VBrPozJG1uBEz8zRwVbzLx401jNtG7p/yM3QSqwx0ACgD6I6rd0qVLxbJlywiApmQ2CQD46k3XH3f/zb960cD2HZd/9kv/76IBbzj7N296K1Y+/Ejxg5/9QM/zX3fBpXs27+5cvXITwqwK537kxeL4t18hS+M6oQeGSEkvNjOl9Fkp7uYsX2Zo1Q6IusHg8EBwxGAA0dU7OJgfLleQ8TNp/q0FbZgboLY48cdFfGkTotRSQktbEfXhAYREtuCSB4IBmxAwBhwymATq2Q7QlC7Q1IUQC+ug3t3Ank2g/VuA3etRqA3ADPcDPqGmNe57+GHcd9/9+NKXv4KTTpyLiy97Hi6+6AKcPP9kTJ8+Hcq9fIGuo1arw5jASpOFBFEqlWfkDJ3GCO442ETwkGoHN8EU+CDfP2I1ERCGIYqFIoaGh/CV//gKln50GcrDw5C+h6w26G4Zj13VQQxWy41QXnohCYG91WGsH+zBwtZu1N3kwDiLd0kCSilIJZ0zEBDAwHOR7lzuAwb2AaRSq5/GUGjYvh2mBgENKT3kiy0IwdCx+aBpRHKiGDqMiIGzbFAmIahiqjhx4UnU3tmKvsGB4i+euquwdOnSwTPOOEMCCNOt/Yo9D0684TvfPeXxRx4/s1QonPGlD33wov76QAtmtkCdMhP86GD4sx//Ep9f8y+X7di5HVwJgQpM95ypPO9fXifHveB0iHIZPFSGVCopypQ6vow8yJGgrOdDayAMD3+o95cGATHQM1AymiGkhFXlU1IILPQfn72FEfGbHnnIldrb0NbRie1bdkBUBkFBHRAe2DAI0h4PKHIFYiAIYJgtV6R1MqhjmqUShxWY/t1A/35Q3xaIDQ8jF+4AC4IBYeXjT2DlIyvxb//8JXR3d2HBKafg3PPOxTmLzsXcuXMxbepUKNjjQj2ooV4PABjbkgqrWSY+OJf+0D93uIgBpQ4rBy4zYahRLJSwctWjePs734l77rgXvp8BiHBSrhUXjp+Jei6HH6190NltNX/clpvF2DDUg5NbxkPbvRiKJDzpQ0k76o10+ALWoltAIIQBTAgRMXhIHFiE5WzepCEEIUBKIN9SRIAQ7CLm4RKCKDZXcynVxI3tVFpfpDXlCwUutbZi3579hVuv+1nLV5d9aUf0I65Z+t55j61++jWe5y1++wtec0Lv3t6uvv29qNcNWue2Yd7fvSKcfOV52LpxjXjwuq/J2zc8CXQI03bqdDNpwXHixFdfRmpOF4m2PEz/IIQUIKVsKiZzA3WbI8lCSssCY1gHAam8h4md7UNHXAdQ1/UiSYKX98ApakKC1JIbv9nuilJkGjaMQqGAmbNmYuUDD0OaEAhDQHFsJ0YNKbYiZs2yQ4w50NBgaChQx3Rg3AwQzoCa9wLQ3g2gvZshNj6ETP92sA5QDwLs3r0Ht9x8C265+RYQgK4JXZg3fz4WLVqECxdfiIULT0VX5/j4OVaqZYRhaJVmZD0M4oiaUb779CxJ9egAesbmhcU4Bl2xUMIvf/1LvONtb8PO7bshPA/KGDxv4mwsKI2DZySGmOArmSotPCrMJUop3VodwkC9RqVshgkKvnDkbMOJd0Mi0YNHQF7YW5NrQw13f9PgcSf+AglwvYIgrGHC5MmYPH0KakENQpAzh+GG/NNo1OwCLBMsgCn+kRxq5AoFGj+pm3v29GTPP/XC00v/lsHKx1deXR4YPu0H3/7R4qF9fcVKRUMWCbK71cz94EtMx8wuTDptvmg/ebakIES9dQLmvPw8dMydhcK0Thp/5nFStuZtvmu9Bh4qQygJMXKonIqZoEgN4mo5CQZpjdq2firlcuia1LkXALre3cWHCAH85QtAEIRFKSXy+aLj7HOTmXsj8h6dNbU28IWPmXNmgKUAaQ1TrQHZVCucgmoa9kBKf86d03UI1pYUVPczwPSTIWafjdy0E6Fv/BLCehUTMwX4ktBfr6MKDZBAz74e3H7b7bj9ttvxL1/4Z0yZOhWnn346Fp13Hs477zycOG8eSoUWyz0IA9SCigtBlnFGQnOjUf7jR4FNrUtHW3ZrHcL3fCjPw7JPfhyf/6cvwBiCUAIdILxowhzMzLWhEgaoAMhAoS2Tw/6hwVGBxkTJ+yQJGDABhrTGVJFH1RiQc20Wbi8WnJrwRPZu7M79vbvi941Szj7UJLiEpATv3QQYjZaOTvj5PEJjrFFo9JzZpQ0xp8ZpIs4EiFWl7FiBzEwkkcvkMTxcNj+77kefv+MPtxTKff3tlJUIINF1+cKw88RZmHnpaSJ/wiQqTBonfUgEtSrqA4MACO1TJ+PsL7zDkpSMga5UEQ5XHQYCQMhRGAlTM1KWfdwgtoGueYXS8V0Y3rgKQa1aPly9kvrLu0iwCI2B8lXqrSUYJ9RAQ3fGKSGQPTdrMI475UTI1gK4MgwxuA/U3u3oojR6Hs9jOdm4F5xlEh9Wq8GwRNi3C6Y8AIBxSfdMTM6V0FMtY19lCNsrA9hZHcKgkICvID0PmzZvxrp16/GTn1yPlpYWnDjvRJx77tk4++xFOPPsMzF58mRkPQss1eo1BEHgCGyiSST5IamBnrkkGcl5v7evF+9917vwwx9fBykklBI4o7Ubp+XHoztTQEXb2C0jDESo0e0XsD4V7kFo9PiPUqEBoC+oWjSeTUK2SuetMsNY5MbhN47DL3OO289JHuSoGPOkJRa1YRgAx500D6WONgxXht0KSx6kMGRVBGTdgolNo1CIow7TcgjrYYB6qMFsaPl1108pTi6g+/JTwxOvXIzOM08UHcdNk1kvhxCWRxIO1hBylYjAnvLd3hIgGCi7n80gQRBCNChMo9+bPqpRk5NJ3G8JwIQBerfsBtU1SCirg15y6EXgL14ABgYGDBGgpDvfUyzHZTTmujSOzV3LpxFicvcUSAa4Ngwa6m0uvWeMeFkPtL7cXiMEJNdBGx9BoDW68wWM93MwWmO8l0N3Jo/5bd2ohCF6qmXsGu7Hzuog9kBhICNhhIRhgwceeAD33XsfhPoaxneNx/EnzMWFF16ASy69CAvnn4KO9nExdhDUa2AWIJkqdKNd9MeWDqd2+GakHx6h7dNBiGKxBY+vehxveN0b8Pijj8P3fdSDOk4tjselHdNBBqiwhnTArDSAYo1pfhH3kmiaupzqWwEA22oDFoxLo9rueGZS2n7BQB3AEAf2Y/lWCOPkX8yjOpm0KpCMAWplEIAZs6dDCImQDSQ3TjoMReXERYU5UtHIsEObIWLg+1m0dnYAACafdZI563NvwKxLzpYaBh4YXKmjXhuMxUpSShBLG4rrrMeFEJCOoWiIm/s6UDPROTVoMSK9AiEJu5EGrEON/fv2tx5xHYCQdjzkCy8RfEXG/cahIG6UZtwOINjOnIURCIIQU6dOxbjxHdg7MAhUBmJe+dhQunHLg8b07gMDkAKyOgjevREAMKc4DnlI1FgjJGOt6gBkiDA5V8KUfCtCGPTVKnhquBcP9O/AUMUiup6v4Pse+nr7cOftK3Dn71bg85/5PI47bhbOOfMsXP6iK3DJJYvRNW6SOxrVUQtqFswkYZ1uKTqdjnGOp+iUSCPozJygyJTgKyYEisUW3Pq7m/Dq17wOPXt70NLWhoGBfpzWMRGXtk8DGwMTW7YnRq0GjG6VR5ufRW+9AgFL4hlpkx49jD31MgKjEw8Pauxv7ZzeflyHGjWj7aRASNRJpAxAqKm2E0QQ9QBm3w4AhJnHH590lO6XuvXnTEA5XrAji6WAdZOOTGUZwHC1CiEEzvvH19GJl1yM4UovPNdY2PdGxEXFhtiye53cEYSj32JSUWUYHVJyECN3Sg0pCQSSAsVJ47D73s3YvbsnZwlLe+iIKQD5fFESA2TStN/o0G6SPS3VzbObh7I0CHSIlvZWjBvfgV3rN0NRJWF6jWyYI3VOamfiEZ47nIazSEEM90JXB0AETM2W4qqdDhhlMALWYKPBxBiXKyKna6j0aNgW0CAMQoRBCCkEPOWDBCFkjaefXoOnV6/Bd7/3A8ycOR2XXXYZLrnoYpy3+HxMnTw1Pp/WahXUwwBCWBfkA8IBDsga6dCfHIHsi1nI5/H9H34f73zHOzBcriFfKqJerUJmFMb7OWTIFjtFUWEWsQtvyBrjVBbTsi3oqZURJZWPdfPWjEYAwI8iup25azri1cBAEqGiqxg2AZQQYEgwSYwuaSP6ICEgan3god1QvsSM2VMRImzw+k/ec7fwU45M6a5Ax/IC6yRkBKNlQjuyvo9CPoM8GCw82KGUXfAhpRcwx/wDcoWRUsNSbrKkrQVBQkhKj3Mp4lCkCWVkgW4lBGQhB6kyyGaywXNeDTjqXjVacGga29dIKcbplzM5/TBru8uxRBiE6Gwdh4UnnwWtAbFnA2Dq4PhmHXFy5rHdsEY1zEoAe7fA1MrwPR958sAcJRCZhhdPOO8BwUA1DLF5uBfGhJaYZHTaaQbGaBSEjwUtEzC9pROFQh4y42Hjxs34xje+hde+7vU4+4yz8MIXvRAfX/oxrFhxO6r1OkqFFhRyRZZSjuhwaETq5pgZfvaG1BrZTB7f/u//wBtf/0bALyJjNGjcNBTOuASkNXbUh2BAcVR62krbsIYnPBSEh/nF8XbHdFZsRNS0O6mDMUQhApGwI5liY/c4GcpjhUEKMaCrQK4dZuJcy+WIfi47jwCOiDxuZxAKom8vqnt2Ysas2Zh93AxUazXr+utGlQyGhnbjSG3HwVFqEKIiECUHMQwbQBLq1Rr2btwO7QmMmzzBdkFkJzpKSOtlScLyF4icHyWlkqwUMsKzI0+k/Ch5pL8JN33X+ACGEAY2D8HLeWjrbqvFU4AjZgxYrxnKSNQQNoCAzdohio9xTgzi3FwMDM5YdAZ++K1vwuzbAlHpAxfGx7pxjHC1oRQanLQWI8LuXeCIqPTBMCMnFHJCAcaaRkSsrFi7QDZkQjGh12jsrpTjYkaN8Di0MQiNxsL2ieiUPvbWy9hXK2N7bQg7a0PYXytj56492Pnrm3HTr2/Gpz/9GZx44gm49LJLcMXlL8K5ixah1FJEvVZPJd02BwhHLkVmhud52N+zC3fffx86x4/D0OAg/EUvhnneXyHc/gTovl9jMKgiMBoeUYo6ayAlwYcPITwEHOKEfAe6MwXsrA9DgmNhNdLkGgZqYQhTDdCSyUAYcm2zjB9TnTWMY3juqNdQMRqZ0niYtnExDTiN4zTuotbHzxvsQdlU0D15ElraWzFUq4BE46FEN7AJbSvNbElEhhPbcLiCoUigWqtgz9Zt8PM5lEqtEAAK5NtAETbxTzeunIE4trivuXMtQcGQgeY6hPvahl2JDhzc2kxjEhVFYkKgDfbu3ZsBgD1fO4KOACRVPZPJWFPQA82+Y/FHWixkAMmo6wBzTjoRmVwO9XoAURtCWBjnWn7TYP8MEi76yX1/1FuZETsqG/vpssUUckIhQ4kENfIejdYfubOfgsL++iD6g/Jo/7zUc6gZjeF6HZOzOUxVRUzzW3Faq8BwEGJjtRfrqz3YUR1EhTWCWh2rnlyNVU+uxn/99/cxqbMDH/nIh/A3f/NWVKoVSKd/b6SKNi8CRARjDLK5LL7xH99BPv9+fPVf/x3e3PNQVm3IUw5eroC+oIbBMEC7tNMZTyj40rfmqkxgNtDMKKkMjiu0Y2dtCBAiBuiTxW8/4IFwdfEUzC90omZCK/xhu/hDNujVdWwJ+7BP19EbbAIZAVUcjyBTsC5PkRPsCHJMrCMQErx3AwDgnMXnQkkP2gxCCgET2YY10IZd1xKZgnKyFZto3AYGKYGhviEM7OmByVmCWQ4KARtrQOXuCHa4ArtUK0OAkTbPko09BPikEIgAAUehstygZI7uK24ABEf4MFFijApngV9qa+FdlTr6tuxtBXCoFIDnxhGgtbW1xppRGRwchcA22/1TVv7xgq7X65g+YzomT56IMAggM1nIjG8loNFuz2zHSQ4JsscMEUtILU3UpKynXBHQAQyAgpeBRzKWk450FrM4pXUf3letINT1hM484vBKAAKtoYyCZEbABrUwQC2oIwNgXqEDV3TMxpLueTi/bRoIDOV7KI0bjywxNm3cxL/73e8gInlseic5gMMPp2YFQmYQ1Kv41LJlWDh/LsoP/w7KGAQT5gKTTkS5VsPWYBBKKOT8DLKeByVkCi6zIi3DjNNLE5EREilcLaWBsA+uJDOYne+gvPLQorJokxm0eRl0eDlMkEWc6I3HC3JzcLmcjlq9DOEXoM4+D3TuHHgTWyCEAkK2THuSdrQXWUQLCaGrqG5ZibZ8Fi9++UtQMVUIsuM+DYIm+9dEBB8IMAs0xPwwW/dg954Zw/CFh61Pr8fAwABOOH0hpk2aBFXXyJNC1hA8tkcBHwI+JDLsuawL9xdkrc1sKjYyJONwWpEiqY3Ud1B64uECEZgYPGqWJaCKPqQv0D2lWwHA4iOiALiMtVKuVPWkwsCgjXE65HwsspHfwnkCtJdaMWnaDHC9Cir3grsmAZ1doM7xoLYOiJZWULEAymZBvgfyPJBUEKSs6IgUSKjGkRrXYcp9gPMisKYSJtXmpu1AomhyYMgEjat9ROKMjZ82qOoAxDauJDJENdAIdIBAB2gXGXTKnD3ikgcz6yyYGadACAE/kzkA85cPkGHs5uUA6kGA1mIrTj/tVJita0A6QJhpBc2/AOR7eKrWB6EUFMmGHy2cgzPrELWghuOznTi90A3DBkqI1KQBMdB3XLEDxYyPujHQDNRB0AbQhhAwoYoQ0ISnhnbi0eoeeJkcgpe+AvX5k2DOnwu65ASo06ZDTWyHkMIWA3a2cZ4PWR1CfdNTGD9pEtomjkM1DGCcmk9H+X8OYDPkVIHUTJXNoDgs1B5+9g/uBwOYMe94tKoCZGhHoR4EsvCQg0KWhQudsYVAOTdrDwLKmdMqEHzy4EWN9xhpydQEleLUn7QDtDFApqMVhQltCP26OGKowBFXQfliEGDs2r4LIcKYGReTQzihbTbsvGTits4Yhq98LDz7LPz+t7cA29aCTr0ShjzAB+D77udR3K67bwSMsdWWGcwGZHTsHycQQIR2MXtSIudlUA05GTMyj4JrGMCQrjV40CPVelrBmADYoKyrYGlA2qkcmS05hBNFRFUHCJjhQyM4+SJ4pRLMY3/A1s1bYmv00eOOQ6QJuQ7lvMWL8c3v/Biybzd01yyYOWfB75qObbs2YUOxDyflx6FuAhfJJqCYEOgA0/1WLChORrtXwKxsF16/6jrsC2vwyUPI1o8fRGAJfGj2RfCFRBUmDmyxr4Nzdza29/7uwFMo6xpKx5+K2gkLwIN1aBAwrgU0vhVibgjRNwixsxdmTz9MXxkQEmpgJ1AZwMJzLkehswP9Q/32SBLlBTSMJdMSM+PE/+TwUwJLSxs2xkBCYtXKJwEAx516EhhWtgx27lQulk47JaNmDSYBBUtSM0Tw2FLYQ7dN5AQQGN2Il4yyq+cGPApNipUVXAEBa/Tv7AUFnjzitADd47r2ZnNZbNu2DeVamSVJMjxCSz8Gk92ISBABhDA4/sQTQAToXesBdyZtJoWPx41CgoWKRSENWCAJsPQg2rpc6AxDkkJGZSAh7AnRWBDIGA1mA0OAJkZV1w8SKG4bzxwpSEMW/iSLQsNFU0swFBF8kHVCUhkYlUNIPpDJ20fEhuyYKzEmOdjCbxh7umDUE+afBEUhzOYnISbOgW6ZCHn8+RB7t+Cx4T2YqVpQ8jwAAj4INQ4wP9uNxR3HIccSxmi8oH02rpv3Gly96ifYE1ThCYmAbYG9onsOFucmIwjqIJKuzU68EbUxyAgPdw9uxI+rTyPLCvzyNyJszQADFUAqOwkwDsQb1wLqaoUMA8j9fZAbB2BuvgOEAHPPOQuAQGgYUiRPmNnE8gvm0XN3FkmwG7vji5AKuwd247G77keuUEDXnClgrSEhk2ApMJgkJDMEMQI39hPQbnxnZw/WW0BAgpFhBR8eaqg32ekjTGBEZHlDRJ1FsZgY2oQodLbBL+awbccOgSWQmHfoQMBfHAPItRZ7ctk8+vb1Ub1WAwtKDf1GO+dF1TB9oxtJqJoKTj/7FLR1tKO+ZRVk/3bA82JBSpwh3/BT3cKJhIfRu2qcLgCwQRMAamxgHIfdsHHAsx39ZGQGWZVDTuWgpPW4H+0WyI1jSCL4SsUqtiilJlINRuahAmRpsZkCRKkd8DKAn4Pv+SASnFjYJOKpQ5UTC0Go1as4+eSTMP+E41Bf9xjIRXeb018EOW4mnhjYh1v6t7p0JkYQhJjudeCijuPgaaCuNUJIDNcruLR1Nn5z0utxaetUaxMuFa6dcg5+MOvlUNouAJHWXjCDtU13GqiV8fd77sRQUEbm9CtQf+HLYYYDu/gjMo9wqQ+hFXGFUiKcNQmZ+W2or7kf47sm44KXPA/DQRlSyngNGcefT7uCR/eQEamxH9iNAgmaDXw/gy1r1+ChW+7F1FmzMWv2DKBm4BkJZaLQGoJi4aLq7RgzwwKesWnVPhMI0v2xRycPElmy8TXWSCUJtSFK/JetWEnE1ujkOiZGYnKqwaCcj1yhgHmzT8xjOfSKZSv0EQMCZlSmx1MSYRiISsUSSnjUorEIq4nYU6mbiNkyrmq1OronTsS8008HB1XInesA5Y1mnY1y/uXGpIiGkA0BlCxNdziooe687CPyB0WtOll8QJGAIgVteAwFXgLLCSJkYxqtO5+mkN/oiCFJWSQ5X4LOlqyxhVAY6OtDENbtTWEi8E2McswZy2EooqAEYYhCtoAXv+KV4Kfug6oOgImg2yfDnHwpsvCwkiu4t38nyEi0ySwuap8FnwU0SZBQEAA8SFSCMk7LT8Kt8/4K98x7M+466a34wswr0Go8hMwxRmILrsVY2QBKC3x0+224K9yJYstEhG+/FvVSBtBmNBOeGHH6CxuQD9Tv+C3C7U9h/nmnYeLUbgR1e5SMIP6IB4Bo7s/Rgo+NxKApJWt27ZSEwprVT0FIganHzUA2m4My9owv2UbWCxdbF1mbK47wIgUFBQ8KkiQUgIywYKGEQJ48ZEjFu7pLv4jvTEGNRGDhuA80ktkhCLVaVVQHh1ENhl71/V98/f07dz6af84XgHnz5jEAnHnBmRs8X/VVymWq1apMUjRJ2KUUn9+5AzFZQN84f3p3Iy84+1T7xHauhTRoIggaTQSipi69bjdobYenBHrrZfSEVSgSSfwWI37rGs5vRE3FHAkAyMgLD20qAx3fhhxjE4Ztu8sglE2IkAEqdMDkChD1CjDUh1q9Dh1qN66mBnwjfaMw0uyyZrFj9r+LL7oYioeh1z8KeBK6VgGf9TLQ9PmQgcZttb14eGA3Lmk7Hm2cQZ0RGbTHkexKKNRMiJAMTm+ZipML3ajqOkIISBauaCKmxIKAjPDxtZ1342u11cjVAXrD36N60XlAue52/9TsC2RXhiDrsSAFVO8wxM9vhJICL/ubqwEAITQ0WXZeKE08UotAZpNiBhqKLHwI6cGbcWPmpx5cCaMNLnzJ5VB5H0abmOYj2SYPCYM4qNYmUpGrUQIKhAwEPNjg2wz5UELBI4UC+VDu7hHJvh93cQIUdwdRhkE6BzNyUa5W+oXOG/7ZLb+Zfeu9t3/5iY3rzn3OF4BPfOITDADnLDxnX0tb676B/X3YvnEbe6RcqiuPUkpRvFaicR47NNdyzAPUcebZZ0AKgl73OER1APYgaJLemxtda0ZBscQNCD7nOyBAqJkQPfWyBYBSrWTEBYjeNOWOBSO8akfxujr9PFqUb4G/6L52u4NkCyYZMHrCYVtISu1gqVzsFSOby0JK4YxPOEGPmcdo/JuzzARJ1IM6zj3vfMyePg31B2+DZwiMELV8CeaSNyOsVxHUy7ijuht7q2Uo4cEwI4zJrsIRdQiSFBgKNQ5R4wAK0u5eJhl4G2PgiQx8A3x9971YWlsFValAveBqVP767dDVEBQf4JsEGjr7NVHIQN37AGr334rxkydi4VmnoRIOA8ItdjZpexkwAZqiKUACCiaxqxw7BXmexL6efXj8rodQKrZixoknwNTCOIQYEFBGQhnp3jPXqjNBQNqpjpM8K45GhDbnQrqlnIWHPOXiQkrWKCLWW8TypDR9FQn5RwiBoFKj6YtPx5nfexeyF80In1jzND+xdk3nc74ApLjsw60trburtSq2bN3GApIRtdZusTI3yaMbsbUKIVCuV3D2+YsweeZM1HeugdqyCpCem/83m4o35EWNaDXJ4gATZkO0TwBA2FEdAqeyoSjVvNnqL+CTQFaIsf153POekWlB3s3VLQVWwodCBhnkRA4FmQVDYFe1Yn9GxzQwJCCzgJeFDsMGfvsB4b8xiGbs3od6UEcxV8DVf/1m8LoHIfduAvkFmLAGfdzZ4CVLAX8Chk2AN27+Df63Zy3yyCBLviMEOadudwQhtgtCckRZdm23NiAjkJV59FcG8f/Z++54u6oq/+/a+5zbXk1eeg+pJCShBAg9ICIIgoCJoFhQEcWCir2FjIN1LGMvoKiIkIhI75DQOyGQQBLSe/KS1247Ze/1+2Pvc+65992Xwoj+mMn1k3FMXn9nr73Wd33Ll3c+hcs7lyBfKCB13hdQmv8jhGlpNiX1PBKSvysCHFKgW/+KsNyBs9//XrQNGIDQ8ytIX4KhyVzPToyrQ5EtB0ArRtrNYs3yV7Hi2VdwyMzDMWLsCIR+CEmmoEkrSIsCa4lN8RZRbD0THCL7dzbsxvICHCIbf+cgBwdpSoHJEKyylEKWDJcg6ha5bvda6TRJpmjohIMxZNpBKHsetXf1NL8ZMACzJibiTCa7joiwcc3amnUIo1YCzomDr+PNnvnLwA/Rr6UfTjn7TGilgBVPG0sppt61g5PyykrsV+VhE+AwRDhgFPSAEQAYG71OeNDxbS2sSi3UGqEK4YeG+5+WsveIYcE+BiCJcFBDP5t+bKs5UwxCatZwIFFSIXaERbiZLDB0nCEu+T7gFZDLNSKVSkXgFlfafaqxLac+48cr3vLGTPVd75qDHBUQPHM3RCoFIVMIBOAf/Q7QF3+GsP8AvNa1CR/ZdA8uX3MPHt+9ERoCGZlGSjiIqyMn1ICaILSEyymkKMd+GGDBtqU4b+sD+FnnMgAO6OPzUZr/bYQNWUAxWFK1lKsqFxBAyKCGFNynn4d/720Ye9B4fOATH0ExKEIKWWmjLQGM2BqMxDVE9/ZL1NXpw0FQxm3X/hUAcNq5b0eurdlsAOy+X7DxFRAMuMqBwzLOrRIc3en2/9fRmCiNHRqZEUCCkBYOGkUaGbhoElk0UhZZpJEmB2DuZd1anVNHsQgLoYLuCZkAlPz8qDcLCCish/QrKTeFlS8u41AHsWUXWVIAR4KNmMgRZbrXnDAIBPBx3ofmoqGlAcHypyDyXXFcNJKe9AlUvpIXl6BdMgGswJQGtY2GQyls9cvY4flwWcJTCuUgQIoJg2UOk9JtmJYdgCMbh+G4/mOQMLtPPMfmqA5ycxiRysFToW0dE/hWxH0AYXNQRE+5G07bcOgBYwBNoDAAWKG1f38TZRnNsgm4o0ppntwy9PVLEAJlr4wpk6fg7PPOR/Dk7UgVuiAyOVDKgVYFeCcdC/rlDcgdPBPd3e34bfdLePfmu3DBqzfjt5ufwbPdG+FZDz+hNTgMIZSEgzQKHuOVnm58b8sTOGXVn/C+TQ/g4a528OjpwH//Bf5nPwlFgenUJNVQP41NiL2iTZGUgBP44F/+EEH3VlzwyUvQNqQN7AcmQi4hsKFKaexttxWxNNkAi6b1BrLpNHo6d+Gpex7FoMGDMO7wQ+AHASSLGvzI9n9EkDoSiSHuBsn+nbQdgYCAo83mIM2EFCQEOchRCv1kDo0iiwylkCIX0tLRK/BgbePLFdt8FoBD0I55xApdPcPfFDyAOXPm8MKFCzFpyuQVLzz3Al5ZvkJs37YD/Qb1RxAGlW+b6sg/qUKSMEaPBJKEUqmEyeMnYOqso/DcfU/CWfU01BFvA5eKvZ3cuTYth6s9CdnO12MPhVz6GIpeJ57t2YwhrQdhXKoJk3IDMTLVhFYnY1s9gnCy8An49bon47SbyDJbCAHNGucOOBjvG3Y0Fu14FZuCbqQtFhCtOBVrBJqxvNCOQCm4w6ch7DfEkKSUgawGDBxQG2lRMUJkVLMO+/I8qHWZZY0vfO1ruHnh3+A/9FfQBZ8HAh+yXw5hGuiafigaFj6A9E+/A33D1Sj27MZdcjdu71mB5lQrpudGop9wwSqE4BTSbhYggR3Kx7rubdhcXgnlZJGZcgqct74L6l3vhD+kBSh5ICGrvx9OGncnujXlw+nfCPe3v0Hxnhtx7Cmn4QOXfQTFch5p6dhCqGM5dAUDrrEr4cqaNhHxAFYaDhzc/deb0b1jNy788Acw8fBp6CwXIEjGikGqOPRZj36G1AQWkbGJMTINoUFssCFmQMU8DwkXBHCAgAgCTgw8CyIUlFU+Ju1AiOvmR7FlL4r+LdjlB1i3fuuIN0UBiDYBI4cOW5ly3KBcKjilYp77iTbzrSZNHLl+lG1EjYx+NKFSaG1qxtnveReef/RJ0JL7IaefglAkEmESBzNpLE/RrRC50xBBhwH0yCng1mFwd4V4YvcaHBQ4uGLGeUiTBMBG4ssMzQT4RRyWbsPkXH+8km+HENLYYFl/kwbHxUdGzsIEdwAGDzwcj+5+Dc8VN0FKF5IInkWqN2kfG8odcGQKwahDoTOOwZi7tgAARo8ZEx9ao0+kmFVHycfEPnBc9+AnuwCJklfC4dNm4PwLL8D1f/k9Wk8+H8UhB4H7pcAtKaBUQKGpAe5/fAep8y4A/e0m5BbdCbVmGUqFHXi0sBtAFpIycN0GKH8nAhSRSbUhM34amo+6CP5xJ8I74kiE/bNgDxBl33ZoXCHAcB2hBQQ4VJD9GpFbtAjFH3wdTa1t+Nr3vgXXBYKS3Q5Yt3wtor6+IgRCLAJLkLcjjMI+CKmUi0K+Awt/9Sf069+C49/xdihBcJRhNAowSDNCS0KrwDCGVCU4MmYxTEFpH2BNMkYdHAgoUsbFCjbBWigoVvY5Mb9X8/EopiwjqbOIJy2DBehQU+v4oeQ5IRSpAczsElHw//UIEG0CLr/s8team1vWbtu6gzasWceucKE1xx0serW3iHe5zNUrQxICZV3GUcccgWxDFuGGZZDtG0EyXYWQM+p4BcZy0KizMJz9oHkI6LBTQBxCumnc1bkKS7o2AVLC0wxEWQAgBGC0ySa8Y8DBYABpEnDIILzMjC+NPQGHNQxBt9+DFGuc2u9gvKN5CnKKEKoAUjGEk8JT3WvRVeqCM3Q6+OCjAGg4gsGbXwERMG7C+IQLEFlDjToqALIU4975RXU5gkHo47/++8cYNWIkSrf8FA1CgQb0B7SCcASgfJTzReQPmYHSvP9A+Ne7IP5wJ7KfvArNb5uLxhNOQuaMM5F95zloOu8CNH7uO3B/ejX83/wJXfO/jvypJyLIOeBCGaQDs6Wh6sj0pDl8/LcqBDVl0fjqSwg/fynCnnZ89gtfwREzZ6BcKiJl+QhRUInQiAk0gsjq9ysafSLAYWMjbmqMEYulhIMbf3kNura14x3vmYOj3noCyqUCXBGh/eaUS2ZIrpB3qhvTyn5JQlTGEjsOmI/jmJ0POUiRMBgCmTRjQcJ8P5b0Q3Xk8Vwj/yICREmRmw9Q8ksDVvVsbf3/vgOwSSqCiIpHH3PsI4HvT3zikcf5pNNO4+pHInHjR5KzBCuw+n8yfM/H8KHDMW7qBCx96CmkNiwHj5gE+CXLCqzEQVUfl2pdPYMAIQ1pZOYZoOfvgbP9Nex2Q3xj9UP4R/MopKU07aat2AQHWit8eOB03LB1CdZ7PfHn+OrYE/CNUaeg4HuQwkHIAFhhessIDM404Y5dL2MnGKu8LqwptMOlBtD0t0EPaAP8MoQOEOzcisasg0OmTo0BPKpcmFyFbiYGHOI9JY1HHY9RVg5tG4xfXP1bvOP0MyD+3A+Zn1+LwJVgvwx2HGNsWy7CYwADWiHecjLEqSdDegBUACUlSjaQU1vBIgIA+VLMyoxa/mp1G/cKD2UQoEMgl0G2fQfCz34cxU0r8fZz3o3Lv/Rx7CrtRlq6YJjoOOP5F4WHUmULEYG9lkdkNmvKOAlZEDSbzmLd8pew8CfXYMoh0/Hej30MJc9DSjimNdeAox0oUXEVErYL0ImvnxPeftp2GtKyDdkKywyjz7E0JECRgLQG9QRCljLoRhlBHAlWwXSSJqwg09WwYuT6NSHd1oCUK3JPvPho9k3BBJwzZw4BwNgJY+8VUuKBO+6inkIHpHQtkcuIdCI2YFIUoYUBBkOyai+7MtChQnNjCy689GITDLLkHjhd2wDpVNpjqiYY9QIHyAaCQgIKUNMnQn7oM+BQI+WkcF/PJnzzlfshkbLdiqFtChbQSmNCqg03TZ6DDw6agdP7T8SvJpyNq0a+FWXPN/tyFpZNZsg+A9ONOH/IIUi5AnduX4HAK8MZPAU48mRo7YOkC/LzCLauxZhJYzBy1AgEvgcposh0Hf9Brf1ZbB5R01rX0K0AQDoSxVIBZ73tdPzmmqsRLr4B4eXvQeOuLqCxERSGBuiyPoUUhuBCEWG+CC8swoNCqMrQ7EP5JXDJA0o+SPkQ0jUEngTViyMRFuv4a47/Q2xo0JkM0j07wZ//KAovPYZxEw7Gd/7rW/A5sEEilXUsi8rN7kSrOcuvECwgyIG0LD1B0qzk7PumHYlr/vvX6Nidx+lzzsWYCWNBQYgcuUhFaz8BswUA4t+fiAlVFgdKrIirqrHt1pyIQEaWQkyOcRciYXIjIOAKB1knXZGo1/qC2JYiIhFBaaSaGqCactixtUN29nS4b4oCEOEAH7j4oqcHDRzUs371Orlz+w52U45lblXoM8nbQidGgiRRjGHAtu5yHqefdQYOPuoQlFc/i9SKZyHcjBGi1I3GrFm4CAEKQpBLkIePBo/vD77wA3DffSm4VISbzeG/25/BdRueRcrJQSnrw8cEwIHPwBFNY/CHCXNx15T34WNDjkI59MEwD41pOy2FRjPCUKMx24RFpQ50+t1IySbwKXNQHtgKKAW4LkTXNqB7KyYeMhUtDS0IApWIuYx+AInUvISR5p58AioEG2syISTyxTw++qEP45d/+CMKD/4d5QveioannoFobjTotmLr62eSj0iIOL3HZDpYqa7NToy0GNWi5L4Cy+xvWwWgpiyy7dvhXvZ+lBbdgsOPPBp33XsnRo4fDt/34QqnQqBKHGZJjrVpM3t4CYJjW3jHavhtEw5mjcZsI15eugRP3/8ops04BGed806U8yVkYKjYaS2RZsfIfEHxHxkLwSmxbYl4gLYYUILwG3kBEMfWYSJildoVo7T04iaZQVo6MV+j8tEr+gCRYAdKSHBJQSt2c7lM6k1RAObPn88A6PTZp29oaml5sZgv4eWlL7GAQKh1PAgIrtBWk5vvWmKHJoPEBmGA1ob+eOt555oysuR+SK9gBRbUB1U+emgFhOdBDmqCOPFg6DEDwEqhrEPgiv9E6oyLIUpFiHQKn157F/6xYSnS1AQdAsqit5IlAsUIdYhAKZRC35BEKwR0QGuEoUKKJBzXwSdeW4zbd65H2hkCmnkh/CNmg0PPml4IODs3ASBMP+QwAALKuNuD9xgf0NuGsi4gWLMmcGwn8JEPvh+//O1vkdnyKrrfcwZyf/4L3HQGlMmajYTWdVwHK/mN1Ht13VdNivn6CI0xh2xtRG75i+BL3oX8Y/di2qEzcOMNf8HYMSPhFYpISyf+eJKjg299+YjjguAk/t5BJCWIDh7DIYmwnMdvv/czhAHw7g9djLbBA6EDZbj7NsA0RRIpMgXEbPHN92EMP4QdM8wXZMhAdi2oYQqTZUSyLQ8i8ROK0pXBMAWABFJw0CRy8ZhXSxNO/gY1FFxHINPSiGJQdNo712feFAUgQQjSk6dPWpzOpPDA3fexiojj4EgQVZm1ODL1rubgRwCXBiCkRCHIY+775uCgQybDW/UU5OqngVTW+MdH+1+u2I2abFGG1Bpyyhjok6Yj7JcDwtDccipEMZcG/fhquBdeAZTL6BAhLtlwK/606WmkOI00XGgmM99DmmRbkkYIqg3CqzRDqxCCCQ1OBtvDEj665n78bucLSIWAPO48yHlfh85ayaxwkNYa/guL4RDj7W8/o4rW0EveFBvo9z5p1ItEyb2E5vF+WQoUinl8/JJLcM+iRzBueH90ff4i0Cffh/TK5XCac6Bs1mwilLLiqFjOYuW+FVJOtQkmx22smfU0ECpAuhBNWaQzaTTcdD2C956B0tLH8bYzzsDiBx7A6FEjUcjn0SCycFjGe3URCXQ0V4oB7G1vgTfBMqLqQNrVHBRjYLY/rvvVNVh08104/MiZOOeCC1Hy/Ng5yLyfubFTLJEm13YPFB8gQbA034pWKSqEkglSEVxlvrbk6Cns5RZ3Azbf0IGEIImsyCBDssqEhuzuklBNQ4cAuVICZZY71+/MvlkKAOZYd6CDRg2/13Uc/fgDj4qO9u3suk68oNE22q+CGFPFlCMxO8bdLBE8z8OIoSPxoc9dBqUD0KN/h+MXUUkdi36ottMIFYQrQMdOgDp8PJQASLG1tSGrMAuRZwX9g/9C9vM/REY76PALuGTLXbh03R1YXepECimkRRYuHAhtYqm1ZrgskWMXOaSRoyZ0KeCaHUtw7mt/xx/bX0KDaIPztvcjvOpbKE0bCXfcQLAkIJVGavd2eC8/hmNOOBrTJs5AqVQGCadvD/kkf5r2JgyuXa1aJi0TpHRRKBYw64gj8OiTT+IDl34cxVv/gvw7j4f86ufQ8OIS5LI5yKYG46+glBlZlDLAKLNR9VlvAPPfibeBADkpIJeF25pDrrMdDffdAXzug+i+/L1A1zZ866qrcPNNN6GhqQle2YPrOFatV5mZza1rWnwXAg4b8Y1D5v+X0f9PpsV2SQKhQmtTE5Y89zj+8ss/oX/rAHzs8s/AyaYQKmNSGlqVINkHT1iPhrTFFxxIOCxt0bFU4AiYtVoLaWXQwjp4CFTGIeOuJOBoxAxCSbCjhoTDhAZKVScXcFRiK4WGGHAcFy1tTZzOObL/4AFN+3L25P8PBWD58uUAQE8+/vSWv95w/ZmvvbJq+KQpU/SMI46iklckxBFKFDvx1j7HXMuGs5weT/kYN3kiXnn+Bax59gk4Q8ZCDZ8EhL7ZG0dxUaGCbMqAjj8E4YgB0KGfmF8poRY2nz0MGPK445CafiLEqy9D71iPp0ubcWt+LV7s2Y6yjZNyyKjBAAfbVRlrvC48U9iOP+5eiv/c9jCu3bEUO8tl5IZNRPCJbyL83OVQDRJc8kCtjUChCPIB57l74b94Pz7+6csw+/iTUfZKkJL22FInQ9XrJk7uNZGYYqag5/toaczhvHe8A8fOPhmbX1uBlTf/Fd71vwGtW4dMuhFu/0EQzY1A1gUcByDH9mkCLFyGlIAjQRkHlHUhMy7SxSIyu3chtWo56Pc/Q/Erl8BbeDVaNq3ErONPwK+vuRoffN/7EYYhlFKQ0ky9bA+miCXVOl75SY5WfhSLbGRMyjT/BsVoSGexa/s2XDrnfVi7Yg0u/9pX8Y4L3oV8Pm/SfRJtFsWGnxwfZPMZdVwgJCqbpSiFuEqcFTkOEYyxHEV52BFXADUaCDZqUUEoc4CQVaV7izAB8zIrR1dg6yPLuXvFVpHNpO956bGXl/7/nw1YOcqSiIKT3/KWmwQtP+L6P1/Hp51/NkRKWrILEbPldzH3MgyNGF1cvR01EeJNTXj/5R/DY/c/DPH8fZATj4GSKbsTIpACKJcGTpiGsK0RHIQVN6HYlSU5r5lTVyiFSL3lJGSnPwTnhmuR/vu12Lx6Ca7t2YI/tz+H/uk2DHWaMdjJIkUuVnpb0YUAhbCMQugjJXNIjZoKfdw7ULr4YgTjhgCFMkibr0sBEGOHwH1hDfzHbkXbwBa87dTToZSCEFS9MusjLKgqbm6/okWr31hKAc8PwOzhtNkn4YRj7sQ/brkVf/njtXjm3oXYcfMfgUEjQdNnInPYUZAHz4AYNgJhrsm4LikfCAOIIAS6O8BbN4GXvwRv8V0obdoI5NshAUwePw7nfPJjuPTSSzB8yBA4joOefA+ktOlIcYZ0ItmJOLYIZNZVmYTCev+x5jj8QymFlJMGSh6++anP4NWXVuJtZ78NF37o/cgXCubzRAQq7k3lNvx7tqxlw+8wWyizijTUZWFjz7T9ek0mkNB2+ScqMTTaPrxmPUnWoowhyXQZKRBy5MKnEMmwOKqRyhOAdFOavZ4iyqFqfHOEg9rXvHnzeP78+XjPpR9YuHr1yi8/9+ATTY/ffz+ffu756Mp3kHCceg+3eeY1gYWumouTD25PvgsnnfFWvOsjF2HBb/6K7It3o3zU+WCvDJYSwhEQR01C0NYADgLDTONqunGVHbONKhckEBQChE2NSH/qk3DPfS/STzyAzFMPAY/fhUJHN14VRbzsbUe6pT/cjIMwcOAMnYzGyUdATzsWwYknIRg7ANrXoHzZRlkbrzqtFGhAGzK770Ln+hfxnq99GodNPxw9+R44jkzUJ+pjs5Hwk6O9xyL2jqGs9Q4gkJAoFAtwHAcXzp2LC+fOxcatm3DnHXfg/tvvwNLnnsaG+29GHFSfyjBaW4DdHTaBOaj6bGPGjsWwQyfilDM+g3POOgsTxo1Dc0MjAhXA8zx4ng/pSFBthxIfGI5BMzBDkTDBHxZQjDsEYfbvWmu40kEKwCcv+zRu//s9mHbkdHz5O1ch1ZBDuVQyhKeYc4LYSCRyUeK4BSdoEhCkY3agA4KyX4u2DFAVd6/GP5DIrAKNnYVhBcLqEEx3QPb70UiZhSMyIgWp/aS7IWpCLwEFcN5Hti2LprFN/usJkf93vwgAzzhsxm1Ll7x41hlzzwl/dO1vZKACivfHzCw0VTu4xEEJtZlxloyhNVIpF7vad+Pdx56BXbs8yIu/B3/gWLDvwZ1+ENT0g6ADvyIcSqr5q5w9khXYzJ7GnkAZnkFKQIZAessWYOtGcKEITQRHSoh0Bn66AWroMKgBrdBpgDwAQVBlzlFZgynkGnNQF58N+cR9eGzJc5g6bjI837O3Yb1Ln/siXVElhIL243GoH6fMgClQgpBOZyCtB8Ku7k6sXv0aNm/YgBeee4EFEfLdnSiUAwwdMQKplIvmpiZMmDQJzU3NGDP+IAxo7R/PoiWvhDAwoKsQov5XRDV+fomINm3d3lVEgeLKkWFrtNKQymDe176EH37/p5h22OH4zQ3Xom34cJTLRUtQSgLMCdEwIeHKB/hCx27DNmvIxttoaJtcrQiVlKGE9ZiChicigZuGAhCShiLjYsykocAIOIRPIcocYGfYgzKCePXH0CAyLgIIGdmGFC/79W16xW/vl7PPeusH/3LVtX9803QAFgwUCxcuVMcdf9zV69auPevOG28Rcz/8Hsx+6+ncne+KuwAlIkvn3kIB7hWIab3vvDKGDR2OS79xBf7zo1cg9fg/IM/8LLh/EzBpJLSq0FLrGYnWN9lOFAdBIK3AhQAhBMIhw4CRw1BBMBPvqgCEGgisu4wQscFJDG8ohVRLI8Rf/4Dyw3fhqp/9BDMmHYKeQg+cGrnxvoB7zMwUuYDuf03uLaAiQxoCE3wvgNJlkCA05nI46rCZwGEzce455+31o3uBh1KpANba0mqF+bhVMaBcYcFB9Gl7DgiAojYclbRpe5sHgUa/pn648bo/4off/ykGDBuC/7r6VxgwYhSKxW440onR9uryUhO4YmdORwNaRrOn8UyMWn2DR1RCbaNNSEzuJQmHFZQ1K2USkBwRoKgSX0sG6nOYkCUJX4dx6EqtvjOM8DEOsXP7ztSbBgRMgIEMgJ5+6unVN93yj1O3bNo8MlSBOvUdZ4lQh1ShPVUbPHJVJH1ybqu0R4KM2OWoo49C3vPx9I1/QrapPzBnLvzGlJm7paiW8dZGNvU6PFQt1CSyaz8yduOhMqstFRrE29qQx3HWVMvyjmidCrKxEbnnnkL3R9+Fs859G376g/9GT74b0hF7oPXQnqOlaruBvXYAXGd5SNXyOQtkmdBSAiuNIAjgBT6XPQ++78MPAgS+Bz8I4Pk+fN9DEAQIwsD621L8/tgTXZn6gjKS4d624gqu0hTpUGNgUyvuvfc2fOjij0C4Lub/4L9w3FtPQk9PV1xUY4c1rkTVE1HcYxAia3ezu1dxXHe1NwvHDFNr9wSOPw7Zdl/XdJXmARZxEaguQcbmrMRhYtiL6zmBTXjMloeXccer68QhM6fctXTR0mffFGvA2q+JiIIpU6f+MpfL0t0L7qTlL7+ETEOOtdaVHV9sBsJVFl1cNzLb/L0UEqVSAZ/+6mcx7diZKNz+I/R7+Fak027CWrv64a4bwJnIGOCa2YMiZFfY5bAwyTVxko0QVbFPFcY4xze/yDUgs3Edej71PoweNQDf/vYP4QUlGE8LqioYfXYAvOdu4H8M2dZl8nBkkMpSCDiOY/5ICelISCnhOBKO40A6EkKKhKVa30MI9XI2oj32K8Y9t0K44lChubERf71xAT71icvR3dWDr171Hzj//Regq7MzPvxcxYmIaShgravKtOaYdpag/VY2ARFFOPZLZMTmLxFV2GAYhh8itYxNXQ3HxawN3YTXIEEiJVy4lnDUi8vBhrquAwXlhSDW/KbhAdQ8nBoA/fHq3/996LBhL4dhIH5x1fe1KnlAZBle8QtDJKNPiPliK+jYSRiVTMFQM9IpF7+88fcYN3Uydn/zI+h3002QzWmwVlbHTX0croQQKRHVxFT5t7h6U3JFxwnXYdQc0gqPAVoBmTSyPbtR/vTFGFjagbseuA+HTJwAL/SrEnq4rq0p1Zwa6sPu1BSB3oWgWhvAey0CXKVLMzM4s06anNazYYs1AKj7FlTnO9pTkaA6w1k0I2ut0a+xBb//3dV4zwXvxs6ubnz3Vz/H+e9/H3Z3doCESHgBIo43EwkSU7Ri7mUel3Dqjf9/bcxBjNGLiA3jRIIknPw+JFfowUyiqp8xMeoJC3oYNmKNjtU8fcJ0nUFg0qiL5aL/piwARMSYM0cQUXHylKlXNTY10v0334XnHn8KjdkmDpVKUH4scMbVAhJNlfVK3MrZw+cIiaLvY9iIYfj5n69B67CB2PG1D2LgjTcg1Zi1oUOqpr3HHqy2+wg0pYr4o7o9qKbfxh2M0uBMBplSD/xPXozw+UX4zk9+ioMPOhjdPT1wyel1HHiv2Wl93KZc3Q30VQxoj8Agx0i51szafIQ6vQHVL1B1RhTeB7ya6ha96tWYAMChhgChsSGHP95wHT73hS8gk8tg/ve/i4s+9lEEyq+sjiPEv+q7SxQpRh9RaxSvBIUtApKTDr8J6zmu9pBETOKJqO4V6zbzfjpedxrBkokaSyWeg0rGgTUTFRJuOkOucNCvX7/8m7IAAAAWLlQAxO233LJw2LBh9zFD/vSqH6ierm4Ix4gmWUTVgqtsuHXNwSCKEmgqSnhXSvTk8zj4sKlYeN/tmDp1HLZ94UL0/92vkUmlgFQawlhu950jkMh4r7rKosocmZQQ1+0ikrcjhwqUyyLb04nw8g/Befx2XL/welx80fuRz/fAjQJOkjWk7rHnfdrx9IUA1C8GXNdIk202kXlb3kurwH3Jj+JSRvuykiKqiY6t/3GDMEQulwO0wEUXvhcfvPB9cB2J3914Hd7x7jlo37mjcuvWgApcYxYayW3Juv4kIZBovxD9ikXEVQdZem/FMDZiBxrfRhMGEo0FsNbfIu4KjFYAlhnoWKs4IzZ3EpYvkRcEV9yN/YB0qDB00NCuN28BsDJhIlKfuPwzXxk6fFjw9EOP0x0L/s5N6SaEKrSIbyVljus91RyR+SL2WEXx5jguugs9GDl5FBbcfxfeNfdCbPvPj0Nc/l607tgMp9kqB8MgTmpNOIhWF4UaXUHdsYEYlUwXDWYFCkNAAU7/LBrWvYrgg2cjeOBmfO9nP8GF77oQPT3dJuEmCXIlihnVHQf+aaNY3Rd6FYnqo0t9RJFwX6KlPaQYVwOP2EPjXynVQRCiuaEZq1evwTvPeScW3LAAYyaMxa+v/xOOP+005At5uMIoBAnVh5mTPOjaz5PIXkBN7ZcJvQGi0GIr/BHMVhRUGUyYbNvPXAMjVycGV9u82wJA0oCtVH3xQRoPQl0MSboydHLp/Ju6ACy0XcDll132XEtrv4VCkPzR1/9TrXl1OTfnWlkrS4sUgqoaw8gE01ZVZoIibc0bEFNDCQRXpFAqlpBqSeFXN16D7//sZ3Dvvwkdb5+J9MIb0JhOw2lpALkOSClQqBPZBNU6hMqToeveTIg48aECAgacNGRzFrlsCpm7b0P+7OPQsn4p/nbLAnzyY58y7DdHAlSN8vMejz29gURNBvYye/f9VezJlLR+P8M1duD1gmKSib4MRqgUmhub8eIrL+OC974XD913P4456XD8fuFfMOukk9Hd2QU3AmO5do9DdccnoSt/SFuXZW3KuLJXtgBBqIrGX1plnwAgtTXtjA94JUkopphXfRUVa7fqn56wBqOItQTECcREE8CSt7y6HiQRto1oK7ypC0ACrabv/fd/f274qNHrdu1odz9/8Sf0tnUbkHWzDM2Rxpqod/pWvGYTVFsgOJbOC5IIA4VOrweXfPKjeGT5y/jKpR+Ed8V70XP2EUj97UY0eR7SLVk42ayp5GFoV3thZcUXhsYsIwiAMDCMt1DZt9WATIHSachcBunmFBp2bEDqhj+geNaRyH/kbLz9xCPx4KNP4Pyz5yBfKBj2G9E+H8T9yAT+H/5OqvlRte08v07+F/U62LoOgaL+z0IrBQmBplwTFtz8N5wy+y1Y8tSzmPP+d+EXf7kBI8YfjJ7uLriuU8UroH0Zi2JTLqqhg0R5FVHUuHmmZKTtt4c7wgYq0V5UrQiM3Jrs4Y60LoIrkl9iYTdNxvtRWrAwojYzGEIKlLo64XXshnRluegVe96MTMC+uArqAx/+8OybFiy8J9/TLU854y30q3/cQGVdNrbhEfocESGo7pbezFmRyg1mHefAMXtsCJDSaMhl0YxGPPX4Y/jl936Au+65D92N/YAz3oXsGefDOeQIqNYclI2oV6pqKRFH1ketoGBAhIDYsQVyRzuwYytKdyyEumMBXK8Hp506Gxde8lG8611z4MJBvmhovrT3Pdy/5dfHCaieXgePqK9HsPf6lmOkPR7vqJLiHDH/VKjQ1NCEglfAb67+Da745BVwMsCXv/V1fPSTX0Sh7EGFPqSQ8X6/li6mkTCX5Tplqc43Ggq2F4io8pNmy/oz0WTW0oata5Vgy/JjBFYMxKwR2IQrRSZtyfg8aPgCCOwBDxCghBAlCrBL96DIgR19mQQzXHIQ7u7Sf3vbV8Xo1kFrlz7y0kwi2v2/oQDEReDE2Sd+6cnHn/yu7/vBt3/9A+d9l16GnYV2chwHYUTVYK7Kf6H4YRUxASP2bbfdQSTbdEiAWENqRlu2FSlIvLp6Ff7+l+tx28IFWLl9N3b3GwqMPgjOuElwhgyBM3QEVMEDZAqsQqDUaWbRfAlq83rwru1A+w5gyROAZ7qyUQMH4PR3no1z5s7F2099GwAgX8zHyru9/3K4PjeB3viawfv9AO1PX0DxoMO9E6SqXlorEEnkMlk89fyT+NSnPo1nHn8Gk2YMwZX/eRVOPO1CdPV0G2/ACCvi6ri5ZBFQ9qaPxDsxRcvs4qpdpFHJp6AYV0KcZxGtnwOh44ITWhpwSIAmZf/bWMArGB9DE/KiEYoQChoBWXowMxRplBCgSAF2cwF5Lsd7L6EZLkmUO7rUTWfPl0cOGffcg7cvmkVE4f+WAmDOLrM+atZRf1m65MULm1oag58t/INzzIkno6vYScKRcfVmaK4YhtpWj+wMpRzj6pp0zbVrFhlJSSEgFIFIoSHbgAxS8BBi7ao1eOz+B3HPLbdg1WsrsX37dvSUy8iHvdOYmxyJhoYsGhoaMXDwYBx+7LEYOWokxo2fgONPOAFDBw42B9/SYKWUqC912hPld0+rtTeuaej9oWgfywPv4WPtIzkRjDBUyGayUNrD1b//Hb78xW8i392Do46dgV/86fcYMfJg7O7ugCscS6tVxqvRiHDrfg06pg1XG8MS1fdcIpA1PI2sq6kSemr/byBUlXO1slx/BsMXkSagog0wKcXadA6kEUKbzsH+fYlDFBGgB2V06QICIyIiChUaMllsfOTl8PaLvuucMfukRbdff9fJeDOpAfcBDtCW5vvxSZMnjV25YuWsKy76WPi722+Qk6ZP40IxT47j2PVU5NEuEsCc2dGSqGzQq7zawJBaRn0cSBJcdlEueShwEVIIjJ9wECZPmIgPf/xjKHoltO/YiY7du7FzVzsAQjqThR8GgACGDx+G/q39kE6l0NjQGIeKAkAQ+sgX8pYYKEC9BEjUR44x+iwSe71xaY++Yfv0kfd+axDqJq/sSa+8D9WGojFPazhCoqkhhx07N+KTV1yGhX++HamMwGVXXIzLv/Q1pHMD0NG1G659FqIZPmKOxA7SdRCImF+fNJ6t2rpTrykl8uw3yxmdSIrWNquhwtkXTEYMZC3MCJbAA21lwCaLQkb6eGaoiDWoTQS7EBoplkhBIOQw9gVgMLQIkW5IwQuCzXgzBIPsL0Fo3rx5goi6Fi9efN6nL//0oheXvDjxQ2e+O7z+oVvkuPEHc0+pi4x0NGrsYc3DZCJtStktQIK6mvgVC66AM4jWNfb9y2UPUGXTMUiJYcOHY9TI+jFsGhoqUNCs4ZXL0EpX8d6llH0ccNojOr4vh7c+ckd9OANRH6Ac739PUOu3uB/0nr4hOCv5FRLZbBad3R144OF78aUrPo+XX1qF8ZPG46vf/hzeed4H0dFRQrlcgOOk4rVjzXGslpEnNruCI4pvxSVasIASNV5pFrSLDWgS1YKid2aOJoc4ZIaYqy3YbZdA1mWIBdm/VRXQMWKT2nQhsiYnLgRS5KCkgxgwJCLeuWknmhoaMXLIkDX/6woAAMyfP1/PmTNHnnTSSVuvuOKK87s6O+9ct279yPecck74g9/8VJ56xlm8q7CLHNeNhDVEGiwiL7EIVeaEGIcqUGFkShl5vUXWY9GYJ2C8Bs0MytCeBz+a+awdN3FCThr/Ao0vQcwi4X8RiMc1h7yuFJj3aT7kfSpKdXwHeG+OQ/XDWjQbSlfKSUG6EoV8Ac8seQZ/XrAAN/3tr9i1vh0f+/Rl+Or8b8J1s2jf2QV2ACGceM6P6LwM9ApIS6YRxESemFPCvXiQ3Mu8tBodNClAIvFztvAiRwc9GSdPiaWuNrbo0CBh7OJVkiDFJmNI2a2VGVElXLhIcQBmO9ZoRrm9G2OGD8HkCQdt/F9ZABL8APnDH/7w5Tvuu+PUL3z2S3cvf/nlsZ/94MeDa/7R5Mw65iTeVeogR0r7O2IiYiaNhFNMxdmH7GgAIkj7w65wewyAFPG9udqPAlE6q3l4JBKpEAn5KlArL4320LTPwznVu7f2o4BwjYpv32503qs3AFULj7hejdhTwaml4RllPBGQdTMgR2D3rt1Y8spy3LPoEWzasROlnjyCHg//+YNv4pOf+SK68kXkywWQa1ZkOiEYqjJw4d4CKU4czHpUaa6JI6dk0ErcJ0WtPuKMysi6zqn6DYuYpxrJeQUA0sJsFJggtMEIzLaKoCEgSVUU51ZsZOjBRvpsPAGAUIfIb99JDSzQkMttwZskHfj1vhQAeeZbz1z5zrPPPm/ipImrd+3Y5b7/zDnhP268AQOzbUyKITTb9FYZX/PChjdEHG7HqrAcKwDpRayJDHYja+I9CASr299kVl/1Jpm4DlGo2jK3j9l+D/d0n8JA6s0ffp22YH3/G9VRS+7bDsHaZ5hIdMdBY7YBrnCxdsMmLLjzbnz/6mtw0933QqTTmPPu8zB1ykR07+7B7m27oUEmtVc4sVxXUC3liHtZv1e0+Yn9bS19nKjKirtWg2CKg6oc5GgFSAwtdHwZRJhCb7FTlCzMcJjgcuWzOAxIe2HF4dJx50hVq1NFDEhCobuHdVdZpLNZPX7SpG3/azuAZBGYM2eO/Pa3v73kpZUvve3d5777xuXLlh/xsQs+FJRKRfn+D34YPX6efBVCiPgXSCBzjAUITNpyAhAH6/btPsMVmSnq3Br7CG8lBR993dS8X0Bbwr/gn77f4b4/3359lN6JhAZs15AEuG4KJF2079qFZa+txLMvvoTNW7ej5HsYMXIEjjz6KAwdMhC55gYEhTzSmSz+8ucb8L5LL0X/ocMQ+IGJ96phFBBqYuUINVqC3uwxTkSTk6bYQZoScGL0sSoU38r7RFpIRGlN1kRUQZnMisgJMLmeZg0mAVcTWIQgMJQQEKyqbD/IUoAjmwpJgkLWcBwJr70bHS+tpSkHTes47fjT/k8UACxcuFDNmTNHTps4bfWddz58xue/+Ilr1q5d/Y7PXvxJvfTZF/R/fv97Ipdrpu6eTpDjGu84tgoi68IS58WRSYqNDD8rxi9sZZ20RxCe92X+5X1z4aX9vZmZ93Iu9xdziGYese8NAO/9TSNAD4Dx5Uu5KPkeXtuwEU88/wJefHkZegpFpLJZTJ1yMMaMHon+bf0gHQkv8NGTL2DE2DGYfMhUvPjss3jisYcx530fxG6vDBfCts2wHnw1QGKviYP2imn2to83QGHSD4ISEgFKjHbJiUOQgfaqQtsjXzGqfG2GkEYIoxGBTWZgtIsgYvuMwtieCwdBGMIREtyRZ91ZRjaT2Q7k2v9PFICoCMybN0+8/e0n7gRw9lveesZ3n3rikS/94RfX4LnHnw1/8NMfyeOPPwEdXjdUoEhIB0SCNDHHHXciDCMKDhUgkGbDCUgUhV5niuuD94Rqf4J4LcHU9xwcfyxdc6j24eDSnic97mWjRXvZLuypWHEdCIL6ePPI8kTDgYSbcgBJ2N3Vg02rtuKhJ57CqtdWoxyEGDNmDI45ZgIGDGpDY0sTwIwgDKH8ACQMB7+xuRGTZ0zF0ueew5oVa2KaN8cswep1H9VIfaO1Yhw9TxVtvwaBBceef/VasSoiMfX9DBDMmoAtFiGgKlHfnIxCr/7NRJRgTYBO4EtRLDkExUS2SBgkpEB+w3ZOp9Po19J/BRF5MeiAN5El2Ot9LV68mIF5AliMtWteu//d7373Mzvb209Zveq1lptuvFFt27aFZs06hob0G4JyWAYzkxCCBBHFPvJMsThDWG4vwazsIrNO6rM951hlWJ8iyzWMNtqHtV5fGvr671pNqElsNaiv472nr4H2PG4kq1xfVCU2yDSRQMqRyKRSKAUBNm7ZikeeehY33HoXnnp+KUAS06dPw7HHHo2p06ag/8A2SMdBqEIorSviLvtNpjNplEsl3Hvr7VBBiDPPOwfSSVW4uInYOKqrnuA42wEJNyJdI/Wt4gcQ7ZW+RPUQUIE4sJZRCZjhBBRdtaokHStHNXTFUNR2BCYIFwihEJJCQJpCDiEE+MVbHmFa3SlOPu6EPz5416JHTzrpJLl+/Xr9v74DSCwJI86G/POf/3znpz/96ZMee+Kxb61csfLdv/n5b/HkY08Gl172MTnnvReSm8mgUMxDSAkpJBEzEyqKomi3KhPJ7NUusdSLHFIPnyfqbTTR94HnvSAJe0Yaej+i1Av1pr3IcXg/TEaTcw9TBQTjRLZg2nUQaKB9VzuWvPIqXlr+Krbv3AkFiaGDBuOgw8diyJihyKRSUFpDKWNnBWF341VlyBRRrTSGDhuGlOvitRWvYuuGjRgzeQpKXrHKdUcn5NkiEald65YejSVMFevu5G+46m1QqfOVt+u9z+AaANm0+hXjV0rkn1OiE5BKQkuTeg0AkjU0EcJkEAjruGoZw3CCwxLl7T3EipAmdzkADBo0iP9PjAB1HkkFQP70pz9dBeCCM888c/GTTz0578UXlg6+7JLLsHDBgvAH//1DOePgw1FGGcVC0ZjlCjNDGiOGqPVPHn6qaqN77cVrzi/XtPC8T+eZ94AP7Ovaj/fprq/lwvWG+6gPa+SapBt70zMY0jWefwgJHYUePLXyNSx95VWsW70e5VKAUaNHYMb0GRgwdAja2vqBCAhUiJJfNhgMRWtVqqPWozjubfyE8Rg9bixWvboSmzduwEHTp0OXNQScSBhm9/lJ46wEkJYQbrEFdw1HjxM/bU7oASo7Q0PsEb2BzRrKcJzew+YGj8BAHfna2tvdjB4mzERJgEmCYKzpdBz7peMQEROEasouMcN1HRR2dfGuVZvlhKH9valTJqwGKqnb/1u0AK/nFWdG3XTTTSO+ddVVX9uyZcv7dmzb1tA2oL8697zz+EOXfEjOnHkkFBilQhEAkyTBUgiIXsag1LcZ5r6AbNQXQw//BJnEnvf3tK8fxYZSJLcV9YpPJEElNtbgrpuC0Bpbdu7E2vXrsGnDNqzbvh3tHV1oTGcxcuxIDB48CP0H9IebTcPXIVQYrdBE1Y69/gYiEuSYgpNryOKLH/sk7rvtDnzuq5fjC//xH8h35UEkEyBdBYTRcWp6hbdR7fxDCXkvatyHK5sZBSvuoTrdFSV7leoCGRBiEpois/PXotq2zheMUBgeBFtFYEiMEAwfjBAKAYUoQ8NHgLLwqahK4Axh+4uvqb9f+kM5e8JhL99y3a0zicizLvD8f60DQBUb1+Ic559//iYAH//lL3/5iz9d98fvLnnuxTOv/u3VuOZ31+jLPvkJvvijHxTTD5kBFw57qozAC6CYTVdAlQVQr73S/6RR4X1B0Gnf2/HXpb+rwNicMJmqZyRKDGgEIGFu+ZR0oUHo7urEK5tXYfWqNVi9bhN2dnSibeAADB0+HFNmHIJBAwbAyaahWCMMA5Q9r4oR19vPgGoGGaqCHDRruKkUjj3xeNx32x1o37IDkqQ1h+Xeked2166jNl4paDYfx/APIpqw6QSENNugKBqustJDPMPXcypjTtiFoxJRx4mfc/K7MzLnGvsT5oTpFFWs0hKXUBQt5kAgpSS0FujauEurTl+2NLS+GAGARKTxf3AEqPdSthqKyy677GUAZ51z3jnv2bF120dXrFh10i9+9nPc+I8b9GmnnqbPPfOdNOu4WWLEkJEAgFAH8LyyjXiK6MMcu7bs1+GsIstRhYLGqK9Q2S8BUL22n+sMD1T9UMdNEvcyEY195sjQmF3XhYADP9TYtasDmzdtxYo1a7Fpy3Zsbe9AU1MLxo4YgUmHTsOAIYPhpBwwm7k+LJfjttckLKMXstKbXEE1uQwRwk8IgwDDxoyEdCRWvLoSu9t3w0mnTVJRpM9nIAQjDEOErBBqjVAraG129YprXQgsOEiWEByLfAiOMECmI5xqzLem5EZaj6qBKab+VoqTTqgIqNLgVDavyW7CyoajjkYAcFhSWgGS0whC8KoHX0BTNoOWtoYXAGOnt3DhQhwoAEmnYUDNmzdPzJ8/X9/y91uuB3D9By666J1PPvPM53ft3nXc9X+4Xlz/h+sxdPhQPfutJ6u3vfU0OvaY48XwESOoyU0D0FBhiCBUUFpbs8jEzMr7ToepxE33nql7jxnch1gIe/076oN6W5Gj2NTbBH2ZiCAkQQoJR0qESqNQKGPdhq3YvGU7tmzZhi1bt8ILFZx0CsNGjsGUww9DU2szMpkUIIxc1/f9ikxWRJ8rIYyh3rhI7aaV6ujwiAhBEGD46NHI5nLYsn4TvHIR6VwWWil4SiFQIfwwhGILBkbknfjHK2o6nVqNhE3bFQJuyoUrZSVwpk6fxYnVX+/pgBOKPZsuTBSrCAmR7XdlPCFmsDBrSkWVjy1AkNo4BJmcixS6Ozqw5elXnKGNreERMw5/bH/m///tGMAevQWioYyZ6fOf/fzJTz73+Lu2bd1x6oZ16ycEofFRaG3rh0OOOEzPuXAuHXPk0Rg6cBDa+vVH1s0AUPD8EFobGmsUCIWkkit5+KkO0Yd5H4hBvE9OuXsz8WeqoJPMCYckIgjHqBMFAD9QKHlldHXlsW37TmzYuAVdXQV09fSAwRg4eBBampvRb2B/ZJtyEMKYWpjbVVd5LNT2JiLx/RAqUtqK5HdfbEgYjuOgs6cTHzrrnXCDEH+6+w60jR6OfL6IMNoAVC0zK/t25kp3w9VpI5bow0i7DrJuGtKGuLAF65gsO5Bqdx5UcXumyBPAfF4FhrbrwGR4jY6jRQxHIiQgFBoBKSiE1heA4dmfrwZDsTLrUYBYK5BD2LBhvfrNe78iDxlx0KpH//HQDCIq7ev8/3+mA+hjU4A5c+ZIIlIAHgTwIDM3XXzJxcd27Oo4/oVnnjupWC4f9tyjTzQuf3kZTzvqGLQNH4Gxkw7CMYdMx4iBAzB+9Cjk0hk0pDIVJzutoZRGqJQ1l+CYbYianG7qgzizXxp6RiLViGtgQHsjWTNK2OQy4QhACbBmlMpl9HQU0dXVjV0dXejs6EFndzeCUCGbaUA6lcHoMQPQ0q8FTkoaI0xBUFrDVwEQVjj1sooVbxFu4ppNCNXOQ/v0nSZ/aoFSaGlqwdDhI/HyM89g5fpVOGz0cJS1gox5G8lPw32GnKKWoQeGEA5ICITaYAOOHVtIi3gfX0395Cr3IkIlbEQko+qo0gdQko8AAZCqMAOtz39sOW4/RoW0Zp4rJ53mNU+8zGF3GYOGDHqJiEr7M///Xy0AqFEWkg0lBRH1ALjH/sGiRY8d9oEPvOfGDevXTzh39lvU2MmTxf1PPIm/3XIn/MDDwAH90dLSjPGjRqIll0X/tv4YPngoWpub0drUDEcIkwpsf8lKm6LAWtnU4sRxZWNcQiR6+eNWbrHEfBgDTomswARgyRHr0EZb+0EIrRld3Xns3r0LPd1l5PMlFEoFMASCMIQUEs2tzRg9ug3pdBrpdMY60IbQFEIphYAZOjTUaUGVMFVNXC10SfgqUAx61VCeiXsdcKqR6qIGy4AF8ITrYPCgAXjV+icq1knYsPdGpHqhYM8vVzktkyUNeEEALzCee7lUCo7jgpkrfMq+gOBeqVKckJPHSGGvdaEkhmLjCRAzGayNvKjRLTi2vEV0562vroXDGgdPGf/IzQBOOukksXjx4gMFYH86AlsIwMw0d+5csXDhQgLAs2cf98LxJ5x069YtW644eNwYPu1tp+KEI2egu6eI9Vu24ZmXlmPz9nY8/8JKlPwS/KCEpsYcsg1ZDG0bgKbGBqTSLoYOHITGXA6DBg2EAKGpsQkZ6SCVSkFaS2PpOAAkVGj04ZHjbGRWSWTyAVgpKF1JrdGswdrASlozVKAQBCF832wySsUSSl6AYrmMMAihFaNcLEG6DjLpNAYNHIJMQw7pdNpkmto+mZlN/gKbOVUIhiTAASGsIxEQkVkncR11AxKHv1pp1ad0ggm9BJaRbZfSEFLAyWXgeQHWrlmP6bNlJS/KkgD6yk5iqvFIiCmAXC0cYnP7i1jDQHVMy2s7mgS4SYnQDkF2k8K9LNCYK+Cy+Y+umIlEAKHdZJgAZI1UJo1t27bxK/c+IccOGlx4y4kn3PdtALNnz9aLFy/GgQLwPwALEz8bMWr0yJXPPSNQ9EuktUY6k8WI5laMHj0Cxx91BIolD5093Vi64jVs3d6Jkl/Gzl070NVZQldnCYVCCS/TaqgwgOM6EMJBS3MzmrNZEIB+La1oamhELpNFLpdDU0MTQmWislNpN25nSUQEFu7dOdh7XysNFWprWKJjSasjXTQ1uhAguK5r3IiEPR6aEbKx26qYZtpWU1TASxXx7Fj1jjhEnXUW9Y5T603v6UP5XAUIUq/bPCL5DBk2CJoImlV8apOLA+6t164PfVENVcta/kT6e/NPImFUugf8JiL9cYXOxKKCNUT2c5yYU0w3ZfQCKrF9IQCkGSIiDUHHPpeO62L1i6/owsbtzugTJ7xwyqGnvwKA5s+fr/fnmT9QAPaMFWiQ7ih5Hp59/nm887w50BrwghAIzOPlugJDBvbH0MHHoLtQwI7ObvQUQ/heCK0VdMgIQw+hH6BUKoPIgV/2kMvloFWITCqNVMoBkYDjOsbP0EaMh5orIJVGbG5a9cgJEefOS9eBdPe0SdA2n0RD60qkVXxTWU+6WtFQMq4aTFa+SnWYV/ZzUN+Ux1ritO5DAs19SKlj5Z0gOK7BMcqFQq9uotaThPpkXVIvU5A4bksSIIVF4qt9BajqlCc1/wzWER6gE1YMVKUMo0QuNBC5UAkIKBsTZhD/IIoW50QREQRFml+4+WEMbGjCYTOnLCIiPWfOHBl1swcKwP/wNW/ePJ4/fz4OO+KodTctvCncsG6jAyPQoiRdVTEQBgyBABlXYNjAZvi+RrHko6fow/c1iHPGBzABCIVKm9VP5B9nK7/iim0Zx/+WvM24t+imiqnI8bqtNu7S8uLMo0ZUddNqqgRX9LogucKF51oOUZ28ovoiOaqx0Yp12DXufXujLJufn2KNnTs6AALS6fQ+KnwT0epcgz7WbCgAICUkRNR5xeBBFNFmimI8qHEds4eoWglt/SeoDluzYgQioRBCQFgNAMdrwUhkRqRhOoKeUg92dXaIfq39ediAkQ/hf0iXPfCqeV155ZUMAMcfffSGfv3b2leufg3lcgmO40YQW2W9Fcd/O3AphcZMFoP7N2PM0H4YNqgRjY0OCCHKXhnFchmFogff9+H7PgJlwDWlFJQOAa1ByjjMmqIgYuCpfgxnEvTiGmuL3q5DFX57Jc7caM/r59TFnPYEk02w9U6IvsZozZkgNHEiNLO331Y1535PCcRVgJ4wN6tiDZmWaBvU31iACcd8rbwnKVMiG7KS214nVYljZyFHyjoDi+0PkqJ/qqGMx8z9RIw4kjoHqrIdj1gZ8RrZBthw7CpVMa7VKkA6k+YX7nlcd65YKyZNGrv8kks+/4QFtfX+PucHOoC+8QAAwKxZs3YSY8PmzZuGtLfv5KFDh5MfePWbTU6aXjAEJFobG9HS1AClNPwgRLHkoVQKUC4HCIIQSlv0X0QOxEbmVbGSTrThfbjn19JTNFVIN3VpH9SXLIFjG6rkzRiNvBEYJpUl9zBbWxzR61almmCWPh0HuaKKoxj44xqCTizahRIabpOD/q0tKOR7QAQo7p3evjcv4mithtiEm2NHH0ECLgm40qnriVQbLBZ9rIp7FFWtHeIwT64VEFFVwRYkIKzeIIwiv2JEkqCsYYgX+FixfCW3ihTaWvvfZtd/MoFfHegA/kkYgCAi3dzctGnXrl1YsWoFSymhOBn7XUe3TxWZbKg0VGBawGzKxcB+TRg5tD8OGj0IY0cPwvCh/TCgrQmNuTRcaTjtYcgIQkYYsiUaoZc1VEUnz4mvgCphmrQHk47eX3H88ZIHVHNtQg/He2jjoSBMcCZHHUQFoOM6x71XPxInJlf+N9sVtmAzETNrBEJDOww346ClfxMGD+iPrEiBwMik0hg+chRY6Zhkw32Es5I2XisxDTom9Ghoq76LDiUJQAqqCuGOvn+RiJqrdEdxRJ3hgmiNUGvDSgwUtGLjSEUGBBQ17g1kE6vi8FDY7QsIUktIliAmZNJpbF29kVcufk6OGjpSn3zMybcDwJw5c17XQ36gA9gHpmSusXFruexj4+aN1aujvlh8XKtHsY+PNphBNDFkUi6yaTe2mlJKmxVeoOCVfQRBgEBphEpDqwi809BKx20sJUGu2L9OJC5jivMPamXqfYuGE4AaV9hr1XTYqPBIo3NPsPkY1e/M++AzEK292KbgmDhehnAlGtJpZDJppFPSiHUAlFQRy19aAcd14KZdaDIHvJphXc3WE7F3gV0nRkNIlfBQQINNOKtIcBftalbbOUxpu461gSUq8gKMpciJQkRAUzYHSqoCiGIJMpKeAFYhSCQgYQqiFhokQFITUsLlXVvb2Xt5i2idPmz5uz/4kecvuPiS19X+HygA+/gaM2bUKy889xwefeQRfPCiD0XonMGF47zwilyY+kLDKtaklVFBV95QCoKTSSGXBdCUjampzAylGUoxwiA0NllKIwyU6TDsv0U3jzbxSKZzYO7lYENVnCJCPeWzqInSiO8qS3W1AwoERf/LHHSpI/29jcq0cVjotUVPHpRKgRFCIJ0myLRrePiua25gYUcRbZJwy76HYncBTU1NaGptQaAVWHDEFKqSQ0WMgCi7oYpjQL2djCL2pBeEUCo0P2M2xZcTpCyd7HoSdt8R+zEKnXFJwpXGc6DiEhyNDZQYGHTcTUTdBtvZi23XoJTGohvv4kHN/XDEEYfcQESl14P+HygA+7EJeMvbznjswQcf8p5++vlUj5dnliBNOo51pkoCaSKzneuk5NQrDFTtlGsJPlQ1PBMcaf5k0k6Vi0zsVmPfV6moDVVQlhcQdReGpmzTa5WG1sq+XxScSdBa2dtOA5Dx7Wd3W4AQUWxKBeCqOkiR46ohJzEl5cTW9x9RICsAIeA4DJlykMpk4DgOHEfEasD4e4OR6DI0pHTR2dmBHdu2Y/TwURg4eDB0EMYou9SU2L9Try0JJ8am3iEqpgsoeb4dvxKuPVTNMhRUL3SEKlsB+9kcR0KCTPcgELf/bLcKcbdAZiEoYIJCBLM1pSHSOoTjuli/eQOvffolOWP4qMIF7/nIjd+66sf7Jf45IAbav0BCIiJm5syRs4587qWlL0+597HFavph00SxXCKXHCYy3aokpwoNENHB4Ncp2u/j36sBNFRHoRNXodtU5eyRLEqVVjayqNaaobVJ3VVRJ6HJ3H5hABVqhFZKy0ymgLAyh1wbXkAUpKkZsdmFFgwWGkISSBIgCdIRcKQwB0M6kNLQYCVLBNC2iAoIFnHwBktASlPYmtPNuPuBO/Hxd7wPJ590Mr7yu59ASwkK7U5BU9XKkKoEU9XR4FXenlxj6pkER7Enb0Wu8WbkKm1Hv6ZGpKRECA2yc4q2fUMoyMiTAQQ2CDSEgk8hQgQITAdFQVhGuqGRb/jl1eruK//gnPv2M+/50x//cvrrC1w80AHsDzNQEFF5+owZy71SecrixQ/y1MOmwUMAFe3OheGJCev7KFnCsSGPSc091bMQ26cc7hoBESVcaZmr9PsVZmDiYeSEHVaisaeEck8SIBwC2VtfWyAxuTdnZmhlP74dMULWCHRo7KsowT+wVliatGHGCY4NVtmSaLRVuZEyt6PSdtUQW2nZzUcUpMmGZAMQ2rdsh1fy0H/QQGQbGk3YKoTBEaiGrstJV+bkFNCbhEw1haKv01XrMF5NfrSLYs3IuilkpQPFGiRqg18jejBiG/DQZgRK7UAJZd2ONVLSRaHUg+fuXCzamlr5iBlH/eJP+AusjkXhAA/gjXmddNJJAgBmHHroY4IEVry6Ej5ChMTwKSQPPgIOEbKRbwZs4p19KPisDDhFqKPN3582jFCPVFslZaXajQQlNOoJrXkV0EcxfVbbtEutjb4gZEZoGYOajRRVQwPCzOOOIyFSBEoRREZCZgQoTRApgpMWkBkBJw04aeMgJEnY0UNBh0Y6TNrEtUc/HyVqV5W22AhtTLKYEVonn507dwIADj78EGgpobRZvBL3vfmIeBR9ZMDUiKrq+iDX0HdEwiW0t0ekAKMhlbLhH2RrG8XhI7H5B5mRh5Odig2lFbb9z2ZyvPjvd+qNz64WM46csfTTn/30vQBowYIFGv8E37wDrz5ekbvqYTNmPJfNZLFl4yZR0CUTAWUz3UMoKKg4NYKtR0BAGh5CBBzWCdd8PWZf+xIEmkTW9xInlnT4puqvRhNidZrQhKRRjVHfMUJtDmV8pWo7ryuAFUErBrMyCHmMjieITWAoERoXXCIISCN6IgmwYzsFAis2qDs0NDF8BFi/bi0cKdEweDBC1rH/fq8DSxWdf7Ll53rBp9EhZK7ydqgqBEw1XIDKKrA2g9GRxhmZrZNvVAgiEJbBkNp0LToh/BG9ZAnE23u24/5rb8LopkF420lv/ykReXPmzBH7qvs/gAH8D3GArT1bB804aMZLIelBt7z8kB40cDCxp0iQALNmky8oIIWAtL9EARHzul0IuH3dUPsdxM19moPRXoPKqKpz4IR2J6IeawJCqrDwZPyGZjfABPhggwGQtjdrNfstItVoSrj0JkMwRGJlaGm1RKIizY0CRViDWJvPI2Do1IJx3rFvRWlnAb++5xZkm5pBofkmhK626Yja875u/b36t/URt1jRPiSTYHTc/mvWaMqk0JLNGgcp2/4zsQVD2agq2ST/hvbvFWsomK1DSCGVtQfVAP7DT3+sH7zyBnHWaWe+sOCGvx1DRME/4/440AHsGw5AQ5uG7hg+dMhzHe278dLS5ZrgwOMQPhkFlyINn5SZhzkyjbC2TtBQpCs8/39CCejbn5j3IVugOswzSV2PwigEYAtZpLAzVzsRIYQ24RTCjA7m+zc/h2hcCFkhRLSWtH9ssVF2VApYI4BCIDQUKQQcIEQAhdB8fPMRzM+OGCEriJSDrdu3YstrG3DorKPQOqANKlRWOYdetMhaRKSKI8T7OHJZk05UAYP1f/LRu0oQcql0te8AocqJWFgZsJ2+ovD6qqQ3KQQX8t1YdfdzmDRiHM08dMafiMifM2eO+Gc0jwcKwH78nGQq8yBrjYfuuRcKAiEr8wCTgmL7sELBg7JYgBUUsgHMFFlrLuKqtdnrOfyvp9ljith2vXUEFdoK21UaW5ZfVAQssxHm0GoohDpEYC0ulfUlgNZQtu3XVdbbRvun4g2ENcRiDdLmZyRgAC9mheg/2hZPy76BhIPnX3gehY4CZsyaBUemQFrHX3sl0ptjM5Rq3cHe+19KkAS4jt+joDq+yYm4d9JANuXClcIcZiFiYJITXJB4zRmzEc33y4LBxKSVQjqbwoN/u11vfmGDGDlixJovfvkbf/lnzP4HCsB+vCKa5eQJE1cICGxdtY4KKCMwGRhQIARkXFoUNEJoeKxRRggfCiGRPTIGF2DUV6HtyyGuD0gh1uHX7wqopjOoFQ71JjWzJfFEDSsAhETwDNoR22mz7QY0AEUmsipJB+bEfzQzlNB2wxDFalMMukW3n8EXQuuVZ1tiAGCzSrv377cim23AlKOOgO95RtkYfe/c2wK1EgdeR5TAe9FWRJRrNmNJb2ygQmeOcAGSZBieVPFijP5dR8Ye9oNrEpZFGOUXmLcJOITMOrx6xSu46yd/xaHjJ9HMmYf9ioja/xmz/4ECgP2yDgMAtPd0einhokAK69AOT5rDHpAx1VCJFRjbOc6HNqOCNl2BBwMMKij70HKNIo33CbapVSAQERzH2QPgV4/02zuOjGzktflTzdsL4ztZx3tsxEQke99TJXGnIiG2t3F0k0cnVVNd0FI6hjMfcvR+QEAalHOweutqPP73+zFp6lSMGncQvHLZWnmj2jot0WaLfW6s+s5i3JPYKBbzgEAaSDsCacex2gLU9FgVKibXSLxMqTVpgMwaLBkP/eNO3fXadjGw/+Dnv/kf3/ndP/P2P1AA9rMDGD9+sk65afBBrbQau5FnD2X45mAIk+DigxGSaWO1bY81GEowAtIItBkRfJv0EtrbTSc54fuNUwiEgY/27TsSbsRx+kbtcrBOFLmoyF2oEpQJCGNBzRK+cQY034tty9kCfUi03ZH7rYp88q2FteaI32YZi2Az+8c9BpnRIs3o3taJV59+GeQAWpj5W7GGEA6Wv/wCyl0eJh0+DY7rmrGj3lnmpBwRiS6gj2Peh+aaanVf3NtlgRNyYyJCNp1CRJakpGcDVVR9gU39MSOkGReVwTsoVCEy2QyvXbUCt/7kegwfOIQOO+LQK4mo6595+x8oAPv52rJlQ8oPPYiGDJegsEl3IA8PZXjmcBDgE9s5GRCOjDGA+Aaw2XSKNQI7LhjYS8USUNqvLYUpAF4Q4sFFD6OQz0NKw6CjmkOQ6MtrrPeo1/YgBqRIwBcKgfWvrxzx6tuPbayYIkCRkTcryQiEGQ9CqSqjgH3b6MuJMIRQaGjFeGHxUvSwhuOmrEovWrcGeOSmOwEAbznzbVBKxfHglAhkBVVouxUeBPYqpa7P+EkYrSTZHFwHX9FAKiWRdV3LZowMRGp6PG2tqS3zT0VjlB25hCCU/W7cfu0Nus1plNOmTbv1m9/8j3vmzZsnXq/o50AB+Ce8ivnuoSCNxmEDWIGxRXeinfLoQgllBAjJ3PqBADyEWLFiZUUNqLlqJtZWvK0scKXBMXKu9zgG9EakNDRS6RTyfoCufB5SyERCcPVD3CuXMOFwE1GYBVeMQJS9pWCReB1l6CVUb6YrYIRkGYJgdHR0wA/DhOVHQisRW6Xb79Ue8nQ6g00vbEIPFA46cgrCMATbhFbHdbF11zo8fstiDBs+HOMOPhiB50FYS7S9Lbor6c99tfb1P4ihMic7Kqpan1Z1AUKjIZcyGYt2wlGkK4VOV/gIUTaAin+uGiCQ0iHcjOTrfvxL/eif7hPTDz10+z9uve0yIvL/mbSRAwVg/zAAAoB8vjhGgyAyKVaQ2KmLWBu2o0d4yJOPAgJ4guExw81k8drG9Vjy0jKk0ikoDsw4QKbyRzbairgiJYVZGWrWe3mikw4Ahh+fzaQBYuzatRtSunHe3R5h71rAjAnEEoIliIVpVS2yYQ65qnnoK5OthgE6SRB838faNWugrEZA2/EBCmAtEEaaAXstawaclINd69rx6osrMXjWOGQzKejAFERfhZAyg3sW3I2Obd04/73vQUv//oAfW5XW/Ez6nuYp4W60X0QZikYIkSAAcaUz0EAu4yLtiDj6y3Ag7GzPZDsf8/MKiRHYsFDDcWBSHMJNubx120Ysuul+HtEyiA47/IivEdHmOXPmyP01/DxQAPDPDRrt6OiYFKgQ6QHNKMGHD43NYSfWhbvQgxLK8FFiHwFClFWAw445Eq++thpb1m6Am0mZ9JzYv74CDunECo5skdD7UeiZGY5IoX9LC3bs2BETaerPEpQIRxJ16oFF/cnMqopUDGiyTrhrUnRz2yQetlbWklDI56FChXQmjVCz7XSAQABKaOtsrKGYobSGcAj5jiKevO9pFEdl4Q1yIX0VU6s9qbGrvBP3/uEmSCEw65STY/lvLWxKSU4+1XL2KNE4UcVTkXmfLtdIVswxf9/KjMGQAmjJZK13aCU8pOJubPETYrvZiC4Bu29hBSKG5xfwq2//RKErdI45/uibvvMfV11j5b4ab2CE9oHXHpiA5hlnmcukxjNrOM1p4SOw7b2LjWEn1gTb0YkiyhSgTCF6whIaWlsw4fCpuGXRQ2jfuQuuK43Xfryn1gm7aNOOR4dfVXYKe/kCK9EgI4YNQ0dnt5Xciposu75ceilhSxmtqqJDH1mCc0zDhR1lVLT1YGGdggmkCJIkOtp3o6GhERASng4MV8CKfxRrQ+u1DD/BZox59YVV6GYNNbEVCEOUoFFAiGLogdMOnn30Yax8ZjlmnTQboydPgFcuW1PVelge9aI91e+f+mRRJ9628tNhqhNgYv0RGhvSEE4Ury5soGelQATCjAMB2Cr84l0KaWiEKkAuleUbf/MnvfRvj4lZRxyx4wtf/ewXAZCV+/KBAvDvfQ3s7ugcKlszSI3uD1/7pGGCGjUENupuvOJvRrvuQZl9lCnEtlIXhk8ah0HTxuHGO++A55WRdl0TG2Z3wMkoraShkN7nNpXjxNmBbQOwY9sOE8wpRDy3ajJmGJq01Z5X6D8mg67CszdqYWnXmqHpT+Ibz5h7hBytPWHWmbbNhwDCMESqIYuBw4YiVCGEDeJkrnQ6sU8AM2TGwdpXN2HN8k2gqQPhpwjNTholGaKgA5QoRJfXg7/94PdIpVJ476cuRaopZy3AqG9SRN/2h1UPv6hn+pk0cLFr0eTpT3IxNTOyKQdNmRSgEHdEhjhVWfdFjAomtuCfXaeSPfzZLJa8+Dw/fN0dPHnUGHHCcbO+Pmn09DVz5swRb0TrjwNy4H17zZ07VwBQN97195GlfGlAw8gB3DSoH2k/NIeJEVt6baMCONgGIYYgR1ljl1XqwWGHH47uUjd+fMMfcOk75yDb0IJiWEaTTCPFoiIkIbtNZo5nSNELsa/DWCNAKYWGhkZ4RQ+d3T1o7tcEpSqAo2HaIV7VKcHwdGA4CXZcENbAMh4EOGKoaShbkFTkAZCcj2LMgsFQGDJyJMJQQYfGASdgHbfZHLnosgJSEtu37sKSR1ZCj+uH8gCBrK8hUhIefHgcgBpcrHr+aSy9/xkcPnMmZhx1BAqFPCBF/L3vS5B67ZgQ8wSokq9YvdyjqkTnRP5n1ecTBDQ3ZOzBjn4CXDFssWtVQ5c2g4COpc6gMAyQzWV4y8ZN+Pln56sWyrqHHn7kD6/49Jd/90a2/gc6gH187dixgwDgmYefmdLT1eNkh/ZTKZkmVtqi2KZBNj9MBztQwAq1FR1cQFl5KLGHnqCIE084CaqtCdfddy88v4wCl7A7zCMPH0EMpUWS0SShherOt+ZWijV6CFWI5pYmKBJo7+yAkoSyNhCeofOaTqXAATpRwm4uoovLKHCAIgIUEKIHHjq5jC546IGPIgfwYHfUViKskty+KkRbAwLI50vYtn4biM38XtYhfBUijCi5RGAdgilEoVTESw+thNeWBU1rg9IKjl28+xxCCYVCuYC/XfVbOCRwwccvRiqTASsd6xSIqRepiRM/H51s8TlyUeIqZiTVIIbVwqHILbh26288C1pyaThSItDaFoDK16Qtxz8E7HqUYzq2AQgVHFfy7u3b8bMvf0sV1re7Y8eMuet3v/z1lwCQPfx8oADg3y8H3rVr19RSuYR+M8eycN2Yqho76kQZfiB0UAkdyMOnACUEyKsSCuUiLj7rAmT7D8Kf77gVaekAEijoMrp0CR0oo4d9Qx8mRkBGY+ALZUgjwo4FTAnX/kooh1Ya2WwWzU3N6OjsiqOpox1zmUJ0chmd7KHAPoo6gEeGqRhAI2RtSEyWkxDYPyE0fHuYo++4Iu7RiC53zQzhOtj42iZ0bNsNRzrg0KDgFLfSABRDC0IpZLx47zJ0aQVMb0EQlEEMNGQyEALQQYB0NoP1S5Zh6d+fxKxTjsfst5+JfCEPKWxMp+CadPQKYyeMyU1U8R6sCc0VjD5ZmFyz66h2BjYgZjbtIJdJxdmMXGMIGq1GdeT3F3dCDKVCQBL7OsBPvvYttf6pZc6Jx81+4BNzL7qIiDT3ZUV0YAT4l68AzQZg185pZShkR7WZRs4gALHTa2RBJew6bJvqghQSrdbkpqQl0l4Jbz3+WCy86zYsuOduvPvU0yCki1CFCKWABwUBAUkCxEb6Kuz1JMn8vWQDtAk2ijPBsDiEcd1pbWnC9h3tMblGMyFgBZ9D+JE8lzQUJzLrY95/BbmOvPDILhSNxydXoq4txVZGawsJFIsFbF29CYccNg1KMUgzXI6SbgHFIeAA5dDH83e8iI68Bs0cAJ9CUMhwSKApkzESYClR6OjADVf8F7LZFC794heMMFnbT8o19vqcSN2NO/BKZFclE6jCfaxoJKiOvLp2gLBvKwhKKaTSAk1NpvWHNuYe2lK7YXUhETksKppRYdBaQWsFhxnX/OhnetmDTznHHn78azf+6a8XENHuefPm7VfE94EO4I3dADAzN61esWqS05jBiKOnkK/LcedJzL0kNpKBEoXYqjuxS3ejpE0CUKcqoSMo4Z1nnIUtuzrw8z/8EZoA13WgwgCBDs1BhaKQNAWkELDpBDwOUOIABQTIcxndKKGbPXSTj27hoUuU0I0SBo4chPVbNqMHHsoUIq89FNk3RCWECFlBaVjqaUW5F7Jdy8F8zpAMXdmDgifM5/cQwhfKdg2hLSymYxBCYPeuTvjlEppaG8F+CFIEoQhSCSDUcBwH5aKH5295Hrs7QoSHt6GQYyAwzkOuI5DLugjDAE42gzt/fT1WPb4cp557DiYcMg2lUrGa+BOlAFvXURGj9YZ0zKLaqjtpAxwRsaIxihMr2WqcP8nMNJ/bcQT6NeWMIzJruyqttBM63u9HoKCOMRXNIVQYol9jC557fBE/tvA2OWvGzOKZp59ziRX6yDcS9DtQALBf8WAEALfeffco5fvDZFsKuSGtQmsVt4a2+UOS5xft2T1S2Mk92Km60BkWUdYBSspDyffw7vPeBaetFT/9wx+westGNDQ2IZvLgYWGF/rGbcf4W1KFT2oWhJEoxxzSEGWYw9mFElqH9kd3oYAOv4BAGhGN4Zwb0VJADJ8s9Tgyn4iKgcX9fSh4HMJDiDIpeGR8DzxhxEzxxxQwmgYOwC5h+YuvYsDgAWhobUQQhIA2AZccKriui64d3Xjkhqewc1cAdfQgFBsZItAGSdMKTdkMUoLgZly8tmE57r92ISYfMgmf/vrXoLTu5WaQVCySTc+teO/rhG0axXTdSnNPMQ1acMXMxGxnKuSmeBCwB5rByGXTcIRj09UM2h9hBDHPP9566Jg9qVlBqRBNzY248Y/X8s8+/x2MGzA6/54LL7r0U5dcsug3v/mN+z/x9ztQAP7Jr+XLlxMArHz15Um7d+xKN00bpVJDWsFexEGP5DDJRY+Gsv53mg3pIy/KKJEPXwcANHztgUljzjvPxbDRY3Htwptw5RVfwb233cmhr7g128Ju2mEwQymFIAwRaoUQmjSx/Q9IE5OCotDYcZCvAzQ0NEB7Clvad0BLoMQBSvDNTU725qYwnvEDGFPPENGNH8K3thweaZQoRBkKPlmswBJZjO+heT/tADva27Fx1QaMHD0SoQpNV4EAAftIpV1s37wT99/0KNp9Be/4gcg3B3CUMQwV1gugrakJ0EYkdO+vb0THynacc9H7MGD4CPieb1V/CetNpnhjkhzhKY4yj4JSDSBICdCQEmnDSR9/qrFLY6JKiIjVOBTKZezs6oKvlN33J/R+kcY/ojpH4CExtAqRy2Vx5z/+jt9+7dvsbFfiQ+d+bv0H5n5gMQBceumlAQAsWLBAHigA/x/JgF9c8sIRHd0dyLQ0smM97+Ns9ySNxj5IUcsX7XwL5KEL3ejhEgrso8QB8kEZHT2dOPWMt2BwSyv++qNr+DPnf1hcfNpc8d0vzQvXvvKadh1HN2UaOZdtZJl2wMQIlQkGCXQIXwXGJJONN58fBMj2y0ESsHPHdvgCKMIQkwJSCacdc3g9BCjbfy9RdNsbdZovNUoUwKMQgTAjQXTww8jxh824ILMuVi5Zgf6pZgwfOxxhEMYknWw2gy3rt+P+mx5G0ZEQswbBb9RI+QzX4hysNZobc8imJSidxsM334FFP/wbDjvxaJx0zlnI5/OQjqxSNib3f9W5nGYOFzUyY6pKCBKxNiASJ/VhvJ7YFHAsNtKsIFwCOVTN2GTrCUEWAiRD82HWUIGPluZmLHnuWfzok1/HsNbR4pKL/4PH9jtu6v03rXvuodvW/OKJh1Yfb1fPCmDieSwOgID//nxAaKYp6XQKDVMHQUIghEIlIa6WHGJvCit9VTZQo0uWEJBGhtNo1CnKhJLbBvbDNX/5Ba77zPd1v9ZWOXPWUdtfWvJiyzVP/Dxz4zV/wZixYzBp6sTwtLln4aDJ48XAwQOpsaEJKaTidZyGojAMTRKQUnAaUug3vD9Wr3wNEw89BD6HJsgzup0ErKGHMkKXmNVnRCtRIEloCUJEAg6bLYRgDakFHCJoG0VJkrB7Zwc2LF+Ls99xJnzSQKiRdiTIkVj10jo8dv9z8Ac0Qh42AOUcIxUIuEKanBFmQAL9+zXAzaSxrX0Lbvr8T9GYbsSnrrwSg4YMRb67G44UYM3V4RtVib0JEDD27BMJ9W6Sa1GtfWTmBNG3NxsgFk0JgFnBlQLNuVyFIx4FwyY2t9HNry3zsbWlGUtXvoJvf/GrcIsSH/r4lThy/MnwyiXtKHegS9nLenbmL3vo1rUPNvYT3z3yBLqP5oN5HguaTweIQPj35AJqZnamTj9kfE/gYeSs6RQHS4Kg2eC+Is6utoGXXEl8gS0EvmAKRAkdKKAhdHlk/0G46WdX4+Zv/FY1umnniJlH/O3eu+654lvf+lbbsy++8N7NGzeftWb1qnFb16937r3zPkAAY8aM4oOmTFKjJ47m/s3NNHbiRBo8fCha+/cjJ50iJ+UijTQGD2/DU4/dhxNxBkKprWLPrPHYSnYjCjKz9fOjKMnHrg6F2RakII1lOBEkCI4gsA3uDHWItsZWPHjtLcjmsmge2g/KU2hobERn5y48fMcTWP3aLrjjB0LMaEXgMmTIJvnHHkMNhabGDJoacugJy7j2E99C55p2fOCKz2D6oYej0N0NVxrwjawykGslzbEwJ1GJKXGgmaq8+ZAsHhFnv16mY3VOLJgBKYHmhgaDKZgdZ3UXQBX9v7apzy25Zjz1xMP47hVfh7d2Nz7y/i9h5oTZ8MolCKMA5HyxR4FZSmRP6djqn/LYnRtuHTJGfIGm0MoFCxZI0xW8QeGXB16oFwsm5s+frx959r5RF537gaVbSt0t5z77I90wslWEJTOPalZssuRkHF/NrC3F1MyckgTJRKIsa0Ym4/Lq6x7h2z78U+1Kxzn9nDP+fOvfbv04ERUSG4js327960ErV68+5dEHnjw3DL0pHbt2D969qwMlrwQVhCj6Phpbm9CvtQVaCM41NXBzJgtdCmmD6MQVC3+McQNHI++XK049UfxYBHpZKW5IdjSgwACLpFGEjxQIjZSBACEHB41wIbSEDhRac/3w2O33Y8nf7sUXvzcfbf3b0NVZwMtLV+HBhYsQUg5DTjkYPCYDJmWtvxmOlHCkNGxlqTFkUAv69W/Gn7/1Yyz+5p8x++1vx39e8wuTA6i5l2taZLKhk+YcNRRdSgilkmYnQPLj2c6Ba3IbknUEOrYKTwsHTc1ZkETsNaiTH5ctABgZwEpCEJZxxw034br//DUGpYfi/e/5HI445GSUimWTHZAMbDApIYoBasg2CZalbf0G4j2HHT/yIWZ+Q1aDBzqAvQCAzzz27GE9HV0tDRMGqlRrs1CKwSTjFjPepXOERCc448SkYQqCYoajCA0tTfzED27gx794vW5obHBOPOm4H9z6t1u/REQ8b948AQDz588nm/m+zP75GTMP/NPvfzvplVUrJ6TTqcHr12yc/uqq16Ywq2YpZOOO9t0DPY/ptc71cDmDzKQWfqZrFYr9M5Ca4UoHkqs97ckq0hQr+ByggDK6VQmagJLdBAhBcEFIkYNG6WIomtBPZ5BL5/DK88/jt5f/B9794TlYuWwJVi7fgGUvbkFXR4ih48ZjwEmjoYalwGEISVSTomUg06ZcGq3923D3b/+Ixd/8M4aNHoXPfOsbkCkHYaFsrlyuUwSoklDIzL2GgorjMdWd7EGcsD2rH5kARClGGlISWppykFJAseFrqOgnyRV/AC0i4ROAUOOnX7kKt//qr5g4Zhredc7HMWva6ejKd8b8DuYKGklRGggYhXJP4Mj0kN071E1Ln9p0JhE98UYUgQMFoG8AkAHgieeff1vR8zDymEmcbmmCX+gBhIz70AhIip+CRCI3bDsNDbgQyLQ08ZM/+Cs//sW/cktrizN1+tT/uuuOe79IRBR1HEkOwpVXXknLly+nhQsXaiLaCWAngEcTbyMApPP5bU2//OWfRoiUcIeMGdN41ee++dtS3juoKKBXhJuJAoZQ5mFPSQcuJBDFelsn3hAGCPQsqcZYgwu7IgMCaHSwhx72MNxpQ2N7F7593ifRsX4nrvvJtfhVx8/Rf8R4jDnkaEy/YDZykwfBFx5YKQhBlSwiYVhxodDIZBy0DR+Ap+57CLd+4RdobeuPb/zqRxg6fjTKXXk40qn1Na6mRlNFpad1zclnUVn5cY2CL65CNsgkcQlz1WBhirmQAtlsCh5CYz0e4TvQEMKoLsOIQRAlK0nG+vVrIdws3vLed+P5R5/C4iV34fBDToakpFKTI6Mo4oRPOwOur0ohhbl+7Vu9a7mzcxYROqOcigMF4F8z/8uZxx95jCJG4yEjyVhY2E1zXLVrwiDNY0Bx4muokHJcOBC8+PvX6ee/skC2tDTjlLecMv/mm26+EoBg81vVdfIIOFkQrDAJO3bsoMWLF2v7PiX7Z0f0tsccftKSHTtXH+R1FzVGDZQ+e3HB8lnB0TJO6gVrCDL6eKVNSKfxErAINgggYzEGDSgm5KWHe398NTrW78QxJ70V/VoH4u5b/ooJxx2NWZ++AD2NPkpeGTIxllMyEdcB3KyLfoNasH3Fatz00W8j6C6h/5QxyKYbYxelKKCckiN+DNglV1lJ12OqovAmFZZVOgrL2Kw3BBPbPQKZQNJUxkEojDGJoRkbii+YIYW0RcD8HDnUYEFw0hkMHjcaF3zhE3j0oYexfscGvLLqaWzcvAITxxyOkl+IhVf298uJL9JmApPjeaUw7TZNfOr5rjlA628XLmQZcZgOFIA3bv6n+fPn83d+8Z2x7Zt3TqQBjRh42gzSKkQsHzNlmwwIkAzcocpGMDRWXZQv8x0f+qlef9uLctTBE4pnveW4L/3y59f+PHH4eR8DSlQtU3HhwoVi4LKBdPL8k0P7d84XPv2N1rV3boAX+uYIW7qw2VMRVMKoiyGhQFb7H9l9VaVkxgdJhwrpXANevu5OPPK9v6P/sKF433vmoXN3O+685Xr0lDtQ7sfwugvIIA3LAq4EY9jVaDrtoK1/f3St24w/X/wNdKzbhlxjE3as34wvvPfD+PrPfojjTz8Zha7u2JqMo+SdKg+ARBqRqAzvESgY37HEvSzBuXdca/xL1PbtjWmHhtZBnBLMTFDCCHsIQKACy9ZiZKSLbFMztrRvw1P33YNnH3wUSx58HMRpTBt7KN555rswpG0UgsCrOvyolzGQyGHTDPYKahaA3wILD2AA/6r5f9vGbbPK+UIuNWVw2DxooHRCRlC7HhKJR1JUhmxSGul0Fn6+g++/5Odq820vOyPGjdo1d+75F/zX/O/eb3pw6Nfbzi1YsEBeeeWVPH/+fAUAS5a8NmjHxuDCh+7eOnf7tq6jejp2sxNoQbV24GxWWRGVOQmexS1HL1BdgxXDdSRUexee+sHf4ToCZ595CUb2n4R1q9fDcTJQYRklrwhHOlCaY2Ujs00bFkBDLo2mlgaEqozbv/ELbH52JUaOHI9PffgqbNu8Fn+55Ze48hOfwSe+egXmXHwRCsUiVKAgJPWVxdP7a+Zqz4N6rn8q7m4SLuWRfyNFhixmnpeh6QCYFLSgik+A/ea0DtHc2IRioYD7brsPt/35r3jx7kcAX2L0QVNw0XmfwdEHH4+s2wg/DKF1iF4hBtUphRyHmhsfRSJGysymB0DAf9n8v27lulN3tLfj8Dnnc7+mZlL5AshBRR4ae8LZJ8LeKaQ0Uqks/PYOvvMD/6V2PvCaM3TUiC1zzr/g/P+a/90n7c89fL0Hf+7cuSpaCz14z7KjvYJ4/8ZX9bmOaBoqUmnkGtogSLAMAYcFdHT7M1W47cyVmHGuDrCIDMMoIUgTWiObbcAjP/gL2pduwWmnvQtvP/ZChF4ejvCgVACRzcERZj1ICcdfslbYbloi15SF9BRu/NR/Ytktj6Bf2wBc8cnv4eAxx2PGuKNRyHdj4d1X4+of/QQ7tu7ARR/9CBpaG1Eo5uN2n2oUwJQAAnViROAqG2820eeJiPCkZ3+EwjNFRq2GpUjW9CQZXBLhPUqFcN0UWpqasWH1SvzXFV/FkgeeADWkcOzRp2PumZ/AoH7D0JYbCN/zUfSKNiKd9ppSREkswvwsuwEAc+b8U4vAgQKAumGgmplbjj766NkiJTF61kThsjK3gJV26sTqh5LRD6FCLpcFAp8XXf7rcOcDr7kHjT/okS9/48sf+egHProSc+ZILFwYvo6vSxCB584lBQBPPrjuzPZd/kfyu8RZmVSjEyoPxXIxzJEEkZDFzm6UdhdAjgPAM8CV5ShUGnKyFlaJ2Znj/rPCvQ9D5BqzWPX3h/DiT25H28BBeMfbPgLJKYAZxZ4e01Vo49LLNY+3gvH9S+VcQDBu/cqPseyWRzBo6Gh8/rKfYOLII5EvdECSi/POuhRjx03GgjuuxnW/vRqrlr+M9378Uhw660jTcgcBAs+vjMpVzkmWzGTrcey/SNUQnzbRW/EKUMeRvNYERcS6n9giDUQgbbwMlGZI10Vzcws6d+7G4/c8iD9f9X2sf3ktBo47CGee/gGcPevdaJStCMIyymXPbC2EqB5bkqxG6PrVwOJMwuENB4hA+Nc5AP3qut9N37J+w+i2Y8brAdNGisArgkVFM5akiMaPn9LINWax87mV/MgV14bti9e448dPvOO66/70nlmzZnVbh5f9AnAiOmgEEj5838qz8t3iio5dYraDZpRVAcViISQiAQEHDHYdRsaVUJ5nsgZ6EWC4ahUYXWqUDCYhc/MIpZHOpOGt2YZnv/RnNIlGXHLRfIwcMAHFooecbIbjZAAAmWzaaPXtoaLocElGrimLVKjxj8u+i+U3PYRhw8fgM5f+CNMmHItisQuOdMEASmGIww45BUMHjsV9i2/G4udux1c+/jEcddwJmH366Zg+cyYGDx0M1gpe2UOoQmjNECRN8pC9XbVF+CmO4DJnnK31GVmQUWgBFiom9CT/LSr2Shmw0E2nkHGycByJck8eT9xyD/76899i7dKlcGQahx9zMt533hcwfdRMlEolFMM8SAiQkLU7zCoVaTy7JI1IKnHNIlBltDboFw4UgH+hBfhD9zw4s7OrE+NOOlbBla5fKAOOMJU6EXHFDLAR1yPXlMXWe57l+97/K+3vKLhjDxp7y6pVi99LNLSwv4d/XnTwLQ300Ydem1nowDfyne7ZgES5XNYCPpt1uHAi9FoQoRz4KJZ9wFeJwM9avXt9LTwlvIqFJqSEhPBCLP7Kddj5WgfefspFOPGIs1AolUCCIEhi5w5zObUOHmDa28j23OzE0NKYQ4oF7vvGL7D8poeQyTTgUx/+PmZMPB75Ygcc6SbSyxhFr4z+A0bifXM/j6mTD8WdD96AJ+56CIvuvBsjxozDcafMxrEnn4BxB09GQ3MLhCPhlT1AaSilYn2mmRnMjoDYSKCjJN6Ih0AyjA1L47IeMiAFhCRIx0EmnYFgjZ7NW7F52Xosf3opHnn0Hjz/+BI0tORw8CGzcPzh5+O4Q9+K5kw/5As9IEkQ5PTKYaxIRmo2SJXBBURkXBYZ2nXSAqK4dsxUfsJOAAd4AP+KV7HYo72yz/7mTuREmsu6QBRqezMytAC0NntgJ+siJ1ws+8Md6uFLriWXXDl1xozvvrxkydeJSAEQ+3r4DbIPEbf6T66c0rNFfK5zh3ORK7Npv1zQRAELIklVVtUcp05m0lnD8dc6YYVRHZiZtBSnBGpO1jCEoEEho7mlGU/++BasWPAMRg2biPPf+Qn4SlkhlLArOvPx3KYmy4wz9GNKOcg15+Bv2Y0nf7IAS6+/D21tI3DZh6/C1InHoFDoMHmG1cwdCCJopVAMCzh0+ik49JCTcN8DC/H8K4uxffca/P5HP8E/brgew8eMwsDBg3HK2e/AjJmHItPchIaWZlOjhYkTC4LAjgJGjWeifRkha0jXQRgGkCkHrpuu5CsSEJTKyPd0o3vnLqx47gVsWvYKnl30BNavXg8vUOjXOhDvfOclOPyQUzFp9Ay0ZPohDHyU/CKkFECv4913yDslKcgkKJ4uQZxOC0q30g8HDJjYvWDBAmmfpwMF4A1cAer58+fjqJlHPf7sI8/QurteoLW3PKbHn3OUCKFt8JfJ8yNI+CqP7Y8v5Ud//3C49qYlbnNDEw4+dMblTz386E+JYrc5va8H3/6C1bOPrZ3ctVNcsWtN8B433ZRTQREqKIREcAwrn2PH2eqRW8APTYhMWAwsmCdieWpSBsOJ3XyFN28Ujqw13IYUOletxsu/uhuuk8b5530CQ4eMRrHbpA8xFIgIWgOCBIQUyGkCpXIQGQndlcfGux/G87+6CVtXrcOgAaPw1c/+DpPGTkeplIdMHn6qgcDIfMyyVwKBcMZp78Xxx7wdz7/0MDZNX4PHnrkbK55bilWS8PgDD8JNO5h41AyMHH0QJh4yBWk3jcaWFoweNw65xgYwMbJNjdB+ABaEdEqic2cHGlqb0LWtHe07d8INGa++/BI6t+/A5nXr8OrSl9GxfSd6OkrI5RrQ2m8Iznj7BzFx9OEYO3wKRg6eCFKEIPBRKhcgBEFE7b7FUqg2noXrJI3C+AlQAt1kRtiQbXC02/nA0SdP+M28efPEnDlzDlCB3+iXZeOJb37lm88tfWHJn+++/Z733fLO72Dc2w8Nhxw3GaOPmyjIEeAg5G3L1/OaO5/ndfcsdxCy26+11Tv+LSd85LabbrvO/mzVvvi6JSq76tywof/zL+gv7NwoPu7KXItWeZRLhZDAEnYHkTjxsUNX1FayZkiRBgB4O3ZDIrLkEobWmryBEoeviiijGdJxUO7pxL2XXY1dq3birae/F6edMgfFrgKEIwBtEnakFJCuA80aL//pZqy8+X70HzwIWhDaX1uDDcvXAADGjZuBSz/4TUweOw35kp35o5mXuA8/X4KwVOB8qQAnncHxx5wDAYFTjz0X67euw+7u7Xji2Tuwu6sd655ag+fueALZljRK3UW09G8AhIu2Af2QTqfg5HLIOgIhazhOCru270CuuRG7d+5CV/du+HkPfpkhHMBJpTF8xFgcdsjJGDXqYMyYMhtD+g1HW/NgSEpBhwG8csnYwJGEFKICRFarlVGrMuLeVcC2/TENIEw7WYed/MahE5ouIaLwn80APFAA9ha3YVxePjr3ggvWP/fscx/ecOfSoavvXILHajijAkD/tv7hyDGjbpox84gf/ek31zxtd/zhvtz6V14JmjuXFDPLx+5bf/FTT+HLjmwaF6o8gqA7BEESyEkm0DNX+KIxEJH490LJbIycVMpYfWsBJStPZSWCNAoliRh3dl7VCulsBs/8+EFsvn8VDp1+Ej4w53Mo5wuJosEQQsALijjhyNOwcsVLeOzZmwAAa6KHS7oYOXoizj7jo5h99NnIujkUynk4jpOgUFONnWf1OBD3NdLckmUvDwbQf9AoDBk6HloxTjzqHQh0iPaOLdi4dSU2bnkN5WIXOrvasbtzJ7TuQRCU4e3sRsnGlTEz0uksqJDG0H4HYfjAiRg/bgaaGlowcMBIDB48Gm0tQ9CQaoIrM4BisFYIygF88oyrQKRTqAPeUxXaQhVnYqr+nVlfAorYgMys0k7KkalyT79B/J7Jk4eufaOEQAcKwF58AIioDOAbzPyzC953wfk723efvnt315G7d+9qbGhu3N7QkF07aPCgJyeOGHnrT37yi2dffG5JVBPU3m99jm59fuHR9ac9ePPGbzLnjlNhCK9sDz4JB0nVezzoi5pbhWxmH9vBxBpfppwY9Y6vJOYae0wbChqtyFSIXEMKq29+Es9+93Y0NfXHhy7+OvplB6LsF61WhSsZeyrA4AFD8YXLvoNTXz4bqzcth2IFz+vGEYe+FeNGT0VzrhmB58EPSpBSJqzT0CfPv4JPVCt0iCQECEHoww/KABOkcJF2XIwaPgnjRk2HYgXSmN6WEwAAEWtJREFUGr5XgiaNUrkIiBAgDT9kOE4KrH2QcCAdFyknA4JGKtUAKQlQbNKLwhAqVPD8AoQNcTGEJFmd1VCVuWo3K5RAXxI1mqK2h2xusaUUGyImhWk344pUeXfToODCQ4+Z+OgbMfcfKAD7XgXIYFK0A8CvAPyqm3ngP269tfF9Z5+9I5Lv3mkvqXnz5mFvho7MTLgSRHNJrVy5ZeDWV4Pv7tzqfAjsoFQuKiGYiMipxIdV2Vra3XWtf23lJoVQyHtd5pfbmEKAEFpoVLRzydVl9S3LYYjGlizan16NxR/9HbJhAz7+qe9h3LDJKBeLkEIa1z1rwGlBKwQqhHAkjj3qVBx/9OlgIkgi+IEPP/BQLpcgpDDjSEKcUwX+1WmVjd9e7YRQyRcgWFING3ty7Zfh63IcGETCOCk3NbbE70lRWg9bLofW1uBJwi8XzN49YgARzO4+ilDnKj+iKkOSqh8nUa/kVarw+ygpRjISciiQoMaGJleJnmX9BoUfPOL4ic++kT4ABwoA9kkRZA1zmGbPni0XL16sm60q7/2Vpk/MmzeP58+fr+fPn7+vsz4/dt/qM9e/GPxYisYJZS+vBQIW0lLVqh91rha5UHyAOREASkZbjpBDbN2+HiQJuYHNNrSEY2tuUOW2TWbfsNZwMy4K63fg4c/8AeX2Es45+4M45ch3oJDvtOBWFFwiKrJ6q2BlZhRLxepOWJAV1IiqA0y1B6RKh8eJWHPUGQ9qOf0JfQARSFofv8THYqWQ/ILJJvRERiFRwZBwrNYj8WPvI1OxilFYvbuvU+Ao4g1bEVmUS8CKmZDJNEjNRUam47cTprlfHj16fMeCBSyjTdCBAvDvLgTmxIVJme6VV14ZiXjU3g5+1PLPnUtq+fLlbdvX5L6f73A+xEqirPKhgHYM9UzXJ7tXQeXJ+Z1qUH2T0NuQagJrwM2kqx/ExOGXidZUK2NyGrR34IFLfoXtT6zB7NnvwYXnfhqlUiFhxpk4hkkJrcUihLX5qkrSjb/a2imf9o6PUj1oMFEMiZI6+kTzwFWpn5RE5KrswjhOBRLW9YiSLkN9RKnHQF5EnqwjJ06SkIhAHOEr5melwAw3nZOOw9Ci5+Fsq/fNE0+ZsrjC+qR/iTvwgQLw+ooB78uhj5+dBSxpLqlFd7505Kbl2T84ommq7/VoogAE4UQzfXwn14/1TeyNuZIJRNXPqFZAv7ZBEBmJdEMjSAkIlnEfTQk3Q2IydttSIJvL4Plf3Ywt963A4YeehM987PuAH0Dr0Nz4MfV2L0ZSXH1AiPdw3DnpvlHdVCNxkPouClytAur9y0qOUb3frXcUYJ2vsd4YVxUPXNn4c9XsGEF7lVUtkwYEZdI5CRECovC4zPn/fcrpf/0b0XzN81jgSvC/KhTkQAH4F7wW2MP/wC3LLyx3535DlGkqlnsCEuwiNn3liiZ8b7dizcMci1PsrRzqANt3bQF7CuGObjiQ8LQyN5zgmBUHRdBMSGfTyG/fjhd+/jBe+uF9GD5kPD7y/m9CagVf+bb1r7pXe1tJU501d2Jb0Hc545owvn1xqKv9ZBxTmvvsMKqQ93p70PpfG1foiYlrnXq1/NUuQ7FFdPS7iSyCZTbXJJUqQTg9D8is9+vZZ0z+e3TYFyxYIGkuKcz/1z6fBwrAG3r4F8i5c0ndf9uqT4alzM+UJrAqKgjLfUXN9UjVhnS1DjXRQ9tLSRapkDUjk8uhrWUIWDN2PbMGB73rBJTSDC18hGEAIQUcENK5DBztYMPfnsGL316IzS9vQGOqHz4/7yc4aNgUFIo9EFJWK+b7TOLl3v+L97XbJ/SxB4wvceY6eGGfkwL38YacOLC9dvB7+Mr6CgtLYCjRB4gRSxMAxpq0gONkcxnHD3sUObvvaOmHnx9z6sT7akZD/UaDfQcKwL9eVSiISC26ffVlYTn7syAINFjBXKlVIZS9znMSb6pqjMl6zdWGV1sTDBICrDRmTJqF2zN/xJJr70KmrQFtM0ch1STQNro/dKigA4WOpS9hyS8XYcNDK+B5HkaMnoxPf+QqTD5oBorlHkgpqq2xqVYrsLctKlUf6no53Xu98SkBGib6da4pHMR9gwZ1tg0ci5RRa1mUhCErDH6mWNicJO1wzbdmF7WameBIV2ZyGeGF3d3segtbBpZ/c9zsac9EFXvBAghz8Enh32x9deD1htz8c9WjD6w5Lb/LuUv7YE2h8daqvtD3fo5qBDtRGjHVeTPjjafQ3NCMR566A9/770/BC4zRcCaXweCJI+EVSgi8Mro2tCME0NzSHycefy7OPv3DGDloDEqlgnHr5cquoKrrJaofocF7BE5qMI6ajoLrNQTU6+GsGr25voln3a6ijmV3L6oO9RENEi/w4819TaHXMPZxpCWEk8lkTRAbF1ensur6xv70x5nHT1wNGKfpqVOn0r/rtj9QAP51fgLo6OhoefKB9mcR5MaFylNEJGtmd+5jw1S3ACQVfTWOXVUHImLY5TJZvLLmBdz90HV49dXnsXnbOvieBwBISRcDBg7H5MmH4bRTLsK0ybPAfogg8C3RhRK3X/LQVx+Ueu0915a1Pthxe64atA88LdoHKlcd8VOVQ2H9vT0nvAFB2pi62/W9sNkPJv2LFGsWKSct0uk0yl6X57rq3mxL+OcJh/HdAwce3BNdCHPmzPmXgnsHRgD8uwJFF0kA4YvP7j4vJZrGFYJiSJIcjsIniFANd1OdGRXVDLJerLk+QKiIPy8IJa+IyWMPwyHjZqKrsBtbd65Dd34XQqXR2jIQg9tGojnXBq01vEIBJIyYp/pyrRn6qe5OouK/ZwkvTNyrQ6F9PujcNyCwHwWC+3g7qrfTi/kVoCS9r+KPUBUFrQGwlK6TddOO0h40FVaIVH7h4EG44bATJixLzvfLllVMXP5/fB0oAP/012wNAH6POA2K2Czcue8VVl9XadX/TiABlvaLKkIvV7fnDAiS8LwSygykZBYHDT80PuBahwjDAF45b1h70gHX4gp1DhslAIFaogtVmQ5Sjccd7fEIM1XzCf4pFM5Y4dDbB6GqXBpOc5+diflutCYNCOHIdDYrSSh4qme7ksU7m1qw4KhTnUVEY8uVNv9KmjMH+l+1yz8wAvx/pCECiJmZ7r5p7dOk0jP90NOUnP0T6z5K/jX3gahz/aufE6m48e0bEVKontGsValFPP5EO8+9pg5bVojqr93rDN6E3mPAHlf4tAfIYw/3OvXxztxrHorAPaopQNFNXwswVs31dmfPEOTKTDoDRwB+WChKVz/qZoMbW0aU75g+ffr25G0/Zxn4jczxO9ABvKmwAF0JsqPeqyau5wLJCXVJ4r+SnJkqMK4WDexzl2aZb33IVKn2gFH9Y1b7PewLhr/nv6xryl+lsGHUaRX6BFNqSNyWw4gEhlFduyhRZpnBpJkhpEwJ181IQQzfz3drzj8BJ7itbTjde/gx41clwV5gDt4st/2BAvDGN1Q8b56Rbt69YOUmInk4MxklTpJ9liDKoiaptq9TRfUCrGunhF6IXAUZ5H05pVxnvn8d/aQJ1uA630uCwtur66E6RJ4+4JJEp1Krqa98OKre/lXRfG0LxqQJTCApU06KUo4rwtCDH5a3K116SmT49tYB4X3HnHzwuiTIu+jKRXL2lbPVm/XQHygAbyQCgEViPqCdFD/DSpzDzCaUQyQebbLG0kx7AtT73ouDq4ko9e/LPsE37mUU9vpmw96il3255anutoMJe27rqcY8I+7yaY8DQ7R4JGbNJgyRiKR03TS5jiuYQwRBsQwuvKqYF7sZ3Nc6Inhq5szJ7VUKzoUQVy6Labrhv5qxd6AAvGkKgAEBBw7K3rplY3GeJEcwAiaWlNg7VTDnaJjnXgtr1LuPuUaOSnE5qOknuNJn0J5Qck7eudQbBKRaMILQZ1fO9Q4/9ULgGXU+JvftmVc9fSR6+EQ0G1fjK8bN23z/jitT5LhpKSSg2Yfvl31Nwau+Vo87Kb144IDss4fPHrs66bgzbx6LqVNBy5ZdGR16hf+lGXgHXvhn+wqymD+f9OLbV17FYdtXu3u6ApJwyIZBcx0FqXX0qJl5uWbn1xdoxnVZcPFNT7QPu/cq75peM3N9Qn8d0JFQTfbZwyPGtay+xA3PtXr6uq2GTWfRzNomgJEQ0nXScF0XBI2SlwdRuFk6cjmkes5x1PMtzXjpiNmTVtbu5RcsYAkgmukZ/0dCMA+83oBtwLx5oCuvBBbdtvpPpPu/tzvfHQrBouI2wYntIMXoM/Pee3iq2ZbHd/8+kPJ6zxmcOOvUq/BU7Ky4z5JRDbJzb+AuRuS5BolPrv54L6OKPez2iicWREJIR7pwpGu8/HWAsl/oFsSvkNRLs1m8kMrJZweO3rli4sRZ3agj1JoD4Mpl4Pnzo4jn/3spuAdebxgj0Dy2j9y27qfKz32y6PvQ7IcgkhTbUCSab64BxiJMi3vfp1wz5/bSDPXx2+59oVcj/3XF7/E7cJ1/oQQDscr4PiL0ElhW17IEYMlMvTAM7nXYmYSQ0hEupOPCEQLMIUpeXgtJ66XUrwmpX5IpPJFtxJOzTp64qY7bs5iN2WL21NmMZWD6P3rgDxSAf0MRAIgfu3P1h0pF97tEDQOLxR5moRWBZOwDbw+ZjrL6Ek41tUUAVUSg2Gxmj00+1WJwXLNqrLfio0pfkMizryHT1pnN49jtqCVx7CfWNcqZiJ7PMbLJICGEQ1JIONKBsDe7FxQDR2CrdNRrJPhpKdWL5AbLJhwarB4+fGax9ttdsIDFwGWLaPaVs7U1eeUDT+SBAvBvKQK4EkTzSa9ZtmX0hrXhfK+IixyZk6VyAQwOyWReCjBV3cxJB589koV6EdmTkuHebDyOtOu9sDXq+8HgPWkAqVr3Y41Izf0OBktOshqMpaAQUjiQQkKQMOpDVgiVD81BN4TaSMSvSonlwuEXsxlveXaa2nDo0EML9VOUFompU2fzsmVX8t58GQ+8DhQA/DuMQSJO+DP3rz6qJ+9c7nt4ZzrVlPODAL5fjkLGrJNetOvimjac0JfahmsG/ejWJkIifGJPD0AdVizqC30Y8a0d2f9wnIPCTJq1EFLYmzxlvAXIcCJV4CNUfkDEu5n1VnKwxnHwqpRYkWmklQ0N4eZDjhy/pd6encG0aN4iOXvqbMYcS506cLsfKAB4c6QOCeBKzLd00Ref3jRp947wHX6J52glj0qnGhGEAQK/BAYro6th4shL2rTIREk1e2Jj2KsAJGi9CT5MnaCwCnnXcueq+v1KY0IgBmlmQSRICAkpCFKmIIUEEYNZQXMI3y+CobocB+1MtFkK2qyJ16YcuTaVoY3pBlo/ZLS7c/jw4bv7OsDz5rGYjUVi59TZPGcZ2NplHTjsBwrAm98s5MorERcCAHj2obWzurpxeuDh7TrEYdlss0MQ0DqE0gpBaP6bWQFgTRAJ3D/pEEyVeTvpl1Flv1fh6bHNorQHHyJuye2NbVNvyEaLhSpEEHrQyvdZYJckbheO2MQ63CpS2OlIWk+O2tzcnNqazTibJx9OHUSjSntLQF6ERQIAdk7dycuWLeOE6eqB14EC8L+XLzAbi8TJ80+uShF68v6VU8olmhn4YqoK1XilxVBmDNaaBzDQmHLTQopURUzENkmauU8nHUqEiFj7UKMKVAE0c0DgkIh8ElyWRHnN3CMIPcJBp4DYLITaLhy0k1CbVOhty2SdXRMOd7e3tU3o2ftBZVqwYKFYtmwgzQZQc6NjX+LTDrwOFID/1b+HBQsWiIHLBlJtMYheK1eubN74sjfQbXCHQLlDPS/sD3ZbNLgNjH4kRA6s0qxZggQImolkQEQeE8qktQ8hPGYU8f/2/9cXRibGz4z/GT6xcTK/ZmD8/47p/5+vfxgZfgpKsn6TlPz1TURE4yuxB1jABuEcHCB8h9cO/1czrGYYrckHPwAAdYv7Pt/oYckAAAAASUVORK5CYII=';
(() => {
'use strict';
/* --- 00_core.js --- */
/* ===== Ядро: утилиты, зоны, состояние, сохранения ===== */
const B = BAL, A = ART, AU = AUDIO, P = PLATFORM;
const $ = id => document.getElementById(id);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NG = B.GRADES.length;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = arr => arr[Math.floor(rnd() * arr.length)];

/* ---------- форматирование ---------- */
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  n = Math.floor(n);
  if (n < 1000) return String(n);
  let i = 0, v = n;
  while (v >= 1000 && i < SUF.length - 1) { v /= 1000; i++; }
  const s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  return s.replace(/\.?0+$/, '') + SUF[i];
}
const pct = v => { const p = v * 100; return (p < 10 ? p.toFixed(1).replace(/\.0$/, '') : p.toFixed(0)) + '%'; };
function plural(n, f) { n = Math.abs(Math.floor(n)) % 100; const d = n % 10; if (n > 10 && n < 20) return f[2]; if (d > 1 && d < 5) return f[1]; if (d === 1) return f[0]; return f[2]; }
const CRY_W = ['кристалл', 'кристалла', 'кристаллов'];
const GEM_W = ['самоцвет', 'самоцвета', 'самоцветов'];
function dur(sec) { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h} ч ${m} мин` : `${Math.max(1, m)} мин`; }
function left(ms) {
  if (ms <= 0) return '0:00';
  const s = Math.ceil(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  if (d) return `${d} д ${h} ч`;
  if (h) return `${h} ч ${m} мин`;
  return `${m}:${String(ss).padStart(2, '0')}`;
}
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
function msToMidnight() { const d = new Date(); const n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); return n - d; }
function msToWeekEnd() { const d = new Date(), day = (d.getDay() + 6) % 7; const n = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 7); return n - d; }

/* ---------- зоны ---------- */
const ZONES = [
  { id: 'z1', name: 'Сакуровый лес', sky: ['#8fd3ff', '#c6e5ff', '#ffe1ef'], orb: { x: .8, y: .26, r: 20, c: '#fff6d8', glow: '#fff2b0' }, clouds: 'rgba(255,255,255,.85)',
    far: [{ c: '#c3d3f3', p: .06, f: .011, base: 80, amp: 36 }, { c: '#9ab7e6', p: .14, f: .019, base: 44, amp: 26 }],
    prop: 'sakura', seed: 3, ground: ['#79c66f', '#a3e08e', '#62ab5c', '#4f9a4c'], amb: 'petal', ui: '#ff8fc1',
    mons: [['slime', { a: '#ff8ec2', b: '#ffc4de', e: '#fff' }], ['mushroom', { a: '#e8485c', b: '#ff9a9a', c: '#fff1e0', e: '#fff' }], ['slime', { a: '#5fd6a8', b: '#b8f5dc', e: '#fff' }]],
    boss: ['slime', { a: '#ff5fa8', b: '#ffb0d6', e: '#fff' }, 'Королева слизней'] },
  { id: 'z2', name: 'Лунная долина', sky: ['#141a4a', '#36307a', '#7a5bb0'], stars: true, orb: { x: .78, y: .28, r: 18, c: '#fffbe8', glow: '#cfd8ff', moon: true },
    far: [{ c: '#2f2a6a', p: .06, f: .012, base: 76, amp: 38 }, { c: '#21305a', p: .14, f: .02, base: 42, amp: 28 }],
    prop: 'pine', propC: ['#1c3a4a', '#2a1e30'], seed: 5, ground: ['#2d4a54', '#3f6b6b', '#233b42', '#56907f'], amb: 'firefly', ui: '#9a7ad8',
    mons: [['bat', { a: '#6a4fb5', b: '#9a7ad8', e: '#fff' }], ['ghost', { a: '#7fb2ff', b: '#d6e8ff', e: '#fff' }], ['goblin', { a: '#7fbf5a', b: '#5f9f4a', c: '#8a5a3a', e: '#fff' }]],
    boss: ['bat', { a: '#4a2f8a', b: '#7a5ad0', e: '#fff' }, 'Князь нетопырей'] },
  { id: 'z3', name: 'Песчаные руины', sky: ['#ffb26b', '#ffd99a', '#fff0c8'], orb: { x: .2, y: .3, r: 26, c: '#fff3c4', glow: '#ffd27a' },
    far: [{ c: '#e8b77a', p: .06, f: .01, base: 60, amp: 30 }, { c: '#d39a5c', p: .14, f: .018, base: 34, amp: 20 }],
    prop: 'ruin', propC: ['#d8b07a', '#b88e5a', '#e9c896'], seed: 7, ground: ['#e6c27e', '#f2d79a', '#c9a462', '#b8954f'], amb: 'sand', ui: '#f2b84b',
    mons: [['golem', { a: '#c9a46a', b: '#a8834f', c: '#7fbf5a', e: '#7fe3ff' }], ['slime', { a: '#f2b84b', b: '#ffe39a', e: '#fff' }], ['goblin', { a: '#c2a25a', b: '#9a7e3e', c: '#6a4a8a', e: '#fff' }]],
    boss: ['golem', { a: '#b8935a', b: '#8f6d3c', c: '#5fbf6a', e: '#ff6b6b' }, 'Страж руин'] },
  { id: 'z4', name: 'Ледяной перевал', sky: ['#7fb6e8', '#bfe0f7', '#eef8ff'], clouds: 'rgba(255,255,255,.7)', orb: { x: .7, y: .22, r: 18, c: '#ffffff', glow: '#dff3ff' },
    far: [{ c: '#c8dcf0', p: .06, f: .012, base: 84, amp: 44, snow: '#ffffff' }, { c: '#9fbcdc', p: .14, f: .02, base: 46, amp: 30, snow: '#eaf6ff' }],
    prop: 'pine', propC: ['#3f6d78', '#4a3a3a', '#f4fbff'], seed: 11, ground: ['#e8f3fb', '#ffffff', '#c9deee', '#b4cde2'], amb: 'snow', ui: '#7cc8ff',
    mons: [['crystal', { a: '#4fa8e8', b: '#bfe9ff', e: '#fff' }], ['slime', { a: '#6fd6ef', b: '#d2f6ff', e: '#fff' }], ['ghost', { a: '#c9d8f2', b: '#ffffff', e: '#fff' }]],
    boss: ['crystal', { a: '#2f7fd8', b: '#9fdcff', e: '#fff' }, 'Ледяное сердце'] },
  { id: 'z5', name: 'Огненный вулкан', sky: ['#3a0f1c', '#8a2a2a', '#ff8a4c'], orb: { x: .82, y: .2, r: 20, c: '#ffb36b', glow: '#ff5a3c' },
    far: [{ c: '#4a1a22', p: .06, f: .012, base: 80, amp: 46 }, { c: '#2e1018', p: .14, f: .02, base: 44, amp: 30 }],
    prop: 'spire', propC: ['#24101a', '#ff7a3c'], seed: 13, ground: ['#3a1c1c', '#ff6a3c', '#2a1414', '#5a2a20'], amb: 'ember', ui: '#ff7a3c',
    mons: [['imp', { a: '#d9434f', b: '#7a1e2a', c: '#ffd25c', e: '#fff' }], ['wisp', { a: '#ff7a3c', b: '#ffcf5a', e: '#fff' }], ['golem', { a: '#4a3030', b: '#352222', e: '#ff7a3c' }]],
    boss: ['wisp', { a: '#ff5a2c', b: '#ffb03c', e: '#fff' }, 'Кицунэ пламени'] },
  { id: 'z6', name: 'Замок бездны', sky: ['#0f0820', '#2a1240', '#5a1f5c'], stars: true, orb: { x: .22, y: .26, r: 20, c: '#ff6b8a', glow: '#ff2f6a', moon: true },
    far: [{ c: '#24123a', p: .06, f: .012, base: 70, amp: 40 }, { c: '#180c28', p: .14, f: .02, base: 40, amp: 26 }],
    prop: 'tower', propC: ['#120a1e', '#ffcf5a'], seed: 17, ground: ['#2a1a3a', '#5a3a7a', '#1e1230', '#7a4a9a'], amb: 'mote', ui: '#ff62d4',
    mons: [['skull', { a: '#3a2452', b: '#4a3a6a', e: '#ff4f73' }], ['imp', { a: '#5a2a7a', b: '#2a1238', c: '#ff62d4', e: '#fff' }], ['ghost', { a: '#8a5ad8', b: '#d8b8ff', e: '#fff' }]],
    boss: ['skull', { a: '#ff62d4', b: '#2a1838', e: '#ff62d4' }, 'Рыцарь бездны'] },
  { id: 'z7', name: 'Небесный сад', sky: ['#1a1030', '#4a1f5c', '#ff9ad0'], stars: true, orb: { x: .78, y: .24, r: 22, c: '#ffe8f4', glow: '#ff8fc1' },
    far: [{ c: '#3a2452', p: .06, f: .012, base: 80, amp: 40 }, { c: '#2a1840', p: .14, f: .02, base: 44, amp: 28 }],
    prop: 'sakura', propC: ['#6a3a7a', '#ffb3d6'], seed: 23, ground: ['#5a3a6a', '#ffb3d6', '#4a2a5a', '#8a5a9a'], amb: 'petal', ui: '#ff9ad0',
    mons: [['crystal', { a: '#c58aff', b: '#ffe0ff', e: '#fff' }], ['ghost', { a: '#ffb3e8', b: '#fff0fa', e: '#fff' }], ['slime', { a: '#ff9ad0', b: '#ffe0f0', e: '#fff' }]],
    boss: ['crystal', { a: '#ff8fc1', b: '#ffe0f4', e: '#fff' }, 'Садовница звёзд'] },
  { id: 'z8', name: 'Храм времени', sky: ['#0a1f24', '#1f5a4a', '#ffd760'], orb: { x: .2, y: .26, r: 24, c: '#fff3c0', glow: '#ffd760' },
    far: [{ c: '#1a3a3a', p: .06, f: .012, base: 78, amp: 42 }, { c: '#122a2a', p: .14, f: .02, base: 42, amp: 28 }],
    prop: 'tower', propC: ['#102a2a', '#ffd760'], seed: 29, ground: ['#2a4a4a', '#d8c08a', '#1a3030', '#b8a06a'], amb: 'mote', ui: '#8fe0c0',
    mons: [['golem', { a: '#c9b07a', b: '#8a7040', e: '#ffd760' }], ['skull', { a: '#8a5a3a', b: '#d8b07a', e: '#8fe0c0' }], ['wisp', { a: '#8fe0c0', b: '#ffd760', e: '#fff' }]],
    boss: ['golem', { a: '#d8c08a', b: '#8a6a3a', e: '#ffd760' }, 'Хранитель часов'] },
];
const ARENA_ZONE = { id: 'arena', name: 'Арена', sky: ['#2a1a4a', '#7a3a6a', '#ffb07a'], orb: { x: .5, y: .3, r: 24, c: '#ffe8b0', glow: '#ffb07a' },
  far: [{ c: '#4a2a5a', p: .06, f: .012, base: 60, amp: 20 }, { c: '#3a2048', p: .14, f: .02, base: 34, amp: 12 }],
  prop: 'ruin', propC: ['#6a4a6a', '#4a3050', '#8a6a7a'], seed: 21, ground: ['#c9a46a', '#e6c27e', '#a8834f', '#8f6d3c'] };
const TYPE_SCALE = { slime: 1.15, mushroom: 1, bat: 1, goblin: 1, golem: 1.05, ghost: 1, imp: 1, skull: 1, wisp: 1, crystal: 1 };
function zoneOf(s) {
  const z = Math.floor(s / 10), base = ZONES[z % ZONES.length], loop = Math.floor(z / ZONES.length);
  return { ...base, z, idx: z % ZONES.length, loop, title: base.name + (loop ? ` · круг ${loop + 1}` : ''), num: `${z + 1}-${(s % 10) + 1}` };
}
const dropGradeTop = z => [1, 2, 3, 4, 5, 6][Math.min(z, 5)];
const crystalMul = g => [1, 1, 2, 4, 8, 16, 32][g];

/* ---------- навыки ---------- */
const ELEMENTS = {
  fire:  { name: 'Огонь',  color: '#ff7a3c' },
  water: { name: 'Вода',   color: '#7cc8ff' },
  wind:  { name: 'Ветер',  color: '#8fe0c0' },
  earth: { name: 'Земля',  color: '#e0b45c' },
};
const SKILLS = [
  { id: 'petal', name: 'Вихрь лепестков', unlock: 3, cd: 8, mp: 18, el: 'wind', type: 'aoe', prio: 3, icon: 'sk_petal', mult: l => 1.5 + .12 * (l - 1),
    desc: l => `Вихрь розовых лепестков бьёт всех врагов рядом на ${pct(1.5 + .12 * (l - 1))} атаки.` },
  { id: 'moon', name: 'Лунный разрез', unlock: 10, cd: 11, mp: 26, el: 'water', type: 'single', prio: 4, icon: 'sk_moon', mult: l => 3 + .25 * (l - 1),
    desc: l => `Рывок и один мощный разрез на ${pct(3 + .25 * (l - 1))} атаки.` },
  { id: 'flame', name: 'Пламенный клинок', unlock: 22, cd: 14, mp: 30, el: 'fire', type: 'cone', prio: 5, icon: 'sk_flame', mult: l => 2.2 + .18 * (l - 1),
    desc: l => `Конус огня на ${pct(2.2 + .18 * (l - 1))} атаки всем врагам впереди.` },
  { id: 'frost', name: 'Ледяные шипы', unlock: 34, cd: 16, mp: 34, el: 'water', type: 'multi', prio: 6, icon: 'sk_frost', mult: l => 1.4 + .12 * (l - 1),
    desc: l => `Три ледяных шипа по ${pct(1.4 + .12 * (l - 1))} атаки.` },
  { id: 'thunder', name: 'Небесный гром', unlock: 28, cd: 15, mp: 38, el: 'wind', type: 'multi', prio: 7, icon: 'sk_thunder', mult: l => 1 + .08 * (l - 1),
    desc: l => `Три молнии по ${pct(1 + .08 * (l - 1))} атаки каждая.` },
  { id: 'storm', name: 'Буря клинков', unlock: 55, cd: 22, mp: 50, el: 'wind', type: 'storm', prio: 8, icon: 'sk_storm', mult: l => .9 + .08 * (l - 1),
    desc: l => `Шесть быстрых ударов по ${pct(.9 + .08 * (l - 1))} атаки случайным врагам.` },
  { id: 'quake', name: 'Землетряс', unlock: 46, cd: 18, mp: 45, el: 'earth', type: 'aoe', prio: 9, icon: 'sk_quake', mult: l => 2.8 + .22 * (l - 1),
    desc: l => `Земля дрожит: ${pct(2.8 + .22 * (l - 1))} атаки всем и сильная отдача.` },
  { id: 'meteor', name: 'Метеор', unlock: 65, cd: 26, mp: 60, el: 'fire', type: 'meteor', prio: 10, icon: 'sk_meteor', mult: l => 6 + .5 * (l - 1),
    desc: l => `С неба падает метеор: ${pct(6 + .5 * (l - 1))} атаки по всем врагам.` },
  { id: 'spirit', name: 'Боевой дух', unlock: 18, cd: 24, mp: 34, el: 'fire', type: 'buff', prio: 1, icon: 'sk_spirit', mult: l => .25 + .03 * (l - 1),
    desc: l => `Атака +${pct(.25 + .03 * (l - 1))} на 8 секунд.` },
  { id: 'bloom', name: 'Цветение', unlock: 40, cd: 20, mp: 40, el: 'earth', type: 'heal', prio: 2, icon: 'sk_bloom', mult: l => .25 + .02 * (l - 1),
    desc: l => `Лечит ${pct(.25 + .02 * (l - 1))} здоровья и снижает урон на 30% на 5 секунд, когда здоровья меньше половины.` },
];
const SKILL_ORDER = SKILLS.slice().sort((a, b) => a.prio - b.prio);
const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
const SKILL_MAX = 20;
const skillIcon = (id, size = 64) => A.miscIcon(id, size);

/* ---------- состояние ---------- */
const SAVE_KEY = 'klinok-sakury-v1';
// Версия 4: пробуждение, башня, подземелья, главы, грань предметов.
// Старые сохранения (v3) переводятся без потери прогресса.
const SAVE_VERSION = 10;
const zeros = () => Array(NG).fill(0);
const isPlain = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => v === null || typeof v !== 'object' ? v : JSON.parse(JSON.stringify(v));
const newPid = () => 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
function fillDefaults(target, def) {
  for (const k in def) {
    if (target[k] === undefined) target[k] = clone(def[k]);
    else if (isPlain(def[k]) && isPlain(target[k])) fillDefaults(target[k], def[k]);
  }
  return target;
}
function newState() {
  const equip = {}; B.SLOTS.forEach(s => equip[s.id] = null);
  equip.weapon = 1; equip.upper = 2;
  const starterOpts = g => B.rollOpts(Math.random, g);
  return {
    v: SAVE_VERSION, savedAt: Date.now(), hero: null, pid: newPid(),
    gold: 20, crystals: 0, gems: 300, level: 1, xp: 0, sp: 0,
    growth: Object.fromEntries(B.GROWTH.map(g => [g.id, 0])),
    skills: Object.fromEntries(SKILLS.map(s => [s.id, 0])),
    skillOn: Object.fromEntries(SKILLS.map(s => [s.id, true])),
    items: [{ id: 1, slot: 'weapon', g: 0, e: 0, pt: 0, opts: starterOpts(0) }, { id: 2, slot: 'upper', g: 0, e: 0, pt: 0, opts: starterOpts(0) }],
    equip, nextId: 3,
    scrolls: { w: [0, 2, 0, 0, 0, 0, 0], a: [0, 3, 0, 0, 0, 0, 0], bw: zeros(), ba: zeros() },
    stage: 0, maxStage: 0, bestStage: 0, kills: 0, autoBoss: true,
    stats: { kills: 0, bosses: 0, breaks: 0, enchants: 0, best: 0, summons: 0, arenaWins: 0, arenaFights: 0, dungeonRuns: 0, awakenings: 0, rerolls: 0 },
    pets: { owned: {}, active: null },
    exped: { id: '', until: 0, pet: null },
    gacha: { pity: 0, total: 0, tickets: 1, first10: false },
    arena: { rating: B.ARENA.start, day: '', tickets: B.ARENA.tickets, buys: 0, wins: 0, losses: 0, rewardDay: '', seed: 1, fights: 0, season: -1, history: [] },
    quests: { day: '', prog: {}, claimed: {}, chest: false },
    weekly: { week: '', prog: {}, claimed: {}, chest: false },
    ach: {},
    login: { idx: 0, last: '' },
    pass: { season: -1, xp: 0, free: [], prem: [], premium: false },
    shop: { noAds: false, starter: false, monthlyUntil: 0, monthlyDay: '', cosmetic: null, cosmetics: [], firstTopup: false, starterSeen: false },
    boost: { goldUntil: 0 },
    ads: { day: '', gems: 0, freeSummon: false, boosts: 0 },
    settings: { music: .55, sfx: .75, autoBuyBreak: true, autoEnchantTo: 7, tutorialDone: false },
    tutorial: { done: false, step: 0 },
    intro: false,
    aw: { petals: 0, count: 0, lvl: Object.fromEntries(B.AW_NODES.map(n => [n.id, 0])) },
    tower: { floor: 0, best: 0, week: '', reward: 0, auto: false },
    dungeon: { day: '', keys: B.DKEYS.perDay, ads: 0, buys: 0, runs: 0, stage: 0 },
    fund: { owned: false, claimed: [] },
    chapter: { idx: 0, claimed: [] },
    event: { season: -1, coins: 0, total: 0, claimed: [], bought: {}, day: '', today: 0 },
    lantern: { season: -1, coins: 0, total: 0, claimed: [], bought: {}, day: '', today: 0 },
    codex: { 'weapon:0': 1, 'upper:0': 1 },
  };
}
function migrate(o) {
  if (!o || typeof o !== 'object') return newState();
  if ((o.v || 1) < 3) return newState();          // совсем старые сохранения несовместимы
  const wasV = o.v || 1;
  const d = newState();
  fillDefaults(o, d);
  o.v = SAVE_VERSION;
  if (wasV < 10 && o.tutorial && !o.tutorial.done) o.tutorial.done = true;   // старым игрокам обучение не показываем
  for (const k of ['w', 'a', 'bw', 'ba']) {
    o.scrolls[k] = Array.isArray(o.scrolls[k]) ? o.scrolls[k] : zeros();
    while (o.scrolls[k].length < NG) o.scrolls[k].push(0);
    o.scrolls[k] = o.scrolls[k].slice(0, NG).map(n => Math.max(0, Math.floor(n) || 0));
  }
  for (const g of B.GROWTH) o.growth[g.id] = o.growth[g.id] || 0;
  for (const s of SKILLS) o.skills[s.id] = o.skills[s.id] || 0;
  if (!o.skillOn || typeof o.skillOn !== 'object') o.skillOn = {};
  for (const s of SKILLS) o.skillOn[s.id] = o.skillOn[s.id] !== false;
  for (const sl of B.SLOTS) if (!(sl.id in o.equip)) o.equip[sl.id] = null;
  if (!Array.isArray(o.items)) o.items = [];
  for (const it of o.items) {
    if (!Number.isFinite(it.id)) it.id = o.nextId++;
    if (!Array.isArray(it.opts)) it.opts = seededOpts(it);
    if (!Number.isFinite(it.pt)) it.pt = 0;
    if (!Number.isFinite(it.e)) it.e = 0;
    if (!Number.isFinite(it.g)) it.g = 0;
  }
  o.nextId = Math.max(o.nextId || 3, ...o.items.map(i => i.id + 1), 3);
  if (!isPlain(o.aw.lvl)) o.aw.lvl = {};
  for (const n of B.AW_NODES) o.aw.lvl[n.id] = clamp(Math.floor(o.aw.lvl[n.id] || 0), 0, n.max);
  o.aw.petals = Math.max(0, Math.floor(o.aw.petals || 0));
  o.bestStage = Math.max(o.bestStage || 0, o.maxStage || 0);
  o.tower.best = Math.max(o.tower.best || 0, o.tower.floor || 0);
  if (!Array.isArray(o.fund.claimed)) o.fund.claimed = [];
  if (!Array.isArray(o.chapter.claimed)) o.chapter.claimed = [];
  if (!isPlain(o.codex)) o.codex = {};
  for (const it of o.items) if (it && it.slot) o.codex[it.slot + ':' + (it.g | 0)] = 1;
  o.chapter.idx = clamp(Math.floor(o.chapter.idx || 0), 0, 40);
  if (!o.pid) o.pid = newPid();
  if (!Array.isArray(o.pass.free)) o.pass.free = [];
  if (!Array.isArray(o.pass.prem)) o.pass.prem = [];
  return o;
}
// свойства предмета из старых сохранений: стабильны, чтобы не менялись при перезагрузке
function seededOpts(it) {
  let s = (it.id * 2654435761 + (it.g + 1) * 40503) % 2147483647 || 1;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return B.rollOpts(r, it.g);
}
let S = null;
function rawGet() {
  try {
    const st = P.getStorage && P.getStorage();
    if (st) {
      const v = st.getItem(SAVE_KEY);
      if (v) return v;
      // перенос сохранения из localStorage в безопасное хранилище площадки
      const old = localStorage.getItem(SAVE_KEY);
      if (old) { try { st.setItem(SAVE_KEY, old); } catch (e) { } return old; }
    }
  } catch (e) { }
  try { return localStorage.getItem(SAVE_KEY); } catch (e) { return null; }
}
function rawSet(v) {
  try { const st = P.getStorage && P.getStorage(); if (st) st.setItem(SAVE_KEY, v); } catch (e) { }
  try { localStorage.setItem(SAVE_KEY, v); } catch (e) { }
}
function loadLocal() { try { const raw = rawGet(); if (raw) return migrate(JSON.parse(raw)); } catch (e) { } return null; }
function saveLocal() { if (!S) return; S.savedAt = Date.now(); try { rawSet(JSON.stringify(S)); } catch (e) { } }

/* ---------- облако: база артефакта или Яндекс ---------- */
const Cloud = {
  db: null, uid: null, lastSent: '', busy: false, kind: 'none',
  async init() {
    if (P.mode === 'yandex') {
      this.kind = 'yandex';
      const raw = await P.loadCloud();
      if (raw) try { const o = migrate(JSON.parse(raw)); if (!R.hadLocal || (o.savedAt || 0) > (S.savedAt || 0) + 3000) adoptCloud(o); } catch (e) { }
      return;
    }
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      this.db = db; this.uid = uid; this.kind = 'artifact';
      const snap = await this.db.doc('data/users/' + uid + '/save').get();
      if (snap.exists) {
        const d = snap.data();
        if (d && typeof d.save === 'string') {
          const o = migrate(JSON.parse(d.save));
          if (!R.hadLocal || (d.savedAt || 0) > (S.savedAt || 0) + 3000) adoptCloud(o);
        }
      }
      Arena.cloudReady();
    } catch (e) { this.db = null; }
  },
  async push() {
    if (this.busy || !S || !S.hero) return;
    const body = JSON.stringify(S);
    if (body === this.lastSent) return;
    this.busy = true;
    try {
      if (this.kind === 'yandex') { if (await P.saveCloud(body)) this.lastSent = body; }
      else if (this.db) { await this.db.doc('data/users/' + this.uid + '/save').set({ save: body, savedAt: S.savedAt, stage: S.maxStage, level: S.level }); this.lastSent = body; }
    } catch (e) { if (e && ['invalid_argument', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed'].includes(e.code)) this.db = null; }
    this.busy = false;
  },
};
function adoptCloud(o) {
  applyState(o);
  toast('Загружено сохранение из облака');
  if (!S.hero) openIntro(false);
}

/* ---------- рантайм ---------- */
const battle = $('battle'), canvas = $('scene'), ctx = canvas.getContext('2d');
const R = {
  W: 400, H: 300, dpr: 1, k: 1, gy: 240, heroX: 100, scroll: 0, t: 0,
  monsters: [], fx: [], amb: [], shake: 0, flash: 0, flashC: '#fff',
  hero: { hp: 100, atkT: 0, swing: -1, hit: false, hurt: 0, dead: 0, cast: 0, castType: '', phase: 0, run: 0, dashT: 0, lungeT: 0, combo: 0, comboT: 0, dodgeT: 0 },
  pet: { t: 0, atkT: 0, attack: 0 },
  boss: null, bossPending: false, warn: 0, slow: 0, cd: {}, castLock: 0, buffs: { spirit: 0, guard: 0 },
  mp: 100, mpMax: 100, mpInit: false, hitStop: 0, heroOff: 0, cut: null, zoom: 0, dodge: .05, dodgeCount: 0, dodgeCd: 0, castLog: [],
  st: null, pb: null, look: null, aw: null, goldPos: { x: 300, y: 20 }, bagPos: { x: 120, y: 400 },
  imgs: new Map(), tab: 'hero', heroSeg: 'growth', petSeg: 'summon', trialSeg: 'tower', socialSeg: 'chat', mult: 1, shopTab: 'gear', shopGrade: 0, scrollGrade: 1,
  dirtyBank: false, paused: false, hadLocal: false, lastInter: 0, sessionStart: Date.now(),
  bossCd: 0, bossFails: 0, towerRun: false,
};
SKILLS.forEach(s => R.cd[s.id] = 0);
const isBoy = () => !!(S && S.hero && S.hero.body === 'boy');
const G = (f, m) => isBoy() ? m : f;
const heroName = () => (S && S.hero && S.hero.name) || G('Сакура', 'Рэн');

function img(url) { let i = R.imgs.get(url); if (!i) { i = new Image(); i.src = url; R.imgs.set(url, i); } return i; }

function resize() {
  const r = battle.getBoundingClientRect();
  R.W = Math.max(200, r.width); R.H = Math.max(200, r.height);
  R.dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(R.W * R.dpr); canvas.height = Math.round(R.H * R.dpr);
  R.k = Math.min(R.H / 330, R.W / 380); R.gy = R.H * .77;
  R.heroX = Math.max(84 * R.k, R.W * .24);
  const gr = $('icGold').getBoundingClientRect();
  R.goldPos = { x: gr.left - r.left + gr.width / 2, y: gr.top - r.top + gr.height / 2 };
  const tb = document.querySelector('[data-tab="gear"]').getBoundingClientRect();
  R.bagPos = { x: tb.left - r.left + tb.width / 2, y: R.H + 30 };
}

/* ---------- предметы и характеристики ---------- */
const itemById = id => S.items.find(i => i.id === id);
const isEquipped = it => S.equip[it.slot] === it.id;
const itemName = it => (it.e > 0 ? `+${it.e} ` : '') + B.NAMES[it.slot][it.g];
const scrollKind = slot => slot === 'weapon' ? 'w' : 'a';
/* грейд открывается по этапу, а не по уровню: R — это долгий путь */
const gradeUnlocked = g => (S.maxStage || 0) >= (B.GRADES[g].stage || 0);
const unlockOk = id => {
  const u = B.UNLOCK[id];
  if (!u) return true;
  if (u.stage != null && (S.maxStage || 0) < u.stage) return false;
  if (u.level != null && S.level < u.level) return false;
  return true;
};
const unlockLabel = id => { const u = B.UNLOCK[id]; if (!u) return ''; return u.stage != null ? `этап ${u.stage}` : `уровень ${u.level}`; };
function autoEquipBest(slot) {
  let best = null, bs = -1;
  for (const it of S.items) {
    if (it.slot !== slot) continue;
    const sc = itemScore(it.slot, it.g, it.e, it.opts);
    if (sc > bs) { bs = sc; best = it; }
  }
  if (best && S.equip[slot] !== best.id) { S.equip[slot] = best.id; return best; }
  return null;
}
// надеть лучшую по силе и заточке вещь в каждый слот (после загрузки и массовых покупок)
function equipBestAll() {
  for (const sl of B.SLOTS) autoEquipBest(sl.id);
}
const STAT_LABEL = { atk: 'Атака', def: 'Защита', hp: 'Здоровье', atkPct: 'Атака %', hpPct: 'Здоровье %', defPct: 'Защита %', regenPct: 'Восстановление', crit: 'Шанс крита', critDmg: 'Урон крита', goldPct: 'Золото', xpPct: 'Опыт', dropPct: 'Шансы свитков' };
const statStr = (k, v) => ['atkPct', 'hpPct', 'defPct', 'crit', 'critDmg', 'goldPct', 'xpPct', 'dropPct'].includes(k) ? '+' + pct(v) : k === 'regenPct' ? pct(v) + '/с' : fmt(v);
function itemTotals(it) {
  const s = B.itemStats(it.slot, it.g, it.e || 0);
  const o = B.optStats(it.opts);
  for (const k in o) s[k] = (s[k] || 0) + o[k];
  return s;
}
function itemScore(slot, g, e, opts) {
  const s = itemTotals({ slot, g, e, opts });
  return (s.atk || 0) * 3 + (s.def || 0) * 4 + (s.hp || 0) * .3 + (s.atkPct || 0) * 1e4 + (s.hpPct || 0) * 1e4
    + (s.defPct || 0) * 1e4 + (s.crit || 0) * 3e4 + (s.critDmg || 0) * 1e4 + (s.goldPct || 0) * 4e3 + (s.xpPct || 0) * 4e3 + (s.dropPct || 0) * 6e3;
}
function canEnchant(it) { if (!it || it.g === 0 || it.e >= B.MAX_ENCH) return false; const k = scrollKind(it.slot); return S.scrolls[k][it.g] + S.scrolls['b' + k][it.g] > 0; }
function glowClass(e) { return e >= 16 ? 'glow16' : e >= 13 ? 'glow13' : e >= 10 ? 'glow10' : e >= 7 ? 'glow7' : e >= 4 ? 'glow4' : ''; }
function tileHTML(it, attrs = '') {
  return `<button class="tile g${it.g} ${glowClass(it.e)} ${it.id && S && canEnchant(it) ? 'can-ench' : ''}" ${attrs} aria-label="${itemName(it)}"><img src="${A.itemIcon(it.slot, it.g)}" alt=""><span class="gr">${B.GRADES[it.g].short}</span>${it.e ? `<span class="ench">+${it.e}</span>` : ''}</button>`;
}
function equippedList() {
  const out = [];
  for (const sl of B.SLOTS) { const id = S.equip[sl.id]; const it = id && itemById(id); if (it) out.push({ slot: it.slot, g: it.g, e: it.e, opts: it.opts }); }
  return out;
}
function slotGrade(slot) { const id = S.equip[slot]; const it = id && itemById(id); return it ? it.g : -1; }
const awOf = () => B.awBonus(S && S.aw ? S.aw.lvl : {});
const codexCount = () => Object.keys(S.codex || {}).length;
const codexMax = () => B.SLOTS.length * NG;
// коллекция снаряжения: +0,2% атаки и здоровья за каждую новую вещь, максимум +12,6%
const codexBonus = () => Math.min(.126, codexCount() * .002);
function recalc() {
  const prevMax = R.st ? R.st.hp : 0;
  const aw = awOf();
  const cb = codexBonus();
  R.pb = B.petBonuses(S.pets.owned, S.pets.active);
  R.aw = aw;
  R.st = B.heroStats(S.level, S.growth, equippedList(), {
    atkPct: R.pb.atkPct + aw.atkPct + cb, hpPct: R.pb.hpPct + aw.hpPct + cb, crit: R.pb.crit + aw.crit, critDmg: R.pb.critDmg,
    goldPct: aw.goldPct, xpPct: aw.xpPct, dropPct: aw.dropPct,
  });
  R.power = B.power(R.st);
  const mpMax = 80 + S.level * 3 + (aw.mp || 0);
  R.mpMax = mpMax;
  if (!R.mpInit) { R.mp = mpMax; R.mpInit = true; }
  R.mp = Math.min(R.mp, mpMax);
  const h = R.hero;
  if (prevMax && R.st.hp > prevMax && !h.dead) h.hp += R.st.hp - prevMax;
  h.hp = clamp(h.hp, 0, R.st.hp);
  const wid = S.equip.weapon, w = wid && itemById(wid);
  R.look = {
    body: S.hero ? S.hero.body : 'girl', hair: S.hero ? S.hero.hair : 0,
    weapon: w ? { g: w.g, e: w.e } : null,
    helmet: slotGrade('helmet'), upper: slotGrade('upper'), lower: slotGrade('lower'), gloves: slotGrade('gloves'), boots: slotGrade('boots'),
    neck: slotGrade('neck'), ear: slotGrade('ear'),
    aura: R.st.set && R.st.set.glow ? R.st.set.g : -1,
    cosmetic: S.shop.cosmetic,
  };
  const bootsG = R.look.boots >= 0 ? R.look.boots : -1;
  R.dodge = Math.min(.28, .04 + S.level * .0012 + (bootsG >= 0 ? .012 * (bootsG + 1) : 0));
}
const red = s => R.st.def / (R.st.def + B.defK(s));
const spiritBonus = () => R.buffs.spirit > 0 ? SK.spirit.mult(S.skills.spirit) : 0;
const goldMul = () => (1 + R.pb.goldPct + (R.st.goldPct || 0)) * (Date.now() < S.boost.goldUntil ? 2 : 1);
const xpMul = () => (1 + R.pb.xpPct + (R.st.xpPct || 0));
const dropMul = () => 1 + R.pb.dropPct + (R.st.dropPct || 0);
const offlineHours = () => Math.min(24, 8 + (R.aw ? R.aw.offline : 0));
const bossTime = () => B.BOSS.time + (R.aw ? R.aw.bossTime : 0);
const petsOwnedCount = () => Object.keys(S.pets.owned).length;
/* шанс заточки с учётом искры неудач и древа пробуждения */
function enchInfo(it) {
  const target = it.e + 1;
  const base = B.enchChance(target);
  const pity = Math.min(B.ENCH.pityMax, (it.pt || 0) * B.ENCH.pityStep);
  const aw = R.aw ? R.aw.ench : 0;
  return { target, base, pity, aw, ch: Math.min(.95, base + pity + aw), safe: target <= B.SAFE, destructive: target >= B.ENCH.destroyFrom };
}

/* --- 10_battle.js --- */
/* ===== Бой: монстры, боссы, навыки, питомец, эффекты ===== */
function makeMonster(boss, x) {
  const s = S.stage, z = zoneOf(s);
  let type, pal, name = '';
  if (boss) [type, pal, name] = z.boss;
  else [type, pal] = pick(z.mons);
  const hp = B.mHp(s) * (boss ? B.BOSS.hp : (.92 + rnd() * .16));
  const m = {
    type, pal, name, boss, x, hp, maxHp: hp,
    dmg: B.mAtk(s) * (boss ? B.BOSS.atk : 1),
    t: rnd() * 10, atkT: rnd() * .6, atk: 0, pend: 0, flash: 0, dieT: 0,
    scale: (boss ? 1.9 : 1) * TYPE_SCALE[type], oy: 0, sq: 0, wind: 0, enr: false, tintA: 0, tintC: '#ffffff',
  };
  if (boss) Object.assign(m, { phase: 'enter', oy: -460, vy: 0, skillT: 3.2, windT: 0, windDur: 1, hopT: 0, auraT: 0 });
  return m;
}
const reachX = () => R.heroX + 58 * R.k;
const standX = m => reachX() + (m.boss ? 36 : 22) * R.k * (m.scale - 1);
function spawnLogic() {
  const alive = R.monsters.filter(m => m.hp > 0);
  const right = alive.reduce((a, m) => Math.max(a, m.x), -1e9);
  if (alive.length < 4 && right < R.W - 30 * R.k) {
    const n = 1 + (rnd() < .5) + (rnd() < .2);
    let x = Math.max(R.W + 30 * R.k, right + 70 * R.k);
    for (let i = 0; i < n; i++) { R.monsters.push(makeMonster(false, x)); x += 50 * R.k; }
  }
}
function clearMonsters(poof) {
  for (const m of R.monsters) if (m.hp > 0 && poof) puff(m.x, R.gy - 20 * R.k, '#ffffff', 10);
  R.monsters = R.monsters.filter(m => m.hp <= 0 && m.dieT > 0);
}

/* ---------- босс ---------- */
function startBoss() {
  if (R.boss || R.warn > 0 || R.hero.dead) return;
  clearMonsters(true);
  R.warn = RM ? .6 : 1.9;
  R.warnName = zoneOf(S.stage).boss[2];
  AU.sfx('warning');
  R.bossPending = true;
  updateMusic();
  log(`Приближается босс: ${R.warnName}.`, 'boss');
  updateHudStatic();
}
function spawnBoss() {
  const m = makeMonster(true, 0);
  m.x = standX(m) + 18 * R.k;
  R.monsters.push(m);
  R.boss = { m, time: bossTime(), active: false };
  R.bossPending = false;
  updateHudStatic();
}
function bossLand(m) {
  m.oy = 0; m.vy = 0; m.phase = 'fight'; m.sq = .3;
  R.boss.active = true;
  if (!RM) R.shake = .4;
  R.fx.push({ type: 'ring', x: m.x, y: R.gy - 4 * R.k, r0: 20 * R.k, r1: 190 * R.k, t: 0, life: .55, c: '#ffffff', flat: true });
  for (let i = 0; i < 22; i++) R.fx.push({ type: 'part', x: m.x + (rnd() - .5) * 60 * R.k, y: R.gy - 4 * R.k, vx: (rnd() - .5) * 320 * R.k, vy: -(60 + rnd() * 200) * R.k, g: 500 * R.k, size: (3 + rnd() * 4) * R.k, c: zoneOf(S.stage).ground[1], t: 0, life: .6 + rnd() * .3, shape: 'circle' });
  banner(m.name, `${Math.round(bossTime())} секунд на победу`, '#ff6b8a');
  AU.sfx('land');
  log(`Босс ${m.name} вступает в бой!`, 'boss');
}
function bossTick(m, dt) {
  const k = R.k;
  if (m.phase === 'enter') {
    m.vy += 2600 * dt; m.oy += m.vy * dt;
    if (m.oy >= 0) bossLand(m);
    return true;
  }
  m.sq *= Math.exp(-dt * 9);
  if (m.hopT > 0) { m.hopT -= dt; const p = 1 - Math.max(0, m.hopT) / .5; m.oy = -Math.sin(p * Math.PI) * 60; if (m.hopT <= 0) { m.oy = 0; m.sq = .25; bossWave(m); } }
  if (!m.enr && m.hp < m.maxHp * .5) {
    m.enr = true; m.skillT = Math.min(m.skillT, 1.2);
    banner('Ярость!', `${m.name} в гневе`, '#ff3d5c');
    AU.sfx('rage'); if (!RM) R.shake = .35; R.flash = .15; R.flashC = '#ff2a40';
    log(`${m.name} впадает в ярость: атаки быстрее и сильнее.`, 'boss');
  }
  if (m.windT > 0) {
    m.windT -= dt; m.wind = clamp(1 - m.windT / m.windDur, 0, 1);
    if (m.windT <= 0) { m.wind = 0; bossSpecial(m); m.skillT = (m.enr ? 3.6 : 5.6) + rnd() * 1.4; }
  } else if (!R.hero.dead) {
    m.skillT -= dt;
    if (m.skillT <= 0) { m.windDur = m.enr ? .65 : .95; m.windT = m.windDur; AU.sfx('windup'); }
  }
  if (m.wind > 0) { m.tintC = '#fff0b0'; m.tintA = .5 * m.wind; }
  else if (m.enr) { m.tintC = '#ff2a40'; m.tintA = .16 + .08 * Math.sin(m.t * 8); }
  else m.tintA = 0;
  m.auraT -= dt;
  if (m.auraT <= 0 && !RM) {
    m.auraT = m.enr ? .05 : .12;
    const top = A.monTop(m.type) * m.scale * k;
    R.fx.push({ type: 'part', x: m.x + (rnd() - .5) * 50 * k, y: R.gy - rnd() * top, vx: (rnd() - .5) * 20 * k, vy: -(30 + rnd() * 50) * k, g: 0, size: (1.5 + rnd() * 2) * k, c: m.enr ? '#ff4060' : (m.pal.b || '#ffffff'), t: 0, life: .8, shape: 'star' });
  }
  return m.windT > 0;
}
function bossWave(m) {
  const k = R.k, dmg = m.dmg * 2.2 * (m.enr ? 1.25 : 1);
  R.fx.push({ type: 'wave', x: m.x - 30 * k, y: R.gy, vx: -480 * k, dmg, t: 0, life: 3, c: m.pal.b });
  AU.sfx('slam'); if (!RM) R.shake = .25;
}
function bossSpecial(m) {
  const k = R.k, gy = R.gy, mult = m.enr ? 1.25 : 1, dmg = m.dmg * 2.1 * mult;
  const top = A.monTop(m.type) * m.scale * k;
  m.atk = .01;
  switch (m.type) {
    case 'slime': m.hopT = .5; break;
    case 'bat':
      for (let i = 0; i < 3; i++) R.fx.push({ type: 'sonic', x: m.x - 30 * k, y: gy - top * .62, vx: -400 * k, dmg: dmg / 3, delay: i * .14, t: 0, life: 3, c: '#c9a8ff' });
      AU.sfx('shot'); break;
    case 'golem':
      R.fx.push({ type: 'erupt', x: R.heroX + 8 * k, y: gy, delay: .35, dmg, t: 0, life: 1.2, c: m.pal.b });
      AU.sfx('slam'); if (!RM) R.shake = .2; break;
    case 'crystal':
      for (let i = 0; i < 3; i++) R.fx.push({ type: 'shard', x: R.heroX + (i - 1) * 16 * k, y: -30 * k, vy: 0, ty: gy - 30 * k, delay: i * .16, dmg: dmg * .4, t: 0, life: 3, c: '#bfe9ff' });
      AU.sfx('shot'); break;
    case 'wisp':
      for (let i = 0; i < 3; i++) R.fx.push({ type: 'fireball', x0: m.x - 20 * k, y0: gy - top * .7, x1: R.heroX + 12 * k, y1: gy - 50 * k, dur: .55, delay: i * .18, dmg: dmg * .4, t: 0, life: 3, x: m.x, y: gy - top * .7 });
      AU.sfx('shot'); break;
    case 'skull':
      R.fx.push({ type: 'dark', x: m.x - 40 * k, y: gy - 52 * k, vx: -540 * k, dmg, t: 0, life: 3 });
      AU.sfx('shot'); break;
    default:
      R.fx.push({ type: 'wave', x: m.x - 30 * k, y: gy, vx: -480 * k, dmg, t: 0, life: 3, c: '#ffffff' });
  }
}
function bossKilled(m) {
  R.slow = RM ? 0 : 1.1;
  R.flash = .25; R.flashC = '#ffffff';
  if (!RM) R.shake = .3;
  AU.sfx('victory');
}
function bossExplode(m) {
  const k = R.k, y = R.gy - A.monTop(m.type) * m.scale * k * .5;
  m.exploded = true;
  puff(m.x, y, m.pal.b || '#ffffff', 40);
  for (let i = 0; i < 30; i++) { const a = rnd() * Math.PI * 2; R.fx.push({ type: 'part', x: m.x, y, vx: Math.cos(a) * 300 * k, vy: Math.sin(a) * 220 * k - 80 * k, g: 120 * k, size: (3 + rnd() * 3) * k, c: rnd() < .5 ? '#ff8fc1' : '#ffd0e4', t: 0, life: 1 + rnd() * .5, shape: 'petal', rot: rnd() * 6, vr: (rnd() - .5) * 12 }); }
  R.fx.push({ type: 'ring', x: m.x, y, r0: 20 * k, r1: 220 * k, t: 0, life: .6, c: '#ffd760' });
  R.flash = .2; R.flashC = '#fff6d0';
  if (!RM) R.shake = .35;
  banner('Победа!', m.name + ' повержен', '#ffd760');
}
function bossWin() {
  const z0 = zoneOf(S.stage).z, first = S.stage >= S.maxStage;
  S.stats.bosses++;
  R.bossFails = 0; R.bossCd = 0;
  quest('bosses'); passXp(B.PASS.bossXp);
  S.stage++;
  if (S.stage > S.maxStage) S.maxStage = S.stage;
  if (S.maxStage > (S.bestStage || 0)) S.bestStage = S.maxStage;
  if (S.maxStage === B.AW.unlockStage && S.aw.count === 0) {
    toast('Открылось пробуждение: вкладка «Башня»');
    log('Доступно пробуждение: перерождение даст лепестки сакуры и вечные бонусы. Вкладка «Башня» → «Пробуждение».', 'good');
  }
  S.kills = 0;
  R.boss = null;
  addEventCoins(B.EVENT.boss, 'boss');
  addLanternDrop('boss');
  if (first) { S.gems += 10; log('Первая победа над боссом этапа: +10 самоцветов.', 'good'); }
  if (S.stats.bosses === 1) setTimeout(() => { if (S && S.hero && !modalState) Monet.openStarterOffer(); }, 2600);
  const z = zoneOf(S.stage);
  if (z.z !== z0) {
    setTimeout(() => banner(z.title, 'Новая зона', z.ui), 1800);
    log(`Вы вошли в зону «${z.title}». Здесь выпадают свитки грейда ${B.GRADES[dropGradeTop(z.z)].short}.`, 'good');
    Monet.maybeInterstitial();
  }
  updateMusic();
  updateHudStatic(); checkAch();
  if (R.tab === 'shop' || R.tab === 'hero') renderPanel();
}
function bossFail(why) {
  if (!R.boss) return;
  const m = R.boss.m;
  if (m.hp > 0) puff(m.x, R.gy - 40 * R.k, '#ff6b8a', 16);
  R.monsters = R.monsters.filter(x => x !== m);
  R.fx = R.fx.filter(f => !['wave', 'sonic', 'erupt', 'shard', 'fireball', 'dark'].includes(f.type));
  R.boss = null;
  // Мягкая стена, как в Slayer Legend: никакого штрафа, но и не бесконечные попытки.
  // Пока игрок фармит и растёт, босс вызывается сам; пауза между попытками растёт.
  R.bossFails++;
  R.bossCd = Math.min(300, 20 * Math.pow(1.6, Math.min(5, R.bossFails - 1)));
  banner('Босс устоял', why === 'time' ? 'Время вышло — фармим и вернёмся' : `${heroName()} ${G('пала', 'пал')} — фармим`, '#ff5d73');
  log(S.autoBoss
    ? `Босс не побеждён. ${G('Героиня', 'Герой')} фармит этап и вернётся через ${Math.round(R.bossCd)} с.`
    : 'Босс не побеждён. Усильтесь и вызовите его снова кнопкой «Босс».', 'bad');
  updateMusic();
  updateHudStatic();
}

/* ---------- удары ---------- */
function frontMonster() {
  let best = null;
  for (const m of R.monsters) if (m.hp > 0 && m.phase !== 'enter' && (!best || m.x < best.x)) best = m;
  return best;
}
function heroStrike(mult = 1) {
  const tgt = frontMonster();
  if (!tgt) return;
  const h = R.hero, heavy = h.combo === 2;
  R.mp = Math.min(R.mpMax, (R.mp || 0) + 1.5);
  const crit = rnd() < R.st.crit;
  const dmg = R.st.atk * (1 + spiritBonus()) * (crit ? R.st.critDmg : 1) * (.94 + rnd() * .12) * (heavy ? 1.18 : 1) * mult;
  const sx = tgt.x - 6 * R.k, sy = R.gy - 34 * R.k * Math.min(1.6, tgt.scale);
  R.fx.push({ type: 'slash', x: sx, y: sy, r: (heavy ? 46 : 34) * R.k * Math.max(1, tgt.scale * .8), a: (heavy ? -1.25 : -.9) + rnd() * .3, life: .2, t: 0, c: crit ? '#ffd760' : heavy ? '#ffb3d6' : '#ffffff', w: crit ? 8 : heavy ? 7 : 5 });
  R.fx.push({ type: 'impact', x: sx, y: sy, t: 0, life: .2, c: crit ? '#ffd760' : heavy ? '#ffb3d6' : '#ffffff', big: crit || heavy });
  hitDamage(tgt, dmg, crit);
  AU.sfx(crit ? 'crit' : 'hit');
  if (crit && !RM) R.shake = Math.max(R.shake, .12);
  if (heavy && !RM) { R.shake = Math.max(R.shake, .18); R.hitStop = .03; }
}
function hitDamage(m, dmg, crit, color) {
  if (m.hp <= 0) return;
  m.hp -= dmg; m.flash = .1;
  if (m.boss && dmg > m.maxHp * .04) m.sq = -.06;
  const top = A.monTop(m.type) * m.scale * R.k;
  const size = (crit ? 18 : 13) * Math.sqrt(R.k);
  let num = R.fx.find(f => f.type === 'num' && f.src === m && f.t < .22);
  if (num) {
    num.amount += dmg; num.t = 0; num.life = .9;
    if (crit && !num.crit) { num.crit = true; num.c = color || '#ffcf4a'; }
    num.text = fmt(num.amount) + (num.crit ? '!' : '');
    num.size = Math.max(num.size, size);
  } else {
    R.fx.push({ type: 'num', src: m, amount: dmg, x: m.x + (rnd() - .5) * 18 * R.k, y: R.gy - top - 4 * R.k, vy: -46 * R.k, t: 0, life: .9, text: fmt(dmg) + (crit ? '!' : ''), c: color || (crit ? '#ffcf4a' : '#ffffff'), size, crit });
  }
  for (let i = 0; i < (crit ? 7 : 4); i++) R.fx.push({ type: 'part', x: m.x - 4 * R.k, y: R.gy - top * .5, vx: (rnd() * 120 + 40) * R.k, vy: (rnd() - .7) * 160 * R.k, g: 300 * R.k, size: (2 + rnd() * 2.5) * R.k, c: crit ? '#ffe28a' : '#ffffff', t: 0, life: .35 + rnd() * .2, shape: 'star' });
  if (m.hp <= 0) killMonster(m);
}
function killMonster(m) {
  m.hp = 0; m.dieT = .001;
  const s = S.stage, z = zoneOf(s);
  const gold = B.mGold(s) * (m.boss ? B.BOSS.gold : 1) * (.9 + rnd() * .2) * goldMul();
  const xp = B.mXp(s) * (m.boss ? B.BOSS.xp : 1) * xpMul();
  S.gold += gold; S.stats.kills++;
  if (!m.boss && rnd() < B.EVENT.killChance) addEventCoins(1, 'kill');
  if (!m.boss) addLanternDrop('kill');
  quest('kills');
  gainXp(xp);
  const y = R.gy - A.monTop(m.type) * m.scale * R.k * .5;
  const coins = m.boss ? 18 : 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < coins; i++) R.fx.push({ type: 'coin', x: m.x, y, vx: (rnd() - .4) * 120 * R.k, vy: -(120 + rnd() * 140) * R.k, t: 0, life: 1.6 + rnd() * .3, by: R.gy - 4 * R.k });
  puff(m.x, y, m.pal.b || '#ffffff', m.boss ? 16 : 9);
  rollDrops(m, z, y);
  AU.sfx('coin');
  if (m.boss) { bossKilled(m); bossWin(); return; }
  if (S.kills < B.STAGE_KILLS) S.kills++;
  updateHudStatic();
}
function rollDrops(m, z, y) {
  const D = B.DROP, dm = dropMul();
  const give = (kind, blessed) => {
    const g = B.zoneDropGrade(z.z, rnd);
    S.scrolls[(blessed ? 'b' : '') + kind][g]++;
    R.fx.push({ type: 'drop', x: m.x, y, vy: -150 * R.k, t: 0, life: 1.7, img: img(A.scrollIcon(kind === 'w' ? 'weapon' : 'armor', g, blessed)) });
    log(`Вы получили: ${blessed ? 'благословенный свиток' : 'свиток'} заточки ${kind === 'w' ? 'оружия' : 'доспеха'} (${B.GRADES[g].short})`, blessed ? 'good' : 'drop');
    R.dirtyBank = true;
  };
  if (m.boss) {
    give(rnd() < .6 ? 'a' : 'w', false);
    if (rnd() < .5) give('a', false);
    if (rnd() < D.bossBlessed * dm) give(rnd() < .6 ? 'a' : 'w', true);
  } else {
    if (rnd() < D.armorScroll * dm) give('a', false);
    if (rnd() < D.weaponScroll * dm) give('w', false);
    if (rnd() < D.blessed * dm) give(rnd() < .6 ? 'a' : 'w', true);
  }
  if (rnd() < (m.boss ? .8 : D.crystals)) S.crystals += (1 + Math.floor(rnd() * 3)) * crystalMul(dropGradeTop(z.z)) * (m.boss ? 4 : 1);
}
function gainXp(x) {
  S.xp += x;
  let up = false;
  while (S.xp >= B.xpNeed(S.level)) {
    S.xp -= B.xpNeed(S.level); S.level++; S.sp++; up = true;
    const gr = B.GRADES.findIndex(g => g.lvl === S.level);
    if (gr > 0) { log(`В магазине открыто снаряжение: ${B.GRADES[gr].label}.`, 'good'); toast(`Открыт ${B.GRADES[gr].label}`); }
    const sk = SKILLS.find(s => s.unlock === S.level);
    if (sk) log(`Можно изучить навык «${sk.name}».`, 'good');
  }
  if (up) {
    recalc(); R.hero.hp = R.st.hp;
    banner('Уровень ' + S.level, 'Здоровье восстановлено', '#ff8fc1');
    log(`Уровень повышен до ${S.level}. Получено очко навыка.`, 'good');
    AU.sfx('level');
    checkAch();
    if (R.tab === 'hero' || R.tab === 'shop') renderPanel();
  }
}
function damageHero(raw, special) {
  const h = R.hero;
  if (h.dead) return;
  let dmg = raw * (1 - red(S.stage)) * (.9 + rnd() * .2);
  if (R.buffs.guard > 0) dmg *= .7;
  h.hp -= dmg; h.hurt = .22;
  R.fx.push({ type: 'num', x: R.heroX + (rnd() - .5) * 10 * R.k, y: R.gy - 120 * R.k, vy: -36 * R.k, t: 0, life: .8, text: '-' + fmt(dmg), c: '#ff6b7f', size: (special ? 17 : 13) * Math.sqrt(R.k) });
  if (special) { if (!RM) R.shake = Math.max(R.shake, .25); R.flash = .1; R.flashC = '#ff3050'; }
  if (h.hp <= 0) heroDie();
}
function monsterHit(m) {
  if (R.hero.dead || m.hp <= 0) return;
  if (R.dodgeCd <= 0 && rnd() < (R.dodge || 0)) { heroDodge(m); return; }
  damageHero(m.dmg * (m.enr ? 1.25 : 1), false);
  if (m.boss && !RM) R.shake = Math.max(R.shake, .14);
}
function heroDodge(m) {
  const h = R.hero, k = R.k, gy = R.gy;
  h.dodgeT = .32; h.hurt = 0; h.cast = 0;
  R.dodgeCd = 1.2;
  R.dodgeCount = (R.dodgeCount || 0) + 1;
  R.hitStop = Math.max(R.hitStop, .035);
  R.fx.push({ type: 'num', x: R.heroX, y: gy - 132 * k, vy: -24 * k, t: 0, life: .7, text: 'Уклонение', c: '#8fe0c0', size: 12 * Math.sqrt(k) });
  R.fx.push({ type: 'ring', x: R.heroX, y: gy - 46 * k, r0: 14 * k, r1: 74 * k, t: 0, life: .35, c: '#8fe0c0' });
  for (let i = 0; i < 10; i++) R.fx.push({ type: 'part', x: R.heroX + (rnd() - .5) * 30 * k, y: gy - 40 * k - rnd() * 50 * k, vx: (rnd() - .8) * 140 * k, vy: (rnd() - .5) * 80 * k, g: 40 * k, size: (1.5 + rnd() * 2) * k, c: '#8fe0c0', t: 0, life: .3 + rnd() * .2, shape: 'star' });
  AU.sfx('dodge');
  setTimeout(() => { if (!R.hero.dead && m.hp > 0) { R.hero.combo = 0; heroStrike(.7); } }, 150);
}
function heroDie() {
  const h = R.hero;
  h.hp = 0; h.dead = 3; h.swing = -1; h.cast = 0; R.mp = 0;
  log(`${heroName()} ${G('пала', 'пал')}. Возрождение через 3 секунды.`, 'bad');
  if (R.boss) bossFail('death');
  updateMusic();
}

/* ---------- навыки ---------- */
function trySkills(dt, engaged) {
  R.castLock -= dt;
  for (const s of SKILLS) R.cd[s.id] = Math.max(0, R.cd[s.id] - dt);
  if (R.hero.dead || R.castLock > 0) return;
  for (const s of SKILL_ORDER) {
    if (S.skillOn && S.skillOn[s.id] === false) continue;
    if (!S.skills[s.id] || R.cd[s.id] > 0 || (R.mp || 0) < s.mp) continue;
    if (canCast(s.id, engaged)) { cast(s.id); break; }
  }
}
function canCast(id, engaged) {
  if (id === 'bloom') return R.hero.hp < R.st.hp * .5;
  if (!engaged) return false;
  if (id === 'spirit') return R.buffs.spirit <= 0;
  return true;
}
function cast(id) {
  const s = SK[id], l = S.skills[id], h = R.hero;
  if (!s || !l || (R.mp || 0) < s.mp) return;
  R.mp -= s.mp;
  R.cd[id] = s.cd; R.castLock = s.type === 'buff' || s.type === 'heal' ? .35 : .5;
  R.castLog.push(id); if (R.castLog.length > 40) R.castLog.shift();
  h.cast = .4; h.castType = s.type; h.castEl = ELEMENTS[s.el].color;
  if (!R.cut && ['flame', 'quake', 'storm', 'meteor'].includes(id)) R.cut = { id, t: 0, life: .7 };
  if (['flame', 'quake', 'storm', 'meteor'].includes(id)) R.zoom = .3;
  if (s.type === 'single') { h.dashT = .28; }
  const atk = R.st.atk * (1 + spiritBonus());
  const k = R.k, gy = R.gy;
  const alive = R.monsters.filter(m => m.hp > 0 && m.phase !== 'enter');
  const critRoll = () => { const c = rnd() < R.st.crit; return [c ? R.st.critDmg : 1, c]; };
  const stack = R.fx.filter(f => f.type === 'skillname').length;
  R.fx.push({ type: 'skillname', x: R.heroX, y: gy - (150 + stack * 26) * k, t: 0, life: 1, text: s.name, el: s.el });
  const allIn = (range, mult, color) => {
    for (const m of alive) if (m.hp > 0 && m.x <= range) { const [cm, c] = critRoll(); hitDamage(m, atk * mult * cm, c, color); }
  };
  const burst = (x, y, color, n = 20, spread = 220) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      R.fx.push({ type: 'part', x, y, vx: Math.cos(a) * spread * k * (.4 + rnd()), vy: Math.sin(a) * spread * .7 * k * (.4 + rnd()), g: 60 * k, size: (2 + rnd() * 4) * k, c: color, t: 0, life: .5 + rnd() * .5, shape: rnd() < .4 ? 'star' : 'circle' });
    }
  };
  if (id === 'petal') {
    const range = R.heroX + 260 * k;
    R.fx.push({ type: 'ring', x: R.heroX + 60 * k, y: gy - 40 * k, r0: 20 * k, r1: 170 * k, t: 0, life: .45, c: '#ff8fc1' });
    for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2; R.fx.push({ type: 'part', x: R.heroX + 60 * k, y: gy - 40 * k, vx: Math.cos(a) * 260 * k, vy: Math.sin(a) * 160 * k, g: 40 * k, size: (3 + rnd() * 3) * k, c: rnd() < .5 ? '#ff8fc1' : '#ffd0e4', t: 0, life: .7 + rnd() * .3, shape: 'petal', rot: rnd() * 6, vr: (rnd() - .5) * 12 }); }
    setTimeout(() => { for (const m of alive) if (m.hp > 0 && m.x < range) { const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#ffb3d6'); } }, 120);
    AU.sfx('skill');
  } else if (id === 'moon') {
    const m = frontMonster(); if (!m) return;
    R.fx.push({ type: 'slash', x: m.x, y: gy - 40 * k * Math.min(1.6, m.scale), r: 90 * k, a: -.4, life: .38, t: 0, c: '#bfe6ff', w: 16 });
    R.fx.push({ type: 'trail', x: R.heroX + 20 * k, y: gy - 50 * k, tx: m.x, ty: gy - 50 * k, t: 0, life: .26, c: '#cfeaff' });
    R.flash = .12; R.flashC = '#cfeaff'; R.hitStop = .06;
    setTimeout(() => { const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#bfe6ff'); }, 90);
    AU.sfx('skill');
  } else if (id === 'spirit') {
    R.buffs.spirit = 8;
    R.fx.push({ type: 'ring', x: R.heroX, y: gy - 50 * k, r0: 10 * k, r1: 80 * k, t: 0, life: .5, c: '#ff8a4c' });
    burst(R.heroX, gy - 55 * k, '#ff8a4c', 18, 160);
    AU.sfx('buff');
  } else if (id === 'thunder') {
    const tg = alive.filter(m => m.x < R.W);
    for (let i = 0; i < 3; i++) {
      const m = tg.length ? tg[i % tg.length] : null; if (!m) break;
      setTimeout(() => {
        if (m.hp <= 0) return;
        R.fx.push({ type: 'bolt', x: m.x + (rnd() - .5) * 10 * k, y1: gy - 10 * k, t: 0, life: .28, seed: rnd() * 100 });
        R.flash = .08; R.flashC = '#fff6b0';
        const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#ffe55c');
        AU.sfx('thunder');
      }, i * 140);
    }
  } else if (id === 'bloom') {
    const heal = R.st.hp * s.mult(l);
    h.hp = Math.min(R.st.hp, h.hp + heal); R.buffs.guard = 5;
    R.fx.push({ type: 'num', x: R.heroX, y: gy - 130 * k, vy: -30 * k, t: 0, life: 1.1, text: '+' + fmt(heal), c: '#74e0a8', size: 18 * Math.sqrt(k) });
    for (let i = 0; i < 18; i++) R.fx.push({ type: 'part', x: R.heroX + (rnd() - .5) * 60 * k, y: gy - rnd() * 20 * k, vx: (rnd() - .5) * 30 * k, vy: -(60 + rnd() * 80) * k, g: -10 * k, size: (3 + rnd() * 2) * k, c: rnd() < .5 ? '#74e0a8' : '#ffd0e4', t: 0, life: 1 + rnd() * .5, shape: 'petal', rot: rnd() * 6, vr: (rnd() - .5) * 6 });
    AU.sfx('buff');
  } else if (id === 'flame') {
    for (let i = 0; i < 3; i++) R.fx.push({ type: 'slash', x: R.heroX + (80 + i * 55) * k, y: gy - (40 + i * 12) * k, r: (95 + i * 18) * k, a: -.3 + i * .18, life: .3 + i * .05, t: 0, c: '#ff7a3c', w: 14 });
    burst(R.heroX + 120 * k, gy - 55 * k, '#ff9a4c', 26, 260);
    R.flash = .12; R.flashC = '#ff7a3c'; R.shake = Math.max(R.shake, .16); R.hitStop = .04;
    setTimeout(() => allIn(R.heroX + 300 * k, s.mult(l), '#ffb36b'), 120);
    AU.sfx('skill');
  } else if (id === 'frost') {
    const tg = alive.filter(m => m.x < R.W).slice(0, 3);
    tg.forEach((m, i) => setTimeout(() => {
      if (m.hp <= 0) return;
      R.fx.push({ type: 'ice', x: m.x, y: gy - 30 * k, t: 0, life: .35, c: '#bfe9ff', k });
      R.fx.push({ type: 'slash', x: m.x, y: gy - 35 * k, r: 46 * k, a: 1.1, life: .3, t: 0, c: '#bfe9ff', w: 9 });
      const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#bfe9ff');
      R.shake = Math.max(R.shake, .08);
    }, i * 110));
    AU.sfx('skill');
  } else if (id === 'quake') {
    R.fx.push({ type: 'ring', x: R.heroX + 40 * k, y: gy - 6 * k, r0: 30 * k, r1: 260 * k, t: 0, life: .55, c: '#e0b45c' });
    for (let i = 0; i < 7; i++) R.fx.push({ type: 'erupt', x: R.heroX + (40 + i * 38) * k, y: gy, delay: .25 + i * .04, dmg: 0, t: 0, life: 1.1, c: '#c9a15c' });
    burst(R.heroX + 140 * k, gy, '#e0b45c', 24, 240);
    R.shake = Math.max(R.shake, .35); R.flash = .1; R.flashC = '#e0b45c'; R.hitStop = .07;
    setTimeout(() => allIn(R.W, s.mult(l), '#e0b45c'), 320);
    AU.sfx('thunder');
  } else if (id === 'storm') {
    const tg = alive.filter(m => m.x < R.W);
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const m = tg[Math.floor(rnd() * Math.max(1, tg.length))];
      if (!m || m.hp <= 0) return;
      R.fx.push({ type: 'slash', x: m.x, y: gy - 40 * k, r: 70 * k, a: rnd() * 6.28, life: .28, t: 0, c: '#8fe0c0', w: 11 });
      const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#8fe0c0');
      R.shake = Math.max(R.shake, .06);
    }, i * 75);
    AU.sfx('skill');
  } else if (id === 'meteor') {
    const tx = R.heroX + 180 * k;
    R.fx.push({ type: 'meteor', x: tx, y0: -60 * k, y1: gy, t: 0, life: .6, c: '#ff7a3c' });
    R.flash = .18; R.flashC = '#ffb36b';
    setTimeout(() => {
      R.fx.push({ type: 'ring', x: tx, y: gy - 10 * k, r0: 20 * k, r1: 300 * k, t: 0, life: .5, c: '#ff9a4c' });
      burst(tx, gy - 30 * k, '#ffcf5a', 40, 320);
      R.shake = Math.max(R.shake, .5); R.hitStop = .1;
      allIn(R.W, s.mult(l), '#ffcf5a');
    }, 600);
    AU.sfx('explode');
  }
}

/* ---------- питомец ---------- */
const activePet = () => S.pets.active && S.pets.owned[S.pets.active] ? B.PET[S.pets.active] : null;
const petPos = () => ({ x: R.heroX - 36 * R.k, y: R.gy - 112 * R.k + Math.sin(R.t * 2.5) * 5 * R.k });
function petTick(dt, engaged) {
  const pet = activePet(); if (!pet) return;
  R.pet.attack = Math.max(0, R.pet.attack - dt * 3);
  if (!engaged || R.hero.dead) return;
  R.pet.atkT += dt;
  if (R.pet.atkT < 3) return;
  R.pet.atkT = 0;
  const tg = frontMonster(); if (!tg) return;
  R.pet.attack = 1;
  const p = petPos(), stars = S.pets.owned[pet.id].stars;
  R.fx.push({ type: 'petshot', x: p.x + 14 * R.k, y: p.y, tg, c: pet.el, t: 0, life: 2.5, dmg: R.st.atk * B.PET_ATK[pet.r] * B.starMult(stars) * (1 + spiritBonus()) });
  AU.sfx('pet');
}

/* ---------- эффекты ---------- */
function puff(x, y, c, n) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, sp = (40 + rnd() * 110) * R.k;
    R.fx.push({ type: 'part', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40 * R.k, g: 120 * R.k, size: (3 + rnd() * 4) * R.k, c: rnd() < .5 ? c : '#ffffff', t: 0, life: .45 + rnd() * .3, shape: 'circle' });
  }
}
function banner(text, sub, c) {
  R.fx = R.fx.filter(f => f.type !== 'banner');
  R.fx.push({ type: 'banner', text, sub, c, t: 0, life: 1.9 });
}
function impact(x, y, c) {
  for (let i = 0; i < 10; i++) { const a = rnd() * Math.PI * 2; R.fx.push({ type: 'part', x, y, vx: Math.cos(a) * 150 * R.k, vy: Math.sin(a) * 150 * R.k, g: 200 * R.k, size: (2 + rnd() * 3) * R.k, c, t: 0, life: .4, shape: 'star' }); }
}
function updateFx(dt) {
  const k = R.k, hx = R.heroX;
  for (const f of R.fx) {
    f.t += dt;
    switch (f.type) {
      case 'num': f.y += f.vy * dt; f.vy *= .96; break;
      case 'part': f.vy += (f.g || 0) * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .98; if (f.rot !== undefined) f.rot += f.vr * dt; break;
      case 'coin':
        if (f.t < .7) { f.vy += 520 * k * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.y > f.by) { f.y = f.by; f.vy *= -.35; f.vx *= .6; } }
        else { const p = Math.min(1, (f.t - .7) / .5); f.x += (R.goldPos.x - f.x) * p * .35; f.y += (R.goldPos.y - f.y) * p * .35; if (p >= 1 || Math.hypot(R.goldPos.x - f.x, R.goldPos.y - f.y) < 8) f.t = f.life; }
        break;
      case 'drop':
        if (f.t < .35) { f.vy += 600 * k * dt; f.y += f.vy * dt; }
        else if (f.t > 1.05) { const p = Math.min(1, (f.t - 1.05) / .5); f.x += (R.bagPos.x - f.x) * p * .3; f.y += (R.bagPos.y - f.y) * p * .3; }
        break;
      case 'wave': case 'sonic': case 'dark':
        if (f.delay && f.t < f.delay) break;
        if (!f.hit) { f.x += f.vx * dt; if (f.x <= hx + 16 * k) { f.hit = true; damageHero(f.dmg, true); impact(hx + 10 * k, f.type === 'wave' ? R.gy - 10 * k : f.y, f.c || '#ff62d4'); f.life = f.t + .25; } }
        break;
      case 'erupt':
        if (!f.hit && f.t >= f.delay) { f.hit = true; damageHero(f.dmg, true); AU.sfx('slam'); }
        break;
      case 'shard':
        if (f.t < f.delay) break;
        if (!f.hit) { f.vy += 1800 * k * dt; f.y += f.vy * dt; if (f.y >= f.ty) { f.hit = true; damageHero(f.dmg, true); impact(f.x, f.ty, f.c); f.life = f.t + .2; } }
        break;
      case 'fireball': {
        if (f.t < f.delay) break;
        const p = Math.min(1, (f.t - f.delay) / f.dur);
        f.x = f.x0 + (f.x1 - f.x0) * p; f.y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 60 * k;
        if (p >= 1 && !f.hit) { f.hit = true; damageHero(f.dmg, true); impact(f.x, f.y, '#ffb03c'); f.life = f.t + .15; }
        break;
      }
      case 'petshot': {
        const m = f.tg;
        if (!m || m.hp <= 0) { f.life = 0; break; }
        const tx = m.x, ty = R.gy - A.monTop(m.type) * m.scale * k * .5;
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy), sp = 640 * k * dt;
        if (d <= sp + 6 * k) { hitDamage(m, f.dmg, false, f.c); impact(tx, ty, f.c); f.life = 0; }
        else { f.x += dx / d * sp; f.y += dy / d * sp; }
        break;
      }
    }
  }
  R.fx = R.fx.filter(f => f.t < f.life);
}

/* ---------- атмосфера зон ---------- */
function updateAmb(dt, z, runSpeed) {
  const k = R.k, W = R.W, H = R.H;
  const want = RM ? 10 : 34;
  while (R.amb.length < want) {
    const p = { x: rnd() * W, y: rnd() * H, t: rnd() * 10, s: .6 + rnd() * .8, r: rnd() * 6 };
    if (z.amb === 'sand') p.y = R.gy - rnd() * H * .6;
    R.amb.push(p);
  }
  for (const p of R.amb) {
    p.t += dt;
    switch (z.amb) {
      case 'petal': p.x -= (30 * p.s + runSpeed * .6) * dt; p.y += (22 * p.s) * k * dt; p.r += dt * 2; break;
      case 'snow': p.x -= (8 + runSpeed * .5) * dt; p.y += 26 * p.s * k * dt; break;
      case 'firefly': p.x += Math.sin(p.t * .7 + p.r) * 10 * dt - runSpeed * .3 * dt; p.y += Math.cos(p.t * .9 + p.r) * 8 * dt; break;
      case 'sand': p.x -= (120 * p.s + runSpeed) * dt; break;
      case 'ember': p.y -= 30 * p.s * k * dt; p.x -= (6 + runSpeed * .4) * dt + Math.sin(p.t * 2 + p.r) * 6 * dt; break;
      case 'mote': p.y -= 12 * p.s * k * dt; p.x -= runSpeed * .3 * dt; break;
    }
    if (p.y > H + 10) { p.y = -10; p.x = rnd() * W * 1.2; }
    if (p.y < -10) { p.y = H + 5; p.x = rnd() * W; }
    if (p.x < -20) { p.x = W + 10; if (z.amb === 'sand') p.y = R.gy - rnd() * H * .6; }
    if (p.x > W + 20) p.x = -10;
  }
}
function drawAmb(c, z) {
  const k = R.k;
  for (const p of R.amb) {
    switch (z.amb) {
      case 'petal': c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.s > 1 ? '#ffc4de' : '#ff9fcb'; A.ell(c, 0, 0, 3.6 * k * p.s, 2 * k * p.s); c.fill(); c.restore(); break;
      case 'snow': c.fillStyle = 'rgba(255,255,255,.9)'; A.ell(c, p.x, p.y, 1.8 * k * p.s, 1.8 * k * p.s); c.fill(); break;
      case 'firefly': {
        const a = .4 + .6 * Math.abs(Math.sin(p.t * 2 + p.r));
        c.fillStyle = `rgba(230,255,150,${a})`; c.shadowColor = '#e6ff96'; c.shadowBlur = 8 * k;
        A.ell(c, p.x, p.y, 1.8 * k, 1.8 * k); c.fill(); c.shadowBlur = 0; break; }
      case 'sand': c.strokeStyle = 'rgba(255,240,200,.45)'; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 14 * k * p.s, p.y); c.stroke(); break;
      case 'ember': c.fillStyle = `rgba(255,${120 + 80 * p.s | 0},60,${.6 + .4 * Math.sin(p.t * 5)})`; A.ell(c, p.x, p.y, 1.6 * k * p.s, 1.6 * k * p.s); c.fill(); break;
      case 'mote': c.fillStyle = `rgba(255,98,212,${.3 + .3 * Math.sin(p.t * 2 + p.r)})`; A.ell(c, p.x, p.y, 1.8 * k * p.s, 1.8 * k * p.s); c.fill(); break;
    }
  }
}

/* ---------- главный цикл ---------- */
let last = performance.now(), hudTick = 0, saveTick = 0, cloudTick = 0, minuteTick = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dtRaw = Math.min(.05, (now - last) / 1000); last = now;
  if (document.hidden || R.paused || !S || !S.hero) return;
  update(dtRaw);
  render();
  hudTick += dtRaw; saveTick += dtRaw; cloudTick += dtRaw; minuteTick += dtRaw;
  if (hudTick > .12) { hudTick = 0; updateHud(); }
  if (saveTick > 5) { saveTick = 0; saveLocal(); }
  if (cloudTick > 30) { cloudTick = 0; Cloud.push(); }
  if (minuteTick > 20) { minuteTick = 0; dailyReset(); ensureArenaSeason(); updateSideButtons(); checkAch(); Social.sync(); }
  // чат: подтягиваем новые сообщения, пока открыта вкладка
  if (R.tab === 'social' && R.socialSeg === 'chat') {
    R.chatT = (R.chatT || 0) + dtRaw;
    if (R.chatT > 6) { R.chatT = 0; Social.loadChat(); }
  }
  if (R.tab === 'trials' && R.trialSeg === 'world') {
    R.worldT = (R.worldT || 0) + dtRaw;
    if (R.worldT > 20) { R.worldT = 0; World.load(); }
  }
}

function update(dtRaw) {
  let dt = dtRaw;
  if (R.hitStop > 0) { R.hitStop = Math.max(0, R.hitStop - dtRaw); dt = dtRaw * .12; }
  if (R.cut) { R.cut.t += dtRaw; if (R.cut.t >= R.cut.life) R.cut = null; }
  if (R.zoom > 0) R.zoom = Math.max(0, R.zoom - dtRaw);
  if (R.dodgeCd > 0) R.dodgeCd = Math.max(0, R.dodgeCd - dtRaw);
  if (R.slow > 0) { R.slow = Math.max(0, R.slow - dtRaw); dt = dtRaw * .3; }
  R.t += dt;
  const h = R.hero, st = R.st, k = R.k;
  R.mp = Math.min(R.mpMax, (R.mp || 0) + (8 + S.level * .15) * dt);
  if (h.dashT > 0) { h.dashT = Math.max(0, h.dashT - dtRaw); R.heroOff = Math.sin((1 - h.dashT / .28) * Math.PI) * 34 * k; }
  else R.heroOff = 0;
  if (h.dodgeT > 0) { h.dodgeT = Math.max(0, h.dodgeT - dtRaw); R.heroOff -= Math.sin((1 - h.dodgeT / .32) * Math.PI) * 30 * k; }
  if (h.lungeT > 0) { h.lungeT = Math.max(0, h.lungeT - dtRaw); R.heroOff += Math.sin((1 - h.lungeT / .2) * Math.PI) * 14 * k; }
  if (h.comboT > 0) { h.comboT = Math.max(0, h.comboT - dtRaw); if (h.comboT === 0) h.combo = 0; }
  const z = zoneOf(S.stage);
  for (const b in R.buffs) R.buffs[b] = Math.max(0, R.buffs[b] - dt);
  if (h.hurt > 0) h.hurt -= dt;
  if (h.cast > 0) h.cast -= dt;
  if (R.shake > 0) R.shake -= dtRaw;
  if (R.flash > 0) R.flash -= dtRaw;

  if (h.dead > 0) {
    h.dead -= dt;
    if (h.dead <= 0) { h.dead = 0; h.hp = st.hp; R.mp = R.mpMax; log(`${heroName()} снова в строю.`, 'sys'); updateMusic(); }
  } else h.hp = Math.min(st.hp, h.hp + st.regen * dt);

  if (R.warn > 0) { R.warn -= dt; if (R.warn <= 0) { R.warn = 0; spawnBoss(); } }
  else if (R.boss) {
    if (R.boss.active) { R.boss.time -= dt; if (R.boss.time <= 0 && R.boss.m.hp > 0) bossFail('time'); }
  } else if (!R.bossPending) {
    spawnLogic();
    if (R.bossCd > 0) R.bossCd = Math.max(0, R.bossCd - dtRaw);
    if (S.kills >= B.STAGE_KILLS && S.autoBoss && !h.dead && R.bossCd <= 0) startBoss();
  }

  const alive = R.monsters.filter(m => m.hp > 0).sort((a, b) => a.x - b.x);
  const front = alive.find(m => m.phase !== 'enter');
  const engaged = !!front && front.x <= standX(front) + 3 && !h.dead;
  const run = R.warn <= 0 && !alive.some(m => m.phase === 'enter') && (!front || front.x > standX(front) + 3);
  h.run = run && !h.dead ? 1 : 0;
  // страховка: герой не должен стоять без дела дольше 2 секунд
  if (!h.run && !engaged && !h.dead && h.swing < 0) R.idleT = (R.idleT || 0) + dtRaw; else R.idleT = 0;
  if (R.idleT > 2) {
    R.idleT = 0;
    if (R.warn < 0) R.warn = 0;
    if (R.boss && !R.monsters.includes(R.boss.m)) R.boss = null;
    if (R.bossPending && !R.boss && R.warn <= 0) R.bossPending = false;
    for (const m of R.monsters) if (m.phase === 'enter' && R.boss && m === R.boss.m) bossLand(m);
    for (const m of R.monsters) if (m.hp > 0 && m.phase !== 'enter' && !isFinite(m.x)) m.hp = 0;
    updateHudStatic();
  }
  let runSpeed = 0;
  if (h.run) {
    runSpeed = 160 * k;
    const d = runSpeed * dt;
    R.scroll += d;
    for (const m of R.monsters) m.x -= d;
    h.phase += dt * 13;
    if (rnd() < dt * 9) R.fx.push({ type: 'part', x: R.heroX - 8 * k + rnd() * 10 * k, y: R.gy - 2 * k, vx: -40 * k, vy: -24 * k, g: 90 * k, size: (2 + rnd() * 2) * k, c: '#e8d9c0', t: 0, life: .45, shape: 'circle' });
  }
  let minX = reachX();
  for (const m of alive) {
    if (m.phase === 'enter') continue;
    const lim = Math.max(minX, standX(m));
    if (m.x > lim) m.x = Math.max(lim, m.x - (m.boss ? 70 : 34) * k * dt);
    if (m.x < lim) m.x = lim;
    minX = m.x + 40 * k * Math.min(1.6, m.scale);
  }
  for (const m of R.monsters) {
    m.t += dt;
    if (m.flash > 0) m.flash -= dt;
    if (m.dieT > 0) { m.dieT += dt; if (m.boss && m.dieT >= .8 && !m.exploded) bossExplode(m); continue; }
    let busy = false;
    if (m.boss) busy = bossTick(m, dt);
    if (m.phase === 'enter') continue;
    if (m.atk > 0) { m.atk += dt * 3.2; if (m.atk >= 1) m.atk = 0; }
    if (!busy && !h.dead && m.hp > 0 && m.x <= standX(m) + 34 * k) {
      m.atkT += dt * (m.enr ? 1.4 : 1);
      if (m.atkT >= (m.boss ? 1.05 : 1.3)) { m.atkT = 0; m.atk = .01; m.pend = .16; }
    }
    if (m.pend > 0) { m.pend -= dt; if (m.pend <= 0) monsterHit(m); }
  }
  R.monsters = R.monsters.filter(m => !(m.dieT > (m.boss ? 1.3 : .45)) && m.x > -80 * k);

  if (!h.dead) {
    const swingDur = Math.min(.34, .7 / st.aspd);
    if (engaged) {
      h.atkT += dt * st.aspd;
      if (h.swing < 0 && h.atkT >= 1) {
        h.atkT = 0; h.swing = 0; h.hit = false; h.lungeT = .2;
        h.combo = h.comboT > 0 ? (h.combo + 1) % 3 : 0;
        h.comboT = 1.15;
      }
    } else h.atkT = Math.min(1, h.atkT + dt * st.aspd);
    if (h.swing >= 0) {
      h.swing += dt / swingDur;
      if (!h.hit && h.swing >= .45) { h.hit = true; heroStrike(); }
      if (h.swing >= 1) h.swing = -1;
    }
  }
  trySkills(dt, engaged);
  petTick(dt, engaged);
  updateFx(dt);
  updateAmb(dt, z, runSpeed);
  const w = R.look.weapon;
  if (w && w.e >= 7 && !RM && rnd() < dt * (w.e >= 13 ? 14 : 7)) {
    R.fx.push({ type: 'part', x: R.heroX + (rnd() * 40 + 5) * k, y: R.gy - (60 + rnd() * 50) * k, vx: (rnd() - .5) * 20 * k, vy: -(20 + rnd() * 30) * k, g: 0, size: (1.5 + rnd() * 1.5) * k, c: A.enchGlow(w.e, R.t), t: 0, life: .6, shape: 'star' });
  }
}

function render() {
  const c = ctx, k = R.k, z = zoneOf(S.stage);
  c.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  let sx = 0, sy = 0;
  if (R.shake > 0) { sx = (rnd() - .5) * 10 * k; sy = (rnd() - .5) * 7 * k; }
  c.save(); c.translate(sx, sy);
  if (R.zoom > 0) {
    const z = 1 + .035 * Math.sin((1 - R.zoom / .3) * Math.PI);
    c.translate(R.W / 2, R.H / 2); c.scale(z, z); c.translate(-R.W / 2, -R.H / 2);
  }
  A.drawBackground(c, R.W, R.H, R.gy, z, R.scroll, R.t);
  if (z.loop) { c.fillStyle = `rgba(80,0,60,${Math.min(.25, z.loop * .08)})`; c.fillRect(0, 0, R.W, R.H); }
  drawGroundFx(c);
  const sorted = [...R.monsters].sort((a, b) => b.x - a.x);
  for (const m of sorted) {
    A.drawMonster(c, m.x, R.gy, k, m);
    if (m.hp > 0 && !m.boss && m.hp < m.maxHp) {
      const top = A.monTop(m.type) * m.scale * k, w = 34 * k;
      c.fillStyle = 'rgba(10,6,24,.7)'; A.rr(c, m.x - w / 2, R.gy - top - 12 * k, w, 5 * k, 2.5 * k); c.fill();
      c.fillStyle = '#ff5d73'; A.rr(c, m.x - w / 2, R.gy - top - 12 * k, w * clamp(m.hp / m.maxHp, 0, 1), 5 * k, 2.5 * k); c.fill();
    }
  }
  const h = R.hero;
  if (R.buffs.spirit > 0) {
    const p = .5 + .3 * Math.sin(R.t * 8);
    const g = c.createRadialGradient(R.heroX, R.gy - 50 * k, 5 * k, R.heroX, R.gy - 50 * k, 70 * k);
    g.addColorStop(0, `rgba(255,138,76,${.25 * p})`); g.addColorStop(1, 'rgba(255,138,76,0)');
    c.fillStyle = g; c.fillRect(R.heroX - 70 * k, R.gy - 130 * k, 140 * k, 140 * k);
  }
  if (R.buffs.guard > 0) { c.strokeStyle = `rgba(116,224,168,${.5 + .3 * Math.sin(R.t * 6)})`; c.lineWidth = 2 * k; A.ell(c, R.heroX, R.gy - 55 * k, 42 * k, 62 * k); c.stroke(); }
  // след клинка при взмахе — дуга, а не просто поворот руки
  if (h.swing >= 0 && !h.dead) {
    const p = h.swing, combo = h.combo || 0;
    const a0 = combo === 1 ? 1.0 : combo === 2 ? -3.25 : -2.6;
    const a1 = combo === 1 ? -2.3 : combo === 2 ? 1.35 : .8;
    const ang = a0 + (a1 - a0) * p, heavy = combo === 2;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = heavy ? `rgba(255,179,214,${.5 * Math.sin(p * Math.PI)})` : `rgba(255,236,246,${.42 * Math.sin(p * Math.PI)})`;
    c.lineWidth = (heavy ? 14 : 11) * k;
    c.beginPath(); c.arc(R.heroX + R.heroOff, R.gy - 50 * k, (heavy ? 70 : 62) * k, ang - 1.15, ang); c.stroke();
    c.strokeStyle = `rgba(255,143,193,${.25 * Math.sin(p * Math.PI)})`; c.lineWidth = (heavy ? 22 : 18) * k;
    c.beginPath(); c.arc(R.heroX + R.heroOff, R.gy - 50 * k, (heavy ? 70 : 62) * k, ang - .75, ang); c.stroke();
    c.restore();
  }
  // послеобразы рывка
  if ((h.dashT > 0 || h.dodgeT > 0) && !h.dead) {
    const dir = h.dodgeT > 0 ? 1 : -1;
    for (let i = 2; i >= 1; i--) {
      c.save(); c.globalAlpha = .13 * i;
      A.drawHero(c, R.heroX + R.heroOff + dir * i * 18 * k, R.gy, k * 1.02, R.look, { t: R.t - i * .05, run: 1, phase: h.phase, swing: -1, hurt: 0, dead: false, cast: 0, combo: 0 });
      c.restore();
    }
  }
  A.drawHero(c, R.heroX + R.heroOff, R.gy, k * 1.02, R.look, { t: R.t, run: h.run, phase: h.phase, swing: h.swing, hurt: Math.max(0, h.hurt), dead: h.dead > 0, cast: Math.max(0, h.cast), castType: h.castType, castEl: h.castEl, combo: h.combo });
  const pet = activePet();
  if (pet && !(h.dead > 0)) { const p = petPos(); A.drawPet(c, p.x, p.y, k * .85, pet, R.t, { attack: R.pet.attack }); }
  drawFx(c);
  drawAmb(c, z);
  c.restore();
  drawCutIn(c);
  if (R.flash > 0) { c.fillStyle = A.hexA(R.flashC, Math.min(.4, R.flash * 3)); c.fillRect(0, 0, R.W, R.H); }
  if (R.warn > 0) drawWarning(c);
  if (h.dead > 0) {
    c.fillStyle = 'rgba(20,6,30,.45)'; c.fillRect(0, 0, R.W, R.H);
    txt(c, 'Возрождение ' + Math.ceil(h.dead), R.W / 2, R.H * .5, 22 * Math.sqrt(k), '#ffffff');
  }
  if (R.tab === 'gear') drawDoll();
  if (R.tab === 'pets') drawPetStage();
}

const CUT_IMG = {};
function drawCutIn(c) {
  const f = R.cut; if (!f) return;
  const s = SK[f.id]; if (!s) return;
  const p = f.t / f.life;
  const e = p < .18 ? A.easeOut(p / .18) : p > .78 ? 1 - (p - .78) / .22 : 1;
  const col = ELEMENTS[s.el].color, k = R.k, W = R.W, H = R.H;
  const band = 30 * k, y = H * .30;
  c.save();
  c.globalAlpha = Math.max(0, Math.min(1, e * 1.35));
  c.fillStyle = 'rgba(8,4,20,.66)'; c.fillRect(0, y, W, band);
  c.fillStyle = col; c.fillRect(0, y, W * e, 2.5 * k); c.fillRect(0, y + band - 2.5 * k, W * e, 2.5 * k);
  let img = CUT_IMG[f.id];
  if (img === undefined || !img) { img = CUT_IMG[f.id] = new Image(); img.src = skillIcon(s.icon, 96); }
  if (img.complete && img.naturalWidth) { c.save(); c.beginPath(); c.arc(9 * k + (band - 8 * k) / 2, y + band / 2, (band - 8 * k) / 2, 0, 6.29); c.clip(); c.drawImage(img, 9 * k, y + 4 * k, band - 8 * k, band - 8 * k); c.restore(); }
  txt(c, s.name.toUpperCase(), W * .5 + 12 * k, y + band * .56, 14 * Math.sqrt(k), '#ffffff');
  c.restore();
}

function txt(c, s, x, y, size, fill, align = 'center') {  c.font = `${size}px "Russo One", "Arial Black", sans-serif`;
  c.textAlign = align; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * .22); c.strokeStyle = '#1a0f2a';
  c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y);
}

function drawWarning(c) {
  const k = R.k, p = R.warn, W = R.W, H = R.H;
  const a = Math.min(1, p * 3, (2 - p) * 3);
  c.save(); c.globalAlpha = Math.max(0, a);
  const vg = c.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, W * .7);
  vg.addColorStop(0, 'rgba(255,20,60,0)'); vg.addColorStop(1, `rgba(255,20,60,${.35 + .2 * Math.sin(R.t * 18)})`);
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  const bh = 26 * k, off = (R.t * 120 * k) % (40 * k);
  for (const by of [H * .3 - bh / 2, H * .62 - bh / 2]) {
    c.fillStyle = '#1a0612'; c.fillRect(0, by, W, bh);
    c.save(); c.beginPath(); c.rect(0, by, W, bh); c.clip();
    c.fillStyle = '#ff2a4a';
    for (let x = -40 * k + (by < H / 2 ? off : -off); x < W + 40 * k; x += 40 * k) { c.beginPath(); c.moveTo(x, by); c.lineTo(x + 20 * k, by); c.lineTo(x + 6 * k, by + bh); c.lineTo(x - 14 * k, by + bh); c.closePath(); c.fill(); }
    c.restore();
  }
  txt(c, 'ВНИМАНИЕ', W / 2, H * .3, 18 * Math.sqrt(k), '#ffffff');
  txt(c, R.warnName || 'Босс', W / 2, H * .46, 28 * Math.sqrt(k), '#ff6b8a');
  txt(c, 'БОСС ЭТАПА', W / 2, H * .62, 16 * Math.sqrt(k), '#ffffff');
  c.restore();
}

function drawGroundFx(c) {
  const k = R.k;
  for (const f of R.fx) {
    if (f.type === 'erupt') {
      const p = f.t / f.delay;
      if (f.t < f.delay) {
        c.save(); c.globalAlpha = .4 + .4 * Math.sin(f.t * 30);
        c.fillStyle = 'rgba(255,40,70,.5)'; A.ell(c, f.x, f.y, 30 * k * Math.min(1, p * 1.5), 7 * k); c.fill(); c.restore();
      } else {
        const q = Math.min(1, (f.t - f.delay) / .15), fade = Math.max(0, 1 - (f.t - f.delay - .4) / .4);
        c.save(); c.globalAlpha = fade;
        for (let i = -2; i <= 2; i++) {
          const hgt = (34 - Math.abs(i) * 8) * k * q, x = f.x + i * 11 * k;
          c.beginPath(); c.moveTo(x - 7 * k, f.y); c.lineTo(x + 1 * k, f.y - hgt); c.lineTo(x + 7 * k, f.y); c.closePath();
          c.fillStyle = f.c || '#a8834f'; c.fill(); c.strokeStyle = '#2b1532'; c.lineWidth = 1.6 * k; c.stroke();
        }
        c.restore();
      }
    } else if (f.type === 'shard' && f.t < f.delay + .02 && !f.hit) {
      c.save(); c.globalAlpha = .5; c.fillStyle = 'rgba(160,220,255,.6)'; A.ell(c, f.x, R.gy, 12 * k, 3 * k); c.fill(); c.restore();
    }
  }
}

function drawFx(c) {
  const k = R.k;
  for (const f of R.fx) {
    const p = f.t / f.life;
    switch (f.type) {
      case 'num': {
        c.save(); c.globalAlpha = p < .7 ? 1 : 1 - (p - .7) / .3;
        const sc = f.crit ? (p < .15 ? 1 + (.15 - p) * 4 : 1) : 1;
        c.translate(f.x, f.y); c.scale(sc, sc); c.transform(1, 0, -.12, 1, 0, 0);
        txt(c, f.text, 0, 0, f.size, f.c);
        c.restore(); break;
      }
      case 'part': {
        c.save(); c.globalAlpha = 1 - p; c.fillStyle = f.c; c.translate(f.x, f.y);
        if (f.shape === 'star') { c.rotate(f.t * 8); c.fillRect(-f.size / 2, -f.size * 1.5, f.size, f.size * 3); c.fillRect(-f.size * 1.5, -f.size / 2, f.size * 3, f.size); }
        else if (f.shape === 'petal') { c.rotate(f.rot || 0); A.ell(c, 0, 0, f.size, f.size * .55); c.fill(); }
        else { A.ell(c, 0, 0, f.size * (1 - p * .5), f.size * (1 - p * .5)); c.fill(); }
        c.restore(); break;
      }
      case 'slash': {
        const a0 = f.a - 1.3 + p * .4, a1 = f.a + 1.3 * Math.min(1, p * 3);
        c.save(); c.globalAlpha = 1 - p; c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        c.strokeStyle = f.c; c.lineWidth = f.w * k * (1 - p * .5);
        c.beginPath(); c.arc(f.x, f.y, f.r, a0, a1); c.stroke();
        c.lineWidth = f.w * k * .35; c.strokeStyle = '#ffffff';
        c.beginPath(); c.arc(f.x, f.y, f.r * .92, a0 + .2, a1 - .1); c.stroke();
        c.restore(); break;
      }
      case 'ring': {
        c.save(); c.globalAlpha = 1 - p; c.strokeStyle = f.c; c.lineWidth = 6 * k * (1 - p);
        const r = f.r0 + (f.r1 - f.r0) * p;
        A.ell(c, f.x, f.y, r, r * (f.flat ? .18 : .45)); c.stroke(); c.restore(); break;
      }
      case 'bolt': {
        c.save(); c.globalAlpha = 1 - p; c.globalCompositeOperation = 'lighter';
        c.strokeStyle = '#fff6b0'; c.shadowColor = '#ffe55c'; c.shadowBlur = 14 * k; c.lineWidth = 4 * k;
        c.beginPath(); let x = f.x, y = 0; c.moveTo(x, y);
        for (let i = 1; i <= 8; i++) { y = f.y1 * i / 8; x = f.x + (A.h01(Math.floor(f.seed) + i) - .5) * 26 * k * (i < 8 ? 1 : 0); c.lineTo(x, y); }
        c.stroke(); c.lineWidth = 1.5 * k; c.strokeStyle = '#ffffff'; c.stroke();
        c.restore(); break;
      }
      case 'trail': {
        const e = A.easeOut(Math.min(1, p * 2));
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, 1 - p) * .9;
        const g = c.createLinearGradient(f.x, f.y, f.tx, f.ty);
        g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.5, 'rgba(191,230,255,.7)'); g.addColorStop(1, 'rgba(191,230,255,0)');
        c.strokeStyle = g; c.lineWidth = 12 * k * (1 - p); c.lineCap = 'round';
        c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + (f.tx - f.x) * e, f.y + (f.ty - f.y) * e); c.stroke();
        c.restore(); break;
      }
      case 'ice': {
        const q = Math.min(1, p * 2.2);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, 1 - p);
        c.translate(f.x, f.y - (1 - q) * 90 * k); c.rotate(.18);
        const ig = c.createLinearGradient(0, -28 * k, 0, 28 * k);
        ig.addColorStop(0, '#ffffff'); ig.addColorStop(.45, '#bfe9ff'); ig.addColorStop(1, '#5aa8e8');
        c.fillStyle = ig; c.strokeStyle = '#eaf8ff'; c.lineWidth = 2 * k;
        c.beginPath(); c.moveTo(0, -30 * k); c.lineTo(11 * k, 0); c.lineTo(0, 30 * k); c.lineTo(-11 * k, 0); c.closePath(); c.fill(); c.stroke();
        c.restore(); break;
      }
      case 'meteor': {
        const q = Math.min(1, p), e = q * q, y = f.y0 + (f.y1 - f.y0) * e;
        c.save(); c.globalCompositeOperation = 'lighter';
        const mg = c.createRadialGradient(f.x, y, 2 * k, f.x, y, 40 * k);
        mg.addColorStop(0, '#ffffff'); mg.addColorStop(.35, '#ffcf5a'); mg.addColorStop(.7, 'rgba(255,122,60,.7)'); mg.addColorStop(1, 'rgba(255,60,30,0)');
        c.fillStyle = mg; A.ell(c, f.x, y, 38 * k, 38 * k); c.fill();
        c.strokeStyle = 'rgba(255,207,90,.7)'; c.lineWidth = 9 * k; c.lineCap = 'round';
        c.beginPath(); c.moveTo(f.x - 10 * k, y - 46 * k); c.lineTo(f.x, y); c.stroke();
        c.restore(); break;
      }
      case 'impact': {
        const r = (f.big ? 36 : 26) * k * (.55 + p * 1.5);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, 1 - p);
        const g = c.createRadialGradient(f.x, f.y, 1, f.x, f.y, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(.35, f.c); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; A.ell(c, f.x, f.y, r, r * .82); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2 * k;
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3 + p * .8;
          c.beginPath(); c.moveTo(f.x + Math.cos(a) * r * .25, f.y + Math.sin(a) * r * .25); c.lineTo(f.x + Math.cos(a) * r * .95, f.y + Math.sin(a) * r * .95); c.stroke();
        }
        c.restore(); break;
      }
      case 'coin': {
        c.save(); c.translate(f.x, f.y); c.scale(Math.abs(Math.cos(f.t * 9)) * .7 + .3, 1);
        c.fillStyle = '#ffc93d'; c.strokeStyle = '#7a4a10'; c.lineWidth = 1.2 * k;
        A.ell(c, 0, 0, 4.5 * k, 4.5 * k); c.fill(); c.stroke();
        c.fillStyle = '#ffe58f'; A.ell(c, -1.2 * k, -1.2 * k, 1.6 * k, 1.6 * k); c.fill();
        c.restore(); break;
      }
      case 'drop': {
        const s = 30 * k, bob = f.t > .35 && f.t < 1.05 ? Math.sin(f.t * 10) * 2 * k : 0;
        c.save(); c.globalAlpha = f.t > 1.4 ? Math.max(0, 1 - (f.t - 1.4) / .3) : 1;
        const g = c.createRadialGradient(f.x, f.y + bob, 2, f.x, f.y + bob, s * .9);
        g.addColorStop(0, 'rgba(255,240,180,.7)'); g.addColorStop(1, 'rgba(255,240,180,0)');
        c.fillStyle = g; c.fillRect(f.x - s, f.y + bob - s, s * 2, s * 2);
        if (f.img.complete) c.drawImage(f.img, f.x - s / 2, f.y + bob - s / 2, s, s);
        c.restore(); break;
      }
      case 'skillname': {
        c.save(); c.globalAlpha = p < .75 ? 1 : 1 - (p - .75) / .25;
        const col = f.el && ELEMENTS[f.el] ? ELEMENTS[f.el].color : '#ffe3f0';
        txt(c, f.text, f.x, f.y - p * 10 * k, 13 * Math.sqrt(k), col); c.restore(); break;
      }
      case 'wave': {
        if (f.delay && f.t < f.delay) break;
        c.save(); c.globalAlpha = f.hit ? 1 - (f.t - f.life + .25) / .25 : 1;
        const g = c.createLinearGradient(f.x - 30 * k, 0, f.x + 30 * k, 0);
        g.addColorStop(0, A.hexA('#ffffff', .9)); g.addColorStop(1, A.hexA(f.c || '#ffffff', 0));
        c.fillStyle = g; c.beginPath(); c.moveTo(f.x - 10 * k, f.y); c.quadraticCurveTo(f.x, f.y - 34 * k, f.x + 30 * k, f.y - 8 * k); c.lineTo(f.x + 40 * k, f.y); c.closePath(); c.fill();
        c.strokeStyle = f.c || '#ffffff'; c.lineWidth = 3 * k; c.stroke();
        c.restore(); break;
      }
      case 'sonic': {
        if (f.t < f.delay) break;
        c.save(); c.strokeStyle = A.hexA(f.c, f.hit ? .4 : .9); c.lineWidth = 3 * k; c.shadowColor = f.c; c.shadowBlur = 8 * k;
        for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(f.x + (14 + i * 8) * k, f.y, (14 + i * 6) * k, Math.PI * .7, Math.PI * 1.3); c.stroke(); }
        c.restore(); break;
      }
      case 'shard': {
        if (f.t < f.delay) break;
        c.save(); c.translate(f.x, f.y); c.fillStyle = '#e6f8ff'; c.strokeStyle = '#2f7fd8'; c.lineWidth = 1.6 * k;
        c.beginPath(); c.moveTo(0, 10 * k); c.lineTo(5 * k, -8 * k); c.lineTo(0, -14 * k); c.lineTo(-5 * k, -8 * k); c.closePath(); c.fill(); c.stroke();
        c.restore(); break;
      }
      case 'fireball': {
        if (f.t < f.delay || f.hit) break;
        const g = c.createRadialGradient(f.x, f.y, 1, f.x, f.y, 12 * k);
        g.addColorStop(0, '#fff6c0'); g.addColorStop(.4, '#ffb03c'); g.addColorStop(1, 'rgba(255,80,40,0)');
        c.fillStyle = g; A.ell(c, f.x, f.y, 12 * k, 12 * k); c.fill(); break;
      }
      case 'dark': {
        c.save(); c.globalAlpha = f.hit ? .5 : 1; c.translate(f.x, f.y);
        c.shadowColor = '#ff62d4'; c.shadowBlur = 14 * k;
        c.fillStyle = '#2a1238'; c.strokeStyle = '#ff62d4'; c.lineWidth = 2.4 * k;
        c.beginPath(); c.arc(0, 0, 30 * k, -1.2, 1.2); c.arc(10 * k, 0, 26 * k, 1.1, -1.1, true); c.closePath(); c.fill(); c.stroke();
        c.restore(); break;
      }
      case 'petshot': {
        const g = c.createRadialGradient(f.x, f.y, 1, f.x, f.y, 9 * k);
        g.addColorStop(0, '#ffffff'); g.addColorStop(.45, f.c); g.addColorStop(1, A.hexA(f.c, 0));
        c.fillStyle = g; A.ell(c, f.x, f.y, 9 * k, 9 * k); c.fill(); break;
      }
      case 'banner': {
        const a = p < .12 ? p / .12 : p > .8 ? 1 - (p - .8) / .2 : 1;
        const sc = p < .12 ? .7 + .3 * (p / .12) : 1;
        c.save(); c.globalAlpha = a;
        const y = R.H * .42;
        const gr = c.createLinearGradient(0, 0, R.W, 0);
        gr.addColorStop(0, 'rgba(20,10,40,0)'); gr.addColorStop(.5, 'rgba(20,10,40,.72)'); gr.addColorStop(1, 'rgba(20,10,40,0)');
        c.fillStyle = gr; c.fillRect(0, y - 30 * k, R.W, 60 * k);
        c.translate(R.W / 2, y); c.scale(sc, sc);
        txt(c, f.text, 0, -6 * k, 26 * Math.sqrt(k), f.c);
        if (f.sub) { c.font = `800 ${12 * Math.sqrt(k)}px "M PLUS Rounded 1c", sans-serif`; c.fillStyle = '#f6f1ff'; c.textAlign = 'center'; c.fillText(f.sub, 0, 18 * k); }
        c.restore(); break;
      }
    }
  }
}

/* --- 15_systems.js --- */
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
  addEventCoins(B.EVENT.awaken, 'awaken');
  addLanternDrop('awaken');
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
  { id: 'kills',  title: 'Первые шаги',    text: 'Монстры гибнут сами — вам нужно лишь направлять силу. Победите 10 монстров.', goal: 10, of: () => S.stats.kills, rw: { gems: 60, scrollsA: 2, goldKills: 250 } },
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

/* --- 20_hud.js --- */
/* ===== HUD, журнал, всплывашки, модальные окна, музыка ===== */
const hud = {};
['hLvl', 'xpFill', 'hpFill', 'hpText', 'mpFill', 'mpText', 'goldText', 'gemText', 'stageNum', 'stageName', 'killFill', 'killText', 'bossBtn', 'autoBtn', 'stageRow', 'bossRow', 'bossName', 'bossFill', 'bossTime', 'skillDock', 'heroDot', 'gearDot', 'petDot', 'arenaDot', 'shopDot', 'trialDot', 'socialDot', 'questBtn', 'questDot', 'giftBtn', 'giftDot', 'boostChip', 'boostTime', 'settingsBtn', 'gemBtn', 'heroTabLabel'].forEach(id => hud[id] = $(id));

function updateHudStatic() {
  if (!S) return;
  const z = zoneOf(S.stage);
  hud.hLvl.textContent = S.level;
  hud.stageNum.textContent = z.num;
  hud.stageName.textContent = z.title;
  hud.killText.textContent = `${Math.min(B.STAGE_KILLS, S.kills)}/${B.STAGE_KILLS}`;
  hud.killFill.style.width = Math.min(100, S.kills / B.STAGE_KILLS * 100) + '%';
  const ready = S.kills >= B.STAGE_KILLS && !R.boss && !R.bossPending;
  hud.bossBtn.disabled = !ready; hud.bossBtn.classList.toggle('ready', ready && !S.autoBoss);
  hud.autoBtn.setAttribute('aria-pressed', S.autoBoss ? 'true' : 'false');
  const inBoss = !!R.boss;
  hud.stageRow.hidden = inBoss; hud.bossRow.hidden = !inBoss;
  if (R.boss) hud.bossName.textContent = R.boss.m.name;
  const spReady = S.sp > 0 && SKILLS.some(s => S.level >= s.unlock && S.skills[s.id] < SKILL_MAX);
  hud.heroDot.hidden = !(spReady || chaptersReady() || fundClaimable().length);
  hud.heroDot.textContent = S.sp || '';
  hud.heroTabLabel.textContent = G('Героиня', 'Герой');
  hud.trialDot.hidden = !(towerClaimable() || chaptersReady() > 0);
  const hasSkill = SKILLS.some(s => S.skills[s.id] > 0);
  const mpBar = document.querySelector('.bar.mp'), dock = hud.skillDock;
  if (mpBar) mpBar.hidden = !hasSkill;
  if (dock) dock.hidden = !hasSkill;
  updateSideButtons();
}
function updateSideButtons() {
  if (!S) return;
  const q = questsReady();
  hud.questDot.hidden = !q; hud.questDot.textContent = q;
  const gift = Monet.giftReady();
  hud.giftDot.hidden = !gift;
  if (typeof updateNav === 'function') updateNav();
  hud.petDot.hidden = !(S.gacha.tickets > 0 || (!S.ads.freeSummon && Monet.adsOn()) || (!S.gacha.first10 && S.gems >= B.GACHA.first10) || expoReady());
  hud.arenaDot.hidden = !(S.arena.tickets > 0 || S.arena.rewardDay !== dayKey());
  hud.shopDot.hidden = !(S.shop.monthlyUntil > Date.now() && S.shop.monthlyDay !== dayKey());
  hud.gearDot.hidden = !S.items.some(it => isEquipped(it) && canEnchant(it));
}
function updateHud() {
  const h = R.hero;
  hud.xpFill.style.width = clamp(S.xp / B.xpNeed(S.level) * 100, 0, 100) + '%';
  hud.hpFill.style.width = clamp(h.hp / R.st.hp * 100, 0, 100) + '%';
  hud.hpText.textContent = `${fmt(Math.max(0, h.hp))} / ${fmt(R.st.hp)}`;
  hud.mpFill.style.width = clamp((R.mp || 0) / (R.mpMax || 1) * 100, 0, 100) + '%';
  hud.mpText.textContent = `${Math.floor(R.mp || 0)}`;
  hud.goldText.textContent = fmt(S.gold);
  hud.gemText.textContent = fmt(S.gems);
  if (R.boss) {
    const m = R.boss.m;
    hud.bossFill.style.width = clamp(m.hp / m.maxHp * 100, 0, 100) + '%';
    hud.bossTime.textContent = Math.ceil(Math.max(0, R.boss.time));
    hud.bossTime.classList.toggle('low', R.boss.time < 8);
    hud.bossFill.parentElement.classList.toggle('rage', !!m.enr);
  }
  const learnedN = SKILLS.reduce((n, s) => n + (S.skills[s.id] ? 1 : 0), 0);
  hud.skillDock.style.setProperty('--sk', (learnedN > 8 ? 30 : learnedN > 6 ? 34 : 38) + 'px');
  for (const el of hud.skillDock.children) {
    const s = SK[el.dataset.sk];
    const learned = S.skills[s.id] > 0;
    el.classList.toggle('locked', !learned);
    el.style.setProperty('--cd', learned ? (R.cd[s.id] / s.cd).toFixed(3) : 0);
    el.classList.toggle('ready', learned && R.cd[s.id] <= 0 && (R.mp || 0) >= s.mp);
    el.classList.toggle('poor', learned && (R.mp || 0) < s.mp);
    el.classList.toggle('off', learned && S.skillOn[s.id] === false);
  }
  const bl = S.boost.goldUntil - Date.now();
  hud.boostChip.hidden = bl <= 0;
  if (bl > 0) hud.boostTime.textContent = left(bl);
  // пока автобой фармит после поражения, кнопка показывает, сколько ещё ждать
  if (S.autoBoss && R.bossCd > 0 && S.kills >= B.STAGE_KILLS && !R.boss) {
    hud.bossBtn.textContent = `Фарм ${Math.ceil(R.bossCd)}`;
    hud.bossBtn.disabled = true;
  } else if (hud.bossBtn.textContent !== 'Босс') {
    hud.bossBtn.textContent = 'Босс';
  }
  for (const b of document.querySelectorAll('[data-cost]')) {
    const cur = b.dataset.cur === 'cry' ? S.crystals : b.dataset.cur === 'gem' ? S.gems : S.gold;
    b.classList.toggle('poor', +b.dataset.cost > cur);
  }
  if (R.dirtyBank) { R.dirtyBank = false; updateSideButtons(); const bank = $('scrollBank'); if (bank) bank.innerHTML = bankHTML(); }
}

/* ---------- журнал и всплывашки ---------- */
const logEl = $('log');
const WIDE = matchMedia('(min-width: 960px) and (min-height: 560px)');
function log(text, type = 'sys') {
  const p = document.createElement('p'); p.className = type; p.textContent = text;
  logEl.appendChild(p);
  while (logEl.children.length > (WIDE.matches ? 4 : 2)) logEl.firstChild.remove();
}
let toastT = 0;
function toast(text) {
  const el = $('toast'); el.textContent = text; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- модальные окна ---------- */
const modal = $('modal');
let modalState = null;
function openModal(html, state) {
  if (modalState && modalState.onClose) modalState.onClose();
  if (modalState && modalState.raf) cancelAnimationFrame(modalState.raf);
  modal.innerHTML = html; modal.hidden = false; modalState = state || {};
  const f = modal.querySelector('[data-act="close"]'); if (f) f.focus({ preventScroll: true });
  updateMusic();
}
function closeModal() {
  if (!modalState) { modal.hidden = true; return; }
  if (modalState.busy) return;
  const st = modalState;
  if (st.raf) cancelAnimationFrame(st.raf);
  modal.hidden = true; modal.innerHTML = ''; modalState = null;
  if (st.onClose) st.onClose();
  if (st.resolve) st.resolve(false);
  updateMusic();
}
function sheet(title, sub, body, opts = {}) {
  return `<div class="sheet ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-head">${opts.icon || ''}<div><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div>
    ${opts.noClose ? '' : '<button class="close-btn" data-act="close" aria-label="Закрыть">×</button>'}</div>${body}</div>`;
}

/* ---------- музыка: тема по ситуации ---------- */
function updateMusic() {
  if (!AU.ready || !S) return;
  let id;
  if (!$('intro').hidden) id = 'menu';
  else if (modalState && modalState.music) id = modalState.music;
  else if (R.boss || R.bossPending) id = 'boss';
  else id = 'z' + zoneOf(S.stage).idx;
  AU.play(id);
  AU.muffle(!!(modalState && !modalState.music) || R.hero.dead > 0);
}

/* --- 30_panels.js --- */
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
  if (tabLocked(t)) { toast(`Раздел откроется: ${unlockLabel(tabUnlockKey(t))}`); return; }
  R.tab = t;
  for (const b of document.querySelectorAll('#tabs [data-tab]')) b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false');
  renderPanel(); panel.scrollTop = 0;
  if (t === 'social') Social.enter();
}
const TAB_UNLOCK = { shop: 'shop', pets: 'pets', social: 'chat', arena: 'arena' };
const tabUnlockKey = t => TAB_UNLOCK[t] || null;
const tabLocked = t => { const k = tabUnlockKey(t); return !!(k && !unlockOk(k)); };
function updateNav() {
  if (!S) return;
  const now = new Set();
  let switched = false;
  for (const b of document.querySelectorAll('#tabs [data-tab]')) {
    const locked = tabLocked(b.dataset.tab);
    if (b.hidden !== locked) b.hidden = locked;
    b.setAttribute('aria-hidden', locked ? 'true' : 'false');
    if (!locked) now.add(b.dataset.tab);
  }
  if (!R.navSeen) R.navSeen = now;
  else for (const t of now) if (!R.navSeen.has(t)) toast(`Открыт раздел: ${TAB_LABEL[t] || t}`);
  R.navSeen = now;
  if (tabLocked(R.tab)) { R.tab = 'hero'; switched = true; }
  if (switched) {
    for (const b of document.querySelectorAll('#tabs [data-tab]')) b.setAttribute('aria-selected', b.dataset.tab === R.tab ? 'true' : 'false');
    renderPanel();
  }
}
const TAB_LABEL = { hero: 'Героиня', gear: 'Вещи', pets: 'Питомцы', arena: 'Арена', trials: 'Башня', social: 'Чат', shop: 'Магазин' };
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
function nextTip() {
  if (S.tutorial && !S.tutorial.done) return { id: 'tutorial', title: 'Пройти обучение', text: 'Короткий гайд по бою, вещам и заданиям — с возможностью пропустить.', btn: 'Начать' };
  if (S.sp > 0) return { id: 'skills', title: 'Есть очко навыка', text: 'Откройте «Навыки» и усильте умение, которое чаще срабатывает.', btn: 'К навыкам' };
  const eq = S.items.filter(isEquipped);
  if (eq.some(it => it.g > 0 && it.e < 3)) return { id: 'enchant', title: 'Заточите снаряжение', text: 'Заточка до +3 безопасна и заметно повышает силу.', btn: 'К заточке' };
  if (questsReady() > 0) return { id: 'quests', title: 'Есть награды', text: 'Заберите выполненные задания и бонусы — это ускорит прогресс.', btn: 'Открыть' };
  if (S.kills >= B.STAGE_KILLS) return { id: 'boss', title: 'Босс этапа готов', text: 'Победите босса, чтобы открыть новую зону.', btn: 'В бой' };
  if (S.level < 10) return { id: 'growth', title: 'Растите силу', text: 'Тренировка стоит золото и работает даже в автобое.', btn: 'Тренировка' };
  return null;
}
function nextTipCard() {
  if (S.level > 12) return '';
  const t = nextTip(); if (!t) return '';
  return `<section class="card next-card" data-tip-card="${t.id}">
    <img src="${A.miscIcon(t.id === 'quests' ? 'quests' : t.id === 'boss' ? 'boss' : t.id === 'enchant' ? 'scroll' : t.id === 'skills' ? 'skills' : 'atk', 56)}" alt="">
    <div class="row-main"><b>${t.title}</b><span class="meta">${t.text}</span></div>
    <button class="buy pink small" data-act="tip-go" data-tip="${t.id}">${t.btn}</button>
  </section>`;
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
    ${nextTipCard()}
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
      const el = ELEMENTS[s.el], on = S.skillOn[s.id] !== false;
      const btn = !open ? `<button class="buy" disabled>Ур. ${s.unlock}</button>`
        : maxed ? '<button class="buy" disabled>Максимум</button>'
        : `<button class="buy pink" data-act="learn" data-sk="${s.id}" ${S.sp > 0 ? '' : 'disabled'}>${l ? 'Улучшить' : 'Изучить'}</button>`;
      const act = open && l ? `<div class="row-actions"><button class="sk-toggle ${on ? 'on' : ''}" data-act="skill-toggle" data-id="${s.id}" aria-pressed="${on}">${on ? 'Вкл' : 'Выкл'}</button>${btn}</div>` : btn;
      return `<li class="row ${on ? '' : 'sk-off'}"><img src="${skillIcon(s.icon, 64)}" alt="" style="${open ? '' : 'filter:grayscale(1) brightness(.6)'}">
        <div class="row-main"><b>${s.name} <small class="el" style="color:${el.color}">${el.name}</small></b>
        <span class="meta">${l ? `Ур. ${l}/${SKILL_MAX}` : open ? 'Не изучен' : `Откроется на уровне ${s.unlock}`} · ${s.mp} маны · перезарядка ${s.cd} с</span>
        <p>${s.desc(Math.max(1, l))}</p></div>${act}</li>`;
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
    <div class="btn-row"><button class="buy ghost" data-act="look">Сменить облик и имя</button><button class="buy ghost" data-act="tutorial">Обучение</button></div>
    <p class="note">${cloud}</p>
    ${P.mode === 'local' ? '<p class="note">Тестовая версия: реклама и покупки работают в демонстрационном режиме, деньги не списываются. На Яндекс Играх их обрабатывает площадка.</p>' : ''}
    <div class="danger-zone" id="resetZone"><button class="link-btn" data-act="reset">Начать игру заново</button></div>
    <p class="note version">Клинок Сакуры · версия 5.2</p>`));
}

/* --- 35_trials.js --- */
/* ===== Панели испытаний: башня, подземелья, пробуждение ===== */
function renderTrials() {
  const seg = segHTML('trialseg', R.trialSeg, [['tower', 'Башня'], ['world', 'Босс'], ['dungeon', 'Подземелья'], ['awaken', 'Пробуждение']]);
  const body = { tower: renderTower, world: renderWorld, dungeon: renderDungeons, awaken: renderAwaken }[R.trialSeg]();
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
      addEventCoins(B.EVENT.dungeon, 'dungeon');
      addLanternDrop('dungeon');
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
  addEventCoins(B.EVENT.tower, 'tower');
  addLanternDrop('tower');
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

/* --- 40_pets.js --- */
/* ===== Питомцы: коллекция и призыв ===== */
function renderPets() {
  if (!unlockOk('pets')) return lockCard('pets', 'Питомцы');
  const seg = segHTML('petseg', R.petSeg, [['summon', 'Призыв', !hud.petDot.hidden], ['collection', `Коллекция ${petsOwnedCount()}/${B.PETS.length}`], ['expo', 'Экспедиции', expoReady()]]);
  return seg + (R.petSeg === 'summon' ? renderSummon() : R.petSeg === 'expo' ? renderExpo() : renderCollection());
}
const EXPO_SPEED = 30;
function expoReady() { return !!(S.exped && S.exped.id && S.exped.until && Date.now() >= S.exped.until); }
function bestExpoPet() {
  const ids = Object.keys(S.pets.owned || {});
  if (!ids.length) return null;
  return ids.map(id => ({ id, p: B.PET[id], o: S.pets.owned[id] })).filter(x => x.p)
    .sort((a, b) => (b.p.r * 10 + (b.o.stars || 0) * 3) - (a.p.r * 10 + (a.o.stars || 0) * 3))[0];
}
function renderExpo() {
  if (!S.exped) S.exped = { id: '', until: 0, pet: null };
  const e = S.exped, cur = e.id && B.EXPO.find(x => x.id === e.id);
  if (cur && e.until) {
    const done = Date.now() >= e.until, pet = B.PET[e.pet];
    return `<section class="card">
      <div class="row-main"><b>${cur.name}</b><span class="meta">${pet ? pet.name : 'Питомец'} · ${done ? 'готово' : left(e.until - Date.now())}</span>
      <p class="sub">${rewardText(expoReward(cur))}</p></div>
      ${done ? '<button class="buy pink" data-act="expo-claim">Забрать</button>'
        : `<button class="buy ghost" data-act="expo-speed" ${S.gems < EXPO_SPEED ? 'disabled' : ''}>Ускорить · ${EXPO_SPEED} 💎</button>`}
    </section>`;
  }
  const pet = bestExpoPet();
  if (!pet) return `<section class="card"><img src="${A.miscIcon('paw', 64)}" alt=""><div class="row-main"><b>Нужен питомец</b><span class="meta">Призовите первого питомца, чтобы отправлять экспедиции.</span></div></section>`;
  return `<section class="card"><div class="row-main"><b>Экспедиции</b><span class="meta">Питомец ${pet.p.name} отправится в путь. Награда придёт по таймеру.</span></div></section>
    <ul class="rows">${B.EXPO.map(x => `<li class="row"><img src="${A.petIcon(pet.p, 64, pet.o.stars)}" alt="">
      <div class="row-main"><b>${x.name}</b><span class="meta">${x.hours} ч · ${rewardText(expoReward(x))}</span></div>
      <button class="buy pink" data-act="expo-start" data-id="${x.id}">Отправить</button></li>`).join('')}</ul>`;
}
function expoReward(x) {
  const mul = 1 + (S.maxStage || 0) / 120;
  return { ...x.rw, crystals: Math.round((x.rw.crystals || 0) * mul) };
}
function expoStart(id) {
  const x = B.EXPO.find(v => v.id === id), pet = bestExpoPet();
  if (!x || !pet || (S.exped && S.exped.id)) return;
  S.exped = { id, until: Date.now() + x.hours * 3600e3, pet: pet.id };
  saveLocal(); renderPanel(); updateSideButtons();
  toast(`${pet.p.name} отправлен: ${x.name}`);
}
function expoClaim() {
  const e = S.exped, x = e && B.EXPO.find(v => v.id === e.id);
  if (!x || !e.until || Date.now() < e.until) return;
  grant(expoReward(x));
  quest('exped');
  S.exped = { id: '', until: 0, pet: null };
  saveLocal(); renderPanel(); updateSideButtons();
  toast(`Экспедиция: ${rewardText(expoReward(x))}`);
}
function expoSpeed() {
  const e = S.exped;
  if (!e || !e.id || S.gems < EXPO_SPEED) return;
  S.gems -= EXPO_SPEED; e.until = Date.now();
  saveLocal(); renderPanel(); updateSideButtons();
  toast('Экспедиция ускорена');
}
function renderSummon() {
  const left = B.GACHA.pity - S.gacha.pity, G1 = B.GACHA.cost1, G10 = B.GACHA.cost10, F10 = B.GACHA.first10;
  const freeAd = !S.ads.freeSummon && Monet.adsOn();
  return `
    <section class="card summon-card">
      <div class="pet-stage"><canvas id="petStage"></canvas></div>
      <div class="summon-copy"><h2>Звёздный призыв</h2>
        <p class="sub">Питомец сражается рядом с вами и усиливает героя. Все призванные питомцы дают бонус коллекции.</p>
        <p class="pity">Легендарный или мифический гарантирован не позже чем через <b>${left}</b> ${plural(left, ['призыв', 'призыва', 'призывов'])}</p>
      </div>
    </section>
    <div class="summon-btns">
      ${!S.gacha.first10 ? `<button class="buy pink wide ${S.gems < F10 ? 'poor' : ''}" data-act="summon" data-n="10" data-m="first10" data-cost="${F10}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">Первый ×10 за ${F10} · скидка</button>` : ''}
      ${S.gacha.tickets > 0 ? `<button class="buy pink wide" data-act="summon" data-n="1" data-m="ticket"><img src="${A.miscIcon('summon', 32)}" alt="">Призвать по билету · есть ${S.gacha.tickets}</button>` : ''}
      ${freeAd ? `<button class="buy ad wide" data-act="summon-ad">Бесплатный призыв за рекламу</button>` : ''}
      <div class="btn-row">
        <button class="buy ${S.gems < G1 ? 'poor' : ''}" data-act="summon" data-n="1" data-m="gems" data-cost="${G1}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">×1 за ${G1}</button>
        <button class="buy pink ${S.gems < G10 ? 'poor' : ''}" data-act="summon" data-n="10" data-m="gems" data-cost="${G10}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">×10 за ${G10}</button>
      </div>
      <p class="note">В призыве ×10 гарантирован эпический питомец или выше. <button class="link-btn inline" data-act="rates">Шансы выпадения</button></p>
    </div>`;
}
function petBonusText(p, stars, full) {
  const v = B.petValue(p, stars) * (full ? 1 : B.COLLECTION_SHARE);
  return `${B.PET_BONUS[p.bonus].name} +${pct(v)}`;
}
function renderCollection() {
  const act = activePet();
  const sum = Object.entries(R.pb).filter(([, v]) => v > 0).map(([k, v]) => `<span class="chip plain">${B.PET_BONUS[k].name} +${pct(v)}</span>`).join('');
  const grid = B.PETS.slice().sort((a, b) => b.r - a.r).map(p => {
    const o = S.pets.owned[p.id];
    return `<button class="pet-tile ${o && S.pets.active === p.id ? 'active' : ''}" data-act="pet" data-id="${p.id}" aria-label="${o ? p.name : 'Не найден'}">
      <img src="${A.petIcon(p, 96, o ? o.stars : 0, !o)}" alt=""><span>${o ? p.name : '???'}</span></button>`;
  }).join('');
  return `
    <section class="card pet-hero">
      <div class="pet-stage small"><canvas id="petStage"></canvas></div>
      <div class="summon-copy">${act ? `<h2 style="color:${A.RAR_COL[act.r]}">${act.name}</h2>
        <p class="sub">${B.RAR[act.r].name} · спутник в бою</p>
        <p class="sub">${petBonusText(act, S.pets.owned[act.id].stars, true)}, атака ${pct(B.PET_ATK[act.r] * B.starMult(S.pets.owned[act.id].stars))} от вашей каждые 3 с</p>`
        : '<h2>Нет спутника</h2><p class="sub">Призовите первого питомца во вкладке «Призыв».</p>'}</div>
    </section>
    ${sum ? `<section class="card"><div class="card-head"><h3>Бонусы питомцев</h3></div><div class="scroll-bank">${sum}</div></section>` : ''}
    <div class="pet-grid">${grid}</div>`;
}
let petCv = null, petCtx = null;
function setupPetStage() {
  petCv = $('petStage'); if (!petCv) { petCtx = null; return; }
  const r = petCv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  petCv.width = Math.round(r.width * d); petCv.height = Math.round(r.height * d);
  petCtx = petCv.getContext('2d'); petCtx.setTransform(d, 0, 0, d, 0, 0);
  petCv._w = r.width; petCv._h = r.height;
}
function drawPetStage() {
  if (!petCtx || !petCv || !petCv.isConnected) return;
  const w = petCv._w, h = petCv._h, c = petCtx, t = R.t;
  c.clearRect(0, 0, w, h);
  if (R.petSeg === 'summon') {
    A.drawMagicCircle(c, w / 2, h / 2 + 6, Math.min(w, h) * .42, t * .6, .1, '#c9a8ff');
    A.drawPet(c, w * .3, h * .5 + Math.sin(t * 2) * 5, h / 70, B.PET.tenryu, t);
    A.drawPet(c, w * .7, h * .5 + Math.sin(t * 2 + 1.5) * 5, h / 70, B.PET.yami, t);
  } else {
    const p = activePet();
    if (p) A.drawPet(c, w / 2, h / 2 + Math.sin(t * 2) * 4, h / 60, p, t);
    else { c.fillStyle = 'rgba(255,255,255,.15)'; A.ell(c, w / 2, h / 2, h * .3, h * .3); c.fill(); }
  }
}
function openPet(id) {
  const p = B.PET[id], o = S.pets.owned[id];
  if (!o) {
    openModal(sheet('Неизвестный питомец', `${B.RAR[p.r].name} · его можно получить в призыве`, `<div class="pet-big"><img src="${A.petIcon(p, 160, 0, true)}" alt=""></div><p class="note">Шанс любого ${B.RAR[p.r].name.toLowerCase()} питомца: ${pct(B.GACHA.rates[p.r])}.</p>`));
    return;
  }
  const need = o.stars < B.PET_MAX_STARS ? B.PET_DUPES[o.stars - 1] : 0;
  const isAct = S.pets.active === id;
  openModal(sheet(`<span style="color:${A.RAR_COL[p.r]}">${p.name}</span>`, `${B.RAR[p.r].name} · ${'★'.repeat(o.stars)}${'☆'.repeat(B.PET_MAX_STARS - o.stars)}`, `
    <div class="pet-big"><img src="${A.petIcon(p, 160, o.stars)}" alt=""></div>
    <dl class="compare">
      <dt>Бонус спутника</dt><dd class="up">${petBonusText(p, o.stars, true)}</dd><dd></dd>
      <dt>Бонус коллекции</dt><dd>${petBonusText(p, o.stars, false)}</dd><dd></dd>
      <dt>Атака в бою</dt><dd>${pct(B.PET_ATK[p.r] * B.starMult(o.stars))}</dd><dd>каждые 3 с</dd>
      <dt>Звёзды</dt><dd>${o.stars}/${B.PET_MAX_STARS}</dd><dd>${need ? `дубликатов ${o.dupes}/${need}` : 'максимум'}</dd>
    </dl>
    <p class="note">Повторный призыв того же питомца добавляет звезду. Каждая звезда усиливает его на 25%.</p>
    <button class="buy ${isAct ? '' : 'pink'} wide" data-act="setpet" data-id="${id}" ${isAct ? 'disabled' : ''}>${isAct ? 'Уже спутник' : 'Сделать спутником'}</button>`));
}
function openRates() {
  const rows = B.RAR.map((r, i) => `<dt style="color:${A.RAR_COL[i]}">${r.name}</dt><dd>${(B.GACHA.rates[i] * 100).toFixed(1).replace('.0', '')}%</dd><dd>${B.PETS.filter(p => p.r === i).map(p => p.name).join(', ')}</dd>`).join('');
  openModal(sheet('Шансы призыва', 'Каждый призыв независим', `<dl class="compare rates">${rows}</dl>
    <p class="note">Если ${B.GACHA.pity} призывов подряд не выпал легендарный или мифический питомец, следующий призыв гарантированно даст одного из них. В призыве ×10 гарантирован эпический питомец или выше.</p>`));
}
function addPet(id) {
  const own = S.pets.owned;
  if (!own[id]) { own[id] = { stars: 1, dupes: 0 }; if (!S.pets.active) S.pets.active = id; return { isNew: true }; }
  const o = own[id];
  if (o.stars >= B.PET_MAX_STARS) { const g = [5, 10, 30, 80, 200][B.PET[id].r]; S.gems += g; return { refund: g }; }
  o.dupes++;
  const need = B.PET_DUPES[o.stars - 1];
  if (o.dupes >= need) { o.dupes -= need; o.stars++; return { starUp: o.stars }; }
  return { dupe: true };
}
function summon(n, mode) {
  if (mode === 'gems' || mode === 'first10') {
    const cost = mode === 'first10' ? B.GACHA.first10 : n === 10 ? B.GACHA.cost10 : B.GACHA.cost1;
    if (S.gems < cost) { toast('Не хватает самоцветов'); R.shopTab = 'gems'; setTab('shop'); return; }
    S.gems -= cost;
    if (mode === 'first10') S.gacha.first10 = true;
  } else if (mode === 'ticket') {
    if (S.gacha.tickets <= 0) return;
    S.gacha.tickets--;
  }
  const results = [];
  for (let i = 0; i < n; i++) {
    const pityHit = S.gacha.pity >= B.GACHA.pity - 1;
    const minR = n === 10 && i === n - 1 && !results.some(x => x.pet.r >= 2) ? 2 : 0;
    const r = B.rollRarity(rnd, pityHit, minR);
    if (r >= 3) S.gacha.pity = 0; else S.gacha.pity++;
    const pet = pick(B.PETS.filter(p => p.r === r && !p.event));
    results.push({ pet, ...addPet(pet.id) });
  }
  S.gacha.total += n; S.stats.summons += n;
  quest('summon', n);
  recalc(); checkAch(); saveLocal(); updateSideButtons();
  showSummon(results, n);
}

/* ---------- анимация призыва ---------- */
function showSummon(results, n) {
  const top = Math.max(...results.map(r => r.pet.r));
  const st = { music: 'summon', results, n, top, phase: 'charge', t: 0, shown: 0, busy: false };
  openModal(sheet('Призыв', n === 10 ? 'Десять духов отвечают на зов' : 'Дух отвечает на зов', `
    <div class="sum-stage"><canvas id="sumCv"></canvas></div>
    <div class="sum-grid ${n === 1 ? 'single' : ''}" id="sumGrid"></div>
    <div class="btn-row" id="sumBtns"><button class="buy ghost" data-act="sum-skip">Показать всё</button></div>`, { noClose: true, cls: 'summon-sheet' }), st);
  AU.sfx('orb');
  const cv = $('sumCv'), r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const c = cv.getContext('2d');
  let lastT = performance.now(), nextCard = 0;
  const col = A.RAR_COL[top];
  const loop = now => {
    if (modalState !== st) return;
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; st.t += dt;
    const w = r.width, h = r.height;
    c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
    const charge = Math.min(1, st.t / (RM ? .3 : 1.3));
    const ringCol = charge < .7 ? '#c9a8ff' : col;
    A.drawMagicCircle(c, w / 2, h / 2, Math.min(w, h) * .42, st.t, st.phase === 'charge' ? charge : .2, ringCol);
    if (st.phase === 'charge') {
      for (let i = 0; i < 6; i++) {
        const a = st.t * 3 + i * Math.PI / 3, rr = (1 - charge) * Math.min(w, h) * .4;
        c.fillStyle = A.hexA(ringCol, .9); A.ell(c, w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, 5, 5); c.fill();
      }
      const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, 30 + charge * 40);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.5, A.hexA(ringCol, .7)); g.addColorStop(1, A.hexA(ringCol, 0));
      c.fillStyle = g; A.ell(c, w / 2, h / 2, 30 + charge * 40, 30 + charge * 40); c.fill();
      if (charge >= 1) { st.phase = 'reveal'; st.revealT = 0; if (top >= 3) AU.sfx('legend'); }
    } else {
      st.revealT += dt;
      if (n === 1) {
        const p = st.results[0].pet, rot = st.t * .6;
        c.save(); c.translate(w / 2, h / 2); c.globalAlpha = .55;
        for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = A.hexA(A.RAR_COL[p.r], .35); c.beginPath(); c.moveTo(0, 0); c.lineTo(-14, -h); c.lineTo(14, -h); c.closePath(); c.fill(); }
        c.restore();
        const sc = Math.min(1, st.revealT * 3);
        A.drawPet(c, w / 2, h / 2 + Math.sin(st.t * 2) * 4, (h / 64) * sc, p, st.t);
      } else {
        for (let i = 0; i < 8; i++) { const a = st.t + i * Math.PI / 4; c.fillStyle = A.hexA(col, .6); A.ell(c, w / 2 + Math.cos(a) * w * .35, h / 2 + Math.sin(a) * h * .3, 3, 3); c.fill(); }
      }
      nextCard -= dt;
      if (st.shown < st.results.length && nextCard <= 0) { revealCard(st); nextCard = RM ? 0 : .14; }
    }
  };
  st.raf = requestAnimationFrame(loop);
}
function revealCard(st) {
  const grid = $('sumGrid'); if (!grid) return;
  const r = st.results[st.shown++], p = r.pet;
  const note = r.isNew ? '<em class="new">Новый</em>' : r.starUp ? `<em>★ ${r.starUp}</em>` : r.refund ? `<em>+${r.refund} 💎</em>` : '<em>Дубликат</em>';
  grid.insertAdjacentHTML('beforeend', `<div class="sum-card r${p.r}"><img src="${A.petIcon(p, 96, S.pets.owned[p.id].stars)}" alt=""><b>${p.name}</b>${note}</div>`);
  AU.sfx(p.r >= 3 ? 'success' : 'reveal');
  if (st.shown >= st.results.length) summonDone(st);
}
function summonDone(st) {
  st.phase = 'done';
  const b = $('sumBtns'); if (!b) return;
  const G1 = B.GACHA.cost1, G10 = B.GACHA.cost10;
  b.innerHTML = `<button class="buy ghost" data-act="sum-close">Готово</button>
    <button class="buy ${S.gems < G1 ? 'poor' : ''}" data-act="summon" data-n="1" data-m="gems"><img src="${A.miscIcon('gem', 32)}" alt="">×1 · ${G1}</button>
    <button class="buy pink ${S.gems < G10 ? 'poor' : ''}" data-act="summon" data-n="10" data-m="gems"><img src="${A.miscIcon('gem', 32)}" alt="">×10 · ${G10}</button>`;
}
function skipSummon() {
  const st = modalState; if (!st || !st.results) return;
  st.phase = 'reveal'; st.revealT = 1; st.t = Math.max(st.t, 2);
  while (st.shown < st.results.length) revealCard(st);
}

/* --- 45_social.js --- */
/* ===== Чат и рейтинг игроков (свой сервер, /api) ===== */
const Social = {
  chat: [], lastId: 0, board: [], at: 0, busy: false, state: 'idle',
  async push() {
    if (!S || !S.hero) return;
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; return; }
    await NET.boardPush({
      pid: S.pid, name: heroName(), stage: S.maxStage, best: S.bestStage || 0,
      level: S.level, power: Math.round(R.power), rating: S.arena.rating,
    });
    this.at = Date.now();
    this.state = 'online';
  },
  async sync(force) {
    if (!S || !S.hero) return;
    if (!force && Date.now() - this.at < 45000) return;
    await this.push();
    Arena.netPush();
  },
  async loadChat() {
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; paintChat(); return; }
    this.state = 'online';
    const r = await NET.chatList(this.lastId);
    if (r && Array.isArray(r.messages)) {
      for (const m of r.messages) if (!this.chat.some(x => x.id === m.id)) this.chat.push(m);
      this.chat = this.chat.slice(-80);
      for (const m of this.chat) this.lastId = Math.max(this.lastId, m.id || 0);
      paintChat();
    }
  },
  async send() {
    if (this.busy) return;
    const inp = $('chatInput'); if (!inp) return;
    const text = (inp.value || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!text) return;
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; paintChat(); toast('Нет связи с сервером'); return; }
    this.busy = true;
    inp.disabled = true;
    const r = await NET.chatSend(S.pid, heroName(), text);
    this.busy = false;
    if (inp) { inp.disabled = false; }
    if (!r || !r.ok) {
      toast(r && r.error === 'slow' ? 'Слишком часто: подождите пару секунд' : 'Не удалось отправить');
      return;
    }
    inp.value = '';
    if (r.message) { this.chat.push(r.message); this.chat = this.chat.slice(-80); this.lastId = Math.max(this.lastId, r.message.id || 0); paintChat(); }
    inp.focus({ preventScroll: true });
  },
  async loadBoard() {
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; paintBoard(); return; }
    this.state = 'online';
    await this.push();
    const r = await NET.boardTop();
    if (r && Array.isArray(r.top)) { this.board = r.top; paintBoard(); }
  },
  enter() {
    if (R.socialSeg === 'chat') this.loadChat();
    else this.loadBoard();
  },
};

function timeHM(ts) {
  const d = new Date((ts || 0) * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function renderSocial() {
  const seg = segHTML('socialseg', R.socialSeg, [['chat', 'Чат'], ['board', 'Рейтинг']]);
  if (!unlockOk('chat')) return seg + lockCard('chat', 'Чат и рейтинг');
  return seg + (R.socialSeg === 'chat' ? renderChatPanel() : renderBoardPanel());
}
function renderChatPanel() {
  return `
    <section class="card chat-card">
      <div class="card-head"><h3>Чат</h3><span class="sub" id="chatState">${NET.online ? 'онлайн' : 'соединение…'}</span></div>
      <ul class="chat-list" id="chatList" aria-live="polite"></ul>
      <div class="chat-input">
        <input id="chatInput" maxlength="200" autocomplete="off" placeholder="Сообщение игрокам…" aria-label="Сообщение">
        <button class="buy pink small" data-act="chat-send">Отправить</button>
      </div>
      <p class="note">Имя в чате — имя героя. Будьте вежливы: сообщения видят все.</p>
    </section>`;
}
function renderBoardPanel() {
  return `
    <section class="card">
      <div class="card-head"><h3>Рейтинг игроков</h3><button class="link-btn" data-act="board-refresh">Обновить</button></div>
      <ol class="board server-board" id="boardList"><li class="board-empty">Загрузка…</li></ol>
      <p class="note">Сортировка по рекордному этапу, затем по мощи. Ваша строка подсвечена.</p>
    </section>`;
}
function paintChat() {
  const el = $('chatList'); if (!el) return;
  const st = $('chatState');
  if (st) st.textContent = Social.state === 'offline' ? 'нет связи с сервером' : 'онлайн';
  if (!Social.chat.length) {
    el.innerHTML = `<li class="chat-empty">${Social.state === 'offline' ? 'Чат доступен на сервере игры.' : 'Пока тихо — напишите первым.'}</li>`;
    return;
  }
  el.innerHTML = '';
  for (const m of Social.chat) {
    const li = document.createElement('li');
    if (m.pid && m.pid === S.pid) li.className = 'me';
    const head = document.createElement('div');
    head.className = 'chat-head';
    const b = document.createElement('b'); b.textContent = m.name || 'Игрок';
    const t = document.createElement('span'); t.className = 't'; t.textContent = timeHM(m.ts);
    head.append(b, t);
    const p = document.createElement('p'); p.textContent = m.text || '';
    li.append(head, p);
    el.append(li);
  }
  el.scrollTop = el.scrollHeight;
}
function paintBoard() {
  const el = $('boardList'); if (!el) return;
  if (Social.state === 'offline') { el.innerHTML = '<li class="board-empty">Рейтинг доступен на сервере игры.</li>'; return; }
  if (!Social.board.length) { el.innerHTML = '<li class="board-empty">Пока нет игроков.</li>'; return; }
  el.innerHTML = '';
  Social.board.forEach((p, i) => {
    const li = document.createElement('li');
    if (p.pid === S.pid) li.className = 'me';
    const place = document.createElement('span'); place.className = 'place'; place.textContent = i + 1;
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name || 'Игрок';
    const lg = document.createElement('span'); lg.className = 'lg'; lg.textContent = `ур. ${p.level || 1}`;
    const b = document.createElement('b'); b.textContent = p.stage ? `${Math.floor(p.stage / 10) + 1}-${p.stage % 10 + 1}` : '—';
    li.append(place, nm, lg, b);
    el.append(li);
  });
}

/* --- 47_event.js --- */
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
  if (!S || S.level < 5) return '';
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
  `), { music: 'hanami' });
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
  if (!S || S.level < 7) return '';
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
  `), { music: 'lantern' });
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

/* --- 48_world.js --- */
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

/* --- 50_arena.js --- */
/* ===== Арена: асинхронные бои, рейтинг, лиги ===== */
function seeded(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
const SHADOWS = [2350, 2150, 1980, 1820, 1690, 1560, 1440, 1330, 1230, 1150, 1080, 1020, 960].map((r, i) => ({ name: B.BOT_NAMES[(i * 7 + 3) % B.BOT_NAMES.length], rating: r, shadow: true }));

const Arena = {
  players: [], lastFetch: 0, lastPush: 0, opp: null, oppSeed: -1, netPlayers: [],
  cloudReady() { this.push(); },
  async netPush() {
    if (!S || !S.hero) return;
    const ok = await NET.probe();
    if (!ok) return;
    const L = R.look, st = R.st;
    await NET.arenaPush({
      pid: S.pid, name: heroName(), rating: S.arena.rating, power: Math.round(R.power), level: S.level,
      body: S.hero.body, hair: S.hero.hair,
      st: { atk: st.atk, hp: st.hp, def: st.def, crit: st.crit, critDmg: st.critDmg, aspd: st.aspd },
      look: { weapon: L.weapon, helmet: L.helmet, upper: L.upper, lower: L.lower, gloves: L.gloves, boots: L.boots, neck: L.neck, ear: L.ear, aura: L.aura },
    });
  },
  sanitize(id, d) {
    if (!d || typeof d !== 'object') return null;
    const num = (v, lo, hi) => { v = Number(v); return isFinite(v) ? clamp(v, lo, hi) : lo; };
    const st = d.stats || d.st || {};
    const lk = d.look || {};
    const gr = v => Math.round(num(v, -1, 6));
    const lg = d.body === 'boy' ? 'boy' : 'girl';
    return {
      id: id || d.pid, pid: d.pid || id, real: true, name: String(d.name || 'Игрок').slice(0, 14), rating: Math.round(num(d.rating, 0, 9999)), power: num(d.power, 0, 1e300), level: Math.round(num(d.level, 1, 9999)),
      body: lg, hair: Math.round(num(d.hair ?? lk.hair, 0, 3)),
      st: { atk: num(st.atk, 1, 1e300), hp: num(st.hp, 1, 1e300), def: num(st.def, 0, 1e300), crit: num(st.crit, 0, .9), critDmg: num(st.critDmg, 1, 50), aspd: num(st.aspd, .5, 12) },
      look: { body: lg, hair: Math.round(num(d.hair ?? lk.hair, 0, 3)), weapon: lk.weapon && gr(lk.weapon.g) >= 0 ? { g: gr(lk.weapon.g), e: Math.round(num(lk.weapon.e, 0, 20)) } : null, helmet: gr(lk.helmet), upper: gr(lk.upper), lower: gr(lk.lower), gloves: gr(lk.gloves), boots: gr(lk.boots), neck: gr(lk.neck), ear: gr(lk.ear), aura: gr(lk.aura) },
    };
  },
  async refresh() {
    await NET.probe();
    if (NET.online) {
      try {
        const r = await NET.arenaList(S.pid, S.arena.rating, R.power);
        if (r && Array.isArray(r.players)) this.players = r.players.map(p => this.sanitize(p.pid, p)).filter(Boolean);
      } catch (e) { }
      this.netPlayers = this.players;
      if (this.players.length) return;
    }
    if (!Cloud.db) return;
    try {
      const snap = await Cloud.db.collection('arena').orderBy('rating', 'desc').limit(60).get();
      this.players = snap.docs.map(d => this.sanitize(d.id, d.data())).filter(Boolean);
    } catch (e) { }
  },
  async push() {
    if (!Cloud.db || !S || !S.hero || Date.now() - this.lastPush < 15000) return;
    this.lastPush = Date.now();
    const L = R.look, st = R.st;
    try {
      await Cloud.db.doc('arena/' + Cloud.uid).set({
        name: heroName(), body: S.hero.body, hair: S.hero.hair, level: S.level, rating: S.arena.rating, power: R.power,
        stats: { atk: st.atk, hp: st.hp, def: st.def, crit: st.crit, critDmg: st.critDmg, aspd: st.aspd },
        look: { wg: L.weapon ? L.weapon.g : -1, we: L.weapon ? L.weapon.e : 0, helmet: L.helmet, upper: L.upper, lower: L.lower, gloves: L.gloves, boots: L.boots, neck: L.neck, ear: L.ear, aura: L.aura },
        updatedAt: Date.now(),
      });
    } catch (e) { }
  },
  onOpen() {
    if (Date.now() - this.lastFetch > 30000) {
      this.lastFetch = Date.now();
      this.push();
      this.netPush();
      this.refresh().then(() => {
        Arena.opp = null; Arena.oppSeed = -1;
        if (R.tab === 'arena' && this.players.length) renderPanel();
      });
    }
  },
};

/* Соперники: в первую очередь реальные игроки с сервера, боты — только фон.
   Статы реального игрока приводим к нашей мощи, чтобы не было «неубиваемых». */
const BOT_F = [.84, .95, 1.02];
function scaledStats(st, k) {
  return { atk: Math.max(1, st.atk * k), hp: Math.max(1, st.hp * k), def: Math.max(0, st.def * k), crit: Math.min(.9, st.crit), critDmg: st.critDmg, aspd: clamp(st.aspd, .5, 12) };
}
function genOpponents() {
  const r = seeded(S.arena.seed + S.level * 13 + Math.floor(S.arena.rating)), g0 = unlockedGrade();
  const list = BOT_F.map((base, i) => {
    const f = base * (.97 + r() * .05);
    const st = scaledStats({ atk: R.st.atk, hp: R.st.hp, def: R.st.def, crit: R.st.crit, critDmg: R.st.critDmg, aspd: R.st.aspd }, f);
    const body = r() < .5 ? 'girl' : 'boy', hair = Math.floor(r() * 4);
    const g = clamp(g0 + (f > 1.01 ? 1 : f < .9 ? -1 : 0), 0, 6);
    const e = Math.floor(r() * 7);
    return {
      name: B.BOT_NAMES[Math.floor(r() * B.BOT_NAMES.length)], body, hair, st, power: B.power(st),
      rating: Math.max(0, Math.round(S.arena.rating + (f - 1) * 350 + (r() - .5) * 60)),
      look: { body, hair, weapon: { g, e }, helmet: r() < .7 ? g : -1, upper: g, lower: g, gloves: g, boots: g, neck: g, ear: g, aura: g >= 4 && e >= 6 ? g : -1 },
      real: false,
    };
  });
  // реальные соперники: до двух ближайших по рейтингу
  const cands = [...(Arena.netPlayers || []), ...Arena.players]
    .filter(p => p && p.st && p.pid !== S.pid && p.id !== S.pid)
    .sort((a, b) => Math.abs(a.rating - S.arena.rating) - Math.abs(b.rating - S.arena.rating));
  const used = new Set();
  for (let slot = 1; slot >= 0 && cands.length; slot--) {
    const p = cands.find(x => !used.has(x.pid || x.id));
    if (!p) break;
    used.add(p.pid || p.id);
    const desired = R.power * (slot === 1 ? .92 : 1.04);
    const basePower = B.power(p.st) || p.power || 1;
    const k = clamp(Math.sqrt(desired / Math.max(1, basePower)), .78, 1.12);
    list[slot] = { ...p, st: scaledStats(p.st, k), power: B.power(scaledStats(p.st, k)), real: true };
  }
  return list;
}
function opponents() {
  if (!Arena.opp || Arena.oppSeed !== S.arena.seed) { Arena.opp = genOpponents(); Arena.oppSeed = S.arena.seed; }
  return Arena.opp;
}
function boardHTML() {
  const rows = [...Arena.players.filter(p => p.id !== Cloud.uid), ...SHADOWS, { name: heroName(), rating: S.arena.rating, me: true }]
    .sort((a, b) => b.rating - a.rating);
  const myIdx = rows.findIndex(r => r.me);
  const show = rows.slice(0, 12);
  if (myIdx >= 12) show.push(rows[myIdx]);
  return show.map(p => {
    const lg = B.LEAGUES[B.league(p.rating)];
    return `<li class="${p.me ? 'me' : ''}"><span class="place">${rows.indexOf(p) + 1}</span><span class="nm">${esc(p.name)}${p.shadow ? '<small>тень</small>' : p.real ? '<small class="pl">игрок</small>' : ''}</span><span class="lg" style="color:${lg.color}">${lg.name}</span><b>${p.rating}</b></li>`;
  }).join('');
}
/* ---------- сезоны арены ---------- */
function ensureArenaSeason() {
  const info = B.arenaSeason();
  if (!S || !S.arena) return info;
  const a = S.arena;
  if (!Array.isArray(a.history)) a.history = [];
  if (a.season === info.idx) return info;
  const had = a.season >= 0 && (a.fights > 0 || a.wins > 0 || a.losses > 0);
  if (had) {
    const rw = B.arenaSeasonReward(a.rating);
    a.history.unshift({ season: info.idx, rating: a.rating, league: B.league(a.rating), reward: rw, wins: a.wins, losses: a.losses });
    a.history = a.history.slice(0, 5);
    const prev = info.idx;
    a.rating = B.ARENA.start; a.wins = 0; a.losses = 0; a.fights = 0; a.buys = 0; a.seed = 1;
    a.tickets = B.ARENA.tickets; a.day = ''; a.rewardDay = '';
    a.season = info.idx;
    grant(rw, true);
    toast(`Сезон арены ${prev} завершён: награда ${rewardText(rw)}`);
    log(`Сезон арены ${prev} завершён. Рейтинг сброшен до ${B.ARENA.start}, награда выдана.`, 'good');
  } else {
    a.season = info.idx;
  }
  saveLocal();
  return info;
}

function renderArena() {
  if (!unlockOk('arena')) return lockCard('arena', 'Арена');
  const season = ensureArenaSeason();
  const a = S.arena, li = B.league(a.rating), lg = B.LEAGUES[li], next = B.LEAGUES[li + 1];
  const canClaim = a.rewardDay !== dayKey();
  const ops = opponents();
  const sr = B.arenaSeasonReward(a.rating);
  const hist = (a.history || []).slice(0, 3);
  return `
    <section class="card league-card" style="--lg:${lg.color}">
      <div class="badge"><img src="${A.miscIcon('trophy', 64)}" alt=""></div>
      <div class="league-meta"><h2>${lg.name}</h2><p class="sub">Рейтинг <b>${a.rating}</b>${next ? ` · до лиги «${next.name}» ${next.min - a.rating}` : ''}</p>
        <p class="sub">Побед ${a.wins} · поражений ${a.losses}</p></div>
      <button class="buy ${canClaim ? 'pink' : ''} small" data-act="arena-claim" ${canClaim ? '' : 'disabled'}><img src="${A.miscIcon('gem', 32)}" alt="">${canClaim ? `+${lg.daily}` : 'Завтра'}</button>
    </section>
    <section class="card season-card">
      <div class="card-head"><h3>Сезон ${season.num}</h3><span class="sub">до конца ${left(season.left)}</span></div>
      <p class="sub">Награда за лигу «${lg.name}»: ${rewardText(sr)}</p>
      ${hist.length ? `<ul class="rows season-hist">${hist.map(h => `<li class="row season-row">
        <img src="${A.miscIcon('trophy', 48)}" alt="">
        <div class="row-main"><b>Сезон ${h.season} · ${B.LEAGUES[h.league].name}</b>
          <span class="meta">${h.rating} рейтинга · ${h.wins}–${h.losses}</span>
          <span class="meta">Награда: ${rewardText(h.reward)}</span></div></li>`).join('')}</ul>`
      : '<p class="note">Пока нет завершённых сезонов. Играйте бои до конца недели — награда придёт автоматически.</p>'}
    </section>
    <div class="ticket-row">
      <span class="chip plain"><img src="${A.miscIcon('ticket', 32)}" alt="">Билеты ${a.tickets}/${B.ARENA.tickets}</span>
      ${a.tickets < B.ARENA.tickets && a.buys < B.ARENA.refillMax ? `<button class="buy ghost small ${S.gems < B.ARENA.refillCost ? 'poor' : ''}" data-act="arena-refill" data-cost="${B.ARENA.refillCost}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">Пополнить за ${B.ARENA.refillCost}</button>` : `<span class="sub">Новые билеты через ${left(msToMidnight())}</span>`}
    </div>
    <div class="card-head" style="margin:0"><h3>Соперники</h3><button class="link-btn" data-act="arena-reroll">Другие соперники</button></div>
    <ul class="rows">${ops.map((o, i) => {
      const win = B.eloDelta(a.rating, o.rating, true), lose = B.eloDelta(a.rating, o.rating, false);
      const diff = o.power / Math.max(1, R.power);
      const tag = diff < .92 ? ['легко', 'easy'] : diff > 1.1 ? ['сложно', 'hard'] : ['на равных', 'even'];
      return `<li class="row opp"><img class="ava" src="${A.heroIcon(o.body, o.hair, 96)}" alt="">
        <div class="row-main"><b>${esc(o.name)}${o.real ? ' <small class="pl">игрок</small>' : ''}</b>
        <span class="meta">Мощь ${fmt(o.power)} · рейтинг ${o.rating}</span>
        <span class="val"><span class="diff ${tag[1]}">${tag[0]}</span> победа +${win}, поражение ${lose}</span></div>
        <button class="buy pink" data-act="fight" data-i="${i}" ${a.tickets > 0 ? '' : 'disabled'}>В бой</button></li>`;
    }).join('')}</ul>
    <section class="card"><div class="card-head"><h3>Таблица лиги</h3><span class="sub">${Cloud.db ? 'Игроки, которым открыта игра, и тени арены' : 'Тени арены'}</span></div>
      <ol class="board" id="arenaBoard">${boardHTML()}</ol></section>`;
}

/* ---------- бой на арене ---------- */
function arenaFight(i) {
  const o = opponents()[i]; if (!o) return;
  if (S.arena.tickets <= 0) { toast('Билеты закончились'); return; }
  S.arena.tickets--; S.arena.fights++;
  const mk = (name, look, st) => ({ name, look, st, max: st.hp * B.ARENA.hpMul, hp: st.hp * B.ARENA.hpMul, timer: rnd() * .4, swing: -1, hit: false, hurt: 0, n: 0 });
  const F = { me: mk(heroName(), R.look, { ...R.st }), op: mk(o.name, o.look, o.st), opp: o, t: 0, over: false, fx: [] };
  const st = { music: 'arena', fight: F, busy: true };
  openModal(sheet('Арена', `${esc(heroName())} против ${esc(o.name)}`, `
    <div class="fight-stage"><canvas id="fightCv"></canvas>
      <div class="fight-bars"><div><span>${esc(heroName())}</span><div class="bar hp"><i id="fMe"></i></div></div>
      <div class="r"><span>${esc(o.name)}</span><div class="bar hp"><i id="fOp"></i></div></div></div>
      <div class="forge-result" id="fightRes"></div></div>
    <div class="btn-row" id="fightBtns"><button class="buy ghost" data-act="fight-skip">Пропустить</button></div>`, { noClose: true }), st);
  const cv = $('fightCv'), r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const c = cv.getContext('2d');
  let lastT = performance.now();
  const loop = now => {
    if (modalState !== st) return;
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    if (!F.over) fightStep(F, dt, true);
    drawFight(c, r.width, r.height, d, F);
    $('fMe').style.width = clamp(F.me.hp / F.me.max * 100, 0, 100) + '%';
    $('fOp').style.width = clamp(F.op.hp / F.op.max * 100, 0, 100) + '%';
    if (F.over && !F.done) arenaResult(st);
  };
  st.raf = requestAnimationFrame(loop);
}
function fightStep(F, dt, visual) {
  F.t += dt;
  for (const [a, b, side] of [[F.me, F.op, 1], [F.op, F.me, -1]]) {
    if (a.hurt > 0) a.hurt -= dt;
    a.timer += dt * a.st.aspd;
    if (a.swing < 0 && a.timer >= 1) { a.timer = 0; a.swing = 0; a.hit = false; }
    if (a.swing >= 0) {
      a.swing += dt / .34;
      if (!a.hit && a.swing >= .45) {
        a.hit = true; a.n++;
        const crit = rnd() < a.st.crit, special = a.n % 4 === 0;
        const dmg = B.pvpHit(a.st.atk, b.st.def) * (crit ? a.st.critDmg : 1) * (special ? 2.2 : 1) * (.9 + rnd() * .2);
        b.hp -= dmg; b.hurt = .2;
        if (visual) {
          F.fx.push({ type: 'num', side: -side, t: 0, text: fmt(dmg) + (crit ? '!' : ''), c: special ? '#ff8fc1' : crit ? '#ffcf4a' : '#ffffff', big: crit || special });
          F.fx.push({ type: 'slash', side: -side, t: 0, c: special ? '#ff8fc1' : crit ? '#ffd760' : '#ffffff', big: special });
          AU.sfx(special ? 'skill' : crit ? 'crit' : 'hit');
        }
      }
      if (a.swing >= 1) a.swing = -1;
    }
  }
  if (F.me.hp <= 0 || F.op.hp <= 0 || F.t >= 30) {
    F.over = true;
    F.win = F.op.hp <= 0 && F.me.hp > 0 ? true : F.me.hp <= 0 ? false : F.me.hp / F.me.max >= F.op.hp / F.op.max;
  }
  F.fx = F.fx.filter(f => (f.t += dt) < .8);
}
function drawFight(c, w, h, d, F) {
  c.setTransform(d, 0, 0, d, 0, 0);
  const gy = h * .8, k = h / 300;
  A.drawBackground(c, w, h, gy, ARENA_ZONE, 0, F.t);
  const lx = w * .3, rx = w * .7;
  const an = f => ({ t: F.t, run: 0, phase: 0, swing: f.swing, hurt: Math.max(0, f.hurt), dead: f.hp <= 0, cast: 0 });
  A.drawHero(c, lx, gy, k * 1.05, F.me.look, an(F.me));
  c.save(); c.translate(rx, gy); c.scale(-1, 1); A.drawHero(c, 0, 0, k * 1.05, F.op.look, an(F.op)); c.restore();
  for (const f of F.fx) {
    const x = f.side > 0 ? rx : lx, p = f.t / .8;
    if (f.type === 'num') {
      c.save(); c.globalAlpha = 1 - p; txt(c, f.text, x + (f.side > 0 ? -10 : 10) * k, gy - (120 + p * 40) * k, (f.big ? 20 : 14) * Math.sqrt(k), f.c); c.restore();
    } else {
      c.save(); c.globalAlpha = Math.max(0, 1 - p * 3); c.globalCompositeOperation = 'lighter'; c.strokeStyle = f.c; c.lineWidth = (f.big ? 10 : 5) * k; c.lineCap = 'round';
      c.beginPath(); c.arc(x, gy - 60 * k, 40 * k, f.side > 0 ? 2.2 : -.9, f.side > 0 ? 4 : .9); c.stroke(); c.restore();
    }
  }
}
function arenaResult(st) {
  const F = st.fight; F.done = true; st.busy = false;
  const a = S.arena, o = F.opp;
  const delta = B.eloDelta(a.rating, o.rating, F.win);
  a.rating = Math.max(0, a.rating + delta);
  const gems = F.win ? B.ARENA.winGems : B.ARENA.loseGems;
  S.gems += gems;
  if (F.win) { a.wins++; S.stats.arenaWins++; addEventCoins(B.EVENT.arena, 'arena'); addLanternDrop('arena'); } else a.losses++;
  a.seed++;
  quest('arena'); passXp(B.PASS.arenaXp); checkAch();
  const res = $('fightRes');
  res.className = 'forge-result ' + (F.win ? 'ok' : 'bad');
  res.innerHTML = `${F.win ? 'Победа!' : 'Поражение'}<small>Рейтинг ${delta >= 0 ? '+' : ''}${delta} · +${gems} ${plural(gems, GEM_W)}</small>`;
  AU.sfx(F.win ? 'victory' : 'fail');
  $('fightBtns').innerHTML = `<button class="buy ghost" data-act="fight-close">Закрыть</button>${a.tickets > 0 ? '<button class="buy pink" data-act="fight-again">Следующий бой</button>' : ''}`;
  saveLocal(); Arena.lastPush = 0; Arena.push();
  if (a.fights % 3 === 0) st.onClose = () => Monet.maybeInterstitial();
}
function skipFight() {
  const st = modalState; if (!st || !st.fight || st.fight.over) return;
  let guard = 0;
  while (!st.fight.over && guard++ < 2000) fightStep(st.fight, .05, false);
}

/* --- 60_quests.js --- */
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
  if (!S.weekly || S.weekly.week !== wk) S.weekly = { week: wk, prog: {}, claimed: {}, chest: false };
  const season = B.seasonOf(Date.now());
  if (S.pass.season !== season) S.pass = { season, xp: 0, free: [], prem: [], premium: false };
}
function quest(id, n = 1) {
  if (!S) return;
  dailyReset();
  const d = B.DAILY.find(x => x.id === id);
  if (d) {
    const before = S.quests.prog[id] || 0;
    if (before < d.goal) {
      S.quests.prog[id] = Math.min(d.goal, before + n);
      if (S.quests.prog[id] >= d.goal) { toast(`Задание выполнено: ${d.name}`); updateSideButtons(); }
    }
  }
  const w = B.WEEKLY.find(x => x.id === id);
  if (w) {
    const wb = S.weekly.prog[id] || 0;
    if (wb < w.goal) {
      S.weekly.prog[id] = Math.min(w.goal, wb + n);
      if (S.weekly.prog[id] >= w.goal) { toast(`Недельное задание: ${w.name}`); updateSideButtons(); }
    }
  }
}
function questsReady() {
  if (!S) return 0;
  if (!S.weekly) S.weekly = { week: weekKey(), prog: {}, claimed: {}, chest: false };
  let n = 0;
  for (const d of B.DAILY) if ((S.quests.prog[d.id] || 0) >= d.goal && !S.quests.claimed[d.id]) n++;
  if (!S.quests.chest && B.DAILY.every(d => S.quests.claimed[d.id])) n++;
  for (const w of B.WEEKLY) if ((S.weekly.prog[w.id] || 0) >= w.goal && !S.weekly.claimed[w.id]) n++;
  if (!S.weekly.chest && B.WEEKLY.every(w => S.weekly.claimed[w.id])) n++;
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
  const tabs = segHTML('qtab', questTab, [['story', 'Сюжет', chaptersReady() > 0 || fundClaimable().length > 0], ['daily', 'Задания'], ['week', 'Неделя', weeklyReady() > 0], ['pass', 'Пропуск'], ['ach', 'Достижения', achReady().length > 0], ['login', 'Вход', S.login.last !== dayKey()]]);
  const body = { story: questsStory, daily: questsDaily, week: questsWeek, pass: questsPass, ach: questsAch, login: questsLogin }[questTab]();
  openModal(sheet('Задания и награды', `Обновление через ${left(msToMidnight())}`, tabs + body, { cls: 'quests-sheet' }), { quests: true });
}
function weeklyReady() {
  if (!S.weekly) return 0;
  return B.WEEKLY.filter(w => (S.weekly.prog[w.id] || 0) >= w.goal && !S.weekly.claimed[w.id]).length
    + (!S.weekly.chest && B.WEEKLY.every(w => S.weekly.claimed[w.id]) ? 1 : 0);
}
function questsWeek() {
  const q = S.weekly;
  const rows = B.WEEKLY.map(w => {
    const p = q.prog[w.id] || 0, done = p >= w.goal, got = q.claimed[w.id];
    return `<li class="row quest ${got ? 'got' : ''}"><img src="${A.miscIcon('quests', 64)}" alt="">
      <div class="row-main"><b>${w.name}</b><div class="bar mini"><i style="width:${p / w.goal * 100}%"></i></div>
      <span class="meta">${p}/${w.goal} · ${rewardText(w.rw)}</span></div>
      ${got ? '<button class="buy" disabled>Получено</button>' : done ? `<button class="buy pink" data-act="wclaim" data-id="${w.id}">Забрать</button>` : '<button class="buy" disabled>В процессе</button>'}</li>`;
  }).join('');
  const all = B.WEEKLY.every(w => q.claimed[w.id]);
  const ready = weeklyReady();
  return `<p class="sub">До конца недели ${left(msToWeekEnd())}. Прогресс считается вместе с ежедневными заданиями.</p>
    <ul class="rows">${rows}</ul>
    ${ready > 1 ? `<button class="buy pink ev-all" data-act="wclaim-all">Забрать всё · ${ready}</button>` : ''}
    <section class="card chest-card"><img src="${A.miscIcon('chest', 64)}" alt=""><div class="row-main">
      <b>Сундук недели</b><span class="meta">Все недельные задания: ${rewardText(B.WEEKLY_CHEST)}</span></div>
      ${q.chest ? '<button class="buy" disabled>Открыт</button>' : `<button class="buy ${all ? 'pink' : ''}" data-act="wchest" ${all ? '' : 'disabled'}>Открыть</button>`}</section>`;
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

/* --- 70_monet.js --- */
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
  // предложение в момент первой победы над боссом: подарок + стартовый набор
  openStarterOffer() {
    if (!S || S.shop.starterSeen || S.shop.starter) return;
    S.shop.starterSeen = true;
    grant({ gems: 50, scrollsA: 2 });
    const p = B.IAP_BY.starter, pr = P.price(p.id, p.rub);
    openModal(sheet('Первый босс повержен!', 'Подарок новичку уже в кошельке', `
      <section class="card chest-card"><img src="${A.miscIcon('chest', 64)}" alt="">
        <div class="row-main"><b>50 💎 и 2 свитка заточки</b><span class="meta">Добавлены автоматически</span></div></section>
      <section class="offer starter"><img src="${A.miscIcon('starter', 64)}" alt="">
        <div class="row-main"><b>${p.name}</b><span class="tag">${p.tag}</span>
        <p>${p.gems} 💎, эпический питомец ${B.PET[p.pet].name}, ${p.scrollsA} свитков доспеха и ${p.blessedA} благословенных.</p></div>
        <button class="buy pink" data-act="iap" data-id="starter">${pr.icon ? `<img src="${pr.icon}" alt="">` : ''}${pr.text}</button></section>
      <p class="note">Набор покупается один раз и сильно ускоряет старт. На Яндекс Играх оплату обрабатывает площадка.</p>
      <div class="btn-row"><button class="buy ghost wide" data-act="close">Продолжить</button></div>`), { starterOffer: true });
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
    if (modalState && modalState.starterOffer) closeModal();
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

/* --- 80_intro.js --- */
/* ===== Выбор героя и смена облика ===== */
const intro = $('intro');
const IN = { body: 'girl', hair: 0, name: '', custom: false, edit: false, raf: 0, t: 0 };
const DEFAULT_NAME = { girl: 'Сакура', boy: 'Рэн' };
function openIntro(edit) {
  IN.edit = !!edit;
  if (edit && S.hero) { IN.body = S.hero.body; IN.hair = S.hero.hair; IN.name = S.hero.name; IN.custom = true; }
  else { IN.body = 'girl'; IN.hair = 0; IN.name = DEFAULT_NAME.girl; IN.custom = false; }
  if (modalState) closeModal();
  $('introSub').textContent = edit ? 'Облик и имя можно менять когда угодно, прогресс сохранится' : 'Выберите героя для своего пути';
  $('introGo').textContent = edit ? 'Сохранить облик' : 'Начать путь';
  $('introCancel').hidden = !edit;
  $('heroNameIn').value = IN.name;
  intro.hidden = false;
  syncIntro();
  for (const cv of intro.querySelectorAll('canvas')) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); cv._d = d; cv._w = r.width; cv._h = r.height;
  }
  let lastT = performance.now();
  cancelAnimationFrame(IN.raf);
  const loop = now => {
    if (intro.hidden) return;
    IN.raf = requestAnimationFrame(loop);
    IN.t += Math.min(.05, (now - lastT) / 1000); lastT = now;
    for (const card of intro.querySelectorAll('.pick-card')) {
      const cv = card.querySelector('canvas'), c = cv.getContext('2d'), body = card.dataset.body;
      c.setTransform(cv._d, 0, 0, cv._d, 0, 0); c.clearRect(0, 0, cv._w, cv._h);
      const sel = body === IN.body;
      const look = edit && R.look ? { ...R.look, body, hair: sel ? IN.hair : 0 } : { body, hair: sel ? IN.hair : 0, weapon: { g: 0, e: 0 }, helmet: -1, upper: 0, lower: 0, gloves: -1, boots: 0, neck: -1, ear: -1, aura: -1 };
      const k = cv._h / 150;
      c.fillStyle = sel ? 'rgba(255,143,193,.22)' : 'rgba(255,255,255,.06)'; A.ell(c, cv._w / 2, cv._h - 12, cv._w * .34, 7); c.fill();
      A.drawHero(c, cv._w / 2 - 4 * k, cv._h - 10, k, look, { t: IN.t + (body === 'boy' ? 1.3 : 0), run: 0, phase: 0, swing: sel && (IN.t % 4) < .35 ? (IN.t % 4) / .35 : -1, hurt: 0, dead: false, cast: 0 });
    }
  };
  IN.raf = requestAnimationFrame(loop);
  updateMusic();
}
function syncIntro() {
  for (const card of intro.querySelectorAll('.pick-card')) card.setAttribute('aria-pressed', card.dataset.body === IN.body ? 'true' : 'false');
  $('hairRow').innerHTML = A.HAIRS[IN.body].map((h, i) => `<button class="hair-sw" data-hair="${i}" aria-pressed="${i === IN.hair}" aria-label="Волосы: ${h.name}" style="--c:${h.m};--c2:${h.sh}"><span></span>${h.name}</button>`).join('');
}
function finishIntro() {
  const name = ($('heroNameIn').value || '').replace(/\s+/g, ' ').trim().slice(0, 12) || DEFAULT_NAME[IN.body];
  const first = !S.hero;
  S.hero = { body: IN.body, hair: IN.hair, name };
  intro.hidden = true; cancelAnimationFrame(IN.raf);
  recalc(); updateHudStatic(); renderPanel(); updateSideButtons(); updateNav(); saveLocal(); Cloud.push();
  Arena.lastPush = 0; Arena.push();
  if (first) {
    S.intro = true;
    if (S.stats.kills > 0) {
      log(`С возвращением, ${name}! Башня, подземелья и пробуждение уже доступны.`, 'good');
      log('Загляните в «Задания»: сюжет, подарок за вход и награды за достижения.', 'sys');
    } else {
      log(`Добро пожаловать, ${name}! ${G('Героиня сражается', 'Герой сражается')} сам${G('а', '')}, а вы растите силу.`, 'good');
      log('Сюжет начнётся с первой главы: победите 10 монстров и загляните в «Героя».', 'sys');
    }
    banner(name, 'Путь начинается', '#ff8fc1');
    P.gameplay(true);
    if (R.pendingOffline) { R.pendingOffline = false; offline(); }
    setTimeout(() => { if (S.tutorial && !S.tutorial.done) startTutorial(); }, 1200);
  } else toast('Облик сохранён');
  updateMusic();
}
intro.addEventListener('click', e => {
  AU.init(); updateMusic();
  const card = e.target.closest('.pick-card');
  if (card) {
    if (IN.body !== card.dataset.body) {
      IN.body = card.dataset.body; IN.hair = 0;
      if (!IN.custom) { IN.name = DEFAULT_NAME[IN.body]; $('heroNameIn').value = IN.name; }
      syncIntro(); AU.sfx('click');
    }
    return;
  }
  const hs = e.target.closest('[data-hair]');
  if (hs) { IN.hair = +hs.dataset.hair; syncIntro(); AU.sfx('click'); return; }
  if (e.target.closest('#introGo')) { finishIntro(); return; }
  if (e.target.closest('#introCancel')) { intro.hidden = true; cancelAnimationFrame(IN.raf); updateMusic(); }
});
$('heroNameIn').addEventListener('input', () => { IN.custom = true; });
$('heroNameIn').addEventListener('keydown', e => { if (e.key === 'Enter') finishIntro(); });

/* --- 85_tutorial.js --- */
/* ===== Короткое обучение для новичка ===== */
const TUTO_STEPS = [
  { title: 'Бой идёт сам', text: 'Героиня сражается автоматически. Вы решаете, что надеть, что заточить и куда вложить золото.', target: '#battle' },
  { title: 'Вещи и заточка', text: 'В «Вещах» наденьте лучший предмет. Заточка до +3 безопасна, дальше есть риск — но и сила выше.', tab: 'gear', target: '#panel .rows' },
  { title: 'Умения', text: 'Умения открываются с уровнем и тратят ману. Их можно включать и выключать под свой билд.', tab: 'hero', seg: 'skills', target: '#panel .seg' },
  { title: 'Задания', text: 'Кнопка «Задания» ведёт к ежедневным и недельным наградам, сюжету и пропуску.', target: '#questBtn' },
  { title: 'Готовы!', text: 'Начните с тренировки и первых этапов. Обучение можно пройти заново в настройках.', target: '#tabs' },
];
let tutoIdx = 0, tutoEl = null;

function tutorialActive() { return !!tutoEl; }
function startTutorial(force) {
  if (!S || !S.hero || !$('intro').hidden) return;
  if (modalState) { setTimeout(() => startTutorial(force), 700); return; }
  if (!force && S.tutorial && S.tutorial.done) return;
  tutoIdx = 0;
  S.tutorial = { done: false, step: 0 };
  if (!tutoEl) buildTutorial();
  tutoEl.hidden = false;
  tutoShow(0);
  saveLocal();
}
function buildTutorial() {
  tutoEl = document.createElement('div');
  tutoEl.id = 'tuto';
  tutoEl.className = 'tuto';
  tutoEl.setAttribute('role', 'dialog');
  tutoEl.setAttribute('aria-modal', 'true');
  tutoEl.setAttribute('aria-label', 'Обучение');
  tutoEl.innerHTML = `
    <div class="tuto-spot" id="tutoSpot"></div>
    <div class="tuto-card" id="tutoCard">
      <img class="tuto-fox" src="${typeof TUTO_GUIDE !== 'undefined' ? TUTO_GUIDE : ''}" alt="">
      <div class="tuto-body"><span class="tuto-step" id="tutoStep"></span><b id="tutoTitle"></b><p id="tutoText"></p></div>
      <div class="tuto-dots" id="tutoDots"></div>
      <div class="tuto-btns"><button class="link-btn" data-tuto="skip">Пропустить</button><button class="buy pink" data-tuto="next">Далее</button></div>
    </div>`;
  document.body.appendChild(tutoEl);
  tutoEl.addEventListener('click', e => {
    const b = e.target.closest('[data-tuto]'); if (!b) return;
    AU.sfx('click');
    if (b.dataset.tuto === 'skip') tutoFinish(true);
    else tutoNext();
  });
  window.addEventListener('resize', () => { if (tutoEl) tutoPosition(); });
  document.addEventListener('keydown', e => { if (tutoEl && e.key === 'Escape') tutoFinish(true); });
}
function tutoShow(i) {
  tutoIdx = Math.max(0, Math.min(TUTO_STEPS.length - 1, i));
  const st = TUTO_STEPS[tutoIdx];
  if (st.tab && R.tab !== st.tab) setTab(st.tab);
  if (st.seg) { R.heroSeg = st.seg; renderPanel(); }
  if (st.target && !['#battle', '#tabs', '#questBtn'].includes(st.target)) {
    const el = document.querySelector(st.target);
    if (el) el.scrollIntoView({ block: 'center' });
  }
  $('tutoStep').textContent = `Шаг ${tutoIdx + 1} из ${TUTO_STEPS.length}`;
  $('tutoTitle').textContent = st.title;
  $('tutoText').textContent = st.text;
  $('tutoDots').innerHTML = TUTO_STEPS.map((_, n) => `<i class="${n === tutoIdx ? 'on' : ''}"></i>`).join('');
  requestAnimationFrame(tutoPosition);
  const next = tutoEl.querySelector('[data-tuto="next"]');
  if (next) { next.textContent = tutoIdx === TUTO_STEPS.length - 1 ? 'В игру' : 'Далее'; next.focus({ preventScroll: true }); }
}
function tutoPosition() {
  if (!tutoEl) return;
  const st = TUTO_STEPS[tutoIdx];
  const el = st.target ? document.querySelector(st.target) : null;
  const spot = $('tutoSpot'), card = $('tutoCard');
  const r = el ? el.getBoundingClientRect() : { left: innerWidth * .2, top: innerHeight * .25, width: innerWidth * .6, height: innerHeight * .35, bottom: innerHeight * .6, right: innerWidth * .8 };
  const pad = 8;
  spot.style.left = `${Math.max(4, r.left - pad)}px`;
  spot.style.top = `${Math.max(4, r.top - pad)}px`;
  spot.style.width = `${Math.max(40, r.width + pad * 2)}px`;
  spot.style.height = `${Math.max(40, r.height + pad * 2)}px`;
  if (innerWidth >= 760) {
    card.style.width = '360px';
    if (st.target === '#battle' || st.target === '#tabs') {
      card.style.left = '24px'; card.style.right = 'auto';
      card.style.top = 'auto'; card.style.bottom = '104px';
    } else {
      card.style.left = `${Math.min(innerWidth - 376, Math.max(16, r.left))}px`;
      let top = r.bottom + 16;
      if (top + 230 > innerHeight) top = Math.max(16, r.top - 230);
      card.style.top = `${top}px`;
      card.style.bottom = 'auto';
      card.style.right = 'auto';
    }
  } else {
    card.style.width = ''; card.style.left = '12px'; card.style.right = '12px';
    card.style.top = 'auto'; card.style.bottom = '92px';
  }
}
function tutoNext() { if (tutoIdx >= TUTO_STEPS.length - 1) tutoFinish(false); else tutoShow(tutoIdx + 1); }
function tutoFinish(skipped) {
  if (!tutoEl) return;
  S.tutorial = { done: true, step: 0 };
  tutoEl.remove(); tutoEl = null;
  saveLocal(); updateSideButtons();
  setTab('hero'); R.heroSeg = 'growth'; renderPanel();
  toast(skipped ? 'Обучение пропущено' : 'Обучение завершено');
}

/* --- 90_boot.js --- */
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
    case 'tutorial': closeModal(); startTutorial(true); break;
    case 'tip-go': {
      const tip = b.dataset.tip;
      if (tip === 'tutorial') startTutorial(true);
      else if (tip === 'skills') { setTab('hero'); R.heroSeg = 'skills'; renderPanel(); }
      else if (tip === 'enchant') { setTab('gear'); const it = S.items.find(i => isEquipped(i) && canEnchant(i)); if (it) openEnchant(it.id); }
      else if (tip === 'quests') openQuests();
      else if (tip === 'boss') { if (S.kills >= B.STAGE_KILLS && !R.boss) startBoss(); }
      else { setTab('hero'); R.heroSeg = 'growth'; renderPanel(); }
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
      S.quests.claimed[d.id] = true; passXp(B.QUEST_XP); grant({ gems: d.gems, scrollsA: d.scrollsA, crystalsK: d.crystalsK, petals: d.petals }); openQuests(); break;
    }
    case 'qchest': if (!S.quests.chest && B.DAILY.every(d => S.quests.claimed[d.id])) { S.quests.chest = true; passXp(B.DAILY_CHEST.xp); grant({ gems: B.DAILY_CHEST.gems }); openQuests(); } break;
    case 'wclaim': {
      const w = B.WEEKLY.find(x => x.id === b.dataset.id);
      if (!w || S.weekly.claimed[w.id] || (S.weekly.prog[w.id] || 0) < w.goal) break;
      S.weekly.claimed[w.id] = true; grant(w.rw); openQuests('week'); break;
    }
    case 'wchest': if (!S.weekly.chest && B.WEEKLY.every(w => S.weekly.claimed[w.id])) { S.weekly.chest = true; grant(B.WEEKLY_CHEST); openQuests('week'); } break;
    case 'wclaim-all': {
      const got = [];
      for (const w of B.WEEKLY) {
        if (S.weekly.claimed[w.id] || (S.weekly.prog[w.id] || 0) < w.goal) continue;
        S.weekly.claimed[w.id] = true; grant(w.rw); got.push(rewardText(w.rw));
      }
      if (got.length) { toast('Неделя: ' + got.join(', ')); openQuests('week'); }
      break;
    }
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
  updateHudStatic(); updateHud(); renderPanel(); updateSideButtons(); updateNav(); updateMusic();
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
  if (S.hero && S.tutorial && !S.tutorial.done) setTimeout(() => startTutorial(), 1000);
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
    expoStart, expoClaim, expoSpeed, renderExpo, offline, updateSideButtons, updateHudStatic,
    startTutorial, updateNav, nextTip, migrate,
  };
}

})();