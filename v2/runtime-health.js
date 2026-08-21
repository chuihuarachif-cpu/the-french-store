/* THE FRENCH STORE — R32 startup health guard.
   Detects real startup/render failures, keeps Inicio/Tienda usable and prevents
   infinite CSS-only "Cargando..." states from looking like a healthy app. */
(() => {
  'use strict';

  const STARTUP_TIMEOUT_MS = 12000;
  const byId = (id) => document.getElementById(id);
  const dependencyReady = () => Boolean(window.supabase && typeof window.supabase.createClient === 'function');
  const diagnostics = () => window.FSStartupDiagnostics ||= {
    version:'R32', startedAt:Date.now(), stages:[], errors:[], lastStage:null,
    inventoryLen:null, completed:false
  };

  function rememberRuntimeError(kind, value, source='') {
    const d = diagnostics();
    const entry = {
      stage: kind,
      status: 'error',
      at: Date.now(),
      message: String(value?.message || value || 'Error desconocido').slice(0,300),
      source: String(source || '').slice(0,220)
    };
    d.errors.push(entry);
    if (d.errors.length > 20) d.errors.splice(0, d.errors.length - 20);
    d.lastStage = kind;
    return entry;
  }

  function runtimeNotice(message) {
    const featured = byId('featuredList');
    if (featured && !featured.children.length) {
      featured.innerHTML = `<div class="notice error" data-runtime-health-error="1"><b>No se pudo iniciar completamente la tienda.</b><br>${message}<br><button type="button" class="secondary-btn" data-runtime-retry style="margin-top:10px">Reintentar</button></div>`;
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
    if (window.FSRuntimeHealth.state === 'degraded' && window.FSRuntimeHealth.reason === reason) return;
    window.FSRuntimeHealth.state = 'degraded';
    window.FSRuntimeHealth.reason = reason;
    wireEmergencyNavigation();
    runtimeNotice('Revisa tu conexión y pulsa “Reintentar”. Si el problema continúa, contacta a soporte.');
  }

  window.FSRuntimeHealth = {
    state: dependencyReady() ? 'dependency-ready' : 'dependency-missing',
    reason: null,
    dependencyReady,
    diagnostics: () => JSON.parse(JSON.stringify(diagnostics()))
  };

  if (!dependencyReady()) enterDegradedMode('SUPABASE_CLIENT_MISSING');

  /* Record every same-site JS error, but only core startup files can force
     degraded mode before startup is known-good. Optional visual layers are
     diagnostic-only so they cannot disable a healthy storefront. */
  window.addEventListener('error', (event) => {
    if (!(event instanceof ErrorEvent)) return;
    const source = String(event.filename || '');
    if (source && !/\/v2\//.test(source)) return;
    rememberRuntimeError('WINDOW_ERROR', event.error || event.message, source);
    const core = /\/v2\/(?:app|r6|r7fix|runtime-health)\.js(?:\?|$)/.test(source);
    if (core && window.FSRuntimeHealth.state !== 'ready') enterDegradedMode('CORE_SCRIPT_ERROR');
  });

  /* Async exceptions do NOT fire window.error. This was the blind spot in R31. */
  window.addEventListener('unhandledrejection', (event) => {
    rememberRuntimeError('UNHANDLED_REJECTION', event.reason || 'Promesa rechazada');
    if (window.FSRuntimeHealth.state !== 'ready') enterDegradedMode('UNHANDLED_REJECTION');
  });

  window.addEventListener('fs:startup-error', (event) => {
    window.FSRuntimeHealth.reason = `RENDER_STAGE_${String(event.detail?.stage || 'UNKNOWN').toUpperCase()}`;
    if (window.FSRuntimeHealth.state !== 'ready') window.FSRuntimeHealth.state = 'recovering';
  });

  window.addEventListener('fs:startup-complete', () => {
    const featured = byId('featuredList');
    const catalog = byId('catalogList');
    if (featured?.children.length && catalog?.children.length) {
      window.FSRuntimeHealth.state = 'ready';
      window.FSRuntimeHealth.reason = null;
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (!dependencyReady()) {
      enterDegradedMode('SUPABASE_CLIENT_MISSING');
      return;
    }
    window.setTimeout(() => {
      if (window.FSRuntimeHealth.state === 'degraded') return;
      const featured = byId('featuredList');
      const catalog = byId('catalogList');
      const meta = byId('catalogMeta');
      const d = diagnostics();
      const featuredEmpty = !featured || featured.children.length === 0;
      const catalogEmpty = !catalog || catalog.children.length === 0;
      const metaStillLoading = /cargando/i.test(String(meta?.textContent || ''));
      const renderFailed = d.errors.some((entry) => String(entry.stage || '').startsWith('render'));

      if (featuredEmpty || catalogEmpty || metaStillLoading || renderFailed) {
        const reason = renderFailed ? 'RENDER_STAGE_ERROR' : 'STARTUP_TIMEOUT';
        enterDegradedMode(reason);
      } else {
        d.completed = true;
        window.FSRuntimeHealth.state = 'ready';
        window.FSRuntimeHealth.reason = null;
      }
    }, STARTUP_TIMEOUT_MS);
  }, { once: true });
})();
