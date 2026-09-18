/* FRENCH STORE — install prompt UI.
   The button is visible only after Chromium confirms the site is installable. */
(() => {
  'use strict';

  let deferredPrompt = null;
  let installButton = null;

  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      window.navigator.standalone === true;
  }

  function ensureButton() {
    if (installButton || isStandalone()) return installButton;
    const actions = document.querySelector('.hero-actions');
    if (!actions) return null;

    installButton = document.createElement('button');
    installButton.id = 'installFrenchStore';
    installButton.type = 'button';
    installButton.className = 'secondary-btn fs-install-btn hidden';
    installButton.textContent = '📲 Instalar FRENCH STORE';
    installButton.setAttribute('aria-label', 'Instalar FRENCH STORE en este dispositivo');
    actions.appendChild(installButton);

    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) {
        installButton.classList.add('hidden');
        return;
      }

      installButton.disabled = true;
      const previousText = installButton.textContent;
      installButton.textContent = 'Abriendo instalación…';
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => null);
        if (choice?.outcome === 'accepted') {
          deferredPrompt = null;
          installButton.classList.add('hidden');
          return;
        }
      } catch (error) {
        console.warn('FRENCH STORE install prompt skipped:', String(error?.message || error).slice(0, 100));
      } finally {
        if (installButton) {
          installButton.disabled = false;
          installButton.textContent = previousText;
        }
      }
    });

    return installButton;
  }

  function revealInstallButton() {
    if (isStandalone() || !deferredPrompt) return;
    const button = ensureButton();
    button?.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    revealInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installButton?.classList.add('hidden');
    document.documentElement.dataset.fsPwaInstalled = '1';
  });

  if (isStandalone()) document.documentElement.dataset.fsPwaInstalled = '1';
})();
