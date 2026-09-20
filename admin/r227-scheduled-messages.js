/* FRENCH STORE — private scheduled-message admin.
   Replaces the retired date/event calendar with morning/night Push messages. */
(() => {
  'use strict';

  const URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJqaXZhYXJpcHVnamRweGp2am5zdSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg1NjQ2NzMyLCJleHAiOjIxMDEyMjI3MzJ9.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const client=window.supabase.createClient(URL,ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const pad=n=>String(n||'').padStart(2,'0');

  let messages=[];
  let editingId=null;

  async function rpc(name,args={}){
    const {data,error}=await client.rpc(name,args);
    if(error)throw error;
    return data;
  }

  function toast(message){
    const el=$('toast');
    if(!el)return;
    el.textContent=message;
    el.classList.remove('hidden');
    setTimeout(()=>el.classList.add('hidden'),3200);
  }

  function dateLabel(item){
    if(item.recurrence==='ANNUAL_FIXED')return pad(item.anchor_day)+'/'+pad(item.anchor_month)+' · cada año';
    return String(item.one_off_start||'').slice(0,10)||'Sin fecha';
  }

  function ensureUi(){
    if($('messageSchedulePanel'))return;
    const nav=document.querySelector('.tabs');
    const app=$('appView');
    if(!nav||!app)return;

    const button=document.createElement('button');
    button.type='button';
    button.dataset.tab='messages';
    button.textContent='💬 Mensajes';
    nav.appendChild(button);

    const html=[
      '<section id="messageSchedulePanel" class="panel hidden" data-panel="messages">',
      '<div class="panel-head"><div><span class="eyebrow">MENSAJES PROGRAMADOS</span><h2>Saludos y mensajes especiales</h2><p>Los mensajes predeterminados salen únicamente en la fecha indicada: una vez por la mañana y una vez por la noche. También puedes crear mensajes personalizados para un día concreto.</p></div><button id="messageScheduleRefresh" class="icon-btn" type="button" aria-label="Actualizar">↻</button></div>',
      '<div class="message-schedule-summary">',
      '<div><b>☀️ Mañana</b><small>Envío automático alrededor de las 09:10, hora de Bolivia.</small></div>',
      '<div><b>🌙 Noche</b><small>Segundo envío alrededor de las 19:10, hora de Bolivia.</small></div>',
      '<div><b>🎄 Fechas dobles</b><small>Nochebuena + Navidad y 31 de diciembre + Año Nuevo están separados en dos días. El resto usa solo su fecha.</small></div>',
      '</div>',
      '<div class="message-help"><b>Sin calendario de decoraciones.</b> Esta sección ya no programa cambios visuales. Solo administra los mensajes Push que reciben los clientes que activaron Notificaciones.</div>',
      '<article class="card custom-message-card"><b>+ Nuevo mensaje personalizado</b><div class="form-grid">',
      '<label><span>Nombre interno</span><input id="customMessageName" maxlength="120" placeholder="Ej. Promo especial del sábado"></label>',
      '<label><span>Día de envío</span><input id="customMessageDate" type="date"></label>',
      '<label><span>Título de la mañana</span><input id="customMorningTitle" maxlength="120" placeholder="☀️ Buenos días"></label>',
      '<label><span>Título de la noche</span><input id="customEveningTitle" maxlength="120" placeholder="🌙 Buenas noches"></label>',
      '<label class="wide"><span>Mensaje de la mañana</span><textarea id="customMorningBody" rows="3" maxlength="300"></textarea></label>',
      '<label class="wide"><span>Mensaje de la noche</span><textarea id="customEveningBody" rows="3" maxlength="300"></textarea></label>',
      '<label class="wide"><span>Destino al tocar la notificación</span><input id="customTargetUrl" maxlength="300" value="/v2/" placeholder="/v2/"></label>',
      '</div><div class="card-actions"><button id="customMessageSave" class="primary" type="button">Programar mensaje</button></div></article>',
      '<div class="message-schedule-grid"><div><div id="messageScheduleList" class="message-schedule-list"></div></div>',
      '<article id="messageEditor" class="card message-editor hidden"><b id="messageEditorTitle">Editar mensaje</b><div id="messageEditorMeta" class="message-editor-meta"></div><div class="form-grid">',
      '<label><span>Estado</span><select id="messageEnabled"><option value="1">Activo</option><option value="0">Desactivado</option></select></label>',
      '<label><span>Destino</span><input id="messageTargetUrl" maxlength="300" value="/v2/"></label>',
      '<label class="wide"><span>Título de la mañana</span><input id="messageMorningTitle" maxlength="120"></label>',
      '<label class="wide"><span>Mensaje de la mañana</span><textarea id="messageMorningBody" rows="3" maxlength="300"></textarea></label>',
      '<label class="wide"><span>Título de la noche</span><input id="messageEveningTitle" maxlength="120"></label>',
      '<label class="wide"><span>Mensaje de la noche</span><textarea id="messageEveningBody" rows="3" maxlength="300"></textarea></label>',
      '</div><div class="card-actions"><button id="messageUpdate" class="primary" type="button">Guardar cambios</button><button id="messageEditorClose" type="button">Cerrar</button></div></article></div>',
      '</section>'
    ].join('');
    app.insertAdjacentHTML('beforeend',html);

    button.addEventListener('click',()=>openPanel(button));
    $('messageScheduleRefresh').onclick=load;
    $('customMessageSave').onclick=createCustom;
    $('messageUpdate').onclick=updateEditing;
    $('messageEditorClose').onclick=closeEditor;
  }

  async function openPanel(button){
    document.querySelectorAll('[data-tab]').forEach(node=>node.classList.toggle('active',node===button));
    document.querySelectorAll('[data-panel]').forEach(panel=>panel.classList.toggle('hidden',panel.id!=='messageSchedulePanel'));
    await load();
  }

  async function load(){
    try{
      const allowed=await rpc('admin_app_is_allowed');
      if(allowed!==true)throw new Error('ADMIN_APP_FORBIDDEN');
      const data=await rpc('admin_app_list_scheduled_messages');
      messages=Array.isArray(data)?data:[];
      renderList();
      if(editingId&&!messages.some(item=>Number(item.id)===editingId))closeEditor();
    }catch(error){
      toast(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudieron cargar los mensajes.');
    }
  }

  function renderList(){
    const host=$('messageScheduleList');
    if(!host)return;
    if(!messages.length){
      host.innerHTML='<article class="card"><small>No hay mensajes configurados.</small></article>';
      return;
    }
    host.innerHTML=messages.map(item=>{
      const kind=item.is_preset?'preset':'custom';
      const kindText=item.is_preset?'PREDETERMINADO':'PERSONALIZADO';
      const remove=item.is_preset?'':'<button class="danger-btn" type="button" data-message-delete="'+item.id+'">Eliminar</button>';
      return '<article class="message-schedule-card '+(item.enabled?'':'is-off')+'">'+
        '<div class="message-schedule-top"><div><b>'+esc(item.name)+'</b><small>'+esc(dateLabel(item))+' · '+(item.enabled?'Activo':'Desactivado')+'</small></div>'+
        '<span class="message-schedule-badge '+kind+'">'+kindText+'</span></div>'+
        '<div class="message-preview">'+
          '<div><span>☀️ MAÑANA</span><b>'+esc(item.morning_title||'—')+'</b><p>'+esc(item.morning_body||'—')+'</p></div>'+
          '<div><span>🌙 NOCHE</span><b>'+esc(item.evening_title||'—')+'</b><p>'+esc(item.evening_body||'—')+'</p></div>'+
        '</div>'+
        '<div class="message-actions"><button type="button" data-message-edit="'+item.id+'">Editar texto</button>'+
        '<button type="button" data-message-toggle="'+item.id+'">'+(item.enabled?'Desactivar':'Activar')+'</button>'+remove+'</div></article>';
    }).join('');

    host.querySelectorAll('[data-message-edit]').forEach(button=>button.onclick=()=>edit(Number(button.dataset.messageEdit)));
    host.querySelectorAll('[data-message-toggle]').forEach(button=>button.onclick=()=>toggle(Number(button.dataset.messageToggle)));
    host.querySelectorAll('[data-message-delete]').forEach(button=>button.onclick=()=>removeCustom(Number(button.dataset.messageDelete)));
  }

  function edit(id){
    const item=messages.find(entry=>Number(entry.id)===id);
    if(!item)return;
    editingId=id;
    $('messageEditor').classList.remove('hidden');
    $('messageEditorTitle').textContent='Editar: '+item.name;
    $('messageEditorMeta').textContent=dateLabel(item)+' · La fecha no se cambia aquí; los predeterminados conservan su día y los personalizados se pueden borrar y volver a crear.';
    $('messageEnabled').value=item.enabled?'1':'0';
    $('messageTargetUrl').value=item.target_url||'/v2/';
    $('messageMorningTitle').value=item.morning_title||'';
    $('messageMorningBody').value=item.morning_body||'';
    $('messageEveningTitle').value=item.evening_title||'';
    $('messageEveningBody').value=item.evening_body||'';
    $('messageEditor').scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function closeEditor(){
    editingId=null;
    const editor=$('messageEditor');
    if(editor)editor.classList.add('hidden');
  }

  function editingPayload(item,enabled){
    return {
      p_id:Number(item.id),
      p_enabled:enabled,
      p_morning_title:item.morning_title||'',
      p_morning_body:item.morning_body||'',
      p_evening_title:item.evening_title||'',
      p_evening_body:item.evening_body||'',
      p_target_url:item.target_url||'/v2/'
    };
  }

  async function toggle(id){
    const item=messages.find(entry=>Number(entry.id)===id);
    if(!item)return;
    try{
      await rpc('admin_app_update_scheduled_message',editingPayload(item,!item.enabled));
      toast(item.enabled?'Mensaje desactivado.':'Mensaje activado.');
      await load();
    }catch(error){toast(String(error?.message||'No se pudo cambiar el estado.').slice(0,140))}
  }

  async function updateEditing(){
    const item=messages.find(entry=>Number(entry.id)===editingId);
    if(!item)return;
    const args={
      p_id:Number(item.id),
      p_enabled:$('messageEnabled').value==='1',
      p_morning_title:$('messageMorningTitle').value.trim(),
      p_morning_body:$('messageMorningBody').value.trim(),
      p_evening_title:$('messageEveningTitle').value.trim(),
      p_evening_body:$('messageEveningBody').value.trim(),
      p_target_url:$('messageTargetUrl').value.trim()||'/v2/'
    };
    try{
      await rpc('admin_app_update_scheduled_message',args);
      toast('Mensaje actualizado.');
      await load();
      edit(Number(item.id));
    }catch(error){toast(String(error?.message||'No se pudo guardar el mensaje.').slice(0,140))}
  }

  async function createCustom(){
    const name=$('customMessageName').value.trim();
    const date=$('customMessageDate').value;
    if(name.length<2)return toast('Escribe un nombre para el mensaje.');
    if(!date)return toast('Elige el día del mensaje.');
    try{
      await rpc('admin_app_create_custom_message',{
        p_name:name,
        p_date:date,
        p_morning_title:$('customMorningTitle').value.trim(),
        p_morning_body:$('customMorningBody').value.trim(),
        p_evening_title:$('customEveningTitle').value.trim(),
        p_evening_body:$('customEveningBody').value.trim(),
        p_target_url:$('customTargetUrl').value.trim()||'/v2/'
      });
      ['customMessageName','customMessageDate','customMorningTitle','customMorningBody','customEveningTitle','customEveningBody'].forEach(id=>{$(id).value=''});
      $('customTargetUrl').value='/v2/';
      toast('Mensaje personalizado programado.');
      await load();
    }catch(error){toast(String(error?.message||'No se pudo programar el mensaje.').slice(0,140))}
  }

  async function removeCustom(id){
    const item=messages.find(entry=>Number(entry.id)===id);
    if(!item||item.is_preset)return;
    if(!confirm('¿Eliminar “'+item.name+'”?'))return;
    try{
      await rpc('admin_app_delete_custom_message',{p_id:id});
      if(editingId===id)closeEditor();
      toast('Mensaje eliminado.');
      await load();
    }catch{toast('No se pudo eliminar el mensaje.')}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUi,{once:true});
  else ensureUi();
})();