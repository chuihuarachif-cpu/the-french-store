/* French Store GA4: analítica opcional, sin datos personales ni eventos de pagos.
   Solo carga Google Analytics tras una aceptación explícita. */
(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-PBRC717F0H';
  var STORAGE_KEY = 'fs_ga4_consent_v1';
  var consent = null;
  var tagLoaded = false;
  var banner = null;

  function readConsent() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === 'allow' || stored === 'deny' ? stored : null;
    } catch (error) {
      return null;
    }
  }

  function storeConsent(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* Sin almacenamiento persistente. */ }
  }

  function sanitizedLocation() {
    // No se envían parámetros de búsqueda, fragmentos, IDs de pedidos ni datos de recarga.
    return window.location.origin + window.location.pathname;
  }

  function expireAnalyticsCookies() {
    document.cookie.split(';').forEach(function (entry) {
      var name = entry.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
      document.cookie = name + '=; Max-Age=0; Path=/v2; SameSite=Lax; Secure';
    });
  }

  function startAnalytics() {
    if (tagLoaded || consent !== 'allow') return;
    tagLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
      page_location: sanitizedLocation(),
      page_referrer: '',
      page_title: 'FRENCH STORE',
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(tag);
    window.gtag('event', 'page_view', {
      send_to: MEASUREMENT_ID,
      page_location: sanitizedLocation(),
      page_referrer: '',
      page_title: 'FRENCH STORE'
    });
  }

  function hideBanner() {
    if (banner) {
      banner.remove();
      banner = null;
    }
  }

  function choose(value) {
    var wasActive = tagLoaded;
    consent = value;
    storeConsent(value);
    hideBanner();
    if (value === 'allow') {
      startAnalytics();
    } else if (wasActive) {
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
      }
      expireAnalyticsCookies();
      // La etiqueta ya cargada podría seguir emitiendo pings sin cookies.
      // Recargar asegura que no se vuelve a cargar tras retirar el permiso.
      window.location.reload();
    }
  }

  function makeButton(label, cssClass, onClick) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = cssClass;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function showBanner() {
    if (banner) return;
    banner = document.createElement('aside');
    banner.className = 'fs-ga4-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Preferencias de estadísticas');
    var heading = document.createElement('strong');
    heading.textContent = 'Estadísticas opcionales';
    var description = document.createElement('p');
    description.textContent = '¿Nos permites usar Google Analytics para conocer las visitas y mejorar French Store? No es necesario para comprar y puedes cambiar tu elección cuando quieras.';
    var actions = document.createElement('div');
    actions.className = 'fs-ga4-actions';
    actions.appendChild(makeButton('No, gracias', 'fs-ga4-deny', function () { choose('deny'); }));
    actions.appendChild(makeButton('Permitir estadísticas', 'fs-ga4-allow', function () { choose('allow'); }));
    var policies = document.createElement('p');
    policies.className = 'fs-ga4-policies';
    var privacy = document.createElement('a');
    privacy.href = './privacy.html';
    privacy.textContent = 'Privacidad';
    var cookies = document.createElement('a');
    cookies.href = './cookies.html';
    cookies.textContent = 'Cookies';
    policies.appendChild(privacy);
    policies.appendChild(document.createTextNode(' · '));
    policies.appendChild(cookies);
    banner.appendChild(heading);
    banner.appendChild(description);
    banner.appendChild(actions);
    banner.appendChild(policies);
    document.body.appendChild(banner);
  }

  function init() {
    var footerNav = document.querySelector('.site-legal-footer nav');
    if (footerNav) {
      footerNav.appendChild(makeButton('Preferencias de estadísticas', 'fs-ga4-manage', showBanner));
    }
    consent = readConsent();
    if (consent === 'allow') startAnalytics();
    else if (consent === null) showBanner();
  }

  // Consentimiento del mismo dispositivo; nunca se incorpora a la cuenta Google.
  window.FSAnalyticsConsent = Object.freeze({
    get: function () { return readConsent(); },
    set: function (value) {
      if (value !== 'allow' && value !== 'deny') return;
      choose(value);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
