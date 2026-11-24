// Everything you hear is synthesised here with Web Audio. No sound files.

export function makeAudio() {
  let ctx = null, master, musicGain, staticGain, windGain, noiseBuf;
  let nextNote = 0, noteIdx = 0, nextTannoy = 28, started = false;

  // A small music-box waltz written for this park. It never quite resolves.
  const E = 329.63;
  const st = (n) => E * Math.pow(2, n / 12);
  const tune = [0, 7, 12, 7, 3, 7, 12, 15, 14, 10, 7, 10, 2, 7, 10, 14, 12, 8, 5, 8, 0, 5, 8, 12, 11, 7, 3, 7, -1, 3, 7, null];

  function noise(seconds) {
    const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function loopNoise() {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true; s.start();
    return s;
  }

  function start() {
    if (started) return;
    started = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { return; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    noiseBuf = noise(3);

    // low drone: two saws beating against each other, and a fifth that drifts
    const droneG = ctx.createGain(); droneG.gain.value = 0.085;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190;
    for (const fq of [48.9, 49.6, 73.1]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; o.connect(lp); o.start();
      const l = ctx.createOscillator(); l.frequency.value = 0.03 + Math.random() * 0.05;
      const lg = ctx.createGain(); lg.gain.value = 0.5; l.connect(lg); lg.connect(o.frequency); l.start();
    }
    lp.connect(droneG); droneG.connect(master);

    // wind
    windGain = ctx.createGain(); windGain.gain.value = 0.05;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.6;
    loopNoise().connect(bp); bp.connect(windGain); windGain.connect(master);
    const wl = ctx.createOscillator(); wl.frequency.value = 0.07;
    const wlg = ctx.createGain(); wlg.gain.value = 160; wl.connect(wlg); wlg.connect(bp.frequency); wl.start();
    const wl2 = ctx.createOscillator(); wl2.frequency.value = 0.11;
    const wl2g = ctx.createGain(); wl2g.gain.value = 0.03; wl2.connect(wl2g); wl2g.connect(windGain.gain); wl2.start();

    // radio static that rises near the cages
    staticGain = ctx.createGain(); staticGain.gain.value = 0;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    loopNoise().connect(hp); hp.connect(staticGain); staticGain.connect(master);

    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    nextNote = ctx.currentTime + 2;
    nextTannoy = ctx.currentTime + 26;
  }

  function ping(freq, when, g = 0.2) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), e = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    const wow = 1 + Math.sin(when * 0.9) * 0.012; // a tired spring
    o.frequency.value = freq * wow; o2.frequency.value = freq * 3.01 * wow;
    e.gain.setValueAtTime(0, when);
    e.gain.linearRampToValueAtTime(g, when + 0.008);
    e.gain.exponentialRampToValueAtTime(0.0006, when + 1.5);
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    o.connect(e); o2.connect(g2); g2.connect(e); e.connect(musicGain);
    o.start(when); o2.start(when); o.stop(when + 1.6); o2.stop(when + 1.6);
  }

  function burst(dur, freq, gain, type = 'bandpass', q = 1) {
    if (!ctx) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const e = ctx.createGain(); const t = ctx.currentTime;
    e.gain.setValueAtTime(gain, t); e.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(e); e.connect(master);
    s.start(t, Math.random() * 2, dur + 0.05);
  }

  const lines = [
    'Welcome to Wonderpaw Kingdom, where everyone is an animal. Please remember',
    'Feeding time is three o clock. It is always three o clock. The animals',
    'Would the owner of the blue pram please return to the',
    'The park is now closing. The park is now open. Please do not answer the',
    'A reminder to our guests. There are four enclosures. There have only ever been',
  ];
  function tannoy(text, cutAfter = 3.4) {
    if (!ctx) return;
    burst(0.5, 1800, 0.12, 'bandpass', 2);
    // two-tone chime, slightly flat
    for (const [fq, off] of [[659, 0.25], [523, 0.75]]) {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.frequency.value = fq * 0.985; const t = ctx.currentTime + off;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.05, t + 0.02); e.gain.exponentialRampToValueAtTime(0.0005, t + 0.9);
      o.connect(e); e.connect(master); o.start(t); o.stop(t + 1);
    }
    try {
      const synth = window.speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance(text || lines[(Math.random() * lines.length) | 0]);
        u.rate = 0.82; u.pitch = 1.5; u.volume = 0.45;
        setTimeout(() => synth.speak(u), 1300);
        // cut off mid-word
        setTimeout(() => { synth.cancel(); burst(0.25, 2600, 0.15, 'highpass'); }, 1300 + cutAfter * 1000);
      }
    } catch (_) { /* no voice available: the chime and crackle still play */ }
  }

  function clang() {
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const [fq, g, d] of [[212, 0.3, 1.8], [347, 0.2, 1.4], [589, 0.16, 1.1], [911, 0.1, 0.8], [1433, 0.07, 0.5]]) {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = 'square'; o.frequency.value = fq;
      e.gain.setValueAtTime(g * 0.5, t); e.gain.exponentialRampToValueAtTime(0.0005, t + d);
      o.connect(e); e.connect(master); o.start(t); o.stop(t + d + 0.1);
    }
    burst(0.3, 900, 0.4, 'bandpass', 0.7);
  }

  function update(s) {
    if (!ctx) return;
    const now = ctx.currentTime;
    // the music box sits in the clock tower: louder near the hub, but never loud
    const mg = 0.5 * Math.max(0.05, 1 - s.hubDist / 24);
    musicGain.gain.setTargetAtTime(mg, now, 0.6);
    staticGain.gain.setTargetAtTime(Math.min(0.11, s.staticAmt * 0.11), now, 0.3);
    while (nextNote < now + 0.3) {
      const n = tune[noteIdx % tune.length];
      if (n !== null) {
        ping(st(n), nextNote, 0.16);
        if (noteIdx % 3 === 0) ping(st(n - 12), nextNote, 0.1);
      }
      noteIdx++;
      // it slows, hangs on a note, then picks up again
      const drag = 1 + 0.45 * Math.max(0, Math.sin(noteIdx * 0.09));
      nextNote += 0.46 * drag * (noteIdx % 32 === 0 ? 4 : 1);
    }
    if (s.stepped) burst(0.09, 220 + Math.random() * 120, 0.16, 'lowpass');
    if (now > nextTannoy) {
      tannoy();
      nextTannoy = now + 50 + Math.random() * 40;
    }
  }

  return { start, update, tannoy, clang, burst, get running() { return !!ctx; } };
}
