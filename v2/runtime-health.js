/* THE FRENCH STORE — R31 startup health guard.
   Keeps basic navigation usable and replaces infinite "Cargando..." states with
   a clear retry message if the local Supabase browser client cannot start. */
(() => {
  'use strict';

  const STARTUP_TIMEOUT_MS = 12000;
  const byId = (id) => document.getElementById(id);
  const dependencyReady = () => Boolean(window.supabase && typeof window.supabase.createClient === 'function');

  function runtimeNotice(message) {
    const featured = byId('featuredList');
    if (featured && (!featured.children.length || /cargando/i.test(featured.textContent || ''))) {
      featured.innerHTML = `<div class="notice error" data-runtime-health-error="1"><b>No se pudo iniciar la tienda.</b><br>${message}<br><button type="button" class="secondary-btn" data-runtime-retry style="margin-top:10px">Reintentar</button></div>`;
    }
    const meta = byId('catalogMeta');
    if (meta && /cargando/i.test(meta.textContent || '')) meta.textContent = 'Conexión no disponible · toca Reintentar';
    document.querySelectorAll('[data-runtime-retry]').forEach((button) => {
      button.onclick = () => location.reload();
    });
  }

  function switchView(view) {
    document.querySelectorAll('.view').forEach((section) => section.classList.remove('active'));
    const target = byId(`view-${view}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('[data-nav]').forEach((button) => button.classList.toggle('active', button.dataset.nav === view));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function wireEmergencyNavigation() {
    document.querySelectorAll('[data-nav]').forEach((button) => {
      if (button.dataset.runtimeHealthBound === '1') return;
      button.dataset.runtimeHealthBound = '1';
      button.onclick = () => {
        const view = button.dataset.nav;
        if (view === 'inicio' || view === 'tienda') switchView(view);
        else runtimeNotice('No pudimos conectar con el servicio de cuenta. Revisa tu conexión y vuelve a intentarlo.');
      };
    });
    document.querySelectorAll('[data-category]').forEach((button) => {
      if (button.dataset.runtimeHealthBound === '1') return;
      button.dataset.runtimeHealthBound = '1';
      button.onclick = () => switchView('tienda');
    });
  }

  function enterDegradedMode(reason) {
    window.FSRuntimeHealth.state = 'degraded';
    window.FSRuntimeHealth.reason = reason;
    wireEmergencyNavigation();
    runtimeNotice('Revisa tu conexión y pulsa “Reintentar”. Si el problema continúa, contacta a soporte.');
  }

  window.FSRuntimeHealth = {
    state: dependencyReady() ? 'dependency-ready' : 'dependency-missing',
    reason: null,
    dependencyReady
  };

  if (!dependencyReady()) enterDegradedMode('SUPABASE_CLIENT_MISSING');

  window.addEventListener('error', (event) => {
    if (!(event instanceof ErrorEvent)) return;
    const source = String(event.filename || '');
    if (!source || !/\/v2\//.test(source)) return;
    if (window.FSRuntimeHealth.state !== 'ready') enterDegradedMode('CORE_SCRIPT_ERROR');
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (!dependencyReady()) {
      enterDegradedMode('SUPABASE_CLIENT_MISSING');
      return;
    }
    window.setTimeout(() => {
      const featured = byId('featuredList');
      const meta = byId('catalogMeta');
      const stillLoading = /cargando/i.test(String(featured?.textContent || '')) || /cargando/i.test(String(meta?.textContent || ''));
      if (stillLoading) enterDegradedMode('STARTUP_TIMEOUT');
      else window.FSRuntimeHealth.state = 'ready';
    }, STARTUP_TIMEOUT_MS);
  }, { once: true });
})();
