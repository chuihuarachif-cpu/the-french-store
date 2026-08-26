/* THE FRENCH STORE — R86 customer order history polish.
   Presentation-only safety layer. It never changes payment/provider/order state.
   For confirmed 24/7 orders it converts the former paid/WhatsApp action into a
   non-interactive processing status and removes WhatsApp/help actions from that
   order card. Manual orders keep their existing support action unchanged. */
(() => {
  'use strict';

  const VERSION = 'order-history-polish-v1-20260826';
  let scheduled = false;

  function text(value) {
    return String(value ?? '').trim();
  }

  function paymentLabel(raw) {
    const value = text(raw).toUpperCase();
    if (value === 'FRENCH_WALLET') return '💎 French Wallet';
    if (value === 'QR') return '▣ QR';
    return raw;
  }

  function polishPaymentMethod(record) {
    const meta = record?.querySelector?.('.record-top small');
    if (!meta || meta.dataset.fsPaymentPolished === '1') return;
    const raw = text(meta.textContent);
    if (!raw) return;

    const parts = raw.split(' · ');
    if (parts.length < 2) return;
    const last = parts[parts.length - 1];
    const formatted = paymentLabel(last);
    if (formatted === last) return;

    parts[parts.length - 1] = formatted;
    meta.textContent = parts.join(' · ');
    meta.dataset.fsPaymentPolished = '1';
  }

  function isAutomaticRecord(record) {
    if (!record) return false;
    if (record.querySelector('.automatic-order-btn,.automatic-order-state,[data-fs-automatic-order="1"]')) return true;
    return /automático\s*24\/7/i.test(text(record.textContent));
  }

  function ensureAutomaticBadge(record) {
    const stack = record?.querySelector?.('.order-status-stack');
    if (!stack) return;
    const badge = [...stack.querySelectorAll('.status')].find((node) => /automático\s*24\/7/i.test(text(node.textContent)));
    if (badge && !/^⚡/.test(text(badge.textContent))) badge.textContent = '⚡ Automático 24/7';
  }

  function replaceAutomaticAction(record) {
    if (!record || !isAutomaticRecord(record)) return;

    record.querySelectorAll('a[href*="wa.me"],a[href*="whatsapp"],.paid-whatsapp-active').forEach((node) => {
      if (!node.classList.contains('automatic-order-btn')) node.remove();
    });

    const button = record.querySelector('.automatic-order-btn,[data-fs-automatic-order="1"]');
    if (!button) return;
    if (button.classList.contains('automatic-order-state')) return;

    const state = document.createElement('div');
    state.className = 'automatic-order-state';
    state.setAttribute('role', 'status');
    state.setAttribute('aria-label', 'Recarga automática en proceso');
    state.innerHTML = '<span class="automatic-order-state-icon" aria-hidden="true">⚡</span><strong>Recarga automática en proceso</strong>';

    const actions = button.closest('.admin-actions');
    if (actions && actions.children.length === 1) actions.replaceWith(state);
    else button.replaceWith(state);
  }

  function polishRecord(record) {
    polishPaymentMethod(record);
    if (!isAutomaticRecord(record)) return;
    ensureAutomaticBadge(record);
    replaceAutomaticAction(record);
    record.classList.add('fs-automatic-order-record');
  }

  function polishQrModal() {
    const modal = document.getElementById('qrModal');
    if (!modal) return;
    const primary = document.getElementById('qrWhatsapp');
    const help = document.getElementById('qrHelpWhatsapp');
    const automatic = primary?.dataset?.fsAutomaticOrder === '1' || /recarga automática/i.test(text(primary?.textContent));

    if (automatic) {
      if (help) help.hidden = true;
      if (primary) {
        primary.disabled = true;
        primary.setAttribute('aria-disabled', 'true');
        primary.style.pointerEvents = 'none';
      }
    } else {
      if (help) help.hidden = false;
      if (primary) primary.style.removeProperty('pointer-events');
    }
  }

  function polish() {
    scheduled = false;
    document.querySelectorAll('#ordersList .record').forEach(polishRecord);
    polishQrModal();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(polish);
  }

  function install() {
    const orders = document.getElementById('ordersList');
    const qrModal = document.getElementById('qrModal');
    if (orders) new MutationObserver(schedule).observe(orders, { childList: true, subtree: true });
    if (qrModal) new MutationObserver(schedule).observe(qrModal, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','data-fs-automatic-order'] });
    document.addEventListener('fs:automation-capabilities-change', schedule);
    schedule();
  }

  window.FSOrderHistoryPolish = Object.freeze({ version: VERSION, refresh: schedule });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
