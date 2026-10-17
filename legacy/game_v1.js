/* ===== Клинок Сакуры: движок и интерфейс ===== */
(() => {
  'use strict';
  const B = BAL, A = ART;
  const $ = id => document.getElementById(id);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = Math.random;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NG = B.GRADES.length;

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
  function dur(sec) { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h} ч ${m} мин` : `${Math.max(1, m)} мин`; }

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
  const TYPE_SCALE = { slime: 1.15, mushroom: 1, bat: 1, goblin: 1, golem: 1.05, ghost: 1, imp: 1, skull: 1, wisp: 1, crystal: 1 };
  function zoneOf(s) {
    const z = Math.floor(s / 10), base = ZONES[z % ZONES.length], loop = Math.floor(z / ZONES.length);
    return { ...base, z, loop, title: base.name + (loop ? ` · круг ${loop + 1}` : ''), num: `${z + 1}-${(s % 10) + 1}` };
  }
  const dropGradeTop = z => [1, 2, 3, 4, 5, 6][Math.min(z, 5)];

  /* ---------- навыки ---------- */
  const SKILLS = [
    { id: 'petal', name: 'Вихрь лепестков', unlock: 3, cd: 8, icon: 'sk_petal', mult: l => 1.5 + .12 * (l - 1),
      desc: l => `Бьёт всех врагов рядом на ${pct(1.5 + .12 * (l - 1))} атаки.` },
    { id: 'moon', name: 'Лунный разрез', unlock: 10, cd: 12, icon: 'sk_moon', mult: l => 3 + .25 * (l - 1),
      desc: l => `Один мощный разрез на ${pct(3 + .25 * (l - 1))} атаки.` },
    { id: 'spirit', name: 'Боевой дух', unlock: 18, cd: 24, icon: 'sk_spirit', mult: l => .25 + .03 * (l - 1),
      desc: l => `Атака +${pct(.25 + .03 * (l - 1))} на 8 секунд.` },
    { id: 'thunder', name: 'Небесный гром', unlock: 28, cd: 15, icon: 'sk_thunder', mult: l => 1 + .08 * (l - 1),
      desc: l => `Три молнии по ${pct(1 + .08 * (l - 1))} атаки каждая.` },
    { id: 'bloom', name: 'Цветение', unlock: 40, cd: 20, icon: 'sk_bloom', mult: l => .25 + .02 * (l - 1),
      desc: l => `Лечит ${pct(.25 + .02 * (l - 1))} здоровья и снижает урон на 30% на 5 секунд, когда здоровья меньше половины.` },
  ];
  const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
  const SKILL_MAX = 20;

  /* ---------- состояние ---------- */
  const SAVE_KEY = 'klinok-sakury-v1';
  const zeros = () => Array(NG).fill(0);
  function newState() {
    const equip = {}; B.SLOTS.forEach(s => equip[s.id] = null);
    equip.weapon = 1; equip.upper = 2;
    return {
      v: 1, savedAt: Date.now(), gold: 20, crystals: 0, level: 1, xp: 0, sp: 0,
      growth: Object.fromEntries(B.GROWTH.map(g => [g.id, 0])),
      skills: Object.fromEntries(SKILLS.map(s => [s.id, 0])),
      items: [{ id: 1, slot: 'weapon', g: 0, e: 0 }, { id: 2, slot: 'upper', g: 0, e: 0 }],
      equip, nextId: 3,
      scrolls: { w: zeros(), a: zeros(), bw: zeros(), ba: zeros() },
      stage: 0, maxStage: 0, kills: 0, autoBoss: true,
      stats: { kills: 0, bosses: 0, breaks: 0, enchants: 0, best: 0 },
      sound: true, intro: false,
    };
  }
  function migrate(o) {
    const d = newState();
    for (const k in d) if (o[k] === undefined) o[k] = d[k];
    for (const k of ['w', 'a', 'bw', 'ba']) { o.scrolls[k] = o.scrolls[k] || zeros(); while (o.scrolls[k].length < NG) o.scrolls[k].push(0); }
    for (const g of B.GROWTH) o.growth[g.id] = o.growth[g.id] || 0;
    for (const s of SKILLS) o.skills[s.id] = o.skills[s.id] || 0;
    for (const sl of B.SLOTS) if (!(sl.id in o.equip)) o.equip[sl.id] = null;
    for (const k in d.stats) if (o.stats[k] === undefined) o.stats[k] = 0;
    return o;
  }
  let S = null;
  function loadLocal() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { } return null; }
  function saveLocal() { S.savedAt = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }

  const Cloud = {
    db: null, uid: null, lastSent: '', busy: false,
    async init() {
      try {
        if (!window.claude || typeof window.claude.use !== 'function') return;
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return;
        const uid = await user.id();
        if (!uid) return;
        this.db = db; this.uid = uid;
        const snap = await this.ref().get();
        if (snap.exists) {
          const d = snap.data();
          if (d && typeof d.save === 'string' && (!R.hadLocal || (d.savedAt || 0) > (S.savedAt || 0) + 3000)) {
            applyState(migrate(JSON.parse(d.save)));
            toast('Загружено сохранение из облака');
            if (!modal.hidden) closeModal();
            offline();
          }
        }
      } catch (e) { this.db = null; }
    },
    ref() { return this.db.doc('data/users/' + this.uid + '/save'); },
    async push() {
      if (!this.db || this.busy) return;
      const body = JSON.stringify(S);
      if (body === this.lastSent) return;
      this.busy = true;
      try { await this.ref().set({ save: body, savedAt: S.savedAt, stage: S.maxStage, level: S.level }); this.lastSent = body; }
      catch (e) { if (e && ['invalid_argument', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed'].includes(e.code)) this.db = null; }
      this.busy = false;
    },
  };

  /* ---------- предметы ---------- */
  const itemById = id => S.items.find(i => i.id === id);
  const isEquipped = it => S.equip[it.slot] === it.id;
  const itemName = it => (it.e > 0 ? `+${it.e} ` : '') + B.NAMES[it.slot][it.g];
  const scrollKind = slot => slot === 'weapon' ? 'w' : 'a';
  const STAT_LABEL = { atk: 'Атака', def: 'Защита', hp: 'Здоровье', atkPct: 'Атака', hpPct: 'Здоровье', regenPct: 'Восстановление', crit: 'Шанс крита', critDmg: 'Урон крита' };
  const statStr = (k, v) => ['atkPct', 'hpPct', 'crit', 'critDmg'].includes(k) ? '+' + pct(v) : k === 'regenPct' ? pct(v) + '/с' : fmt(v);
  function itemScore(slot, g, e) {
    const s = B.itemStats(slot, g, e);
    return (s.atk || 0) * 3 + (s.def || 0) * 4 + (s.hp || 0) * .3 + (s.atkPct || 0) * 1e4 + (s.hpPct || 0) * 1e4 + (s.crit || 0) * 3e4 + (s.critDmg || 0) * 1e4;
  }
  function glowClass(e) { return e >= 16 ? 'glow16' : e >= 13 ? 'glow13' : e >= 10 ? 'glow10' : e >= 7 ? 'glow7' : e >= 4 ? 'glow4' : ''; }
  function tileHTML(it, attrs = '') {
    return `<button class="tile g${it.g} ${glowClass(it.e)}" ${attrs} aria-label="${itemName(it)}"><img src="${A.itemIcon(it.slot, it.g)}" alt=""><span class="gr">${B.GRADES[it.g].short}</span>${it.e ? `<span class="ench">+${it.e}</span>` : ''}</button>`;
  }

  /* ---------- рантайм ---------- */
  const battle = $('battle'), canvas = $('scene'), ctx = canvas.getContext('2d');
  const R = {
    W: 400, H: 300, dpr: 1, k: 1, gy: 240, heroX: 100, scroll: 0, t: 0,
    monsters: [], fx: [], amb: [], shake: 0, flash: 0, flashC: '#fff',
    hero: { hp: 100, atkT: 0, swing: -1, hit: false, hurt: 0, dead: 0, cast: 0, phase: 0, run: 0 },
    boss: null, cd: {}, castLock: 0, buffs: { spirit: 0, guard: 0 },
    st: null, look: null, goldPos: { x: 300, y: 20 }, bagPos: { x: 120, y: 400 },
    imgs: new Map(), tab: 'hero', mult: 1, shopTab: 'gear', shopGrade: 0, scrollGrade: 1, dirtyBank: false,
  };
  SKILLS.forEach(s => R.cd[s.id] = 0);

  function img(url) { let i = R.imgs.get(url); if (!i) { i = new Image(); i.src = url; R.imgs.set(url, i); } return i; }

  function resize() {
    const r = battle.getBoundingClientRect();
    R.W = Math.max(200, r.width); R.H = Math.max(200, r.height);
    R.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(R.W * R.dpr); canvas.height = Math.round(R.H * R.dpr);
    R.k = Math.min(R.H / 330, R.W / 380); R.gy = R.H * .77;
    R.heroX = Math.max(78 * R.k, R.W * .23);
    const gr = $('icGold').getBoundingClientRect();
    R.goldPos = { x: gr.left - r.left + gr.width / 2, y: gr.top - r.top + gr.height / 2 };
    const tb = document.querySelector('[data-tab="gear"]').getBoundingClientRect();
    R.bagPos = { x: tb.left - r.left + tb.width / 2, y: R.H + 30 };
  }

  /* ---------- характеристики ---------- */
  function equippedList() {
    const out = [];
    for (const sl of B.SLOTS) { const id = S.equip[sl.id]; const it = id && itemById(id); if (it) out.push({ slot: it.slot, g: it.g, e: it.e }); }
    return out;
  }
  function recalc() {
    const prevMax = R.st ? R.st.hp : 0;
    R.st = B.heroStats(S.level, S.growth, equippedList());
    R.power = B.power(R.st);
    const h = R.hero;
    if (prevMax && R.st.hp > prevMax && !h.dead) h.hp += R.st.hp - prevMax;
    h.hp = clamp(h.hp, 0, R.st.hp);
    const g = slot => { const id = S.equip[slot]; const it = id && itemById(id); return it ? it.g : -1; };
    const wid = S.equip.weapon, w = wid && itemById(wid);
    R.look = {
      weapon: w ? { g: w.g, e: w.e } : null,
      helmet: g('helmet'), upper: g('upper'), lower: g('lower'), gloves: g('gloves'), boots: g('boots'),
      aura: R.st.set && R.st.set.glow ? R.st.set.g : -1,
    };
  }
  const red = s => R.st.def / (R.st.def + B.defK(s));
  const spiritBonus = () => R.buffs.spirit > 0 ? SK.spirit.mult(S.skills.spirit) : 0;

  /* ---------- монстры и этапы ---------- */
  function makeMonster(boss, x) {
    const s = S.stage, z = zoneOf(s);
    let type, pal, name = '';
    if (boss) [type, pal, name] = z.boss;
    else [type, pal] = z.mons[Math.floor(rnd() * z.mons.length)];
    const hp = B.mHp(s) * (boss ? B.BOSS.hp : (.92 + rnd() * .16));
    return {
      type, pal, name, boss, x, hp, maxHp: hp,
      dmg: B.mAtk(s) * (boss ? B.BOSS.atk : 1),
      t: rnd() * 10, atkT: rnd() * .6, atk: 0, pend: 0, flash: 0, dieT: 0,
      scale: (boss ? 1.9 : 1) * TYPE_SCALE[type],
    };
  }
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
    R.monsters = [];
  }
  function startBoss() {
    if (R.boss || R.hero.dead) return;
    clearMonsters(true);
    const m = makeMonster(true, R.W + 50 * R.k);
    R.monsters.push(m);
    R.boss = { m, time: B.BOSS.time };
    banner('Босс', m.name, '#ff6b8a');
    log(`Появился босс: ${m.name}. У вас ${B.BOSS.time} секунд.`, 'boss');
    Sound.play('boss');
    updateHudStatic();
  }
  function bossWin() {
    const z0 = zoneOf(S.stage).z;
    S.stats.bosses++;
    S.stage++;
    if (S.stage > S.maxStage) S.maxStage = S.stage;
    S.kills = 0;
    R.boss = null;
    const z = zoneOf(S.stage);
    if (z.z !== z0) {
      banner(z.title, 'Новая зона', z.ui);
      log(`Вы вошли в зону «${z.title}». Здесь выпадают свитки грейда ${B.GRADES[dropGradeTop(z.z)].short}.`, 'good');
    } else banner('Этап пройден', z.num, '#ffd760');
    Sound.play('level');
    updateHudStatic();
    if (R.tab === 'map') renderPanel();
  }
  function bossFail(why) {
    if (!R.boss) return;
    const m = R.boss.m;
    if (m.hp > 0) puff(m.x, R.gy - 40 * R.k, '#ff6b8a', 16);
    R.monsters = R.monsters.filter(x => x !== m);
    R.boss = null;
    S.autoBoss = false;
    banner('Босс устоял', why === 'time' ? 'Время вышло' : 'Героиня пала', '#ff5d73');
    log('Босс не побеждён. Усильте героиню и вызовите его снова.', 'bad');
    updateHudStatic();
  }

  /* ---------- бой ---------- */
  function heroStrike() {
    const tgt = frontMonster();
    if (!tgt) return;
    const crit = rnd() < R.st.crit;
    const dmg = R.st.atk * (1 + spiritBonus()) * (crit ? R.st.critDmg : 1) * (.94 + rnd() * .12);
    const sx = tgt.x - 6 * R.k, sy = R.gy - 34 * R.k * tgt.scale;
    R.fx.push({ type: 'slash', x: sx, y: sy, r: 34 * R.k * Math.max(1, tgt.scale * .8), a: -.9 + rnd() * .3, life: .2, t: 0, c: crit ? '#ffd760' : '#ffffff', w: crit ? 7 : 5 });
    hitDamage(tgt, dmg, crit);
    Sound.play(crit ? 'crit' : 'hit');
    if (crit && !RM) R.shake = Math.max(R.shake, .12);
  }
  function frontMonster() {
    let best = null;
    for (const m of R.monsters) if (m.hp > 0 && (!best || m.x < best.x)) best = m;
    return best;
  }
  function hitDamage(m, dmg, crit, color) {
    if (m.hp <= 0) return;
    m.hp -= dmg; m.flash = .1;
    const top = A.monTop(m.type) * m.scale * R.k;
    R.fx.push({ type: 'num', x: m.x + (rnd() - .5) * 18 * R.k, y: R.gy - top - 4 * R.k, vy: -46 * R.k, t: 0, life: .9, text: fmt(dmg) + (crit ? '!' : ''), c: color || (crit ? '#ffcf4a' : '#ffffff'), size: (crit ? 22 : 15) * Math.sqrt(R.k), crit });
    for (let i = 0; i < (crit ? 7 : 4); i++) R.fx.push({ type: 'part', x: m.x - 4 * R.k, y: R.gy - top * .5, vx: (rnd() * 120 + 40) * R.k, vy: (rnd() - .7) * 160 * R.k, g: 300 * R.k, size: (2 + rnd() * 2.5) * R.k, c: crit ? '#ffe28a' : '#ffffff', t: 0, life: .35 + rnd() * .2, shape: 'star' });
    if (m.hp <= 0) killMonster(m);
  }
  function killMonster(m) {
    m.hp = 0; m.dieT = .001;
    const s = S.stage, z = zoneOf(s);
    const mult = m.boss ? B.BOSS.gold : 1;
    const gold = B.mGold(s) * mult * (.9 + rnd() * .2);
    const xp = B.mXp(s) * (m.boss ? B.BOSS.xp : 1);
    S.gold += gold; S.stats.kills++;
    gainXp(xp);
    const y = R.gy - A.monTop(m.type) * m.scale * R.k * .5;
    const coins = m.boss ? 14 : 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < coins; i++) R.fx.push({ type: 'coin', x: m.x, y, vx: (rnd() - .4) * 120 * R.k, vy: -(120 + rnd() * 140) * R.k, t: 0, life: 1.6 + rnd() * .3, by: R.gy - 4 * R.k });
    puff(m.x, y, m.pal.b || '#ffffff', m.boss ? 22 : 9);
    rollDrops(m, z, y);
    Sound.play('coin');
    if (m.boss) { bossWin(); return; }
    if (S.kills < 10) S.kills++;
    updateHudStatic();
  }
  function rollDrops(m, z, y) {
    const D = B.DROP;
    const give = (kind, blessed) => {
      const g = B.zoneDropGrade(z.z, rnd);
      const key = (blessed ? 'b' : '') + kind;
      S.scrolls[key][g]++;
      R.fx.push({ type: 'drop', x: m.x, y, vy: -150 * R.k, t: 0, life: 1.7, img: img(A.scrollIcon(kind === 'w' ? 'weapon' : 'armor', g, blessed)) });
      const nm = `${blessed ? 'Благословенный свиток' : 'Свиток'}: улучшить ${kind === 'w' ? 'оружие' : 'доспех'} (${B.GRADES[g].short})`;
      log(`Вы получили: ${nm}`, blessed ? 'good' : 'drop');
      R.dirtyBank = true;
    };
    if (m.boss) {
      give(rnd() < .6 ? 'a' : 'w', false);
      if (rnd() < .5) give('a', false);
      if (rnd() < D.bossBlessed) give(rnd() < .6 ? 'a' : 'w', true);
    } else {
      if (rnd() < D.armorScroll) give('a', false);
      if (rnd() < D.weaponScroll) give('w', false);
      if (rnd() < D.blessed) give(rnd() < .6 ? 'a' : 'w', true);
    }
    if (rnd() < (m.boss ? .8 : D.crystals)) {
      const g = dropGradeTop(z.z);
      const n = (1 + Math.floor(rnd() * 3)) * [1, 1, 2, 4, 8, 16, 32][g] * (m.boss ? 4 : 1);
      S.crystals += n;
    }
  }
  function gainXp(x) {
    S.xp += x;
    let up = false;
    while (S.xp >= B.xpNeed(S.level)) {
      S.xp -= B.xpNeed(S.level); S.level++; S.sp++; up = true;
      const gr = B.GRADES.findIndex(g => g.lvl === S.level);
      if (gr > 0) { log(`Доступно снаряжение ${B.GRADES[gr].label} в магазине.`, 'good'); toast(`Открыт ${B.GRADES[gr].label}`); }
      const sk = SKILLS.find(s => s.unlock === S.level);
      if (sk) log(`Можно изучить навык «${sk.name}».`, 'good');
    }
    if (up) {
      recalc(); R.hero.hp = R.st.hp;
      banner('Уровень ' + S.level, 'Здоровье восстановлено', '#ff8fc1');
      log(`Уровень повышен до ${S.level}. Получено очко навыка.`, 'good');
      Sound.play('level');
      if (R.tab === 'hero' || R.tab === 'skills' || R.tab === 'shop') renderPanel();
    }
  }
  function monsterHit(m) {
    const h = R.hero;
    if (h.dead || m.hp <= 0) return;
    let dmg = m.dmg * (1 - red(S.stage)) * (.9 + rnd() * .2);
    if (R.buffs.guard > 0) dmg *= .7;
    h.hp -= dmg; h.hurt = .22;
    R.fx.push({ type: 'num', x: R.heroX + (rnd() - .5) * 10 * R.k, y: R.gy - 120 * R.k, vy: -36 * R.k, t: 0, life: .8, text: '-' + fmt(dmg), c: '#ff6b7f', size: 13 * Math.sqrt(R.k) });
    if (m.boss && !RM) R.shake = Math.max(R.shake, .18);
    if (h.hp <= 0) heroDie();
  }
  function heroDie() {
    const h = R.hero;
    h.hp = 0; h.dead = 3; h.swing = -1;
    log('Героиня пала. Возрождение через 3 секунды.', 'bad');
    if (R.boss) bossFail('death');
  }

  /* ---------- навыки ---------- */
  function trySkills(dt, engaged) {
    R.castLock -= dt;
    for (const s of SKILLS) R.cd[s.id] = Math.max(0, R.cd[s.id] - dt);
    if (R.hero.dead || R.castLock > 0) return;
    for (const s of SKILLS) {
      if (!S.skills[s.id] || R.cd[s.id] > 0) continue;
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
    R.cd[id] = s.cd; R.castLock = .45; h.cast = .35;
    const atk = R.st.atk * (1 + spiritBonus());
    const k = R.k, gy = R.gy;
    const alive = R.monsters.filter(m => m.hp > 0);
    const critRoll = () => { const c = rnd() < R.st.crit; return [c ? R.st.critDmg : 1, c]; };
    const stack = R.fx.filter(f => f.type === 'skillname').length;
    R.fx.push({ type: 'skillname', x: R.heroX, y: gy - (150 + stack * 18) * k, t: 0, life: 1, text: s.name });
    if (id === 'petal') {
      const range = R.heroX + 230 * k;
      R.fx.push({ type: 'ring', x: R.heroX + 60 * k, y: gy - 40 * k, r0: 20 * k, r1: 170 * k, t: 0, life: .45, c: '#ff8fc1' });
      for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2; R.fx.push({ type: 'part', x: R.heroX + 60 * k, y: gy - 40 * k, vx: Math.cos(a) * 260 * k, vy: Math.sin(a) * 160 * k, g: 40 * k, size: (3 + rnd() * 3) * k, c: rnd() < .5 ? '#ff8fc1' : '#ffd0e4', t: 0, life: .7 + rnd() * .3, shape: 'petal', rot: rnd() * 6, vr: (rnd() - .5) * 12 }); }
      setTimeout(() => { for (const m of alive) if (m.hp > 0 && m.x < range) { const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#ffb3d6'); } }, 120);
      Sound.play('skill');
    } else if (id === 'moon') {
      const m = frontMonster(); if (!m) return;
      R.fx.push({ type: 'slash', x: m.x, y: gy - 40 * k * m.scale, r: 90 * k, a: -.4, life: .38, t: 0, c: '#bfe6ff', w: 16 });
      R.flash = .12; R.flashC = '#cfeaff';
      setTimeout(() => { const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#bfe6ff'); }, 90);
      Sound.play('skill');
    } else if (id === 'spirit') {
      R.buffs.spirit = 8;
      R.fx.push({ type: 'ring', x: R.heroX, y: gy - 50 * k, r0: 10 * k, r1: 80 * k, t: 0, life: .5, c: '#ff8a4c' });
      log(`Боевой дух: атака +${pct(s.mult(l))} на 8 секунд.`, 'sys');
      Sound.play('buff');
    } else if (id === 'thunder') {
      const tg = alive.filter(m => m.x < R.W);
      for (let i = 0; i < 3; i++) {
        const m = tg.length ? tg[i % tg.length] : null; if (!m) break;
        setTimeout(() => {
          if (m.hp <= 0) return;
          R.fx.push({ type: 'bolt', x: m.x + (rnd() - .5) * 10 * k, y1: gy - 10 * k, t: 0, life: .28, seed: rnd() * 100 });
          R.flash = .08; R.flashC = '#fff6b0';
          const [cm, c] = critRoll(); hitDamage(m, atk * s.mult(l) * cm, c, '#ffe55c');
          Sound.play('thunder');
        }, i * 140);
      }
    } else if (id === 'bloom') {
      const heal = R.st.hp * s.mult(l);
      h.hp = Math.min(R.st.hp, h.hp + heal); R.buffs.guard = 5;
      R.fx.push({ type: 'num', x: R.heroX, y: gy - 130 * k, vy: -30 * k, t: 0, life: 1.1, text: '+' + fmt(heal), c: '#74e0a8', size: 18 * Math.sqrt(k) });
      for (let i = 0; i < 18; i++) R.fx.push({ type: 'part', x: R.heroX + (rnd() - .5) * 60 * k, y: gy - rnd() * 20 * k, vx: (rnd() - .5) * 30 * k, vy: -(60 + rnd() * 80) * k, g: -10 * k, size: (3 + rnd() * 2) * k, c: rnd() < .5 ? '#74e0a8' : '#ffd0e4', t: 0, life: 1 + rnd() * .5, shape: 'petal', rot: rnd() * 6, vr: (rnd() - .5) * 6 });
      Sound.play('buff');
    }
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
    R.fx.push({ type: 'banner', text, sub, c, t: 0, life: 1.8 });
  }

  function updateFx(dt) {
    for (const f of R.fx) {
      f.t += dt;
      if (f.type === 'num') { f.y += f.vy * dt; f.vy *= .96; }
      else if (f.type === 'part') { f.vy += (f.g || 0) * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .98; if (f.rot !== undefined) f.rot += f.vr * dt; }
      else if (f.type === 'coin') {
        if (f.t < .7) { f.vy += 520 * R.k * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.y > f.by) { f.y = f.by; f.vy *= -.35; f.vx *= .6; } }
        else { const p = Math.min(1, (f.t - .7) / .5); f.x += (R.goldPos.x - f.x) * p * .35; f.y += (R.goldPos.y - f.y) * p * .35; if (p >= 1 || Math.hypot(R.goldPos.x - f.x, R.goldPos.y - f.y) < 8) f.t = f.life; }
      } else if (f.type === 'drop') {
        if (f.t < .35) { f.vy += 600 * R.k * dt; f.y += f.vy * dt; }
        else if (f.t > 1.05) { const p = Math.min(1, (f.t - 1.05) / .5); f.x += (R.bagPos.x - f.x) * p * .3; f.y += (R.bagPos.y - f.y) * p * .3; }
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
  function drawAmb(z) {
    const k = R.k;
    for (const p of R.amb) {
      switch (z.amb) {
        case 'petal':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.s > 1 ? '#ffc4de' : '#ff9fcb';
          A.ell(ctx, 0, 0, 3.6 * k * p.s, 2 * k * p.s); ctx.fill(); ctx.restore(); break;
        case 'snow': ctx.fillStyle = 'rgba(255,255,255,.9)'; A.ell(ctx, p.x, p.y, 1.8 * k * p.s, 1.8 * k * p.s); ctx.fill(); break;
        case 'firefly': {
          const a = .4 + .6 * Math.abs(Math.sin(p.t * 2 + p.r));
          ctx.fillStyle = `rgba(230,255,150,${a})`; ctx.shadowColor = '#e6ff96'; ctx.shadowBlur = 8 * k;
          A.ell(ctx, p.x, p.y, 1.8 * k, 1.8 * k); ctx.fill(); ctx.shadowBlur = 0; break; }
        case 'sand': ctx.strokeStyle = 'rgba(255,240,200,.45)'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 14 * k * p.s, p.y); ctx.stroke(); break;
        case 'ember': ctx.fillStyle = `rgba(255,${120 + 80 * p.s | 0},60,${.6 + .4 * Math.sin(p.t * 5)})`; A.ell(ctx, p.x, p.y, 1.6 * k * p.s, 1.6 * k * p.s); ctx.fill(); break;
        case 'mote': ctx.fillStyle = `rgba(255,98,212,${.3 + .3 * Math.sin(p.t * 2 + p.r)})`; A.ell(ctx, p.x, p.y, 1.8 * k * p.s, 1.8 * k * p.s); ctx.fill(); break;
      }
    }
  }

  /* ---------- главный цикл ---------- */
  let last = performance.now(), hudTick = 0, saveTick = 0, cloudTick = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    let dt = Math.min(.05, (now - last) / 1000); last = now;
    if (document.hidden) return;
    update(dt);
    render();
    hudTick += dt; saveTick += dt; cloudTick += dt;
    if (hudTick > .12) { hudTick = 0; updateHud(); }
    if (saveTick > 5) { saveTick = 0; saveLocal(); }
    if (cloudTick > 30) { cloudTick = 0; Cloud.push(); }
  }

  function update(dt) {
    R.t += dt;
    const h = R.hero, st = R.st, k = R.k;
    const z = zoneOf(S.stage);
    for (const b in R.buffs) R.buffs[b] = Math.max(0, R.buffs[b] - dt);
    if (h.hurt > 0) h.hurt -= dt;
    if (h.cast > 0) h.cast -= dt;
    if (R.shake > 0) R.shake -= dt;
    if (R.flash > 0) R.flash -= dt;

    if (h.dead > 0) {
      h.dead -= dt;
      if (h.dead <= 0) { h.dead = 0; h.hp = st.hp; log('Героиня снова в строю.', 'sys'); }
    } else h.hp = Math.min(st.hp, h.hp + st.regen * dt);

    if (R.boss) {
      R.boss.time -= dt;
      if (R.boss.time <= 0 && R.boss.m.hp > 0) bossFail('time');
    } else {
      spawnLogic();
      if (S.kills >= 10 && S.autoBoss && !h.dead) startBoss();
    }

    const alive = R.monsters.filter(m => m.hp > 0).sort((a, b) => a.x - b.x);
    const reach = R.heroX + 58 * k;
    const stand = m => reach + 22 * k * (m.scale - 1);
    const front = alive[0];
    const engaged = !!front && front.x <= stand(front) + 3 && !h.dead;
    const run = !front || front.x > stand(front) + 3;
    h.run = run && !h.dead ? 1 : 0;
    let runSpeed = 0;
    if (h.run) {
      runSpeed = 160 * k;
      const d = runSpeed * dt;
      R.scroll += d;
      for (const m of R.monsters) m.x -= d;
      h.phase += dt * 13;
    }
    // монстры подходят и держат строй
    let minX = reach;
    for (const m of alive) {
      const lim = Math.max(minX, stand(m));
      if (m.x > lim) m.x = Math.max(lim, m.x - (m.boss ? 70 : 34) * k * dt);
      if (m.x < lim) m.x = lim;
      minX = m.x + 40 * k * Math.min(1.6, m.scale);
    }
    for (const m of R.monsters) {
      m.t += dt;
      if (m.flash > 0) m.flash -= dt;
      if (m.dieT > 0) { m.dieT += dt; continue; }
      if (m.atk > 0) { m.atk += dt * 3.2; if (m.atk >= 1) m.atk = 0; }
      if (!h.dead && m.hp > 0 && m.x <= stand(m) + 34 * k) {
        m.atkT += dt;
        if (m.atkT >= (m.boss ? 1.05 : 1.3)) { m.atkT = 0; m.atk = .01; m.pend = .16; }
      }
      if (m.pend > 0) { m.pend -= dt; if (m.pend <= 0) monsterHit(m); }
    }
    R.monsters = R.monsters.filter(m => !(m.dieT > .45) && m.x > -80 * k);

    // атака героини
    if (!h.dead) {
      const swingDur = Math.min(.34, .7 / st.aspd);
      if (engaged) {
        h.atkT += dt * st.aspd;
        if (h.swing < 0 && h.atkT >= 1) { h.atkT = 0; h.swing = 0; h.hit = false; }
      } else h.atkT = Math.min(1, h.atkT + dt * st.aspd);
      if (h.swing >= 0) {
        h.swing += dt / swingDur;
        if (!h.hit && h.swing >= .45) { h.hit = true; heroStrike(); }
        if (h.swing >= 1) h.swing = -1;
      }
    }
    trySkills(dt, engaged);
    updateFx(dt);
    updateAmb(dt, z, runSpeed);
    // искры от сильно заточенного меча
    const w = R.look.weapon;
    if (w && w.e >= 7 && !RM && rnd() < dt * (w.e >= 13 ? 14 : 7)) {
      R.fx.push({ type: 'part', x: R.heroX + (rnd() * 40 + 5) * k, y: R.gy - (60 + rnd() * 50) * k, vx: (rnd() - .5) * 20 * k, vy: -(20 + rnd() * 30) * k, g: 0, size: (1.5 + rnd() * 1.5) * k, c: A.enchGlow(w.e, R.t), t: 0, life: .6, shape: 'star' });
    }
  }

  function render() {
    const c = ctx, k = R.k, z = zoneOf(S.stage);
    c.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
    let sx = 0, sy = 0;
    if (R.shake > 0) { sx = (rnd() - .5) * 8 * k; sy = (rnd() - .5) * 6 * k; }
    c.save(); c.translate(sx, sy);
    A.drawBackground(c, R.W, R.H, R.gy, z, R.scroll, R.t);
    if (z.loop) { c.fillStyle = `rgba(80,0,60,${Math.min(.25, z.loop * .08)})`; c.fillRect(0, 0, R.W, R.H); }

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
    A.drawHero(c, R.heroX, R.gy, k * 1.02, R.look, { t: R.t, run: h.run, phase: h.phase, swing: h.swing, hurt: Math.max(0, h.hurt), dead: h.dead > 0, cast: Math.max(0, h.cast) });
    drawFx(c);
    drawAmb(z);
    c.restore();
    if (R.flash > 0) { c.fillStyle = A.hexA(R.flashC, Math.min(.4, R.flash * 3)); c.fillRect(0, 0, R.W, R.H); }
    if (h.dead > 0) {
      c.fillStyle = 'rgba(20,6,30,.45)'; c.fillRect(0, 0, R.W, R.H);
      txt(c, 'Возрождение ' + Math.ceil(h.dead), R.W / 2, R.H * .5, 22 * Math.sqrt(k), '#ffffff');
    }
    if (R.tab === 'gear') drawDoll();
  }

  function txt(c, s, x, y, size, fill, align = 'center') {
    c.font = `${size}px "Russo One", "Arial Black", sans-serif`;
    c.textAlign = align; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * .22); c.strokeStyle = '#1a0f2a';
    c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y);
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
          c.save(); c.globalAlpha = 1 - p; c.globalCompositeOperation = 'lighter';
          c.lineCap = 'round';
          c.strokeStyle = f.c; c.lineWidth = f.w * k * (1 - p * .5);
          c.beginPath(); c.arc(f.x, f.y, f.r, a0, a1); c.stroke();
          c.lineWidth = f.w * k * .35; c.strokeStyle = '#ffffff';
          c.beginPath(); c.arc(f.x, f.y, f.r * .92, a0 + .2, a1 - .1); c.stroke();
          c.restore(); break;
        }
        case 'ring': {
          c.save(); c.globalAlpha = 1 - p; c.strokeStyle = f.c; c.lineWidth = 6 * k * (1 - p);
          A.ell(c, f.x, f.y, f.r0 + (f.r1 - f.r0) * p, (f.r0 + (f.r1 - f.r0) * p) * .45); c.stroke(); c.restore(); break;
        }
        case 'bolt': {
          c.save(); c.globalAlpha = 1 - p; c.globalCompositeOperation = 'lighter';
          c.strokeStyle = '#fff6b0'; c.shadowColor = '#ffe55c'; c.shadowBlur = 14 * k; c.lineWidth = 4 * k;
          c.beginPath(); let x = f.x, y = 0; c.moveTo(x, y);
          for (let i = 1; i <= 8; i++) { y = f.y1 * i / 8; x = f.x + (A.h01(Math.floor(f.seed) + i) - .5) * 26 * k * (i < 8 ? 1 : 0); c.lineTo(x, y); }
          c.stroke(); c.lineWidth = 1.5 * k; c.strokeStyle = '#ffffff'; c.stroke();
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
          txt(c, f.text, f.x, f.y - p * 10 * k, 13 * Math.sqrt(k), '#ffe3f0'); c.restore(); break;
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

  /* ---------- HUD ---------- */
  const hud = {};
  ['hLvl', 'xpFill', 'hpFill', 'hpText', 'goldText', 'cryText', 'stageNum', 'stageName', 'killFill', 'killText', 'bossBtn', 'autoBtn', 'stageRow', 'bossRow', 'bossName', 'bossFill', 'bossTime', 'skillDock', 'spDot', 'soundBtn'].forEach(id => hud[id] = $(id));
  function updateHudStatic() {
    const z = zoneOf(S.stage);
    hud.hLvl.textContent = S.level;
    hud.stageNum.textContent = z.num;
    hud.stageName.textContent = z.title;
    hud.killText.textContent = `${Math.min(10, S.kills)}/10`;
    hud.killFill.style.width = Math.min(100, S.kills * 10) + '%';
    const ready = S.kills >= 10 && !R.boss;
    hud.bossBtn.disabled = !ready; hud.bossBtn.classList.toggle('ready', ready && !S.autoBoss);
    hud.autoBtn.setAttribute('aria-pressed', S.autoBoss ? 'true' : 'false');
    hud.stageRow.hidden = !!R.boss; hud.bossRow.hidden = !R.boss;
    if (R.boss) hud.bossName.textContent = R.boss.m.name;
    hud.spDot.hidden = !(S.sp > 0 && SKILLS.some(s => S.level >= s.unlock && S.skills[s.id] < SKILL_MAX));
    hud.spDot.textContent = S.sp;
  }
  function updateHud() {
    const h = R.hero;
    hud.xpFill.style.width = clamp(S.xp / B.xpNeed(S.level) * 100, 0, 100) + '%';
    hud.hpFill.style.width = clamp(h.hp / R.st.hp * 100, 0, 100) + '%';
    hud.hpText.textContent = `${fmt(Math.max(0, h.hp))} / ${fmt(R.st.hp)}`;
    hud.goldText.textContent = fmt(S.gold);
    hud.cryText.textContent = fmt(S.crystals);
    if (R.boss) {
      const m = R.boss.m;
      hud.bossFill.style.width = clamp(m.hp / m.maxHp * 100, 0, 100) + '%';
      hud.bossTime.textContent = Math.ceil(Math.max(0, R.boss.time));
      hud.bossTime.classList.toggle('low', R.boss.time < 8);
    }
    for (const el of hud.skillDock.children) {
      const s = SK[el.dataset.sk];
      const learned = S.skills[s.id] > 0;
      el.classList.toggle('locked', !learned);
      el.style.setProperty('--cd', learned ? (R.cd[s.id] / s.cd).toFixed(3) : 0);
      el.classList.toggle('ready', learned && R.cd[s.id] <= 0);
    }
    // доступность кнопок покупки
    for (const b of document.querySelectorAll('[data-cost]')) {
      const cur = b.dataset.cur === 'cry' ? S.crystals : S.gold;
      b.classList.toggle('poor', +b.dataset.cost > cur);
    }
    if (R.dirtyBank) { R.dirtyBank = false; const bank = $('scrollBank'); if (bank) bank.innerHTML = bankHTML(); }
  }

  /* ---------- журнал ---------- */
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
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- звук ---------- */
  const Sound = {
    ctx: null, noise: null, lastHit: 0,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const b = this.ctx.createBuffer(1, this.ctx.sampleRate * .3, this.ctx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = b;
      } catch (e) { this.ctx = null; }
    },
    tone(f, t0, dur, type = 'sine', vol = .08, f2) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + .02);
    },
    hiss(t0, dur, vol, freq) {
      const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .8;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      s.connect(f).connect(g).connect(c.destination); s.start(t0); s.stop(t0 + dur);
    },
    play(type) {
      if (!S || !S.sound || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      switch (type) {
        case 'hit': if (t - this.lastHit < .06) return; this.lastHit = t; this.hiss(t, .09, .12, 2400); this.tone(180, t, .08, 'triangle', .05, 90); break;
        case 'crit': this.hiss(t, .14, .16, 3200); this.tone(520, t, .12, 'square', .03, 260); break;
        case 'coin': this.tone(1320, t, .07, 'square', .02); this.tone(1760, t + .06, .1, 'square', .02); break;
        case 'level': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * .08, .18, 'triangle', .06)); break;
        case 'boss': this.tone(110, t, .6, 'sawtooth', .05, 70); this.tone(165, t + .1, .5, 'sawtooth', .03, 90); break;
        case 'skill': this.hiss(t, .25, .1, 1200); this.tone(880, t, .2, 'sine', .05, 1760); break;
        case 'thunder': this.hiss(t, .3, .18, 600); break;
        case 'buff': [392, 523, 659].forEach((f, i) => this.tone(f, t + i * .06, .25, 'sine', .05)); break;
        case 'charge': this.tone(220, t, 1.1, 'sine', .04, 880); break;
        case 'success': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * .07, .3, 'triangle', .07)); break;
        case 'fail': this.hiss(t, .5, .2, 900); this.tone(330, t, .5, 'sawtooth', .05, 80); break;
        case 'buy': this.tone(988, t, .06, 'square', .03); this.tone(1319, t + .05, .08, 'square', .03); break;
      }
    },
  };
  function soundIcon() {
    hud.soundBtn.innerHTML = S.sound
      ? '<svg viewBox="0 0 16 16" fill="none" stroke="#f6f1ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h3l4-3v10L5 10H2z" fill="#f6f1ff"/><path d="M11.5 5.5a3.5 3.5 0 0 1 0 5M13.5 3.5a6.5 6.5 0 0 1 0 9"/></svg>'
      : '<svg viewBox="0 0 16 16" fill="none" stroke="#a99fd4" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h3l4-3v10L5 10H2z" fill="#a99fd4"/><path d="M11 6l4 4M15 6l-4 4"/></svg>';
    hud.soundBtn.setAttribute('aria-label', S.sound ? 'Выключить звук' : 'Включить звук');
  }

  /* ---------- панели ---------- */
  const panel = $('panel');
  function renderPanel() {
    const fn = { hero: renderHero, gear: renderGear, skills: renderSkills, shop: renderShop, map: renderMap }[R.tab];
    panel.innerHTML = fn();
    if (R.tab === 'gear') setupDoll();
  }
  function setTab(t) {
    R.tab = t;
    for (const b of document.querySelectorAll('#tabs [data-tab]')) b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false');
    renderPanel(); panel.scrollTop = 0;
  }

  // --- героиня
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
  function statCells() {
    const st = R.st;
    return [
      ['Атака', fmt(st.atk)], ['Здоровье', fmt(st.hp)], ['Защита', fmt(st.def)], ['Восстановление', fmt(st.regen) + '/с'],
      ['Шанс крита', pct(st.crit)], ['Урон крита', pct(st.critDmg)], ['Скорость атаки', st.aspd.toFixed(2) + '/с'], ['Убито монстров', fmt(S.stats.kills)],
    ];
  }
  function renderHero() {
    return `
      <section class="card">
        <div class="card-head"><h2>Героиня Сакура</h2><span class="power">Боевая мощь<b id="powerVal">${fmt(R.power)}</b></span></div>
        <dl class="stat-grid" id="statGrid">${statCells().map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
      </section>
      <div class="card-head" style="margin:0"><h3>Тренировка за золото</h3><span class="sub">Зажмите кнопку для серии покупок</span></div>
      <div class="seg" role="group" aria-label="Сколько уровней покупать">
        ${[[1, '×1'], [10, '×10'], [100, '×100'], ['max', 'Макс']].map(([v, l]) => `<button data-act="mult" data-v="${v}" aria-pressed="${R.mult === v}">${l}</button>`).join('')}
      </div>
      <ul class="rows" id="growthRows">${B.GROWTH.map(g => growthRow(g)).join('')}</ul>
      <section class="card">
        <div class="card-head"><h3>Как устроено снаряжение</h3></div>
        <p class="sub">Снаряжение делится на грейды от «без грейда» до R. Новые грейды открываются с уровнем героини. Заточка до +3 безопасна, дальше каждый шаг рискованный: обычный свиток при неудаче разрушает вещь и даёт кристаллы, благословенный только сбрасывает заточку до +0. Пять частей доспеха одного грейда дают бонус сета, а при заточке всех частей на +6 героиню окружает сияние.</p>
      </section>
      <div class="danger-zone" id="resetZone">
        <button class="link-btn" data-act="reset">Начать игру заново</button>
      </div>`;
  }
  function growthRow(g) {
    const l = S.growth[g.id], maxed = l >= g.max, b = growthBatch(g);
    return `<li class="row" data-row="${g.id}">
      <img src="${A.miscIcon(GROWTH_ICON[g.id], 64)}" alt="">
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
    recalc(); patchHero(); Sound.play('buy');
    return true;
  }

  // --- снаряжение
  const DOLL = { left: ['helmet', 'upper', 'lower'], right: ['weapon', 'gloves', 'boots'], bottom: ['neck', 'ear', 'ring'] };
  function slotTile(slot) {
    const id = S.equip[slot], it = id && itemById(id);
    if (it) return tileHTML(it, `data-act="item" data-id="${it.id}"`);
    return `<button class="tile empty" data-act="slot" data-slot="${slot}" aria-label="${B.SLOT[slot].name}: пусто"><span class="slot-name">${B.SLOT[slot].name}</span></button>`;
  }
  function bankHTML() {
    const chips = [];
    const keys = [['w', 'weapon', false, 'Оружие'], ['a', 'armor', false, 'Доспех'], ['bw', 'weapon', true, 'Благ. оружие'], ['ba', 'armor', true, 'Благ. доспех']];
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
      <section class="card">
        <div class="card-head"><h3>Свитки заточки</h3></div>
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

  // --- карточка предмета
  const modal = $('modal');
  let modalState = null;
  function openModal(html, state) {
    modal.innerHTML = html; modal.hidden = false; modalState = state || {};
    const f = modal.querySelector('[data-act="close"]'); if (f) f.focus({ preventScroll: true });
  }
  function closeModal() {
    if (modalState && modalState.raf) cancelAnimationFrame(modalState.raf);
    if (modalState && modalState.onClose) modalState.onClose();
    modal.hidden = true; modal.innerHTML = ''; modalState = null;
  }
  function compareRows(slot, g, e, vsSt) {
    const cur = B.itemStats(slot, g, e);
    return Object.keys(cur).map(k => {
      const v = cur[k], o = vsSt ? (vsSt[k] || 0) : null;
      const cls = o === null ? '' : v > o + 1e-9 ? 'up' : v < o - 1e-9 ? 'down' : '';
      return `<dt>${STAT_LABEL[k]}</dt><dd class="${cls}">${statStr(k, v)}</dd><dd>${o === null ? '' : 'сейчас ' + statStr(k, o)}</dd>`;
    }).join('');
  }
  function openItem(id) {
    const it = itemById(id); if (!it) return;
    const eq = isEquipped(it), gr = B.GRADES[it.g];
    const eqId = S.equip[it.slot], eqIt = !eq && eqId && itemById(eqId);
    const vs = eqIt ? B.itemStats(eqIt.slot, eqIt.g, eqIt.e) : null;
    const lvOk = S.level >= gr.lvl;
    const k = scrollKind(it.slot);
    const canEnch = it.g > 0 && it.e < B.MAX_ENCH;
    openModal(`
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${itemName(it)}">
        <div class="sheet-head">${tileHTML(it, 'tabindex="-1"')}
          <div><h2 class="gtext g${it.g}">${itemName(it)}</h2><p class="sub">${B.SLOT[it.slot].name} · ${gr.label}${eq ? ' · надето' : ''}</p></div>
          <button class="close-btn" data-act="close" aria-label="Закрыть">×</button></div>
        <dl class="compare">${compareRows(it.slot, it.g, it.e, vs)}</dl>
        ${!lvOk ? `<p class="note warn">Нужен уровень ${gr.lvl}, чтобы надеть этот предмет.</p>` : ''}
        ${it.g === 0 ? '<p class="note">Предметы без грейда нельзя заточить.</p>'
          : `<p class="note">Свитков ${B.GRADES[it.g].short} для ${k === 'w' ? 'оружия' : 'доспехов'}: обычных ${S.scrolls[k][it.g]}, благословенных ${S.scrolls['b' + k][it.g]}.</p>`}
        <div class="btn-row">
          ${eq ? `<button class="buy ghost" data-act="unequip" data-id="${it.id}">Снять</button>` : `<button class="buy" data-act="equip" data-id="${it.id}" ${lvOk ? '' : 'disabled'}>Надеть</button>`}
          <button class="buy pink" data-act="enchant" data-id="${it.id}" ${canEnch ? '' : 'disabled'}>${it.e >= B.MAX_ENCH ? 'Максимум +16' : 'Заточить'}</button>
        </div>
        ${eq ? '' : `<div class="btn-row">
          <button class="buy ghost" data-act="sell" data-id="${it.id}"><img src="${A.miscIcon('gold', 32)}" alt="">Продать за ${fmt(B.sellPrice(it.slot, it.g))}</button>
          <button class="buy ghost" data-act="crystallize" data-id="${it.id}"><img src="${A.miscIcon('crystal', 32)}" alt="">Кристаллизовать: ${fmt(B.crystalYield(it.slot, it.g, it.e))}</button>
        </div>`}
      </div>`, { item: id });
  }
  function equip(id) {
    const it = itemById(id); if (!it || S.level < B.GRADES[it.g].lvl) return;
    S.equip[it.slot] = it.id; recalc();
    log(`Надето: ${itemName(it)}.`, 'sys');
  }
  function unequip(id) {
    const it = itemById(id); if (!it) return;
    if (S.equip[it.slot] === it.id) S.equip[it.slot] = null;
    recalc();
  }
  function removeItem(id) {
    const it = itemById(id); if (!it) return;
    if (S.equip[it.slot] === id) S.equip[it.slot] = null;
    S.items = S.items.filter(i => i.id !== id);
  }

  // --- заточка
  function enchantHTML(it, st) {
    const k = scrollKind(it.slot), target = it.e + 1, ch = B.enchChance(target);
    const nN = S.scrolls[k][it.g], nB = S.scrolls['b' + k][it.g];
    if (st.kind === 'n' && !nN && nB) st.kind = 'b';
    if (st.kind === 'b' && !nB && nN) st.kind = 'n';
    const have = st.kind === 'n' ? nN : nB;
    const cls = ch >= 1 ? 'safe' : ch >= .5 ? 'risky' : 'deadly';
    const now = B.itemStats(it.slot, it.g, it.e), nxt = B.itemStats(it.slot, it.g, target);
    const kindName = k === 'w' ? 'оружие' : 'доспех';
    return `
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Заточка">
        <div class="sheet-head"><div><h2>Заточка</h2><p class="sub gtext g${it.g}">${itemName(it)}</p></div>
          <button class="close-btn" data-act="close" aria-label="Закрыть">×</button></div>
        <div class="forge"><canvas id="forgeCv"></canvas>${tileHTML(it, 'id="forgeTile" tabindex="-1"')}<div class="forge-result" id="forgeRes"></div></div>
        ${it.e >= B.MAX_ENCH ? '<p class="chance safe">Достигнута максимальная заточка <b>+16</b></p>' : `
        <div class="ench-line"><span class="gtext g${it.g}">+${it.e}</span><span class="arrow">→</span><span>+${target}</span></div>
        <p class="chance ${cls}">Шанс успеха <b>${Math.round(ch * 100)}%</b>${ch >= 1 ? ' · безопасно до +3' : ''}</p>
        <dl class="compare">${Object.keys(nxt).map(s => `<dt>${STAT_LABEL[s]}</dt><dd>${statStr(s, now[s])}</dd><dd class="up">${statStr(s, nxt[s])}</dd>`).join('')}</dl>
        <div class="scroll-pick" role="group" aria-label="Свиток">
          <button data-act="pick" data-v="n" aria-pressed="${st.kind === 'n'}" ${nN ? '' : 'disabled'}><img src="${A.scrollIcon(k === 'w' ? 'weapon' : 'armor', it.g, false)}" alt=""><b>Свиток: ${kindName} ${B.GRADES[it.g].short}</b><span>Есть ${nN}</span></button>
          <button data-act="pick" data-v="b" aria-pressed="${st.kind === 'b'}" ${nB ? '' : 'disabled'}><img src="${A.scrollIcon(k === 'w' ? 'weapon' : 'armor', it.g, true)}" alt=""><b>Благословенный</b><span>Есть ${nB}</span></button>
        </div>
        ${ch >= 1 ? '<p class="note">Безопасная заточка: предмет не пострадает.</p>'
          : st.kind === 'b' ? '<p class="note">Благословенный свиток: при неудаче заточка сбросится до +0, предмет уцелеет.</p>'
          : `<p class="note warn">При неудаче предмет разрушится и превратится в ${fmt(B.crystalYield(it.slot, it.g, it.e))} ${plural(B.crystalYield(it.slot, it.g, it.e), CRY_W)}. Новый придётся покупать в магазине.</p>`}
        <button class="buy pink wide" data-act="do-enchant" ${have ? '' : 'disabled'}>${have ? 'Заточить' : 'Нет свитков этого грейда'}</button>`}
      </div>`;
  }
  function openEnchant(id) {
    const it = itemById(id); if (!it || it.g === 0) return;
    const prev = modalState && modalState.enchant ? modalState : null;
    const st = { enchant: true, item: id, kind: prev ? prev.kind : 'n', busy: false, power: 0, res: null, parts: [], t: 0, color: '#ff8fc1' };
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
  function doEnchant() {
    const st = modalState; if (!st || !st.enchant || st.busy) return;
    const it = itemById(st.item); if (!it || it.e >= B.MAX_ENCH) return;
    const k = scrollKind(it.slot), key = (st.kind === 'b' ? 'b' : '') + k;
    if (S.scrolls[key][it.g] <= 0) return;
    st.busy = true;
    modal.querySelectorAll('button:not([data-act="close"])').forEach(b => b.disabled = true);
    S.scrolls[key][it.g]--;
    Sound.play('charge');
    const t0 = performance.now(), D = RM ? 300 : 1100;
    const ramp = () => {
      if (modalState !== st) return;
      const p = Math.min(1, (performance.now() - t0) / D);
      st.power = p;
      if (p < 1) requestAnimationFrame(ramp); else resolveEnchant(st, it, key);
    };
    requestAnimationFrame(ramp);
  }
  function resolveEnchant(st, it, key) {
    const target = it.e + 1, ch = B.enchChance(target), blessed = key[0] === 'b';
    S.stats.enchants++;
    const res = $('forgeRes'), tile = $('forgeTile');
    if (rnd() < ch) {
      it.e = target; S.stats.best = Math.max(S.stats.best, target);
      st.color = '#ffd760'; burst(st, ['#ffd760', '#ffffff', '#ff8fc1'], false, 40);
      res.className = 'forge-result ok'; res.innerHTML = `+${target} Успех!`;
      log(`${B.NAMES[it.slot][it.g]} успешно заточен до +${target}.`, 'good');
      Sound.play('success');
      recalc();
      setTimeout(() => { if (modalState === st) { st.busy = false; st.power = 0; st.color = '#ff8fc1'; rerenderEnchant(st); } }, RM ? 400 : 1100);
    } else if (blessed) {
      const was = it.e; it.e = 0;
      st.color = '#7cc8ff'; burst(st, ['#7cc8ff', '#ffffff'], false, 26);
      res.className = 'forge-result reset'; res.innerHTML = `Неудача<small>Благословение спасло предмет. Заточка +${was} сброшена до +0.</small>`;
      log(`Заточка не удалась. ${B.NAMES[it.slot][it.g]}: +${was} → +0.`, 'bad');
      Sound.play('fail');
      recalc();
      setTimeout(() => { if (modalState === st) { st.busy = false; st.power = 0; st.color = '#ff8fc1'; rerenderEnchant(st); } }, RM ? 600 : 1600);
    } else {
      const cry = B.crystalYield(it.slot, it.g, it.e), nm = itemName(it), slot = it.slot, g = it.g;
      removeItem(it.id); S.crystals += cry; S.stats.breaks++;
      recalc();
      st.color = '#ff5d73'; burst(st, ['#ff5d73', '#bfe9ff', '#ffffff'], true, 46);
      if (tile) tile.classList.add('shatter');
      res.className = 'forge-result bad'; res.innerHTML = `Предмет разрушен<small>${nm} кристаллизовался: +${fmt(cry)} ${plural(cry, CRY_W)}</small>`;
      log(`Заточка не удалась. ${nm} кристаллизовался: получено ${fmt(cry)} ${plural(cry, CRY_W)}.`, 'bad');
      Sound.play('fail');
      if (!RM) { R.shake = .25; }
      setTimeout(() => {
        if (modalState !== st) return;
        st.busy = false;
        const row = document.createElement('div'); row.className = 'btn-row';
        const back = S.level >= B.GRADES[g].lvl && B.price(slot, g) <= S.gold;
        row.innerHTML = `<button class="buy" data-act="goshop" data-g="${g}">Купить заново в магазине</button><button class="buy ghost" data-act="close">Закрыть</button>`;
        const sheet = modal.querySelector('.sheet');
        sheet.querySelectorAll('.ench-line,.chance,.compare,.scroll-pick,.note,.wide').forEach(n => n.remove());
        sheet.appendChild(row);
        const n = document.createElement('p'); n.className = 'note'; n.textContent = back ? `Цена нового: ${fmt(B.price(slot, g))} золота.` : `Цена нового: ${fmt(B.price(slot, g))} золота.`;
        sheet.insertBefore(n, row);
      }, RM ? 400 : 1300);
    }
    if (R.tab === 'gear') renderPanel();
  }
  function rerenderEnchant(st) {
    const it = itemById(st.item); if (!it) return;
    const sheet = modal.querySelector('.sheet'); if (!sheet) return;
    const tmp = document.createElement('div'); tmp.innerHTML = enchantHTML(it, st);
    const fresh = tmp.firstElementChild;
    // сохраняем живой холст круга
    const oldForge = sheet.querySelector('.forge'), newForge = fresh.querySelector('.forge');
    newForge.replaceWith(oldForge);
    const tile = oldForge.querySelector('.tile'); const nt = tmp.ownerDocument.createElement('div');
    nt.innerHTML = tileHTML(it, 'id="forgeTile" tabindex="-1"'); tile.replaceWith(nt.firstElementChild);
    oldForge.querySelector('.forge-result').className = 'forge-result';
    oldForge.querySelector('.forge-result').innerHTML = '';
    sheet.replaceWith(fresh);
  }

  // --- навыки
  function renderSkills() {
    return `
      <section class="card">
        <div class="card-head"><h2>Навыки</h2><span class="power">Очки навыков<b>${S.sp}</b></span></div>
        <p class="sub">Очко навыка даётся за каждый уровень. Изученные навыки срабатывают сами, когда восстановятся. Иконки внизу сцены показывают перезарядку.</p>
      </section>
      <ul class="rows">${SKILLS.map(s => {
        const l = S.skills[s.id], open = S.level >= s.unlock, maxed = l >= SKILL_MAX;
        const btn = !open ? `<button class="buy" disabled>Ур. ${s.unlock}</button>`
          : maxed ? '<button class="buy" disabled>Максимум</button>'
          : `<button class="buy pink" data-act="learn" data-sk="${s.id}" ${S.sp > 0 ? '' : 'disabled'}>${l ? 'Улучшить' : 'Изучить'}</button>`;
        return `<li class="row"><img src="${A.miscIcon(s.icon, 64)}" alt="" style="${open ? '' : 'filter:grayscale(1) brightness(.6)'}">
          <div class="row-main"><b>${s.name}</b><span class="meta">${l ? `Ур. ${l}/${SKILL_MAX}` : open ? 'Не изучен' : `Откроется на уровне ${s.unlock}`} · перезарядка ${s.cd} с</span>
          <p>${s.desc(Math.max(1, l))}${l && !maxed ? ` Следующий уровень: ${s.desc(l + 1).replace(/^[^0-9+]*/, '').split(' ')[0]}` : ''}</p></div>${btn}</li>`;
      }).join('')}</ul>`;
  }

  // --- магазин
  function unlockedGrade() { let g = 0; B.GRADES.forEach((gr, i) => { if (gr.lvl <= S.level) g = i; }); return g; }
  function renderShop() {
    const seg = `<div class="seg" role="group" aria-label="Раздел магазина">
      <button data-act="shoptab" data-v="gear" aria-pressed="${R.shopTab === 'gear'}">Снаряжение</button>
      <button data-act="shoptab" data-v="scrolls" aria-pressed="${R.shopTab === 'scrolls'}">Свитки за кристаллы</button></div>`;
    if (R.shopTab === 'scrolls') return seg + renderScrollShop();
    const g = R.shopGrade, gr = B.GRADES[g], lvOk = S.level >= gr.lvl;
    const chips = `<div class="grade-chips" role="group" aria-label="Грейд">${B.GRADES.map((x, i) =>
      `<button class="g${i}" data-act="shopgrade" data-g="${i}" aria-pressed="${i === g}">${x.short}${S.level < x.lvl ? `<small>ур. ${x.lvl}</small>` : ''}</button>`).join('')}</div>`;
    const rows = B.SLOTS.map(sl => {
      const p = B.price(sl.id, g), st = B.itemStats(sl.id, g, 0);
      const main = Object.keys(st).map(k => `${STAT_LABEL[k]} ${statStr(k, st[k])}`).join(', ');
      const own = S.items.filter(i => i.slot === sl.id && i.g === g).length;
      const fake = { slot: sl.id, g, e: 0 };
      return `<li class="row">${tileHTML(fake, 'tabindex="-1"')}
        <div class="row-main"><b class="gtext g${g}">${B.NAMES[sl.id][g]}</b><span class="meta">${sl.name}${own ? ` · у вас: ${own}` : ''}</span><span class="val">${main}</span></div>
        ${lvOk ? `<button class="buy ${p > S.gold ? 'poor' : ''}" data-act="buyitem" data-slot="${sl.id}" data-g="${g}" data-cost="${p}"><img src="${A.miscIcon('gold', 32)}" alt="">${fmt(p)}</button>`
          : `<button class="buy" disabled>Ур. ${gr.lvl}</button>`}</li>`;
    }).join('');
    return `${seg}${chips}
      <p class="sub">${lvOk ? `${gr.label}: купленное надевается само, если оно лучше текущего. Старая вещь уходит в сумку.` : `${gr.label} откроется на уровне ${gr.lvl}.`}</p>
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
      <p class="sub">Кристаллы дают разрушенные при заточке вещи, кристаллизация из сумки и монстры. У вас <b style="color:#bfe9ff">${fmt(S.crystals)}</b> ${plural(S.crystals, CRY_W)}.</p>
      <ul class="rows">${items.map(([k, kind, bl, name, cost]) => `<li class="row">
        <img src="${A.scrollIcon(kind, g, bl)}" alt="">
        <div class="row-main"><b>${name} (${B.GRADES[g].short})</b><span class="meta">В запасе: ${S.scrolls[k][g]}</span>
        <span class="val">${bl ? 'При неудаче заточка сбрасывается до +0' : 'При неудаче выше +3 предмет разрушается'}</span></div>
        <button class="buy ${cost > S.crystals ? 'poor' : ''}" data-act="buyscroll" data-k="${k}" data-g="${g}" data-cost="${cost}" data-cur="cry"><img src="${A.miscIcon('crystal', 32)}" alt="">${fmt(cost)}</button></li>`).join('')}</ul>`;
  }
  function buyItem(slot, g) {
    const p = B.price(slot, g);
    if (S.gold < p || S.level < B.GRADES[g].lvl) { toast(S.gold < p ? 'Не хватает золота' : `Нужен уровень ${B.GRADES[g].lvl}`); return; }
    S.gold -= p;
    const it = { id: S.nextId++, slot, g, e: 0 };
    S.items.push(it);
    const curId = S.equip[slot], cur = curId && itemById(curId);
    if (!cur || itemScore(slot, g, 0) > itemScore(cur.slot, cur.g, cur.e)) { S.equip[slot] = it.id; recalc(); toast(`Надето: ${itemName(it)}`); }
    else toast(`${itemName(it)} в сумке`);
    log(`Куплено: ${itemName(it)}.`, 'sys');
    Sound.play('buy');
  }
  function buyScroll(k, g) {
    const base = k.endsWith('w') ? B.SCROLL_COST.weapon[g] : B.SCROLL_COST.armor[g];
    const cost = base * (k[0] === 'b' ? B.BLESS_MULT : 1);
    if (S.crystals < cost) { toast('Не хватает кристаллов'); return; }
    S.crystals -= cost; S.scrolls[k][g]++;
    Sound.play('buy'); toast('Свиток добавлен в запас');
  }

  // --- карта
  function renderMap() {
    const maxZ = Math.floor(S.maxStage / 10);
    const cards = [];
    for (let z = maxZ; z >= 0; z--) {
      const Z = zoneOf(z * 10), top = dropGradeTop(z);
      const stages = Array.from({ length: 10 }, (_, i) => {
        const s = z * 10 + i, open = s <= S.maxStage;
        return `<button data-act="travel" data-s="${s}" class="${s === S.stage ? 'here' : ''} ${s < S.maxStage ? 'boss-done' : ''}" ${open ? '' : 'disabled'} aria-label="Этап ${Z.z + 1}-${i + 1}">${i + 1}</button>`;
      }).join('');
      cards.push(`<section class="card zone">
        <div class="zone-art" style="background-image:url(${zoneThumb(z)})"><h3>${Z.z + 1}. ${Z.title}</h3></div>
        <div class="zone-body">
          <p class="sub">Свитки грейда <b class="gtext g${top}">${B.GRADES[top].short}</b>${top > 1 ? ` и ниже` : ''} · босс: ${Z.boss[2]}</p>
          <div class="stages">${stages}</div>
        </div></section>`);
    }
    return `<section class="card"><div class="card-head"><h2>Карта</h2><span class="power">Рекорд<b>${zoneOf(S.maxStage).num}</b></span></div>
      <p class="sub">Возвращайтесь в пройденные зоны, чтобы добывать свитки нужного грейда. Чтобы остаться на этапе, выключите «Авто» у кнопки босса.</p></section>${cards.join('')}`;
  }
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
  function travel(s) {
    if (s > S.maxStage) return;
    S.stage = s; S.kills = 0; R.boss = null; R.monsters = [];
    const z = zoneOf(s);
    log(`Переход: ${z.title}, этап ${z.num}.`, 'sys');
    updateHudStatic(); renderPanel();
  }

  /* ---------- офлайн ---------- */
  function offline() {
    const sec = Math.min(8 * 3600, (Date.now() - (S.savedAt || Date.now())) / 1000);
    if (sec < 90) return;
    const st = R.st, s = S.stage, z = zoneOf(s);
    const dps = st.atk * (1 + st.crit * (st.critDmg - 1)) * st.aspd * 1.3;
    const ttk = Math.max(1 / st.aspd, B.mHp(s) / dps) + 1.2;
    const kills = Math.floor(sec / ttk * .5);
    if (kills < 1) return;
    const gold = kills * B.mGold(s), xp = kills * B.mXp(s);
    const top = dropGradeTop(z.z);
    const roll = x => Math.floor(x) + (rnd() < x % 1 ? 1 : 0);
    const a = roll(kills * B.DROP.armorScroll), w = roll(kills * B.DROP.weaponScroll);
    const cry = Math.floor(kills * B.DROP.crystals * 2 * [1, 1, 2, 4, 8, 16, 32][top]);
    S.gold += gold; S.scrolls.a[top] += a; S.scrolls.w[top] += w; S.crystals += cry;
    gainXp(xp);
    openModal(`
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Пока вас не было">
        <div class="sheet-head"><div><h2>Пока вас не было</h2><p class="sub">${dur(sec)} героиня сражалась в зоне «${z.title}»</p></div>
          <button class="close-btn" data-act="close" aria-label="Закрыть">×</button></div>
        <dl class="compare">
          <dt>Побеждено монстров</dt><dd>${fmt(kills)}</dd><dd></dd>
          <dt>Золото</dt><dd class="up">+${fmt(gold)}</dd><dd></dd>
          <dt>Опыт</dt><dd class="up">+${fmt(xp)}</dd><dd></dd>
          <dt>Свитки доспеха ${B.GRADES[top].short}</dt><dd class="up">+${a}</dd><dd></dd>
          <dt>Свитки оружия ${B.GRADES[top].short}</dt><dd class="up">+${w}</dd><dd></dd>
          <dt>Кристаллы</dt><dd class="up">+${fmt(cry)}</dd><dd></dd>
        </dl>
        <button class="buy wide" data-act="close">Забрать</button>
      </div>`);
  }

  /* ---------- ввод ---------- */
  // покупка роста: клик — один раз, удержание — серия
  let holdTimer = 0, holdId = null, holdStart = null, holdFired = false;
  function stopHold() { clearTimeout(holdTimer); holdId = null; holdStart = null; }
  panel.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-grow]'); if (!b || b.disabled) return;
    Sound.init();
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
  panel.addEventListener('contextmenu', e => { if (e.target.closest('[data-grow]')) e.preventDefault(); });
  window.addEventListener('pointerup', () => { clearTimeout(holdTimer); holdId = null; holdStart = null; });
  window.addEventListener('pointercancel', stopHold);
  window.addEventListener('blur', stopHold);

  document.addEventListener('click', e => {
    Sound.init();
    const g = e.target.closest('[data-grow]');
    if (g) { if (holdFired) holdFired = false; else if (!g.disabled) buyGrowth(g.dataset.grow); return; }
    if (e.target === modal && modalState && !modalState.busy) { closeModal(); return; }
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    switch (act) {
      case 'mult': R.mult = b.dataset.v === 'max' ? 'max' : +b.dataset.v; renderPanel(); break;
      case 'item': openItem(+b.dataset.id); break;
      case 'slot': R.shopTab = 'gear'; R.shopGrade = unlockedGrade(); setTab('shop'); toast(`${B.SLOT[b.dataset.slot].name}: выберите в магазине`); break;
      case 'close': if (!modalState || !modalState.busy) closeModal(); break;
      case 'equip': equip(+b.dataset.id); closeModal(); renderPanel(); break;
      case 'unequip': unequip(+b.dataset.id); closeModal(); renderPanel(); break;
      case 'enchant': openEnchant(+b.dataset.id); break;
      case 'pick': if (modalState && !modalState.busy) { modalState.kind = b.dataset.v; rerenderEnchant(modalState); } break;
      case 'do-enchant': doEnchant(); break;
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
      case 'learn': {
        const s = SK[b.dataset.sk];
        if (S.sp > 0 && S.level >= s.unlock && S.skills[s.id] < SKILL_MAX) { S.sp--; S.skills[s.id]++; Sound.play('buy'); if (S.skills[s.id] === 1) log(`Изучен навык «${s.name}».`, 'good'); renderPanel(); updateHudStatic(); }
        break;
      }
      case 'shoptab': R.shopTab = b.dataset.v; renderPanel(); break;
      case 'shopgrade': R.shopGrade = +b.dataset.g; renderPanel(); break;
      case 'scrollgrade': R.scrollGrade = +b.dataset.g; renderPanel(); break;
      case 'buyitem': buyItem(b.dataset.slot, +b.dataset.g); renderPanel(); break;
      case 'buyscroll': buyScroll(b.dataset.k, +b.dataset.g); renderPanel(); break;
      case 'travel': travel(+b.dataset.s); break;
      case 'reset': $('resetZone').innerHTML = '<p class="note warn">Весь прогресс будет удалён без возможности вернуть.</p><div class="btn-row" style="width:100%"><button class="buy danger" data-act="reset-yes">Удалить прогресс</button><button class="buy ghost" data-act="reset-no">Отмена</button></div>'; break;
      case 'reset-no': renderPanel(); break;
      case 'reset-yes': applyState(newState()); S.intro = true; saveLocal(); Cloud.push(); toast('Новая игра началась'); break;
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  $('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  hud.bossBtn.addEventListener('click', () => { if (S.kills >= 10 && !R.boss) startBoss(); });
  hud.autoBtn.addEventListener('click', () => { S.autoBoss = !S.autoBoss; updateHudStatic(); toast(S.autoBoss ? 'Босс будет вызываться сам' : 'Вы остаётесь на этапе'); });
  $('stageBtn').addEventListener('click', () => setTab('map'));
  hud.soundBtn.addEventListener('click', () => { S.sound = !S.sound; Sound.init(); soundIcon(); });
  hud.skillDock.addEventListener('click', e => {
    const b = e.target.closest('[data-sk]'); if (!b) return;
    const id = b.dataset.sk, eng = (() => { const f = frontMonster(); return f && f.x <= R.heroX + 61 * R.k + 22 * R.k * (f.scale - 1); })();
    if (S.skills[id] && R.cd[id] <= 0 && !R.hero.dead && (id === 'bloom' || eng)) cast(id);
  });
  battle.addEventListener('pointerdown', () => Sound.init());

  /* ---------- запуск ---------- */
  function applyState(o) {
    S = o;
    R.monsters = []; R.boss = null; R.fx = [];
    R.st = null; recalc(); R.hero.hp = R.st.hp; R.hero.dead = 0;
    R.shopGrade = unlockedGrade();
    soundIcon(); updateHudStatic(); updateHud(); renderPanel();
  }
  function start(hot) {
    const isHot = !!(hot && hot.S);
    const local = isHot ? null : loadLocal();
    R.hadLocal = !!local;
    S = (isHot && migrate(hot.S)) || local || newState();
    if (isHot && hot.tab) R.tab = hot.tab;
    for (const el of document.querySelectorAll('[data-ic]')) el.src = A.miscIcon(el.dataset.ic, 64);
    $('icGold').src = A.miscIcon('gold', 40); $('icCry').src = A.miscIcon('crystal', 40);
    hud.skillDock.innerHTML = SKILLS.map(s => `<button class="sk locked" data-sk="${s.id}" aria-label="${s.name}"><img src="${A.miscIcon(s.icon, 64)}" alt=""></button>`).join('');
    resize();
    recalc(); R.hero.hp = R.st.hp;
    R.shopGrade = unlockedGrade();
    soundIcon(); updateHudStatic(); updateHud();
    for (const b of document.querySelectorAll('#tabs [data-tab]')) b.setAttribute('aria-selected', b.dataset.tab === R.tab ? 'true' : 'false');
    renderPanel();
    if (!isHot) {
      if (!S.intro) {
        S.intro = true;
        log('Добро пожаловать! Героиня сражается сама, а вы растите её силу.', 'good');
        log('Из монстров падают свитки заточки. Точите вещи во вкладке «Снаряжение».', 'sys');
      } else {
        log(`С возвращением! Зона «${zoneOf(S.stage).title}».`, 'sys');
        offline();
      }
    }
    new ResizeObserver(() => { resize(); if (R.tab === 'gear') setupDoll(); }).observe(battle);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { saveLocal(); Cloud.push(); } else last = performance.now(); });
    window.addEventListener('pagehide', saveLocal);
    raf = requestAnimationFrame(frame);
    Cloud.init();
    window.claude?.hot?.snapshot?.(() => ({ S, tab: R.tab }));
  }
  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? null);
})();
