/* ===== Звук: процедурная музыка и эффекты на Web Audio ===== */
const AUDIO = (() => {
  let ctx = null, master, comp, musicBus, musicFilter, sfxBus, delay, delayFb, delaySend, noiseBuf;
  const L = {};                                   // слои музыки: drums, bass, pad, lead, arp
  const vol = { music: .55, sfx: .75 };
  const pauses = new Set();
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended' && !pauses.size) ctx.resume().catch(() => { }); return true; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .25;
    master = ctx.createGain(); master.gain.value = .9;
    master.connect(comp); comp.connect(ctx.destination);
    musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 18000; musicFilter.Q.value = .6;
    musicBus = ctx.createGain(); musicBus.connect(musicFilter); musicFilter.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    delay = ctx.createDelay(1.5); delayFb = ctx.createGain(); delayFb.gain.value = .32;
    delaySend = ctx.createGain(); delaySend.gain.value = .28;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3200;
    delaySend.connect(delay); delay.connect(dlp); dlp.connect(delayFb); delayFb.connect(delay); dlp.connect(musicBus);
    for (const k of ['drums', 'bass', 'pad', 'lead', 'arp']) { L[k] = ctx.createGain(); L[k].connect(musicBus); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVol();
    if (pauses.size) ctx.suspend().catch(() => { });
    return true;
  }
  function applyVol() {
    if (!ctx) return;
    musicBus.gain.setTargetAtTime(vol.music * .8, ctx.currentTime, .05);
    sfxBus.gain.setTargetAtTime(vol.sfx, ctx.currentTime, .05);
  }
  function setVolume(kind, v) { vol[kind] = Math.max(0, Math.min(1, v)); applyVol(); }
  function pause(reason) { pauses.add(reason); if (ctx && ctx.state === 'running') ctx.suspend().catch(() => { }); }
  function resume(reason) { pauses.delete(reason); if (ctx && !pauses.size && ctx.state === 'suspended') ctx.resume().catch(() => { }); }
  function muffle(on) { if (ctx) musicFilter.frequency.setTargetAtTime(on ? 1100 : 18000, ctx.currentTime, .25); }

  /* ---------- инструменты ---------- */
  function voice(t, midi, dur, o, out) {
    const f = mtof(midi), g = ctx.createGain();
    const v = o.vol, a = o.a ?? .005, dcy = o.d ?? .12, sus = o.s ?? .6, rel = o.r ?? .08;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setTargetAtTime(v * sus, t + a, dcy / 3);
    g.gain.setTargetAtTime(0, t + dur, rel / 3);
    let node = g;
    if (o.cut) {
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = o.q ?? 1;
      fl.frequency.setValueAtTime(o.cut * (o.env ? 2.2 : 1), t); if (o.env) fl.frequency.setTargetAtTime(o.cut, t, .08);
      fl.connect(g); node = fl;
    }
    const n = o.voices || 1, stop = t + dur + rel * 2 + .05;
    for (let i = 0; i < n; i++) {
      const osc = ctx.createOscillator(); osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(f, t);
      if (n > 1) osc.detune.value = (i - (n - 1) / 2) * (o.spread || 12);
      if (o.vib) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + .25); lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(stop); }
      const og = ctx.createGain(); og.gain.value = 1 / n; osc.connect(og); og.connect(node);
      osc.start(t); osc.stop(stop);
    }
    g.connect(out);
    if (o.send) g.connect(delaySend);
  }
  function bell(t, midi, dur, volume, out, send) {
    const f = mtof(midi), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine'; car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * .05, t + .6);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(volume, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + Math.max(.4, dur * 2));
    car.connect(g); g.connect(out); if (send) g.connect(delaySend);
    const stop = t + Math.max(.4, dur * 2) + .05; car.start(t); mod.start(t); car.stop(stop); mod.stop(stop);
  }
  function noise(t, dur, volume, type, freq, q, out) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q || .7;
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  function kick(t, v = .9) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .32);
    o.connect(g); g.connect(L.drums); o.start(t); o.stop(t + .35);
  }
  const snare = (t, v = .45) => { noise(t, .16, v, 'bandpass', 1900, .8, L.drums); voice(t, 52, .05, { type: 'triangle', vol: v * .6, d: .05, s: 0, r: .04 }, L.drums); };
  const hat = (t, v = .14, open = false) => noise(t, open ? .14 : .035, v, 'highpass', 7500, .7, L.drums);
  const crash = (t, v = .16) => noise(t, 1.2, v, 'highpass', 5000, .5, L.drums);

  /* ---------- темы ---------- */
  const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], hmin: [0, 2, 3, 5, 7, 8, 11] };
  const CH = { M: [0, 4, 7], m: [0, 3, 7] };
  const THEMES = {
    menu:   { bpm: 92,  root: 55, mode: 'maj',  prog: [[5, 'M'], [7, 'M'], [4, 'm'], [9, 'm']], lead: 'bell',   drums: 0, arp: 1, seed: 11 },
    z0:     { bpm: 124, root: 53, mode: 'maj',  prog: [[5, 'M'], [7, 'M'], [4, 'm'], [9, 'm']], lead: 'square', drums: 1, arp: 1, seed: 3 },
    z1:     { bpm: 112, root: 57, mode: 'min',  prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], lead: 'tri',   drums: 1, arp: 1, seed: 7 },
    z2:     { bpm: 118, root: 50, mode: 'hmin', prog: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'M']], lead: 'saw',   drums: 1, arp: 0, seed: 13 },
    z3:     { bpm: 128, root: 52, mode: 'min',  prog: [[0, 'm'], [10, 'M'], [8, 'M'], [10, 'M']], lead: 'bell', drums: 1, arp: 1, seed: 17 },
    z4:     { bpm: 140, root: 48, mode: 'min',  prog: [[0, 'm'], [10, 'M'], [8, 'M'], [7, 'M']], lead: 'saw',   drums: 2, arp: 0, seed: 19 },
    z5:     { bpm: 132, root: 54, mode: 'hmin', prog: [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M']], lead: 'square', drums: 1, arp: 1, seed: 23 },
    boss:   { bpm: 158, root: 52, mode: 'hmin', prog: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'M']], lead: 'saw',   drums: 2, arp: 0, seed: 29, bass16: true },
    arena:  { bpm: 150, root: 50, mode: 'min',  prog: [[0, 'm'], [10, 'M'], [8, 'M'], [10, 'M']], lead: 'square', drums: 2, arp: 0, seed: 31, bass16: true },
    summon: { bpm: 100, root: 60, mode: 'maj',  prog: [[0, 'M'], [5, 'M'], [9, 'm'], [7, 'M']], lead: 'bell',   drums: 0, arp: 1, seed: 37 },
  };
  const RHYTHMS = [
    [0, 4, 6, 8, 12], [0, 2, 4, 8, 10, 12, 14], [0, 3, 6, 8, 12, 14], [0, 4, 8, 10, 12],
    [0, 2, 4, 6, 8, 12], [0, 6, 8, 12, 14], [0, 3, 4, 8, 11, 12],
  ];
  function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

  // мелодия на 8 тактов: A A' B A'' с опорой на аккорды
  function compose(th) {
    const r = rng(th.seed), sc = SCALES[th.mode], lo = th.root + 12, hi = th.root + 26;
    const degreeNotes = []; for (let o = 0; o < 3; o++) for (const d of sc) degreeNotes.push(th.root + o * 12 + d);
    const inRange = degreeNotes.filter(n => n >= lo && n <= hi);
    const nearest = (target, pool) => pool.reduce((b, n) => Math.abs(n - target) < Math.abs(b - target) ? n : b, pool[0]);
    let prev = nearest(th.root + 19, inRange);
    const makeBar = (bi, rhythm) => {
      const [cr, cq] = th.prog[bi % 4], chordPcs = CH[cq].map(x => (th.root + cr + x) % 12);
      const chordPool = inRange.filter(n => chordPcs.includes(n % 12));
      const notes = [];
      rhythm.forEach((pos, i) => {
        let n;
        if (pos === 0 || pos === 8) n = nearest(prev + (r() < .5 ? -2 : 2), chordPool);
        else { const idx = inRange.indexOf(nearest(prev, inRange)); n = inRange[Math.max(0, Math.min(inRange.length - 1, idx + Math.round((r() - .5) * 4)))]; }
        const next = rhythm[i + 1] ?? 16;
        notes.push({ pos, n, len: Math.max(1, next - pos) });
        prev = n;
      });
      return notes;
    };
    const rA = RHYTHMS[Math.floor(r() * RHYTHMS.length)], rB = RHYTHMS[Math.floor(r() * RHYTHMS.length)];
    const bars = [];
    bars[0] = makeBar(0, rA); bars[1] = makeBar(1, rB); bars[2] = makeBar(2, rA); bars[3] = makeBar(3, [0, 4, 8]);
    bars[4] = bars[0]; bars[5] = makeBar(1, rA); bars[6] = makeBar(2, rB);
    const [cr] = th.prog[3]; const end = nearest(th.root + 12 + cr + 12, inRange);
    bars[7] = [{ pos: 0, n: nearest(end + 2, inRange), len: 4 }, { pos: 4, n: end, len: 12 }];
    return bars;
  }

  let cur = null, pending = null, timer = 0, stopped = true;
  function play(id) {
    if (!init()) return;
    const th = THEMES[id]; if (!th) return;
    if (cur && cur.id === id && !pending) return;
    if (pending && pending.id === id) return;
    const next = { id, th, bars: th.bars || (th.bars = compose(th)), bar: 0, step: 0 };
    if (!cur) { cur = next; cur.time = ctx.currentTime + .08; layerTargets(cur, true); }
    else pending = next;
    if (stopped) { stopped = false; clearInterval(timer); timer = setInterval(tick, 25); }
  }
  function stop() { stopped = true; clearInterval(timer); cur = null; pending = null; }
  function layerTargets(s, now) {
    const t = now ? ctx.currentTime : s.time;
    const set = (k, v) => L[k].gain.setTargetAtTime(v, t, .05);
    set('drums', s.th.drums ? 1 : 0); set('bass', 1); set('pad', 1); set('lead', 1); set('arp', s.th.arp ? 1 : 0);
  }
  function tick() {
    if (!ctx || ctx.state !== 'running' || !cur) return;
    const ahead = ctx.currentTime + .14;
    if (cur.time < ctx.currentTime - .5) cur.time = ctx.currentTime + .05;
    while (cur.time < ahead) {
      const quick = pending && (pending.id === 'boss' || pending.id === 'arena');
      if (pending && (cur.step === 0 || (quick && cur.step % 4 === 0))) {
        pending.time = cur.time; cur = pending; pending = null; layerTargets(cur, false);
        if (cur.th.drums) crash(cur.time, .14);
      }
      step(cur, cur.time);
      cur.time += 60 / cur.th.bpm / 4;
      cur.step++;
      if (cur.step >= 16) { cur.step = 0; cur.bar = (cur.bar + 1) % 8; }
    }
  }
  function step(s, t) {
    const th = s.th, st = s.step, bar = s.bar, [cr, cq] = th.prog[bar % 4];
    const chord = CH[cq].map(x => th.root + cr + x);
    const sixteenth = 60 / th.bpm / 4;
    // ударные
    if (th.drums) {
      const fill = bar === 7 && st >= 12;
      if (th.drums === 2) {
        if (st % 4 === 0) kick(t);
        if (st === 4 || st === 12) snare(t);
        if (fill) snare(t, .3);
        hat(t, st % 2 ? .07 : .12, st % 4 === 2);
      } else {
        if (st === 0 || st === 8 || (st === 10 && bar % 2)) kick(t, .8);
        if (st === 4 || st === 12) snare(t, .38);
        if (fill && st % 2) snare(t, .26);
        if (st % 2 === 0) hat(t, st % 4 === 2 ? .11 : .07, st === 14);
      }
      if (st === 0 && bar === 0) crash(t, .12);
    }
    // бас
    const bRoot = th.root - 12 + cr;
    if (th.bass16) { if (st % 2 === 0 || th.drums === 2) voice(t, bRoot + (st % 8 === 6 ? 12 : 0), sixteenth * .9, { type: 'sawtooth', vol: .2, cut: 700, q: 2, env: true, d: .08, s: .5, r: .04 }, L.bass); }
    else if (th.drums) { if (st % 2 === 0) voice(t, bRoot + (st % 4 === 2 ? 12 : 0), sixteenth * 1.7, { type: 'square', vol: .13, cut: 900, env: true, d: .1, s: .5, r: .05 }, L.bass); }
    else if (st === 0 || st === 8) voice(t, bRoot, sixteenth * 7, { type: 'triangle', vol: .28, a: .02, d: .4, s: .7, r: .2 }, L.bass);
    // аккорды
    if (th.drums) {
      if ([0, 3, 6, 10, 12].includes(st)) for (const n of chord) voice(t, n + 12, sixteenth * (st === 12 ? 3.5 : 2), { type: 'sawtooth', vol: .05, cut: 2400, env: true, voices: 2, spread: 14, d: .1, s: .55, r: .1 }, L.pad);
    } else if (st === 0) for (const n of chord) voice(t, n + 12, sixteenth * 15, { type: 'sawtooth', vol: .045, a: .25, cut: 1500, voices: 2, spread: 16, d: .8, s: .8, r: .6 }, L.pad);
    // арпеджио
    if (th.arp) {
      const seq = [0, 1, 2, 1], n = chord[seq[st % 4]] + 24 + (st >= 8 ? 0 : 0);
      if (th.drums || st % 2 === 0) bell(t, n, sixteenth, th.drums ? .035 : .05, L.arp, true);
    }
    // мелодия
    for (const nt of s.bars[bar]) if (nt.pos === st) {
      const dur = nt.len * sixteenth * .92;
      if (th.lead === 'bell') bell(t, nt.n + 12, dur, .1, L.lead, true);
      else if (th.lead === 'tri') voice(t, nt.n + 12, dur, { type: 'triangle', vol: .22, a: .01, d: .2, s: .7, r: .12, vib: dur > .3, send: true }, L.lead);
      else if (th.lead === 'saw') voice(t, nt.n + 12, dur, { type: 'sawtooth', vol: .1, cut: 3200, q: 1.5, env: true, voices: 2, spread: 10, d: .2, s: .7, r: .1, vib: dur > .3, send: true }, L.lead);
      else voice(t, nt.n + 12, dur, { type: 'square', vol: .08, cut: 3800, d: .15, s: .7, r: .08, vib: dur > .3, send: true }, L.lead);
    }
  }

  /* ---------- звуковые эффекты ---------- */
  let lastHit = 0;
  function sfx(type) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime, o = sfxBus;
    const tone = (f, at, dur, wave, v, f2) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = wave; osc.frequency.setValueAtTime(f, t + at); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
      g.gain.setValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
      osc.connect(g); g.connect(o); osc.start(t + at); osc.stop(t + at + dur + .02);
    };
    const hiss = (at, dur, v, f, type = 'bandpass') => noise(t + at, dur, v, type, f, .8, o);
    switch (type) {
      case 'hit': if (t - lastHit < .06) return; lastHit = t; hiss(0, .09, .12, 2400); tone(180, 0, .08, 'triangle', .05, 90); break;
      case 'crit': hiss(0, .14, .16, 3200); tone(520, 0, .12, 'square', .03, 260); break;
      case 'coin': tone(1320, 0, .07, 'square', .018); tone(1760, .06, .1, 'square', .018); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .2, 'triangle', .06)); break;
      case 'warning': for (let i = 0; i < 3; i++) { tone(880, i * .32, .14, 'square', .05, 660); tone(440, i * .32 + .14, .14, 'square', .04, 330); } break;
      case 'land': tone(90, 0, .45, 'sine', .35, 30); hiss(0, .5, .25, 300, 'lowpass'); break;
      case 'windup': tone(200, 0, .8, 'sawtooth', .04, 900); break;
      case 'slam': tone(70, 0, .4, 'sine', .3, 30); hiss(0, .35, .2, 600, 'lowpass'); break;
      case 'shot': hiss(0, .25, .12, 1200); tone(600, 0, .2, 'sawtooth', .03, 200); break;
      case 'rage': tone(110, 0, .7, 'sawtooth', .07, 55); hiss(0, .6, .12, 500); break;
      case 'victory': [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, i * .09, .3, 'square', .04); tone(f / 2, i * .09, .3, 'triangle', .05); }); break;
      case 'skill': hiss(0, .25, .1, 1200); tone(880, 0, .2, 'sine', .05, 1760); break;
      case 'explode': hiss(0, .5, .35, 180); tone(70, 0, .4, 'sine', .12, 32); break;
      case 'thunder': hiss(0, .3, .2, 600); break;
      case 'buff': [392, 523, 659].forEach((f, i) => tone(f, i * .06, .25, 'sine', .05)); break;
      case 'charge': tone(220, 0, 1.1, 'sine', .04, 880); break;
      case 'success': [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .07, .3, 'triangle', .07)); break;
      case 'fail': hiss(0, .5, .2, 900); tone(330, 0, .5, 'sawtooth', .05, 80); break;
      case 'buy': tone(988, 0, .06, 'square', .03); tone(1319, .05, .08, 'square', .03); break;
      case 'click': tone(1200, 0, .03, 'square', .015); break;
      case 'pet': tone(1568, 0, .08, 'sine', .04, 2093); break;
      case 'orb': tone(660, 0, .5, 'sine', .05, 1320); hiss(0, .4, .05, 4000, 'highpass'); break;
      case 'reveal': [1047, 1319, 1568].forEach((f, i) => tone(f, i * .05, .25, 'triangle', .05)); break;
      case 'legend': [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => { tone(f, i * .07, .5, 'triangle', .06); tone(f * 1.5, i * .07 + .02, .4, 'sine', .03); }); hiss(0, 1.2, .08, 6000, 'highpass'); break;
    }
  }

  const probe = () => { if (!ctx) return null; const an = ctx.createAnalyser(); an.fftSize = 2048; comp.connect(an); return an; };
  return { probe, init, play, stop, sfx, setVolume, vol, pause, resume, muffle, get current() { return cur && cur.id; }, get ready() { return !!ctx; } };
})();
