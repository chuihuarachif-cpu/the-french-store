/* THE FRENCH STORE — R48 delivery mode badges.
   Public presentation only. No provider identity, price, balance or credential is exposed.
   Unknown/unavailable capability is shown as manual (fail closed). */
(() => {
  'use strict';

  const VERSION = 'delivery-mode-badges-v1-20260825';
  let refreshScheduled = false;
  let capabilityReady = false;

  function safeId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  function badgeFor(productId) {
    const id = safeId(productId);
    const automatic = Boolean(id && capabilityReady && window.FSAutomationCapabilities?.isAutomatic?.(id));
    const badge = document.createElement('span');
    badge.className = `fs-delivery-badge ${automatic ? 'is-auto' : 'is-manual'}`;
    badge.dataset.fsDeliveryMode = automatic ? 'AUTOMATIC' : 'MANUAL';
    badge.textContent = automatic ? '⚡ Automático 24/7' : '👤 Entrega manual';
    badge.title = automatic
      ? 'La recarga se procesa automáticamente después de que el pago quede confirmado.'
      : 'Este paquete no tiene una ruta automática 24/7 habilitada. La entrega requiere gestión manual de FRENCH STORE.';
    return badge;
  }

  function replaceBadge(host, productId) {
    if (!host) return;
    const id = safeId(productId);
    if (!id) return;
    const existing = host.querySelector(':scope > .fs-delivery-badge');
    const nextMode = capabilityReady && window.FSAutomationCapabilities?.isAutomatic?.(id) ? 'AUTOMATIC' : 'MANUAL';
    if (existing?.dataset.fsDeliveryMode === nextMode) return;
    existing?.remove();
    host.appendChild(badgeFor(id));
  }

  function annotateLegacyPackages(root = document) {
    root.querySelectorAll?.('.package-row').forEach((row) => {
      const button = row.querySelector('[data-add]');
      const name = row.querySelector('.package-name');
      replaceBadge(name, button?.dataset.add);
    });
  }

  function annotateR6Packages(root = document) {
    root.querySelectorAll?.('.r6-package-card').forEach((card) => {
      const button = card.querySelector('[data-add]');
      const copy = card.querySelector('.r6-package-copy') || card.querySelector('strong')?.parentElement;
      replaceBadge(copy, button?.dataset.add);
    });
  }

  function annotateCart(root = document) {
    const cart = root.id === 'cartItems' ? root : root.querySelector?.('#cartItems');
    if (!cart) return;
    cart.querySelectorAll('.record').forEach((record) => {
      const source = record.querySelector('[data-plus],[data-minus],[data-remove]');
      const host = record.querySelector('.record-top > div');
      replaceBadge(host, source?.dataset.plus || source?.dataset.minus || source?.dataset.remove);
    });
  }

  function ensureLegend() {
    const meta = document.getElementById('catalogMeta');
    if (!meta || document.getElementById('fsDeliveryLegend')) return;
    const legend = document.createElement('div');
    legend.id = 'fsDeliveryLegend';
    legend.className = 'fs-delivery-legend';
    const auto = document.createElement('span');
    auto.className = 'fs-delivery-badge is-auto';
    auto.textContent = '⚡ Automático 24/7';
    const manual = document.createElement('span');
    manual.className = 'fs-delivery-badge is-manual';
    manual.textContent = '👤 Entrega manual';
    legend.append(auto, manual);
    meta.insertAdjacentElement('afterend', legend);
  }

  function annotateAll() {
    refreshScheduled = false;
    ensureLegend();
    annotateLegacyPackages(document);
    annotateR6Packages(document);
    annotateCart(document);
  }

  function scheduleAnnotate() {
    if (refreshScheduled) return;
    refreshScheduled = true;
    requestAnimationFrame(annotateAll);
  }

  async function refreshCapabilities(force = false) {
    try {
      capabilityReady = Boolean(await window.FSAutomationCapabilities?.load?.(force));
    } catch {
      capabilityReady = false;
    }
    scheduleAnnotate();
    document.dispatchEvent(new CustomEvent('fs:delivery-mode-badges-change', {
      detail: { capabilityReady }
    }));
    return capabilityReady;
  }

  function install() {
    ['catalogList', 'cartItems'].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      new MutationObserver(scheduleAnnotate).observe(node, { childList: true, subtree: true });
    });
    document.getElementById('categoryTabs')?.addEventListener('click', scheduleAnnotate, true);
    window.addEventListener('online', () => refreshCapabilities(true).catch(() => {}));
    scheduleAnnotate();
    refreshCapabilities(false).catch(() => {});
  }

  window.FSDeliveryModeBadges = Object.freeze({
    version: VERSION,
    refresh: () => refreshCapabilities(true)
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
