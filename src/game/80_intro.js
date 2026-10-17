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
  recalc(); updateHudStatic(); renderPanel(); saveLocal(); Cloud.push();
  Arena.lastPush = 0; Arena.push();
  if (first) {
    S.intro = true;
    if (S.stats.kills > 0) {
      log(`С возвращением, ${name}! Появились питомцы, арена, задания и пропуск сезона.`, 'good');
      log('Загляните в «Задания»: там подарок за вход и награды за достижения.', 'sys');
    } else {
      log(`Добро пожаловать, ${name}! ${G('Героиня сражается', 'Герой сражается')} сам${G('а', '')}, а вы растите силу.`, 'good');
      log('Из монстров падают свитки заточки. Точите вещи во вкладке «Снаряжение».', 'sys');
    }
    banner(name, 'Путь начинается', '#ff8fc1');
    P.gameplay(true);
    if (R.pendingOffline) { R.pendingOffline = false; offline(); }
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
