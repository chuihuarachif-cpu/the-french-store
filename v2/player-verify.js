/* THE FRENCH STORE — Player Verify v1
   Customer-facing ID/account verification for Recargas por ID.
   The browser never receives provider credentials, provider codes or reseller prices.
   Verification is advisory UX; the backend still re-verifies before any automated fulfillment. */
(() => {
  'use strict';

  const VERSION = 'player-verify-v1-20260823';
  const API_URL = 'https://api.frenchstorebo.com/api/player-verify';
  const state = {
    requirementsLoaded: false,
    requirementsLoading: null,
    byProduct: new Map(),
    verifiedByScope: new Map(),
    scheduled: false
  };

  const text = (value) => String(value ?? '').trim();
  const html = (value) => text(value).replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const norm = (value) => text(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');

  function injectStyles() {
    if (document.getElementById('fsPlayerVerifyStyles')) return;
    const style = document.createElement('style');
    style.id = 'fsPlayerVerifyStyles';
    style.textContent = `
      .fs-player-verify{margin:16px 0 18px;padding:15px;border:1px solid rgba(76,205,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(6,31,49,.96),rgba(5,19,32,.96));box-shadow:0 12px 28px rgba(0,0,0,.16)}
      .fs-player-verify-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.fs-player-verify-head div{display:grid;gap:4px}.fs-player-verify-head b{color:#f2fbff;font-size:1rem}.fs-player-verify-head small{color:#9fb7c8;line-height:1.4}.fs-player-verify-step{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#0d8bea;color:white;font-weight:800;flex:0 0 auto}
      .fs-player-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fs-player-field{display:grid;gap:6px;color:#dcebf4;font-size:.9rem}.fs-player-field input,.fs-player-field select{width:100%;box-sizing:border-box;border:1px solid rgba(137,197,226,.3);border-radius:11px;background:#071725;color:#fff;padding:11px 12px;font:inherit;outline:none}.fs-player-field input:focus,.fs-player-field select:focus{border-color:#4fd4ff;box-shadow:0 0 0 2px rgba(79,212,255,.12)}
      .fs-player-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}.fs-player-verify-btn{border:0;border-radius:11px;padding:11px 16px;background:#0d8bea;color:#fff;font:inherit;font-weight:800;cursor:pointer}.fs-player-verify-btn:disabled{opacity:.55;cursor:wait}.fs-player-result{display:flex;align-items:center;gap:10px;min-height:42px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.045);color:#a9c0cf;line-height:1.35;flex:1;min-width:220px}.fs-player-result.ok{background:rgba(22,163,74,.13);border:1px solid rgba(74,222,128,.24);color:#dcffe8}.fs-player-result.error{background:rgba(220,38,38,.11);border:1px solid rgba(248,113,113,.24);color:#ffe3e3}.fs-player-result strong{color:inherit}.fs-player-privacy{margin:10px 0 0;color:#849cac;font-size:.79rem;line-height:1.4}
      @media(max-width:620px){.fs-player-fields{grid-template-columns:1fr}.fs-player-verify{padding:13px}.fs-player-actions{display:grid}.fs-player-result{min-width:0}.fs-player-verify-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function gameScope(game) {
    return norm(game);
  }

  function productGame(product) {
    try { return typeof canonicalGame === 'function' ? canonicalGame(product?.juego) : text(product?.juego); }
    catch { return text(product?.juego); }
  }

  function activeIdProductsForGame(game) {
    try {
      return (Array.isArray(inventory) ? inventory : []).filter((product) =>
        product?.activo === true &&
        text(product?.categoria) === 'Recargas por ID' &&
        productGame(product) === game
      );
    } catch { return []; }
  }

  async function loadRequirements() {
    if (state.requirementsLoaded) return true;
    if (state.requirementsLoading) return state.requirementsLoading;
    state.requirementsLoading = (async () => {
      try {
        const { data, error } = await sb
          .from('checkout_input_requirements')
          .select('product_id,field_key,label,input_type,required,min_length,max_length,placeholder,help_text,options,sort_order')
          .eq('active', true)
          .order('product_id', { ascending:true })
          .order('sort_order', { ascending:true });
        if (error) throw error;
        const map = new Map();
        (data || []).forEach((row) => {
          const id = Number(row.product_id);
          if (!Number.isSafeInteger(id)) return;
          if (!map.has(id)) map.set(id, []);
          map.get(id).push({
            key: text(row.field_key),
            label: text(row.label) || text(row.field_key),
            inputType: text(row.input_type) || 'text',
            required: row.required === true,
            minLength: Math.max(0, Number(row.min_length || 0)),
            maxLength: Math.min(160, Math.max(1, Number(row.max_length || 80))),
            placeholder: text(row.placeholder),
            helpText: text(row.help_text),
            options: Array.isArray(row.options) ? row.options : [],
            sortOrder: Number(row.sort_order || 0)
          });
        });
        state.byProduct = map;
        state.requirementsLoaded = true;
        return true;
      } catch {
        state.requirementsLoaded = false;
        return false;
      } finally {
        state.requirementsLoading = null;
      }
    })();
    return state.requirementsLoading;
  }

  function requirementsForProduct(productId) {
    return state.byProduct.get(Number(productId)) || [];
  }

  function verificationContext(game) {
    const products = activeIdProductsForGame(game);
    const candidates = products
      .map((product) => ({ product, requirements: requirementsForProduct(product.id) }))
      .filter((entry) => entry.requirements.length > 0)
      .sort((a,b) => Number(a.product.precio || 0) - Number(b.product.precio || 0));
    if (!candidates.length) return null;

    // Choose one existing sellable package whose required fields represent the game.
    // The backend independently validates that this product has an EXACT GamerHub map.
    const chosen = candidates[0];
    const unique = new Map();
    candidates.forEach(({ requirements }) => requirements.forEach((req) => {
      if (!unique.has(req.key)) unique.set(req.key, req);
    }));
    return {
      productId: Number(chosen.product.id),
      requirements: [...unique.values()].sort((a,b) => a.sortOrder - b.sortOrder),
      productIds: new Set(candidates.map((entry) => Number(entry.product.id)))
    };
  }

  function optionParts(option) {
    if (typeof option === 'string') return { value:option, label:option };
    if (option && typeof option === 'object') {
      const value = text(option.value ?? option.label);
      return { value, label:text(option.label ?? option.value) || value };
    }
    return { value:'', label:'' };
  }

  function fieldMarkup(scope, req, values) {
    const value = text(values?.[req.key]);
    const id = `fs-pv-${scope}-${norm(req.key)}`;
    const options = req.options.map(optionParts).filter((opt) => opt.value);
    let control;
    if (req.inputType === 'select' && options.length) {
      control = `<select id="${html(id)}" data-pv-key="${html(req.key)}" ${req.required?'required':''}><option value="">Selecciona una opción</option>${options.map((opt) => `<option value="${html(opt.value)}" ${opt.value===value?'selected':''}>${html(opt.label)}</option>`).join('')}</select>`;
    } else {
      control = `<input id="${html(id)}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${req.maxLength}" value="${html(value)}" placeholder="${html(req.placeholder)}" data-pv-key="${html(req.key)}" ${req.required?'required':''}>`;
    }
    return `<label class="fs-player-field" for="${html(id)}"><span>${html(req.label)}${req.required?' *':''}</span>${control}${req.helpText?`<small>${html(req.helpText)}</small>`:''}</label>`;
  }

  function setResult(box, type, message) {
    if (!box) return;
    box.className = `fs-player-result${type ? ` ${type}` : ''}`;
    box.innerHTML = type === 'ok'
      ? `<span aria-hidden="true">✅</span><span>${message}</span>`
      : type === 'error'
        ? `<span aria-hidden="true">⚠️</span><span>${message}</span>`
        : `<span aria-hidden="true">🔎</span><span>${message}</span>`;
  }

  function clearVerified(scope) {
    state.verifiedByScope.delete(scope);
  }

  function currentValues(panel) {
    const values = {};
    panel?.querySelectorAll('[data-pv-key]').forEach((control) => {
      const key = text(control.dataset.pvKey);
      const value = text(control.value);
      if (key && value) values[key] = value;
    });
    return values;
  }

  function validateValues(requirements, values) {
    for (const req of requirements) {
      const value = text(values[req.key]);
      if (req.required && !value) return `${req.label} es obligatorio.`;
      if (value && (value.length < req.minLength || value.length > req.maxLength)) return `${req.label} no tiene un formato válido.`;
    }
    return null;
  }

  async function verifyPanel(panel) {
    const game = text(panel?.dataset?.pvGame);
    const productId = Number(panel?.dataset?.pvProductId);
    const scope = gameScope(game);
    const context = verificationContext(game);
    const resultBox = panel.querySelector('.fs-player-result');
    const button = panel.querySelector('.fs-player-verify-btn');
    if (!context || context.productId !== productId) {
      setResult(resultBox,'error','Este juego no está listo para verificación automática.');
      return;
    }

    let currentSession = null;
    try {
      currentSession = session || null;
      if (!currentSession) {
        const { data } = await sb.auth.getSession();
        currentSession = data?.session || null;
      }
    } catch {}
    if (!currentSession?.access_token) {
      setResult(resultBox,'error','Inicia sesión para verificar tu ID de forma segura.');
      try { if (typeof openModal === 'function') openModal('authModal'); } catch {}
      return;
    }

    const values = currentValues(panel);
    const invalid = validateValues(context.requirements, values);
    if (invalid) {
      setResult(resultBox,'error',html(invalid));
      return;
    }

    button.disabled = true;
    button.textContent = 'Verificando…';
    setResult(resultBox,'','Consultando tu cuenta…');
    try {
      const response = await fetch(API_URL, {
        method:'POST',
        headers:{
          Authorization:`Bearer ${currentSession.access_token}`,
          'Content-Type':'application/json',
          Accept:'application/json'
        },
        body:JSON.stringify({ product_id:productId, inputs:values })
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        setResult(resultBox,'error','Tu sesión venció. Vuelve a iniciar sesión para verificar.');
        return;
      }
      if (response.status === 429) {
        setResult(resultBox,'error','Hiciste demasiadas verificaciones. Espera un momento y vuelve a intentar.');
        return;
      }
      if (!response.ok || !data?.ok) {
        setResult(resultBox,'error',html(data?.message || 'La verificación está temporalmente no disponible.'));
        return;
      }
      if (data.verified !== true) {
        clearVerified(scope);
        setResult(resultBox,'error',html(data?.message || 'No encontramos una cuenta válida con esos datos.'));
        return;
      }

      const displayName = text(data.display_name);
      state.verifiedByScope.set(scope, {
        game,
        productId,
        productIds: context.productIds,
        inputs:{ ...values },
        displayName,
        verifiedAt:Date.now()
      });
      setResult(
        resultBox,
        'ok',
        displayName
          ? `<strong>${html(displayName)}</strong><span> · ID encontrado</span>`
          : '<strong>Cuenta encontrada</strong><span> · datos válidos</span>'
      );
      syncCartInputs();
    } catch {
      setResult(resultBox,'error','No se pudo conectar con la verificación. Intenta nuevamente.');
    } finally {
      button.disabled = false;
      button.textContent = 'Verificar ID';
    }
  }

  function syncCartInputs() {
    const box = document.getElementById('fulfillmentInputs');
    if (!box) return;
    box.querySelectorAll('[data-fs-scope][data-fs-key]').forEach((control) => {
      const scope = text(control.dataset.fsScope);
      const key = text(control.dataset.fsKey);
      const record = state.verifiedByScope.get(scope);
      const value = text(record?.inputs?.[key]);
      if (!record || !value) return;
      if (text(control.value) === value) return;
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles:true }));
      control.dispatchEvent(new Event('change', { bubbles:true }));
    });
  }

  function renderPanel(detail, game, context) {
    const scope = gameScope(game);
    const existing = state.verifiedByScope.get(scope);
    let panel = detail.querySelector('.fs-player-verify');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'fs-player-verify';
      const packagesHead = detail.querySelector('.r6-packages-head');
      if (packagesHead?.parentNode) packagesHead.parentNode.insertBefore(panel, packagesHead);
      else detail.appendChild(panel);
    }
    panel.dataset.pvGame = game;
    panel.dataset.pvProductId = String(context.productId);
    panel.innerHTML = `
      <div class="fs-player-verify-head"><span class="fs-player-verify-step">1</span><div><b>Ingresa y verifica tu ID</b><small>Comprobaremos que la cuenta exista antes de que pagues. Nunca pediremos contraseña ni códigos de acceso.</small></div></div>
      <div class="fs-player-fields">${context.requirements.map((req) => fieldMarkup(scope, req, existing?.inputs || {})).join('')}</div>
      <div class="fs-player-actions"><button type="button" class="fs-player-verify-btn">Verificar ID</button><div class="fs-player-result" role="status" aria-live="polite"></div></div>
      <p class="fs-player-privacy">La verificación solo confirma los datos necesarios para la recarga. El proveedor se vuelve a validar en el servidor antes de una entrega automática.</p>`;

    const result = panel.querySelector('.fs-player-result');
    if (existing) {
      setResult(result,'ok',existing.displayName
        ? `<strong>${html(existing.displayName)}</strong><span> · ID encontrado</span>`
        : '<strong>Cuenta encontrada</strong><span> · datos válidos</span>');
    } else {
      setResult(result,'','Escribe tus datos y pulsa “Verificar ID”.');
    }
    panel.querySelector('.fs-player-verify-btn')?.addEventListener('click', () => verifyPanel(panel));
    panel.querySelectorAll('[data-pv-key]').forEach((control) => {
      control.addEventListener('input', () => {
        if (state.verifiedByScope.has(scope)) {
          clearVerified(scope);
          setResult(result,'','Los datos cambiaron. Verifica nuevamente el ID.');
        }
      });
    });
  }

  async function decorateCurrentDetail() {
    state.scheduled = false;
    injectStyles();
    const detail = document.querySelector('#catalogList .r6-game-detail');
    if (!detail) return;
    let currentCategory = '';
    try { currentCategory = text(category); } catch {}
    if (currentCategory !== 'Recargas por ID') {
      detail.querySelector('.fs-player-verify')?.remove();
      return;
    }
    const game = text(detail.querySelector('.r6-hero-copy h3')?.textContent);
    if (!game) return;
    const loaded = await loadRequirements();
    if (!loaded) return;
    const context = verificationContext(game);
    if (!context) {
      detail.querySelector('.fs-player-verify')?.remove();
      return;
    }
    renderPanel(detail, game, context);
  }

  function scheduleDecorate() {
    if (state.scheduled) return;
    state.scheduled = true;
    requestAnimationFrame(() => decorateCurrentDetail());
  }

  function install() {
    injectStyles();
    const catalog = document.getElementById('catalogList');
    if (catalog) new MutationObserver(scheduleDecorate).observe(catalog,{childList:true,subtree:true});
    const cartBox = document.getElementById('cartItems');
    if (cartBox) new MutationObserver(() => requestAnimationFrame(syncCartInputs)).observe(cartBox,{childList:true,subtree:true});
    document.addEventListener('click',(event) => {
      if (event.target.closest?.('[data-r6-game],[data-r6-feature],[data-r6-back],[data-cat],[data-add],[data-fs-buy-now]')) {
        scheduleDecorate();
        requestAnimationFrame(syncCartInputs);
      }
    },true);
    loadRequirements().then(scheduleDecorate);
    scheduleDecorate();
  }

  window.FSPlayerVerify = Object.freeze({
    version:VERSION,
    refresh:scheduleDecorate,
    syncCartInputs,
    verifiedForProduct:(productId) => {
      const id = Number(productId);
      for (const record of state.verifiedByScope.values()) {
        if (record.productIds?.has(id)) return { ...record, productIds:undefined };
      }
      return null;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
