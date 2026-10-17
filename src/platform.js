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
