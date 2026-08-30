/* THE FRENCH STORE — R129 one-time paid WhatsApp action.
   The customer can open the prefilled paid-order WhatsApp notice only once per order.
   The one-time claim is enforced in Supabase, not localStorage, so refresh/new browser
   cannot regenerate it. Provider names are never returned to this module; only the
   internal reference codes G / B / H are included in the customer message.

   Payment is never marked by this button. It is enabled only after the backend has
   already confirmed paid_at. Provider purchases remain disabled/manual.

   Compatibility: if a future sanitized automation capability is explicitly live,
   the old automatic UI still fails closed through the existing capability contract.
*/
(() => {
  'use strict';

  const VERSION = 'r129-one-time-paid-whatsapp-20260830';
  const AVAILABLE_TEXT = 'Ya pagué · Avisar por WhatsApp';
  const USED_TEXT = '✓ Aviso por WhatsApp utilizado';

  function text(value) {
    return String(value ?? '').trim();
  }

  function orderCodeFromElement(element) {
    const record = element?.closest?.('.record');
    const recordText = record?.querySelector?.('.record-top b, .r6-order-code')?.textContent || '';
    const match = recordText.match(/FS-\d{6}-[A-Z0-9]{4}/i);
    if (match) return match[0].toUpperCase();

    const modalText = $('qrOrderCode')?.textContent || '';
    const modalMatch = modalText.match(/FS-\d{6}-[A-Z0-9]{4}/i);
    return modalMatch ? modalMatch[0].toUpperCase() : null;
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
    button.dataset.paidWhatsappUsed = '1';
    delete button.dataset.fsAutomaticOrder;
  }

  function markUsedButton(button) {
    if (!button) return;
    button.disabled = true;
    button.textContent = USED_TEXT;
    button.classList.remove('paid-whatsapp-active', 'automatic-order-btn');
    button.classList.add('paid-order-btn');
    button.title = 'Este pedido ya utilizó su único aviso por WhatsApp.';
    button.dataset.paidWhatsappReady = '1';
    button.dataset.paidWhatsappUsed = '1';
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
    const fallback = { status: '', paid: false, automatic: false, used: false, eligible: false };
    if (!orderCode || !session) return fallback;

    const { data: order, error: orderError } = await sb
      .from('orders')
      .select('id,status,paid_at')
      .eq('order_code', orderCode)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (orderError || !order?.id) return fallback;

    const status = text(order.status).toUpperCase();
    const paid = Boolean(order.paid_at) || status === 'PAID';
    if (status === 'DELIVERED') return { ...fallback, status, paid };

    const [{ data: items, error: itemError }, { data: noticeStatus, error: noticeError }] = await Promise.all([
      sb.from('order_items').select('product_id').eq('order_id', order.id).order('created_at', { ascending: true }),
      sb.rpc('get_my_paid_whatsapp_notice_status', { p_order_code: orderCode })
    ]);

    return {
      status,
      paid,
      automatic: itemError ? false : await automaticMode(items || []),
      used: noticeError ? false : noticeStatus?.used === true,
      eligible: noticeError ? paid : noticeStatus?.eligible === true
    };
  }

  function moneyText(value) {
    return `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function buildPaidMessage(claim) {
    const lines = [
      '✅ Pagado el pedido ' + text(claim?.order_code),
      '💎 THE FRENCH STORE',
      `💳 Pago: ${text(claim?.payment_method) || 'Confirmado'}`,
      `💰 Total: ${moneyText(claim?.total_amount)}`
    ];

    const items = Array.isArray(claim?.items) ? claim.items : [];
    items.forEach((item, index) => {
      lines.push('', `🎮 Producto ${index + 1}: ${text(item?.product_name) || 'Producto digital'}`);
      lines.push(`🔢 Cantidad: ${Math.max(1, Number(item?.quantity || 1))}`);

      const refCode = text(item?.ref_code).toUpperCase();
      if (['G', 'B', 'H'].includes(refCode)) lines.push(`🔖 Ref: ${refCode}`);

      const inputs = Array.isArray(item?.inputs) ? item.inputs : [];
      inputs.forEach((input) => {
        const label = text(input?.label);
        const value = text(input?.value);
        if (label && value) lines.push(`👤 ${label}: ${value}`);
      });
    });

    lines.push('', '📩 Aviso generado una sola vez desde frenchstorebo.com');
    return lines.join('\n').slice(0, 3900);
  }

  function whatsappNumber() {
    const configured = text(window.FSStorefrontConfig?.whatsapp);
    if (configured) return configured.replace(/\D+/g, '');
    try { return text(WHATSAPP).replace(/\D+/g, ''); } catch { return ''; }
  }

  function showOneTimeError(message) {
    const state = document.getElementById('qrPaymentState');
    if (state?.classList.contains('paid')) {
      state.textContent = message;
      return;
    }
    alert(message);
  }

  async function sendPaidNotice(button) {
    if (!button || button.dataset.paidWhatsappBusy === '1' || button.dataset.paidWhatsappUsed === '1') return;
    const orderCode = orderCodeFromElement(button);
    if (!orderCode) return;

    const oldText = button.textContent;
    button.dataset.paidWhatsappBusy = '1';
    button.disabled = true;
    button.textContent = 'Preparando aviso…';

    let consumed = false;
    try {
      const details = await orderDetails(orderCode);
      if (details.status === 'DELIVERED') {
        markDeliveredButton(button);
        return;
      }
      if (!details.paid || !details.eligible) {
        showOneTimeError('El pago todavía no está confirmado. Espera la confirmación antes de avisar por WhatsApp.');
        return;
      }
      if (details.automatic) {
        markAutomaticButton(button);
        return;
      }
      if (details.used) {
        markUsedButton(button);
        return;
      }

      const { data: claim, error } = await sb.rpc('claim_my_paid_whatsapp_notice', { p_order_code: orderCode });
      if (error) throw error;
      if (!claim?.ok) {
        if (claim?.error === 'ALREADY_USED') {
          markUsedButton(button);
          return;
        }
        throw new Error(claim?.error || 'WHATSAPP_NOTICE_CLAIM_FAILED');
      }

      consumed = true;
      markUsedButton(button);
      const phone = whatsappNumber();
      if (!phone) throw new Error('WHATSAPP_NUMBER_MISSING');
      const message = buildPaidMessage(claim);

      // Same-tab navigation avoids popup blockers. The server claim has already been
      // committed, so reloading/back/new browser cannot generate the notice again.
      window.location.assign(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error('FRENCH STORE paid WhatsApp:', text(error?.message || error).slice(0, 120));
      if (!consumed) showOneTimeError('No se pudo preparar el aviso por WhatsApp. Intenta nuevamente; el intento no se consumió.');
      else showOneTimeError('El aviso único ya fue generado. Si WhatsApp no abrió, revisa el pedido en “Pedidos” o contacta a soporte.');
    } finally {
      delete button.dataset.paidWhatsappBusy;
      if (!consumed && button.dataset.paidWhatsappUsed !== '1' && !button.classList.contains('delivered-order-btn') && button.dataset.fsAutomaticOrder !== '1') {
        button.disabled = false;
        button.textContent = oldText || AVAILABLE_TEXT;
      }
    }
  }

  async function preparePaidButton(button) {
    if (!button || button.dataset.paidWhatsappClassifying === '1') return;
    const recordText = text(button.closest('.record')?.textContent).toLowerCase();
    if (recordText.includes('entregado')) {
      markDeliveredButton(button);
      return;
    }
    if (!/pagado/i.test(button.textContent || '') && button.dataset.fsAutomaticOrder !== '1') return;
    if (button.dataset.paidWhatsappReady === '1') {
      if (button.dataset.paidWhatsappUsed === '1' || button.dataset.fsAutomaticOrder === '1') button.disabled = true;
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
      if (details.used) {
        markUsedButton(button);
        return;
      }

      button.dataset.paidWhatsappReady = '1';
      button.disabled = false;
      button.textContent = AVAILABLE_TEXT;
      button.classList.add('paid-whatsapp-active');
      button.title = 'Avisar pedido pagado por WhatsApp · disponible una sola vez';
      if (button.dataset.paidWhatsappBound !== '1') {
        button.dataset.paidWhatsappBound = '1';
        button.addEventListener('click', () => sendPaidNotice(button));
      }
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

  window.FSPaidWhatsapp = Object.freeze({ version: VERSION });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
