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
