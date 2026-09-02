/* THE FRENCH STORE — R142 main Admin maintenance grid.
   Visual/navigation enhancement only. It reuses the existing protected maintenance
   buttons from app.js and the already-protected maintenance.html detail page.
   It does not create a Supabase client, does not read secrets and performs no writes. */
(() => {
  'use strict';

  let observer = null;
  let scheduled = 0;

  const host = () => document.getElementById('maintenanceList');
  const panel = () => document.getElementById('maintenancePanel');

  function detailHref(game) {
    return `./maintenance.html?game=${encodeURIComponent(game)}`;
  }

  function enhanceCard(card) {
    const groupButton = card.querySelector('[data-maintenance-ids][data-game]');
    if (!groupButton) return;

    const game = String(groupButton.dataset.game || '').trim();
    if (!game) return;

    card.classList.add('r142-maintenance-tile');

    const copy = card.querySelector('.card-top > div');
    if (copy && !copy.querySelector('.r142-maintenance-kicker')) {
      const kicker = document.createElement('span');
      kicker.className = 'r142-maintenance-kicker';
      kicker.textContent = 'JUEGO / SECCIÓN';
      copy.prepend(kicker);
    }

    const actions = groupButton.closest('.card-actions');
    if (!actions) return;
    actions.classList.add('r142-maintenance-actions');

    const isReactivating = groupButton.dataset.maintenanceEnable === '0';
    groupButton.classList.add('full', 'r142-whole-section');
    groupButton.textContent = isReactivating
      ? 'Reactivar toda la sección'
      : 'Poner toda la sección en mantenimiento';

    let open = actions.querySelector('[data-r142-open-maintenance]');
    if (!open) {
      open = document.createElement('a');
      open.className = 'primary full admin-link r142-open-maintenance';
      open.dataset.r142OpenMaintenance = '1';
      open.textContent = 'Entrar a modificar';
      actions.appendChild(open);
    }
    open.href = detailHref(game);
    open.setAttribute('aria-label', `Entrar a modificar ${game}`);
  }

  function enhance() {
    const target = host();
    if (!target) return;
    target.dataset.r142Grid = '1';
    target.querySelectorAll('article.card').forEach(enhanceCard);
  }

  function scheduleEnhance() {
    window.clearTimeout(scheduled);
    scheduled = window.setTimeout(enhance, 0);
  }

  function install() {
    const target = host();
    if (!target) return;

    enhance();

    observer = new MutationObserver(scheduleEnhance);
    observer.observe(target, { childList: true, subtree: false });

    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-tab="maintenance"]') ||
          event.target.closest?.('[data-refresh="maintenance"]')) {
        window.setTimeout(enhance, 80);
      }
    }, true);

    if (!panel()?.classList.contains('hidden')) scheduleEnhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
