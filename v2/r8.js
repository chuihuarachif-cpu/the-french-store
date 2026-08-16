/* THE FRENCH STORE — Revision 8 visual motion layer
   Presentation only. Does not override Auth, Wallet, cart, checkout, QR, orders or Admin logic. */
(() => {
  'use strict';

  const root = document.documentElement;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const saveData = connection?.saveData === true;
  const lowMemory = Number(navigator.deviceMemory || 4) <= 2;
  const lowCpu = Number(navigator.hardwareConcurrency || 4) <= 2;
  const motionMode = reduced ? 'off' : (saveData || lowMemory || lowCpu ? 'lite' : 'full');

  root.dataset.r8Motion = motionMode;

  const PROFILES = [
    { keys:['wutheringwaves'], effect:'gacha', a:'#6ff7ff', b:'#9b78ff' },
    { keys:['genshinimpact'], effect:'gacha', a:'#78e7ff', b:'#ffd36b' },
    { keys:['honkaistarrail'], effect:'gacha', a:'#a887ff', b:'#67e7ff' },
    { keys:['zenlesszonezero'], effect:'gacha', a:'#dbff4f', b:'#5de6ff' },

    { keys:['mobilelegendsbangbang','mobilelegends'], effect:'moba', a:'#61cfff', b:'#f7cf66' },
    { keys:['honorofkings'], effect:'moba', a:'#ffbd59', b:'#ef6d63' },
    { keys:['magicchessgogo','magicchess'], effect:'moba', a:'#ad7cff', b:'#55eaff' },
    { keys:['teamfighttactics'], effect:'moba', a:'#6feeff', b:'#a77cff' },

    { keys:['freefire'], effect:'shooter', a:'#ff9c45', b:'#ffe36a' },
    { keys:['pubgmobile'], effect:'shooter', a:'#ffb34b', b:'#6fb8ff' },
    { keys:['bloodstrike'], effect:'shooter', a:'#ff5d55', b:'#ff9c45' },
    { keys:['deltaforce'], effect:'shooter', a:'#a6ff62', b:'#5be5df' },
    { keys:['arenabreakout'], effect:'shooter', a:'#b7c46a', b:'#d4ad64' },
    { keys:['standoff2'], effect:'shooter', a:'#ff685f', b:'#f0bb62' },
    { keys:['marvelrivals'], effect:'shooter', a:'#ff5252', b:'#58e4ff' },
    { keys:['fortnite'], effect:'shooter', a:'#b274ff', b:'#59ddff' },

    { keys:['asphaltlegends','asphalt'], effect:'racing', a:'#ff9d45', b:'#55e6ff' },

    { keys:['minecraft'], effect:'sandbox', a:'#72d66d', b:'#d2a25f' },
    { keys:['roblox'], effect:'sandbox', a:'#f4f7fb', b:'#61e7ff' },

    { keys:['clashofclans','clashroyale'], effect:'strategy', a:'#efc56b', b:'#67d7ed' },
    { keys:['leagueoflegends'], effect:'competitive', a:'#d9b65f', b:'#5edfd6' },
    { keys:['valorant'], effect:'competitive', a:'#ff5f70', b:'#6eeaf0' },

    { keys:['steam'], effect:'digital', a:'#5ccfff', b:'#7f8dff' },
    { keys:['tiktok'], effect:'digital', a:'#54f3ec', b:'#ff5b8f' },
    { keys:['netflix'], effect:'digital', a:'#ff4c4c', b:'#d91f2a' },
    { keys:['disneypremium','disneyplus','disney'], effect:'digital', a:'#6b9cff', b:'#7ee8ff' },
    { keys:['crunchyroll'], effect:'digital', a:'#ff9b45', b:'#ffd074' },
    { keys:['hbomax','max'], effect:'digital', a:'#9c65ff', b:'#5de7ff' },
    { keys:['primevideo'], effect:'digital', a:'#65cfff', b:'#76e8ff' },
    { keys:['spotify'], effect:'digital', a:'#64e77d', b:'#55d9cb' },
    { keys:['vixplus','vix'], effect:'digital', a:'#ff5ac8', b:'#9d62ff' },
    { keys:['flujotv','flujo'], effect:'digital', a:'#5de8ff', b:'#4e8cff' },
    { keys:['magistvpro','magis'], effect:'digital', a:'#7fe5ff', b:'#b56cff' }
  ];

  function norm(value){
    if(typeof normalize === 'function') return normalize(value);
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'');
  }

  function profileFor(name){
    const k = norm(name);
    return PROFILES.find(p => p.keys.some(key => k.includes(key) || key.includes(k))) ||
      { effect:'default', a:'#61e9f8', b:'#7d87ff' };
  }

  function gameNameFrom(el){
    if(!el) return '';
    return el.dataset.r6Game ||
      el.dataset.r6Feature ||
      el.querySelector('img[alt]')?.alt ||
      el.querySelector('h3,strong,b')?.textContent?.trim() ||
      '';
  }

  const BRAND_SVGS = {
    leagueoflegends: { label:'LEAGUE', sub:'OF LEGENDS', bg1:'#071b23', bg2:'#102f38', fg:'#d9b65f', mark:'L' },
    valorant: { label:'VALORANT', sub:'', bg1:'#17191e', bg2:'#23262e', fg:'#ff5968', mark:'V' },
    marvelrivals: { label:'MARVEL', sub:'RIVALS', bg1:'#210e13', bg2:'#5c111b', fg:'#ffffff', mark:'M' },
    netflix: { label:'NETFLIX', sub:'', bg1:'#080808', bg2:'#1b0a0c', fg:'#e50914', mark:'N' },
    disneypremium: { label:'Disney+', sub:'PREMIUM', bg1:'#071b48', bg2:'#12377a', fg:'#f7fbff', mark:'D' },
    crunchyroll: { label:'CRUNCHYROLL', sub:'', bg1:'#1c1209', bg2:'#5c2d0a', fg:'#f78b22', mark:'C' },
    hbomax: { label:'MAX', sub:'HBO', bg1:'#130b27', bg2:'#43208e', fg:'#ffffff', mark:'M' },
    primevideo: { label:'prime', sub:'VIDEO', bg1:'#071723', bg2:'#123852', fg:'#62c8ff', mark:'P' },
    spotify: { label:'SPOTIFY', sub:'', bg1:'#07170c', bg2:'#0c3d20', fg:'#1ed760', mark:'S' },
    vixplus: { label:'ViX', sub:'PLUS', bg1:'#26051f', bg2:'#741051', fg:'#ff55c3', mark:'V' },
    flujotv: { label:'FLUJO', sub:'TV', bg1:'#071a24', bg2:'#103c55', fg:'#5ce7ff', mark:'F' },
    magistvpro: { label:'MAGIS', sub:'TV PRO', bg1:'#170b27', bg2:'#47206c', fg:'#c987ff', mark:'M' }
  };

  function brandSpec(name){
    const k = norm(name);
    const exact = BRAND_SVGS[k];
    if(exact) return exact;
    const found = Object.entries(BRAND_SVGS).find(([key]) => k.includes(key) || key.includes(k));
    return found?.[1] || null;
  }

  function svgBrandData(name){
    const s = brandSpec(name);
    if(!s) return '';
    const label = String(s.label).replace(/[&<>\"]/g,'');
    const sub = String(s.sub).replace(/[&<>\"]/g,'');
    const mark = String(s.mark).replace(/[&<>\"]/g,'');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${s.bg1}"/><stop offset="1" stop-color="${s.bg2}"/></linearGradient>
        <radialGradient id="r" cx=".72" cy=".18" r=".75"><stop stop-color="${s.fg}" stop-opacity=".23"/><stop offset=".7" stop-color="${s.fg}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="512" height="512" rx="104" fill="url(#g)"/>
      <rect x="13" y="13" width="486" height="486" rx="92" fill="none" stroke="${s.fg}" stroke-opacity=".24" stroke-width="7"/>
      <rect width="512" height="512" rx="104" fill="url(#r)"/>
      <circle cx="256" cy="212" r="118" fill="${s.fg}" fill-opacity=".08" stroke="${s.fg}" stroke-opacity=".38" stroke-width="6"/>
      <text x="256" y="246" text-anchor="middle" fill="${s.fg}" font-family="Arial,sans-serif" font-size="142" font-weight="900">${mark}</text>
      <text x="256" y="381" text-anchor="middle" fill="#f8fbff" font-family="Arial,sans-serif" font-size="${label.length > 9 ? 34 : 43}" font-weight="900" letter-spacing="2">${label}</text>
      ${sub ? `<text x="256" y="423" text-anchor="middle" fill="${s.fg}" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="5">${sub}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function enhanceFallbackImages(scope){
    scope.querySelectorAll?.('img[alt]').forEach(img => {
      const better = svgBrandData(img.alt);
      if(!better) return;
      const src = String(img.getAttribute('src') || '');
      if(src.startsWith('data:image/svg+xml')) {
        img.src = better;
        img.dataset.r8Brand = '1';
      }
    });
  }

  function applyProfile(el, name){
    if(!el || el.dataset.r8Decorated === '1') return;
    const p = profileFor(name);
    el.dataset.r8Effect = p.effect;
    el.style.setProperty('--r8-a', p.a);
    el.style.setProperty('--r8-b', p.b);
    el.dataset.r8Decorated = '1';
  }

  function decorateCards(scope=document){
    scope.querySelectorAll?.('.r6-game-card,.r6-feature-card').forEach(card => {
      applyProfile(card, gameNameFrom(card));
    });
  }

  function effectMarkup(effect){
    switch(effect){
      case 'gacha':
        return `<span class="r8-orb o1"></span><span class="r8-orb o2"></span><span class="r8-spark s1">✦</span><span class="r8-spark s2">✧</span><span class="r8-spark s3">✦</span><span class="r8-ribbon"></span>`;
      case 'moba':
        return `<span class="r8-rune r1"></span><span class="r8-rune r2"></span><span class="r8-arc a1"></span><span class="r8-spark s1">✦</span><span class="r8-spark s2">✧</span>`;
      case 'shooter':
        return `<span class="r8-smoke sm1"></span><span class="r8-smoke sm2"></span><span class="r8-tracer t1"></span><span class="r8-tracer t2"></span><span class="r8-reticle"></span>`;
      case 'racing':
        return `<span class="r8-speed v1"></span><span class="r8-speed v2"></span><span class="r8-speed v3"></span><span class="r8-speed v4"></span><span class="r8-road"></span>`;
      case 'sandbox':
        return `<span class="r8-block b1"></span><span class="r8-block b2"></span><span class="r8-block b3"></span><span class="r8-block b4"></span><span class="r8-pixel-grid"></span>`;
      case 'strategy':
        return `<span class="r8-rune r1"></span><span class="r8-rune r2"></span><span class="r8-ember e1"></span><span class="r8-ember e2"></span><span class="r8-ember e3"></span>`;
      case 'competitive':
        return `<span class="r8-chevron c1"></span><span class="r8-chevron c2"></span><span class="r8-line l1"></span><span class="r8-line l2"></span>`;
      case 'digital':
        return `<span class="r8-eq q1"></span><span class="r8-eq q2"></span><span class="r8-eq q3"></span><span class="r8-eq q4"></span><span class="r8-digital-scan"></span>`;
      default:
        return `<span class="r8-orb o1"></span><span class="r8-orb o2"></span>`;
    }
  }

  function decorateDetail(scope=document){
    const detail = scope.matches?.('.r6-game-detail') ? scope : scope.querySelector?.('.r6-game-detail');
    if(!detail) return;
    const name = detail.querySelector('h3')?.textContent?.trim() || detail.querySelector('img[alt]')?.alt || '';
    applyProfile(detail, name);
    const p = profileFor(name);
    const hero = detail.querySelector('.r6-hero');
    if(!hero || hero.querySelector('.r8-motion-layer')) return;
    hero.dataset.r8Effect = p.effect;
    hero.style.setProperty('--r8-a', p.a);
    hero.style.setProperty('--r8-b', p.b);
    const layer = document.createElement('div');
    layer.className = 'r8-motion-layer';
    layer.setAttribute('aria-hidden','true');
    layer.innerHTML = effectMarkup(p.effect);
    hero.append(layer);
    observeVisibility(hero);
  }

  let intersectionObserver = null;
  function observeVisibility(el){
    if(motionMode === 'off') return;
    if(!('IntersectionObserver' in window)) {
      el.dataset.r8Active = '1';
      return;
    }
    intersectionObserver ||= new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.dataset.r8Active = entry.isIntersecting ? '1' : '0';
      });
    }, { rootMargin:'120px 0px', threshold:0.02 });
    intersectionObserver.observe(el);
  }

  function decorate(scope=document){
    enhanceFallbackImages(scope);
    decorateCards(scope);
    decorateDetail(scope);
  }

  let scheduled = false;
  function scheduleDecorate(scope=document){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate(scope);
    });
  }

  const observer = new MutationObserver(mutations => {
    for(const m of mutations){
      for(const node of m.addedNodes){
        if(node.nodeType === 1) scheduleDecorate(node);
      }
    }
    scheduleDecorate(document);
  });

  function boot(){
    decorate(document);
    ['catalogList','featuredList'].forEach(id => {
      const target = document.getElementById(id);
      if(target) observer.observe(target,{childList:true,subtree:true});
    });
    document.addEventListener('visibilitychange', () => {
      root.dataset.r8Paused = document.hidden ? '1' : '0';
    });
    root.dataset.r8Ready = '1';
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
