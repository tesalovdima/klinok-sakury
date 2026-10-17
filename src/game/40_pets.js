/* ===== Питомцы: коллекция и призыв ===== */
function renderPets() {
  const seg = segHTML('petseg', R.petSeg, [['summon', 'Призыв', !hud.petDot.hidden], ['collection', `Коллекция ${petsOwnedCount()}/${B.PETS.length}`]]);
  return seg + (R.petSeg === 'summon' ? renderSummon() : renderCollection());
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
      ${!S.gacha.first10 ? `<button class="buy pink wide" data-act="summon" data-n="10" data-m="first10" data-cost="${F10}" data-cur="gem"><img src="${A.miscIcon('gem', 32)}" alt="">Первый ×10 за ${F10} · скидка</button>` : ''}
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
    const pet = pick(B.PETS.filter(p => p.r === r));
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
