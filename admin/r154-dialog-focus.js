/* Presentation only. Existing Cancel/Close handlers own all dialog decisions. */
(() => {
  'use strict';
  const dialogs=['confirmModal','infoModal'].map(id=>document.getElementById(id)).filter(Boolean);
  const stack=[],inertBefore=new Map();
  const visible=el=>el?.isConnected&&el.getClientRects().length&&!el.closest('[inert]');
  const controls=modal=>[...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&visible(el));
  const top=()=>stack.at(-1)?.modal;
  function contain(){
    for(const [el,value] of inertBefore)el.inert=value;
    inertBefore.clear();
    if(!top())return;
    for(const el of document.body.children){if(el===top()||['SCRIPT','STYLE','LINK'].includes(el.tagName))continue;inertBefore.set(el,el.inert);el.inert=true;}
  }
  function sync(){
    for(let i=stack.length-1;i>=0;i--){
      if(!stack[i].modal.classList.contains('hidden'))continue;
      const [closed]=stack.splice(i,1);contain();
      if(visible(closed.opener))closed.opener.focus({preventScroll:true});
    }
    for(const modal of dialogs){
      if(modal.classList.contains('hidden')||stack.some(entry=>entry.modal===modal))continue;
      stack.push({modal,opener:document.activeElement});contain();
      const card=modal.querySelector('.modal-card');card.tabIndex=-1;card.focus({preventScroll:true});
    }
  }
  const observer=new MutationObserver(sync);
  dialogs.forEach(modal=>observer.observe(modal,{attributes:true,attributeFilter:['class']}));
  document.addEventListener('keydown',event=>{
    const modal=top();if(!modal||event.defaultPrevented)return;
    if(event.key==='Escape'){
      const close=document.getElementById(modal.id==='confirmModal'?'confirmCancel':'infoClose');
      if(close&&!close.disabled){event.preventDefault();close.click();}
    }
    if(event.key!=='Tab')return;
    const items=controls(modal),first=items[0],last=items.at(-1);
    if(!items.length){event.preventDefault();return;}
    if(!items.includes(document.activeElement)||(event.shiftKey?document.activeElement===first:document.activeElement===last)){
      event.preventDefault();(event.shiftKey?last:first).focus();
    }
  });
  document.addEventListener('focusin',event=>{const modal=top();if(modal&&!modal.contains(event.target))(controls(modal)[0]||modal.querySelector('.modal-card')).focus();});
  sync();
})();
