/* R168 — generador privado de entregas/garantías. Los datos pegados no se guardan ni se envían. */
(() => {
  'use strict';

  const $=(id)=>document.getElementById(id);
  const RULE_KEYS=['rule1','rule2','rule3','rule4','guarantee'];
  const DEFAULT_RULES={
    rule1:'Utiliza únicamente el acceso, perfil o datos que te fueron asignados. No ingreses a perfiles de otros usuarios.',
    rule2:'No cambies correo, contraseña, PIN, nombres de perfiles, métodos de recuperación ni información de pago.',
    rule3:'Usa la cuenta en un solo dispositivo a la vez. Si cambias de equipo, cierra primero la sesión anterior.',
    rule4:'Si notas una falla durante la vigencia, repórtala antes de realizar cambios por tu cuenta para que podamos revisarla.',
    guarantee:'La garantía cubre fallas de acceso o del servicio durante el periodo contratado. Puede quedar sin efecto si se modifican datos, se comparte el acceso o se incumplen estas condiciones.'
  };

  function cleanLine(value){
    return String(value||'')
      .replace(/[\*_`~]/g,'')
      .replace(/[\u200B-\u200D\uFEFF]/g,'')
      .replace(/^\s*[🛑🤖💯🔰✅⏳🗓️📧🔑👤🔒🎵🎬⭐🟢🟣🔵🟡]+\s*/u,'')
      .trim();
  }
  function linesOf(text){return String(text||'').replace(/\r/g,'').split('\n').map(cleanLine).filter(Boolean)}
  function stripTrailingDecor(value){return String(value||'').replace(/[\s_*]+$/g,'').trim()}
  function pick(lines,patterns){
    for(const line of lines){
      for(const pattern of patterns){
        const match=line.match(pattern);
        if(match?.[1])return stripTrailingDecor(match[1]);
      }
    }
    return '';
  }
  function detectService(text,lines){
    const source=`${text}\n${lines.slice(0,5).join('\n')}`.toUpperCase();
    const known=[
      [/CHAT\s*GPT|CHATGPT/,'ChatGPT Plus'],[/NETFLIX/,'Netflix'],[/SPOTIFY/,'Spotify Premium'],
      [/DISNEY/,'Disney+'],[/HBO\s*MAX|MAX\b/,'Max'],[/PRIME\s*VIDEO/,'Prime Video'],
      [/CRUNCHYROLL/,'Crunchyroll'],[/YOUTUBE/,'YouTube Premium'],[/PARAMOUNT/,'Paramount+'],
      [/VIX/,'ViX Plus'],[/MAGIS/,'Magis TV'],[/FLUJO/,'Flujo TV'],[/CANVA/,'Canva Pro'],
      [/CAPCUT/,'CapCut Pro'],[/MICROSOFT|OFFICE\s*365/,'Microsoft 365'],[/ADOBE/,'Adobe']
    ];
    for(const [pattern,name] of known)if(pattern.test(source))return name;
    const candidate=lines.find(line=>line.length<=48&&!line.includes('@')&&!/^(duraci[oó]n|inicio|vence|correo|contrase|perfil|pin|titular|renovaci[oó]n)/i.test(line));
    return candidate?candidate.replace(/[^\p{L}\p{N}+ .&/-]/gu,'').trim():'';
  }
  function parseDate(value){
    const m=String(value||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if(!m)return null;
    const year=Number(m[3].length===2?`20${m[3]}`:m[3]);
    const month=Number(m[2]);
    const day=Number(m[1]);
    const date=new Date(Date.UTC(year,month-1,day));
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
    return date;
  }
  function formatShortDate(date){
    const dd=String(date.getUTCDate()).padStart(2,'0');
    const mm=String(date.getUTCMonth()+1).padStart(2,'0');
    const yy=String(date.getUTCFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
  function calculateEnd(start,duration){
    const date=parseDate(start);
    const days=Number(String(duration||'').match(/\d+/)?.[0]);
    if(!date||!Number.isFinite(days)||days<1||days>3660)return '';
    date.setUTCDate(date.getUTCDate()+days);
    return formatShortDate(date);
  }
  function parseProviderText(text){
    const lines=linesOf(text);
    const duration=pick(lines,[/^duraci[oó]n\s*:?\s*(.+)$/i,/^vigencia\s*:?\s*(.+)$/i]);
    const start=pick(lines,[/^inicio\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}.*)$/i,/^fecha\s+de\s+inicio\s*:?\s*(.+)$/i,/^compra\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}.*)$/i]);
    let end=pick(lines,[/^vence\s*:?\s*(.+)$/i,/^vencimiento\s*:?\s*(.+)$/i,/^corte\s*:?\s*(.+)$/i,/^fecha\s+de\s+corte\s*:?\s*(.+)$/i,/^finaliza\s*:?\s*(.+)$/i]);
    const calculatedEnd=!end?calculateEnd(start,duration):'';
    if(!end&&calculatedEnd)end=calculatedEnd;
    return {
      service:detectService(text,lines),
      duration,
      start,
      end,
      endCalculated:Boolean(calculatedEnd),
      renewal:pick(lines,[/^renovaci[oó]n\s*:?\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?.*)$/i]),
      email:pick(lines,[/^(?:correo|email|e-mail)\s*:?\s*([^\s]+@[^\s]+)$/i]),
      password:pick(lines,[/^(?:contrase(?:ñ|n)a|clave|password|pass)\s*:?\s*(.+)$/i]),
      profile:pick(lines,[/^(?:su\s+perfil|perfil|usuario)\s*:?\s*(.+)$/i]),
      pin:pick(lines,[/^pin\s*:?\s*(.+)$/i]),
      holder:pick(lines,[/^(?:titular|nombre)\s*:?\s*(.+)$/i])
    };
  }

  function value(id){return $(id)?.value.trim()||''}
  function getRules(){
    return {
      rule1:value('deliveryRule1')||DEFAULT_RULES.rule1,
      rule2:value('deliveryRule2')||DEFAULT_RULES.rule2,
      rule3:value('deliveryRule3')||DEFAULT_RULES.rule3,
      rule4:value('deliveryRule4')||DEFAULT_RULES.rule4,
      guarantee:value('deliveryGuarantee')||DEFAULT_RULES.guarantee
    };
  }
  function line(label,val,emoji){return val?`${emoji} *${label}:* ${val}`:''}
  function buildMessage(){
    const service=value('deliveryService')||'Servicio digital';
    const fields=[
      line('Duración',value('deliveryDuration'),'⏳'),
      line('Inicio',value('deliveryStart'),'🗓️'),
      line('Vence',value('deliveryEnd'),'🗓️'),
      line('Renovación',value('deliveryRenewal'),'🔄')
    ].filter(Boolean);
    const access=[
      line('Correo',value('deliveryEmail'),'📧'),
      line('Contraseña',value('deliveryPassword'),'🔑'),
      line('Perfil',value('deliveryProfile'),'👤'),
      line('Titular',value('deliveryHolder'),'👤'),
      line('PIN',value('deliveryPin'),'🔒')
    ].filter(Boolean);
    const rules=getRules();
    const parts=[
      '💎 *FRENCH STORE* 💎',
      `✨ *${service.toUpperCase()}* ✨`,
      '*Datos de tu suscripción:*',
      fields.join('\n'),
      access.join('\n'),
      '*CONDICIONES DE USO Y GARANTÍA*',
      `1️⃣ *Usa solo el acceso asignado:* ${rules.rule1}`,
      `2️⃣ *No modifiques datos sensibles:* ${rules.rule2}`,
      `3️⃣ *Dispositivo único:* ${rules.rule3}`,
      `4️⃣ *Reporta cualquier falla:* ${rules.rule4}`,
      '*SOBRE TU GARANTÍA:*',
      `✅ ${rules.guarantee}`,
      'Gracias por comprar en *FRENCH STORE*. ¡Disfruta tu servicio! 😊'
    ];
    return parts.filter(part=>part&&part.trim()).join('\n\n').replace(/\n{3,}/g,'\n\n');
  }
  function renderPreview(){const preview=$('deliveryPreview');if(preview)preview.textContent=buildMessage()}
  function setField(id,val){const el=$(id);if(el)el.value=val||''}
  function parseIntoForm(){
    const text=value('deliveryProviderText');
    const status=$('deliveryParserStatus');
    if(!text){
      if(status){status.className='r168-status warn';status.textContent='Pega primero el mensaje completo de tu proveedor.'}
      return;
    }
    const data=parseProviderText(text);
    setField('deliveryService',data.service);
    setField('deliveryDuration',data.duration);
    setField('deliveryStart',data.start);
    setField('deliveryEnd',data.end);
    setField('deliveryRenewal',data.renewal);
    setField('deliveryEmail',data.email);
    setField('deliveryPassword',data.password);
    setField('deliveryProfile',data.profile);
    setField('deliveryHolder',data.holder);
    setField('deliveryPin',data.pin);
    const found=[data.service,data.duration,data.start,data.end,data.email,data.password,data.profile,data.holder,data.pin,data.renewal].filter(Boolean).length;
    if(status){
      status.className=`r168-status ${found>=4?'ok':'warn'}`;
      status.textContent=found>=4
        ?`Datos detectados: ${found}. Revisa los campos antes de copiar.${data.endCalculated?' La fecha de vencimiento fue calculada automáticamente a partir del inicio y la duración.':''}`
        :'Detecté pocos datos. Puedes completar o corregir los campos manualmente antes de copiar.';
    }
    renderPreview();
  }
  async function copyMessage(){
    const text=buildMessage();
    try{
      await navigator.clipboard.writeText(text);
      const status=$('deliveryParserStatus');
      if(status){status.className='r168-status ok';status.textContent='Mensaje de FRENCH STORE copiado. Ya puedes pegarlo en WhatsApp.'}
    }catch{
      const temp=document.createElement('textarea');temp.value=text;temp.style.position='fixed';temp.style.opacity='0';document.body.appendChild(temp);temp.select();
      const ok=document.execCommand('copy');temp.remove();
      const status=$('deliveryParserStatus');if(status){status.className=`r168-status ${ok?'ok':'warn'}`;status.textContent=ok?'Mensaje copiado.':'No pude copiar automáticamente; selecciona el texto de la vista previa.'}
    }
  }
  function clearCredentials(){
    ['deliveryProviderText','deliveryService','deliveryDuration','deliveryStart','deliveryEnd','deliveryRenewal','deliveryEmail','deliveryPassword','deliveryProfile','deliveryHolder','deliveryPin'].forEach(id=>setField(id,''));
    const status=$('deliveryParserStatus');if(status){status.className='r168-status';status.textContent='El texto del proveedor se procesa solo en este navegador y no se guarda.'}
    renderPreview();
  }
  function loadRules(){
    let stored={};
    try{stored=JSON.parse(localStorage.getItem('fs_admin_delivery_rules_v1')||'{}')||{}}catch{}
    RULE_KEYS.forEach(key=>setField(`delivery${key[0].toUpperCase()}${key.slice(1)}`,stored[key]||DEFAULT_RULES[key]));
  }
  function saveRules(){
    const rules=getRules();
    try{localStorage.setItem('fs_admin_delivery_rules_v1',JSON.stringify(rules));
      const status=$('deliveryParserStatus');if(status){status.className='r168-status ok';status.textContent='Tus reglas quedaron guardadas solamente en este dispositivo.'}
    }catch{
      const status=$('deliveryParserStatus');if(status){status.className='r168-status warn';status.textContent='No se pudieron guardar las reglas en este dispositivo.'}
    }
    renderPreview();
  }

  function panelMarkup(){
    return `<section id="deliveriesPanel" class="panel hidden" data-panel="deliveries">
      <div class="panel-head"><div><span class="eyebrow">ENTREGAS Y GARANTÍAS</span><h2>Generador de mensajes</h2><p>Pega el mensaje del proveedor, revisa lo detectado y copia una entrega con la marca y reglas de FRENCH STORE.</p></div></div>
      <div class="r168-privacy"><b>Privado por diseño:</b> correos, contraseñas y PIN se procesan únicamente en tu navegador. No se guardan en Supabase, no se suben a GitHub y no se almacenan en el historial del admin.</div>
      <div class="r168-grid">
        <article class="r168-card">
          <h3>1. Pega el mensaje del proveedor</h3>
          <p>Acepta formatos como Netflix, ChatGPT, Spotify y mensajes similares. No importa si traen emojis o texto en negrita de WhatsApp.</p>
          <label class="r168-label"><span>Mensaje completo</span><textarea id="deliveryProviderText" spellcheck="false" autocomplete="off" placeholder="Pega aquí exactamente lo que te manda tu proveedor…"></textarea></label>
          <div class="r168-actions"><button id="deliveryParse" class="primary" type="button">Detectar datos</button><button id="deliveryClear" class="secondary" type="button">Limpiar datos</button></div>
          <div id="deliveryParserStatus" class="r168-status">El texto del proveedor se procesa solo en este navegador y no se guarda.</div>
        </article>
        <article class="r168-card">
          <h3>2. Revisa o corrige</h3>
          <p>Todo es editable por si tu proveedor usa un formato distinto.</p>
          <div class="r168-fields">
            <label class="r168-label wide"><span>Servicio</span><input id="deliveryService" type="text" autocomplete="off" placeholder="Netflix, Spotify Premium, ChatGPT Plus…"></label>
            <label class="r168-label"><span>Duración</span><input id="deliveryDuration" type="text" autocomplete="off" placeholder="30 Días"></label>
            <label class="r168-label"><span>Inicio</span><input id="deliveryStart" type="text" autocomplete="off" placeholder="02/09/26"></label>
            <label class="r168-label"><span>Vence / corte</span><input id="deliveryEnd" type="text" autocomplete="off" placeholder="02/10/26"></label>
            <label class="r168-label"><span>Renovación</span><input id="deliveryRenewal" type="text" autocomplete="off" placeholder="18/09"></label>
            <label class="r168-label wide"><span>Correo</span><input id="deliveryEmail" type="text" spellcheck="false" autocomplete="off" placeholder="cliente@correo.com"></label>
            <label class="r168-label wide"><span>Contraseña</span><input id="deliveryPassword" type="text" spellcheck="false" autocomplete="off" placeholder="Contraseña recibida"></label>
            <label class="r168-label"><span>Perfil</span><input id="deliveryProfile" type="text" autocomplete="off" placeholder="YEISON"></label>
            <label class="r168-label"><span>Titular</span><input id="deliveryHolder" type="text" autocomplete="off" placeholder="SEGOVIA"></label>
            <label class="r168-label"><span>PIN</span><input id="deliveryPin" type="text" inputmode="numeric" autocomplete="off" placeholder="9512"></label>
          </div>
        </article>
      </div>
      <details class="r168-rules">
        <summary>⚙️ Personalizar reglas de FRENCH STORE</summary>
        <div class="r168-rules-body">
          <label class="r168-label"><span>Regla 1 · Acceso asignado</span><textarea id="deliveryRule1"></textarea></label>
          <label class="r168-label"><span>Regla 2 · Datos sensibles</span><textarea id="deliveryRule2"></textarea></label>
          <label class="r168-label"><span>Regla 3 · Dispositivo</span><textarea id="deliveryRule3"></textarea></label>
          <label class="r168-label"><span>Regla 4 · Reporte de fallas</span><textarea id="deliveryRule4"></textarea></label>
          <label class="r168-label"><span>Texto de garantía</span><textarea id="deliveryGuarantee"></textarea></label>
          <div class="r168-actions"><button id="deliverySaveRules" class="secondary" type="button">Guardar reglas en este dispositivo</button></div>
        </div>
      </details>
      <div class="r168-preview">
        <div class="r168-preview-brand"><img src="../v2/assets/brand/icon-192.png" alt="Logo FRENCH STORE"><div><strong>FRENCH STORE</strong><small>VISTA PREVIA DE ENTREGA</small></div></div>
        <pre id="deliveryPreview"></pre>
      </div>
      <div class="r168-actions"><button id="deliveryCopy" class="primary" type="button">📋 Copiar mensaje para WhatsApp</button></div>
    </section>`;
  }

  function openPanel(button){
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));
    document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!=='deliveries'));
    renderPreview();
  }
  function ensureUi(){
    if($('deliveriesPanel'))return true;
    const nav=document.querySelector('.tabs');
    const app=$('appView');
    if(!nav||!app)return false;
    const button=document.createElement('button');
    button.type='button';button.dataset.tab='deliveries';button.textContent='📋 Entregas';button.setAttribute('aria-label','Entregas y garantías');
    const historyButton=nav.querySelector('[data-tab="history"]');
    nav.insertBefore(button,historyButton||null);
    const shell=document.createElement('div');shell.innerHTML=panelMarkup();
    const panel=shell.firstElementChild;
    app.insertBefore(panel,$('historyPanel')||null);
    button.addEventListener('click',()=>openPanel(button));
    $('deliveryParse')?.addEventListener('click',parseIntoForm);
    $('deliveryClear')?.addEventListener('click',clearCredentials);
    $('deliveryCopy')?.addEventListener('click',copyMessage);
    $('deliverySaveRules')?.addEventListener('click',saveRules);
    panel.querySelectorAll('input,textarea').forEach(el=>{if(el.id!=='deliveryProviderText')el.addEventListener('input',renderPreview)});
    loadRules();
    renderPreview();
    return true;
  }

  if(!ensureUi())document.addEventListener('DOMContentLoaded',ensureUi,{once:true});
})();
