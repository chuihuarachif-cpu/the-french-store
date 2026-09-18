/* FRENCH STORE — installable storefront shell.
   Only same-origin static shell files are cached. API/Auth/Wallet/order/payment
   requests are never intercepted or cached. */
'use strict';

const CACHE='fs-store-r224-installfix-20260918';
const SHELL=[
  '/v2/','/v2/index.html','/v2/manifest.webmanifest',
  '/v2/assets/brand/icon-192.png','/v2/assets/brand/icon-512.webp',
  '/v2/tiers/owner-classic-r7.css'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fs-store-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  const navigation=event.request.mode==='navigate'&&url.pathname.startsWith('/v2/');
  const staticShell=SHELL.includes(url.pathname);
  if(!navigation&&!staticShell)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE).catch(()=>null);
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(cache&&response.ok&&!response.redirected)event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
      return response;
    }catch{
      return (await cache?.match(event.request))||(navigation?await cache?.match('/v2/'):null)||Response.error();
    }
  })());
});
