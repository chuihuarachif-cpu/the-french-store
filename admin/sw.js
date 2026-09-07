/* Static Admin shell only. Private API responses never enter Cache Storage. */
const CACHE='fs-admin-r154-20260907';
const SHELL=['/admin/','/admin/index.html','/admin/manifest.webmanifest','/v2/assets/brand/icon-192.png','/v2/assets/brand/icon-512.png'];
const STATIC=new Set(['app.css','app.js','r89-auth-fix.js','r93-maintenance-admin.css','r142-maintenance-main-grid.css','r142-maintenance-main-grid.js','r139-quotations.css','r139-quotations.js','r136-granular-maintenance.js','r137-price-overrides.js','r138-account-cost-editor.js','r154-accessibility.css','r154-dialog-focus.js','maintenance.html','maintenance.css','maintenance.js','manifest.webmanifest'].map(name=>'/admin/'+name));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fs-admin-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  const navigation=event.request.mode==='navigate'&&['/admin/','/admin/index.html','/admin/maintenance.html'].includes(url.pathname);
  if(!navigation&&!STATIC.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE).catch(()=>null);
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      const type=response.headers.get('content-type')||'';
      const expected=navigation?'text/html':url.pathname.endsWith('.js')?'javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.html')?'text/html':'json';
      if(cache&&response.ok&&!response.redirected&&type.includes(expected))event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
      return response;
    }catch{
      const cached=await cache?.match(event.request);
      // Only the equivalent root document is interchangeable; never give HTML to JS.
      return cached||(navigation&&url.pathname!=='/admin/maintenance.html'?await cache?.match('/admin/'):null)||Response.error();
    }
  })());
});
