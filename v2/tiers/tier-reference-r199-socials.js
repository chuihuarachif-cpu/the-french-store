(() => {
  'use strict';

  const root = document.documentElement;

  function isPremium() {
    const tier = String(root.dataset.fsTier || '').toLowerCase();
    return tier === 'gold' || tier === 'diamond';
  }

  function mount() {
    const existing = document.getElementById('fsPremiumSocialsPanel');
    if (!isPremium()) {
      existing?.remove();
      return;
    }

    const profile = document.querySelector('#view-perfil .profile-panel');
    const source = document.querySelector('.site-legal-footer .official-socials');
    if (!profile || !source) return;
    if (existing) return;

    const panel = source.cloneNode(true);
    panel.id = 'fsPremiumSocialsPanel';
    panel.removeAttribute('aria-labelledby');
    panel.setAttribute('aria-label', 'Redes oficiales de FRENCH STORE');
    panel.querySelector('#officialSocialsTitle')?.removeAttribute('id');

    const loyalty = document.getElementById('fsLoyaltyPanel');
    if (loyalty && loyalty.parentElement === profile) loyalty.insertAdjacentElement('afterend', panel);
    else profile.appendChild(panel);
  }

  new MutationObserver(mount).observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();

  setTimeout(mount, 350);
  setTimeout(mount, 1200);
})();
