import {
  startSceneAmbience,
  stopSceneAmbience,
  hasAmbienceTrack,
  isAmbienceActive,
  isAmbienceAudible,
  refreshMasterGain,
  playMessagePing,
  playSparkle,
  playCheerBurst,
  playHandRaiseCheer,
  playDefHit,
  playTypingTick,
  playRhythmHit,
  playRomanticChime,
} from './sceneAmbience.js';

export {
  playMessagePing,
  playSparkle,
  playCheerBurst,
  playHandRaiseCheer,
  playDefHit,
  playTypingTick,
  playRhythmHit,
  playRomanticChime,
};

/** Arka plan ambient'i olmayan sahneler — sadece efekt sesi */
const SFX_ONLY = new Set(['sky', 'phone', 'concert']);

/** İsteğe bağlı MP3 — açık hava konseri (mey.mp3) */
export const MUSIC = {
  openAir: { key: 'music_mey', file: 'assets/audio/mey.mp3', volume: 0.55 },
};

let currentMusic = null;
let currentTrackId = null;
let usingAmbience = false;

function isTrackAudible(scene, trackId) {
  const ctx = scene.sound?.context;
  if (currentMusic?.isPlaying) return true;
  if (SFX_ONLY.has(trackId)) return false;
  return (
    usingAmbience &&
    currentTrackId === trackId &&
    ctx?.state === 'running' &&
    isAmbienceAudible()
  );
}

export function unlockSceneAudio(scene) {
  const unlock = () => {
    scene.sound.unlock();
    if (scene.sound.context?.state === 'suspended') {
      scene.sound.context.resume();
    }
  };
  scene.input.on('pointerdown', unlock);
  scene.input.keyboard?.on('keydown', unlock);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerdown', unlock);
    scene.input.keyboard?.off('keydown', unlock);
  });
}

export async function kickstartSceneAudio(scene, trackId) {
  if (scene.sound.locked) {
    scene.sound.unlock();
  }
  const ctx = scene.sound?.context;
  if (ctx?.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) { /* ignore */ }
  }

  refreshMasterGain();

  if (!isTrackAudible(scene, trackId)) {
    await playSceneMusic(scene, trackId);
  } else {
    refreshMasterGain();
  }
}

export function preloadSceneMusic(scene, trackId) {
  const track = MUSIC[trackId];
  if (!track || scene.cache.audio.exists(track.key)) return;
  scene.load.audio(track.key, track.file);
}

export async function playSceneMusic(scene, trackId) {
  if (isTrackAudible(scene, trackId)) {
    refreshMasterGain();
    return;
  }

  stopMusic(scene, false);

  const track = MUSIC[trackId];
  const hasMp3 = track && scene.cache.audio.exists(track.key);

  if (hasMp3 && trackId === 'openAir') {
    currentTrackId = trackId;
    usingAmbience = true;
    await startSceneAmbience(scene, 'openAir', { intensity: 0.4 });

    currentMusic = scene.sound.add(track.key, { loop: true, volume: 0 });
    currentMusic.play();
    scene.tweens.add({
      targets: currentMusic,
      volume: track.volume,
      duration: 1200,
      ease: 'Sine.easeOut',
    });
    return;
  }

  if (hasAmbienceTrack(trackId) && !SFX_ONLY.has(trackId)) {
    currentTrackId = trackId;
    usingAmbience = true;
    await startSceneAmbience(scene, trackId);
  }
}

export function tryLoadMeyMp3(scene, onReady) {
  fetch('assets/audio/mey.mp3', { method: 'HEAD' })
    .then((res) => {
      if (!res.ok) return;
      if (scene.cache.audio.exists('music_mey')) {
        onReady?.();
        return;
      }
      scene.load.audio('music_mey', 'assets/audio/mey.mp3');
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => onReady?.());
      scene.load.start();
    })
    .catch(() => {});
}

export function stopAllAudio() {
  stopSceneAmbience();
  usingAmbience = false;
  currentTrackId = null;

  if (!currentMusic) return;

  try {
    currentMusic.stop();
    currentMusic.destroy();
  } catch (_) { /* ignore */ }
  currentMusic = null;
}

export function stopMusic(scene, fade = true) {
  stopSceneAmbience();
  usingAmbience = false;
  currentTrackId = null;

  if (!currentMusic?.isPlaying) {
    currentMusic = null;
    return;
  }

  const music = currentMusic;
  currentMusic = null;

  if (!fade) {
    music.stop();
    music.destroy();
    return;
  }

  scene.tweens.add({
    targets: music,
    volume: 0,
    duration: 900,
    ease: 'Sine.easeIn',
    onComplete: () => {
      music.stop();
      music.destroy();
    },
  });
}

export function bindSceneMusic(scene, trackId) {
  const tryPlay = () => kickstartSceneAudio(scene, trackId);

  const ensurePlaying = () => {
    tryPlay();
    if (isTrackAudible(scene, trackId)) {
      scene.input.off('pointerdown', ensurePlaying);
      scene.input.keyboard?.off('keydown', ensurePlaying);
    }
  };

  scene.input.on('pointerdown', ensurePlaying);
  scene.input.keyboard?.on('keydown', ensurePlaying);

  scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerdown', ensurePlaying);
    scene.input.keyboard?.off('keydown', ensurePlaying);
    stopMusic(scene);
  });
}
