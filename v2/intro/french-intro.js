/* THE FRENCH STORE — R96 cinematic intro with CSP-safe media handling.
   Presentation only: does not read or write catalog, Wallet, orders, Auth, Admin or providers. */
(() => {
  'use strict';

  const VERSION = 'french-intro-r96-20260826';
  const SESSION_KEY = 'fs_intro_seen_r96';
  const MUSIC_KEY = 'fs_music_enabled_v1';
  const AUDIO_PARTS = [
    './intro/audio/theme-00.b64?v=20260826-r96',
    './intro/audio/theme-01.b64?v=20260826-r96',
    './intro/audio/theme-02.b64?v=20260826-r96'
  ];
  const LOGO_PARTS = [
    './intro/logo/logo-00.b64?v=20260826-r96',
    './intro/logo/logo-01.b64?v=20260826-r96',
    './intro/logo/logo-02.b64?v=20260826-r96',
    './intro/logo/logo-03.b64?v=20260826-r96'
  ];
  const FALLBACK_LOGO = './assets/brand/icon-512.png?v=20260826-r96';
  const INTRO_MS = 5200;
  const REDUCED_INTRO_MS = 1850;
  const EXIT_MS = 720;

  if (location.pathname.startsWith('/admin')) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const saveData = navigator.connection?.saveData === true;

  let overlay = null;
  let musicToggle = null;
  let releaseTimer = null;
  let started = false;

  let audioBytes = null;
  let audioPromise = null;
  let audioReady = false;
  let audioFailed = false;
  let audioContext = null;
  let audioBuffer = null;
  let audioSource = null;
  let audioGain = null;
  let audioPlaying = false;

  let logoPromise = null;

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

  async function fetchJoinedBase64(parts, cacheMode = 'force-cache') {
    const responses = await Promise.all(parts.map((part) => fetch(part, { cache: cacheMode })));
    if (responses.some((response) => !response.ok)) throw new Error('intro-media-fetch-failed');
    const encoded = (await Promise.all(responses.map((response) => response.text())))
      .join('')
      .replace(/\s+/g, '');
    if (!encoded || encoded.length < 1000) throw new Error('intro-media-empty');
    return encoded;
  }

  function base64ToArrayBuffer(encoded) {
    const raw = atob(encoded);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    return bytes.buffer;
  }

  function refreshSoundButton() {
    const button = overlay?.querySelector('[data-fs-intro-start="sound"]');
    if (!button) return;

    if (audioReady) {
      button.disabled = false;
      button.dataset.state = 'ready';
      button.textContent = '🔊 Entrar con música';
      return;
    }

    if (audioFailed) {
      button.disabled = false;
      button.dataset.state = 'retry';
      button.textContent = '🔄 Reintentar audio';
      return;
    }

    button.disabled = true;
    button.dataset.state = 'loading';
    button.textContent = '⏳ Preparando música…';
  }

  function prepareAudio(force = false) {
    if (audioReady && audioBytes) return Promise.resolve(audioBytes);
    if (audioPromise && !force) return audioPromise;

    audioFailed = false;
    audioReady = false;
    refreshSoundButton();

    audioPromise = fetchJoinedBase64(AUDIO_PARTS, force ? 'reload' : 'force-cache')
      .then((encoded) => {
        const buffer = base64ToArrayBuffer(encoded);
        if (buffer.byteLength < 10000) throw new Error('intro-audio-too-small');
        audioBytes = buffer;
        audioReady = true;
        audioFailed = false;
        refreshSoundButton();
        return audioBytes;
      })
      .catch((error) => {
        audioPromise = null;
        audioReady = false;
        audioFailed = true;
        refreshSoundButton();
        throw error;
      });

    return audioPromise;
  }

  function prepareLogo() {
    if (logoPromise) return logoPromise;
    logoPromise = fetchJoinedBase64(LOGO_PARTS)
      .then((encoded) => `data:image/webp;base64,${encoded}`)
      .catch(() => FALLBACK_LOGO);
    return logoPromise;
  }

  function getAudioContext() {
    if (audioContext) return audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('web-audio-unavailable');
    audioContext = new AudioContextClass();
    return audioContext;
  }

  function decodeAudioBuffer() {
    if (audioBuffer) return Promise.resolve(audioBuffer);
    if (!audioBytes) return Promise.reject(new Error('audio-bytes-not-ready'));
    const context = getAudioContext();
    return context.decodeAudioData(audioBytes.slice(0)).then((buffer) => {
      audioBuffer = buffer;
      return audioBuffer;
    });
  }

  function stopCurrentSource() {
    if (audioSource) {
      try { audioSource.stop(); } catch {}
      try { audioSource.disconnect(); } catch {}
      audioSource = null;
    }
    audioPlaying = false;
  }

  function stopMusic() {
    writeBool(MUSIC_KEY, false);
    stopCurrentSource();
    updateMusicToggle(false);
  }

  function startMusicFromGesture() {
    if (!audioReady || !audioBytes || audioFailed) {
      updateMusicToggle(false, true);
      return false;
    }

    let context;
    try {
      context = getAudioContext();
    } catch {
      updateMusicToggle(false, true);
      return false;
    }

    writeBool(MUSIC_KEY, true);

    // Resume is intentionally called synchronously inside the user's tap.
    const resumeResult = context.resume();
    Promise.resolve(resumeResult)
      .then(() => decodeAudioBuffer())
      .then((buffer) => {
        stopCurrentSource();
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = 0.28;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        audioSource = source;
        audioGain = gain;
        audioPlaying = true;
        source.addEventListener?.('ended', () => {
          if (audioSource === source && !source.loop) {
            audioPlaying = false;
            updateMusicToggle(false);
          }
        });
        updateMusicToggle(true);
      })
      .catch(() => {
        audioPlaying = false;
        updateMusicToggle(false, true);
      });

    return true;
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

  function ensureMusicToggle() {
    if (musicToggle || !document.body) return musicToggle;
    musicToggle = document.createElement('button');
    musicToggle.type = 'button';
    musicToggle.id = 'fsMusicToggle';
    musicToggle.className = 'fs-music-toggle';
    musicToggle.setAttribute('aria-label', 'Activar o desactivar música');
    musicToggle.addEventListener('click', () => {
      if (audioPlaying) {
        stopMusic();
        return;
      }
      if (audioReady) {
        startMusicFromGesture();
        return;
      }
      prepareAudio(true).catch(() => {});
      updateMusicToggle(false, true);
    });
    document.body.appendChild(musicToggle);
    updateMusicToggle(false, readBool(MUSIC_KEY, false));
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

    const soundButton = overlay.querySelector('[data-fs-intro-start="sound"]');
    soundButton?.addEventListener('click', () => {
      if (soundButton.dataset.state === 'retry') {
        prepareAudio(true).catch(() => {});
        return;
      }
      startIntro(true);
    });
    overlay.querySelector('[data-fs-intro-start="silent"]')?.addEventListener('click', () => startIntro(false));
    overlay.querySelector('[data-fs-intro-skip]')?.addEventListener('click', finishIntro);

    const image = overlay.querySelector('.fs-intro-logo');
    prepareLogo().then((src) => {
      if (image && image.isConnected) image.src = src;
    });

    prepareAudio().catch(() => {});
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

    if (withMusic) startMusicFromGesture();
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
    prepareAudio().catch(() => {});
    if (!readBool(MUSIC_KEY, false)) return;
    updateMusicToggle(false, true);

    const resume = () => {
      if (!audioReady) return;
      document.removeEventListener('pointerdown', resume, true);
      document.removeEventListener('keydown', resume, true);
      startMusicFromGesture();
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
      return startMusicFromGesture();
    },
    retryAudio: () => prepareAudio(true)
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
