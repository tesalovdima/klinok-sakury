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
const SAVE_VERSION = 6;
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
    items: [{ id: 1, slot: 'weapon', g: 0, e: 0, pt: 0, opts: starterOpts(0) }, { id: 2, slot: 'upper', g: 0, e: 0, pt: 0, opts: starterOpts(0) }],
    equip, nextId: 3,
    scrolls: { w: [0, 2, 0, 0, 0, 0, 0], a: [0, 3, 0, 0, 0, 0, 0], bw: zeros(), ba: zeros() },
    stage: 0, maxStage: 0, bestStage: 0, kills: 0, autoBoss: true,
    stats: { kills: 0, bosses: 0, breaks: 0, enchants: 0, best: 0, summons: 0, arenaWins: 0, arenaFights: 0, dungeonRuns: 0, awakenings: 0, rerolls: 0 },
    pets: { owned: {}, active: null },
    gacha: { pity: 0, total: 0, tickets: 1, first10: false },
    arena: { rating: B.ARENA.start, day: '', tickets: B.ARENA.tickets, buys: 0, wins: 0, losses: 0, rewardDay: '', seed: 1, fights: 0, season: -1, history: [] },
    quests: { day: '', prog: {}, claimed: {}, chest: false },
    ach: {},
    login: { idx: 0, last: '' },
    pass: { season: -1, xp: 0, free: [], prem: [], premium: false },
    shop: { noAds: false, starter: false, monthlyUntil: 0, monthlyDay: '', cosmetic: null, cosmetics: [], firstTopup: false, starterSeen: false },
    boost: { goldUntil: 0 },
    ads: { day: '', gems: 0, freeSummon: false, boosts: 0 },
    settings: { music: .55, sfx: .75, autoBuyBreak: true, autoEnchantTo: 7 },
    intro: false,
    aw: { petals: 0, count: 0, lvl: Object.fromEntries(B.AW_NODES.map(n => [n.id, 0])) },
    tower: { floor: 0, best: 0, week: '', reward: 0, auto: false },
    dungeon: { day: '', keys: B.DKEYS.perDay, ads: 0, buys: 0, runs: 0, stage: 0 },
    fund: { owned: false, claimed: [] },
    chapter: { idx: 0, claimed: [] },
    event: { season: -1, coins: 0, total: 0, claimed: [], bought: {}, day: '', today: 0 },
    codex: { 'weapon:0': 1, 'upper:0': 1 },
  };
}
function migrate(o) {
  if (!o || typeof o !== 'object') return newState();
  if ((o.v || 1) < 3) return newState();          // совсем старые сохранения несовместимы
  const d = newState();
  fillDefaults(o, d);
  o.v = SAVE_VERSION;
  for (const k of ['w', 'a', 'bw', 'ba']) {
    o.scrolls[k] = Array.isArray(o.scrolls[k]) ? o.scrolls[k] : zeros();
    while (o.scrolls[k].length < NG) o.scrolls[k].push(0);
    o.scrolls[k] = o.scrolls[k].slice(0, NG).map(n => Math.max(0, Math.floor(n) || 0));
  }
  for (const g of B.GROWTH) o.growth[g.id] = o.growth[g.id] || 0;
  for (const s of SKILLS) o.skills[s.id] = o.skills[s.id] || 0;
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
  mp: 100, mpMax: 100, mpInit: false, hitStop: 0, heroOff: 0, cut: null, zoom: 0, dodge: .05, dodgeCount: 0, castLog: [],
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
