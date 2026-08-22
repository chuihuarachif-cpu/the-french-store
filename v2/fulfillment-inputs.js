/* THE FRENCH STORE — checkout player/account inputs.
   Additive frontend module. It does not choose providers or execute purchases.
   Values remain in memory until checkout and are sent only inside the existing
   create_qr_order/create_wallet_order p_items payload.
*/
(() => {
  'use strict';

  const VERSION = 'fulfillment-inputs-v1';
  const state = {
    loaded: false,
    loading: null,
    loadError: null,
    byProduct: new Map(),
    values: new Map()
  };

  const safeText = (value) => String(value ?? '').trim();
  const html = (value) => safeText(value).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
  const norm = (value) => safeText(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

  function injectStyles() {
    if (document.getElementById('fsFulfillmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'fsFulfillmentStyles';
    style.textContent = `
      .fs-fulfillment{margin:14px 0;padding:14px;border:1px solid rgba(65,190,255,.25);border-radius:16px;background:rgba(4,20,34,.72)}
      .fs-fulfillment.hidden{display:none}
      .fs-fulfillment-head{display:grid;gap:5px;margin-bottom:12px}
      .fs-fulfillment-head b{font-size:1rem;color:#eefaff}.fs-fulfillment-head small{color:#9cb4c5;line-height:1.4}
      .fs-fulfillment-group{display:grid;gap:10px;padding:12px 0;border-top:1px solid rgba(255,255,255,.08)}
      .fs-fulfillment-group:first-of-type{border-top:0;padding-top:0}
      .fs-fulfillment-game{display:flex;align-items:center;justify-content:space-between;gap:10px}.fs-fulfillment-game b{color:#fff}.fs-fulfillment-game small{color:#75d9ff}
      .fs-fulfillment-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .fs-fulfillment-field{display:grid;gap:6px;color:#dcebf4;font-size:.9rem}.fs-fulfillment-field input,.fs-fulfillment-field select{width:100%;box-sizing:border-box;border:1px solid rgba(137,197,226,.28);border-radius:11px;background:#071725;color:#fff;padding:11px 12px;font:inherit;outline:none}.fs-fulfillment-field input:focus,.fs-fulfillment-field select:focus{border-color:#4fd4ff;box-shadow:0 0 0 2px rgba(79,212,255,.12)}
      .fs-fulfillment-field small{color:#8fa8b9;line-height:1.35}.fs-fulfillment-note{margin:0;color:#a9c0cf;font-size:.82rem;line-height:1.45}.fs-fulfillment-note a{color:#69dfff}
      .fs-fulfillment-error{border-color:rgba(255,95,95,.65)!important;box-shadow:0 0 0 2px rgba(255,95,95,.12)!important}
      @media(max-width:620px){.fs-fulfillment-fields{grid-template-columns:1fr}.fs-fulfillment{padding:12px}.fs-fulfillment-game{align-items:flex-start;flex-direction:column;gap:3px}}
    `;
    document.head.appendChild(style);
  }

  function cartItems() {
    try { return Array.isArray(cart) ? cart : []; } catch { return []; }
  }

  function productFor(id) {
    try { return typeof currentProduct === 'function' ? currentProduct(id) : null; } catch { return null; }
  }

  function gameName(product) {
    try { return typeof canonicalGame === 'function' ? canonicalGame(product?.juego) : safeText(product?.juego); }
    catch { return safeText(product?.juego); }
  }

  function scopeFor(product) {
    return norm(gameName(product)) || `product${product?.id || 'unknown'}`;
  }

  async function loadRequirements(force = false) {
    if (state.loaded && !force) return true;
    if (state.loading && !force) return state.loading;
    state.loading = (async () => {
      try {
        const { data, error } = await sb
          .from('checkout_input_requirements')
          .select('product_id,field_key,label,input_type,required,min_length,max_length,placeholder,help_text,options,sort_order')
          .eq('active', true)
          .order('product_id', { ascending: true })
          .order('sort_order', { ascending: true });
        if (error) throw error;
        const map = new Map();
        (data || []).forEach((row) => {
          const id = Number(row.product_id);
          if (!Number.isFinite(id)) return;
          if (!map.has(id)) map.set(id, []);
          map.get(id).push({
            key: safeText(row.field_key),
            label: safeText(row.label) || safeText(row.field_key),
            inputType: safeText(row.input_type) || 'text',
            required: row.required === true,
            minLength: Math.max(0, Number(row.min_length || 0)),
            maxLength: Math.min(200, Math.max(1, Number(row.max_length || 80))),
            placeholder: safeText(row.placeholder),
            helpText: safeText(row.help_text),
            options: Array.isArray(row.options) ? row.options : []
          });
        });
        state.byProduct = map;
        state.loaded = true;
        state.loadError = null;
        return true;
      } catch (error) {
        state.loaded = false;
        state.loadError = error;
        console.warn('FRENCH STORE fulfillment requirements unavailable');
        return false;
      } finally {
        state.loading = null;
      }
    })();
    return state.loading;
  }

  function requirementsFor(productId) {
    return state.byProduct.get(Number(productId)) || [];
  }

  function buildGroups() {
    const groups = new Map();
    cartItems().forEach((item) => {
      const product = productFor(item.product_id);
      if (!product) return;
      const requirements = requirementsFor(item.product_id);
      if (!requirements.length) return;
      const scope = scopeFor(product);
      if (!groups.has(scope)) groups.set(scope, {
        scope,
        game: gameName(product),
        productIds: new Set(),
        quantity: 0,
        requirements: new Map()
      });
      const group = groups.get(scope);
      group.productIds.add(Number(item.product_id));
      group.quantity += Math.max(1, Number(item.quantity || 1));
      requirements.forEach((req) => {
        if (!group.requirements.has(req.key)) group.requirements.set(req.key, req);
      });
    });
    return [...groups.values()];
  }

  function ensureBox() {
    let box = document.getElementById('fulfillmentInputs');
    if (box) return box;
    const total = document.querySelector('#cartModal .cart-total');
    if (!total?.parentNode) return null;
    box = document.createElement('section');
    box.id = 'fulfillmentInputs';
    box.className = 'fs-fulfillment hidden';
    total.parentNode.insertBefore(box, total);
    return box;
  }

  function optionParts(option) {
    if (typeof option === 'string') return { value: option, label: option };
    if (option && typeof option === 'object') {
      const value = safeText(option.value ?? option.label);
      return { value, label: safeText(option.label ?? option.value) || value };
    }
    return { value: '', label: '' };
  }

  function fieldMarkup(scope, req) {
    const values = state.values.get(scope) || {};
    const value = safeText(values[req.key]);
    const id = `fs-fi-${scope}-${norm(req.key)}`;
    const usableOptions = req.options.map(optionParts).filter((x) => x.value);
    let control;
    if (req.inputType === 'select' && usableOptions.length) {
      control = `<select id="${html(id)}" data-fs-scope="${html(scope)}" data-fs-key="${html(req.key)}" ${req.required ? 'required' : ''}><option value="">Selecciona una opción</option>${usableOptions.map((opt) => `<option value="${html(opt.value)}" ${opt.value === value ? 'selected' : ''}>${html(opt.label)}</option>`).join('')}</select>`;
    } else {
      control = `<input id="${html(id)}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${req.maxLength}" value="${html(value)}" placeholder="${html(req.placeholder)}" data-fs-scope="${html(scope)}" data-fs-key="${html(req.key)}" ${req.required ? 'required' : ''}>`;
    }
    return `<label class="fs-fulfillment-field" for="${html(id)}"><span>${html(req.label)}${req.required ? ' *' : ''}</span>${control}${req.helpText ? `<small>${html(req.helpText)}</small>` : ''}</label>`;
  }

  function render() {
    injectStyles();
    const box = ensureBox();
    if (!box) return;
    const groups = buildGroups();
    if (!groups.length) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }
    box.classList.remove('hidden');
    box.innerHTML = `<div class="fs-fulfillment-head"><b>Datos para entregar tu recarga</b><small>Completa únicamente los datos del juego. Nunca te pediremos contraseña, código de acceso ni correo de tu cuenta del juego.</small></div>${groups.map((group) => {
      const quantityNote = group.quantity > 1 ? `<p class="fs-fulfillment-note">Las ${group.quantity} unidades de este juego se enviarán al mismo ID. Para otro ID, realiza un pedido separado.</p>` : '';
      return `<div class="fs-fulfillment-group" data-fs-group="${html(group.scope)}"><div class="fs-fulfillment-game"><b>${html(group.game)}</b><small>${group.productIds.size} producto${group.productIds.size === 1 ? '' : 's'}</small></div><div class="fs-fulfillment-fields">${[...group.requirements.values()].map((req) => fieldMarkup(group.scope, req)).join('')}</div>${quantityNote}</div>`;
    }).join('')}<p class="fs-fulfillment-note">Usaremos estos identificadores solo para procesar/verificar la recarga y compartir con el proveedor autorizado únicamente lo necesario. Consulta la <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.</p>`;

    box.querySelectorAll('[data-fs-scope][data-fs-key]').forEach((control) => {
      control.addEventListener('input', () => {
        const scope = safeText(control.dataset.fsScope);
        const key = safeText(control.dataset.fsKey);
        if (!state.values.has(scope)) state.values.set(scope, {});
        state.values.get(scope)[key] = String(control.value ?? '');
        control.classList.remove('fs-fulfillment-error');
      });
      control.addEventListener('change', () => control.dispatchEvent(new Event('input')));
    });
  }

  function decorateItems(items) {
    return (items || []).map((item) => {
      const product = productFor(item.product_id);
      const requirements = requirementsFor(item.product_id);
      if (!product || !requirements.length) return item;
      const scope = scopeFor(product);
      const values = state.values.get(scope) || {};
      const fulfillment = {};
      requirements.forEach((req) => {
        const value = safeText(values[req.key]);
        if (value) fulfillment[req.key] = value;
      });
      return { ...item, fulfillment_version: 1, fulfillment };
    });
  }

  function rechargeByIdInCart() {
    return cartItems().some((item) => safeText(productFor(item.product_id)?.categoria) === 'Recargas por ID');
  }

  async function validateBeforeCheckout() {
    const loaded = await loadRequirements();
    render();
    if (!loaded) {
      if (rechargeByIdInCart()) return { ok: false, message: 'No se pudieron cargar los datos necesarios para la recarga. Reintenta en unos segundos antes de pagar.' };
      return { ok: true };
    }

    for (const group of buildGroups()) {
      const values = state.values.get(group.scope) || {};
      for (const req of group.requirements.values()) {
        const value = safeText(values[req.key]);
        if (req.required && !value) {
          const control = document.querySelector(`[data-fs-scope="${CSS.escape(group.scope)}"][data-fs-key="${CSS.escape(req.key)}"]`);
          control?.classList.add('fs-fulfillment-error');
          control?.focus();
          return { ok: false, message: `Completa ${req.label} para ${group.game} antes de pagar.` };
        }
        if (value && (value.length < req.minLength || value.length > req.maxLength)) {
          const control = document.querySelector(`[data-fs-scope="${CSS.escape(group.scope)}"][data-fs-key="${CSS.escape(req.key)}"]`);
          control?.classList.add('fs-fulfillment-error');
          control?.focus();
          return { ok: false, message: `${req.label} no tiene un formato válido.` };
        }
      }
    }
    return { ok: true };
  }

  function notice(message) {
    const el = document.getElementById('checkoutResult');
    if (!el) return;
    if (typeof showNotice === 'function') showNotice(el, message, 'error');
    else { el.textContent = message; el.className = 'notice error'; el.classList.remove('hidden'); }
  }

  function patchRpcItems() {
    try {
      if (window.__fsFulfillmentRpcPatched || typeof rpcItems !== 'function') return;
      const original = rpcItems;
      rpcItems = function fsFulfillmentRpcItems() {
        return decorateItems(original());
      };
      window.__fsFulfillmentRpcPatched = true;
    } catch (error) {
      console.warn('FRENCH STORE fulfillment RPC patch unavailable');
    }
  }

  function patchCheckoutButton(id) {
    const button = document.getElementById(id);
    if (!button || button.dataset.fsFulfillmentPatched === '1') return;
    const original = button.onclick;
    if (typeof original !== 'function') return;
    button.dataset.fsFulfillmentPatched = '1';
    button.onclick = async function fsFulfillmentCheckout(event) {
      if (button.dataset.fsFulfillmentBusy === '1') return;
      button.dataset.fsFulfillmentBusy = '1';
      try {
        const result = await validateBeforeCheckout();
        if (!result.ok) {
          notice(result.message);
          return;
        }
        return await original.call(button, event);
      } finally {
        delete button.dataset.fsFulfillmentBusy;
        if (!cartItems().length) {
          state.values.clear();
          render();
        }
      }
    };
  }

  function install() {
    injectStyles();
    patchRpcItems();
    patchCheckoutButton('checkoutWallet');
    patchCheckoutButton('checkoutQR');
    const cartBox = document.getElementById('cartItems');
    if (cartBox) {
      const observer = new MutationObserver(() => render());
      observer.observe(cartBox, { childList: true, subtree: false });
    }
    loadRequirements().then(() => render());
    render();
  }

  window.FSFulfillment = {
    version: VERSION,
    reloadRequirements: () => loadRequirements(true).then(() => { render(); return state.loaded; }),
    validateBeforeCheckout,
    decorateItems
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
