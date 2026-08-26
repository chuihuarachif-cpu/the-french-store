/* THE FRENCH STORE — R94 isolated cinematic intro + optional background music.
   Presentation only: does not read or write catalog, Wallet, orders, Auth, Admin or providers. */
(() => {
  'use strict';

  const VERSION = 'french-intro-r94-20260826b';
  const SESSION_KEY = 'fs_intro_seen_r94';
  const MUSIC_KEY = 'fs_music_enabled_v1';
  const AUDIO_SRC = './intro/french-store-theme.mp3?v=20260826-r94b';
  const LOGO_SRC = './assets/brand/icon-512.png?v=20260826-r94b';
  const INTRO_MS = 3350;
  const EXIT_MS = 620;

  if (location.pathname.startsWith('/admin')) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const saveData = navigator.connection?.saveData === true;

  let overlay = null;
  let audio = null;
  let musicToggle = null;
  let releaseTimer = null;
  let started = false;

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

  function ensureAudio() {
    if (audio) return audio;
    audio = document.createElement('audio');
    audio.id = 'fsIntroAudio';
    audio.src = AUDIO_SRC;
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.24;
    audio.setAttribute('playsinline', '');
    document.body.appendChild(audio);
    return audio;
  }

  async function setMusic(enabled, userGesture = false) {
    writeBool(MUSIC_KEY, enabled);
    const player = ensureAudio();
    if (!enabled) {
      player.pause();
      updateMusicToggle(false);
      return false;
    }
    try {
      if (userGesture) player.currentTime = player.currentTime || 0;
      await player.play();
      updateMusicToggle(true);
      return true;
    } catch {
      updateMusicToggle(false, true);
      return false;
    }
  }

  function updateMusicToggle(playing, needsGesture = false) {
    if (!musicToggle) return;
    musicToggle.classList.toggle('is-on', playing);
    musicToggle.classList.toggle('needs-gesture', needsGesture);
    musicToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicToggle.title = playing ? 'Silenciar música' : 'Activar música';
    musicToggle.innerHTML = playing ? '<span aria-hidden="true">🔊</span><span class="fs-music-label">Música</span>' : '<span aria-hidden="true">🔇</span><span class="fs-music-label">Música</span>';
  }

  function ensureMusicToggle() {
    if (musicToggle || !document.body) return musicToggle;
    musicToggle = document.createElement('button');
    musicToggle.type = 'button';
    musicToggle.id = 'fsMusicToggle';
    musicToggle.className = 'fs-music-toggle';
    musicToggle.setAttribute('aria-label', 'Activar o desactivar música');
    musicToggle.addEventListener('click', async () => {
      const player = ensureAudio();
      if (!player.paused) await setMusic(false, true);
      else await setMusic(true, true);
    });
    document.body.appendChild(musicToggle);
    updateMusicToggle(audio ? !audio.paused : false, readBool(MUSIC_KEY, false));
    return musicToggle;
  }

  function flameMarkup() {
    return Array.from({ length: 13 }, (_, index) => {
      const delay = (index % 5) * 55;
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
          <img class="fs-intro-logo" src="${LOGO_SRC}" alt="FRENCH STORE" decoding="async" fetchpriority="high">
          <div class="fs-intro-logo-scan" aria-hidden="true"></div>
        </div>
        <p class="fs-intro-kicker">THE FRENCH STORE</p>
        <p class="fs-intro-hint">Toca para encender la tienda</p>
      </div>
      <div class="fs-intro-entry-actions">
        <button class="fs-intro-primary" type="button" data-fs-intro-start="sound">🔊 Entrar con música</button>
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
    image?.addEventListener('error', () => finishIntro(), { once: true });
    return overlay;
  }

  async function startIntro(withMusic) {
    if (started) return;
    started = true;
    if (!overlay) buildOverlay();
    markSessionSeen();

    const actions = overlay?.querySelector('.fs-intro-entry-actions');
    const skip = overlay?.querySelector('[data-fs-intro-skip]');
    if (actions) actions.hidden = true;
    if (skip) skip.hidden = false;

    if (withMusic) await setMusic(true, true);
    else await setMusic(false, true);

    overlay?.classList.remove('is-armed');
    overlay?.classList.add('is-running');

    if (reducedMotion || saveData) {
      releaseTimer = window.setTimeout(finishIntro, 1250);
    } else {
      releaseTimer = window.setTimeout(finishIntro, INTRO_MS);
    }
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
    }, reducedMotion ? 120 : EXIT_MS);
  }

  function installPreferredMusicResume() {
    if (!readBool(MUSIC_KEY, false)) return;
    updateMusicToggle(false, true);
    const resume = async () => {
      document.removeEventListener('pointerdown', resume, true);
      document.removeEventListener('keydown', resume, true);
      await setMusic(true, true);
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
    setMusic: (enabled) => setMusic(Boolean(enabled), true)
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
