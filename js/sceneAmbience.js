/** Sahne ortam sesleri — yumuşak, kulak yormayan */

let masterGain = null;
let masterTargetVol = 1;
let timers = [];
let activeNodes = [];
let currentScene = null;
let boundScene = null;
let pendingTimeouts = [];

const TRACKS = new Set(['sky', 'phone', 'concert', 'meyhane', 'openAir', 'finale']);

function getContext(scene) {
  const game = scene?.sys?.game ?? scene?.game;
  return scene?.sound?.context ?? game?.sound?.context ?? null;
}

async function resumeContext(ctx) {
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) { /* ignore */ }
  }
  return ctx.state === 'running';
}

function createBus(ctx, vol = 1) {
  const bus = ctx.createGain();
  bus.gain.value = vol;
  bus.connect(ctx.destination);
  return bus;
}

function ensureMaster(ctx, vol = 1) {
  masterTargetVol = vol;
  masterGain = ctx.createGain();
  masterGain.gain.value = vol;
  masterGain.connect(ctx.destination);
  return masterGain;
}

export function refreshMasterGain() {
  if (!masterGain) return;
  const ctx = masterGain.context;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.value = masterTargetVol;
}

function playTone(ctx, master, opts) {
  const {
    freq,
    type = 'sine',
    vol = 0.08,
    attack = 0.02,
    decay = 0.2,
    detune = 0,
    freqEnd = null,
  } = opts;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 40), t + attack + decay);
  }
  osc.detune.value = detune;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
  activeNodes.push({ node: osc });
}

/** Uzun, yumuşak gürültü — tıkırtı değil uğultu */
function playSwell(ctx, master, opts) {
  const {
    dur = 2.2,
    vol = 0.08,
    filterFreq = 340,
    filterQ = 0.35,
    attack = 0.35,
    filterType = 'lowpass',
  } = opts;
  const t = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const g = ctx.createGain();
  const hold = Math.max(0.1, dur - attack * 2);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol * 0.85, t + attack + hold * 0.4);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
  activeNodes.push({ node: src });
}

function trackTimer(scene, fn, delay, loop = false) {
  const event = loop
    ? scene.time.addEvent({ delay, loop: true, callback: fn })
    : scene.time.delayedCall(delay, fn);
  timers.push(event);
  return event;
}

function sceneDelay(scene, fn, ms) {
  if (scene?.time) {
    trackTimer(scene, fn, ms);
    return;
  }
  pendingTimeouts.push(setTimeout(fn, ms));
}

/** Seyrek, hafif yıldız pırıltısı — tek ince ton */
function playSoftSparkle(ctx, master) {
  const freqs = [784, 880, 988, 1046];
  const f = freqs[Phaser.Math.Between(0, freqs.length - 1)];
  playTone(ctx, master, {
    freq: f,
    vol: 0.045,
    decay: 0.7,
    attack: 0.04,
    type: 'sine',
  });
}

function scheduleSoftSparkle(scene, ctx, master, sceneKey = 'sky') {
  const run = () => {
    if (currentScene !== sceneKey) return;
    if (Math.random() > 0.35) {
      playSoftSparkle(ctx, master);
    }
    trackTimer(scene, run, Phaser.Math.Between(4200, 9000));
  };
  trackTimer(scene, run, Phaser.Math.Between(2500, 5000));
}

/** Tezahürat — uzun kalabalık uğultusu, alkış tıkırtısı yok */
function playCheer(ctx, master, intensity = 1, scene = boundScene) {
  playSwell(ctx, master, {
    dur: 2.8 * intensity,
    vol: 0.1 * intensity,
    filterFreq: 280,
    attack: 0.45,
  });

  sceneDelay(scene, () => {
    playSwell(ctx, master, {
      dur: 2.2 * intensity,
      vol: 0.08 * intensity,
      filterFreq: 420,
      attack: 0.3,
    });
  }, 180);

  sceneDelay(scene, () => {
    playSwell(ctx, master, {
      dur: 1.8 * intensity,
      vol: 0.06 * intensity,
      filterFreq: 520,
      attack: 0.2,
      filterType: 'bandpass',
    });
  }, 600);
}

