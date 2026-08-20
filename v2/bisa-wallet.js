/* THE FRENCH STORE — French Wallet via BISA/SIP.
   Dynamic QR, automatic bank verification and automatic Wallet credit.
   No "Pagado"/WhatsApp button is used for Wallet topups. */
(() => {
  const API_BASE = 'https://api.frenchstorebo.com';
  const TOPUP_QR_PATH = '/bisa-sip/topup-qr';
  const TOPUP_STATUS_PATH = '/bisa-sip/topup-status';
  const TOPUP_CANCEL_PATH = '/bisa-sip/topup-cancel';
  const POLL_MS = 5000;
  const MAX_POLL_ATTEMPTS = 24;

  let currentTopupId = null;
  let topupTimer = null;
  let topupAttempts = 0;
  let checking = false;

  const previousCloseModal = closeModal;

  function stopTopupPolling() {
    if (topupTimer) clearInterval(topupTimer);
    topupTimer = null;
    topupAttempts = 0;
  }

  closeModal = function closeModalWithWallet(id) {
    if (id === 'topupQrModal') stopTopupPolling();
    return previousCloseModal(id);
  };

  async function accessToken() {
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token || session?.access_token || null;
  }

  async function walletApi(path, body) {
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
      throw Object.assign(new Error(code), { code, status: response.status, data });
    }
    return data;
  }

  function errorMessage(code) {
    const map = {
      AUTH_REQUIRED: 'Tu sesión venció. Inicia sesión nuevamente.',
      TOPUP_NOT_FOUND: 'No se encontró esta solicitud de carga.',
      TOPUP_NOT_QR: 'Esta solicitud no utiliza QR.',
      TOPUP_AMOUNT_INVALID: 'El monto de la carga no es válido.',
      INVALID_REQUEST_ID: 'La solicitud no es válida.',
      QR_GENERATING: 'El QR todavía se está generando. Espera unos segundos.',
      RATE_LIMITED: 'Hay demasiados intentos seguidos. Espera unos segundos.',
      TOPUP_ALREADY_PAID: 'Esta carga ya fue pagada y acreditada.',
      TOPUP_NOT_PENDING: 'Esta solicitud ya no está pendiente.'
    };
    if (map[code]) return map[code];
    if (String(code || '').startsWith('TOPUP_NOT_PENDING_')) return 'Esta solicitud ya no está pendiente.';
    if (String(code || '').startsWith('QR_NOT_REGENERABLE_')) return 'Este QR ya no puede regenerarse. Actualiza tu Wallet o contacta a soporte.';
    return 'No se pudo completar la operación con BISA en este momento. Intenta nuevamente.';
  }

  function ensureTopupUi() {
    const modal = $('topupQrModal');
    if (!modal) return null;
    const card = modal.querySelector('.modal-card');
    const box = modal.querySelector('.qr-box');
    const cancel = $('cancelTopupRequest');
    if (!card || !box || !cancel) return null;

    let img = box.querySelector('img');
    if (!img) {
      box.classList.remove('payment-complete-box');
      box.innerHTML = '<img id="topupBisaQrImage" alt="QR BISA para French Wallet" loading="eager" decoding="async">';
      img = box.querySelector('img');
    }
    img.id = 'topupBisaQrImage';
    img.alt = 'QR BISA para French Wallet';

    let state = $('topupPaymentState');
    if (!state) {
      state = document.createElement('div');
      state.id = 'topupPaymentState';
      state.className = 'payment-state pending';
      state.textContent = 'Preparando QR…';
      $('topupQrReference')?.after(state);
    }

    let meta = $('topupBisaMeta');
    if (!meta) {
      meta = document.createElement('div');
      meta.id = 'topupBisaMeta';
      meta.className = 'qr-order-meta';
      box.after(meta);
    }

    const notes = card.querySelectorAll('.security-note');
    if (notes[0]) notes[0].innerHTML = 'Escanea el <b>QR individual BISA/SIP</b> y verifica el <b>monto exacto</b> antes de pagar.';
    if (notes[1]) notes[1].innerHTML = '<b>La acreditación es automática.</b> Cuando BISA confirme el pago, el saldo aparecerá en French Wallet sin que tengas que avisar por WhatsApp.';
    if (notes[2]) notes[2].innerHTML = 'Si todavía no pagaste, puedes cancelar la solicitud. <b>No la canceles mientras tu banca esté procesando el pago.</b>';

    return { modal, card, box, img, state, meta, cancel };
  }

  function setTopupUi(data) {
    const ui = ensureTopupUi();
    if (!ui) return;
    currentTopupId = data?.request_id || currentTopupId;
    const credited = data?.credited === true || String(data?.request_status || '').toUpperCase() === 'APPROVED';
    const amount = Number(data?.amount || 0);

    $('topupQrAmount').textContent = `Carga de ${money(amount)}`;
    $('topupQrReference').textContent = `Solicitud: ${data?.payment_reference || '—'}`;

    if (credited) {
      ui.state.className = 'payment-state paid';
      ui.state.textContent = '✓ Saldo acreditado automáticamente';
      ui.box.classList.add('payment-complete-box');
      ui.box.innerHTML = '<div class="payment-checkmark" aria-hidden="true">✓</div><b class="payment-complete-title">WALLET ACREDITADA</b>';
      ui.meta.textContent = `${money(amount)} ya está disponible en tu French Wallet.`;
      ui.cancel.classList.add('hidden');
      stopTopupPolling();
      loadWallet().catch(() => {});
      return;
    }

    ui.cancel.classList.remove('hidden');
    ui.box.classList.remove('payment-complete-box');
    if (!ui.box.querySelector('img')) {
      ui.box.innerHTML = '<img id="topupBisaQrImage" alt="QR BISA para French Wallet" loading="eager" decoding="async">';
      ui.img = ui.box.querySelector('img');
    }
    if (data?.qr_image_base64) ui.img.src = `data:image/png;base64,${data.qr_image_base64}`;
    else ui.img.removeAttribute('src');

    const status = String(data?.payment_status || 'PENDING').toUpperCase();
    ui.state.className = 'payment-state pending';
    ui.state.textContent = status === 'CALLBACK_RECEIVED' ? 'Pago recibido · acreditando Wallet…' : 'Pendiente de pago';
    const expiry = data?.expires_at ? ` · Vence: ${dateFmt(data.expires_at)}` : '';
    ui.meta.textContent = `${data?.alias ? `Referencia BISA: ${data.alias}` : 'QR BISA'}${expiry}`;
  }

  function setTopupError(message) {
    const ui = ensureTopupUi();
    if (!ui) return;
    stopTopupPolling();
    ui.state.className = 'payment-state error';
    ui.state.textContent = message;
    ui.meta.textContent = 'No pagues si el QR oficial BISA no aparece correctamente.';
    ui.img?.removeAttribute('src');
  }

  async function verifyTopup({ silent = false } = {}) {
    if (!currentTopupId || checking) return;
    checking = true;
    try {
      const data = await walletApi(TOPUP_STATUS_PATH, { request_id: currentTopupId });
      setTopupUi(data);
    } catch (error) {
      if (!silent) setTopupError(errorMessage(error?.code || error?.message));
    } finally {
      checking = false;
    }
  }

  function startTopupPolling() {
    stopTopupPolling();
    topupAttempts = 0;
    topupTimer = setInterval(async () => {
      if (!$('topupQrModal')?.classList.contains('open')) return stopTopupPolling();
      topupAttempts += 1;
      await verifyTopup({ silent: true });
      if (topupAttempts >= MAX_POLL_ATTEMPTS) stopTopupPolling();
    }, POLL_MS);
  }

  async function openBisaTopupQr(data) {
    const requestId = data?.request_id || data?.id;
    if (!requestId) return;
    currentTopupId = requestId;
    lastTopupRequest = { ...(lastTopupRequest || {}), ...data, request_id: requestId };
    const ui = ensureTopupUi();
    if (!ui) return;

    $('topupQrAmount').textContent = data?.amount != null ? `Carga de ${money(data.amount)}` : 'Preparando carga';
    $('topupQrReference').textContent = `Solicitud: ${data?.payment_reference || '—'}`;
    ui.state.className = 'payment-state pending';
    ui.state.textContent = 'Generando QR BISA…';
    ui.meta.textContent = 'Espera unos segundos. El monto se obtiene directamente de tu solicitud de Wallet.';
    ui.img.removeAttribute('src');
    ui.cancel.classList.remove('hidden');
    openModal('topupQrModal');

    try {
      const result = await walletApi(TOPUP_QR_PATH, { request_id: requestId });
      setTopupUi(result);
      if (!result.credited) startTopupPolling();
    } catch (error) {
      setTopupError(errorMessage(error?.code || error?.message));
    }
  }

  async function requestBisaTopup() {
    hideNotice($('topupResult'));
    const amount = Number($('topupAmount').value);
    if (!amount || amount <= 0) {
      showNotice($('topupResult'), 'Introduce un monto válido.', 'error');
      return;
    }

    const button = $('requestTopup');
    if (button) {
      button.disabled = true;
      button.textContent = 'Preparando…';
    }

    try {
      const { data, error } = await sb.rpc('request_wallet_topup_v2', { p_amount: amount });
      if (error) {
        showNotice($('topupResult'), error.message, 'error');
        return;
      }
      $('topupAmount').value = '';
      showNotice($('topupResult'), `Solicitud ${data.payment_reference} creada. El saldo se acreditará automáticamente cuando BISA confirme el pago.`, 'success');
      await loadWallet();
      await openBisaTopupQr(data);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Solicitar carga';
      }
    }
  }

  async function cancelBisaTopup(id) {
    if (!id) return;
    if (!confirm('Cancela esta solicitud solo si todavía NO realizaste el pago. ¿Deseas continuar?')) return;
    try {
      const data = await walletApi(TOPUP_CANCEL_PATH, { request_id: id });
      if (data?.credited || data?.paid) {
        setTopupUi(data);
        return;
      }
      if (String(data?.status || '').toUpperCase() === 'CANCELLED') {
        if (String(currentTopupId) === String(id)) closeModal('topupQrModal');
        lastTopupRequest = null;
        showNotice($('topupResult'), `Solicitud ${data.payment_reference || ''} cancelada.`, 'success');
        await loadWallet();
      }
    } catch (error) {
      showNotice($('topupResult'), errorMessage(error?.code || error?.message), 'error');
    }
  }

  bindTopupActions = function bindBisaTopupActions() {
    document.querySelectorAll('[data-cancel-topup]').forEach((button) => {
      button.onclick = () => cancelBisaTopup(button.dataset.cancelTopup);
    });
    document.querySelectorAll('[data-open-topup-qr]').forEach((button) => {
      button.onclick = () => openBisaTopupQr({
        request_id: button.dataset.openTopupQr,
        amount: Number(button.dataset.amount),
        payment_reference: button.dataset.ref,
        expires_at: button.dataset.expires
      });
    });
  };

  requestTopup = requestBisaTopup;
  cancelTopup = cancelBisaTopup;
  showTopupPayment = openBisaTopupQr;

  function install() {
    ensureTopupUi();
    const requestButton = $('requestTopup');
    if (requestButton) requestButton.onclick = requestBisaTopup;
    const cancelButton = $('cancelTopupRequest');
    if (cancelButton) cancelButton.onclick = () => currentTopupId && cancelBisaTopup(currentTopupId);
    bindTopupActions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
