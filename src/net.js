/* ===== Сеть: чат, рейтинг и реальные соперники на своём сервере =====
   Работает, только если страница отдана сервером с /api. На Яндекс Играх
   и локально без бэкенда все методы возвращают null, игра остаётся офлайновой. */
const NET = (() => {
  let online = false, checkedAt = 0, pending = null;

  function url(path) {
    const base = (typeof location !== 'undefined' && location.origin && location.origin !== 'null') ? '' : '';
    return base + path;
  }
  async function req(path, opts = {}, ms = 5000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url(path), {
        cache: 'no-store',
        headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
        method: opts.method || 'GET',
        body: opts.body,
        signal: ctl.signal,
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
    finally { clearTimeout(t); }
  }
  async function probe(force) {
    if (!force && pending) return pending;
    if (!force && Date.now() - checkedAt < 30000) return online;
    checkedAt = Date.now();
    pending = (async () => {
      const r = await req('/api/health', {}, 3000);
      online = !!(r && r.ok);
      pending = null;
      return online;
    })();
    return pending;
  }
  return {
    probe,
    get online() { return online; },
    chatList: since => req('/api/chat' + (since ? `?since=${encodeURIComponent(since)}` : '')),
    chatSend: (pid, name, text) => req('/api/chat', { method: 'POST', body: JSON.stringify({ pid, name, text }) }),
    boardTop: () => req('/api/board'),
    boardPush: p => req('/api/board', { method: 'POST', body: JSON.stringify(p) }),
    arenaList: (pid, rating, power) => req(`/api/arena?pid=${encodeURIComponent(pid)}&rating=${Math.round(rating)}&power=${Math.round(power)}`),
    arenaPush: p => req('/api/arena', { method: 'POST', body: JSON.stringify(p) }),
    worldGet: pid => req('/api/world?pid=' + encodeURIComponent(pid)),
    worldHit: p => req('/api/world', { method: 'POST', body: JSON.stringify(p) }),
    worldClaim: pid => req('/api/world/claim', { method: 'POST', body: JSON.stringify({ pid }) }),
  };
})();
