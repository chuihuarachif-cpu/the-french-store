/* THE FRENCH STORE — nombre preferido del cliente.
   Solo presentación. No escribe en Supabase, no toca precios, pedidos,
   Wallet, pagos ni autorización.

   Por qué existe:
   - El ingreso público es solo Google, y Google SÍ entrega el nombre en
     `user_metadata.full_name` / `name`. Hasta ahora nadie lo usaba, así que
     `renderProfile()` caía siempre en "Cliente FRENCH STORE" porque muestra
     `profiles.display_name`, columna que ninguna parte del código escribe.
   - Este módulo usa el nombre de Google como valor por defecto y deja que el
     cliente elija cómo quiere que le llamen.

   Persistencia: en el dispositivo (localStorage), por id de usuario.
   La tabla `profiles` tiene únicamente política SELECT (`users_read_own_profile`),
   no existe política UPDATE ni una función tipo `set_my_display_name`, así que
   un guardado contra la base de datos sería rechazado por RLS. Crear esa
   política o esa función es un cambio de base de datos y queda fuera de
   alcance hasta que se apruebe explícitamente. */
(() => {
  'use strict';

  const VERSION = 'profile-name-v1-20260911';
  const KEY_PREFIX = 'fs.profile.name.';
  const MAX = 24;

  const el = (id) => document.getElementById(id);

  /* `session` y `profile` se declaran con `let` en v2/core/runtime.js, así que
     viven en el ámbito léxico global y NO como propiedades de window. Se leen
     por identificador, igual que hace el resto de los módulos. */
  function currentSession() {
    try { return typeof session !== 'undefined' ? session : null; } catch { return null; }
  }
  function currentProfile() {
    try { return typeof profile !== 'undefined' ? profile : null; } catch { return null; }
  }

  function userId() {
    return currentSession()?.user?.id || null;
  }

  function storageKey() {
    const id = userId();
    return id ? KEY_PREFIX + id : null;
  }

  function readOverride() {
    const key = storageKey();
    if (!key) return '';
    try { return String(localStorage.getItem(key) || '').trim(); } catch { return ''; }
  }

  function writeOverride(value) {
    const key = storageKey();
    if (!key) return;
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {}
  }

  /* Nombre que viene de Google. Se valida para que nunca entre un fragmento
     de correo ni una cadena rara. */
  function googleName() {
    const meta = currentSession()?.user?.user_metadata || {};
    const raw = String(meta.full_name || meta.name || meta.given_name || '').trim();
    if (!raw || raw.includes('@')) return '';
    const first = raw.split(/\s+/)[0] || '';
    return /^[\p{L}][\p{L}'’-]{1,23}$/u.test(first) ? first : '';
  }

  /* Orden: lo que el cliente eligió, luego lo que diga el servidor, luego
     Google, y al final el genérico de siempre. */
  function resolvedName() {
    return readOverride()
        || String(currentProfile()?.display_name || '').trim()
        || googleName()
        || '';
  }

  function displayName() {
    return resolvedName() || 'Cliente FRENCH STORE';
  }

  function initials() {
    const name = resolvedName();
    if (!name) return 'FS';
    return name.slice(0, 2).toUpperCase();
  }

  function sanitize(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX);
  }

  /* Se acepta cualquier nombre razonable; se rechaza lo que parezca un correo
     o contenga caracteres de marcado. */
  function isValid(value) {
    if (!value) return true; // vacío = volver al automático
    if (value.includes('@')) return false;
    return /^[\p{L}\p{N} '’.-]{2,24}$/u.test(value);
  }

  function paint() {
    const name = displayName();
    const profileName = el('profileName');
    if (profileName && currentSession()) profileName.textContent = name;

    const avatar = document.querySelector('#view-perfil .avatar');
    if (avatar && currentSession()) avatar.textContent = initials();

    const authButton = el('authButton');
    if (authButton && currentSession()) {
      authButton.textContent = resolvedName() || currentProfile()?.email || 'Mi cuenta';
    }

    const input = el('fsPreferredName');
    if (input && document.activeElement !== input) input.value = readOverride();

    const hint = el('fsPreferredNameHint');
    if (hint) {
      const override = readOverride();
      hint.textContent = override
        ? `Te llamamos ${override}.`
        : googleName()
          ? `Usamos ${googleName()}, el nombre de tu cuenta de Google. Puedes cambiarlo.`
          : 'Escribe cómo prefieres que te llamemos.';
    }
  }

  function status(message, tone) {
    const box = el('fsPreferredNameResult');
    if (!box) return;
    if (typeof showNotice === 'function') showNotice(box, message, tone || '');
    else { box.textContent = message; box.classList.remove('hidden'); }
    if (tone === 'success') setTimeout(() => { try { hideNotice(box); } catch {} }, 2600);
  }

  function save() {
    const input = el('fsPreferredName');
    if (!input) return;
    const value = sanitize(input.value);

    if (!isValid(value)) {
      status('Usa solo letras, números y espacios (2 a 24 caracteres), sin correo.', 'error');
      return;
    }

    writeOverride(value);
    input.value = value;
    paint();
    status(value ? `Listo, te llamaremos ${value}.` : 'Volvimos al nombre de tu cuenta de Google.', 'success');
    try { window.FSTierSound?.gesture?.('tap', document.documentElement.dataset.fsTier, input); } catch {}
  }

  /* La tarjeta se inyecta en la vista de Perfil; no se toca index.html. */
  function mount() {
    if (el('fsPreferredNameCard')) return;
    const panel = document.querySelector('#view-perfil .profile-panel');
    const actions = panel?.querySelector('.profile-actions');
    if (!panel || !actions) return;

    const card = document.createElement('div');
    card.id = 'fsPreferredNameCard';
    card.className = 'topup-box fs-preferred-name';
    card.innerHTML = `
      <label for="fsPreferredName">¿Cómo quieres que te llamemos?</label>
      <div class="input-row">
        <input id="fsPreferredName" type="text" maxlength="${MAX}" autocomplete="given-name"
               inputmode="text" placeholder="Ej. Carlos" aria-describedby="fsPreferredNameHint">
        <button id="fsPreferredNameSave" class="primary-btn" type="button">Guardar</button>
      </div>
      <small id="fsPreferredNameHint" class="security-note"></small>
      <div id="fsPreferredNameResult" class="notice hidden" role="status" aria-live="polite"></div>
    `;
    panel.insertBefore(card, actions);

    el('fsPreferredNameSave').addEventListener('click', save);
    el('fsPreferredName').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); save(); }
    });

    paint();
  }

  function sync() {
    const card = el('fsPreferredNameCard');
    if (!currentSession()) { card?.remove(); return; }
    mount();
    paint();
  }

  /* renderProfile() es global y la base la llama tras cada cambio de sesión.
     Se envuelve llamando primero al original, así el flujo actual no cambia. */
  function wrapRenderProfile() {
    const original = window.renderProfile;
    if (typeof original !== 'function' || original.__fsNameWrapped) return;
    function wrapped() {
      const result = original.apply(this, arguments);
      try { sync(); } catch {}
      return result;
    }
    wrapped.__fsNameWrapped = true;
    window.renderProfile = wrapped;
  }

  function start() {
    wrapRenderProfile();
    sync();
    try {
      sb?.auth?.onAuthStateChange?.(() => setTimeout(sync, 0));
    } catch {}
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-nav="perfil"]')) setTimeout(sync, 0);
    }, { passive: true });
  }

  window.FSProfileName = Object.freeze({
    version: VERSION,
    resolvedName,
    displayName,
    initials,
    googleName,
    isValid,
    sanitize,
    /* Solo para pruebas. */
    __sync: sync,
    __save: save
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
