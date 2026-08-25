/* THE FRENCH STORE — R48 admin automatic-delivery guard.
   UI safety only. Automatic orders in PAID/PROCESSING stay under the provider engine;
   Admin must not mark them DELIVERED manually and accidentally hide an unfinished job.
   ERROR/MANUAL_REQUIRED recovery remains available to Admin. */
(() => {
  'use strict';

  const VERSION = 'admin-auto-delivery-guard-v1-20260825';
  let refreshTimer = null;
  let refreshing = false;

  function text(value) {
    return String(value ?? '').trim();
  }

  function orderIdsWithDeliveredButtons() {
    return [...document.querySelectorAll('#adminContent [data-order-status="DELIVERED"][data-id]')]
      .map((button) => text(button.dataset.id))
      .filter(Boolean);
  }

  function clearLock(button) {
    if (!button?.dataset.fsAutoDeliveryLocked) return;
    button.disabled = false;
    button.classList.remove('fs-auto-delivery-locked');
    button.textContent = button.dataset.fsAutoDeliveryOriginal || 'Entregado';
    button.removeAttribute('title');
    delete button.dataset.fsAutoDeliveryLocked;
    button.closest('.record')?.querySelector('.fs-admin-auto-lock-note')?.remove();
  }

  function applyLock(button) {
    if (!button) return;
    button.dataset.fsAutoDeliveryOriginal ||= text(button.textContent) || 'Entregado';
    button.dataset.fsAutoDeliveryLocked = '1';
    button.disabled = true;
    button.classList.add('fs-auto-delivery-locked');
    button.textContent = '⚡ Se entrega automáticamente';
    button.title = 'No marques este pedido como Entregado manualmente mientras la recarga automática está en curso.';

    const record = button.closest('.record');
    if (record && !record.querySelector('.fs-admin-auto-lock-note')) {
      const note = document.createElement('div');
      note.className = 'fs-admin-auto-lock-note';
      note.textContent = '⚡ Pedido automático protegido: espera a que el backend confirme la recarga. Si termina en Error o Manual requerido, podrás intervenir.';
      const actions = button.closest('.admin-actions');
      if (actions?.parentNode) actions.parentNode.insertBefore(note, actions);
      else record.appendChild(note);
    }
  }

  async function refresh() {
    if (refreshing || !admin || adminTab !== 'orders') return;
    const ids = [...new Set(orderIdsWithDeliveredButtons())];
    if (!ids.length) return;
    refreshing = true;
    try {
      const { data, error } = await sb
        .from('orders')
        .select('id,status,requires_manual_action')
        .in('id', ids);
      if (error) return;
      const byId = new Map((data || []).map((row) => [text(row.id), row]));
      ids.forEach((id) => {
        const button = document.querySelector(`#adminContent [data-order-status="DELIVERED"][data-id="${CSS.escape(id)}"]`);
        const row = byId.get(id);
        if (!button || !row) return;
        const status = text(row.status).toUpperCase();
        const shouldLock = row.requires_manual_action === false && ['PAID', 'PROCESSING'].includes(status);
        if (shouldLock) applyLock(button);
        else clearLock(button);
      });
    } catch {
      // Fail without changing existing admin behavior. This layer is an accidental-click guard,
      // not an authorization boundary; server-side admin RPC validation remains authoritative.
    } finally {
      refreshing = false;
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refresh().catch(() => {});
    }, 120);
  }

  function onCaptureClick(event) {
    const button = event.target.closest?.('[data-order-status="DELIVERED"][data-id]');
    if (!button || button.dataset.fsAutoDeliveryLocked !== '1') return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function install() {
    document.addEventListener('click', onCaptureClick, true);
    const root = document.getElementById('adminContent');
    if (root) new MutationObserver(scheduleRefresh).observe(root, { childList: true, subtree: true });
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-admin-tab="orders"],#refreshAdmin,#openAdmin')) scheduleRefresh();
    }, true);
    scheduleRefresh();
  }

  window.FSAdminAutoDeliveryGuard = Object.freeze({ version: VERSION, refresh: scheduleRefresh });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
