(() => {
  'use strict';

  const root = document.documentElement;

  function isPremium() {
    const tier = String(root.dataset.fsTier || '').toLowerCase();
    return tier === 'gold' || tier === 'diamond';
  }

  function buildPanel() {
    const panel = document.createElement('section');
    panel.id = 'fsPremiumSocialsPanel';
    panel.className = 'official-socials';
    panel.setAttribute('aria-label', 'Redes oficiales de FRENCH STORE');
    panel.innerHTML = `
      <div class="official-socials-copy">
        <span class="social-kicker">REDES OFICIALES</span>
        <strong>Sigue a FRENCH STORE</strong>
        <small>Novedades, contenido gamer, promociones y anuncios de la tienda.</small>
      </div>
      <div class="social-links" aria-label="Redes sociales oficiales de FRENCH STORE">
        <a class="social-link social-tiktok" href="https://www.tiktok.com/@frenchstore?_r=1&_t=ZM-92gu8segzm8" target="_blank" rel="noopener noreferrer" aria-label="TikTok oficial de FRENCH STORE">
          <span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14.1 3c.3 2.2 1.5 3.5 3.9 3.8v3.1a8.2 8.2 0 0 1-3.9-1.2v6.1a5.8 5.8 0 1 1-5-5.7v3.2a2.7 2.7 0 1 0 1.9 2.5V3h3.1Z"/></svg></span>
          <span class="social-label"><b>TikTok</b><small>@frenchstore</small></span>
        </a>
        <a class="social-link social-youtube" href="https://youtube.com/@frenchstore1?si=kXZtoXiCq52dvBhW" target="_blank" rel="noopener noreferrer" aria-label="YouTube oficial de FRENCH STORE">
          <span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 7.2a2.8 2.8 0 0 0-2-2C17.2 4.7 12 4.7 12 4.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12 29 29 0 0 0 3 16.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.8 29 29 0 0 0-.5-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"/></svg></span>
          <span class="social-label"><b>YouTube</b><small>@frenchstore1</small></span>
        </a>
        <a class="social-link social-facebook" href="https://www.facebook.com/share/1LeZV8aqQ3/" target="_blank" rel="noopener noreferrer" aria-label="Facebook oficial de FRENCH STORE">
          <span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13.7 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z"/></svg></span>
          <span class="social-label"><b>Facebook</b><small>FRENCH STORE</small></span>
        </a>
      </div>`;
    return panel;
  }

  function mount() {
    let panel = document.getElementById('fsPremiumSocialsPanel');
    if (!isPremium()) {
      panel?.remove();
      return;
    }

    const home = document.getElementById('view-inicio');
    const featured = home?.querySelector(':scope > .compact-panel');
    if (!home || !featured) return;
    if (!panel) panel = buildPanel();

    if (featured.nextElementSibling !== panel) featured.insertAdjacentElement('afterend', panel);
  }

  new MutationObserver(mount).observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();

  setTimeout(mount, 350);
  setTimeout(mount, 1200);
})();
