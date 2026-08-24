/* THE FRENCH STORE — Category Detail Layout v2
   Presentation + customer-input gate only. No provider purchase code lives here.
   - Recargas por ID: wide hero -> required ID inputs -> description -> locked packages.
   - Recargas por Cuenta / Streaming / Gift Cards: wide hero -> category notice -> description -> packages.
   - Gift Cards remain manual delivery.
   - Automatic ID verification is delegated to FSPlayerVerify; manual-only products require
     complete format-valid identifiers and are never presented as provider-verified. */
(() => {
  'use strict';

  const VERSION = 'detail-layout-v2-20260824';
  const ID_CATEGORY = 'Recargas por ID';
  const MANUAL_PREFIX = '[MANUAL_ONLY]';
  const state = {
    requirementsLoaded: false,
    requirementsLoading: null,
    byProduct: new Map(),
    manualValues: new Map(),
    scheduled: false
  };

  const text = (value) => String(value ?? '').trim();
  const html = (value) => text(value).replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const norm = (value) => text(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');

  function currentCategory() {
    try { return typeof category !== 'undefined' ? text(category) : ''; } catch { return ''; }
  }

  function productGame(product) {
    try { return typeof canonicalGame === 'function' ? canonicalGame(product?.juego) : text(product?.juego); }
    catch { return text(product?.juego); }
  }

  function currentGame(detail) {
    return text(
      detail?.dataset?.fsGame ||
      detail?.querySelector('.r6-hero-copy h3')?.textContent ||
      detail?.querySelector('.fs-detail-description h3')?.textContent
    );
  }

  function productsFor(game, cat) {
    try {
      return (Array.isArray(inventory) ? inventory : []).filter((p) =>
        p?.activo === true && text(p?.categoria) === cat && productGame(p) === game
      );
    } catch { return []; }
  }

  function injectStyles() {
    if (document.getElementById('fsDetailLayoutV2Style')) return;
    const style = document.createElement('style');
    style.id = 'fsDetailLayoutV2Style';
    style.textContent = `
      .r6-game-detail.fs-detail-v2{gap:14px!important;padding-bottom:18px}
      .fs-detail-v2 .r6-back{margin-bottom:1px}
      .fs-detail-v2 .r6-hero.fs-wide-hero{display:block!important;position:relative;min-height:245px!important;padding:0!important;border-radius:20px!important;overflow:hidden;background:#06131d!important}
      .fs-detail-v2 .r6-hero.fs-wide-hero:before{background-image:linear-gradient(90deg,rgba(2,10,18,.76),rgba(2,10,18,.18) 54%,rgba(2,10,18,.25)),var(--r6-hero)!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;filter:saturate(1.14) contrast(1.04)!important}
      .fs-detail-v2 .r6-hero.fs-wide-hero:after{background:linear-gradient(180deg,rgba(0,0,0,.02) 45%,rgba(3,14,23,.72) 100%),radial-gradient(circle at 78% 28%,rgba(75,217,255,.18),transparent 38%)!important}
      .fs-detail-v2 .r6-hero-glow{opacity:.12}
      .fs-detail-v2 .r6-hero-logo{position:absolute!important;left:16px;bottom:15px;width:70px!important;height:70px!important;border-radius:18px!important;border:1px solid rgba(103,232,247,.72)!important;box-shadow:0 12px 28px rgba(0,0,0,.45)!important;background:#07131e;z-index:2}
      .fs-detail-v2 .r6-hero-logo img{object-fit:cover}
      .fs-detail-description{display:grid;gap:7px;padding:3px 3px 5px}
      .fs-detail-description .r6-hero-copy{display:block}
      .fs-detail-description .r6-hero-copy h3{font:700 clamp(25px,5vw,42px)/1.08 'Orbitron',sans-serif;margin:6px 0 9px;overflow-wrap:anywhere;color:#fff}
      .fs-detail-description .r6-hero-copy p{max-width:720px;margin:0;color:#afc2cf;line-height:1.55}
      .fs-detail-description .r6-hero-tags{margin-top:11px}
      .fs-detail-service-note,.fs-manual-id-panel{border:1px solid rgba(64,207,244,.28);background:linear-gradient(145deg,rgba(7,30,46,.96),rgba(5,18,30,.96));border-radius:18px;padding:14px;box-shadow:0 12px 30px rgba(0,0,0,.12)}
      .fs-detail-service-note{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:start}
      .fs-detail-note-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(55,207,244,.12);font-size:18px}
      .fs-detail-service-note b{display:block;color:#f2fbff;margin-bottom:4px}.fs-detail-service-note p{margin:0;color:#9fb6c5;line-height:1.45;font-size:.9rem}
      .fs-manual-id-head{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;margin-bottom:12px}.fs-manual-id-step{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0d8bea;color:#fff;font-weight:800}.fs-manual-id-head b{display:block;color:#f4fbff}.fs-manual-id-head small{display:block;color:#9eb6c6;line-height:1.4;margin-top:3px}
      .fs-manual-id-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fs-manual-id-field{display:grid;gap:6px;color:#dcebf4;font-size:.9rem}.fs-manual-id-field input,.fs-manual-id-field select{box-sizing:border-box;width:100%;border:1px solid rgba(137,197,226,.3);border-radius:11px;background:#071725;color:#fff;padding:11px 12px;font:inherit;outline:none}.fs-manual-id-field input:focus,.fs-manual-id-field select:focus{border-color:#4fd4ff;box-shadow:0 0 0 2px rgba(79,212,255,.12)}.fs-manual-id-field small{color:#8ea8b9;line-height:1.35}.fs-manual-id-status{margin:11px 0 0;color:#9cb7c8;font-size:.83rem}.fs-manual-id-panel.ready .fs-manual-id-status{color:#c7f9da}
      .fs-detail-v2 .r6-packages-head{align-items:center;padding-top:4px}.fs-detail-v2 .r6-packages-head h3{font-size:clamp(18px,4vw,28px)}.fs-detail-v2 .r6-packages-head>span{font-size:12px;text-align:right}
      .fs-detail-v2 .r6-package-grid{grid-template-columns:repeat(auto-fit,minmax(145px,1fr))!important;gap:9px!important}
      .fs-detail-v2 .r6-package-card{position:relative;display:grid!important;grid-template-columns:1fr!important;align-content:start;gap:10px!important;min-height:132px;padding:12px!important;border-radius:14px!important;background:linear-gradient(155deg,#0a1d2b,#071520)!important}
      .fs-detail-v2 .r6-package-copy strong{font-size:13px;line-height:1.25}.fs-detail-v2 .r6-package-copy small{font-size:10px}.fs-detail-v2 .r6-package-actions{display:grid!important;justify-items:stretch!important;gap:7px;width:100%}.fs-detail-v2 .r6-package-actions>b{font-size:14px;color:#65e6f3!important;justify-self:start}
      .fs-detail-v2 .fs-buy-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:6px!important;width:100%}.fs-detail-v2 .fs-buy-actions button{font-size:10px!important;padding:8px 5px!important;min-width:0!important;white-space:normal!important;line-height:1.15}
      .fs-detail-v2 .r6-package-card.fs-id-locked{filter:none;opacity:.62;border-color:#183444!important}.fs-detail-v2 .r6-package-card.fs-id-locked .r6-package-copy,.fs-detail-v2 .r6-package-card.fs-id-locked .r6-package-actions{opacity:.62}.fs-package-lock{position:absolute;right:9px;top:9px;display:grid;place-items:center;width:28px;height:28px;border:1px solid #355060;border-radius:50%;background:#0a1a25;color:#9fb2bf;font-size:13px;z-index:3}.fs-id-ready .fs-package-lock{display:none}
      .fs-package-gate-note{display:flex;align-items:center;gap:7px;color:#7fdff0!important}.fs-package-gate-note.ready{color:#9fe8ba!important}
      .fs-detail-v2 .r6-package-card button:disabled{cursor:not-allowed!important;filter:grayscale(.4);opacity:.55!important}
      @media(max-width:620px){.fs-detail-v2 .r6-hero.fs-wide-hero{min-height:188px!important;border-radius:16px!important}.fs-detail-v2 .r6-hero-logo{width:58px!important;height:58px!important;left:11px;bottom:11px;border-radius:14px!important}.fs-detail-description .r6-hero-copy h3{font-size:23px}.fs-detail-description .r6-hero-copy p{font-size:13px}.fs-detail-v2 .r6-hero-tags span{font-size:9px}.fs-manual-id-fields{grid-template-columns:1fr}.fs-detail-v2 .r6-package-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.fs-detail-v2 .r6-package-card{min-height:128px;padding:10px!important}.fs-detail-v2 .fs-buy-actions{grid-template-columns:1fr}.fs-detail-v2 .r6-package-actions>b{font-size:13px}}
      @media(max-width:350px){.fs-detail-v2 .r6-package-grid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  async function loadRequirements(force = false) {
    if (state.requirementsLoaded && !force) return true;
    if (state.requirementsLoading && !force) return state.requirementsLoading;
    state.requirementsLoading = (async () => {
      try {
        const { data, error } = await sb
          .from('checkout_input_requirements')
          .select('product_id,field_key,label,input_type,required,min_length,max_length,placeholder,help_text,options,sort_order')
          .eq('active',true)
          .order('product_id',{ascending:true})
          .order('sort_order',{ascending:true});
        if (error) throw error;
        const map = new Map();
        (data || []).forEach((row) => {
          const id = Number(row.product_id);
          if (!Number.isSafeInteger(id)) return;
          if (!map.has(id)) map.set(id,[]);
          const rawHelp = text(row.help_text);
          map.get(id).push({
            key:text(row.field_key), label:text(row.label) || text(row.field_key),
            inputType:text(row.input_type) || 'text', required:row.required === true,
            minLength:Math.max(0,Number(row.min_length || 0)), maxLength:Math.min(200,Math.max(1,Number(row.max_length || 80))),
            placeholder:text(row.placeholder), helpText:rawHelp.startsWith(MANUAL_PREFIX) ? rawHelp.slice(MANUAL_PREFIX.length).trim() : rawHelp,
            manualOnly:rawHelp.startsWith(MANUAL_PREFIX), options:Array.isArray(row.options) ? row.options : [], sortOrder:Number(row.sort_order || 0)
          });
        });
        state.byProduct = map;
        state.requirementsLoaded = true;
        return true;
      } catch {
        state.requirementsLoaded = false;
        return false;
      } finally { state.requirementsLoading = null; }
    })();
    return state.requirementsLoading;
  }

  function requirementsForGame(game) {
    const unique = new Map();
    productsFor(game,ID_CATEGORY).forEach((product) => {
      (state.byProduct.get(Number(product.id)) || []).forEach((req) => {
        const current = unique.get(req.key);
        if (!current || (current.manualOnly && !req.manualOnly)) unique.set(req.key,req);
      });
    });
    return [...unique.values()].sort((a,b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
  }

  function optionParts(option) {
    if (typeof option === 'string') return { value:option,label:option };
    if (option && typeof option === 'object') {
      const value = text(option.value ?? option.label);
      return { value,label:text(option.label ?? option.value) || value };
    }
    return { value:'',label:'' };
  }

  function manualFieldMarkup(scope, req) {
    const values = state.manualValues.get(scope) || {};
    const value = text(values[req.key]);
    const id = `fs-manual-${scope}-${norm(req.key)}`;
    const options = req.options.map(optionParts).filter((opt) => opt.value);
    let control;
    if (req.inputType === 'select' && options.length) {
      control = `<select id="${html(id)}" data-fs-manual-key="${html(req.key)}"><option value="">Selecciona una opción</option>${options.map((opt) => `<option value="${html(opt.value)}" ${opt.value===value?'selected':''}>${html(opt.label)}</option>`).join('')}</select>`;
    } else {
      control = `<input id="${html(id)}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${req.maxLength}" value="${html(value)}" placeholder="${html(req.placeholder)}" data-fs-manual-key="${html(req.key)}">`;
    }
    return `<label class="fs-manual-id-field" for="${html(id)}"><span>${html(req.label)}${req.required?' *':''}</span>${control}${req.helpText?`<small>${html(req.helpText)}</small>`:''}</label>`;
  }

  function manualValidity(game) {
    const reqs = requirementsForGame(game);
    if (!state.requirementsLoaded || !reqs.length) return false;
    const values = state.manualValues.get(norm(game)) || {};
    for (const req of reqs) {
      const value = text(values[req.key]);
      if (req.required && !value) return false;
      if (value && (value.length < req.minLength || value.length > req.maxLength)) return false;
      const options = req.options.map(optionParts).filter((opt) => opt.value);
      if (value && options.length && !options.some((opt) => opt.value === value)) return false;
    }
    return true;
  }

  function syncManualCartInputs(game) {
    const scope = norm(game), values = state.manualValues.get(scope) || {};
    const box = document.getElementById('fulfillmentInputs');
    if (!box) return;
    box.querySelectorAll('[data-fs-scope][data-fs-key]').forEach((control) => {
      if (text(control.dataset.fsScope) !== scope) return;
      const value = text(values[text(control.dataset.fsKey)]);
      if (!value || text(control.value) === value) return;
      control.value = value;
      control.dispatchEvent(new Event('input',{bubbles:true}));
      control.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }

  function categoryNotice(cat) {
    if (cat === 'Recargas por Cuenta') return { icon:'👤', title:'Recarga por cuenta · atención asistida', text:'Selecciona la opción que necesitas. Nunca escribas aquí contraseñas, códigos de acceso ni credenciales de tu cuenta.' };
    if (cat === 'Streaming') return { icon:'📺', title:'Streaming · activación asistida', text:'El precio mostrado es el vigente en FRENCH STORE. La entrega o activación se coordina de forma segura cuando corresponda.' };
    if (cat === 'Gift Cards') return { icon:'🎁', title:'Código digital · entrega manual', text:'Revisa marca, denominación y región antes de comprar. Los códigos Gift Card se entregan manualmente y permanecen separados de las recargas.' };
    return null;
  }

  function packageTitle(cat) {
    if (cat === ID_CATEGORY) return 'Paquetes y precios';
    if (cat === 'Recargas por Cuenta') return 'Opciones disponibles';
    if (cat === 'Streaming') return 'Planes disponibles';
    if (cat === 'Gift Cards') return 'Denominaciones disponibles';
    return 'Opciones disponibles';
  }

  function ensureDescription(detail, hero) {
    let wrap = detail.querySelector('.fs-detail-description');
    if (!wrap) {
      wrap = document.createElement('section');
      wrap.className = 'fs-detail-description';
    }
    const copy = hero.querySelector('.r6-hero-copy') || wrap.querySelector('.r6-hero-copy');
    if (copy && copy.parentNode !== wrap) wrap.appendChild(copy);
    return wrap;
  }

  function ensureServiceNote(detail, cat) {
    detail.querySelector('.fs-detail-service-note')?.remove();
    const data = categoryNotice(cat);
    if (!data) return null;
    const note = document.createElement('section');
    note.className = 'fs-detail-service-note';
    note.innerHTML = `<span class="fs-detail-note-icon" aria-hidden="true">${data.icon}</span><div><b>${html(data.title)}</b><p>${html(data.text)}</p></div>`;
    return note;
  }

  function renderManualPanel(detail, game) {
    let panel = detail.querySelector('.fs-manual-id-panel');
    const reqs = requirementsForGame(game);
    if (!reqs.length) {
      panel?.remove();
      return null;
    }
    if (!panel) { panel = document.createElement('section'); panel.className = 'fs-manual-id-panel'; }
    const scope = norm(game);
    panel.dataset.fsManualGame = game;
    panel.innerHTML = `<div class="fs-manual-id-head"><span class="fs-manual-id-step">1</span><div><b>Ingresa los datos de tu recarga</b><small>Completa el ID exacto y el servidor/región solo cuando este juego lo requiera. Este producto se procesa de forma asistida; nunca pediremos contraseña.</small></div></div><div class="fs-manual-id-fields">${reqs.map((req) => manualFieldMarkup(scope,req)).join('')}</div><p class="fs-manual-id-status" role="status"></p>`;
    const update = () => {
      if (!state.manualValues.has(scope)) state.manualValues.set(scope,{});
      panel.querySelectorAll('[data-fs-manual-key]').forEach((control) => {
        state.manualValues.get(scope)[text(control.dataset.fsManualKey)] = String(control.value ?? '');
      });
      const ready = manualValidity(game);
      panel.classList.toggle('ready',ready);
      const status = panel.querySelector('.fs-manual-id-status');
      if (status) status.textContent = ready ? '✓ Datos completos. Ya puedes seleccionar un paquete.' : 'Completa los datos obligatorios para habilitar los paquetes.';
      updatePackageGate(detail,game);
      if (ready) syncManualCartInputs(game);
    };
    panel.querySelectorAll('[data-fs-manual-key]').forEach((control) => {
      control.addEventListener('input',update);
      control.addEventListener('change',update);
    });
    update();
    return panel;
  }

  function packageCards(detail) { return [...detail.querySelectorAll('.r6-package-card')]; }

  function setCardLocked(card, locked) {
    card.classList.toggle('fs-id-locked',locked);
    card.classList.toggle('fs-id-ready',!locked);
    let lock = card.querySelector('.fs-package-lock');
    if (locked && !lock) {
      lock = document.createElement('span');
      lock.className = 'fs-package-lock';
      lock.setAttribute('aria-label','Paquete bloqueado hasta completar el ID');
      lock.textContent = '🔒';
      card.appendChild(lock);
    }
    if (!locked) lock?.remove();
    card.querySelectorAll('[data-add],[data-fs-buy-now]').forEach((button) => {
      button.disabled = locked;
      button.setAttribute('aria-disabled',locked ? 'true' : 'false');
    });
  }

  function updatePackageGate(detail, game) {
    if (currentCategory() !== ID_CATEGORY) {
      packageCards(detail).forEach((card) => setCardLocked(card,false));
      return true;
    }
    const autoPanel = detail.querySelector('.fs-player-verify');
    const autoReady = Boolean(autoPanel && window.FSPlayerVerify?.verifiedForGame?.(game));
    const manualReady = Boolean(!autoPanel && manualValidity(game));
    const ready = autoReady || manualReady;
    packageCards(detail).forEach((card) => setCardLocked(card,!ready));
    const meta = detail.querySelector('.r6-packages-head>span');
    if (meta) {
      meta.classList.add('fs-package-gate-note');
      meta.classList.toggle('ready',ready);
      meta.textContent = ready ? '✓ ID listo · paquetes habilitados' : (autoPanel ? '🔒 Verifica tu ID para habilitar' : '🔒 Completa tu ID para habilitar');
    }
    return ready;
  }

  async function decorateDetail() {
    state.scheduled = false;
    injectStyles();
    const detail = document.querySelector('#catalogList .r6-game-detail');
    if (!detail) return;
    const cat = currentCategory();
    const hero = detail.querySelector('.r6-hero');
    if (!hero) return;
    const game = currentGame(detail);
    if (!game) return;
    detail.dataset.fsGame = game;
    detail.dataset.fsCategory = cat;
    detail.classList.add('fs-detail-v2');
    hero.classList.add('fs-wide-hero');

    await loadRequirements();
    const description = ensureDescription(detail,hero);
    const packagesHead = detail.querySelector('.r6-packages-head');
    const packagesGrid = detail.querySelector('.r6-package-grid');
    if (!packagesHead || !packagesGrid) return;
    const h = packagesHead.querySelector('h3');
    if (h) h.textContent = packageTitle(cat);

    detail.querySelector('.fs-manual-id-panel')?.remove();
    detail.querySelector('.fs-detail-service-note')?.remove();

    if (cat === ID_CATEGORY) {
      // Give Player Verify one animation frame to insert an official verification panel.
      try { window.FSPlayerVerify?.refresh?.(); } catch {}
      await new Promise((resolve) => requestAnimationFrame(resolve));
      let inputPanel = detail.querySelector('.fs-player-verify');
      if (!inputPanel) inputPanel = renderManualPanel(detail,game);
      if (inputPanel) hero.insertAdjacentElement('afterend',inputPanel);
      if (inputPanel) inputPanel.insertAdjacentElement('afterend',description);
      else hero.insertAdjacentElement('afterend',description);
      updatePackageGate(detail,game);
    } else {
      detail.querySelector('.fs-player-verify')?.remove();
      const note = ensureServiceNote(detail,cat);
      if (note) hero.insertAdjacentElement('afterend',note);
      if (note) note.insertAdjacentElement('afterend',description);
      else hero.insertAdjacentElement('afterend',description);
      updatePackageGate(detail,game);
    }

    // Keep order deterministic after other decorators add buttons asynchronously.
    description.insertAdjacentElement('afterend',packagesHead);
    packagesHead.insertAdjacentElement('afterend',packagesGrid);
  }

  function schedule() {
    if (state.scheduled) return;
    state.scheduled = true;
    requestAnimationFrame(() => decorateDetail().catch(() => { state.scheduled = false; }));
  }

  function gateClicks(event) {
    const target = event.target.closest?.('[data-add],[data-fs-buy-now]');
    if (!target) return;
    const detail = target.closest('.r6-game-detail');
    if (!detail || currentCategory() !== ID_CATEGORY) return;
    const game = currentGame(detail);
    const ready = updatePackageGate(detail,game);
    if (ready) {
      requestAnimationFrame(() => {
        try { window.FSPlayerVerify?.syncCartInputs?.(); } catch {}
        syncManualCartInputs(game);
      });
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const panel = detail.querySelector('.fs-player-verify,.fs-manual-id-panel');
    panel?.scrollIntoView?.({behavior:'smooth',block:'center'});
  }

  function install() {
    injectStyles();
    const catalog = document.getElementById('catalogList');
    if (catalog) new MutationObserver(schedule).observe(catalog,{childList:true,subtree:true});
    const cart = document.getElementById('cartItems');
    if (cart) new MutationObserver(() => {
      const detail = document.querySelector('#catalogList .r6-game-detail');
      const game = currentGame(detail);
      if (game) requestAnimationFrame(() => { try { window.FSPlayerVerify?.syncCartInputs?.(); } catch {}; syncManualCartInputs(game); });
    }).observe(cart,{childList:true,subtree:true});
    document.addEventListener('click',gateClicks,true);
    document.addEventListener('fs:player-verify-change',schedule);
    document.addEventListener('click',(event) => {
      if (event.target.closest?.('[data-r6-game],[data-r6-feature],[data-r6-back],[data-cat]')) schedule();
    },true);
    schedule();
  }

  window.FSDetailLayout = Object.freeze({ version:VERSION, refresh:schedule });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
