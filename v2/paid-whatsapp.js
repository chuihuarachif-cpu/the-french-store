/* THE FRENCH STORE — paid order action.
   Manual orders keep the WhatsApp “Pagado” action.
   Orders made entirely of live 24/7 products never ask the customer to report payment;
   they show an automatic-processing message instead.

   Automatic/manual classification comes only from the sanitized Worker capability
   signal. If that signal is unavailable, this module fails closed to the manual flow
   and never promises automatic delivery.
*/
(() => {
  'use strict';

  function orderCodeFromElement(element) {
    const record = element?.closest?.('.record');
    const recordText = record?.querySelector?.('.record-top b, .r6-order-code')?.textContent || '';
    const match = recordText.match(/FS-\d{6}-[A-Z0-9]{4}/i);
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

  function removeAutomaticNote(record) {
    record?.querySelector?.('.auto-fulfillment-note')?.remove();
  }

  function markDeliveredButton(button) {
    if (!button) return;
    const record = button.closest?.('.record');
    record?.querySelectorAll?.('.paid-status').forEach((badge) => badge.remove());
    removeAutomaticNote(record);

    const stack = record?.querySelector?.('.order-status-stack');
    if (stack && !Array.from(stack.children).some((node) => /entregado/i.test(node.textContent || ''))) {
      const deliveredBadge = document.createElement('span');
      deliveredBadge.className = 'status';
      deliveredBadge.textContent = 'Entregado';
      stack.appendChild(deliveredBadge);
    }

    button.disabled = true;
    button.textContent = '✓ Entregado';
    button.classList.remove('paid-whatsapp-active', 'paid-order-btn', 'automatic-order-btn');
    button.classList.add('delivered-order-btn');
    button.removeAttribute('title');
    button.dataset.paidWhatsappReady = '1';
    delete button.dataset.fsAutomaticOrder;
  }

  function markAutomaticButton(button) {
    if (!button) return;
    const record = button.closest?.('.record');
    const stack = record?.querySelector?.('.order-status-stack');
    if (stack && !Array.from(stack.children).some((node) => /automático 24\/7/i.test(node.textContent || ''))) {
      const badge = document.createElement('span');
      badge.className = 'status';
      badge.textContent = 'Automático 24/7';
      stack.appendChild(badge);
    }

    if (record && !record.querySelector('.auto-fulfillment-note')) {
      const note = document.createElement('div');
      note.className = 'auto-fulfillment-note';
      note.textContent = '⚡ Pago confirmado. Tu recarga se procesará automáticamente y se acreditará a la cuenta verificada.';
      const actions = button.closest('.admin-actions');
      if (actions?.parentNode) actions.parentNode.insertBefore(note, actions);
      else record.appendChild(note);
    }

    button.disabled = true;
    button.textContent = '⚡ Recarga automática en proceso';
    button.classList.remove('paid-whatsapp-active');
    button.classList.add('automatic-order-btn');
    button.removeAttribute('title');
    button.dataset.paidWhatsappReady = '1';
    button.dataset.fsAutomaticOrder = '1';
  }

  function normalizeDeliveredRecords(root = document) {
    root.querySelectorAll?.('.record').forEach((record) => {
      const stack = record.querySelector('.order-status-stack');
      const delivered = Array.from(stack?.children || []).some((node) => /entregado/i.test(node.textContent || ''));
      if (!delivered) return;

      record.querySelectorAll('.paid-status').forEach((badge) => badge.remove());
      const paidButton = record.querySelector('.paid-order-btn,.automatic-order-btn');
      if (paidButton) markDeliveredButton(paidButton);
    });
  }

  async function automaticMode(items) {
    const ids = (items || []).map((item) => Number(item.product_id)).filter((id) => Number.isSafeInteger(id) && id > 0);
    if (!ids.length || !window.FSAutomationCapabilities?.classifyProducts) return false;
    try {
      const mode = await window.FSAutomationCapabilities.classifyProducts(ids);
      return mode?.known === true && mode?.automatic === true;
    } catch {
      return false;
    }
  }

  async function orderDetails(orderCode) {
    const fallback = { tag: '', products: '', status: '', paid: false, automatic: false };
    if (!orderCode || !session) return fallback;

    const { data: order, error: orderError } = await sb
      .from('orders')
      .select('id,status,paid_at')
      .eq('order_code', orderCode)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (orderError || !order?.id) return fallback;

    const status = String(order.status || '').toUpperCase();
    const paid = Boolean(order.paid_at) || status === 'PAID';
    if (status === 'DELIVERED') return { ...fallback, status, paid };

    const { data: items, error: itemError } = await sb
      .from('order_items')
      .select('provider,product_id,product_name,quantity')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    if (itemError) return { ...fallback, status, paid };
    return {
      tag: providerTagFromItems(items),
      products: productSummary(items),
      status,
      paid,
      automatic: await automaticMode(items)
    };
  }

  async function sendPaidNotice(button) {
    if (!button || button.dataset.paidWhatsappBusy === '1') return;
    const orderCode = orderCodeFromElement(button);
    if (!orderCode) return;

    const oldText = button.textContent;
    button.dataset.paidWhatsappBusy = '1';
    button.disabled = true;
    button.textContent = 'Comprobando pedido…';
    try {
      const details = await orderDetails(orderCode);
      if (details.status === 'DELIVERED') {
        markDeliveredButton(button);
        return;
      }
      if (!details.paid) return;
      if (details.automatic) {
        markAutomaticButton(button);
        return;
      }

      const taggedCode = details.tag ? `${orderCode} [${details.tag}]` : orderCode;
      const message = [`✅ Pagado el pedido ${taggedCode}`, details.products].filter(Boolean).join('\n');
      window.open(
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } finally {
      delete button.dataset.paidWhatsappBusy;
      if (!button.classList.contains('delivered-order-btn') && button.dataset.fsAutomaticOrder !== '1') {
        button.disabled = false;
        button.textContent = oldText || '✓ Pagado';
      }
    }
  }

  async function preparePaidButton(button) {
    if (!button || button.dataset.paidWhatsappClassifying === '1') return;
    const recordText = String(button.closest('.record')?.textContent || '').toLowerCase();
    if (recordText.includes('entregado')) {
      markDeliveredButton(button);
      return;
    }
    if (!/pagado/i.test(button.textContent || '') && button.dataset.fsAutomaticOrder !== '1') return;
    if (button.dataset.paidWhatsappReady === '1') {
      if (button.dataset.fsAutomaticOrder === '1') button.disabled = true;
      else if (button.disabled && button.dataset.paidWhatsappBusy !== '1') button.disabled = false;
      return;
    }

    const orderCode = orderCodeFromElement(button);
    if (!orderCode) return;
    button.dataset.paidWhatsappClassifying = '1';
    try {
      const details = await orderDetails(orderCode);
      if (details.status === 'DELIVERED') {
        markDeliveredButton(button);
        return;
      }
      if (!details.paid) return;
      if (details.automatic) {
        markAutomaticButton(button);
        return;
      }

      button.dataset.paidWhatsappReady = '1';
      button.disabled = false;
      button.classList.add('paid-whatsapp-active');
      button.title = 'Avisar pedido pagado por WhatsApp';
      button.addEventListener('click', () => sendPaidNotice(button));
    } finally {
      delete button.dataset.paidWhatsappClassifying;
    }
  }

  function activatePaidButtons(root = document) {
    normalizeDeliveredRecords(root);
    root.querySelectorAll?.('.paid-order-btn').forEach((button) => {
      preparePaidButton(button).catch(() => {});
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

    if (orders) observer.observe(orders, { childList: true, subtree: true });
    if (qrModal) observer.observe(qrModal, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
