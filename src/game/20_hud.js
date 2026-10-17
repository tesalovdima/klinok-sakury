/* ===== HUD, журнал, всплывашки, модальные окна, музыка ===== */
const hud = {};
['hLvl', 'xpFill', 'hpFill', 'hpText', 'goldText', 'gemText', 'stageNum', 'stageName', 'killFill', 'killText', 'bossBtn', 'autoBtn', 'stageRow', 'bossRow', 'bossName', 'bossFill', 'bossTime', 'skillDock', 'heroDot', 'gearDot', 'petDot', 'arenaDot', 'shopDot', 'trialDot', 'questBtn', 'questDot', 'giftBtn', 'giftDot', 'boostChip', 'boostTime', 'settingsBtn', 'gemBtn', 'heroTabLabel'].forEach(id => hud[id] = $(id));

function updateHudStatic() {
  if (!S) return;
  const z = zoneOf(S.stage);
  hud.hLvl.textContent = S.level;
  hud.stageNum.textContent = z.num;
  hud.stageName.textContent = z.title;
  hud.killText.textContent = `${Math.min(10, S.kills)}/10`;
  hud.killFill.style.width = Math.min(100, S.kills * 10) + '%';
  const ready = S.kills >= 10 && !R.boss && !R.bossPending;
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
  updateSideButtons();
}
function updateSideButtons() {
  if (!S) return;
  const q = questsReady();
  hud.questDot.hidden = !q; hud.questDot.textContent = q;
  const gift = Monet.giftReady();
  hud.giftDot.hidden = !gift;
  hud.petDot.hidden = !(S.gacha.tickets > 0 || (!S.ads.freeSummon && Monet.adsOn()) || (!S.gacha.first10 && S.gems >= B.GACHA.first10));
  hud.arenaDot.hidden = !(S.arena.tickets > 0 || S.arena.rewardDay !== dayKey());
  hud.shopDot.hidden = !(S.shop.monthlyUntil > Date.now() && S.shop.monthlyDay !== dayKey());
  hud.gearDot.hidden = !S.items.some(it => isEquipped(it) && canEnchant(it));
}
function updateHud() {
  const h = R.hero;
  hud.xpFill.style.width = clamp(S.xp / B.xpNeed(S.level) * 100, 0, 100) + '%';
  hud.hpFill.style.width = clamp(h.hp / R.st.hp * 100, 0, 100) + '%';
  hud.hpText.textContent = `${fmt(Math.max(0, h.hp))} / ${fmt(R.st.hp)}`;
  hud.goldText.textContent = fmt(S.gold);
  hud.gemText.textContent = fmt(S.gems);
  if (R.boss) {
    const m = R.boss.m;
    hud.bossFill.style.width = clamp(m.hp / m.maxHp * 100, 0, 100) + '%';
    hud.bossTime.textContent = Math.ceil(Math.max(0, R.boss.time));
    hud.bossTime.classList.toggle('low', R.boss.time < 8);
    hud.bossFill.parentElement.classList.toggle('rage', !!m.enr);
  }
  for (const el of hud.skillDock.children) {
    const s = SK[el.dataset.sk];
    const learned = S.skills[s.id] > 0;
    el.classList.toggle('locked', !learned);
    el.style.setProperty('--cd', learned ? (R.cd[s.id] / s.cd).toFixed(3) : 0);
    el.classList.toggle('ready', learned && R.cd[s.id] <= 0);
  }
  const bl = S.boost.goldUntil - Date.now();
  hud.boostChip.hidden = bl <= 0;
  if (bl > 0) hud.boostTime.textContent = left(bl);
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
