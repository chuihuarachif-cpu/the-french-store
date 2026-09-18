/* FRENCH STORE Admin — dedicated PWA install control. */
(()=>{
  'use strict';
  let promptEvent=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const button=()=>document.getElementById('installAdminApp');
  const sync=()=>{
    const b=button();
    if(!b)return;
    b.classList.toggle('hidden',standalone()||!promptEvent);
  };
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;sync();});
  addEventListener('appinstalled',()=>{promptEvent=null;sync();});
  addEventListener('DOMContentLoaded',()=>{
    sync();
    button()?.addEventListener('click',async()=>{
      const b=button();
      if(!b||standalone()||!promptEvent)return;
      b.disabled=true;
      try{await promptEvent.prompt();await promptEvent.userChoice.catch(()=>null);promptEvent=null;}
      finally{b.disabled=false;sync();}
    });
  },{once:true});
})();
