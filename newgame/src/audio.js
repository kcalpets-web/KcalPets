/* Sound — everything is synthesised with Web Audio (no sound files): wind, waves, birds by day, crickets by night,
   a fire, thunder, and small effects for tools / sword / coins / hammer. Starts on the first tap (browser rule).
   mood(name) cross-fades the ambience · sfx(name) plays one effect · toggle() mutes (saved in localStorage ng_sound). */
let ctx = null, master = null, noiseBuf = null, on = localStorage.getItem('ng_sound') !== 'off', cur = 'day', birdT = 0, cricketT = 0;
const L = {};                                      // ambience layers: wind, waves, fire, rumble → { g: GainNode, f: BiquadFilter }
const MOODS = {                                    // gains per layer + birds / crickets on/off
  day:     { wind: .05, waves: .16, fire: 0, rumble: 0, birds: 1, crickets: 0 },
  night:   { wind: .06, waves: .14, fire: 0, rumble: 0, birds: 0, crickets: 1 },
  town:    { wind: .07, waves: .02, fire: 0, rumble: 0, birds: .6, crickets: 0 },
  forest:  { wind: .08, waves: 0, fire: 0, rumble: 0, birds: 1, crickets: 0 },
  cliff:   { wind: .12, waves: .05, fire: 0, rumble: 0, birds: .3, crickets: 0 },
  sea:     { wind: .09, waves: .2, fire: 0, rumble: 0, birds: 0, crickets: 0 },
  storm:   { wind: .16, waves: .1, fire: 0, rumble: .12, birds: 0, crickets: 0 },
  under:   { wind: 0, waves: .25, fire: 0, rumble: .05, birds: 0, crickets: 0 },
  cave:    { wind: .02, waves: .03, fire: .14, rumble: 0, birds: 0, crickets: 0 },
  silent:  { wind: 0, waves: 0, fire: 0, rumble: 0, birds: 0, crickets: 0 },
  dread:   { wind: .2, waves: 0, fire: 0, rumble: .2, birds: 0, crickets: 0 },
};
export const soundOn = () => on;
export function unlock() {
  try {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return }
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = on ? .9 : 0; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = .98 * b + .02 * w; d[i] = w * .5 + b * 3 }
    const layer = (k, type, freq, q = .7) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = .7 + Math.random() * .3; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); L[k] = { g, f } };
    layer('wind', 'bandpass', 500, .6); layer('waves', 'lowpass', 650); layer('fire', 'highpass', 1800); layer('rumble', 'lowpass', 120, 1);
    mood(cur, 0); setInterval(tick, 120);
    document.addEventListener('visibilitychange', () => { if (document.hidden) ctx.suspend(); else if (on) ctx.resume() });
  } catch (e) { ctx = null }
}
export function toggle() { on = !on; localStorage.setItem('ng_sound', on ? 'on' : 'off'); if (master) master.gain.setTargetAtTime(on ? .9 : 0, ctx.currentTime, .1); return on }
export function mood(name, fade = 1.2) {
  cur = name; if (!ctx) return; const m = MOODS[name] || MOODS.day, t = ctx.currentTime;
  for (const k in L) L[k].g.gain.setTargetAtTime(m[k] || 0, t, fade / 3);
}
/* slow life: wind gusts, waves rolling in, birds and crickets now and then */
function tick() {
  if (!ctx || ctx.state !== 'running') return; const t = ctx.currentTime, m = MOODS[cur] || MOODS.day;
  L.wind.f.frequency.setTargetAtTime(380 + Math.sin(t * .23) * 160 + Math.sin(t * .71) * 80, t, .5);
  const surge = .55 + .45 * Math.sin(t * 2 * Math.PI / 6.5) ** 2; L.waves.g.gain.setTargetAtTime((m.waves || 0) * surge, t, .4); L.waves.f.frequency.setTargetAtTime(420 + surge * 500, t, .4);
  if (m.fire) L.fire.g.gain.setTargetAtTime(m.fire * (.5 + Math.random()), t, .03);
  if (m.birds && t > birdT) { birdT = t + 1.5 + Math.random() * 4 / m.birds; bird() }
  if (m.crickets && t > cricketT) { cricketT = t + .8 + Math.random() * 1.6; cricket() }
}
const env = (g, t, a, peak, dur) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur) };
function tone(type, f0, f1, dur, peak, t = ctx.currentTime, a = .005) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, a, peak, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05) }
function noise(type, freq, dur, peak, t = ctx.currentTime, q = 1, f1 = 0) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = type; f.frequency.setValueAtTime(freq, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q; env(g, t, .004, peak, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + .05) }
function bird() { const t = ctx.currentTime, base = 2200 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) tone('sine', base * (1 + Math.random() * .2), base * (1.3 + Math.random() * .3), .07 + Math.random() * .05, .035, t + i * (.09 + Math.random() * .05)) }
function cricket() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) tone('triangle', 4300, 4250, .04, .012, t + i * .06) }
const FX = {
  chop: t => { noise('bandpass', 900, .12, .5, t, 2); tone('sine', 160, 70, .12, .4, t) },
  stone: t => { noise('bandpass', 2600, .07, .4, t, 3); tone('triangle', 300, 120, .08, .25, t) },
  grass: t => noise('highpass', 2500, .14, .25, t, .7, 6000),
  slash: t => noise('bandpass', 1200, .16, .35, t, 1.5, 4000),
  hit: t => { tone('sine', 140, 50, .16, .5, t); noise('lowpass', 600, .1, .3, t) },
  hurt: t => { tone('square', 220, 110, .14, .08, t); tone('sine', 90, 40, .2, .4, t) },
  coin: t => { tone('square', 1320, 0, .08, .06, t); tone('square', 1760, 0, .18, .06, t + .07) },
  knock: t => { tone('sine', 260, 150, .09, .45, t); noise('bandpass', 1500, .04, .25, t, 4) },
  splash: t => noise('lowpass', 1800, .45, .35, t, .7, 300),
  level: t => [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, .25, .09, t + i * .09)),
  done: t => [659, 988].forEach((f, i) => tone('triangle', f, 0, .3, .1, t + i * .12)),
  tap: t => tone('sine', 880, 660, .05, .05, t),
  thunder: t => { noise('lowpass', 900, .25, .9, t, .7, 200); noise('lowpass', 220, 2.8, .7, t + .1, 1); tone('sine', 50, 30, 2.4, .5, t + .1, .2) },
  boom: t => { noise('lowpass', 300, 2, .8, t, 1); tone('sine', 60, 28, 1.8, .6, t) },
  dive: t => { noise('lowpass', 2500, .6, .7, t, .6, 200); noise('lowpass', 400, 1.2, .3, t + .2) },
};
export function sfx(name) { if (!ctx || !on || ctx.state !== 'running' || !FX[name]) return; try { FX[name](ctx.currentTime) } catch (e) { } }
