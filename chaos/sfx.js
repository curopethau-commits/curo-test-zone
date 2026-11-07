// CHAOS sound effects: Spectrum-style beeper sounds made live in the browser.
// To use recorded samples instead, put files in chaos/sfx/ named after the effect
// (cast.mp3, fail.mp3, hit.mp3, miss.mp3, die.mp3, bolt.mp3, shoot.mp3, move.mp3,
// turn.mp3, win.mp3, chat.mp3, click.mp3) and list them in SFX_FILES.
const SFX_FILES = [];

const SFX = (() => {
  let ac = null, muted = false, master = null;
  try { muted = localStorage.getItem('chaos_mute') === '1'; } catch (e) {}
  const samples = {};

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      for (const f of SFX_FILES) {
        const k = f.replace(/\.\w+$/, '');
        fetch('sfx/' + f).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(buf => { samples[k] = buf; }).catch(() => {});
      }
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  ['pointerdown', 'keydown'].forEach(e => addEventListener(e, () => ctx(), { passive: true }));

  function osc(type, f1, f2, t0, dur, vol = 0.12) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, a.currentTime + t0);
    if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), a.currentTime + t0 + dur);
    g.gain.setValueAtTime(vol, a.currentTime + t0);
    g.gain.setValueAtTime(vol, a.currentTime + t0 + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, a.currentTime + t0 + dur);
    o.connect(g); g.connect(master);
    o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.02);
  }
  function noise(t0, dur, vol = 0.15, hp = 200) {
    const a = ctx(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    // stepped noise sounds more like a beeper than smooth white noise
    let v = 0;
    for (let i = 0; i < n; i++) { if (i % 6 === 0) v = Math.random() > 0.5 ? 1 : -1; d[i] = v * (1 - i / n); }
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp;
    s.buffer = buf; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(a.currentTime + t0);
  }

  const fx = {
    click: () => osc('square', 1200, 1200, 0, 0.02, 0.06),
    move: () => { osc('square', 300, 300, 0, 0.03, 0.08); osc('square', 450, 450, 0.05, 0.03, 0.08); },
    cast: () => { for (let i = 0; i < 12; i++) osc('square', 200 + i * 90, 260 + i * 120, i * 0.045, 0.04, 0.09); },
    success: () => { [523, 659, 784, 1047].forEach((f, i) => osc('square', f, f, i * 0.07, 0.06, 0.08)); },
    fail: () => osc('sawtooth', 160, 60, 0, 0.5, 0.12),
    hit: () => { noise(0, 0.25, 0.22, 300); osc('square', 140, 50, 0, 0.2, 0.1); },
    miss: () => osc('square', 600, 200, 0, 0.12, 0.06),
    die: () => { for (let i = 0; i < 8; i++) osc('square', 900 - i * 100, 800 - i * 100, i * 0.06, 0.05, 0.1); noise(0.45, 0.3, 0.15); },
    bolt: () => { noise(0, 0.4, 0.25, 900); osc('sawtooth', 1800, 100, 0, 0.35, 0.08); },
    shoot: () => osc('square', 1400, 200, 0, 0.15, 0.08),
    turn: () => { [392, 523, 659].forEach((f, i) => osc('square', f, f, i * 0.1, 0.09, 0.08)); },
    win: () => { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => osc('square', f, f, i * 0.12, 0.1, 0.1)); },
    chat: () => { osc('square', 880, 880, 0, 0.04, 0.06); osc('square', 1320, 1320, 0.06, 0.05, 0.06); },
  };

  function play(k) {
    if (muted) return;
    const a = ctx(); if (!a) return;
    if (samples[k]) { const s = a.createBufferSource(); s.buffer = samples[k]; s.connect(master); s.start(); return; }
    fx[k] && fx[k]();
  }
  function toggle() { muted = !muted; try { localStorage.setItem('chaos_mute', muted ? '1' : '0'); } catch (e) {} return muted; }
  return { play, toggle, get muted() { return muted; } };
})();
