/* R226 — notificaciones Push simples de FRENCH STORE.
   Una sola activación incluye vencimientos, French Pass y mensajes especiales.
   El permiso siempre se solicita desde una acción explícita del cliente. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const VAPID_PUBLIC_KEY='BE7hIaOapB_vJtzIWsV1-PVG4wUkSEhlpVzzWow-G7sPnpE9keUoqKiroHyqy4qZzxJbOvLRFmUBPpa5agv87w8';
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });

  const $=id=>document.getElementById(id);
  const text=v=>String(v??'').trim();
  let currentSession=null;
  let busy=false;

  function vapidKey(value){
    const padding='='.repeat((4-value.length%4)%4);
    const raw=(value+padding).replace(/-/g,'+').replace(/_/g,'/');
    const bin=atob(raw);
    return Uint8Array.from(bin,c=>c.charCodeAt(0));
  }

  function supported(){
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  function isIOS(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isStandalone(){
    return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone===true);
  }

  function iosNeedsInstall(){
    return isIOS()&&!isStandalone();
  }

  function setStatus(message,kind=''){
    const el=$('fsPushStatus');
    if(!el)return;
    el.textContent=message;
    el.className=`fs-push-status ${kind}`.trim();
  }

  function setInstallHint(){
    const el=$('fsPushInstallHint');
    if(!el)return;
    if(isIOS()){
      el.textContent=isStandalone()
        ? 'Ya la abriste como app. Puedes recibir avisos aunque FRENCH STORE esté cerrada.'
        : 'En iPhone/iPad necesitas añadir FRENCH STORE a la pantalla de inicio y abrirla desde ahí para activar avisos.';
      return;
    }
    el.textContent='En Android y computadora no necesitas instalar la app: puedes recibir avisos desde el navegador después de activarlos.';
  }

  async function currentSubscription(){
    if(!supported())return null;
    const registration=await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }

  async function enableAllPreferences(){
    const {error}=await client.rpc('storefront_set_notification_preferences',{
      p_purchase_expiry:true,
      p_pass_expiry:true,
      p_seasonal_messages:true
    });
    if(error)throw error;
  }

  async function saveSubscription(subscription){
    if(!currentSession?.user?.id)throw new Error('AUTH_REQUIRED');
    const json=subscription.toJSON();
    const {error}=await client.rpc('storefront_upsert_push_subscription',{
      p_endpoint:subscription.endpoint,
      p_p256dh:json?.keys?.p256dh||'',
      p_auth_secret:json?.keys?.auth||'',
      p_user_agent:navigator.userAgent||''
    });
    if(error)throw error;
    await enableAllPreferences();
  }

  async function render(){
    const button=$('fsPushToggle');
    if(!button)return;
    setInstallHint();

    if(!currentSession){
      button.disabled=true;
      button.dataset.active='0';
      button.textContent='Inicia sesión para activar';
      setStatus('Inicia sesión para activar las notificaciones de FRENCH STORE.');
      return;
    }

    if(!supported()){
      button.disabled=true;
      button.dataset.active='0';
      button.textContent='No disponible';
      setStatus('Este navegador no admite notificaciones Push.','warn');
      return;
    }

    if(iosNeedsInstall()){
      button.disabled=true;
      button.dataset.active='0';
      button.textContent='📲 Añade FRENCH STORE al inicio';
      setStatus('Apple requiere abrir FRENCH STORE desde la pantalla de inicio antes de poder activar notificaciones.','warn');
      return;
    }

    const subscription=await currentSubscription();
    if(subscription){
      await saveSubscription(subscription).catch(()=>{});
    }

    const active=Boolean(subscription)&&Notification.permission==='granted';
    button.disabled=false;
    button.dataset.active=active?'1':'0';
    button.textContent=active?'🔔 Notificaciones activas':'🔔 Activar notificaciones';

    if(Notification.permission==='denied'){
      button.disabled=true;
      button.textContent='Notificaciones bloqueadas';
      setStatus('Las notificaciones están bloqueadas. Puedes habilitarlas desde los permisos del navegador.','warn');
    }else if(active){
      setStatus('Listo. Recibirás vencimientos, avisos de French Pass y mensajes especiales aunque la tienda no esté abierta.','ok');
    }else{
      setStatus('Actívalas una sola vez. Todos los avisos de FRENCH STORE vienen incluidos.');
    }
  }

  async function enablePush(){
    if(busy||!currentSession)return;
    busy=true;
    try{
      const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
      if(permission!=='granted'){
        setStatus(permission==='denied'?'El permiso fue bloqueado. Puedes cambiarlo desde los permisos del navegador.':'No activamos notificaciones.','warn');
        return;
      }
      const registration=await navigator.serviceWorker.ready;
      let subscription=await registration.pushManager.getSubscription();
      if(!subscription){
        subscription=await registration.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:vapidKey(VAPID_PUBLIC_KEY)
        });
      }
      await saveSubscription(subscription);
      setStatus('Notificaciones activadas correctamente. Todo viene incluido.','ok');
      await render();
    }catch(error){
      setStatus(`No se pudieron activar: ${text(error?.message||error).slice(0,120)}`,'warn');
    }finally{
      busy=false;
    }
  }

  async function disablePush(){
    if(busy)return;
    busy=true;
    try{
      const subscription=await currentSubscription();
      if(subscription){
        await client.rpc('storefront_remove_push_subscription',{p_endpoint:subscription.endpoint}).catch(()=>{});
        await subscription.unsubscribe();
      }
      setStatus('Notificaciones desactivadas en este dispositivo.','ok');
      await render();
    }catch(error){
      setStatus(`No se pudieron desactivar: ${text(error?.message||error).slice(0,120)}`,'warn');
    }finally{
      busy=false;
    }
  }

  function installUi(){
    if($('fsPushCard'))return;
    const panel=document.querySelector('#view-perfil .profile-panel');
    const actions=panel?.querySelector('.profile-actions');
    if(!panel||!actions)return;

    const card=document.createElement('section');
    card.id='fsPushCard';
    card.className='fs-push-card';
    card.innerHTML=`
      <div class="fs-push-head">
        <span class="fs-push-icon" aria-hidden="true">🔔</span>
        <div><b>Notificaciones</b><small>Avisos de FRENCH STORE</small></div>
      </div>
      <p class="fs-push-copy">Al activarlas recibirás vencimientos de compras, avisos de French Pass y mensajes especiales. No tienes que elegir categorías: todo viene incluido.</p>
      <button id="fsPushToggle" class="fs-push-main-btn" type="button">🔔 Activar notificaciones</button>
      <div class="fs-push-install-note"><b>📲 ¿Hace falta instalar la app?</b><span id="fsPushInstallHint"></span></div>
      <div id="fsPushStatus" class="fs-push-status" role="status" aria-live="polite">Preparando notificaciones…</div>`;

    panel.insertBefore(card,actions);
    $('fsPushToggle').addEventListener('click',async()=>{
      const active=$('fsPushToggle').dataset.active==='1';
      if(active)await disablePush();else await enablePush();
    });
    setInstallHint();
  }

  async function refreshSession(){
    const {data}=await client.auth.getSession();
    currentSession=data?.session||null;
    if(!currentSession&&supported()){
      const stale=await currentSubscription().catch(()=>null);
      if(stale)await stale.unsubscribe().catch(()=>{});
    }
    await render().catch(()=>{});
  }

  async function boot(){
    installUi();
    await refreshSession();
    client.auth.onAuthStateChange((event,newSession)=>{
      currentSession=newSession||null;
      setTimeout(async()=>{
        if(event==='SIGNED_OUT'&&supported()){
          const stale=await currentSubscription().catch(()=>null);
          if(stale)await stale.unsubscribe().catch(()=>{});
        }
        await render().catch(()=>{});
      },0);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

/* R226 — loader visual progresivo para Google OAuth.
   Vive aquí para no tocar la lógica de autenticación ni el shell PWA. */
