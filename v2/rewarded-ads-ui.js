/* THE FRENCH STORE — voluntary Rewarded Ads preference UI.
   Isolated profile-only shell. It does NOT load an ad network, award points,
   modify checkout/Wallet/BISA, or display overlays/popups.
   Server-side Rewarded Ads remain fail-closed until an official provider is integrated. */
(() => {
  'use strict';

  const VERSION = 'rewarded-ads-profile-v1-20260824';
  const state = {
    prefs: null,
    loading: null,
    mounted: false,
    saving: false
  };

  const text = (value) => String(value ?? '').trim();
  const html = (value) => text(value).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));

  function authenticated() {
    try { return !!session; } catch { return false; }
  }

  function profilePanel() {
    return document.querySelector('#view-perfil .profile-panel');
  }

  function ensureShell() {
    const profile = profilePanel();
    if (!profile) return null;

    let panel = document.getElementById('fsRewardedAdsPanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'fsRewardedAdsPanel';
      panel.className = 'fs-rewarded-ads-panel hidden';
      panel.setAttribute('aria-label', 'Ganar French Points con anuncios voluntarios');
      const actions = profile.querySelector('.profile-actions');
      if (actions) profile.insertBefore(panel, actions);
      else profile.appendChild(panel);
    }

    if (!state.mounted) {
      panel.addEventListener('change', onChange);
      panel.addEventListener('click', onClick);
      state.mounted = true;
    }
    return panel;
  }

  function statusMessage(message, kind = 'info') {
    const el = document.getElementById('fsRewardedAdsMessage');
    if (!el) return;
    el.className = `fs-rewarded-ads-message ${kind}`;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideStatusMessage() {
    document.getElementById('fsRewardedAdsMessage')?.classList.add('hidden');
  }

  function pointsValue(prefs) {
    const perBob = Math.max(1, Math.trunc(Number(prefs?.points_per_bob || 100)));
    return `${perBob.toLocaleString('es-BO')} French Points = Bs 1,00`;
  }

  function render() {
    const panel = ensureShell();
    if (!panel) return;

    if (!authenticated()) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }

    panel.classList.remove('hidden');
    const p = state.prefs;
    if (!p) {
      panel.innerHTML = '<div class="fs-rewarded-ads-loading">Cargando opciones de French Points…</div>';
      return;
    }

    const autoEnabled = p.auto_offers_enabled === true;
    const networkReady = p.rewarded_ads_enabled === true && p.provider_connected === true;
    const statusLabel = networkReady ? 'Disponible' : 'Preparando proveedor';
    const statusClass = networkReady ? 'ready' : 'building';

    panel.innerHTML = `
      <div class="fs-rewarded-ads-head">
        <div>
          <span class="eyebrow">FRENCH POINTS · OPCIONAL</span>
          <h3>Gana puntos por iniciativa propia</h3>
        </div>
        <span class="fs-rewarded-ads-status ${statusClass}">${html(statusLabel)}</span>
      </div>

      <p class="fs-rewarded-ads-intro">No habrá banners ni anuncios permanentes en FRENCH STORE. Tú decides si quieres ver oportunidades para ganar puntos.</p>

      <div class="fs-rewarded-ads-value">
        <span>Valor de referencia</span>
        <strong>${html(pointsValue(p))}</strong>
        <small>Los puntos canjeables pasan a French Wallet según las reglas de French Rewards.</small>
      </div>

      <label class="fs-rewarded-ads-toggle-row">
        <span>
          <b>Avisarme automáticamente cuando haya una oportunidad</b>
          <small>OFF por defecto. Si lo activas, solo se podrán ofrecer anuncios en momentos seguros y nunca durante una compra o pago.</small>
        </span>
        <span class="fs-toggle-control">
          <input id="fsRewardedAdsOptIn" type="checkbox" ${autoEnabled ? 'checked' : ''} ${state.saving ? 'disabled' : ''}>
          <i aria-hidden="true"></i>
        </span>
      </label>

      <div class="fs-rewarded-ads-actions">
        <button type="button" class="secondary-btn" data-fs-rewarded-action="ad">▶ Ver anuncio ahora</button>
        <button type="button" class="secondary-btn" data-fs-rewarded-action="offers">📝 Ver oportunidades</button>
      </div>

      <div id="fsRewardedAdsMessage" class="fs-rewarded-ads-message hidden" role="status" aria-live="polite"></div>

      <div class="fs-rewarded-ads-safety">
        <b>Tu tienda sigue limpia.</b>
        <span>Nunca se mostrarán anuncios dentro de carrito, checkout, QR BISA, French Wallet, Pedidos, inicio de sesión o Admin. Desactivar esta opción impide ofertas automáticas, pero siempre podrás usar “Ver anuncio ahora” por voluntad propia.</span>
      </div>

      ${networkReady ? '' : '<p class="fs-rewarded-ads-fine">La preferencia ya queda guardada en tu cuenta, pero todavía no se muestran anuncios ni se generan puntos por publicidad. La integración permanecerá bloqueada hasta conectar y validar un proveedor oficial.</p>'}
    `;
  }

  async function load(force = false) {
    if (!authenticated()) {
      state.prefs = null;
      render();
      return null;
    }
    if (state.loading && !force) return state.loading;

    state.loading = (async () => {
      const { data, error } = await sb.rpc('get_my_rewarded_ad_preferences');
      if (error) throw error;
      if (!data || data.ok !== true) throw new Error('REWARDED_AD_PREFS_INVALID');
      state.prefs = data;
      render();
      return data;
    })().catch((error) => {
      console.warn('FRENCH STORE rewarded ads preferences unavailable:', text(error?.message || error).slice(0, 100));
      const panel = ensureShell();
      if (panel && authenticated()) {
        panel.classList.remove('hidden');
        panel.innerHTML = '<div class="notice error">Las opciones para ganar puntos con anuncios no están disponibles temporalmente. La tienda, tus compras y French Wallet siguen funcionando normalmente.</div>';
      }
      return null;
    }).finally(() => { state.loading = null; });

    return state.loading;
  }

  async function saveOptIn(enabled) {
    if (!authenticated() || state.saving) return;
    state.saving = true;
    hideStatusMessage();
    render();

    let feedback = 'No se pudo guardar la preferencia. Intenta nuevamente.';
    let feedbackKind = 'error';
    let saved = false;

    try {
      const { data, error } = await sb.rpc('set_my_rewarded_ad_opt_in', { p_enabled: enabled === true });
      if (error) throw error;
      if (!data || data.ok !== true) throw new Error('REWARDED_AD_PREF_SAVE_INVALID');
      state.prefs = { ...(state.prefs || {}), ...data, auto_offers_enabled: data.auto_offers_enabled === true };
      feedback = enabled
        ? 'Preferencia activada. Cuando el servicio esté disponible, solo recibirás invitaciones opcionales en momentos seguros.'
        : 'Preferencia desactivada. No recibirás ofertas automáticas; el botón manual seguirá disponible.';
      feedbackKind = 'success';
      saved = true;
      window.dispatchEvent(new CustomEvent('fs:rewarded-ad-preference-changed', { detail: { enabled: data.auto_offers_enabled === true } }));
    } catch (error) {
      console.warn('FRENCH STORE rewarded ads preference save failed:', text(error?.message || error).slice(0, 100));
      await load(true);
    } finally {
      state.saving = false;
      render();
      statusMessage(feedback, feedbackKind);
    }

    return saved;
  }

  async function requestManualOpportunity(kind) {
    hideStatusMessage();
    const p = state.prefs || {};

    if (!(p.rewarded_ads_enabled === true && p.provider_connected === true)) {
      statusMessage('Todavía no hay un proveedor de anuncios activado. No se mostrará publicidad ni se acreditarán puntos hasta que la integración oficial esté lista.', 'info');
      return;
    }

    const provider = window.FSRewardedAdsProvider;
    if (!provider || typeof provider.open !== 'function') {
      statusMessage('No hay una oportunidad disponible en este momento. Intenta más tarde.', 'info');
      return;
    }

    try {
      await provider.open({ type: kind, voluntary: true });
    } catch {
      statusMessage('No se pudo abrir una oportunidad en este momento. Intenta más tarde.', 'error');
    }
  }

  function onChange(event) {
    if (event.target?.id !== 'fsRewardedAdsOptIn') return;
    saveOptIn(event.target.checked === true);
  }

  function onClick(event) {
    const button = event.target.closest?.('[data-fs-rewarded-action]');
    if (!button) return;
    requestManualOpportunity(button.dataset.fsRewardedAction || 'ad');
  }

  async function init() {
    ensureShell();
    if (!authenticated()) {
      try {
        const { data } = await sb.auth.getSession();
        if (!data?.session) { render(); return; }
      } catch { render(); return; }
    }
    await load(true);

    try {
      sb.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession) {
          state.prefs = null;
          render();
        } else {
          setTimeout(() => load(true), 0);
        }
      });
    } catch {}
  }

  window.FSRewardedAdsUI = Object.freeze({
    version: VERSION,
    refresh: () => load(true),
    request: (kind = 'ad') => requestManualOpportunity(kind)
  });

  init();
})();
