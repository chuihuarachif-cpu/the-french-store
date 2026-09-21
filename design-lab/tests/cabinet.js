(async()=>{
 'use strict';
 const out=document.querySelector('#results'),log=[],failures=[];let passed=0;
 const check=(ok,label)=>{log.push(`${ok?'PASS':'FAIL'} ${label}`);if(ok)passed++;else failures.push(label);out.textContent=log.join('\n');};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const [w,h] of [[1366,768],[1920,1080],[1024,600],[844,390],[667,375],[390,844]]){
  const f=document.createElement('iframe');f.width=w;f.height=h;f.src='../index.html?standalone=1&performance=lite';const ready=new Promise(r=>f.onload=r);document.querySelector('#frames').append(f);await ready;await wait(420);
  const d=f.contentDocument,win=f.contentWindow,q=s=>d.querySelector(s),r=e=>e.getBoundingClientRect();
  const fits=e=>{const b=r(e);return b.width>0&&b.height>0&&b.left>=-1&&b.right<=w+1&&b.top>=-1&&b.bottom<=h+1;};
  check(d.documentElement.scrollWidth<=w+1,`${w}: sin scroll horizontal exterior`);
  if(w>h){
   check(d.documentElement.scrollHeight<=h+1,`${w}: tienda cabe en una pantalla`);
   check(fits(q('.cart-button'))&&fits(q('.info-launcher')),`${w}: carrito y pestaña inferior completos`);
   const card=r(q('.category-arena-card.active'));check(card.width/card.height>1.5,`${w}: bloque rectangular`);
   check(fits(q('.category-arena-card.active .category-enter')),`${w}: Ingresar dentro de pantalla`);
  }
  q('.category-arena-card.active .category-enter').click();await wait(300);
  const list=q('#xPackageList'),stage=q('.x-product-stage'),wheel=q('.x-wheel-panel');
  if(w>h) check([...d.querySelectorAll('.x-game-card')].filter(e=>Math.abs(Number(e.dataset.xSlot))<=1).every(fits),`${w}: juego seleccionado y vecinos completos`);
  check(list.clientHeight>=80&&list.scrollHeight>list.clientHeight,`${w}: precios tienen espacio y scroll propio`);
  check(fits(q('.x-buy-dock')),`${w}: Comprar siempre accesible`);
  const first=q('.x-package-card'),price=q('.x-package-price');check(r(price).height>14&&r(price).bottom<=r(first).bottom,`${w}: precio legible sin compresión`);
  list.scrollTop=100;check(list.scrollTop>0&&d.documentElement.scrollTop===0,`${w}: scroll de paquetes independiente`);
  let mutations=0;const observer=new win.MutationObserver(()=>mutations++);observer.observe(list,{childList:true});
  const initial=q('#xShowcaseTitle').textContent;
  for(let i=0;i<3;i++){wheel.dispatchEvent(new win.WheelEvent('wheel',{deltaY:80,bubbles:true,cancelable:true}));await wait(30);}
  check(stage.getAttribute('aria-busy')==='true'&&stage.inert,`${w}: bloque pendiente no permite comprar juego anterior`);
  check(mutations===0&&win.getComputedStyle(list).visibility==='hidden',`${w}: no renderiza precios al pasar juegos intermedios`);
  await wait(280);
  check(mutations===1&&!stage.inert&&stage.getAttribute('aria-busy')==='false',`${w}: un solo render al detener la rueda`);
  check(q('#xShowcaseTitle').textContent!==initial&&q('#xShowcaseTitle').textContent===q('.x-game-card.active .x-game-name').textContent,`${w}: precios corresponden al juego final`);
  check(list.scrollTop===0,`${w}: nuevo juego reinicia scroll de precios`);
  const chosen=q('#xShowcaseTitle').textContent;list.dispatchEvent(new win.WheelEvent('wheel',{deltaY:240,bubbles:true,cancelable:true}));await wait(260);check(q('#xShowcaseTitle').textContent===chosen&&mutations===1,`${w}: rueda sobre precios no cambia juego`);
  wheel.dispatchEvent(new win.WheelEvent('wheel',{deltaY:80,bubbles:true,cancelable:true}));q('[data-x-back]').click();await wait(260);check(!q('#xExperience').classList.contains('open')&&mutations===1,`${w}: cerrar cancela render pendiente`);
  observer.disconnect();f.remove();
 }
 out.textContent+=`\n\nRESULT ${passed} passed / ${failures.length} failed\n${failures.join('\n')}`;document.title=`Cabinet: ${passed} passed, ${failures.length} failed`;
})().catch(e=>{document.querySelector('#results').textContent+='\nERROR '+e.stack;document.title='Cabinet ERROR';});
