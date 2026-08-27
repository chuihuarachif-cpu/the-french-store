/* THE FRENCH STORE — R95 cinematic intro timing + reliable user-gesture audio.
   Presentation only: does not read or write catalog, Wallet, orders, Auth, Admin or providers. */
(() => {
  'use strict';

  const VERSION = 'french-intro-r95-20260826';
  const SESSION_KEY = 'fs_intro_seen_r95';
  const MUSIC_KEY = 'fs_music_enabled_v1';
  const AUDIO_PARTS = [
    './intro/audio/theme-00.b64?v=20260826-r95',
    './intro/audio/theme-01.b64?v=20260826-r95',
    './intro/audio/theme-02.b64?v=20260826-r95'
  ];
  const LOGO_PARTS = [
    './intro/logo/logo-00.b64?v=20260826-r95',
    './intro/logo/logo-01.b64?v=20260826-r95',
    './intro/logo/logo-02.b64?v=20260826-r95',
    './intro/logo/logo-03.b64?v=20260826-r95'
  ];
  const FALLBACK_LOGO = './assets/brand/icon-512.png?v=20260826-r95';
  const INTRO_MS = 5200;
  const REDUCED_INTRO_MS = 1850;
  const EXIT_MS = 720;

  if (location.pathname.startsWith('/admin')) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const saveData = navigator.connection?.saveData === true;

  let overlay = null;
  let audio = null;
  let audioUrl = '';
  let logoUrl = '';
  let audioSourcePromise = null;
  let logoSourcePromise = null;
  let musicToggle = null;
  let releaseTimer = null;
  let started = false;
  let audioReady = false;
  let audioFailed = false;

  function readBool(key, fallback = false) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      return value === '1';
    } catch {
      return fallback;
    }
  }

  function writeBool(key, value) {
    try { localStorage.setItem(key, value ? '1' : '0'); } catch {}
  }

  function sessionSeen() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
  }

  function markSessionSeen() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
  }

  async function decodePartsToObjectUrl(parts, mime, errorCode) {
    const responses = await Promise.all(parts.map((part) => fetch(part, { cache: 'force-cache' })));
    if (responses.some((response) => !response.ok)) throw new Error(errorCode);

    const encoded = (await Promise.all(responses.map((response) => response.text())))
      .join('')
      .replace(/\s+/g, '');
    const raw = atob(encoded);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  async function ensureAudioSource() {
    if (audioUrl) return audioUrl;
    if (audioSourcePromise) return audioSourcePromise;

    audioSourcePromise = decodePartsToObjectUrl(AUDIO_PARTS, 'audio/mpeg', 'intro-audio-unavailable')
      .then((url) => {
        audioUrl = url;
        return audioUrl;
      })
      .catch((error) => {
        audioSourcePromise = null;
        audioFailed = true;
        refreshSoundButton();
        throw error;
      });

    return audioSourcePromise;
  }

  async function ensureLogoSource() {
    if (logoUrl) return logoUrl;
    if (logoSourcePromise) return logoSourcePromise;

    logoSourcePromise = decodePartsToObjectUrl(LOGO_PARTS, 'image/webp', 'intro-logo-unavailable')
      .then((url) => {
        logoUrl = url;
        return logoUrl;
      })
      .catch((error) => {
        logoSourcePromise = null;
        throw error;
      });

    return logoSourcePromise;
  }

  function ensureAudioElement() {
    if (audio) return audio;
    audio = document.createElement('audio');
    audio.id = 'fsIntroAudio';
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.28;
    audio.setAttribute('playsinline', '');
    audio.addEventListener('canplay', () => {
      audioReady = true;
      audioFailed = false;
      refreshSoundButton();
    });
    audio.addEventListener('loadedmetadata', () => {
      audioReady = true;
      refreshSoundButton();
    });
    audio.addEventListener('error', () => {
      audioReady = false;
      audioFailed = true;
      refreshSoundButton();
    });
    document.body.appendChild(audio);
    return audio;
  }

  function prepareAudio() {
    const player = ensureAudioElement();
    if (player.src) {
      if (player.readyState >= 1) audioReady = true;
      refreshSoundButton();
      return Promise.resolve(player);
    }

    refreshSoundButton();
    return ensureAudioSource()
      .then((src) => {
        if (!player.src) {
          player.src = src;
          player.load();
        }
        if (player.readyState >= 1) audioReady = true;
        refreshSoundButton();
        return player;
      })
      .catch(() => player);
  }

  function refreshSoundButton() {
    const button = overlay?.querySelector('[data-fs-intro-start="sound"]');
    if (!button) return;

    if (audioFailed) {
      button.disabled = true;
      button.textContent = '🔇 Audio no disponible';
      return;
    }

    if (!audioReady) {
      button.disabled = true;
      button.textContent = '⏳ Preparando música…';
      return;
    }

    button.disabled = false;
    button.textContent = '🔊 Entrar con música';
  }

  function updateMusicToggle(playing, needsGesture = false) {
    if (!musicToggle) return;
    musicToggle.classList.toggle('is-on', playing);
    musicToggle.classList.toggle('needs-gesture', needsGesture);
    musicToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicToggle.title = playing ? 'Silenciar música' : 'Activar música';
    musicToggle.innerHTML = playing
      ? '<span aria-hidden="true">🔊</span><span class="fs-music-label">Música</span>'
      : '<span aria-hidden="true">🔇</span><span class="fs-music-label">Música</span>';
  }

  function stopMusic() {
    writeBool(MUSIC_KEY, false);
    if (audio) audio.pause();
    updateMusicToggle(false);
  }

  function playPreparedMusicFromGesture() {
    const player = ensureAudioElement();
    if (!player.src || !audioReady || audioFailed) {
      updateMusicToggle(false, true);
      return false;
    }

    writeBool(MUSIC_KEY, true);
    try {
      const playResult = player.play();
      if (playResult && typeof playResult.then === 'function') {
        playResult
          .then(() => updateMusicToggle(true))
          .catch(() => updateMusicToggle(false, true));
      } else {
        updateMusicToggle(true);
      }
      return true;
    } catch {
      updateMusicToggle(false, true);
      return false;
    }
  }

  function ensureMusicToggle() {
    if (musicToggle || !document.body) return musicToggle;
    musicToggle = document.createElement('button');
    musicToggle.type = 'button';
    musicToggle.id = 'fsMusicToggle';
    musicToggle.className = 'fs-music-toggle';
    musicToggle.setAttribute('aria-label', 'Activar o desactivar música');
    musicToggle.addEventListener('click', () => {
      if (audio && !audio.paused) {
        stopMusic();
        return;
      }

      if (audioReady) {
        playPreparedMusicFromGesture();
        return;
      }

      prepareAudio().then(() => {
        if (!audioReady) updateMusicToggle(false, true);
      });
      updateMusicToggle(false, true);
    });
    document.body.appendChild(musicToggle);
    updateMusicToggle(audio ? !audio.paused : false, readBool(MUSIC_KEY, false));
    return musicToggle;
  }

  function flameMarkup() {
    return Array.from({ length: 13 }, (_, index) => {
      const delay = (index % 5) * 65;
      return `<i class="fs-flame f${index + 1}" style="--fs-flame-delay:${delay}ms" aria-hidden="true"></i>`;
    }).join('');
  }

  function buildOverlay() {
    if (overlay || !document.body) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'fsIntroOverlay';
    overlay.className = 'fs-intro-overlay is-armed';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Entrada FRENCH STORE');
    overlay.innerHTML = `
      <div class="fs-intro-night" aria-hidden="true"></div>
      <div class="fs-intro-top-fire" aria-hidden="true">${flameMarkup()}</div>
      <div class="fs-intro-energy" aria-hidden="true"></div>
      <div class="fs-intro-beam" aria-hidden="true"></div>
      <div class="fs-intro-center">
        <div class="fs-intro-logo-shell">
          <div class="fs-intro-logo-aura" aria-hidden="true"></div>
          <img class="fs-intro-logo" src="${FALLBACK_LOGO}" alt="FRENCH STORE" decoding="async" fetchpriority="high">
          <div class="fs-intro-logo-scan" aria-hidden="true"></div>
        </div>
        <p class="fs-intro-kicker">THE FRENCH STORE</p>
        <p class="fs-intro-hint">Elige cómo entrar</p>
      </div>
      <div class="fs-intro-entry-actions">
        <button class="fs-intro-primary" type="button" data-fs-intro-start="sound" disabled>⏳ Preparando música…</button>
        <button class="fs-intro-secondary" type="button" data-fs-intro-start="silent">Entrar sin sonido</button>
      </div>
      <button class="fs-intro-skip" type="button" data-fs-intro-skip hidden>Saltar intro</button>
    `;
    document.body.classList.add('fs-intro-active');
    document.body.appendChild(overlay);

    overlay.querySelector('[data-fs-intro-start="sound"]')?.addEventListener('click', () => startIntro(true));
    overlay.querySelector('[data-fs-intro-start="silent"]')?.addEventListener('click', () => startIntro(false));
    overlay.querySelector('[data-fs-intro-skip]')?.addEventListener('click', finishIntro);

    const image = overlay.querySelector('.fs-intro-logo');
    ensureLogoSource()
      .then((src) => {
        if (image && image.isConnected) image.src = src;
      })
      .catch(() => {
        // Keep the stable brand fallback. A logo decoding issue must never abort the intro.
      });

    prepareAudio();
    return overlay;
  }

  function startIntro(withMusic) {
    if (started) return;
    started = true;
    if (!overlay) buildOverlay();
    markSessionSeen();

    const actions = overlay?.querySelector('.fs-intro-entry-actions');
    const skip = overlay?.querySelector('[data-fs-intro-skip]');
    if (actions) actions.hidden = true;
    if (skip) skip.hidden = false;

    // IMPORTANT: play() is invoked synchronously inside the user's click handler.
    // Awaiting network/decode work before play() loses transient activation on Android/iOS.
    if (withMusic) playPreparedMusicFromGesture();
    else stopMusic();

    overlay?.classList.remove('is-armed');
    overlay?.classList.add('is-running');

    const duration = reducedMotion || saveData ? REDUCED_INTRO_MS : INTRO_MS;
    releaseTimer = window.setTimeout(finishIntro, duration);
  }

  function finishIntro() {
    if (!overlay) {
      ensureMusicToggle();
      return;
    }
    if (releaseTimer) {
      clearTimeout(releaseTimer);
      releaseTimer = null;
    }
    markSessionSeen();
    overlay.classList.add('is-exiting');
    document.body.classList.remove('fs-intro-active');
    ensureMusicToggle();
    window.setTimeout(() => {
      overlay?.remove();
      overlay = null;
    }, reducedMotion ? 160 : EXIT_MS);
  }

  function installPreferredMusicResume() {
    prepareAudio();
    if (!readBool(MUSIC_KEY, false)) return;
    updateMusicToggle(false, true);

    const resume = () => {
      if (!audioReady) return;
      document.removeEventListener('pointerdown', resume, true);
      document.removeEventListener('keydown', resume, true);
      playPreparedMusicFromGesture();
    };
    document.addEventListener('pointerdown', resume, true);
    document.addEventListener('keydown', resume, true);
  }

  function boot() {
    ensureMusicToggle();
    if (sessionSeen()) {
      installPreferredMusicResume();
      return;
    }
    buildOverlay();
  }

  window.addEventListener('pagehide', () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (logoUrl) URL.revokeObjectURL(logoUrl);
  }, { once: true });

  window.FSFrenchIntro = Object.freeze({
    version: VERSION,
    startWithMusic: () => startIntro(true),
    startSilent: () => startIntro(false),
    skip: finishIntro,
    setMusic: (enabled) => {
      if (!enabled) {
        stopMusic();
        return false;
      }
      return playPreparedMusicFromGesture();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
