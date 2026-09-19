/* FRENCH STORE — installable storefront shell + Web Push.
   Only same-origin static shell files are cached. API/Auth/Wallet/order/payment
   requests are never intercepted or cached. */
'use strict';

const CACHE='fs-store-r173-webservices-20260919';
const SHELL=[
  '/v2/',
  '/v2/index.html',
  '/v2/manifest.webmanifest',
  '/v2/assets/brand/icon-192.png',
  '/v2/assets/brand/icon-512.png',
  '/v2/tiers/owner-classic-r7.css',
  '/v2/push-notifications.css',
  '/v2/push-notifications.js',
  '/v2/official-icons.js'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('fs-store-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?.json?.()||{}}catch{
      data={title:'💎 FRENCH STORE 💎',body:event.data?.text?.()||'Tienes una nueva notificación.',url:'/v2/'};
    }
    const title=String(data.title||'💎 FRENCH STORE 💎').slice(0,120);
    const body=String(data.body||'').slice(0,300);
    const url=String(data.url||'/v2/');
    const renewal=/[?&]renew=/.test(url);
    await self.registration.showNotification(title,{
      body,
      icon:data.icon||'/v2/assets/brand/icon-192.png',
      badge:data.badge||'/v2/assets/brand/icon-192.png',
      tag:data.tag||'fs-notification',
      data:{url},
      actions:renewal?[{action:'renew',title:'Renovar ahora'}]:[],
      renotify:false,
      requireInteraction:false
    });
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const raw=event.notification?.data?.url||'/v2/';
    const target=new URL(raw,self.location.origin);
    if(target.origin!==self.location.origin)target.href=new URL('/v2/',self.location.origin).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin!==target.origin)continue;
      try{await client.navigate(target.href)}catch{}
      await client.focus();
      return;
    }
    await self.clients.openWindow(target.href);
  })());
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
      if(cache&&response.ok&&!response.redirected){
        event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
      }
      return response;
    }catch{
      return (await cache?.match(event.request))
        ||(navigation?await cache?.match('/v2/'):null)
        ||Response.error();
    }
  })());
});
