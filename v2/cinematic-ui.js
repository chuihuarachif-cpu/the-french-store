/* FRENCH STORE — cinematic black/blue motion layer.
   Visual-only progressive enhancement. R8 is the sole authority for motion mode. */
(() => {
  'use strict';

  const root = document.documentElement;
  const REVEAL_SELECTOR = [
    '#view-inicio > .hero',
    '#categoryGrid > .category-card',
    '.web-services-home-card',
    '.panel',
    '#view-cuentas',
    '.web-service-card',
    '.web-services-term',
    '.web-services-intake-cta',
    '#featuredList > *',
    '#catalogList > *',
    '.record-list > *',
    '.balance-card',
    '.topup-box',
    '.profile-card',
    '.site-legal-footer'
  ].join(',');

  let revealObserver = null;
  let mutationObserver = null;
  let motionObserver = null;
  let scrollRaf = 0;

  const isFullMotion = () => root.dataset.r8Motion === 'full';

  function revealNow(el){
    if(!el || el.nodeType !== 1) return;
    el.dataset.fsRevealVisible = '1';
  }

  function revealAll(){
    document.querySelectorAll('[data-fs-reveal="1"]').forEach(revealNow);
  }

  function disconnectRevealObserver(){
    if(revealObserver){
      revealObserver.disconnect();
      revealObserver = null;
    }
  }

  function makeRevealObserver(){
    if(revealObserver || !('IntersectionObserver' in window)) return revealObserver;
    revealObserver = new IntersectionObserver(entries => {
      for(const entry of entries){
        if(!entry.isIntersecting) continue;
        revealNow(entry.target);
        revealObserver?.unobserve(entry.target);
      }
    },{
      root:null,
      rootMargin:'0px 0px 10% 0px',
      threshold:0.04
    });
    return revealObserver;
  }

  function revealDirection(el, index){
    if(el.matches('#categoryGrid > .category-card, #featuredList > *, #catalogList > *, .web-service-card')){
      return index % 2 === 0 ? 'left' : 'right';
    }
    return 'up';
  }

  function prepareElement(el, index = 0){
    if(!el || el.nodeType !== 1 || el.dataset.fsReveal === '1') return;

    /* R8 has not selected full motion: content stays visible. */
    if(!isFullMotion()){
      el.dataset.fsReveal = '1';
      el.dataset.fsRevealVisible = '1';
      return;
    }

    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.bottom > 0 && rect.top < window.innerHeight * .82;

    el.dataset.fsReveal = '1';
    el.dataset.fsRevealDir = revealDirection(el,index);
    el.style.setProperty('--fs-reveal-delay', Math.min(index % 6, 5) * 55 + 'ms');

    if(alreadyVisible){
      revealNow(el);
      return;
    }

    const observer = makeRevealObserver();
    if(observer) observer.observe(el);
    else revealNow(el);
  }

  function decorate(scope = document){
    if(!scope) return;
    const nodes = [];
    if(scope.nodeType === 1 && scope.matches?.(REVEAL_SELECTOR)) nodes.push(scope);
    if(scope.querySelectorAll) nodes.push(...scope.querySelectorAll(REVEAL_SELECTOR));
    nodes.forEach((el,index) => prepareElement(el,index));
  }

  function resetForFullMotion(){
    document.querySelectorAll('[data-fs-reveal="1"]').forEach(el => {
      el.removeAttribute('data-fs-reveal');
      el.removeAttribute('data-fs-reveal-visible');
      el.removeAttribute('data-fs-reveal-dir');
      el.style.removeProperty('--fs-reveal-delay');
    });
    disconnectRevealObserver();
    decorate(document);
  }

  function syncMotion(){
    const mode = root.dataset.r8Motion;
    if(mode === 'full'){
      resetForFullMotion();
      return;
    }
    disconnectRevealObserver();
    revealAll();
  }

  function scheduleDecorate(node){
    requestAnimationFrame(() => {
      try{ decorate(node); }
      catch{ revealAll(); }
    });
  }

  function watchDynamicContent(){
    const main = document.getElementById('mainContent');
    if(!main || !('MutationObserver' in window)) return;

    mutationObserver = new MutationObserver(records => {
      if(!isFullMotion()) return;
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType === 1) scheduleDecorate(node);
        }
      }
    });

    mutationObserver.observe(main,{childList:true,subtree:true});
  }

  function watchMotionMode(){
    if(!('MutationObserver' in window)) return;
    motionObserver = new MutationObserver(records => {
      if(records.some(record => record.attributeName === 'data-r8-motion')){
        try{ syncMotion(); }
        catch{ revealAll(); }
      }
    });
    motionObserver.observe(root,{attributes:true,attributeFilter:['data-r8-motion']});
  }

  function updateScrolledState(){
    scrollRaf = 0;
    root.dataset.fsUiScrolled = window.scrollY > 10 ? '1' : '0';
  }

  function onScroll(){
    if(scrollRaf) return;
    scrollRaf = requestAnimationFrame(updateScrolledState);
  }

  function boot(){
    try{
      root.dataset.fsCinematicUi = '1';
      updateScrolledState();
      window.addEventListener('scroll',onScroll,{passive:true});
      watchMotionMode();
      watchDynamicContent();
      syncMotion();

      /* Dynamic storefront lists render after boot; one light rescan is enough. */
      setTimeout(() => {
        try{ decorate(document); }
        catch{ revealAll(); }
      },700);
    }catch{
      revealAll();
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();