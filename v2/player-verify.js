/* THE FRENCH STORE — Player ID capture + optional account verification.
   R127 manual-fulfillment policy:
   - Player/account identifiers are captured independently of GamerHub availability.
   - Optional provider verification may show a nickname, but never becomes a payment prerequisite.
   - Provider credentials/codes/prices never reach the browser.
   - No purchase endpoint is called from this module. */
(() => {
  'use strict';

  const VERSION = 'player-id-manual-v3-20260830-r127';
  const API_URL = 'https://api.frenchstorebo.com/api/player-verify';
  const MANUAL_PREFIX = '[MANUAL_ONLY]';
  const state = {
    loaded: false,
    loading: null,
    byProduct: new Map(),
    entered: new Map(),
    verified: new Map(),
    scheduled: false
  };

  const text = (v) => String(v ?? '').trim();
  const html = (v) => text(v).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
  const norm = (v) => text(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const publicHelp = (v) => text(v).startsWith(MANUAL_PREFIX) ? text(v).slice(MANUAL_PREFIX.length).trim() : text(v);

  function injectStyles() {
    if (document.getElementById('fsPlayerVerifyStyles')) return;
    const s = document.createElement('style');
    s.id = 'fsPlayerVerifyStyles';
    s.textContent = `
      .fs-player-verify{margin:16px 0 18px;padding:15px;border:1px solid rgba(76,205,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(6,31,49,.96),rgba(5,19,32,.96));box-shadow:0 12px 28px rgba(0,0,0,.16)}
      .fs-player-verify-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}.fs-player-verify-head div{display:grid;gap:4px}.fs-player-verify-head b{color:#f2fbff}.fs-player-verify-head small{color:#9fb7c8;line-height:1.4}.fs-player-verify-step{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#0d8bea;color:#fff;font-weight:800;flex:0 0 auto}
      .fs-player-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fs-player-field{display:grid;gap:6px;color:#dcebf4;font-size:.9rem}.fs-player-field input,.fs-player-field select{box-sizing:border-box;width:100%;border:1px solid rgba(137,197,226,.3);border-radius:11px;background:#071725;color:#fff;padding:11px 12px;font:inherit;outline:none}.fs-player-field input:focus,.fs-player-field select:focus{border-color:#4fd4ff;box-shadow:0 0 0 2px rgba(79,212,255,.12)}.fs-player-field small{color:#8fa8b9;line-height:1.35}
      .fs-player-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}.fs-player-verify-btn{border:1px solid rgba(79,212,255,.28);border-radius:11px;padding:11px 16px;background:#0d8bea;color:#fff;font:inherit;font-weight:800;cursor:pointer}.fs-player-verify-btn:disabled{opacity:.55;cursor:wait}.fs-player-result{display:flex;align-items:center;gap:9px;min-height:42px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.045);color:#a9c0cf;line-height:1.35;flex:1;min-width:220px}.fs-player-result.ok{background:rgba(22,163,74,.13);border:1px solid rgba(74,222,128,.24);color:#dcffe8}.fs-player-result.warning{background:rgba(245,158,11,.10);border:1px solid rgba(251,191,36,.25);color:#ffe9b0}.fs-player-result.error{background:rgba(220,38,38,.11);border:1px solid rgba(248,113,113,.24);color:#ffe3e3}.fs-player-privacy{margin:10px 0 0;color:#849cac;font-size:.79rem;line-height:1.4}
      @media(max-width:620px){.fs-player-fields{grid-template-columns:1fr}.fs-player-verify{padding:13px}.fs-player-actions{display:grid}.fs-player-result{min-width:0}.fs-player-verify-btn{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function gameScope(game) { return norm(game); }
  function productGame(p) {
    try { return typeof canonicalGame === 'function' ? canonicalGame(p?.juego) : text(p?.juego); }
    catch { return text(p?.juego); }
  }
  function idProducts(game) {
    try {
      return (Array.isArray(inventory) ? inventory : []).filter((p) =>
        p?.activo === true && text(p?.categoria) === 'Recargas por ID' && productGame(p) === game
      );
    } catch { return []; }
  }

  async function loadRequirements(force = false) {
    if (state.loaded && !force) return true;
    if (state.loading && !force) return state.loading;
    state.loading = (async () => {
      try {
        const { data, error } = await sb.from('checkout_input_requirements')
          .select('product_id,field_key,label,input_type,required,min_length,max_length,placeholder,help_text,options,sort_order')
          .eq('active', true)
          .order('product_id', { ascending: true })
          .order('sort_order', { ascending: true });
        if (error) throw error;
        const map = new Map();
        (data || []).forEach((row) => {
          const id = Number(row.product_id);
          if (!Number.isSafeInteger(id)) return;
          if (!map.has(id)) map.set(id, []);
          const raw = text(row.help_text);
          map.get(id).push({
            key: text(row.field_key),
            label: text(row.label) || text(row.field_key),
            inputType: text(row.input_type) || 'text',
            required: row.required === true,
            minLength: Math.max(0, Number(row.min_length || 0)),
            maxLength: Math.min(160, Math.max(1, Number(row.max_length || 80))),
            placeholder: text(row.placeholder),
            helpText: publicHelp(raw),
            manualOnly: raw.startsWith(MANUAL_PREFIX),
            options: Array.isArray(row.options) ? row.options : [],
            sortOrder: Number(row.sort_order || 0)
          });
        });
        state.byProduct = map;
        state.loaded = true;
        return true;
      } catch {
        state.loaded = false;
        return false;
      } finally {
        state.loading = null;
      }
    })();
    return state.loading;
  }

  function contextFor(game) {
    const candidates = idProducts(game)
      .map((product) => ({ product, requirements: state.byProduct.get(Number(product.id)) || [] }))
      .filter((entry) => entry.requirements.length)
      .sort((a, b) => Number(a.product.precio || 0) - Number(b.product.precio || 0));
    if (!candidates.length) return null;

    const all = new Map();
    const verifiable = new Map();
    candidates.forEach(({ requirements }) => requirements.forEach((r) => {
      if (!all.has(r.key)) all.set(r.key, r);
      if (!r.manualOnly && !verifiable.has(r.key)) verifiable.set(r.key, r);
    }));
    if (!all.size) return null;

    return {
      productId: Number(candidates[0].product.id),
      requirements: [...all.values()].sort((a, b) => a.sortOrder - b.sortOrder),
      verifyRequirements: [...verifiable.values()].sort((a, b) => a.sortOrder - b.sortOrder),
      productIds: new Set(candidates.map((e) => Number(e.product.id)))
    };
  }

  function optionParts(o) {
    if (typeof o === 'string') return { value: o, label: o };
    if (o && typeof o === 'object') {
      const value = text(o.value ?? o.label);
      return { value, label: text(o.label ?? o.value) || value };
    }
    return { value: '', label: '' };
  }

  function fieldMarkup(scope, req, values) {
    const value = text(values?.[req.key]);
    const id = `fs-pv-${scope}-${norm(req.key)}`;
    const opts = req.options.map(optionParts).filter((o) => o.value);
    let control;
    if (req.inputType === 'select' && opts.length) {
      control = `<select id="${html(id)}" data-pv-key="${html(req.key)}" ${req.required ? 'required' : ''}><option value="">Selecciona una opción</option>${opts.map((o) => `<option value="${html(o.value)}" ${o.value === value ? 'selected' : ''}>${html(o.label)}</option>`).join('')}</select>`;
    } else {
      control = `<input id="${html(id)}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${req.maxLength}" value="${html(value)}" placeholder="${html(req.placeholder)}" data-pv-key="${html(req.key)}" ${req.required ? 'required' : ''}>`;
    }
    return `<label class="fs-player-field" for="${html(id)}"><span>${html(req.label)}${req.required ? ' *' : ''}</span>${control}${req.helpText ? `<small>${html(req.helpText)}</small>` : ''}</label>`;
  }

  function setResult(box, type, message) {
    if (!box) return;
    box.className = `fs-player-result${type ? ` ${type}` : ''}`;
    const icon = type === 'ok' ? '✅' : type === 'error' ? '⚠️' : type === 'warning' ? 'ℹ️' : '🔎';
    box.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  }

  function signal(scope) {
    document.dispatchEvent(new CustomEvent('fs:player-verify-change', { detail: { scope } }));
  }
  function clearVerified(scope) {
    if (state.verified.delete(scope)) signal(scope);
  }
  function panelValues(panel) {
    const out = {};
    panel?.querySelectorAll('[data-pv-key]').forEach((c) => {
      const key = text(c.dataset.pvKey);
      const value = text(c.value);
      if (key && value) out[key] = value;
    });
    return out;
  }
  function invalid(requirements, values) {
    for (const r of requirements) {
      const v = text(values[r.key]);
      if (r.required && !v) return `${r.label} es obligatorio.`;
      if (v && (v.length < r.minLength || v.length > r.maxLength)) return `${r.label} no tiene un formato válido.`;
    }
    return null;
  }

  function rememberEntered(scope, values) {
    state.entered.set(scope, { ...values });
    syncCartInputs();
    document.dispatchEvent(new CustomEvent('fs:player-input-change', { detail: { scope } }));
  }

  function valuesForScope(scope) {
    const verified = state.verified.get(scope)?.inputs;
    if (verified && Object.keys(verified).length) return verified;
    return state.entered.get(scope) || {};
  }

  function syncCartInputs() {
    const box = document.getElementById('fulfillmentInputs');
    if (!box) return;
    box.querySelectorAll('[data-fs-scope][data-fs-key]').forEach((control) => {
      const scope = text(control.dataset.fsScope);
      const key = text(control.dataset.fsKey);
      const value = text(valuesForScope(scope)?.[key]);
      if (!value || text(control.value) === value) return;
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  async function verifyPanel(panel) {
    const game = text(panel?.dataset.pvGame);
    const productId = Number(panel?.dataset.pvProductId);
    const scope = gameScope(game);
    const ctx = contextFor(game);
    const result = panel.querySelector('.fs-player-result');
    const button = panel.querySelector('.fs-player-verify-btn');

    if (!ctx || ctx.productId !== productId || !ctx.verifyRequirements.length) {
      setResult(result, 'warning', 'La verificación automática no está disponible para este juego. El ID se guardará igualmente con tu pedido.');
      return;
    }

    const allValues = panelValues(panel);
    rememberEntered(scope, allValues);
    const problem = invalid(ctx.requirements, allValues);
    if (problem) {
      setResult(result, 'error', html(problem));
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
      setResult(result, 'warning', 'Inicia sesión si quieres verificar el nombre. Tu ID ya puede conservarse para el pedido.');
      try { if (typeof openModal === 'function') openModal('authModal'); } catch {}
      return;
    }

    const verifyInputs = {};
    ctx.verifyRequirements.forEach((r) => {
      const value = text(allValues[r.key]);
      if (value) verifyInputs[r.key] = value;
    });

    button.disabled = true;
    button.textContent = 'Verificando…';
    setResult(result, '', 'Consultando el nombre de la cuenta…');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ product_id: productId, inputs: verifyInputs })
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setResult(result, 'warning', 'La sesión venció. Puedes continuar con el ID escrito; la cuenta se revisará manualmente antes de recargar.');
        return;
      }
      if (response.status === 429) {
        setResult(result, 'warning', 'El verificador está temporalmente limitado. Puedes continuar; revisaremos el ID manualmente antes de recargar.');
        return;
      }
      if (!response.ok || !data?.ok) {
        setResult(result, 'warning', 'No pudimos comprobar el nombre ahora. Puedes continuar: revisa bien el ID y lo confirmaremos manualmente antes de realizar la recarga.');
        return;
      }
      if (data.verified !== true) {
        clearVerified(scope);
        setResult(result, 'error', html(data?.message || 'No encontramos una cuenta válida. Revisa cuidadosamente el ID antes de continuar.'));
        return;
      }

      const displayName = text(data.display_name);
      state.verified.set(scope, {
        game,
        productId,
        productIds: ctx.productIds,
        inputs: { ...allValues },
        displayName,
        verifiedAt: Date.now()
      });
      rememberEntered(scope, allValues);
      setResult(result, 'ok', displayName
        ? `<strong>${html(displayName)}</strong><span> · nombre verificado</span>`
        : '<strong>Cuenta encontrada</strong><span> · datos verificados</span>');
      signal(scope);
    } catch {
      setResult(result, 'warning', 'El verificador externo no respondió. Puedes continuar con el ID escrito; lo revisaremos manualmente antes de recargar.');
    } finally {
      button.disabled = false;
      button.textContent = 'Verificar nombre (opcional)';
    }
  }

  function renderPanel(detail, game, ctx) {
    const scope = gameScope(game);
    const existingVerified = state.verified.get(scope);
    const existingValues = existingVerified?.inputs || state.entered.get(scope) || {};
    let panel = detail.querySelector('.fs-player-verify');
    if (panel && panel.dataset.pvGame === game && panel.dataset.pvProductId === String(ctx.productId)) {
      detail.querySelector('.fs-manual-id-panel')?.remove();
      return panel;
    }

    panel?.remove();
    detail.querySelector('.fs-manual-id-panel')?.remove();
    panel = document.createElement('section');
    panel.className = 'fs-player-verify';
    panel.dataset.pvGame = game;
    panel.dataset.pvProductId = String(ctx.productId);
    panel.innerHTML = `
      <div class="fs-player-verify-head"><span class="fs-player-verify-step">1</span><div><b>Ingresa tu ID de jugador</b><small>Estos datos son necesarios para entregar la recarga. La comprobación del nombre es opcional y nunca te pediremos contraseña, código de acceso ni correo de tu cuenta del juego.</small></div></div>
      <div class="fs-player-fields">${ctx.requirements.map((r) => fieldMarkup(scope, r, existingValues)).join('')}</div>
      <div class="fs-player-actions"><button type="button" class="fs-player-verify-btn">Verificar nombre (opcional)</button><div class="fs-player-result" role="status" aria-live="polite"></div></div>
      <p class="fs-player-privacy">El ID se guardará de forma segura con tu pedido. Si el verificador externo no está disponible, la recarga seguirá como pedido manual y revisaremos los datos antes de enviarla al proveedor.</p>`;

    const result = panel.querySelector('.fs-player-result');
    if (existingVerified) {
      setResult(result, 'ok', existingVerified.displayName
        ? `<strong>${html(existingVerified.displayName)}</strong><span> · nombre verificado</span>`
        : '<strong>Cuenta encontrada</strong><span> · datos verificados</span>');
    } else {
      setResult(result, '', 'Escribe tu ID. Verificar el nombre es opcional.');
    }

    panel.querySelector('.fs-player-verify-btn')?.addEventListener('click', () => verifyPanel(panel));
    panel.querySelectorAll('[data-pv-key]').forEach((control) => {
      const capture = () => {
        const values = panelValues(panel);
        rememberEntered(scope, values);
        if (state.verified.has(scope)) {
          clearVerified(scope);
          setResult(result, '', 'Los datos cambiaron. Puedes verificar el nombre otra vez si deseas.');
        }
      };
      control.addEventListener('input', capture);
      control.addEventListener('change', capture);
    });

    const head = detail.querySelector('.r6-packages-head');
    if (head?.parentNode) head.parentNode.insertBefore(panel, head);
    else detail.appendChild(panel);
    requestAnimationFrame(() => { try { window.FSDetailLayout?.refresh?.(); } catch {} });
    return panel;
  }

  async function decorate() {
    state.scheduled = false;
    injectStyles();
    const detail = document.querySelector('#catalogList .r6-game-detail');
    if (!detail) return;
    let cat = '';
    try { cat = text(category); } catch {}
    if (cat !== 'Recargas por ID') {
      detail.querySelector('.fs-player-verify')?.remove();
      return;
    }
    const game = text(detail.dataset.fsGame || detail.querySelector('.r6-hero-copy h3')?.textContent || detail.querySelector('.fs-detail-description h3')?.textContent);
    if (!game) return;
    if (!await loadRequirements()) return;
    const ctx = contextFor(game);
    if (!ctx) {
      detail.querySelector('.fs-player-verify')?.remove();
      return;
    }
    renderPanel(detail, game, ctx);
  }

  function schedule() {
    if (state.scheduled) return;
    state.scheduled = true;
    requestAnimationFrame(() => decorate());
  }

  function loadDetailLayout() {
    if (document.getElementById('fs-detail-layout-v2')) return;
    const script = document.createElement('script');
    script.id = 'fs-detail-layout-v2';
    script.src = './detail-layout-v2.js?v=20260824-2';
    script.defer = true;
    document.head.appendChild(script);
  }

  function install() {
    injectStyles();
    const catalog = document.getElementById('catalogList');
    if (catalog) new MutationObserver(schedule).observe(catalog, { childList: true, subtree: false });
    const cartBox = document.getElementById('cartItems');
    if (cartBox) new MutationObserver(() => requestAnimationFrame(syncCartInputs)).observe(cartBox, { childList: true, subtree: true });
    document.addEventListener('click', (e) => {
      if (e.target.closest?.('[data-r6-game],[data-r6-feature],[data-r6-back],[data-cat],[data-add],[data-fs-buy-now]')) {
        schedule();
        requestAnimationFrame(() => requestAnimationFrame(syncCartInputs));
      }
    }, true);
    document.addEventListener('fs:checkout-fulfillment-rendered', () => syncCartInputs());
    loadRequirements().then(schedule);
    loadDetailLayout();
    schedule();
  }

  window.FSPlayerVerify = Object.freeze({
    version: VERSION,
    refresh: schedule,
    reloadRequirements: () => loadRequirements(true).then(() => { schedule(); return state.loaded; }),
    syncCartInputs,
    enteredForGame: (game) => ({ ...(state.entered.get(gameScope(game)) || {}) }),
    verifiedForProduct: (productId) => {
      const id = Number(productId);
      for (const record of state.verified.values()) {
        if (record.productIds?.has(id)) return { ...record, productIds: undefined };
      }
      return null;
    },
    verifiedForGame: (game) => {
      const record = state.verified.get(gameScope(game));
      return record ? { ...record, productIds: undefined } : null;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
