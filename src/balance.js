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
if (typeof module !== 'undefined') module.exports = BAL;
