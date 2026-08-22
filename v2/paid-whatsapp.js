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

  function providerTagFromItems(items) {
    const providers = new Set((items || []).map((item) => String(item.provider || '').trim().toLowerCase()));
    const hasB = providers.has('bonoxs');
    const hasG = providers.has('gameton');
    if (hasB && hasG) return 'B+G';
    if (hasB) return 'B';
    if (hasG) return 'G';
    return '';
  }

  function productSummary(items) {
    const clean = (items || [])
      .map((item) => ({
        name: String(item.product_name || '').trim(),
        quantity: Math.max(1, Number(item.quantity || 1))
      }))
      .filter((item) => item.name);

    if (!clean.length) return '';
    const visible = clean.slice(0, 4);
    const lines = visible.map((item) => `${item.quantity > 1 ? `x${item.quantity} ` : ''}${item.name}`);
    if (clean.length > visible.length) lines.push(`+ ${clean.length - visible.length} producto${clean.length - visible.length === 1 ? '' : 's'} más`);
    return lines.length === 1 ? `🛒 ${lines[0]}` : `🛒 Productos:\n${lines.map((line) => `• ${line}`).join('\n')}`;
  }

  function markDeliveredButton(button) {
    if (!button) return;
    const record = button.closest?.('.record');
    record?.querySelectorAll?.('.paid-status').forEach((badge) => badge.remove());

    const stack = record?.querySelector?.('.order-status-stack');
    if (stack && !Array.from(stack.children).some((node) => /entregado/i.test(node.textContent || ''))) {
      const deliveredBadge = document.createElement('span');
      deliveredBadge.className = 'status';
      deliveredBadge.textContent = 'Entregado';
      stack.appendChild(deliveredBadge);
    }

    button.disabled = true;
    button.textContent = '✓ Entregado';
    button.classList.remove('paid-whatsapp-active');
    button.classList.remove('paid-order-btn');
    button.classList.add('delivered-order-btn');
    button.removeAttribute('title');
    button.dataset.paidWhatsappReady = '1';
  }

  function normalizeDeliveredRecords(root = document) {
    root.querySelectorAll?.('.record').forEach((record) => {
      const stack = record.querySelector('.order-status-stack');
      const delivered = Array.from(stack?.children || []).some((node) => /entregado/i.test(node.textContent || ''));
      if (!delivered) return;

      record.querySelectorAll('.paid-status').forEach((badge) => badge.remove());
      const paidButton = record.querySelector('.paid-order-btn');
      if (paidButton) markDeliveredButton(paidButton);
    });
  }

  async function orderDetails(orderCode) {
    if (!orderCode || !session) return { tag: '', products: '', status: '', paid: false };

    const { data: order, error: orderError } = await sb
      .from('orders')
      .select('id,status,paid_at')
      .eq('order_code', orderCode)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (orderError || !order?.id) return { tag: '', products: '', status: '', paid: false };

    const status = String(order.status || '').toUpperCase();
    const paid = Boolean(order.paid_at) || status === 'PAID';
    if (status === 'DELIVERED') return { tag: '', products: '', status, paid };

    const { data: items, error: itemError } = await sb
      .from('order_items')
      .select('provider,product_name,quantity')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    if (itemError) return { tag: '', products: '', status, paid };
    return {
      tag: providerTagFromItems(items),
      products: productSummary(items),
      status,
      paid
    };
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
      const details = await orderDetails(orderCode);
      if (details.status === 'DELIVERED') {
        markDeliveredButton(button);
        return;
      }
      if (!details.paid) return;

      const taggedCode = details.tag ? `${orderCode} [${details.tag}]` : orderCode;
      const message = [`✅ Pagado el pedido ${taggedCode}`, details.products].filter(Boolean).join('\n');
      window.open(
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } finally {
      delete button.dataset.paidWhatsappBusy;
      if (!button.classList.contains('delivered-order-btn')) {
        button.disabled = false;
        button.textContent = oldText || '✓ Pagado';
      }
    }
  }

  function activatePaidButtons(root = document) {
    normalizeDeliveredRecords(root);
    root.querySelectorAll?.('.paid-order-btn').forEach((button) => {
      const recordText = String(button.closest('.record')?.textContent || '').toLowerCase();
      if (recordText.includes('entregado')) {
        markDeliveredButton(button);
        return;
      }
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

// Load the isolated player/account fulfillment module after the core storefront
// has wired checkout buttons. This keeps app.js/BISA/Wallet logic untouched.
(() => {
  if (document.querySelector('script[data-fs-fulfillment-module]')) return;
  const script = document.createElement('script');
  script.src = './fulfillment-inputs.js?v=20260822-0621';
  script.defer = true;
  script.dataset.fsFulfillmentModule = '1';
  document.body.appendChild(script);
})();
