/* 💎 French Store 💎 — lightweight customer order-history polish.
   Presentation only: formats payment labels and never changes payment/order state. */
(() => {
  'use strict';
  const VERSION = 'manual-orders-20260913';
  let scheduled = false;

  const text = (value) => String(value ?? '').trim();

  function paymentLabel(raw) {
    const value = text(raw).toUpperCase();
    if (value === 'FRENCH_WALLET') return '💎 French Wallet';
    if (value === 'QR') return '▣ QR';
    return raw;
  }

  function polishRecord(record) {
    const meta = record?.querySelector?.('.record-top small');
    if (!meta || meta.dataset.fsPaymentPolished === '1') return;
    const parts = text(meta.textContent).split(' · ');
    if (parts.length < 2) return;
    const current = parts[parts.length - 1];
    const formatted = paymentLabel(current);
    if (formatted !== current) {
      parts[parts.length - 1] = formatted;
      meta.textContent = parts.join(' · ');
    }
    meta.dataset.fsPaymentPolished = '1';
  }

  function polish() {
    scheduled = false;
    document.querySelectorAll('#ordersList .record').forEach(polishRecord);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(polish);
  }

  function install() {
    const orders = document.getElementById('ordersList');
    if (orders) new MutationObserver(schedule).observe(orders, { childList: true, subtree: true });
    schedule();
  }

  window.FSOrderHistoryPolish = Object.freeze({ version: VERSION, refresh: schedule });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
