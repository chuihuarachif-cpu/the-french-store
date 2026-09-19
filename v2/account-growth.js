/* R172 — customer growth center: reseller self-service + referrals.
   Sensitive economics stay in server-side RPCs. */
(() => {
  'use strict';

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=value=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  let installed=false;
  let loading=false;

  function productName(id){
    try{
      const p=Array.isArray(inventory)?inventory.find(row=>String(row.id)===String(id)):null;
      return p?`${canonicalGame(p.juego)} · ${p.paquete}`:`Producto #${id}`;
    }catch{return `Producto #${id}`}
  }

  function ensureUi(){
    if(installed)return true;
    const panel=document.querySelector('#view-perfil .profile-panel');
    const actions=panel?.querySelector('.profile-actions');
    if(!panel||!actions)return false;
    installed=true;

    const host=document.createElement('div');
    host.id='fsGrowthCenter';
    host.className='fs-growth-stack';
    host.innerHTML=`
      <section id="fsResellerSelfCard" class="fs-growth-card" hidden>
        <div class="fs-growth-head"><div><b>💎 Mi panel de revendedor</b><small>Tu progreso y tus precios, sin exponer costos internos.</small></div><span id="fsResellerRank" class="fs-growth-badge">—</span></div>
        <div id="fsResellerMetrics" class="fs-growth-metrics"></div>
        <div id="fsResellerSavings" class="fs-reseller-savings"></div>
      </section>
      <section id="fsReferralCard" class="fs-growth-card" hidden>
        <div class="fs-growth-head"><div><b>🎁 Invita y gana French Points</b><small>El premio se acredita cuando la primera compra válida del referido queda entregada.</small></div><span class="fs-growth-badge">REFERIDOS</span></div>
        <div id="fsReferralMetrics" class="fs-growth-metrics"></div>
        <div class="fs-referral-row">
          <div id="fsReferralCode" class="fs-referral-code">—</div>
          <button id="fsReferralCopy" type="button" class="secondary-btn">Copiar enlace</button>
        </div>
        <div id="fsReferralStatus" class="fs-growth-status" role="status" aria-live="polite"></div>
      </section>`;
    panel.insertBefore(host,actions);
    $('fsReferralCopy')?.addEventListener('click',copyReferral);
    return true;
  }

  async function rpc(name,args={}){
    const {data,error}=await sb.rpc(name,args);
    if(error)throw error;
    return data;
  }

  function renderReseller(summary,prices){
    const card=$('fsResellerSelfCard');
    if(!card)return;
    if(!summary?.is_reseller){card.hidden=true;return}
    card.hidden=false;
    $('fsResellerRank').textContent=`${summary.rank_name||'Bronce'} · #${String(summary.reseller_number||0).padStart(4,'0')}`;
    const target=summary.next_level_target==null?'Nivel máximo':money(summary.next_level_target);
    $('fsResellerMetrics').innerHTML=[
      ['Compras del mes',money(summary.month_spend)],
      ['Pedidos',String(summary.order_count||0)],
      ['Ahorro registrado',money(summary.tracked_savings)],
      ['Para siguiente nivel',summary.next_level_target==null?'—':money(summary.remaining_to_next)]
    ].map(([label,value])=>`<div class="fs-growth-metric"><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join('');

    const best=(Array.isArray(prices)?prices:[]).filter(row=>Number(row.savings)>0).slice(0,5);
    $('fsResellerSavings').innerHTML=best.length
      ? '<b>Productos donde más ahorras ahora</b>'+best.map(row=>`<div class="fs-reseller-saving"><span>${esc(productName(row.product_id))}</span><span><s>${esc(money(row.regular_price))}</s> <b>${esc(money(row.my_price))}</b> · ahorras ${esc(money(row.savings))}</span></div>`).join('')
      : '<small>Tus precios especiales se aplican automáticamente en el catálogo cuando corresponda.</small>';
  }

  function renderReferral(state){
    const card=$('fsReferralCard');
    if(!card)return;
    if(!state?.active){card.hidden=true;return}
    card.hidden=false;
    $('fsReferralCode').textContent=state.code||'Código aún no generado';
    const copyButton=$('fsReferralCopy');
    if(copyButton)copyButton.textContent=state.code?'Copiar enlace':'Generar enlace';
    $('fsReferralMetrics').innerHTML=[
      ['Premio máximo',`Hasta ${Number(state.reward_points_max||0).toLocaleString('es-BO')} pts`],
      ['Compra mínima',money(state.qualifying_min_total)],
      ['Pendientes',String(state.pending_count||0)],
      ['Calificados',String(state.qualified_count||0)]
    ].map(([label,value])=>`<div class="fs-growth-metric"><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join('');
    const hours=Number(state.hold_hours||0);
    const days=Math.round(hours/24);
    const status=$('fsReferralStatus');
    if(status&&!status.textContent.trim()){
      const share=Math.round(Number(state.reward_margin_share||0)*100);
      status.textContent=`El código debe aplicarse antes de la primera compra pagada. El premio se limita al ${share}% del margen elegible, nunca supera el máximo mostrado y queda en espera ${days} día${days===1?'':'s'} por seguridad.`;
    }
  }

  function referralLink(){
    const code=$('fsReferralCode')?.textContent?.trim();
    if(!code||code==='—'||code==='Código aún no generado')return '';
    const url=new URL('/v2/',location.origin);
    url.searchParams.set('ref',code);
    return url.href;
  }

  async function copyReferral(){
    const status=$('fsReferralStatus');
    let link=referralLink();
    if(!link){
      try{
        const code=await rpc('ensure_my_referral_code');
        if(!code)throw new Error('REFERRAL_CODE_NOT_CREATED');
        $('fsReferralCode').textContent=String(code);
        const button=$('fsReferralCopy');
        if(button)button.textContent='Copiar enlace';
        link=referralLink();
      }catch{
        if(status)status.textContent='No se pudo generar el enlace de referido.';
        return;
      }
    }
    try{
      await navigator.clipboard.writeText(link);
      if(status)status.textContent='Enlace de referido copiado.';
    }catch{
      if(status)status.textContent=`Tu enlace: ${link}`;
    }
  }

  async function claimPendingReferral(){
    let code='';
    try{code=String(localStorage.getItem('fs_pending_referral')||'').trim().toUpperCase()}catch{}
    if(!code)return;
    const status=$('fsReferralStatus');
    try{
      const data=await rpc('claim_referral_code',{p_code:code});
      try{localStorage.removeItem('fs_pending_referral')}catch{}
      if(status)status.textContent=data?.already_claimed
        ? 'Ya tenías un referido vinculado en tu cuenta.'
        : 'Código de referido aplicado. Se validará con tu primera compra entregada.';
    }catch(error){
      const msg=String(error?.message||'');
      const permanent=['INVALID_REFERRAL_CODE','SELF_REFERRAL_NOT_ALLOWED','REFERRAL_MUST_BE_CLAIMED_BEFORE_FIRST_ORDER','REFERRALS_DISABLED']
        .some(key=>msg.includes(key));
      if(permanent){try{localStorage.removeItem('fs_pending_referral')}catch{}}
      const map={
        INVALID_REFERRAL_CODE:'El código de referido ya no es válido.',
        SELF_REFERRAL_NOT_ALLOWED:'No puedes usar tu propio código de referido.',
        REFERRAL_MUST_BE_CLAIMED_BEFORE_FIRST_ORDER:'El código de referido solo puede aplicarse antes del primer pedido.',
        REFERRALS_DISABLED:'El programa de referidos no está disponible en este momento.'
      };
      const key=Object.keys(map).find(k=>msg.includes(k));
      if(status)status.textContent=map[key]||'No se pudo validar el código de referido.';
    }
  }

  async function load(){
    if(loading||!ensureUi())return;
    loading=true;
    try{
      const {data}=await sb.auth.getSession();
      if(!data?.session){
        $('fsResellerSelfCard').hidden=true;
        $('fsReferralCard').hidden=true;
        return;
      }
      const [reseller,prices,referral]=await Promise.all([
        rpc('get_my_reseller_dashboard').catch(()=>({is_reseller:false})),
        rpc('get_my_reseller_prices').catch(()=>[]),
        rpc('get_my_referral_state').catch(()=>({active:false}))
      ]);
      renderReseller(reseller,prices);
      renderReferral(referral);
      await claimPendingReferral();
    }finally{loading=false}
  }

  function boot(){
    ensureUi();
    load().catch(()=>{});
    try{
      sb.auth.onAuthStateChange((_event,newSession)=>{
        setTimeout(()=>{
          if(newSession)load().catch(()=>{});
          else{
            if($('fsResellerSelfCard'))$('fsResellerSelfCard').hidden=true;
            if($('fsReferralCard'))$('fsReferralCard').hidden=true;
          }
        },0);
      });
    }catch{}
    document.querySelector('[data-nav="perfil"]')?.addEventListener('click',()=>setTimeout(()=>load().catch(()=>{}),0));
  }

  window.FSAccountGrowth=Object.freeze({reload:load});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();