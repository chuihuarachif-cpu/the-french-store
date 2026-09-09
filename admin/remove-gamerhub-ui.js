/* THE FRENCH STORE — R158 remove retired GamerHub UI leftovers.
   Presentation-only cleanup for the current Admin shell; it does not touch
   orders, pricing, Wallet, ACH, or historical database records. */
(() => {
  'use strict';

  const retiredOverviewLabels = new Set([
    'GamerHub cargado',
    'GamerHub disponible',
    'GamerHub consumido',
    'Capital restante'
  ]);

  function clean(root = document) {
    root.querySelectorAll?.('[data-panel="gamerhub"], [data-tab="gamerhub"]').forEach((el) => el.remove());

    const overview = document.getElementById('overviewList');
    overview?.querySelectorAll('.summary-card').forEach((card) => {
      const label = card.querySelector('span')?.textContent?.trim() || '';
      if (retiredOverviewLabels.has(label)) card.remove();
    });

    const history = document.getElementById('historyList');
    history?.querySelectorAll('.history-section').forEach((section) => {
      const title = section.querySelector('h3')?.textContent?.trim().toUpperCase() || '';
      if (title === 'GAMERHUB') section.remove();
    });
  }

  clean();
  const observer = new MutationObserver(() => clean());
  observer.observe(document.body, { childList: true, subtree: true });
})();
