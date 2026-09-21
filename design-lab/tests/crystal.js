(async()=>{
  'use strict';
  const log=[],failures=[];let passed=0;
  const output=document.querySelector('#results');
  const check=(ok,label)=>{log.push((ok?'PASS ':'FAIL ')+label);if(ok)passed++;else failures.push(label);output.textContent=log.join('\n');};
  const settle=()=>new Promise(r=>setTimeout(r,400));
  const makeFrame=async(w,h,path='../index.html?standalone=1')=>{
    const f=document.createElement('iframe');f.width=w;f.height=h;f.src=path;
    const ready=new Promise(r=>f.onload=r);document.querySelector('#frames').append(f);await ready;await settle();return f;
  };
  for(const [w,h] of [[360,800],[390,844],[768,1024],[1024,768],[1440,900]]){
    const frame=await makeFrame(w,h),d=frame.contentDocument,win=frame.contentWindow;
    const q=s=>d.querySelector(s),all=s=>[...d.querySelectorAll(s)];
    const shown=e=>e&&e.getBoundingClientRect().width>0&&win.getComputedStyle(e).visibility==='visible'&&win.getComputedStyle(e).display!=='none';
    check(d.documentElement.scrollWidth<=w+1,`${w}: sin desbordamiento horizontal`);
    check(shown(q('.header-profile')),`${w}: perfil visible en cabecera`);
    check(q('.category-art img').complete&&q('.category-art img').naturalWidth>0,`${w}: ilustración disponible`);
    check(all('.category-enter').length===6&&all('.category-enter').every(e=>e.textContent.trim()==='Ingresar →'),`${w}: botón Ingresar en las seis categorías`);
    check(!q('.category-code')&&!q('.category-arena-status'),`${w}: sin numeración de categorías`);
    check(all('.arena-platform').length===1&&!q('.category-pedestal')&&q('.arena-platform').getAttribute('aria-hidden')==='true',`${w}: una sola tarima central decorativa`);
    const stage=q('.category-arena-viewport').getBoundingClientRect(),base=q('.arena-platform').getBoundingClientRect();
    check(base.top>stage.top&&base.bottom<=stage.bottom+1&&base.left>=stage.left-1&&base.right<=stage.right+1,`${w}: tarima central completa sin recorte`);
    check(new Set(all('.category-glass').map(e=>win.getComputedStyle(e).borderTopColor)).size===6,`${w}: seis colores de iluminación diferenciados`);
    const centerCard=q('.category-arena-card.active').getBoundingClientRect(),leftCard=q('.category-arena-card[data-roulette-slot="-1"]').getBoundingClientRect(),rightCard=q('.category-arena-card[data-roulette-slot="1"]').getBoundingClientRect();
    check(centerCard.left-leftCard.right>=14&&rightCard.left-centerCard.right>=14,`${w}: separación real entre los bloques`);
    const launcher=q('.info-launcher').getBoundingClientRect();
    check(q('.info-launcher b').textContent==='Más información'&&launcher.bottom<=h+1&&launcher.top>=0,`${w}: pestaña inferior visible Más información`);
    const cta=q('.category-arena-card.active .category-enter').getBoundingClientRect();
    check(cta.left>=0&&cta.right<=w+1&&cta.height>=40,`${w}: acción principal visible y táctil`);
    check(win.getComputedStyle(q('.store-app')).backgroundImage!=='none',`${w}: showroom multicolor activo`);
    q('.ticker-pause').click();check(win.getComputedStyle(q('.welcome-ticker-track')).animationPlayState==='paused',`${w}: bienvenida pausable`);
    q('.info-launcher').focus();q('.info-launcher').click();await settle();
    const hub=q('#infoHub'),r=hub.getBoundingClientRect();
    check(hub.classList.contains('open')&&!hub.inert,`${w}: centro desplegable interactivo`);
    check(r.left>=0&&r.right<=w+1&&r.top>=0&&r.bottom<=h+1,`${w}: panel cabe en pantalla`);
    check(q('.store-header').inert,`${w}: fondo fuera del foco durante el diálogo`);
    const handle=q('.info-sheet-handle'),hr=handle.getBoundingClientRect();
    check(handle.contains(d.elementFromPoint(hr.left+hr.width/2,hr.top+hr.height/2)),`${w}: pestaña del panel recibe el toque sobre el fondo`);
    check(win.getComputedStyle(hub).transform==='matrix(1, 0, 0, 1, 0, 0)',`${w}: panel desplegado hacia arriba sin desplazamiento lateral`);
    check(all('.social-card-grid .social-card').length===5&&q('.social-card.instagram').textContent.includes('Enlace por confirmar'),`${w}: cinco canales sin inventar Instagram`);
    for(const panel of ['social','terms','privacy','cookies','support','buy','delivery','about']){
      q(`.info-hub-nav [data-info-panel="${panel}"]`).click();
      check(shown(q(`[data-info-panel-view="${panel}"]`)),`${w}: panel ${panel}`);
      check(q(`.info-hub-nav [data-info-panel="${panel}"]`).getAttribute('aria-current')==='page',`${w}: selección accesible de ${panel}`);
    }
    d.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await settle();
    check(hub.inert&&!hub.classList.contains('open')&&d.activeElement===q('.info-launcher'),`${w}: Escape cierra y devuelve foco`);
    for(let i=0;i<6;i++){
      const card=q('.category-arena-card.active');card.querySelector('.category-enter').click();await settle();
      check(q('#xExperience').classList.contains('open')&&q('#xGameWheel').children.length>0,`${w}: navega a ${card.dataset.category}`);
      check(!/\d+\s*(opciones|\/)/.test(q('#xShowcaseMeta').textContent),`${w}: productos sin contador`);
      check(!q('#xOrientationGate').classList.contains('open'),`${w}: productos sin bloqueo de orientación`);
      q('[data-x-back]').click();q('[data-arena-direction="1"]').click();await settle();
      const nextBase=q('.arena-platform').getBoundingClientRect(),nextStage=q('.category-arena-viewport').getBoundingClientRect();
      check(q('.store-app').dataset.scene===q('.category-arena-card.active').dataset.category,`${w}: neblina sincronizada con la categoría ${i+1}`);
      // Focus restoration may scroll a short viewport; compare within the arena.
      check(Math.abs((nextBase.left-nextStage.left)-(base.left-stage.left))<1&&Math.abs((nextBase.top-nextStage.top)-(base.top-stage.top))<1&&Math.abs(nextBase.width-base.width)<1,`${w}: tarima inmóvil al cambiar categoría ${i+1}`);
    }
    q('.cart-button').click();await settle();check(shown(q('#xCartDrawer'))&&!q('#xCartDrawer').inert,`${w}: carrito accesible desde portada`);
    q('#xCartDrawer [data-x-cart-close]').click();
    for(const view of ['perfil','pases','ajustes','pedidos']){
      q(`[data-nav-view="${view}"]`).click();check(shown(q(`.store-view[data-view="${view}"]`)),`${w}: vista ${view}`);
    }
    d.documentElement.classList.add('motion-off');check(win.getComputedStyle(q('.welcome-ticker-track')).animationName==='none',`${w}: modo sin movimiento`);
    check(all('.fog-bank').every(e=>win.getComputedStyle(e).animationName==='none'),`${w}: neblina estática con movimiento desactivado`);
    frame.remove();
  }
  const frame=await makeFrame(1440,900),d=frame.contentDocument,win=frame.contentWindow,q=s=>d.querySelector(s);
  const previous=win.localStorage.getItem('fs-design-lab-cart-v1');
  try{
    q('.category-arena-card.active .category-enter').click();await settle();
    const field=q('[data-x-field]');field.value='LAB-12345';field.dispatchEvent(new win.Event('input',{bubbles:true}));
    q('[data-x-add-package]').click();q('[data-x-cart]').click();
    check(q('#xCartItems').textContent.includes('Arena Breakout'), 'Carrito: refleja producto añadido');
    check(!q('#xShowcaseMeta').textContent.includes('opciones'), 'Detalle sin cantidad de páginas/opciones');
    let blocked=false;try{await win.fetch('/blocked-test');}catch{blocked=true;}check(blocked,'Aislamiento de red del Lab conservado');
  }finally{if(previous===null)win.localStorage.removeItem('fs-design-lab-cart-v1');else win.localStorage.setItem('fs-design-lab-cart-v1',previous);frame.remove();}
  const standalone=await makeFrame(768,1024,'../preview.html?standalone=1'),sd=standalone.contentDocument;
  check(sd.querySelector('.category-art img').src.startsWith('data:')&&sd.querySelector('.category-art img').naturalWidth>0,'Exportación: ilustraciones incrustadas y carga correcta');
  check(sd.querySelector('.arena-platform img').src.startsWith('data:')&&sd.querySelector('.arena-platform img').naturalWidth>0,'Exportación: tarima fija incrustada y disponible');standalone.remove();
  const lite=await makeFrame(390,844,'../index.html?standalone=1&performance=lite'),ld=lite.contentDocument,lw=lite.contentWindow;
  check(ld.documentElement.classList.contains('perf-lite'),'Gama baja: modo ligero activo');
  check(lw.getComputedStyle(ld.querySelector('.category-arena-card.active')).boxShadow==='none','Gama baja: sin sombras de tarjeta costosas');
  check(lw.getComputedStyle(ld.querySelector('.category-arena-card.active .category-glass')).boxShadow==='none','Gama baja: cristal sin sombras ni capas de brillo');
  check(lw.getComputedStyle(ld.querySelector('.arena-platform')).boxShadow==='none'&&lw.getComputedStyle(ld.querySelector('.arena-platform')).animationName==='none','Gama baja: tarima sin animación ni sombras calculadas');
  check(lw.getComputedStyle(ld.querySelector('.hud-energy')).animationName==='none','Gama baja: energía horizontal estática');
  check(lw.getComputedStyle(ld.querySelector('.store-header')).backdropFilter==='none','Gama baja: sin desenfoque de fondo');
  check(!ld.querySelector('canvas,video'),'Gama baja: sin WebGL, canvas ni vídeo decorativos');
  check(lw.getComputedStyle(ld.querySelector('.fog-far')).display==='none'&&lw.getComputedStyle(ld.querySelector('.fog-near')).filter==='none','Gama baja: una sola capa de neblina sin desenfoque');
  check([...ld.querySelectorAll('.category-art img')].every(e=>e.src.startsWith(location.origin)),'Gama baja: portada sin imágenes remotas');
  lite.remove();
  output.textContent=`${failures.length?'FAIL':'PASS'} · ${passed} verificaciones · ${failures.length} fallos\n`+log.join('\n');
  document.title=`${failures.length?'FAIL':'PASS'} · ${passed} Crystal checks`;
})().catch(e=>{document.querySelector('#results').textContent+='\nERROR '+e.stack;document.title='ERROR · Crystal checks';});
