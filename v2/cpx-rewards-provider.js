/* THE FRENCH STORE — R47 CPX Research voluntary rewards provider.
   Privacy boundary: CPX is never loaded merely because the user visits the store.
   A third-party iframe is created only after an authenticated user explicitly opens
   a reward opportunity (or accepts a post-purchase invitation). The storefront sends
   only an opaque CPX user identifier produced server-side; no Supabase UUID, Wallet
   data, order UUID, password, Google identity, email or CPX master secret is exposed. */
(() => {
  'use strict';

  const VERSION = 'cpx-rewards-provider-v1-20260825';
  const API_BASE = 'https://api.frenchstorebo.com';
  const SESSION_PATH = '/api/rewards/cpx/session';
  const ALLOWED_WALL_ORIGIN = 'https://offers.cpx-research.com';
  let opening = false;

  const text = (value) => String(value ?? '').trim();

  async function accessToken() {
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token || (typeof session !== 'undefined' ? session?.access_token : null) || null;
  }

  async function createSession({ purpose = 'MANUAL', orderCode = null } = {}) {
    const token = await accessToken();
    if (!token) throw new Error('AUTH_REQUIRED');

    const response = await fetch(`${API_BASE}${SESSION_PATH}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        purpose: purpose === 'AUTO_PROMPT' ? 'AUTO_PROMPT' : 'MANUAL',
        order_code: orderCode || null
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `HTTP_${response.status}`);
    return data;
  }

  function ensureModal() {
    let modal = document.getElementById('fsCpxRewardsModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'fsCpxRewardsModal';
    modal.className = 'modal fs-cpx-rewards-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-card fs-cpx-rewards-card" role="dialog" aria-modal="true" aria-labelledby="fsCpxRewardsTitle">
        <button type="button" class="modal-close" data-fs-cpx-close aria-label="Cerrar">×</button>
        <span class="eyebrow">FRENCH REWARDS · CPX RESEARCH</span>
        <h2 id="fsCpxRewardsTitle">Encuestas y recompensas</h2>
        <p class="fs-cpx-rewards-copy">Participar es opcional. CPX puede solicitar datos directamente para encontrar encuestas compatibles. FRENCH STORE no envía tu contraseña, saldo Wallet ni datos de tus recargas.</p>
        <div class="fs-cpx-frame-wrap">
          <div class="fs-cpx-loading">Buscando oportunidades…</div>
          <iframe id="fsCpxRewardsFrame" title="CPX Research · oportunidades recompensadas" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox" allow="camera; microphone"></iframe>
        </div>
        <p class="fs-cpx-rewards-note">Los FRENCH Points solo se registran cuando el servidor recibe una confirmación válida de CPX. Cerrar esta ventana no crea puntos por sí solo.</p>
      </div>`;
    document.body.appendChild(modal);

    const close = () => closeModalSafe();
    modal.querySelector('[data-fs-cpx-close]')?.addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    return modal;
  }

  function closeModalSafe() {
    const modal = document.getElementById('fsCpxRewardsModal');
    if (!modal) return;
    const frame = document.getElementById('fsCpxRewardsFrame');
    if (frame) frame.removeAttribute('src');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      try { window.FSLoyalty?.refresh?.(); } catch {}
      try { window.FSRewardedAdsUI?.refresh?.(); } catch {}
    }, 300);
  }

  function openModalSafe(wallUrl, sessionData) {
    const parsed = new URL(wallUrl);
    if (parsed.origin !== ALLOWED_WALL_ORIGIN || parsed.protocol !== 'https:') throw new Error('CPX_WALL_ORIGIN_INVALID');

    const modal = ensureModal();
    const frame = document.getElementById('fsCpxRewardsFrame');
    const loading = modal.querySelector('.fs-cpx-loading');
    const title = document.getElementById('fsCpxRewardsTitle');
    if (!frame) throw new Error('CPX_FRAME_MISSING');

    if (title) {
      const pass = sessionData?.active_pass?.name;
      title.textContent = sessionData?.post_purchase === true && pass
        ? `Multiplica tus puntos · ${pass}`
        : sessionData?.post_purchase === true
          ? 'Gana puntos extra por tu compra'
          : 'Encuestas y recompensas';
    }

    if (loading) loading.classList.remove('hidden');
    frame.onload = () => loading?.classList.add('hidden');
    frame.src = parsed.toString();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  async function open({ purpose = 'MANUAL', order_code: orderCode = null } = {}) {
    if (opening) return false;
    opening = true;
    try {
      const data = await createSession({ purpose, orderCode });
      if (data.allowed !== true || !data.wall_url) {
        const error = new Error(text(data.reason) || 'REWARDS_NOT_AVAILABLE');
        error.code = text(data.reason) || 'REWARDS_NOT_AVAILABLE';
        throw error;
      }
      openModalSafe(data.wall_url, data);
      return true;
    } finally {
      opening = false;
    }
  }

  window.FSRewardedAdsProvider = Object.freeze({
    version: VERSION,
    provider: 'cpx',
    kind: 'survey',
    open,
    close: closeModalSafe
  });
})();
