/* THE FRENCH STORE — R48 payment action guard.
   Prevents accidental repeated customer actions without changing payment authority.
   - BISA remains the only authority for PAID.
   - Automatic fulfillment remains server-side/idempotent.
   - This module only limits repeated UI clicks for the same order. */
(() => {
  'use strict';

  const VERSION = 'payment-action-guard-v1-20260825';
  const QR_PREFIX = 'fs_r48_qr_verify_once:';
  const MANUAL_PREFIX = 'fs_r48_manual_paid_notice_once:';
  const QR_TTL_MS = 30 * 60 * 1000;
  const MANUAL_TTL_MS = 24 * 60 * 60 * 1000;
  let scheduled = false;

  function text(value) {
    return String(value ?? '').trim();
  }

  function orderCodeFromText(value) {
    const match = text(value).match(/FS-\d{6}-[A-Z0-9]{4}/i);
    return match ? match[0].toUpperCase() : null;
  }

  function qrOrderCode() {
    return orderCodeFromText(document.getElementById('qrOrderCode')?.textContent);
  }

  function orderCodeForButton(button) {
    return orderCodeFromText(button?.closest?.('.record')?.textContent) || qrOrderCode();
  }

  function readTimestamp(key, ttlMs) {
    try {
      const raw = Number(localStorage.getItem(key) || 0);
      if (!Number.isFinite(raw) || raw <= 0) return 0;
      if (Date.now() - raw > ttlMs) {
        localStorage.removeItem(key);
        return 0;
      }
      return raw;
    } catch {
      return 0;
    }
  }

  function markTimestamp(key) {
    try { localStorage.setItem(key, String(Date.now())); } catch {}
  }

  function isQrVerifyButton(button) {
    if (!button || button.id !== 'qrWhatsapp') return false;
    if (!button.classList.contains('verify-payment-btn')) return false;
    if (button.classList.contains('paid-order-btn') || button.classList.contains('automatic-order-btn') || button.classList.contains('delivered-order-btn')) return false;
    const state = document.getElementById('qrPaymentState');
    return Boolean(state?.classList.contains('pending'));
  }

  function lockQrButtonIfUsed() {
    const button = document.getElementById('qrWhatsapp');
    if (!isQrVerifyButton(button)) return;
    const code = qrOrderCode();
    if (!code) return;
    const used = readTimestamp(`${QR_PREFIX}${code}`, QR_TTL_MS);
    if (!used) {
      if (!button.disabled && !/verificando/i.test(text(button.textContent))) {
        button.textContent = 'Ya pagué · verificar una vez';
        button.title = 'Solo necesitas solicitar una verificación manual. Después la página sigue comprobando el banco automáticamente.';
      }
      delete button.dataset.fsR48QrLocked;
      return;
    }

    button.disabled = true;
    button.dataset.fsR48QrLocked = '1';
    button.textContent = '✓ Verificación solicitada · esperando banco';
    button.title = 'La verificación manual ya fue solicitada. La página continuará consultando el estado automáticamente.';
    const meta = document.getElementById('qrOrderMeta');
    if (meta && !/verificación manual ya fue solicitada/i.test(text(meta.textContent))) {
      meta.textContent = `${text(meta.textContent)} · La verificación manual ya fue solicitada; no necesitas volver a tocar el botón.`.trim();
    }
  }

  function isManualPaidNotice(button) {
    return Boolean(button?.classList?.contains('paid-whatsapp-active'));
  }

  function lockManualPaidButton(button) {
    if (!isManualPaidNotice(button)) return;
    const code = orderCodeForButton(button);
    if (!code) return;
    const used = readTimestamp(`${MANUAL_PREFIX}${code}`, MANUAL_TTL_MS);
    if (!used) {
      if (!button.disabled && !button.dataset.paidWhatsappBusy) {
        button.textContent = 'Avisar pago · 1 intento';
        button.title = 'Abre una sola vez el aviso por WhatsApp para evitar mensajes duplicados del mismo pedido.';
      }
      delete button.dataset.fsR48ManualLocked;
      return;
    }
    button.disabled = true;
    button.dataset.fsR48ManualLocked = '1';
    button.textContent = '✓ Aviso de pago ya abierto';
    button.title = 'Este pedido ya abrió el aviso de pago. Usa el botón general de ayuda si necesitas soporte adicional.';
  }

  function refreshLocks() {
    scheduled = false;
    lockQrButtonIfUsed();
    document.querySelectorAll('.paid-whatsapp-active').forEach(lockManualPaidButton);
  }

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshLocks);
  }

  function onCaptureClick(event) {
    const button = event.target.closest?.('button');
    if (!button) return;

    if (isQrVerifyButton(button)) {
      const code = qrOrderCode();
      if (!code) return;
      const key = `${QR_PREFIX}${code}`;
      if (readTimestamp(key, QR_TTL_MS)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lockQrButtonIfUsed();
        return;
      }
      // Mark before the existing BISA handler runs. The existing automatic polling
      // continues even if the one manual verification does not yet see the payment.
      markTimestamp(key);
      setTimeout(scheduleRefresh, 0);
      return;
    }

    if (isManualPaidNotice(button)) {
      const code = orderCodeForButton(button);
      if (!code) return;
      const key = `${MANUAL_PREFIX}${code}`;
      if (readTimestamp(key, MANUAL_TTL_MS)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lockManualPaidButton(button);
        return;
      }
      markTimestamp(key);
      setTimeout(scheduleRefresh, 0);
    }
  }

  function install() {
    document.addEventListener('click', onCaptureClick, true);
    ['qrModal', 'ordersList'].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      new MutationObserver(scheduleRefresh).observe(node, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'disabled']
      });
    });
    scheduleRefresh();
  }

  window.FSPaymentActionGuard = Object.freeze({ version: VERSION, refresh: scheduleRefresh });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
