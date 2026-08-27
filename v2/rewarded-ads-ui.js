/* THE FRENCH STORE — R101 voluntary Rewards preference + invitation UI.
   The third-party provider is never loaded just by visiting the store or enabling the
   toggle. This module renders FRENCH STORE-owned invitations only. Provider identity
   and infrastructure details stay internal; customer-facing copy remains neutral. */
(() => {
  'use strict';

  const VERSION = 'rewarded-opportunities-v3-20260827';
  const SAFE_BROWSE_VIEWS = new Set(['view-inicio', 'view-tienda', 'view-perfil']);
  const POST_PURCHASE_KEY = 'fs:reward-prompt:order:';
  const AUTO_PROMPT_KEY = 'fs:reward-auto-prompt-shown';
  const state = {
    prefs: null,
    loading: null,
    mounted: false,
    saving: false,
    autoPromptOpen: false
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
      panel.setAttribute('aria-label', 'Ganar FRENCH Points con oportunidades voluntarias');
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
    return `${perBob.toLocaleString('es-BO')} FRENCH Points = Bs 1,00`;
  }

  function providerState(p) {
    const productionReady = p?.provider_connected === true
      && p?.provider_live === true
      && p?.rewarded_ads_enabled === true
      && p?.program_launched === true;
    const testReady = p?.provider_connected === true
      && p?.provider_test_mode === true
      && p?.test_access_allowed === true;
    return { productionReady, testReady, opportunities: p?.manual_opportunities_allowed === true };
  }

  function render() {
    const panel = ensureShell();
    if (!panel) return;

    if (!authenticated()) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      removeAutoPrompt();
      return;
    }

    panel.classList.remove('hidden');
    const p = state.prefs;
    if (!p) {
      panel.innerHTML = '<div class="fs-rewarded-ads-loading">Cargando opciones de FRENCH Points…</div>';
      return;
    }

    const autoEnabled = p.auto_offers_enabled === true;
    const ps = providerState(p);
    const statusLabel = ps.productionReady ? 'Disponible'
      : ps.testReady ? 'Modo de prueba'
        : p.provider_connected === true ? 'Preparando Rewards'
          : 'Preparando Rewards';
    const statusClass = ps.productionReady ? 'ready' : ps.testReady ? 'testing' : 'building';
    const surveysDisabled = ps.opportunities ? '' : 'disabled';
    const videoDisabled = p.manual_watch_allowed === true ? '' : 'disabled';

    panel.innerHTML = `
      <div class="fs-rewarded-ads-head">
        <div>
          <span class="eyebrow">FRENCH POINTS · OPCIONAL</span>
          <h3>Gana puntos cuando tú quieras</h3>
        </div>
        <span class="fs-rewarded-ads-status ${statusClass}">${html(statusLabel)}</span>
      </div>

      <p class="fs-rewarded-ads-intro">Las oportunidades son voluntarias. Activar avisos no abre contenido externo ni inicia una encuesta: primero verás una invitación de FRENCH STORE y tú decides si abrirla.</p>

      <div class="fs-rewarded-ads-value">
        <span>Valor de referencia en la tienda</span>
        <strong>${html(pointsValue(p))}</strong>
        <small>La cantidad obtenida depende del valor que la oportunidad confirme al sistema. Una oportunidad puede no tener recompensa si no genera un importe válido.</small>
      </div>

      <label class="fs-rewarded-ads-toggle-row">
        <span>
          <b>Avisarme cuando haya una oportunidad</b>
          <small>OFF por defecto. Si lo activas, podremos mostrar invitaciones discretas solo en Inicio, Tienda o Perfil. Nunca dentro de carrito, checkout, QR, Wallet, Pedidos, login o Admin.</small>
        </span>
        <span class="fs-toggle-control">
          <input id="fsRewardedAdsOptIn" type="checkbox" ${autoEnabled ? 'checked' : ''} ${state.saving ? 'disabled' : ''}>
          <i aria-hidden="true"></i>
        </span>
      </label>

      <div class="fs-rewarded-ads-actions">
        <button type="button" class="secondary-btn" data-fs-rewarded-action="video" ${videoDisabled}>🎬 Video recompensado</button>
        <button type="button" class="secondary-btn" data-fs-rewarded-action="offers" ${surveysDisabled}>📝 Encuestas y recompensas</button>
      </div>
      ${p.manual_watch_allowed === true ? '' : '<small class="fs-rewarded-ads-action-note">Los videos recompensados permanecerán desactivados hasta que exista una opción aprobada. Las encuestas y oportunidades funcionan de forma independiente.</small>'}

      <div id="fsRewardedAdsMessage" class="fs-rewarded-ads-message hidden" role="status" aria-live="polite"></div>

      <div class="fs-rewarded-ads-safety">
        <b>Privacidad por diseño.</b>
        <span>El contenido externo solo se carga después de tocar una oportunidad. FRENCH STORE no envía automáticamente tu correo, contraseña, saldo Wallet ni datos de tus recargas para abrirla.</span>
      </div>

      ${ps.productionReady ? '' : ps.testReady
        ? '<p class="fs-rewarded-ads-fine">Modo de prueba disponible únicamente para administración. Los eventos de prueba no acreditan puntos reales.</p>'
        : '<p class="fs-rewarded-ads-fine">Las oportunidades públicas permanecen bloqueadas hasta completar los controles de lanzamiento.</p>'}
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
      setTimeout(maybeShowAutoPrompt, 120);
      return data;
    })().catch((error) => {
      console.warn('FRENCH STORE rewarded opportunities unavailable:', text(error?.message || error).slice(0, 100));
      const panel = ensureShell();
      if (panel && authenticated()) {
        panel.classList.remove('hidden');
        panel.innerHTML = '<div class="notice error">Las oportunidades para ganar puntos no están disponibles temporalmente. La tienda, tus compras y French Wallet siguen funcionando normalmente.</div>';
      }
      return null;
    }).finally(() => { state.loading = null; });

    return state.loading;
  }

  async function saveOptIn(enabled) {
    if (!authenticated() || state.saving) return false;
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
        ? 'Avisos activados. Verás solo invitaciones opcionales en zonas seguras; ningún contenido externo se abre hasta que tú aceptes.'
        : 'Avisos desactivados. No recibirás invitaciones durante la navegación; después de una compra todavía podremos ofrecerte una recompensa opcional independiente.';
      feedbackKind = 'success';
      saved = true;
      window.dispatchEvent(new CustomEvent('fs:rewarded-ad-preference-changed', { detail: { enabled: data.auto_offers_enabled === true } }));
      if (!enabled) removeAutoPrompt();
      else setTimeout(maybeShowAutoPrompt, 250);
    } catch (error) {
      console.warn('FRENCH STORE reward preference save failed:', text(error?.message || error).slice(0, 100));
      await load(true);
    } finally {
      state.saving = false;
      render();
      statusMessage(feedback, feedbackKind);
    }

    return saved;
  }

  async function openProvider({ orderCode = null, purpose = 'MANUAL' } = {}) {
    const provider = window.FSRewardedAdsProvider;
    if (!provider || provider.provider !== 'cpx' || typeof provider.open !== 'function') throw new Error('PROVIDER_NOT_READY');
    return provider.open({ order_code: orderCode, purpose });
  }

  async function requestManualOpportunity(kind) {
    hideStatusMessage();
    const p = state.prefs || {};

    if (kind === 'video') {
      if (p.manual_watch_allowed !== true) {
        statusMessage('Los videos recompensados todavía no están habilitados. Puedes usar Encuestas y recompensas cuando estén disponibles.', 'info');
        return;
      }
      statusMessage('La opción de video todavía no está disponible en esta versión.', 'info');
      return;
    }

    if (p.manual_opportunities_allowed !== true) {
      statusMessage('Las encuestas y recompensas todavía no están disponibles públicamente.', 'info');
      return;
    }

    try {
      await openProvider({ purpose: 'MANUAL' });
    } catch (error) {
      const code = text(error?.code || error?.message);
      statusMessage(code === 'REWARDS_NOT_AVAILABLE'
        ? 'No hay una oportunidad disponible en este momento.'
        : 'No se pudo abrir la oportunidad en este momento. Intenta más tarde.', code === 'REWARDS_NOT_AVAILABLE' ? 'info' : 'error');
    }
  }

  function currentSafeBrowseView() {
    const active = document.querySelector('.view.active');
    return active && SAFE_BROWSE_VIEWS.has(active.id) ? active.id : null;
  }

  function anotherModalIsOpen() {
    return !!document.querySelector('.modal.open:not(#fsCpxRewardsModal)');
  }

  function removeAutoPrompt() {
    document.getElementById('fsRewardAutoPrompt')?.remove();
    state.autoPromptOpen = false;
  }

  function maybeShowAutoPrompt() {
    const p = state.prefs || {};
    if (!authenticated() || p.auto_offers_enabled !== true || p.manual_opportunities_allowed !== true) return;
    if (!currentSafeBrowseView() || anotherModalIsOpen() || document.getElementById('fsRewardAutoPrompt')) return;
    try { if (sessionStorage.getItem(AUTO_PROMPT_KEY) === '1') return; } catch {}

    const prompt = document.createElement('aside');
    prompt.id = 'fsRewardAutoPrompt';
    prompt.className = 'fs-reward-auto-prompt';
    prompt.setAttribute('role', 'status');
    prompt.innerHTML = `
      <button class="fs-reward-prompt-close" type="button" data-fs-auto-dismiss aria-label="Cerrar">×</button>
      <span class="eyebrow">FRENCH REWARDS</span>
      <b>Hay una oportunidad opcional</b>
      <p>Si quieres, puedes abrir una encuesta para ganar FRENCH Points. La recompensa depende del importe validado.</p>
      <button type="button" class="secondary-btn full" data-fs-auto-open>Ver oportunidades</button>`;
    document.body.appendChild(prompt);
    state.autoPromptOpen = true;
    try { sessionStorage.setItem(AUTO_PROMPT_KEY, '1'); } catch {}

    prompt.querySelector('[data-fs-auto-dismiss]')?.addEventListener('click', removeAutoPrompt);
    prompt.querySelector('[data-fs-auto-open]')?.addEventListener('click', async () => {
      removeAutoPrompt();
      try { await openProvider({ purpose: 'AUTO_PROMPT' }); } catch {}
    });
  }

  function extractOrderCode(value) {
    const match = text(value).toUpperCase().match(/FS-\d{6}-[A-Z0-9]{4}/);
    return match ? match[0] : null;
  }

  function postPurchaseSeen(code) {
    try { return sessionStorage.getItem(`${POST_PURCHASE_KEY}${code}`) === '1'; } catch { return false; }
  }

  function markPostPurchaseSeen(code) {
    try { sessionStorage.setItem(`${POST_PURCHASE_KEY}${code}`, '1'); } catch {}
  }

  function postPurchaseCopy() {
    const pass = state.prefs?.active_pass || null;
    if (pass) {
      return {
        title: `¿Quieres aumentar tus Rewards con ${text(pass.name) || 'tu Rank Pass'}?`,
        body: 'Abre una oportunidad opcional. Los puntos extra dependen exclusivamente del valor confirmado por la oportunidad; no se promete un multiplicador fijo.'
      };
    }
    return {
      title: '¿Quieres ganar FRENCH Points extra?',
      body: 'Puedes abrir una oportunidad opcional después de esta compra. La cantidad depende del valor confirmado por la oportunidad.'
    };
  }

  function renderPostPurchasePrompt(code, anchor) {
    if (!code || !anchor || !authenticated() || state.prefs?.manual_opportunities_allowed !== true || postPurchaseSeen(code)) return;
    if (document.querySelector(`[data-fs-post-purchase-code="${CSS.escape(code)}"]`)) return;

    const copy = postPurchaseCopy();
    const card = document.createElement('div');
    card.className = 'fs-post-purchase-reward-card';
    card.dataset.fsPostPurchaseCode = code;
    card.innerHTML = `
      <div><span class="eyebrow">BONUS OPCIONAL</span><b>${html(copy.title)}</b><p>${html(copy.body)}</p></div>
      <div class="fs-post-purchase-actions">
        <button type="button" class="secondary-btn" data-fs-post-dismiss>Ahora no</button>
        <button type="button" class="primary-btn" data-fs-post-open>Ver oportunidad</button>
      </div>`;
    anchor.insertAdjacentElement('afterend', card);
    markPostPurchaseSeen(code);

    card.querySelector('[data-fs-post-dismiss]')?.addEventListener('click', () => card.remove());
    card.querySelector('[data-fs-post-open]')?.addEventListener('click', async () => {
      const button = card.querySelector('[data-fs-post-open]');
      if (button) { button.disabled = true; button.textContent = 'Abriendo…'; }
      try {
        await openProvider({ orderCode: code, purpose: 'MANUAL' });
        card.remove();
      } catch {
        if (button) { button.disabled = false; button.textContent = 'Intentar nuevamente'; }
      }
    });
  }

  function inspectQrPostPurchase() {
    const qrState = document.getElementById('qrPaymentState');
    if (!qrState?.classList.contains('paid')) return;
    const code = extractOrderCode(document.getElementById('qrOrderCode')?.textContent);
    const anchor = document.getElementById('qrOrderMeta') || qrState;
    renderPostPurchasePrompt(code, anchor);
  }

  function inspectWalletPostPurchase() {
    const result = document.getElementById('checkoutResult');
    if (!result || result.classList.contains('hidden') || !result.classList.contains('success')) return;
    const code = extractOrderCode(result.textContent);
    if (code) renderPostPurchasePrompt(code, result);
  }

  function installObservers() {
    const qrModal = document.getElementById('qrModal');
    if (qrModal) new MutationObserver(() => setTimeout(inspectQrPostPurchase, 0)).observe(qrModal, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    const checkoutResult = document.getElementById('checkoutResult');
    if (checkoutResult) new MutationObserver(() => setTimeout(inspectWalletPostPurchase, 0)).observe(checkoutResult, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-nav]')) setTimeout(maybeShowAutoPrompt, 450);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(maybeShowAutoPrompt, 300); });
  }

  function onChange(event) {
    if (event.target?.id !== 'fsRewardedAdsOptIn') return;
    saveOptIn(event.target.checked === true);
  }

  function onClick(event) {
    const button = event.target.closest?.('[data-fs-rewarded-action]');
    if (!button) return;
    requestManualOpportunity(button.dataset.fsRewardedAction || 'offers');
  }

  async function init() {
    ensureShell();
    installObservers();
    if (!authenticated()) {
      try {
        const { data } = await sb.auth.getSession();
        if (!data?.session) { render(); return; }
      } catch { render(); return; }
    }
    await load(true);
    inspectQrPostPurchase();
    inspectWalletPostPurchase();

    try {
      sb.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession) {
          state.prefs = null;
          removeAutoPrompt();
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
    request: (kind = 'offers') => requestManualOpportunity(kind),
    inspectPostPurchase: () => { inspectQrPostPurchase(); inspectWalletPostPurchase(); }
  });

  init();
})();
