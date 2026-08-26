const CACHE='fs-admin-r92-20260826';
const SHELL=['/admin/','/admin/index.html','/admin/app.css?v=20260826-r92','/admin/r89-auth-fix.js?v=20260826-r91','/admin/app.js?v=20260826-r92','/admin/manifest.webmanifest','/v2/assets/brand/icon-192.png','/v2/assets/brand/icon-512.png'];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith('fs-admin-')&&key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin || !url.pathname.startsWith('/admin/')) return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then((response)=>{
    const copy=response.clone();
    caches.open(CACHE).then((cache)=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then((cached)=>cached||caches.match('/admin/'))));
});
