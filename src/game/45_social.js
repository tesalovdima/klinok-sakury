/* ===== Чат и рейтинг игроков (свой сервер, /api) ===== */
const Social = {
  chat: [], lastId: 0, board: [], at: 0, busy: false, state: 'idle',
  async push() {
    if (!S || !S.hero) return;
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; return; }
    await NET.boardPush({
      pid: S.pid, name: heroName(), stage: S.maxStage, best: S.bestStage || 0,
      level: S.level, power: Math.round(R.power), rating: S.arena.rating,
    });
    this.at = Date.now();
    this.state = 'online';
  },
  async sync(force) {
    if (!S || !S.hero) return;
    if (!force && Date.now() - this.at < 45000) return;
    await this.push();
    Arena.netPush();
  },
  async loadChat() {
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; paintChat(); return; }
    this.state = 'online';
    const r = await NET.chatList(this.lastId);
    if (r && Array.isArray(r.messages)) {
      for (const m of r.messages) if (!this.chat.some(x => x.id === m.id)) this.chat.push(m);
      this.chat = this.chat.slice(-80);
      for (const m of this.chat) this.lastId = Math.max(this.lastId, m.id || 0);
      paintChat();
    }
  },
  async send() {
    if (this.busy) return;
    const inp = $('chatInput'); if (!inp) return;
    const text = (inp.value || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!text) return;
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; paintChat(); toast('Нет связи с сервером'); return; }
    this.busy = true;
    inp.disabled = true;
    const r = await NET.chatSend(S.pid, heroName(), text);
    this.busy = false;
    if (inp) { inp.disabled = false; }
    if (!r || !r.ok) {
      toast(r && r.error === 'slow' ? 'Слишком часто: подождите пару секунд' : 'Не удалось отправить');
      return;
    }
    inp.value = '';
    if (r.message) { this.chat.push(r.message); this.chat = this.chat.slice(-80); this.lastId = Math.max(this.lastId, r.message.id || 0); paintChat(); }
    inp.focus({ preventScroll: true });
  },
  async loadBoard() {
    const ok = await NET.probe();
    if (!ok) { this.state = 'offline'; paintBoard(); return; }
    this.state = 'online';
    await this.push();
    const r = await NET.boardTop();
    if (r && Array.isArray(r.top)) { this.board = r.top; paintBoard(); }
  },
  enter() {
    if (R.socialSeg === 'chat') this.loadChat();
    else this.loadBoard();
  },
};

function timeHM(ts) {
  const d = new Date((ts || 0) * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function renderSocial() {
  const seg = segHTML('socialseg', R.socialSeg, [['chat', 'Чат'], ['board', 'Рейтинг']]);
  if (!unlockOk('chat')) return seg + lockCard('chat', 'Чат и рейтинг');
  return seg + (R.socialSeg === 'chat' ? renderChatPanel() : renderBoardPanel());
}
function renderChatPanel() {
  return `
    <section class="card chat-card">
      <div class="card-head"><h3>Чат</h3><span class="sub" id="chatState">${NET.online ? 'онлайн' : 'соединение…'}</span></div>
      <ul class="chat-list" id="chatList" aria-live="polite"></ul>
      <div class="chat-input">
        <input id="chatInput" maxlength="200" autocomplete="off" placeholder="Сообщение игрокам…" aria-label="Сообщение">
        <button class="buy pink small" data-act="chat-send">Отправить</button>
      </div>
      <p class="note">Имя в чате — имя героя. Будьте вежливы: сообщения видят все.</p>
    </section>`;
}
function renderBoardPanel() {
  return `
    <section class="card">
      <div class="card-head"><h3>Рейтинг игроков</h3><button class="link-btn" data-act="board-refresh">Обновить</button></div>
      <ol class="board server-board" id="boardList"><li class="board-empty">Загрузка…</li></ol>
      <p class="note">Сортировка по рекордному этапу, затем по мощи. Ваша строка подсвечена.</p>
    </section>`;
}
function paintChat() {
  const el = $('chatList'); if (!el) return;
  const st = $('chatState');
  if (st) st.textContent = Social.state === 'offline' ? 'нет связи с сервером' : 'онлайн';
  if (!Social.chat.length) {
    el.innerHTML = `<li class="chat-empty">${Social.state === 'offline' ? 'Чат доступен на сервере игры.' : 'Пока тихо — напишите первым.'}</li>`;
    return;
  }
  el.innerHTML = '';
  for (const m of Social.chat) {
    const li = document.createElement('li');
    if (m.pid && m.pid === S.pid) li.className = 'me';
    const head = document.createElement('div');
    head.className = 'chat-head';
    const b = document.createElement('b'); b.textContent = m.name || 'Игрок';
    const t = document.createElement('span'); t.className = 't'; t.textContent = timeHM(m.ts);
    head.append(b, t);
    const p = document.createElement('p'); p.textContent = m.text || '';
    li.append(head, p);
    el.append(li);
  }
  el.scrollTop = el.scrollHeight;
}
function paintBoard() {
  const el = $('boardList'); if (!el) return;
  if (Social.state === 'offline') { el.innerHTML = '<li class="board-empty">Рейтинг доступен на сервере игры.</li>'; return; }
  if (!Social.board.length) { el.innerHTML = '<li class="board-empty">Пока нет игроков.</li>'; return; }
  el.innerHTML = '';
  Social.board.forEach((p, i) => {
    const li = document.createElement('li');
    if (p.pid === S.pid) li.className = 'me';
    const place = document.createElement('span'); place.className = 'place'; place.textContent = i + 1;
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name || 'Игрок';
    const lg = document.createElement('span'); lg.className = 'lg'; lg.textContent = `ур. ${p.level || 1}`;
    const b = document.createElement('b'); b.textContent = p.stage ? `${Math.floor(p.stage / 10) + 1}-${p.stage % 10 + 1}` : '—';
    li.append(place, nm, lg, b);
    el.append(li);
  });
}
