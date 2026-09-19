/* R171 — iconos oficiales dinámicos.
   Lee el registro público actualizado por el Worker y conserva una caché local.
   Si Supabase o Google Play fallan, el catálogo sigue usando los assets locales. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const CACHE_KEY='fs_official_icons_r171';
  const map=Object.create(null);

  function norm(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'');
  }

  function safeUrl(raw,hash){
    try{
      const url=new URL(String(raw||''));
      if(url.protocol!=='https:')return '';
      if(!/(^|\.)googleusercontent\.com$/i.test(url.hostname))return '';
      if(hash)url.searchParams.set('fsicon',String(hash).slice(0,16));
      return url.href;
    }catch{return ''}
  }

  function applyRows(rows){
    for(const row of Array.isArray(rows)?rows:[]){
      const url=safeUrl(row?.icon_url,row?.icon_hash);
      if(!url)continue;
      const keys=[row?.icon_key,...(Array.isArray(row?.aliases)?row.aliases:[])]
        .map(norm).filter(Boolean);
      for(const key of keys)map[key]=url;
    }
    window.FSOfficialIconMap=map;
  }

  function cachedRows(){
    try{
      const parsed=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
      return Array.isArray(parsed?.rows)?parsed.rows:[];
    }catch{return []}
  }

  function persist(rows){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),rows}))}catch{}
  }

  function iconForName(name){
    const key=norm(name);
    if(map[key])return map[key];
    const found=Object.keys(map).find(alias=>key.includes(alias)||alias.includes(key));
    return found?map[found]:'';
  }

  function upgradeRenderedImages(){
    document.querySelectorAll('img[alt]').forEach(img=>{
      const url=iconForName(img.alt);
      if(!url||img.dataset.fsOfficialRegistry===url)return;
      img.dataset.fsOfficialRegistry=url;
      img.referrerPolicy='no-referrer';
      img.src=url;
    });
  }

  async function refresh(){
    const url=new URL(`${SUPABASE_URL}/rest/v1/app_icon_registry`);
    url.searchParams.set('select','icon_key,aliases,icon_url,icon_hash,last_changed_at');
    url.searchParams.set('enabled','eq.true');
    url.searchParams.set('icon_url','not.is.null');
    url.searchParams.set('order','icon_key.asc');

    const response=await fetch(url.toString(),{
      headers:{apikey:SUPABASE_ANON_KEY,Accept:'application/json'},
      cache:'no-store'
    });
    if(!response.ok)throw new Error(`ICON_REGISTRY_HTTP_${response.status}`);
    const rows=await response.json();
    applyRows(rows);
    persist(rows);
    upgradeRenderedImages();
    document.dispatchEvent(new CustomEvent('fs:official-icons-updated',{detail:{count:Array.isArray(rows)?rows.length:0}}));
    return rows;
  }

  applyRows(cachedRows());
  window.FSOfficialIconFor=iconForName;
  window.FSOfficialIconsReady=refresh().catch(()=>{
    upgradeRenderedImages();
    return cachedRows();
  });

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',upgradeRenderedImages,{once:true});
  }else{
    upgradeRenderedImages();
  }
})();
