/* THE FRENCH STORE — R226 deterministic premium socials/home refresh. */
(() => {
  'use strict';
  const root = document.documentElement;
  const paid = () => /^(gold|diamond)$/i.test(String(root.dataset.fsTier || ''));
  let queued = false;

  function socialMarkup() {
    return `
      <div class="official-socials-copy">
        <span class="social-kicker">REDES OFICIALES</span>
        <strong>Sigue a FRENCH STORE</strong>
        <small>Novedades, contenido gamer, promociones y anuncios de la tienda.</small>
      </div>
      <div class="social-links" aria-label="Redes sociales oficiales de FRENCH STORE">
        <a class="social-link social-tiktok" href="https://www.tiktok.com/@frenchstore?_r=1&amp;_t=ZM-92gu8segzm8" target="_blank" rel="noopener noreferrer" aria-label="TikTok oficial de FRENCH STORE">
          <span class="social-icon" aria-hidden="true">♪</span><span class="social-label"><b>TikTok</b><small>@frenchstore</small></span><span class="social-arrow" aria-hidden="true">↗</span>
        </a>
        <a class="social-link social-youtube" href="https://youtube.com/@frenchstore1?si=kXZtoXiCq52dvBhW" target="_blank" rel="noopener noreferrer" aria-label="YouTube oficial de FRENCH STORE">
          <span class="social-icon" aria-hidden="true">▶</span><span class="social-label"><b>YouTube</b><small>@frenchstore1</small></span><span class="social-arrow" aria-hidden="true">↗</span>
        </a>
        <a class="social-link social-facebook" href="https://www.facebook.com/share/1LeZV8aqQ3/" target="_blank" rel="noopener noreferrer" aria-label="Facebook oficial de FRENCH STORE">
          <span class="social-icon" aria-hidden="true">f</span><span class="social-label"><b>Facebook</b><small>FRENCH STORE</small></span><span class="social-arrow" aria-hidden="true">↗</span>
        </a>
      </div>`;
  }

  function ensureSocials() {
    let panel = document.getElementById('fsPremiumSocialsPanel');
    if (!paid()) {
      panel?.remove();
      return;
    }
    const home = document.getElementById('view-inicio');
    const featured = home?.querySelector(':scope > .compact-panel');
    if (!home || !featured) return;

    if (!panel) {
      const source = document.querySelector('.site-legal-footer .official-socials');
      if (source) {
        panel = source.cloneNode(true);
        panel.id = 'fsPremiumSocialsPanel';
        panel.removeAttribute('aria-labelledby');
        panel.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      } else {
        panel = document.createElement('section');
        panel.id = 'fsPremiumSocialsPanel';
        panel.className = 'official-socials';
        panel.innerHTML = socialMarkup();
      }
    }

    panel.classList.add('official-socials');
    panel.setAttribute('aria-label', 'Redes oficiales de FRENCH STORE');
    if (featured.nextElementSibling !== panel) featured.insertAdjacentElement('afterend', panel);
  }

  function refresh() {
    queued = false;
    try { window.FSPremiumR225?.refresh?.(); } catch {}
    ensureSocials();
    if (paid()) root.dataset.fsPremiumHome = 'r226';
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function boot() {
    refresh();
    const main = document.getElementById('mainContent');
    if (main) new MutationObserver(queue).observe(main, { childList:true, subtree:true });
    new MutationObserver(queue).observe(root, { attributes:true, attributeFilter:['data-fs-tier'] });
    document.addEventListener('fs-tier-resolved', queue);
    document.addEventListener('fs:catalog-updated', queue);
    [50,180,500,1200,2200].forEach((ms) => setTimeout(queue, ms));
  }

  window.FSPremiumR226 = Object.freeze({ refresh: queue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
