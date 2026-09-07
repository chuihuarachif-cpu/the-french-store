import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync('admin/r139-quotations.js','utf8');
let reply={data:{ok:true,fx:9.27,fx_raw:9.02,fx_buffer:.25,sale_price:21.99},error:null},calls=0;
const ctx=vm.createContext({window:{supabase:{createClient:()=>({rpc(name){assert.equal(name,'admin_app_quote_sale_price');calls++;return Promise.resolve(reply);}})},crypto:{randomUUID:()=>Math.random().toString()},setTimeout:()=>1,clearTimeout(){}},document:{getElementById:()=>null,querySelector:()=>null},localStorage:{getItem:()=>null,setItem(){}},CSS:{escape:s=>s}});
vm.runInContext(source.slice(0,source.indexOf("  if(document.readyState==='loading')"))+`globalThis.qa={compact,rateMarkup,loadUsdRate,calculate,scheduleCalculate,copyLine};})();`,ctx);
const qa=ctx.qa;
assert.equal(qa.compact(null),'—');assert.equal(qa.compact(0),'0');assert.equal(qa.compact(21.99),'21.99');
assert.match(qa.rateMarkup('USD'),/Consultando/);assert.doesNotMatch(qa.rateMarkup('USD'),/Bs 0/);
await qa.loadUsdRate();assert.equal(calls,1,'Null must trigger the initial USD read');assert.match(qa.rateMarkup('USD'),/9[,.]27/);
await qa.loadUsdRate();assert.equal(calls,2,'A new visit refreshes the rate instead of caching it permanently');
let release;reply=new Promise(resolve=>{release=resolve;});const rate=qa.loadUsdRate();const second=qa.loadUsdRate();
assert.equal(calls,3,'Concurrent USD reads are coalesced');release({data:{ok:true,fx:10,fx_raw:10,fx_buffer:0},error:null});await Promise.all([rate,second]);
assert.match(qa.rateMarkup('USD'),/colchón Bs 0[,.]00/,'A real zero buffer remains valid');
for(const data of [null,{ok:true,fx:null},{ok:true,fx:0}]){reply={data,error:null};await qa.loadUsdRate();assert.match(qa.rateMarkup('USD'),/No se pudo/);assert.doesNotMatch(qa.rateMarkup('USD'),/USD operativo/);}
const item={id:'qa',name:'Paquete',cost:'19.99',result:null,error:'',requestId:0};
reply={data:{ok:true,sale_price:21.99,margin:2,cost_bob:19.99},error:null};await qa.calculate('BS',item);
assert.equal(qa.copyLine(item),'Paquete → 21.99 Bs 💸','The browser preserves the RPC cent value');
reply=new Promise(resolve=>{release=resolve;});const stale=qa.calculate('BS',item);item.cost='';qa.scheduleCalculate('BS',item);
release({data:{ok:true,sale_price:21.99},error:null});await stale;assert.equal(item.result,null,'Clearing input invalidates an in-flight result immediately');
reply={data:{ok:true,sale_price:null},error:null};item.cost='10';await qa.calculate('BS',item);assert.match(item.error,/No se pudo/);assert.equal(qa.copyLine(item),'');
assert.deepEqual([...source.matchAll(/rpc\('([^']+)'/g)].map(m=>m[1]),['admin_app_quote_sale_price','admin_app_quote_sale_price']);

const handlers={},entries=new Map(),put=[],removed=[];
const key=request=>typeof request==='string'?request:request.url;
let online=true,cacheAvailable=true,status=200,mime='text/javascript';
const cache={addAll:async paths=>{assert.ok(paths.every(p=>!p.includes('api')));},put:async(request,response)=>{put.push(key(request));entries.set(key(request),response);},match:async request=>entries.get(key(request))};
const sw=vm.createContext({self:{addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},location:{origin:'https://frenchstorebo.com'},URL,Response,Set,caches:{open:async()=>{if(!cacheAvailable)throw new Error('UNAVAILABLE');return cache;},keys:async()=>['fs-admin-r92-20260826','fs-admin-r154-20260907','other-app'],delete:async name=>removed.push(name)},fetch:async(_r,options)=>{assert.equal(options.cache,'no-store');if(!online)throw new Error('OFFLINE');return new Response('asset',{status,headers:{'content-type':mime}});}});
vm.runInContext(readFileSync('admin/sw.js','utf8'),sw);
async function request(path,method='GET',mode='cors'){
  const waits=[];let response;handlers.fetch({request:{url:new URL(path,'https://frenchstorebo.com').href,method,mode},waitUntil:p=>waits.push(p),respondWith:p=>{response=p;}});
  const value=await response;await Promise.all(waits);return value;
}
assert.equal(await request('https://example.invalid/private'),undefined);
for(const path of ['/admin/private.json','/admin/api/orders','/v2/precios','/admin/debug.js.map'])assert.equal(await request(path),undefined);
assert.equal(await request('/admin/app.js','POST'),undefined);
await request('/admin/app.js?v=new');assert.equal(put.length,1);
status=500;await request('/admin/app.js?v=error');assert.equal(put.length,1,'Error responses are not cached');
status=200;mime='text/html';await request('/admin/app.js?v=wrong-mime');assert.equal(put.length,1,'HTML cannot replace cached JS');
online=false;entries.set('/admin/',new Response('<html>shell</html>',{headers:{'content-type':'text/html'}}));
assert.equal((await request('/admin/app.js?v=missing')).type,'error','Offline JS must never receive the HTML shell');
assert.equal(await (await request('/admin/app.js?v=new')).text(),'asset');
assert.match(await (await request('/admin/','GET','navigate')).text(),/shell/);
online=true;cacheAvailable=false;assert.equal((await request('/admin/app.js')).status,200,'Unavailable Cache Storage cannot prevent a network read');
let activation;handlers.activate({waitUntil:p=>{activation=p;}});await activation;assert.deepEqual(removed,['fs-admin-r92-20260826']);
console.log('R154: USD null/error/freshness/coalescing, quote cents/races, read-only RPCs and SW network/cache/MIME/error isolation PASS');
