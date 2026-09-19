(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const DRAFT_KEY='fs_web_project_intake_draft_v1';
  const form=document.getElementById('webProjectForm');
  const planSelect=document.getElementById('planSelect');
  const planHint=document.getElementById('planHint');
  const submitButton=document.getElementById('submitForm');
  const status=document.getElementById('formStatus');
  const successPanel=document.getElementById('successPanel');
  const referenceCode=document.getElementById('referenceCode');
  const whatsappFollowup=document.getElementById('whatsappFollowup');

  const planCopy={
    landing_99:'Landing Esencial: 1 página de hasta 5 secciones. No incluye base de datos, login, carrito, panel administrativo ni pagos automáticos.',
    business_299:'Web Negocio: hasta 5 páginas/secciones y catálogo base de hasta 30 productos/servicios. Funciones avanzadas se cotizan aparte.',
    full_799:'Sistema Completo: desde USD 799. Marca los módulos necesarios; el alcance y precio final se confirman antes de comenzar.',
    custom:'Cotización personalizada: se mostrarán las preguntas avanzadas para poder revisar todo el alcance.'
  };

  function setSectionEnabled(section, enabled){
    section.hidden=!enabled;
    section.querySelectorAll('input,textarea,select,button').forEach(el=>{
      if(el.type==='button') return;
      el.disabled=!enabled;
    });
  }

  function refreshPlan(){
    const plan=planSelect.value;
    planHint.textContent=planCopy[plan]||'Selecciona un plan para mostrar su alcance.';
    document.querySelectorAll('.plan-only').forEach(section=>{
      const allowed=(section.dataset.plans||'').split(',').filter(Boolean);
      setSectionEnabled(section,!!plan&&allowed.includes(plan));
    });
    if(!['full_799','custom'].includes(plan)){
      document.querySelectorAll('[data-controls]').forEach(box=>{box.checked=false});
      document.querySelectorAll('.conditional-module').forEach(section=>setSectionEnabled(section,false));
    }else{
      refreshModules();
    }
  }

  function refreshModules(){
    document.querySelectorAll('[data-controls]').forEach(box=>{
      const section=document.getElementById(box.dataset.controls);
      if(section) setSectionEnabled(section,box.checked&&!box.disabled);
    });
  }

  function toPayload(){
    const data=new FormData(form);
    const payload={};
    for(const [key,value] of data.entries()){
      if(Object.prototype.hasOwnProperty.call(payload,key)){
        payload[key]=Array.isArray(payload[key])?[...payload[key],value]:[payload[key],value];
      }else{
        payload[key]=value;
      }
    }
    form.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(box=>{
      if(!box.name) return;
      if(!Object.prototype.hasOwnProperty.call(payload,box.name)&&!document.querySelectorAll(`input[name="${CSS.escape(box.name)}"][type="checkbox"]`).length>1){
        payload[box.name]=false;
      }
      if(box.dataset.controls) payload[box.name]=box.checked;
    });
    payload.form_version='2026-09-19-r1';
    payload.product_template_url='https://docs.google.com/spreadsheets/d/10B3yl3yOC0POIiKWuQPy47u8lAjl_WUvfTG2cs-c8BU/edit';
    return payload;
  }

  function validateVisible(){
    let first=null;
    form.querySelectorAll('[required]:not([disabled])').forEach(field=>{
      field.classList.remove('invalid');
      const valid=field.type==='checkbox'?field.checked:field.checkValidity();
      if(!valid){
        field.classList.add('invalid');
        if(!first) first=field;
      }
    });

    if(planSelect.value==='landing_99'){
      const checked=[...form.querySelectorAll('input[name="landing_sections"]:checked')];
      if(checked.length>5){
        status.textContent='La Landing Esencial permite seleccionar hasta 5 secciones.';
        status.className='form-status error';
        checked[5]?.focus();
        return false;
      }
    }

    if(first){
      status.textContent='Completa los campos obligatorios marcados antes de enviar.';
      status.className='form-status error';
      first.focus();
      first.scrollIntoView({behavior:'smooth',block:'center'});
      return false;
    }
    return true;
  }

  function saveDraft(showMessage=true){
    const payload=toPayload();
    delete payload.website;
    localStorage.setItem(DRAFT_KEY,JSON.stringify(payload));
    if(showMessage){
      status.textContent='Borrador guardado únicamente en este dispositivo.';
      status.className='form-status success';
    }
  }

  function restoreDraft(){
    const raw=localStorage.getItem(DRAFT_KEY);
    if(!raw) return;
    try{
      const payload=JSON.parse(raw);
      for(const [key,value] of Object.entries(payload)){
        const fields=[...form.querySelectorAll(`[name="${CSS.escape(key)}"]`)];
        if(!fields.length) continue;
        const values=Array.isArray(value)?value:[value];
        fields.forEach(field=>{
          if(field.type==='checkbox'){
            field.checked=values.map(String).includes(String(field.value))||value===true;
          }else if(field.type==='radio'){
            field.checked=values.map(String).includes(String(field.value));
          }else{
            field.value=String(values[0]??'');
          }
        });
      }
      refreshPlan();
      refreshModules();
      status.textContent='Se restauró un borrador guardado en este dispositivo.';
      status.className='form-status success';
    }catch{
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  async function submitIntake(event){
    event.preventDefault();
    status.textContent='';
    status.className='form-status';
    if(!validateVisible()) return;

    const payload=toPayload();
    submitButton.disabled=true;
    submitButton.textContent='Enviando…';

    try{
      const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_web_project_intake`,{
        method:'POST',
        headers:{
          apikey:SUPABASE_ANON_KEY,
          Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type':'application/json',
          Accept:'application/json'
        },
        body:JSON.stringify({p_payload:payload}),
        cache:'no-store'
      });

      if(!response.ok){
        const body=await response.text();
        if(body.includes('RATE_LIMIT')) throw new Error('RATE_LIMIT');
        throw new Error('SUBMIT_FAILED');
      }

      const ref=await response.json();
      localStorage.removeItem(DRAFT_KEY);
      referenceCode.textContent=String(ref||'SOLICITUD RECIBIDA');
      const business=payload.business_name||'mi proyecto';
      const message=`Hola, acabo de enviar la solicitud web para ${business}. Mi código es ${ref}.`;
      whatsappFollowup.href=`https://wa.me/59177057379?text=${encodeURIComponent(message)}`;
      form.hidden=true;
      successPanel.hidden=false;
      successPanel.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){
      status.textContent=error?.message==='RATE_LIMIT'
        ?'Ya recibimos varias solicitudes con este correo recientemente. Espera un poco o escríbenos por WhatsApp.'
        :'No pudimos enviar la solicitud. Tu borrador sigue guardado; inténtalo nuevamente o contáctanos por WhatsApp.';
      status.className='form-status error';
      saveDraft(false);
    }finally{
      submitButton.disabled=false;
      submitButton.textContent='Enviar solicitud';
    }
  }

  planSelect.addEventListener('change',refreshPlan);
  document.querySelectorAll('[data-controls]').forEach(box=>box.addEventListener('change',refreshModules));
  document.getElementById('saveDraft').addEventListener('click',()=>saveDraft(true));
  document.getElementById('clearDraft').addEventListener('click',()=>{
    localStorage.removeItem(DRAFT_KEY);
    status.textContent='Borrador local eliminado.';
    status.className='form-status';
  });
  document.getElementById('copyReference').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(referenceCode.textContent||'')}catch{}
  });
  form.addEventListener('submit',submitIntake);

  let draftTimer;
  form.addEventListener('input',()=>{
    clearTimeout(draftTimer);
    draftTimer=setTimeout(()=>saveDraft(false),900);
  });

  refreshPlan();
  restoreDraft();
})();