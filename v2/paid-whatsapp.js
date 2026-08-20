/* THE FRENCH STORE — paid order WhatsApp action.
   The green button becomes clickable only after the UI already shows a backend-confirmed payment.
   Provider tags are internal short codes only: B=BONOXS, G=Gameton, B+G=mixed.
   Manual products keep the normal FS order code without inventing a provider tag.

   Performance note:
   - Observe ONLY child-list changes. Do NOT observe class/disabled mutations, because this script itself
     changes those attributes and that can create a mutation feedback loop on mobile browsers.
   - Each paid button is prepared only once.
*/
(() => {
  'use strict';

  function orderCodeFromElement(element) {
    const record = element?.closest?.('.record');
    const text = record?.querySelector?.('.record-top b, .r6-order-code')?.textContent || '';
    const match = text.match(/FS-\d{6}-[A-Z0-9]{4}/i);
    if (match) return match[0].toUpperCase();

    const modalText = $('qrOrderCode')?.textContent || '';
    const modalMatch = modalText.match(/FS-\d{6}-[A-Z0-9]{4}/i);
    return modalMatch ? modalMatch[0].toUpperCase() : null;
  }

  async function providerTag(orderCode) {
    if (!orderCode || !session) return '';

    const { data: order, error: orderError } = await sb
      .from('orders')
      .select('id')
      .eq('order_code', orderCode)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (orderError || !order?.id) return '';

    const { data: items, error: itemError } = await sb
      .from('order_items')
      .select('provider')
      .eq('order_id', order.id);

    if (itemError) return '';

    const providers = new Set((items || []).map((item) => String(item.provider || '').trim().toLowerCase()));
    const hasB = providers.has('bonoxs');
    const hasG = providers.has('gameton');
    if (hasB && hasG) return 'B+G';
    if (hasB) return 'B';
    if (hasG) return 'G';
    return '';
  }

  async function sendPaidNotice(button) {
    if (!button || button.dataset.paidWhatsappBusy === '1') return;
    const orderCode = orderCodeFromElement(button);
    if (!orderCode) return;

    const oldText = button.textContent;
    button.dataset.paidWhatsappBusy = '1';
    button.disabled = true;
    button.textContent = 'Preparando WhatsApp…';
    try {
      const tag = await providerTag(orderCode);
      const taggedCode = tag ? `${orderCode} [${tag}]` : orderCode;
      const message = `✅ Pagado el pedido ${taggedCode}`;
      window.open(
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } finally {
      delete button.dataset.paidWhatsappBusy;
      button.disabled = false;
      button.textContent = oldText || '✓ Pagado';
    }
  }

  function activatePaidButtons(root = document) {
    root.querySelectorAll?.('.paid-order-btn').forEach((button) => {
      if (!/pagado/i.test(button.textContent || '')) return;
      if (button.dataset.paidWhatsappReady === '1') {
        if (button.disabled && button.dataset.paidWhatsappBusy !== '1') button.disabled = false;
        return;
      }

      button.dataset.paidWhatsappReady = '1';
      button.disabled = false;
      button.classList.add('paid-whatsapp-active');
      button.title = 'Avisar pedido pagado por WhatsApp';
      button.addEventListener('click', () => sendPaidNotice(button));
    });
  }

  function install() {
    const orders = $('ordersList');
    const qrModal = $('qrModal');
    activatePaidButtons(document);

    const observer = new MutationObserver(() => {
      if (orders) activatePaidButtons(orders);
      if (qrModal) activatePaidButtons(qrModal);
    });

    // Only DOM insert/remove events are observed. Attribute changes made by
    // activatePaidButtons are intentionally NOT observed, preventing a loop.
    if (orders) observer.observe(orders, { childList: true, subtree: true });
    if (qrModal) observer.observe(qrModal, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
