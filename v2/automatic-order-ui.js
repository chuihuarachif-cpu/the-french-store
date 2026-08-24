/* THE FRENCH STORE — automatic paid-order QR message.
   Runs only after the BISA UI already has a backend-confirmed payment.
   It never marks a payment paid and never decides provider routing.
   Automatic mode comes from the sanitized Worker capability signal; failure is
   fail-closed and leaves the existing manual paid flow untouched. */
(() => {
  'use strict';

  const VERSION = 'automatic-order-ui-v1-20260824';
  let checking = false;
  let lastSignature = '';

  function text(value) {
    return String(value ?? '').trim();
  }

  function orderCode() {
    const value = text(document.getElementById('qrOrderCode')?.textContent);
    const match = value.match(/FS-\d{6}-[A-Z0-9]{4}/i);
    return match ? match[0].toUpperCase() : null;
  }

  async function currentOrderProductIds(code) {
    if (!code || !session?.user?.id) return [];
    const { data: order, error } = await sb
      .from('orders')
      .select('id')
      .eq('order_code', code)
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error || !order?.id) return [];

    const { data: items, error: itemError } = await sb
      .from('order_items')
      .select('product_id')
      .eq('order_id', order.id);
    if (itemError) return [];
    return (items || []).map((item) => Number(item.product_id)).filter((id) => Number.isSafeInteger(id) && id > 0);
  }

  function applyAutomaticUi() {
    const button = document.getElementById('qrWhatsapp');
    const meta = document.getElementById('qrOrderMeta');
    const state = document.getElementById('qrPaymentState');
    if (!button || !meta || !state) return;

    button.disabled = true;
    button.textContent = '⚡ Recarga automática en proceso';
    button.classList.remove('paid-whatsapp-active');
    button.classList.add('automatic-order-btn');
    button.dataset.fsAutomaticOrder = '1';
    button.removeAttribute('title');
    meta.textContent = '⚡ Pago confirmado. Tu recarga se procesará automáticamente y se acreditará a la cuenta verificada. No necesitas avisarnos por WhatsApp.';
    state.textContent = '✓ Pago confirmado · procesamiento automático';
  }

  async function refresh() {
    const modal = document.getElementById('qrModal');
    const state = document.getElementById('qrPaymentState');
    const button = document.getElementById('qrWhatsapp');
    if (!modal || !state || !button || !state.classList.contains('paid')) return;
    if (!window.FSAutomationCapabilities?.classifyProducts || checking) return;

    const code = orderCode();
    if (!code) return;
    const signature = `${code}:${text(state.textContent)}`;
    if (signature === lastSignature && button.dataset.fsAutomaticOrder === '1') return;

    checking = true;
    try {
      const ids = await currentOrderProductIds(code);
      if (!ids.length) return;
      const mode = await window.FSAutomationCapabilities.classifyProducts(ids);
      if (mode?.known === true && mode?.automatic === true) {
        applyAutomaticUi();
        lastSignature = signature;
      }
    } catch {
      // Fail closed: keep the normal manual paid UI.
    } finally {
      checking = false;
    }
  }

  function install() {
    const modal = document.getElementById('qrModal');
    if (modal) new MutationObserver(() => refresh().catch(() => {})).observe(modal, { childList:true, subtree:true });
    document.addEventListener('fs:automation-capabilities-change', () => refresh().catch(() => {}));
    refresh().catch(() => {});
  }

  window.FSAutomaticOrderUI = Object.freeze({ version: VERSION, refresh });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
