/* R170 — notificaciones Push de FRENCH STORE.
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

  function iosNeedsInstall(){
    const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone===true;
    return ios&&!standalone;
  }

  function setStatus(message,kind=''){
    const el=$('fsPushStatus');
    if(!el)return;
    el.textContent=message;
    el.className=`fs-push-status ${kind}`.trim();
  }

  function setControls(enabled){
    ['fsPushPurchaseExpiry','fsPushPassExpiry','fsPushSeasonal'].forEach(id=>{
      const el=$(id);if(el)el.disabled=!enabled;
    });
  }

  async function currentSubscription(){
    if(!supported())return null;
    const registration=await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
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
  }

  async function loadPreferences(){
    if(!currentSession?.user?.id){
      setControls(false);
      return {purchase_expiry:true,pass_expiry:true,seasonal_messages:false};
    }
    const {data,error}=await client
      .from('user_notification_preferences')
      .select('purchase_expiry,pass_expiry,seasonal_messages')
      .eq('user_id',currentSession.user.id)
      .maybeSingle();
    if(error)throw error;
    return data||{purchase_expiry:true,pass_expiry:true,seasonal_messages:false};
  }

  async function render(){
    const button=$('fsPushToggle');
    if(!button)return;

    if(!currentSession){
      button.disabled=true;
      button.textContent='Inicia sesión para activar';
      setControls(false);
      setStatus('Inicia sesión para administrar tus notificaciones.');
      return;
    }

    if(!supported()){
      button.disabled=true;
      button.textContent='No disponible';
      setControls(false);
      setStatus('Este navegador no admite notificaciones Push.','warn');
      return;
    }

    if(iosNeedsInstall()){
      button.disabled=true;
      button.textContent='Añade la app al inicio';
      setControls(false);
      setStatus('En iPhone/iPad, añade FRENCH STORE a la pantalla de inicio y ábrela desde ahí para activar notificaciones.','warn');
      return;
    }

    const [subscription,prefs]=await Promise.all([currentSubscription(),loadPreferences()]);
    if(subscription){
      await saveSubscription(subscription).catch(()=>{});
    }

    $('fsPushPurchaseExpiry').checked=prefs.purchase_expiry!==false;
    $('fsPushPassExpiry').checked=prefs.pass_expiry!==false;
    $('fsPushSeasonal').checked=prefs.seasonal_messages===true;

    const active=Boolean(subscription)&&Notification.permission==='granted';
    setControls(active);
    button.disabled=false;
    button.dataset.active=active?'1':'0';
    button.textContent=active?'🔔 Notificaciones activas':'🔔 Activar notificaciones';

    if(Notification.permission==='denied'){
      setControls(false);
      button.disabled=true;
      button.textContent='Notificaciones bloqueadas';
      setStatus('Las notificaciones están bloqueadas en el navegador. Puedes habilitarlas desde los permisos del sitio.','warn');
    }else if(active){
      setStatus('Te avisaremos de vencimientos según tus preferencias.','ok');
    }else{
      setStatus('Actívalas para recibir avisos aunque no tengas la tienda abierta.');
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
      setStatus('Notificaciones activadas correctamente.','ok');
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

  async function savePreferences(){
    if(!currentSession||busy)return;
    busy=true;
    try{
      const {error}=await client.rpc('storefront_set_notification_preferences',{
        p_purchase_expiry:$('fsPushPurchaseExpiry').checked,
        p_pass_expiry:$('fsPushPassExpiry').checked,
        p_seasonal_messages:$('fsPushSeasonal').checked
      });
      if(error)throw error;
      setStatus('Preferencias guardadas.','ok');
    }catch(error){
      setStatus(`No se pudieron guardar: ${text(error?.message||error).slice(0,120)}`,'warn');
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
        <div><b>Notificaciones</b><small>Vencimientos y avisos de FRENCH STORE</small></div>
      </div>
      <button id="fsPushToggle" class="fs-push-main-btn" type="button">🔔 Activar notificaciones</button>
      <div class="fs-push-options">
        <label><span><b>Vencimientos de compras</b><small>Streaming y membresías vinculadas a tus pedidos.</small></span><input id="fsPushPurchaseExpiry" type="checkbox" checked disabled></label>
        <label><span><b>French Pass</b><small>Te avisamos un día antes y el día que vence.</small></span><input id="fsPushPassExpiry" type="checkbox" checked disabled></label>
        <label><span><b>Saludos y eventos</b><small>Navidad, Año Nuevo y mensajes especiales. Opcional.</small></span><input id="fsPushSeasonal" type="checkbox" disabled></label>
      </div>
      <div id="fsPushStatus" class="fs-push-status" role="status" aria-live="polite">Preparando notificaciones…</div>`;

    panel.insertBefore(card,actions);
    $('fsPushToggle').addEventListener('click',async()=>{
      const active=$('fsPushToggle').dataset.active==='1';
      if(active)await disablePush();else await enablePush();
    });
    ['fsPushPurchaseExpiry','fsPushPassExpiry','fsPushSeasonal'].forEach(id=>{
      $(id).addEventListener('change',savePreferences);
    });
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