function startLoopNoise(ctx, master, opts) {
  const { vol, filterFreq, filterQ = 0.4, filterType = 'lowpass', highpass = null } = opts;
  const len = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  let node = src;
  if (highpass) {
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = highpass;
    hp.Q.value = 0.25;
    src.connect(hp);
    node = hp;
  }
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const g = ctx.createGain();
  g.gain.value = vol;
  node.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start();
  activeNodes.push({ node: src, looping: true });
}

function startSkyAmbience() {
  /* Gökyüzünde arka plan sesi yok — sadece olay anı playSparkle */
}

function startPhoneAmbience(scene, ctx, master) {
  /* Telefonda da arka plan yok — mesaj pingleri yeterli */
}

function startCrowdAmbience() {
  /* Konserde sürekli uğultu yok — el kalkınca playHandRaiseCheer */
}

function startMeyhaneAmbience(scene, ctx, master) {
  startLoopNoise(ctx, master, { vol: 0.03, filterFreq: 320, filterType: 'bandpass', filterQ: 0.4 });

  const pattern = [
    { freq: 62, vol: 0.14, decay: 0.4, type: 'sine' },
    null,
    { freq: 68, vol: 0.12, decay: 0.35, type: 'sine' },
    { freq: 180, vol: 0.07, decay: 0.08, type: 'sine' },
    { freq: 64, vol: 0.13, decay: 0.38, type: 'sine' },
    null,
    { freq: 70, vol: 0.11, decay: 0.32, type: 'sine' },
    { freq: 175, vol: 0.06, decay: 0.07, type: 'sine' },
  ];
  let step = 0;
  trackTimer(
    scene,
    () => {
      if (currentScene !== 'meyhane') return;
      const hit = pattern[step % pattern.length];
      step++;
      if (hit) playTone(ctx, master, hit);
    },
    380,
    true
  );
}

function startFinaleAmbience(scene, ctx, master) {
  startLoopNoise(ctx, master, { vol: 0.03, filterFreq: 200, filterType: 'lowpass' });

  scheduleSoftSparkle(scene, ctx, master, 'finale');

  trackTimer(
    scene,
    () => {
      if (currentScene !== 'finale') return;
      playCheer(ctx, master, 0.45, scene);
    },
    Phaser.Math.Between(9000, 15000),
    true
  );
}

export function stopSceneAmbience() {
  pendingTimeouts.forEach(clearTimeout);
  pendingTimeouts = [];

  timers.forEach((t) => {
    try {
      t?.remove?.(false);
      t?.destroy?.();
    } catch (_) { /* ignore */ }
  });
  timers = [];

  activeNodes.forEach(({ node, looping }) => {
    try {
      if (looping) node.stop();
      else node.stop?.();
    } catch (_) { /* ignore */ }
  });
  activeNodes = [];

  if (masterGain) {
    try {
      masterGain.disconnect();
    } catch (_) { /* ignore */ }
    masterGain = null;
  }
  currentScene = null;
  boundScene = null;
}

export function isAmbienceActive() {
  return !!currentScene && (timers.length > 0 || activeNodes.length > 0);
}

export function isAmbienceAudible() {
  return isAmbienceActive() && masterGain && masterGain.gain.value > 0.05;
}

export function hasAmbienceTrack(trackId) {
  return TRACKS.has(trackId);
}

function withBus(scene, vol, fn) {
  const ctx = getContext(scene);
  if (!ctx) return;
  resumeContext(ctx);
  const bus = createBus(ctx, vol);
  fn(ctx, bus);
  sceneDelay(scene, () => {
    try {
      bus.disconnect();
    } catch (_) { /* ignore */ }
  }, 2500);
}

export function playSparkle(scene) {
  withBus(scene, 0.55, (ctx, bus) => playSoftSparkle(ctx, bus));
}

