/* FRENCH STORE — isolated install prompt UI.
   Shows an install button only when the browser confirms the PWA is installable.
   No checkout, Auth, Wallet, pricing, catalog or payment logic is touched. */
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
      if (!deferredPrompt) return;
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

  function showInstallButton() {
    if (isStandalone()) return;
    const button = ensureButton();
    button?.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installButton?.classList.add('hidden');
    document.documentElement.dataset.fsPwaInstalled = '1';
  });

  if (isStandalone()) document.documentElement.dataset.fsPwaInstalled = '1';
})();
