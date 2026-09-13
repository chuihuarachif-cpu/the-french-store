/* 💎 French Store 💎 — manual delivery badges.
   Presentation only. All supplier fulfillment is currently manual. */
(() => {
  'use strict';
  const VERSION = 'manual-delivery-20260913';
  let scheduled = false;

  function replaceBadge(host) {
    if (!host) return;
    let badge = host.querySelector(':scope > .fs-delivery-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'fs-delivery-badge is-manual';
      host.appendChild(badge);
    }
    badge.dataset.fsDeliveryMode = 'MANUAL';
    badge.textContent = '👤 Entrega manual';
    badge.title = 'La entrega requiere gestión manual de FRENCH STORE.';
  }

  function annotateAll() {
    scheduled = false;
    document.querySelectorAll('.package-row .package-name').forEach(replaceBadge);
    document.querySelectorAll('.r6-package-card').forEach((card) => {
      replaceBadge(card.querySelector('.r6-package-copy') || card.querySelector('strong')?.parentElement);
    });
    document.querySelectorAll('#cartItems .record').forEach((record) => replaceBadge(record.querySelector('.record-top > div')));
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(annotateAll);
  }

  function install() {
    ['catalogList', 'cartItems'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) new MutationObserver(schedule).observe(node, { childList: true, subtree: true });
    });
    document.getElementById('categoryTabs')?.addEventListener('click', schedule, true);
    schedule();
  }

  window.FSDeliveryModeBadges = Object.freeze({ version: VERSION, refresh: schedule });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