export function playCheerBurst(scene, intensity = 1) {
  withBus(scene, 0.65, (ctx, bus) => playCheer(ctx, bus, intensity, scene));
}

/** Konserde eller kalkınca — kısa coşku patlaması */
export function playHandRaiseCheer(scene) {
  withBus(scene, 0.9, (ctx, bus) => {
    playCheer(ctx, bus, 1.05, scene);
    playTone(ctx, bus, {
      freq: 340,
      freqEnd: 620,
      type: 'sine',
      vol: 0.09,
      decay: 0.5,
      attack: 0.02,
    });
  });
}

export function playDefHit(scene, kind = 'dum') {
  withBus(scene, 0.7, (ctx, bus) => {
    if (kind === 'tek') {
      playTone(ctx, bus, { freq: 185, vol: 0.1, decay: 0.08, type: 'sine', attack: 0.004 });
    } else if (kind === 'glass') {
      playTone(ctx, bus, { freq: 720, vol: 0.07, decay: 0.25, type: 'sine', attack: 0.01 });
    } else {
      playTone(ctx, bus, { freq: 62, vol: 0.14, decay: 0.4, type: 'sine', attack: 0.004 });
    }
  });
}

export function playTypingTick(scene) {
  withBus(scene, 0.5, (ctx, bus) => {
    playSwell(ctx, bus, {
      dur: 0.04,
      vol: 0.04,
      filterFreq: 900,
      attack: 0.005,
      filterType: 'bandpass',
    });
  });
}

export function playRhythmHit(scene) {
  withBus(scene, 0.55, (ctx, bus) => {
    playTone(ctx, bus, { freq: 440, vol: 0.06, decay: 0.12, attack: 0.008, type: 'sine' });
  });
}

export function playRomanticChime(scene) {
  withBus(scene, 0.6, (ctx, bus) => {
    playTone(ctx, bus, { freq: 392, vol: 0.07, decay: 0.8, attack: 0.03 });
    sceneDelay(scene, () => playTone(ctx, bus, { freq: 493.88, vol: 0.06, decay: 0.85, attack: 0.03 }), 180);
  });
}

export function playMessagePing(scene, kind = 'receive') {
  const ctx = getContext(scene);
  if (!ctx) return;
  resumeContext(ctx);

  const bus = createBus(ctx, kind === 'send' ? 0.85 : 1);

  if (kind === 'send') {
    playTone(ctx, bus, { freq: 523, vol: 0.14, decay: 0.14, attack: 0.008 });
    playTone(ctx, bus, { freq: 659, vol: 0.11, decay: 0.16, attack: 0.008 });
  } else {
    playTone(ctx, bus, { freq: 784, vol: 0.15, decay: 0.18, attack: 0.008 });
    setTimeout(() => {
      playTone(ctx, bus, { freq: 988, vol: 0.12, decay: 0.2, attack: 0.008 });
    }, 90);
  }

  setTimeout(() => {
    try {
      bus.disconnect();
    } catch (_) { /* ignore */ }
  }, 500);
}

export async function startSceneAmbience(scene, trackId, options = {}) {
  stopSceneAmbience();

  const ctx = getContext(scene);
  if (!ctx || !TRACKS.has(trackId)) return false;

  await resumeContext(ctx);
  boundScene = scene;
  currentScene = trackId;

  const volMap = {
    phone: 0.45,
    meyhane: 0.58,
    openAir: 0.65,
    finale: 0.55,
  };
  const masterVol = volMap[trackId];
  if (masterVol == null) {
    currentScene = trackId;
    return true;
  }
  const master = ensureMaster(ctx, masterVol);

  switch (trackId) {
    case 'sky':
    case 'phone':
    case 'concert':
      break;
    case 'meyhane':
      startMeyhaneAmbience(scene, ctx, master);
      break;
    case 'openAir':
      startCrowdAmbience(scene, ctx, master, 'openAir', options.intensity ?? 0.9);
      break;
    case 'finale':
      startFinaleAmbience(scene, ctx, master);
      break;
    default:
      break;
  }

  return true;
}
