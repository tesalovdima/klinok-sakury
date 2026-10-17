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
