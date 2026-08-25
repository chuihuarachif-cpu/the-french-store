/* THE FRENCH STORE — voluntary reward opportunity invitations v1.
   This module never opens a third-party provider automatically.
   It only shows first-party FRENCH STORE invitations after trusted UI states or
   when an authenticated user opted in to opportunity reminders. */
(() => {
  'use strict';

  const VERSION = 'reward-opportunity-invites-v1-20260825';
  const AUTO_COOLDOWN_MS = 30 * 60 * 1000;
  const POST_PURCHASE_DELAY_MS = 900;
  const ALLOWED_AUTO_VIEWS = new Set(['view-inicio','view-tienda','view-perfil']);
  const promptedOrders = new Set();
  let autoTimer = null;
  let readingPrefs = null;

  const text = (value) => String(value ?? '').trim();

  function authenticated() {
    try { return typeof session !== 'undefined' && !!session; } catch { return false; }
  }

  function activeTheme() {
    const theme = text(document.documentElement.dataset.fsMembership);
    return theme === 'diamond' ? 'diamond' : theme === 'gold' ? 'gold' : 'info';
  }

  function orderCodeFrom(value) {
    const match = text(value).match(/FS-\d{6}-[A-Z0-9]{4}/i);
    return match ? match[0].toUpperCase() : null;
  }

  function visibleThirdPartySensitiveUi() {
    if (document.querySelector('.modal.open')) return true;
    if (document.body.classList.contains('fs-notify-open')) return true;
    return false;
  }

  async function prefs(force = false) {
    if (!authenticated()) return null;
    if (readingPrefs && !force) return readingPrefs;
    readingPrefs = (async () => {
      const { data, error } = await sb.rpc('get_my_rewarded_ad_preferences');
      if (error) throw error;
      return data?.ok === true ? data : null;
    })().catch(() => null).finally(() => { readingPrefs = null; });
    return readingPrefs;
  }

  function providerReady(p) {
    return p?.rewarded_ads_enabled === true && p?.provider_connected === true;
  }

  async function openReward({ purpose = 'MANUAL', orderCode = null } = {}) {
    const provider = window.FSRewardedAdsProvider;
    if (!provider || typeof provider.open !== 'function') {
      window.FSNotify?.info?.('No hay una oportunidad disponible en este momento. Intenta más tarde.', 'Rewards no disponible');
      return false;
    }
    try {
      await provider.open({ purpose, order_code: orderCode });
      return true;
    } catch (error) {
      const code = text(error?.code || error?.message || error);
      const message = code.includes('VIDEO_REWARD_PROVIDER_NOT_AVAILABLE')
        ? 'Los videos recompensados todavía no están disponibles. Las encuestas y ofertas se habilitarán cuando el proveedor correspondiente esté listo.'
        : 'No se pudo abrir una oportunidad ahora. Tus compras y Wallet no se ven afectados.';
      window.FSNotify?.info?.(message, 'Rewards temporalmente no disponible');
      return false;
    }
  }

  function postPurchaseCopy() {
    const theme = activeTheme();
    if (theme === 'diamond') return {
      tone: 'diamond', icon: '💎', title: 'Diamond Rank · aumenta tus Rewards',
      message: 'Tu compra fue confirmada. Puedes completar una oportunidad opcional para sumar FRENCH Points extra. El extra depende del valor validado por el proveedor.',
      actionLabel: 'Ver oportunidad'
    };
    if (theme === 'gold') return {
      tone: 'gold', icon: '🏆', title: 'Gold Rank · aumenta tus Rewards',
      message: 'Tu compra fue confirmada. Puedes completar una oportunidad opcional para sumar FRENCH Points extra. El extra depende del valor validado por el proveedor.',
      actionLabel: 'Ver oportunidad'
    };
    return {
      tone: 'info', icon: '🎁', title: '¿Quieres ganar FRENCH Points extra?',
      message: 'Tu compra fue confirmada. Si quieres, puedes completar una oportunidad opcional. Solo se acreditan puntos después de la confirmación del proveedor.',
      actionLabel: 'Ver oportunidad'
    };
  }

  async function maybePostPurchase(orderCode) {
    if (!orderCode || promptedOrders.has(orderCode) || !authenticated()) return;
    const p = await prefs();
    if (!providerReady(p)) return;
    promptedOrders.add(orderCode);

    window.setTimeout(() => {
      if (!window.FSNotify?.toast) return;
      const copy = postPurchaseCopy();
      window.FSNotify.toast({
        ...copy,
        duration: 12000,
        onAction: () => openReward({ purpose: 'AUTO_PROMPT', orderCode })
      });
    }, POST_PURCHASE_DELAY_MS);
  }

  function inspectQrPaidState() {
    const modal = document.getElementById('qrModal');
    const state = document.getElementById('qrPaymentState');
    if (!modal || !state || !state.classList.contains('paid')) return;
    const code = orderCodeFrom(document.getElementById('qrOrderCode')?.textContent);
    if (code) maybePostPurchase(code);
  }

  function inspectWalletCheckout() {
    const result = document.getElementById('checkoutResult');
    if (!result || !result.classList.contains('success')) return;
    const code = orderCodeFrom(result.textContent);
    if (code) maybePostPurchase(code);
  }

  function activeViewAllowed() {
    const view = document.querySelector('.view.active');
    return !!view?.id && ALLOWED_AUTO_VIEWS.has(view.id);
  }

  function lastAutoAt() {
    try { return Number(sessionStorage.getItem('fs_rewards_auto_invite_at') || 0); } catch { return 0; }
  }

  function markAutoAt() {
    try { sessionStorage.setItem('fs_rewards_auto_invite_at', String(Date.now())); } catch {}
  }

  async function maybeAutoInvite() {
    clearTimeout(autoTimer);
    autoTimer = null;
    if (!authenticated() || !activeViewAllowed() || visibleThirdPartySensitiveUi()) return;
    if (Date.now() - lastAutoAt() < AUTO_COOLDOWN_MS) return;

    const p = await prefs();
    if (!providerReady(p) || p.auto_offers_enabled !== true) return;
    if (!activeViewAllowed() || visibleThirdPartySensitiveUi()) return;

    markAutoAt();
    const tone = activeTheme();
    const passLabel = tone === 'diamond' ? 'Diamond Rank' : tone === 'gold' ? 'Gold Rank' : null;
    window.FSNotify?.toast?.({
      tone,
      icon: tone === 'diamond' ? '💎' : tone === 'gold' ? '🏆' : '⭐',
      title: passLabel ? `${passLabel} · oportunidad disponible` : 'Hay una oportunidad de Rewards',
      message: 'Es opcional. La tienda no abrirá encuestas ni contenido de terceros hasta que tú pulses el botón.',
      actionLabel: 'Ver Rewards',
      duration: 10000,
      onAction: () => openReward({ purpose: 'MANUAL' })
    });
  }

  function scheduleAutoInvite(delay = 6500) {
    clearTimeout(autoTimer);
    autoTimer = window.setTimeout(() => maybeAutoInvite(), delay);
  }

  function installObservers() {
    const qr = document.getElementById('qrModal');
    if (qr) new MutationObserver(inspectQrPaidState).observe(qr, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    const checkout = document.getElementById('checkoutResult');
    if (checkout) new MutationObserver(inspectWalletCheckout).observe(checkout, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    document.addEventListener('click', (event) => {
      const nav = event.target.closest?.('[data-nav]');
      if (nav) scheduleAutoInvite(7000);
    });
    window.addEventListener('fs:rewarded-ad-preference-changed', () => scheduleAutoInvite(1800));

    inspectQrPaidState();
    inspectWalletCheckout();
    scheduleAutoInvite();
  }

  window.FSRewardOpportunityInvites = Object.freeze({ version: VERSION, refresh: () => scheduleAutoInvite(500) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installObservers, { once: true });
  else installObservers();
})();
