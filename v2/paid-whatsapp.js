/* THE FRENCH STORE — paid order WhatsApp action.
   The green button becomes clickable only after the UI already shows a backend-confirmed payment.
   Provider tags are internal short codes only: B=BONOXS, G=Gameton, B+G=mixed.
   Manual products keep the normal FS order code without inventing a provider tag. */
(() => {
  function orderCodeFromElement(element) {
    const record = element?.closest?.('.record');
    const text = record?.querySelector?.('.record-top b')?.textContent || '';
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
    const orderCode = orderCodeFromElement(button);
    if (!orderCode) return;

    const oldText = button.textContent;
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
      button.disabled = false;
      button.textContent = oldText || '✓ Pagado';
    }
  }

  function activatePaidButtons(root = document) {
    root.querySelectorAll?.('.paid-order-btn').forEach((button) => {
      if (!/pagado/i.test(button.textContent || '')) return;
      button.disabled = false;
      button.classList.add('paid-whatsapp-active');
      button.title = 'Avisar pedido pagado por WhatsApp';
      button.onclick = () => sendPaidNotice(button);
    });
  }

  function install() {
    activatePaidButtons(document);

    const observer = new MutationObserver(() => activatePaidButtons(document));
    const orders = $('ordersList');
    const qrModal = $('qrModal');
    if (orders) observer.observe(orders, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class'] });
    if (qrModal) observer.observe(qrModal, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ['disabled', 'class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
