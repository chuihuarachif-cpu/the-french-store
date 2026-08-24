/* THE FRENCH STORE — Category Detail Layout v2
   Presentation + customer-input gate only. No provider purchase code lives here.
   Automatic/verifiable Recargas por ID fail closed until server verification succeeds.
   Manual-only Recargas por ID keep the assisted input flow.
   Other categories keep their existing purchase behavior and remain visually distinct. */
(() => {
  'use strict';

  const VERSION='detail-layout-v2-20260824-verified';
  const ID_CATEGORY='Recargas por ID';
  const MANUAL_PREFIX='[MANUAL_ONLY]';
  const state={loaded:false,loading:null,byProduct:new Map(),manualValues:new Map(),scheduled:false,packageObserver:null};
  const text=(v)=>String(v??'').trim();
  const html=(v)=>text(v).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm=(v)=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');

  function loadCss(){if(document.getElementById('fs-detail-layout-v2-css'))return;const link=document.createElement('link');link.id='fs-detail-layout-v2-css';link.rel='stylesheet';link.href='./detail-layout-v2.css?v=20260824-2';document.head.appendChild(link)}
  function cat(){try{return typeof category!=='undefined'?text(category):''}catch{return''}}
  function productGame(p){try{return typeof canonicalGame==='function'?canonicalGame(p?.juego):text(p?.juego)}catch{return text(p?.juego)}}
  function gameOf(detail){return text(detail?.dataset.fsGame||detail?.querySelector('.r6-hero-copy h3')?.textContent||detail?.querySelector('.fs-detail-description h3')?.textContent)}
  function productsFor(game,categoryName){try{return(Array.isArray(inventory)?inventory:[]).filter(p=>p?.activo===true&&text(p?.categoria)===categoryName&&productGame(p)===game)}catch{return[]}}
  function placeAfter(reference,node){if(!reference||!node)return;if(reference.nextElementSibling!==node)reference.insertAdjacentElement('afterend',node)}

  async function loadRequirements(force=false){
    if(state.loaded&&!force)return true;if(state.loading&&!force)return state.loading;
    state.loading=(async()=>{try{const{data,error}=await sb.from('checkout_input_requirements').select('product_id,field_key,label,input_type,required,min_length,max_length,placeholder,help_text,options,sort_order').eq('active',true).order('product_id',{ascending:true}).order('sort_order',{ascending:true});if(error)throw error;const map=new Map();(data||[]).forEach(row=>{const id=Number(row.product_id);if(!Number.isSafeInteger(id))return;if(!map.has(id))map.set(id,[]);const raw=text(row.help_text);map.get(id).push({key:text(row.field_key),label:text(row.label)||text(row.field_key),inputType:text(row.input_type)||'text',required:row.required===true,minLength:Math.max(0,Number(row.min_length||0)),maxLength:Math.min(200,Math.max(1,Number(row.max_length||80))),placeholder:text(row.placeholder),helpText:raw.startsWith(MANUAL_PREFIX)?raw.slice(MANUAL_PREFIX.length).trim():raw,manualOnly:raw.startsWith(MANUAL_PREFIX),options:Array.isArray(row.options)?row.options:[],sortOrder:Number(row.sort_order||0)});});state.byProduct=map;state.loaded=true;return true}catch{state.loaded=false;return false}finally{state.loading=null}})();return state.loading;
  }

  function requirementsForGame(game){const unique=new Map();productsFor(game,ID_CATEGORY).forEach(p=>(state.byProduct.get(Number(p.id))||[]).forEach(req=>{const old=unique.get(req.key);if(!old||(old.manualOnly&&!req.manualOnly))unique.set(req.key,req)}));return[...unique.values()].sort((a,b)=>a.sortOrder-b.sortOrder||a.key.localeCompare(b.key))}
  function hasAutomaticRequirements(game){return requirementsForGame(game).some(req=>req.manualOnly!==true)}
  function optionParts(o){if(typeof o==='string')return{value:o,label:o};if(o&&typeof o==='object'){const value=text(o.value??o.label);return{value,label:text(o.label??o.value)||value}}return{value:'',label:''}}
  function manualValid(game){const reqs=requirementsForGame(game);if(!state.loaded||!reqs.length||reqs.some(req=>req.manualOnly!==true))return false;const values=state.manualValues.get(norm(game))||{};for(const req of reqs){const value=text(values[req.key]);if(req.required&&!value)return false;if(value&&(value.length<req.minLength||value.length>req.maxLength))return false;const options=req.options.map(optionParts).filter(o=>o.value);if(value&&options.length&&!options.some(o=>o.value===value))return false}return true}

  function fieldMarkup(scope,req){const values=state.manualValues.get(scope)||{},value=text(values[req.key]),id=`fs-manual-${scope}-${norm(req.key)}`,options=req.options.map(optionParts).filter(o=>o.value);let control;if(req.inputType==='select'&&options.length)control=`<select id="${html(id)}" data-fs-manual-key="${html(req.key)}"><option value="">Selecciona una opción</option>${options.map(o=>`<option value="${html(o.value)}" ${o.value===value?'selected':''}>${html(o.label)}</option>`).join('')}</select>`;else control=`<input id="${html(id)}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${req.maxLength}" value="${html(value)}" placeholder="${html(req.placeholder)}" data-fs-manual-key="${html(req.key)}">`;return`<label class="fs-manual-id-field" for="${html(id)}"><span>${html(req.label)}${req.required?' *':''}</span>${control}${req.helpText?`<small>${html(req.helpText)}</small>`:''}</label>`}

  function syncManualCartInputs(game){const scope=norm(game),values=state.manualValues.get(scope)||{},box=document.getElementById('fulfillmentInputs');if(!box)return;box.querySelectorAll('[data-fs-scope][data-fs-key]').forEach(c=>{if(text(c.dataset.fsScope)!==scope)return;const value=text(values[text(c.dataset.fsKey)]);if(!value||text(c.value)===value)return;c.value=value;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}))})}

  function renderManualPanel(detail,game){const reqs=requirementsForGame(game);if(!reqs.length||reqs.some(req=>req.manualOnly!==true))return null;const scope=norm(game),sig=reqs.map(r=>`${r.key}:${r.required?1:0}:${r.inputType}`).join('|');let panel=detail.querySelector('.fs-manual-id-panel');if(panel&&panel.dataset.fsManualGame===game&&panel.dataset.fsRequirementSignature===sig)return panel;if(panel)panel.remove();panel=document.createElement('section');panel.className='fs-manual-id-panel';panel.dataset.fsManualGame=game;panel.dataset.fsRequirementSignature=sig;panel.innerHTML=`<div class="fs-manual-id-head"><span class="fs-manual-id-step">1</span><div><b>Ingresa los datos de tu recarga</b><small>Completa el ID exacto y el servidor/región solo cuando el juego lo requiera. Este producto se procesa de forma asistida; nunca pediremos contraseña.</small></div></div><div class="fs-manual-id-fields">${reqs.map(r=>fieldMarkup(scope,r)).join('')}</div><p class="fs-manual-id-status" role="status"></p>`;const update=()=>{if(!state.manualValues.has(scope))state.manualValues.set(scope,{});panel.querySelectorAll('[data-fs-manual-key]').forEach(c=>{state.manualValues.get(scope)[text(c.dataset.fsManualKey)]=String(c.value??'')});const ready=manualValid(game);panel.classList.toggle('ready',ready);const status=panel.querySelector('.fs-manual-id-status');if(status)status.textContent=ready?'✓ Datos completos. Ya puedes seleccionar un paquete.':'Completa los datos obligatorios para habilitar los paquetes.';updateGate(detail,game);if(ready)syncManualCartInputs(game)};panel.querySelectorAll('[data-fs-manual-key]').forEach(c=>{c.addEventListener('input',update);c.addEventListener('change',update)});update();return panel}

  function noticeData(categoryName){if(categoryName==='Recargas por Cuenta')return{icon:'👤',title:'Recarga por cuenta · atención asistida',body:'Selecciona la opción que necesitas. Nunca escribas aquí contraseñas, códigos de acceso ni credenciales de tu cuenta.'};if(categoryName==='Streaming')return{icon:'📺',title:'Streaming · activación asistida',body:'El precio mostrado es el vigente en FRENCH STORE. La entrega o activación se coordina de forma segura cuando corresponda.'};if(categoryName==='Gift Cards')return{icon:'🎁',title:'Código digital · entrega manual',body:'Revisa marca, denominación y región antes de comprar. Los códigos Gift Card se entregan manualmente y permanecen separados de las recargas.'};return null}
  function ensureNotice(detail,categoryName){const data=noticeData(categoryName);let note=detail.querySelector('.fs-detail-service-note');if(!data){note?.remove();return null}if(note&&note.dataset.fsCategory===categoryName)return note;note?.remove();note=document.createElement('section');note.className='fs-detail-service-note';note.dataset.fsCategory=categoryName;note.innerHTML=`<span class="fs-detail-note-icon" aria-hidden="true">${data.icon}</span><div><b>${html(data.title)}</b><p>${html(data.body)}</p></div>`;return note}
  function heading(categoryName){return categoryName===ID_CATEGORY?'Paquetes y precios':categoryName==='Recargas por Cuenta'?'Opciones disponibles':categoryName==='Streaming'?'Planes disponibles':categoryName==='Gift Cards'?'Denominaciones disponibles':'Opciones disponibles'}
  function ensureDescription(detail,hero){let wrap=detail.querySelector('.fs-detail-description');if(!wrap){wrap=document.createElement('section');wrap.className='fs-detail-description'}const copy=hero.querySelector('.r6-hero-copy')||wrap.querySelector('.r6-hero-copy');if(copy&&copy.parentNode!==wrap)wrap.appendChild(copy);return wrap}

  function setLocked(card,locked){card.classList.toggle('fs-id-locked',locked);let lock=card.querySelector('.fs-package-lock');if(locked&&!lock){lock=document.createElement('span');lock.className='fs-package-lock';lock.setAttribute('aria-label','Paquete bloqueado hasta verificar el ID');lock.textContent='🔒';card.appendChild(lock)}if(!locked&&lock)lock.remove();card.querySelectorAll('[data-add],[data-fs-buy-now]').forEach(btn=>{btn.disabled=locked;btn.setAttribute('aria-disabled',locked?'true':'false')})}
  function updateGate(detail,game){if(cat()!==ID_CATEGORY){detail.querySelectorAll('.r6-package-card').forEach(card=>setLocked(card,false));return true}const needsVerification=hasAutomaticRequirements(game);const verified=Boolean(window.FSPlayerVerify?.verifiedForGame?.(game));const ready=needsVerification?verified:manualValid(game);detail.querySelectorAll('.r6-package-card').forEach(card=>setLocked(card,!ready));const meta=detail.querySelector('.r6-packages-head>span');if(meta){meta.classList.add('fs-package-gate-note');meta.classList.toggle('ready',ready);const wanted=ready?'✓ ID verificado · paquetes habilitados':needsVerification?'🔒 Verifica tu ID para habilitar':'🔒 Completa tu ID para habilitar';if(text(meta.textContent)!==wanted)meta.textContent=wanted}return ready}

  function watchPackages(detail,game){state.packageObserver?.disconnect();const grid=detail.querySelector('.r6-package-grid');if(!grid)return;state.packageObserver=new MutationObserver(()=>updateGate(detail,game));state.packageObserver.observe(grid,{childList:true,subtree:true})}

  async function decorate(){
    state.scheduled=false;loadCss();const detail=document.querySelector('#catalogList .r6-game-detail');if(!detail)return;const categoryName=cat(),hero=detail.querySelector('.r6-hero');if(!hero)return;const game=gameOf(detail);if(!game)return;detail.dataset.fsGame=game;detail.dataset.fsCategory=categoryName;detail.classList.add('fs-detail-v2');hero.classList.add('fs-wide-hero');await loadRequirements();
    const description=ensureDescription(detail,hero),head=detail.querySelector('.r6-packages-head'),grid=detail.querySelector('.r6-package-grid');if(!head||!grid)return;const title=head.querySelector('h3'),wantedTitle=heading(categoryName);if(title&&text(title.textContent)!==wantedTitle)title.textContent=wantedTitle;

    if(categoryName===ID_CATEGORY){
      detail.querySelector('.fs-detail-service-note')?.remove();
      const needsVerification=hasAutomaticRequirements(game);
      if(needsVerification){
        detail.querySelector('.fs-manual-id-panel')?.remove();
        if(!detail.querySelector('.fs-player-verify')){
          try{await window.FSPlayerVerify?.reloadRequirements?.()}catch{}
          try{window.FSPlayerVerify?.refresh?.()}catch{}
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
      }
      let input=detail.querySelector('.fs-player-verify');
      if(!needsVerification){input=renderManualPanel(detail,game)}
      if(input){placeAfter(hero,input);placeAfter(input,description)}else placeAfter(hero,description);
      updateGate(detail,game);
    }else{
      delete detail.dataset.fsVerifyRequested;detail.querySelector('.fs-player-verify')?.remove();detail.querySelector('.fs-manual-id-panel')?.remove();const note=ensureNotice(detail,categoryName);if(note){placeAfter(hero,note);placeAfter(note,description)}else placeAfter(hero,description);updateGate(detail,game);
    }
    placeAfter(description,head);placeAfter(head,grid);watchPackages(detail,game);
  }

  function schedule(){if(state.scheduled)return;state.scheduled=true;requestAnimationFrame(()=>decorate().catch(()=>{state.scheduled=false}))}
  function gateClick(event){const target=event.target.closest?.('[data-add],[data-fs-buy-now]');if(!target)return;const detail=target.closest('.r6-game-detail');if(!detail||cat()!==ID_CATEGORY)return;const game=gameOf(detail);if(updateGate(detail,game)){requestAnimationFrame(()=>{try{window.FSPlayerVerify?.syncCartInputs?.()}catch{};syncManualCartInputs(game)});return}event.preventDefault();event.stopImmediatePropagation();detail.querySelector('.fs-player-verify,.fs-manual-id-panel')?.scrollIntoView?.({behavior:'smooth',block:'center'})}

  function install(){loadCss();const catalog=document.getElementById('catalogList');if(catalog)new MutationObserver(schedule).observe(catalog,{childList:true,subtree:false});const cart=document.getElementById('cartItems');if(cart)new MutationObserver(()=>{const detail=document.querySelector('#catalogList .r6-game-detail'),game=gameOf(detail);if(game)requestAnimationFrame(()=>{try{window.FSPlayerVerify?.syncCartInputs?.()}catch{};syncManualCartInputs(game)})}).observe(cart,{childList:true,subtree:true});document.addEventListener('click',gateClick,true);document.addEventListener('fs:player-verify-change',schedule);document.addEventListener('click',e=>{if(e.target.closest?.('[data-r6-game],[data-r6-feature],[data-r6-back],[data-cat]'))schedule()},true);schedule()}
  window.FSDetailLayout=Object.freeze({version:VERSION,refresh:schedule});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
