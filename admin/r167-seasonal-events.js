/* FRENCH STORE R167 — private seasonal calendar. No storefront visual effects. */
(() => {
  'use strict';
  const URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const client=window.supabase.createClient(URL,ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const TZ='America/La_Paz';
  let events=[];
  let monthCursor=boliviaDate();
  let editingId=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const slugify=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64);
  const pad=n=>String(n).padStart(2,'0');

  function boliviaParts(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    return Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  }
  function boliviaDate(){const p=boliviaParts();return new Date(Number(p.year),Number(p.month)-1,Number(p.day),12)}
  function localToday(){const p=boliviaParts();return `${p.year}-${p.month}-${p.day}`}
  const displayToday=()=>new Intl.DateTimeFormat('es-BO',{timeZone:TZ,dateStyle:'full'}).format(new Date());
  const iso=(date)=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  async function rpc(name,args){const r=await client.rpc(name,args);if(r.error)throw r.error;return r.data}
  function toast(msg){const el=$('toast');if(!el)return;el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),3200)}

  function ensureUi(){
    if($('seasonalPanel'))return;
    const nav=document.querySelector('.tabs');
    const app=$('appView');
    if(!nav||!app)return;
    const button=document.createElement('button');
    button.type='button';button.dataset.tab='seasonal';button.textContent='🗓️ Eventos';
    nav.appendChild(button);
    app.insertAdjacentHTML('beforeend',`<section id="seasonalPanel" class="panel hidden" data-panel="seasonal">
      <div class="panel-head"><div><span class="eyebrow">EVENTOS Y TEMPORADAS</span><h2>Calendario especial</h2><p>La tienda conserva su diseño normal. Aquí solo programas cuándo Codex podrá activar decoraciones especiales.</p></div><button id="seasonalRefresh" class="icon-btn" type="button" aria-label="Actualizar">↻</button></div>
      <div class="seasonal-today"><div><strong id="seasonalTodayText"></strong><small>Zona horaria de la tienda: Bolivia (America/La_Paz)</small></div><div id="seasonalActive" class="seasonal-active"></div></div>
      <div class="seasonal-toolbar"><div class="card-actions"><button id="seasonalPrev" type="button">←</button><button id="seasonalCurrent" type="button">Hoy</button><button id="seasonalNext" type="button">→</button></div><div id="seasonalMonthTitle" class="seasonal-month-title"></div><button id="seasonalNew" class="primary" type="button">+ Nuevo evento</button></div>
      <div id="seasonalCalendar" class="seasonal-calendar"></div>
      <div class="seasonal-grid"><div><div class="seasonal-help">Cada evento dura <b>7 días</b>. En fechas anuales se activa 3 días antes, el día central y 3 días después. No hay efectos visuales instalados todavía.</div><div id="seasonalList" class="seasonal-list"></div></div>
      <article class="card seasonal-form"><b id="seasonalFormTitle">Nuevo evento</b><div class="form-grid">
        <label class="wide"><span>Nombre</span><input id="seasonalName" maxlength="120" placeholder="Ej. Día de la Bandera"></label>
        <label><span>Ámbito</span><select id="seasonalScope"><option value="TARIJA">Tarija</option><option value="BOLIVIA">Bolivia</option><option value="GLOBAL">Global</option></select></label>
        <label><span>Tipo</span><select id="seasonalRecurrence"><option value="ANNUAL_FIXED">Se repite cada año</option><option value="ONE_OFF">Solo una vez</option></select></label>
        <label id="seasonalMonthWrap"><span>Mes</span><input id="seasonalMonth" type="number" min="1" max="12" value="1"></label>
        <label id="seasonalDayWrap"><span>Día central</span><input id="seasonalDay" type="number" min="1" max="31" value="1"></label>
        <label id="seasonalOneOffWrap" class="wide hidden"><span>Primer día del evento</span><input id="seasonalOneOff" type="date"></label>
        <label><span>Prioridad</span><input id="seasonalPriority" type="number" min="0" max="1000" value="120"></label>
        <label><span>Estado</span><select id="seasonalEnabled"><option value="1">Activo</option><option value="0">Desactivado</option></select></label>
        <label class="wide"><span>Notas internas</span><textarea id="seasonalNotes" rows="3" maxlength="1000" placeholder="Opcional"></textarea></label>
      </div><div class="seasonal-help">Clave para Codex: <code id="seasonalKeyPreview">evento</code>. Se genera desde el nombre y luego Codex podrá asociarla con tus fotos/efectos.</div><div class="card-actions"><button id="seasonalSave" class="primary" type="button">Guardar evento</button><button id="seasonalCancel" type="button">Limpiar</button></div></article></div>
    </section>`);
    button.addEventListener('click',()=>openPanel(button));
    $('seasonalRefresh').onclick=load;
    $('seasonalPrev').onclick=()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()-1,1,12);renderCalendar()};
    $('seasonalNext').onclick=()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,1,12);renderCalendar()};
    $('seasonalCurrent').onclick=()=>{monthCursor=boliviaDate();renderCalendar()};
    $('seasonalNew').onclick=resetForm;
    $('seasonalCancel').onclick=resetForm;
    $('seasonalSave').onclick=save;
    $('seasonalRecurrence').onchange=syncForm;
    $('seasonalName').oninput=()=>{$('seasonalKeyPreview').textContent=slugify($('seasonalName').value)||'evento'};
    syncForm();resetForm();
  }

  async function openPanel(button){
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));
    document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.id!=='seasonalPanel'));
    await load();
  }
  function syncForm(){const fixed=$('seasonalRecurrence').value==='ANNUAL_FIXED';$('seasonalMonthWrap').classList.toggle('hidden',!fixed);$('seasonalDayWrap').classList.toggle('hidden',!fixed);$('seasonalOneOffWrap').classList.toggle('hidden',fixed)}
  function resetForm(){editingId=null;$('seasonalFormTitle').textContent='Nuevo evento';$('seasonalName').value='';$('seasonalScope').value='TARIJA';$('seasonalRecurrence').value='ANNUAL_FIXED';$('seasonalMonth').value=1;$('seasonalDay').value=1;$('seasonalOneOff').value='';$('seasonalPriority').value=120;$('seasonalEnabled').value='1';$('seasonalNotes').value='';$('seasonalKeyPreview').textContent='evento';syncForm()}

  async function load(){
    try{
      const allowed=await rpc('admin_app_is_allowed');if(allowed!==true)throw new Error('ADMIN_APP_FORBIDDEN');
      const [list,active]=await Promise.all([rpc('admin_app_list_seasonal_events'),rpc('storefront_active_seasonal_events')]);
      events=Array.isArray(list)?list:[];
      $('seasonalTodayText').textContent=displayToday();
      $('seasonalActive').innerHTML=(Array.isArray(active)&&active.length)?active.map(e=>`<span class="seasonal-chip">✨ ${esc(e.name)}</span>`).join(''):'<span class="seasonal-chip off">Sin evento activo hoy</span>';
      renderCalendar();renderList();
    }catch(error){toast(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudo cargar el calendario.')}
  }

  function activeOn(e,date){
    const target=new Date(`${date}T12:00:00`);
    if(e.recurrence==='ONE_OFF'){
      const start=new Date(`${String(e.one_off_start||'').slice(0,10)}T12:00:00`);
      const end=new Date(`${String(e.one_off_end||'').slice(0,10)}T12:00:00`);
      return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&target>=start&&target<=end;
    }
    const years=[target.getFullYear()-1,target.getFullYear(),target.getFullYear()+1];
    return years.some(y=>{
      const anchor=new Date(y,Number(e.anchor_month)-1,Number(e.anchor_day),12);
      const start=new Date(anchor);start.setDate(start.getDate()+Number(e.start_offset_days??-3));
      const end=new Date(start);end.setDate(end.getDate()+Number(e.duration_days||7)-1);
      return target>=start&&target<=end;
    });
  }

  function renderCalendar(){
    const host=$('seasonalCalendar');if(!host)return;
    const y=monthCursor.getFullYear(),m=monthCursor.getMonth();
    $('seasonalMonthTitle').textContent=new Intl.DateTimeFormat('es-BO',{month:'long',year:'numeric'}).format(new Date(y,m,1));
    const weekdays=['L','M','X','J','V','S','D'];
    const first=new Date(y,m,1);const blanks=(first.getDay()+6)%7;const days=new Date(y,m+1,0).getDate();
    let html=weekdays.map(d=>`<div class="seasonal-weekday">${d}</div>`).join('')+Array.from({length:blanks},()=>'<div class="seasonal-day empty"></div>').join('');
    const today=localToday();
    for(let d=1;d<=days;d++){
      const date=`${y}-${pad(m+1)}-${pad(d)}`;
      const matches=events.filter(e=>activeOn(e,date));
      html+=`<div class="seasonal-day ${date===today?'today':''}"><div class="seasonal-day-number">${d}</div><div class="seasonal-day-events">${matches.map(e=>`<div class="seasonal-day-event ${e.enabled?'':'disabled'}">${esc(e.name)}</div>`).join('')}</div></div>`;
    }
    host.innerHTML=html;
  }

  function eventDateLabel(e){
    if(e.recurrence==='ONE_OFF')return `${String(e.one_off_start||'').slice(0,10)} → ${String(e.one_off_end||'').slice(0,10)}`;
    return `${pad(e.anchor_day)}/${pad(e.anchor_month)} · 7 días (−3/+3)`;
  }
  function renderList(){
    const host=$('seasonalList');if(!host)return;
    const sorted=[...events].sort((a,b)=>(Number(a.anchor_month||13)-Number(b.anchor_month||13))||(Number(a.anchor_day||32)-Number(b.anchor_day||32)));
    host.innerHTML=sorted.length?sorted.map(e=>`<article class="card"><div class="card-top"><div><b>${esc(e.name)}</b><small>${esc(eventDateLabel(e))}</small></div><span class="seasonal-scope ${e.enabled?'seasonal-status-on':'seasonal-status-off'}">${esc(e.scope)} · ${e.enabled?'ACTIVO':'APAGADO'}</span></div><div class="seasonal-meta"><span>Clave: ${esc(e.decoration_key)}</span><span>Prioridad: ${Number(e.priority||0)}</span></div><div class="seasonal-actions"><button type="button" data-seasonal-edit="${e.id}">Editar</button><button type="button" data-seasonal-toggle="${e.id}" data-enabled="${e.enabled?'1':'0'}">${e.enabled?'Desactivar':'Activar'}</button><button class="danger-btn" type="button" data-seasonal-delete="${e.id}">Eliminar</button></div></article>`).join(''):'<article class="card"><small>No hay eventos configurados.</small></article>';
    host.querySelectorAll('[data-seasonal-edit]').forEach(b=>b.onclick=()=>edit(Number(b.dataset.seasonalEdit)));
    host.querySelectorAll('[data-seasonal-toggle]').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.seasonalToggle),b.dataset.enabled!=='1'));
    host.querySelectorAll('[data-seasonal-delete]').forEach(b=>b.onclick=()=>remove(Number(b.dataset.seasonalDelete)));
  }
  function edit(id){const e=events.find(x=>Number(x.id)===id);if(!e)return;editingId=id;$('seasonalFormTitle').textContent='Editar evento';$('seasonalName').value=e.name||'';$('seasonalScope').value=e.scope||'GLOBAL';$('seasonalRecurrence').value=e.recurrence||'ANNUAL_FIXED';$('seasonalMonth').value=e.anchor_month||1;$('seasonalDay').value=e.anchor_day||1;$('seasonalOneOff').value=String(e.one_off_start||'').slice(0,10);$('seasonalPriority').value=e.priority||100;$('seasonalEnabled').value=e.enabled?'1':'0';$('seasonalNotes').value=e.notes||'';$('seasonalKeyPreview').textContent=e.decoration_key||e.slug;syncForm();$('seasonalName').focus()}

  async function save(){
    const name=$('seasonalName').value.trim();if(name.length<2)return toast('Escribe un nombre para el evento.');
    const recurrence=$('seasonalRecurrence').value;const slug=editingId?(events.find(e=>Number(e.id)===editingId)?.slug||slugify(name)):slugify(name);const one=$('seasonalOneOff').value||null;
    if(recurrence==='ONE_OFF'&&!one)return toast('Elige el primer día del evento.');
    const end=one?new Date(`${one}T12:00:00`):null;if(end)end.setDate(end.getDate()+6);
    try{
      await rpc('admin_app_upsert_seasonal_event',{p_id:editingId,p_slug:slug,p_name:name,p_scope:$('seasonalScope').value,p_recurrence:recurrence,p_anchor_month:recurrence==='ANNUAL_FIXED'?Number($('seasonalMonth').value):null,p_anchor_day:recurrence==='ANNUAL_FIXED'?Number($('seasonalDay').value):null,p_one_off_start:one,p_one_off_end:end?iso(end):null,p_start_offset_days:recurrence==='ANNUAL_FIXED'?-3:0,p_duration_days:7,p_enabled:$('seasonalEnabled').value==='1',p_priority:Number($('seasonalPriority').value)||100,p_decoration_key:slug,p_notes:$('seasonalNotes').value.trim()||null});
      toast('Evento guardado.');resetForm();await load();
    }catch(error){toast(String(error?.message||'No se pudo guardar el evento.').slice(0,140))}
  }
  async function toggle(id,enabled){try{await rpc('admin_app_set_seasonal_event_active',{p_id:id,p_enabled:enabled});toast(enabled?'Evento activado.':'Evento desactivado.');await load()}catch{toast('No se pudo cambiar el estado.')}}
  async function remove(id){const e=events.find(x=>Number(x.id)===id);if(!e||!confirm(`¿Eliminar “${e.name}”?`))return;try{await rpc('admin_app_delete_seasonal_event',{p_id:id});if(editingId===id)resetForm();toast('Evento eliminado.');await load()}catch{toast('No se pudo eliminar el evento.')}}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUi,{once:true});else ensureUi();
})();
