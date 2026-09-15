/* THE FRENCH STORE — sound disabled by owner request.
   Compatibility shim only: keeps the public API expected by older UI modules,
   but never creates an AudioContext and never plays any tone. */
(() => {
  'use strict';

  const VERSION = 'tier-sound-disabled-r212-20260915';
  const MUTE_KEY = 'fs.tier.muted';
  try { localStorage.setItem(MUTE_KEY, '1'); } catch {}

  const api = Object.freeze({
    version: VERSION,
    isMuted: () => true,
    isUnlocked: () => false,
    setMuted() { try { localStorage.setItem(MUTE_KEY, '1'); } catch {} },
    toggle() { try { localStorage.setItem(MUTE_KEY, '1'); } catch {}; return true; },
    inSilentZone: () => true,
    gesture() {}
  });

  window.FSTierSound = api;

  const silenceMedia = () => {
    document.querySelectorAll('audio,video').forEach((media) => {
      try { media.muted = true; media.volume = 0; if (!media.paused) media.pause(); } catch {}
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', silenceMedia, { once: true });
  else silenceMedia();
})();
