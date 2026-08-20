/* THE FRENCH STORE — BISA/SIP checkout integration.
   Real QR per order. Payment is confirmed only by the backend/SIP; never by a client-side click. */
(() => {
  const API_BASE = 'https://api.frenchstorebo.com';
  const QR_CREATE_PATH = '/bisa-sip/order-qr';
  const QR_STATUS_PATH = '/bisa-sip/order-status';
  const MAX_POLL_ATTEMPTS = 24;
  const POLL_MS = 5000;

  let currentQrOrderId = null;
  let currentQrOrderCode = null;
  let qrPollTimer = null;
  let qrPollAttempts = 0;
  let verifyingPayment = false;

  const originalCloseModal = closeModal;
  const originalStatusHtml = statusHtml;

  function paymentErrorMessage(code) {
    const map = {
      AUTH_REQUIRED: 'Tu sesión venció. Inicia sesión nuevamente.',
      ORDER_NOT_FOUND: 'No se encontró este pedido o no pertenece a tu cuenta.',
      ORDER_NOT_QR: 'Este pedido no utiliza pago por QR.',
      ORDER_TOTAL_INVALID: 'El total del pedido no es válido.',
      QR_GENERATING: 'El QR se está generando. Espera unos segundos y vuelve a intentar.',
      RATE_LIMITED: 'Hay demasiados intentos seguidos. Espera unos segundos.',
      INVALID_ORDER_ID: 'El pedido no es válido.'
    };
    if (map[code]) return map[code];
    if (String(code || '').startsWith('QR_NOT_REGENERABLE_')) return 'Este QR no puede regenerarse automáticamente. Actualiza Pedidos o contacta a soporte.';
    return 'No se pudo completar la operación con BISA en este momento. Intenta nuevamente.';
  }

  async function accessToken() {
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token || session?.access_token || null;
  }

  async function bisaApi(path, body) {
    const token = await accessToken();
    if (!token) throw Object.assign(new Error('AUTH_REQUIRED'), { code: 'AUTH_REQUIRED' });
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      const code = data?.error || `HTTP_${response.status}`;
      throw Object.assign(new Error(code), { code, status: response.status });
    }
    return data;
  }

  function stopQrPolling() {
    if (qrPollTimer) clearInterval(qrPollTimer);
    qrPollTimer = null;
    qrPollAttempts = 0;
  }

  closeModal = function patchedCloseModal(id) {
    if (id === 'qrModal') stopQrPolling();
    return originalCloseModal(id);
  };

  statusHtml = function patchedStatusHtml(s) {
    if (String(s || '').toUpperCase() === 'PAID') {
      return '<span class="status paid-status">✓ Pagado</span>';
    }
    return originalStatusHtml(s);
  };

  function ensureQrUi() {
    const modal = $('qrModal');
    if (!modal) return null;
    const card = modal.querySelector('.modal-card');
    const box = modal.querySelector('.qr-box');
    const verifyButton = $('qrWhatsapp');
    if (!card || !box || !verifyButton) return null;

    let img = box.querySelector('img');
    if (!img) {
      box.classList.remove('payment-complete-box');
      box.innerHTML = '<img id="qrOrderImage" alt="QR BISA del pedido" loading="eager" decoding="async">';
      img = box.querySelector('img');
    }
    if (!img.id) {
      img.id = 'qrOrderImage';
      img.alt = 'QR BISA del pedido';
      img.removeAttribute('src');
    }

    let state = $('qrPaymentState');
    if (!state) {
      state = document.createElement('div');
      state.id = 'qrPaymentState';
      state.className = 'payment-state pending';
      state.textContent = 'Preparando QR…';
      $('qrOrderTotal')?.after(state);
    }

    let meta = $('qrOrderMeta');
    if (!meta) {
      meta = document.createElement('div');
      meta.id = 'qrOrderMeta';
      meta.className = 'qr-order-meta';
      box.after(meta);
    }

    const notes = card.querySelectorAll('.security-note');
    if (notes[0]) {
      notes[0].innerHTML = 'QR individual generado por <b>BISA/SIP</b>. Verifica el <b>monto exacto</b> en tu banca antes de pagar. La tienda marcará el pago únicamente cuando SIP lo confirme.';
    }

    if (!verifyButton.dataset.bisaReady) {
      verifyButton.dataset.bisaReady = '1';
      verifyButton.textContent = 'Verificar pago';
      verifyButton.className = 'secondary-btn full verify-payment-btn';
      verifyButton.disabled = false;
    }

    let help = $('qrHelpWhatsapp');
    if (!help) {
      help = document.createElement('button');
      help.id = 'qrHelpWhatsapp';
      help.type = 'button';
      help.className = 'ghost-btn full qr-help-btn';
      help.textContent = 'Necesito ayuda por WhatsApp';
      verifyButton.after(help);
      help.onclick = () => {
        const code = currentQrOrderCode || 'mi pedido';
        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, FRENCH STORE. Necesito ayuda con el pago QR del pedido ${code}.`)}`, '_blank', 'noopener,noreferrer');
      };
    }

    return { modal, card, box, img, state, meta, verifyButton };
  }

  function setPaymentUi(data) {
    const ui = ensureQrUi();
    if (!ui) return;
    const paid = data?.paid === true || String(data?.payment_status || '').toUpperCase() === 'PAID';
    const amount = Number(data?.amount || 0);
    currentQrOrderId = data?.order_id || currentQrOrderId;
    currentQrOrderCode = data?.order_code || currentQrOrderCode;

    $('qrOrderCode').textContent = currentQrOrderCode ? `Pedido ${currentQrOrderCode}` : 'Pedido';
    $('qrOrderTotal').textContent = `Total: ${money(amount)}`;

    if (paid) {
      ui.state.className = 'payment-state paid';
      ui.state.textContent = '✓ Pago confirmado por BISA';
      ui.verifyButton.textContent = '✓ Pagado';
      ui.verifyButton.className = 'paid-order-btn full';
      ui.verifyButton.disabled = true;
      ui.img.removeAttribute('src');
      ui.box.classList.add('payment-complete-box');
      ui.box.innerHTML = '<div class="payment-checkmark" aria-hidden="true">✓</div><b class="payment-complete-title">PAGO CONFIRMADO</b>';
      ui.meta.textContent = 'El pago fue verificado automáticamente. Puedes revisar el estado del pedido en “Pedidos”.';
      stopQrPolling();
      loadOrders().catch(() => {});
      return;
    }

    ui.box.classList.remove('payment-complete-box');
    if (!ui.box.querySelector('img')) {
      ui.box.innerHTML = '<img id="qrOrderImage" alt="QR BISA del pedido" loading="eager" decoding="async">';
      ui.img = ui.box.querySelector('img');
    }
    if (data?.qr_image_base64) ui.img.src = `data:image/png;base64,${data.qr_image_base64}`;
    else ui.img.removeAttribute('src');

    const paymentStatus = String(data?.payment_status || 'PENDING').toUpperCase();
    ui.state.className = 'payment-state pending';
    ui.state.textContent = paymentStatus === 'CALLBACK_RECEIVED' ? 'Pago recibido · verificando con BISA…' : 'Pendiente de pago';
    const expiry = data?.expires_at ? ` · Vence: ${dateFmt(data.expires_at)}` : '';
    ui.meta.textContent = `${data?.alias ? `Referencia: ${data.alias}` : 'QR BISA'}${expiry}`;
    ui.verifyButton.textContent = verifyingPayment ? 'Verificando…' : 'Verificar pago';
    ui.verifyButton.className = 'secondary-btn full verify-payment-btn';
    ui.verifyButton.disabled = verifyingPayment;
  }

  function setQrError(message, retryOrder = null) {
    const ui = ensureQrUi();
    if (!ui) return;
    stopQrPolling();
    ui.state.className = 'payment-state error';
    ui.state.textContent = message;
    ui.meta.textContent = 'Tu pedido ya fue creado. No realices ningún pago si el QR oficial no aparece.';
    ui.img.removeAttribute('src');
    ui.verifyButton.textContent = 'Reintentar generar QR';
    ui.verifyButton.className = 'secondary-btn full';
    ui.verifyButton.disabled = false;
    ui.verifyButton.onclick = () => {
      if (retryOrder?.id) openBisaQrForOrder(retryOrder);
      else if (currentQrOrderId) openBisaQrForOrder({ id: currentQrOrderId, order_code: currentQrOrderCode });
    };
  }

  async function verifyCurrentPayment({ silent = false } = {}) {
    if (!currentQrOrderId || verifyingPayment) return;
    verifyingPayment = true;
    const ui = ensureQrUi();
    if (ui && !silent) {
      ui.verifyButton.disabled = true;
      ui.verifyButton.textContent = 'Verificando…';
    }
    try {
      const data = await bisaApi(QR_STATUS_PATH, { order_id: currentQrOrderId });
      setPaymentUi(data);
    } catch (error) {
      if (!silent) setQrError(paymentErrorMessage(error?.code || error?.message));
    } finally {
      verifyingPayment = false;
      const nextUi = ensureQrUi();
      if (nextUi && nextUi.state?.classList.contains('pending')) {
        nextUi.verifyButton.disabled = false;
        nextUi.verifyButton.textContent = 'Verificar pago';
        nextUi.verifyButton.onclick = () => verifyCurrentPayment({ silent: false });
      }
    }
  }

  function startQrPolling() {
    stopQrPolling();
    qrPollAttempts = 0;
    qrPollTimer = setInterval(async () => {
      if (!$('qrModal')?.classList.contains('open')) return stopQrPolling();
      qrPollAttempts += 1;
      await verifyCurrentPayment({ silent: true });
      if (qrPollAttempts >= MAX_POLL_ATTEMPTS) stopQrPolling();
    }, POLL_MS);
  }

  async function openBisaQrForOrder(order) {
    if (!order?.id) return;
    stopQrPolling();
    currentQrOrderId = order.id;
    currentQrOrderCode = order.order_code || currentQrOrderCode;
    lastQrOrder = { ...(lastQrOrder || {}), order_id: order.id, order_code: currentQrOrderCode };
    const ui = ensureQrUi();
    if (!ui) return;
    $('qrOrderCode').textContent = currentQrOrderCode ? `Pedido ${currentQrOrderCode}` : 'Pedido';
    $('qrOrderTotal').textContent = order.total_amount != null ? `Total: ${money(order.total_amount)}` : 'Preparando pago…';
    ui.state.className = 'payment-state pending';
    ui.state.textContent = 'Generando QR BISA…';
    ui.meta.textContent = 'Espera unos segundos. No cierres esta ventana mientras se genera el QR.';
    ui.img.removeAttribute('src');
    ui.verifyButton.disabled = true;
    ui.verifyButton.textContent = 'Generando…';
    openModal('qrModal');

    try {
      const data = await bisaApi(QR_CREATE_PATH, { order_id: order.id });
      currentQrOrderCode = data.order_code || currentQrOrderCode;
      setPaymentUi(data);
      const nowUi = ensureQrUi();
      if (!data.paid && nowUi) {
        nowUi.verifyButton.onclick = () => verifyCurrentPayment({ silent: false });
        startQrPolling();
      }
    } catch (error) {
      setQrError(paymentErrorMessage(error?.code || error?.message), order);
    }
  }

  async function checkoutBisaQr() {
    hideNotice($('checkoutResult'));
    if (!session) {
      closeModal('cartModal');
      openModal('authModal');
      return;
    }
    if (!cart.length) {
      showNotice($('checkoutResult'), 'Tu carrito está vacío.', 'error');
      return;
    }

    const button = $('checkoutQR');
    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.dataset.originalText || button.textContent;
      button.textContent = 'Creando pedido…';
    }

    try {
      const { data, error } = await sb.rpc('create_qr_order', { p_items: rpcItems(), p_customer_note: null });
      if (error) {
        const map = {
          INVALID_OR_INACTIVE_PRODUCT: 'Un producto cambió o ya no está disponible.',
          AUTH_REQUIRED: 'Debes iniciar sesión.',
          INVALID_CART: 'El carrito no es válido.',
          INVALID_CART_SIZE: 'El carrito contiene demasiados productos.'
        };
        showNotice($('checkoutResult'), map[error.message] || error.message, 'error');
        return;
      }
      if (!data?.ok || !data?.order_id) {
        showNotice($('checkoutResult'), 'No se pudo crear el pedido.', 'error');
        return;
      }

      cart = [];
      saveCart();
      renderCart();
      lastQrOrder = data;
      closeModal('cartModal');
      await loadOrders();
      await openBisaQrForOrder({
        id: data.order_id,
        order_code: data.order_code,
        total_amount: data.total
      });
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Pagar con QR';
      }
    }
  }

  loadOrders = async function loadOrdersWithPayments() {
    if (!session) return;
    const { data, error } = await sb
      .from('orders')
      .select('id,order_code,status,payment_method,total_amount,currency,created_at,updated_at,paid_at,customer_note')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      $('ordersList').innerHTML = `<div class="notice error">${esc(error.message)}</div>`;
      return;
    }

    $('ordersList').innerHTML = (data || []).map((o) => {
      const paid = Boolean(o.paid_at) || String(o.status).toUpperCase() === 'PAID';
      const paidBadge = paid ? '<span class="status paid-status">✓ Pagado</span>' : '';
      const workflowBadge = String(o.status).toUpperCase() === 'PAID' ? '' : statusHtml(o.status);
      const qrPending = o.payment_method === 'QR' && o.status === 'PENDING_PAYMENT' && !paid;
      const actions = paid
        ? '<div class="admin-actions"><button type="button" class="paid-order-btn" disabled>✓ Pagado</button></div>'
        : qrPending
          ? `<div class="admin-actions"><button type="button" class="secondary-btn qr-order-btn" data-order-qr="${esc(o.id)}">Pagar / Ver QR</button></div>`
          : '';
      return `<div class="record"><div class="record-top"><div><b>${esc(o.order_code)}</b><small>${dateFmt(o.created_at)} · ${esc(o.payment_method)}</small></div><div class="order-status-stack">${paidBadge}${workflowBadge}</div></div><div class="record-meta"><b>${money(o.total_amount)}</b>${o.customer_note ? `<span>${esc(o.customer_note)}</span>` : ''}</div>${actions}</div>`;
    }).join('') || '<div class="record"><small>Aún no tienes pedidos.</small></div>';

    $('ordersList').querySelectorAll('[data-order-qr]').forEach((button) => {
      button.onclick = () => {
        const order = (data || []).find((o) => String(o.id) === String(button.dataset.orderQr));
        if (order) openBisaQrForOrder(order);
      };
    });
  };

  function install() {
    ensureQrUi();
    const checkoutButton = $('checkoutQR');
    if (checkoutButton) checkoutButton.onclick = checkoutBisaQr;
    const verifyButton = $('qrWhatsapp');
    if (verifyButton) verifyButton.onclick = () => verifyCurrentPayment({ silent: false });
    const refresh = $('refreshOrders');
    if (refresh) refresh.onclick = loadOrders;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
