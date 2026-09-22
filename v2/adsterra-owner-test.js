/* FRENCH STORE — Adsterra owner-only production test + diagnostics.
   The third-party Social Bar is never requested for guests or customer accounts.
   Diagnostics are also visible only to the owner test account. */
(() => {
  'use strict';

  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const SCRIPT_ID = 'fs-adsterra-owner-social-bar';
  const SCRIPT_URL = 'https://pl31459668.profitableratecpmnetwork.com/a1/06/60/a10660f91fb339f7d5ca5d230aa1bb66.js';
  const PANEL_ID = 'fs-adsterra-owner-debug';
  let injected = false;
  let ownerAuthorized = false;
  let authSubscription = null;
  let panel = null;
  let blocked = [];

  function isOwnerSession(currentSession) {
    return String(currentSession?.user?.email || '').trim().toLowerCase() === OWNER_EMAIL;
  }

  function hostOf(value) {
    try { return new URL(value, location.href).host || value; } catch { return String(value || ''); }
  }

  function makePanel() {
    if (!ownerAuthorized || panel?.isConnected) return panel;
    const wrap = document.createElement('div');
    wrap.id = PANEL_ID;
    wrap.setAttribute('role', 'status');
    wrap.style.cssText = [
      'position:fixed',
      'top:max(70px,calc(env(safe-area-inset-top) + 58px))',
      'right:10px',
      'z-index:2147483000',
      'width:min(330px,calc(100vw - 20px))',
      'font:600 12px/1.35 Inter,system-ui,sans-serif',
      'color:#ecfeff',
      'background:rgba(3,14,24,.94)',
      'border:1px solid rgba(103,232,249,.5)',
      'border-radius:13px',
      'box-shadow:0 10px 30px rgba(0,0,0,.38)',
      'backdrop-filter:blur(12px)',
      'overflow:hidden'
    ].join(';');

    wrap.innerHTML =
      '<button type="button" data-fs-ad-debug-toggle style="all:unset;box-sizing:border-box;display:flex;gap:8px;align-items:center;width:100%;padding:9px 11px;cursor:pointer">' +
        '<span data-fs-ad-dot style="width:8px;height:8px;border-radius:50%;background:#facc15;box-shadow:0 0 10px currentColor;flex:0 0 auto"></span>' +
        '<b data-fs-ad-label style="flex:1">Adsterra: verificando…</b>' +
        '<span aria-hidden="true">⌄</span>' +
      '</button>' +
      '<div data-fs-ad-detail hidden style="padding:0 11px 10px;color:#bae6fd;font-weight:500">' +
        '<div data-fs-ad-message>Comprobando sesión y carga del anuncio.</div>' +
        '<div data-fs-ad-extra style="margin-top:5px;color:#94a3b8"></div>' +
        '<button type="button" data-fs-ad-reload style="margin-top:8px;border:1px solid rgba(103,232,249,.35);background:rgba(8,47,73,.7);color:#ecfeff;border-radius:9px;padding:6px 9px;font:inherit">Reintentar</button>' +
      '</div>';

    wrap.querySelector('[data-fs-ad-debug-toggle]').addEventListener('click', () => {
      const detail = wrap.querySelector('[data-fs-ad-detail]');
      detail.hidden = !detail.hidden;
    });
    wrap.querySelector('[data-fs-ad-reload]').addEventListener('click', () => location.reload());
    document.body.appendChild(wrap);
    panel = wrap;
    return wrap;
  }

  function setPanel(label, message, tone = 'loading', extra = '') {
    if (!ownerAuthorized) return;
    const wrap = makePanel();
    if (!wrap) return;
    const colors = { loading:'#facc15', ok:'#22c55e', warn:'#fb923c', error:'#ef4444' };
    wrap.querySelector('[data-fs-ad-label]').textContent = label;
    wrap.querySelector('[data-fs-ad-message]').textContent = message;
    wrap.querySelector('[data-fs-ad-extra]').textContent = extra;
    const dot = wrap.querySelector('[data-fs-ad-dot]');
    dot.style.background = colors[tone] || colors.loading;
    dot.style.color = colors[tone] || colors.loading;
  }

  function adSignals() {
    const providerResources = performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => /profitableratecpmnetwork|cpm|adsterra/i.test(url));
    const externalFrames = [...document.querySelectorAll('iframe[src]')]
      .map((frame) => frame.src)
      .filter((url) => {
        try { return new URL(url, location.href).origin !== location.origin && !/offers\.cpx-research\.com/i.test(url); }
        catch { return false; }
      });
    return { providerResources, externalFrames };
  }

  function inspectCreative() {
    if (!ownerAuthorized || document.documentElement.dataset.fsAdsterraTest !== 'owner-active') return;
    const { providerResources, externalFrames } = adSignals();
    if (blocked.length) {
      const last = blocked[blocked.length - 1];
      setPanel(
        'Adsterra: carga parcial',
        'El script principal cargó, pero el navegador bloqueó un recurso secundario.',
        'warn',
        `Bloqueado: ${hostOf(last.uri)} · ${last.directive}`
      );
      return;
    }
    if (externalFrames.length || providerResources.length > 1) {
      setPanel(
        'Adsterra: activo',
        'La red cargó recursos publicitarios. La creatividad puede aparecer como burbuja, barra o widget.',
        'ok',
        `Recursos detectados: ${providerResources.length} · frames externos: ${externalFrames.length}`
      );
      return;
    }
    setPanel(
      'Adsterra: script OK · sin anuncio',
      'El código de Adsterra cargó, pero todavía no se sirvió una creatividad para esta visita.',
      'warn',
      'Puede depender de campañas disponibles, GEO, navegador, DNS privado o bloqueo de anuncios.'
    );
  }

  function injectSocialBar() {
    if (injected || document.getElementById(SCRIPT_ID)) return;
    injected = true;
    document.documentElement.dataset.fsAdsterraTest = 'owner-loading';
    setPanel('Adsterra: conectando…', 'Solicitando el Social Bar a Adsterra.', 'loading');

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.addEventListener('load', () => {
      document.documentElement.dataset.fsAdsterraTest = 'owner-active';
      setPanel('Adsterra: script cargado', 'El script principal respondió correctamente. Esperando creatividad…', 'ok');
      setTimeout(inspectCreative, 3500);
      setTimeout(inspectCreative, 10000);
    }, { once: true });
    script.addEventListener('error', () => {
      document.documentElement.dataset.fsAdsterraTest = 'owner-error';
      setPanel(
        'Adsterra: bloqueado',
        'El navegador no pudo cargar el script de Adsterra.',
        'error',
        'Revisa bloqueador de anuncios, DNS privado, protección del navegador o red.'
      );
      console.error('FRENCH STORE owner ad test failed to load.');
    }, { once: true });
    document.body.appendChild(script);
  }

  function disableAfterAccountChange() {
    document.documentElement.dataset.fsAdsterraTest = 'off';
    ownerAuthorized = false;
    panel?.remove();
    panel = null;
    if (!injected) return;
    location.reload();
  }

  async function sync(currentSession) {
    if (isOwnerSession(currentSession)) {
      ownerAuthorized = true;
      makePanel();
      injectSocialBar();
    } else {
      disableAfterAccountChange();
    }
  }

  document.addEventListener('securitypolicyviolation', (event) => {
    if (!ownerAuthorized || !injected) return;
    const uri = String(event.blockedURI || '');
    const directive = String(event.effectiveDirective || '');
    if (!/^(script-src|connect-src|frame-src|worker-src)/.test(directive)) return;
    blocked.push({ uri, directive });
    blocked = blocked.slice(-6);
    setTimeout(inspectCreative, 0);
  });

  async function start() {
    try {
      if (typeof sb === 'undefined' || !sb?.auth) {
        document.documentElement.dataset.fsAdsterraTest = 'waiting-auth';
        setTimeout(start, 120);
        return;
      }

      const { data } = await sb.auth.getSession();
      await sync(data?.session || null);

      const listener = sb.auth.onAuthStateChange((_event, currentSession) => {
        setTimeout(() => sync(currentSession).catch(() => {}), 0);
      });
      authSubscription = listener?.data?.subscription || null;
    } catch (error) {
      document.documentElement.dataset.fsAdsterraTest = 'owner-error';
      if (ownerAuthorized) setPanel('Adsterra: error', 'Falló la inicialización de la prueba.', 'error', String(error?.message || error).slice(0, 100));
      console.error('FRENCH STORE owner ad test initialization failed:', String(error?.message || error).slice(0, 120));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('pagehide', () => {
    try { authSubscription?.unsubscribe?.(); } catch {}
  }, { once: true });
})();