(() => {
  'use strict';

  let overlay=null;
  let safetyTimer=null;

  function oauthReturnPending(){
    try{
      const url=new URL(location.href);
      return url.searchParams.has('code') ||
        /(?:[#&](?:access_token|refresh_token|provider_token|type)=)/i.test(location.href);
    }catch{return false}
  }

  function ensureOverlay(){
    if(overlay?.isConnected)return overlay;
    const node=document.createElement('div');
    node.id='fsAuthLoading';
    node.className='fs-auth-loading';
    node.hidden=true;
    node.setAttribute('role','status');
    node.setAttribute('aria-live','polite');
    node.innerHTML=`
      <div class="fs-auth-loading-card">
        <div class="fs-auth-loading-mark" aria-hidden="true">
          <img class="fs-auth-loading-logo" src="/v2/assets/brand/icon-192.png" alt="" width="138" height="138" decoding="async">
        </div>
        <div class="fs-auth-loading-title">FRENCH STORE</div>
        <p id="fsAuthLoadingCopy" class="fs-auth-loading-copy">Conectando con Google…</p>
        <span class="fs-auth-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      </div>`;
    document.body.appendChild(node);
    overlay=node;
    return node;
  }

  function show(copy='Conectando con Google…'){
    try{
      const node=ensureOverlay();
      node.classList.remove('is-leaving');
      node.hidden=false;
      const label=document.getElementById('fsAuthLoadingCopy');
      if(label)label.textContent=copy;
      clearTimeout(safetyTimer);
      safetyTimer=setTimeout(()=>hide(),12000);
    }catch{}
  }

  function hide(){
    try{
      if(!overlay)return;
      clearTimeout(safetyTimer);
      overlay.classList.add('is-leaving');
      setTimeout(()=>{
        if(!overlay)return;
        overlay.hidden=true;
        overlay.classList.remove('is-leaving');
      },230);
    }catch{}
  }

  async function waitForReturnedSession(){
    if(!oauthReturnPending())return;
    show('Finalizando tu inicio de sesión…');
    for(let i=0;i<45;i+=1){
      try{
        if(typeof sb!=='undefined'&&sb?.auth){
          const {data}=await sb.auth.getSession();
          if(data?.session){hide();return}
        }
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,160));
    }
    hide();
  }

  function installAuthLoader(){
    document.addEventListener('click',(event)=>{
      const button=event.target?.closest?.('#authChoiceGoogle');
      if(button&&!button.disabled)show('Conectando con Google…');
    },true);

    const message=document.getElementById('loginMessage');
    if(message){
      new MutationObserver(()=>{
        if(!message.classList.contains('hidden')&&message.textContent.trim())hide();
      }).observe(message,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }

    window.addEventListener('pageshow',()=>{
      if(!oauthReturnPending())hide();
    });

    waitForReturnedSession().catch(()=>hide());
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installAuthLoader,{once:true});
  else installAuthLoader();
})();
