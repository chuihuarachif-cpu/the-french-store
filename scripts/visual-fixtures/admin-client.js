/* Isolated Admin fixture. Synthetic records; unknown RPCs and all writes fail. */
(() => {
  const p=new URLSearchParams(location.search),view=p.get('view')||'quotations',state=p.get('state')||'normal';
  const errors=[],blockedWrites=[],calls={},checks=[];
  const product={id:901,juego:'Juego de prueba',paquete:'Paquete QA',categoria:'Recargas por Cuenta',precio:21.99,activo:true,mantenimiento:false,maintenance_editable:true,price_editable:true,cost_editable:true,moneda:'BOB',precio_proveedor:19.99,costo_bob:19.99};
  const order={id:'00000000-0000-4000-8000-000000000001',order_code:'QA-001',customer_email:'qa@example.invalid',status:'PAID',payment_method:'QR',total_amount:21.99,created_at:'2026-09-05T12:00:00Z'};
  const reads={admin_app_is_allowed:!['guest','denied'].includes(state),admin_app_dashboard:{wallet_pending:0,ach_review:0,orders_attention:1,orders_today:1,gamerhub_loaded_usdt:100,gamerhub_balance_usdt:70,gamerhub_consumed_usdt:30,gamerhub_cost_total_bob:650},admin_app_list_products:[product],admin_app_list_account_pricing:[product],admin_app_list_orders:[order],admin_app_list_wallet_topups:[],admin_app_list_bank_payments:[],admin_app_price_history:[],admin_app_get_order_fulfillment_inputs:[{product_id:901,product_name:'Paquete QA',input_values:{user_id:'ID-FICTICIO'},validation_status:'QA'}]};
  const sdk={rpc(name,args){calls[name]=(calls[name]||0)+1;
    if(name==='admin_app_quote_sale_price'){
      if(state==='loading')return new Promise(()=>{});
      if(state==='error')return Promise.resolve({data:null,error:{message:'USD_RATE_UNAVAILABLE'}});
      return Promise.resolve({data:{ok:true,sale_price:21.99,cost_bob:19.99,margin:2,fx:9.27,fx_raw:9.02,fx_buffer:.25},error:null});
    }
    if(Object.hasOwn(reads,name))return Promise.resolve({data:state==='empty'&&Array.isArray(reads[name])?[]:reads[name],error:null});
    blockedWrites.push(name);return Promise.resolve({data:null,error:{message:'QA_READ_ONLY'}});
  },auth:{getSession:async()=>({data:{session:state==='guest'?null:{user:{id:order.id,email:'qa@example.invalid'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};
  window.supabase={createClient:()=>sdk};
  const network=window.fetch.bind(window);
  window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.href),method=options?.method||input?.method||'GET';if(url.origin!==location.origin||!['GET','HEAD'].includes(method)){blockedWrites.push(method+':'+url.pathname);return Promise.reject(new Error('QA_EXTERNAL_OR_WRITE'));}return network(input,options);};
  window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
  function report(){const rate=document.querySelector('[data-r139-rate="USD"]');const data={qa:true,admin:true,view,state,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,errors,blockedWrites,checks,calls,rate:rate?.textContent,copy:document.querySelector('[data-r139-result]')?.textContent,app:!document.getElementById('appView').classList.contains('hidden'),login:!document.getElementById('loginView').classList.contains('hidden'),denied:!document.getElementById('deniedView').classList.contains('hidden')};let out=document.getElementById('fsQaEvidence');if(!out){out=document.createElement('pre');out.hidden=true;out.id='fsQaEvidence';document.body.append(out);}out.textContent=JSON.stringify(data);parent.postMessage(data,location.origin);}
  const settle=()=>new Promise(r=>setTimeout(r,40));
  const check=(pass,label)=>{if(!pass)throw new Error('QA_ADMIN_'+label);checks.push(label);};
  window.addEventListener('load',async()=>{
    for(let i=0;i<80&&!document.getElementById('loadingView').classList.contains('hidden');i++)await settle();
    if(!['guest','denied'].includes(state)){
      const tab=document.querySelector(`[data-tab="${['confirm','info'].includes(view)?'orders':view}"]`);tab.click();await settle();
      if(view==='quotations'){
        const cost=document.querySelector('[data-r139-currency="BS"] [data-r139-cost]');cost.value='19.99';cost.dispatchEvent(new Event('input',{bubbles:true}));
      }
      if(['confirm','info'].includes(view)){
        const trigger=document.querySelector(view==='confirm'?'[data-order-status="PROCESSING"]':'[data-order-data]');trigger.focus();trigger.click();await settle();
        if(p.get('checks')==='r154'){
          const modal=document.getElementById(view==='confirm'?'confirmModal':'infoModal');
          check(modal.contains(document.activeElement),'opening');
          const controls=[...modal.querySelectorAll('button,input,textarea,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length),first=controls[0],last=controls.at(-1);
          last.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));check(document.activeElement===first,'tab');
          first.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));check(document.activeElement===last,'shift-tab');
          tab.focus();check(modal.contains(document.activeElement),'background');
          document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await settle();
          check(modal.classList.contains('hidden'),'escape');check(document.activeElement===trigger,'restore');
          trigger.click();await settle();
        }
      }
    }
    setTimeout(report,600);setTimeout(report,1500);setTimeout(report,3000);
  });
})();
