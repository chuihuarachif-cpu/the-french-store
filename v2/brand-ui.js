/* FRENCH STORE — isolated brand visual loader.
   Keeps the existing diamond fallback unless the mascot image loads successfully.
   R212 also normalizes the floating WhatsApp mark for every visual tier. */
(() => {
  'use strict';

  const WHATSAPP_SVG = `<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" style="display:block;width:32px;height:32px;fill:currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.438-9.886 9.891-9.886 2.641.001 5.123 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.993c-.003 5.45-4.44 9.888-9.888 9.888m8.413-18.297A11.815 11.815 0 0 0 12.055 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.143 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.688 1.448h.005c6.558 0 11.893-5.336 11.896-11.893a11.82 11.82 0 0 0-3.487-8.413Z"/></svg>`;

  function initWhatsappBrand() {
    const button = document.getElementById('floatingWhatsapp');
    if (!button || button.dataset.fsWhatsappBrand === '1') return;
    button.dataset.fsWhatsappBrand = '1';
    button.setAttribute('aria-label', 'Abrir WhatsApp de FRENCH STORE');
    button.style.color = '#fff';
    button.innerHTML = WHATSAPP_SVG;
  }

  function initBrandVisuals() {
    initWhatsappBrand();
    const host = document.querySelector('.hero-gem');
    if (!host || host.dataset.fsBrandInit === '1') return;

    const image = new Image();
    image.className = 'fs-hero-mascot';
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'eager';
    image.src = './assets/brand/french-store-mascot.webp';

    image.addEventListener('load', () => {
      if (!host.isConnected) return;
      host.replaceChildren(image);
      host.classList.add('fs-brand-ready');
      host.dataset.fsBrandInit = '1';
    }, { once: true });

    image.addEventListener('error', () => {
      host.dataset.fsBrandInit = 'failed';
      console.warn('FRENCH STORE mascot image unavailable; keeping safe fallback.');
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrandVisuals, { once: true });
  } else {
    initBrandVisuals();
  }
})();
