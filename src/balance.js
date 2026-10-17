/* ===== Баланс: грейды, предметы, монстры, рост ===== */
const BAL = (() => {
  const GRADES = [
    { id: 'NG', label: 'Без грейда', short: 'NG', lvl: 1,  color: '#cfc5b0' },
    { id: 'D',  label: 'Грейд D',    short: 'D',  lvl: 8,  color: '#7fe07c' },
    { id: 'C',  label: 'Грейд C',    short: 'C',  lvl: 20, color: '#5cbcff' },
    { id: 'B',  label: 'Грейд B',    short: 'B',  lvl: 32, color: '#bd8aff' },
    { id: 'A',  label: 'Грейд A',    short: 'A',  lvl: 44, color: '#ff9156' },
    { id: 'S',  label: 'Грейд S',    short: 'S',  lvl: 56, color: '#ffd760' },
    { id: 'R',  label: 'Грейд R',    short: 'R',  lvl: 66, color: '#ff5fd2' },
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

  /* Заточка в духе Lineage 2: до +3 безопасно, дальше риск разрушения */
  const SAFE = 3, MAX_ENCH = 16;
  const CHANCE = { 4: .70, 5: .66, 6: .62, 7: .58, 8: .54, 9: .50, 10: .46, 11: .42, 12: .38, 13: .34, 14: .30, 15: .26, 16: .22 };
  const enchChance = target => target <= SAFE ? 1 : (CHANCE[target] ?? .2);
  const enchMult = e => 1 + .1 * Math.min(e, SAFE) + .2 * Math.max(0, e - SAFE);

  function itemStats(slot, g, e = 0) {
    const m = GM[g], em = enchMult(e), r = {};
    switch (slot) {
      case 'weapon': r.atk = 6 * m * em; break;
      case 'helmet': r.def = 2 * m * em; r.hp = 14 * m * em; break;
      case 'upper':  r.def = 5 * m * em; r.hp = 30 * m * em; break;
      case 'lower':  r.def = 3.5 * m * em; r.hp = 20 * m * em; break;
      case 'gloves': r.def = 1.5 * m * em; r.atkPct = [.03, .05, .07, .09, .12, .15, .18][g] * em; break;
      case 'boots':  r.def = 1.5 * m * em; r.hp = 12 * m * em; break;
      case 'neck':   r.hpPct = [.04, .06, .09, .12, .16, .2, .25][g] * em; r.regenPct = [.002, .003, .004, .005, .006, .008, .01][g] * em; break;
      case 'ear':    r.crit = [.01, .015, .02, .03, .04, .05, .06][g] * (1 + (em - 1) * .5); break;
      case 'ring':   r.critDmg = [.08, .12, .2, .3, .4, .55, .7][g] * em; break;
    }
    return r;
  }
  const price = (slot, g) => Math.round(GP[g] * SLOT[slot].pf);
  const sellPrice = (slot, g) => Math.floor(price(slot, g) * .2);
  const CRY = [2, 20, 60, 160, 420, 1100, 2800];
  const crystalYield = (slot, g, e = 0) => Math.round(CRY[g] * (slot === 'weapon' ? 2 : 1) * (1 + .15 * e));
  // стоимость свитков в кристаллах (NG свитков нет)
  const SCROLL_COST = {
    weapon: [0, 70, 210, 560, 1500, 3900, 9800],
    armor:  [0, 22, 66, 180, 470, 1200, 3000],
  };
  const BLESS_MULT = 7;

  /* Монстры по глобальному индексу этапа s */
  // после 62-го этапа рост монстров мягче: бесконечный режим держится на заточке и росте
  const curve = (s, a, b) => s <= 62 ? Math.pow(a, s) : Math.pow(a, 62) * Math.pow(b, s - 62);
  const mHp   = s => 20 * curve(s, 1.185, 1.075);
  const mAtk  = s => 2.5 * curve(s, 1.16, 1.065);
  const mGold = s => 2.2 * curve(s, 1.172, 1.085);
  const mXp   = s => 3 * curve(s, 1.13, 1.06);
  const defK  = s => 12 * curve(s, 1.17, 1.07);
  const BOSS = { hp: 15, atk: 2.2, gold: 10, xp: 8, time: 30 };

  /* Рост за золото */
  const GROWTH = [
    { id: 'atk',     name: 'Атака',            val: l => 3 * l * Math.pow(1.02, l),    cost: l => 6 * Math.pow(1.08, l),   max: 3000, fmt: 'int' },
    { id: 'hp',      name: 'Здоровье',         val: l => 24 * l * Math.pow(1.02, l),   cost: l => 6 * Math.pow(1.08, l),   max: 3000, fmt: 'int' },
    { id: 'regen',   name: 'Восстановление',   val: l => .8 * l * Math.pow(1.02, l),   cost: l => 9 * Math.pow(1.085, l),  max: 3000, fmt: 'regen' },
    { id: 'crit',    name: 'Шанс крита',       val: l => .002 * l,                     cost: l => 25 * Math.pow(1.11, l),  max: 150,  fmt: 'pct' },
    { id: 'critDmg', name: 'Урон крита',       val: l => .02 * l,                      cost: l => 30 * Math.pow(1.1, l),   max: 300,  fmt: 'pct' },
    { id: 'aspd',    name: 'Скорость атаки',   val: l => .01 * l,                      cost: l => 60 * Math.pow(1.13, l),  max: 100,  fmt: 'pct' },
  ];
  const GROWTH_BY = Object.fromEntries(GROWTH.map(g => [g.id, g]));

  const xpNeed = L => Math.round(10 * Math.pow(1.14, L - 1));
  const BASE = { atk: 8, hp: 100, crit: .05, critDmg: 1.5, aspd: 1, regen: 1 };

  /* Итоговые характеристики героя. gear: [{slot,g,e}] */
  function heroStats(level, growth, gear, extra = {}) {
    const gv = id => GROWTH_BY[id].val(growth[id] || 0);
    let atkFlat = BASE.atk + gv('atk'), hpFlat = BASE.hp + gv('hp'), def = 0;
    let atkPct = extra.atkPct || 0, hpPct = extra.hpPct || 0;
    let crit = BASE.crit + gv('crit') + (extra.crit || 0), critDmg = BASE.critDmg + gv('critDmg') + (extra.critDmg || 0);
    let regenFlat = BASE.regen + gv('regen'), regenPct = 0;
    const bySlot = {};
    for (const it of gear) {
      bySlot[it.slot] = it;
      const st = itemStats(it.slot, it.g, it.e);
      atkFlat += st.atk || 0; hpFlat += st.hp || 0; def += st.def || 0;
      atkPct += st.atkPct || 0; hpPct += st.hpPct || 0; crit += st.crit || 0;
      critDmg += st.critDmg || 0; regenPct += st.regenPct || 0;
    }
    const set = armorSet(bySlot);
    if (set) { hpPct += .15; def *= 1.1; }
    if (set && set.glow) atkPct += .1;
    const lvA = 1 + .04 * (level - 1), lvH = 1 + .04 * (level - 1);
    const atk = atkFlat * lvA * (1 + atkPct) * (1 + (extra.atkBuff || 0));
    const hp = hpFlat * lvH * (1 + hpPct);
    return {
      atk, hp, def,
      crit: Math.min(.8, crit), critDmg,
      aspd: BASE.aspd + gv('aspd'),
      regen: regenFlat * lvH + hp * regenPct,
      set,
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
    cost1: 150, cost10: 1350,
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
  const ARENA = { start: 1000, K: 32, tickets: 5, refillCost: 60, refillMax: 3, winGems: 20, loseGems: 5, hpMul: 1.6 };
  const eloExpect = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
  const eloDelta = (a, b, win) => Math.round(ARENA.K * ((win ? 1 : 0) - eloExpect(a, b)));
  // урон в PvP: защита режет до 60%
  const pvpHit = (atk, def) => atk * (1 - Math.min(.6, def / (def + 4 * atk)));
  const BOT_NAMES = ['Акира', 'Юкино', 'Харуто', 'Мио', 'Рин', 'Кайто', 'Сора', 'Хината', 'Рэйдзи', 'Аой', 'Кэнта', 'Нацуми', 'Сюн', 'Мэй', 'Такуми', 'Кохару', 'Рэн', 'Сакура', 'Даити', 'Юи', 'Итиро', 'Хонока', 'Ямато', 'Кирара'];

  /* ===== Задания, достижения, вход, пропуск ===== */
  const DAILY = [
    { id: 'kills',   name: 'Победить 150 монстров',      goal: 150, gems: 50 },
    { id: 'bosses',  name: 'Победить 3 боссов',           goal: 3,   gems: 60 },
    { id: 'enchant', name: 'Заточить снаряжение 3 раза',  goal: 3,   gems: 50, scrollsA: 2 },
    { id: 'growth',  name: 'Улучшить рост 20 раз',        goal: 20,  gems: 40 },
    { id: 'arena',   name: 'Провести 3 боя на арене',     goal: 3,   gems: 60 },
    { id: 'summon',  name: 'Призвать питомца',            goal: 1,   gems: 40 },
    { id: 'ad',      name: 'Получить бонус за рекламу',   goal: 1,   gems: 50 },
  ];
  const DAILY_CHEST = { gems: 150, xp: 200 };
  const QUEST_XP = 120;
  const ACH = [
    { id: 'stage',  stat: 'maxStage', name: v => `Дойти до этапа ${Math.floor(v / 10) + 1}-${v % 10 + 1}`, tiers: [10, 20, 30, 40, 50, 60, 80, 100, 150], gems: [50, 80, 100, 150, 200, 250, 300, 400, 500] },
    { id: 'level',  stat: 'level',    name: v => `Достичь ${v} уровня`, tiers: [10, 20, 30, 40, 50, 60, 70, 90], gems: [40, 60, 80, 100, 150, 200, 300, 400] },
    { id: 'kills',  stat: 'kills',    name: v => `Победить ${v.toLocaleString('ru-RU')} монстров`, tiers: [500, 2000, 10000, 50000, 200000], gems: [40, 80, 150, 250, 400] },
    { id: 'ench',   stat: 'best',     name: v => `Заточить вещь до +${v}`, tiers: [4, 7, 10, 13, 16], gems: [30, 80, 150, 300, 600] },
    { id: 'summon', stat: 'summons',  name: v => `Призвать питомцев ${v} раз`, tiers: [10, 50, 150, 400], gems: [50, 120, 250, 500] },
    { id: 'arena',  stat: 'arenaWins', name: v => `Победить на арене ${v} раз`, tiers: [5, 25, 100, 300], gems: [50, 120, 250, 500] },
    { id: 'pets',   stat: 'petsOwned', name: v => `Собрать ${v} разных питомцев`, tiers: [3, 6, 10, 14], gems: [60, 150, 300, 600] },
  ];
  const LOGIN = [
    { gems: 50 }, { goldKills: 250 }, { scrollsA: 3 }, { gems: 100 }, { blessedA: 1 }, { summon: 1 }, { gems: 300 },
  ];
  const PASS = { tiers: 30, xpPer: 1000, seasonDays: 28, epoch: Date.UTC(2026, 9, 1), bossXp: 15, arenaXp: 30 };
  function passReward(tier, prem) {          // tier: 1..30
    if (prem) {
      if (tier === 30) return { pet: 'tenryu', cosmetic: 'petals' };
      if (tier % 10 === 0) return { summon: 3 };
      if (tier % 5 === 0) return { blessedA: 2, blessedW: 1 };
      return tier % 2 ? { gems: 60 } : { scrollsA: 3, scrollsW: 1 };
    }
    if (tier % 10 === 0) return { summon: 1 };
    if (tier % 5 === 0) return { gems: 100 };
    return [{ goldKills: 150 }, { scrollsA: 2 }, { crystalsK: 1 }, { scrollsW: 1 }][tier % 4];
  }
  const seasonOf = now => Math.floor((now - PASS.epoch) / (PASS.seasonDays * 864e5));
  const seasonEnd = season => PASS.epoch + (season + 1) * PASS.seasonDays * 864e5;

  /* ===== Магазин: покупки и самоцветы ===== */
  const IAP = [
    { id: 'starter', name: 'Стартовый набор', rub: 149, once: true, gems: 1000, pet: 'hibana', scrollsA: 10, blessedA: 2, tag: 'Один раз' },
    { id: 'monthly', name: 'Лунная карта',    rub: 199, gems: 300, daily: 100, days: 30, tag: '100 💎 каждый день' },
    { id: 'pass',    name: 'Пропуск сакуры',  rub: 399, tag: 'Сезон' },
    { id: 'noads',   name: 'Без рекламы',     rub: 299, once: true, tag: 'Навсегда' },
    { id: 'gems_s',  name: 'Горсть самоцветов',  rub: 79,   gems: 300 },
    { id: 'gems_m',  name: 'Мешочек самоцветов', rub: 249,  gems: 1100, bonus: 100 },
    { id: 'gems_l',  name: 'Сундук самоцветов',  rub: 649,  gems: 3200, bonus: 400 },
    { id: 'gems_xl', name: 'Сокровищница',       rub: 1490, gems: 8000, bonus: 1500 },
  ];
  const IAP_BY = Object.fromEntries(IAP.map(p => [p.id, p]));
  const GEM_SHOP = {
    gold: { gems: 100, kills: 400 },
    scrollsA5: { gems: 100 },
    blessedA: { gems: 150 },
    blessedW: { gems: 380 },
  };
  const ADS = { gems: 40, gemsPerDay: 3, goldBoostMin: 20, interstitialGap: 180 };

  return {
    RAR, PET_BONUS, PETS, PET, PET_ATK, PET_DUPES, PET_MAX_STARS, starMult, petValue, COLLECTION_SHARE, GACHA, rollRarity, petBonuses,
    LEAGUES, league, ARENA, eloExpect, eloDelta, pvpHit, BOT_NAMES,
    DAILY, DAILY_CHEST, QUEST_XP, ACH, LOGIN, PASS, passReward, seasonOf, seasonEnd,
    IAP, IAP_BY, GEM_SHOP, ADS,
    GRADES, GM, GP, SLOTS, SLOT, ARMOR_SET, NAMES, SAFE, MAX_ENCH, enchChance, enchMult,
    itemStats, price, sellPrice, crystalYield, SCROLL_COST, BLESS_MULT,
    mHp, mAtk, mGold, mXp, defK, BOSS, GROWTH, GROWTH_BY, xpNeed, BASE, heroStats, armorSet, power,
    zoneDropGrade, DROP,
  };
})();
if (typeof module !== 'undefined') module.exports = BAL;
