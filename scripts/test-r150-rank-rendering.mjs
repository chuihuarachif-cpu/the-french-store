import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Membership state still refreshes safely, but no longer selects a storefront skin.
const observers=[], timers=[], auth=[], listeners=new Map(), pendingReads=[];
let now=0, calls=0, hold=false;
let pass={theme:'diamond',code:'DIAMANT_BLEU',ends_at:'2030-01-01T00:00:00Z'};
const root={dataset:new Proxy({}, {set(target,key,value){
  target[key]=value;
  if(key==='fsMembership')observers.forEach(fn=>fn([{attributeName:'data-fs-membership'}]));
  return true;
}})};
const document={
  documentElement:root,body:{dataset:{}},readyState:'complete',
  getElementById:id=>id==='fs-loyalty-rank-extras-js'?{}:null,querySelector:()=>null,
  addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);},
  dispatchEvent(event){(listeners.get(event.type)||[]).forEach(fn=>fn(event));}
};
const context=vm.createContext({
  document,console,Date,Intl,Map,Set,Promise,
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
  session:{user:{id:'account-a'}},
  sb:{rpc:async name=>{
    assert.ok(['get_my_loyalty_summary','get_my_loyalty_launch_progress'].includes(name));
    calls++;
    const result={data:name==='get_my_loyalty_summary'?{ok:true,active_pass:pass}:{program_launched:true},error:null};
    return hold?new Promise(resolve=>pendingReads.push(()=>resolve(result))):result;
  },auth:{onAuthStateChange:fn=>auth.push(fn)}},
  MutationObserver:class{constructor(fn){this.fn=fn;}observe(){observers.push(this.fn);}},
  setTimeout:(fn,delay)=>{const t={fn,at:now+delay};timers.push(t);return t;},
  clearTimeout:t=>{if(t)t.cancelled=true;}
});
context.window=context;
for(const name of ['rank-pass-premium.js','rank-pass-premium-ready.js','loyalty.js'])
  vm.runInContext(await readFile('v2/'+name,'utf8'),context,{filename:name});
async function flush(){for(let i=0;i<30;i++)await Promise.resolve();}
async function advance(ms){
  const end=now+ms;await flush();
  while(timers.some(t=>!t.cancelled&&t.at<=end)){
    timers.sort((a,b)=>a.at-b.at);const t=timers.shift();if(t.cancelled)continue;
    now=t.at;t.fn();await flush();
  }
  now=end;
}
function changeUser(id){context.session=id?{user:{id}}:null;auth.forEach(fn=>fn(id?'SIGNED_IN':'SIGNED_OUT',context.session));}
await advance(2000);
assert.equal(root.dataset.fsMembership,'diamond');
assert.ok(calls<=12,'Rank readiness did not settle: '+calls+' reads');
let before=calls;
for(let i=0;i<100;i++)root.dataset.fsMembership='diamond';
await advance(2000);
assert.equal(calls,before,'Visual attributes must never initiate backend reads');
await Promise.all(Array.from({length:12},()=>context.FSRankPremium.refresh()));
assert.equal(calls-before,2,'Concurrent premium refresh must share a fresh read pair');
before=calls;
await Promise.all(Array.from({length:12},()=>context.FSLoyalty.refresh()));
assert.equal(calls-before,2,'Concurrent loyalty refresh must share a fresh read pair');

pass={theme:'gold',code:'ECLAT_OR',ends_at:'2030-02-01T00:00:00Z'};
await context.FSLoyalty.refresh();assert.equal(root.dataset.fsMembership,'gold');
pass={theme:'diamond',code:'DIAMANT_BLEU',ends_at:'2030-03-01T00:00:00Z'};
await context.FSLoyalty.refresh();assert.equal(root.dataset.fsMembership,'diamond');
pass=null;await context.FSLoyalty.refresh();assert.equal(root.dataset.fsMembership,undefined);

pass={theme:'diamond',code:'DIAMANT_BLEU',ends_at:'2030-01-01T00:00:00Z'};
hold=true;const oldPremium=context.FSRankPremium.refresh(),oldLoyalty=context.FSLoyalty.refresh();
changeUser('account-b');hold=false;
pass={theme:'gold',code:'ECLAT_OR',ends_at:'2030-01-01T00:00:00Z'};
await advance(1000);assert.equal(root.dataset.fsMembership,'gold');
pendingReads.splice(0).forEach(resolve=>resolve());await Promise.all([oldPremium,oldLoyalty]);
assert.equal(root.dataset.fsMembership,'gold','Stale account A response replaced B');
hold=true;const loggingOut=context.FSRankPremium.refresh();changeUser(null);
pendingReads.splice(0).forEach(resolve=>resolve());await loggingOut;
assert.equal(root.dataset.fsMembership,undefined,'A late response restored a signed-out rank');
hold=false;changeUser('account-c');await advance(1000);assert.equal(root.dataset.fsMembership,'gold');
pass={...pass,ends_at:'2000-01-01T00:00:00Z'};
await context.FSLoyalty.refresh();assert.equal(root.dataset.fsMembership,undefined,'Expired membership decoration remained active');
before=calls;await advance(10000);assert.equal(calls,before,'A new polling loop was introduced');
console.log('R170: bounded reads, membership status, fresh upgrade/expiry, concurrency and Auth races PASS');

// Visual contract changed in R170: membership is a subtle status label only.
const css=await readFile('v2/rank-pass-premium.css','utf8');
assert.ok(css.includes('GOLD · x1.5 rewards'));
assert.ok(css.includes('DIAMOND · x2 rewards'));
assert.equal(css.includes('html[data-fs-membership="gold"]'),false,'Gold must not reskin the storefront');
assert.equal(css.includes('html[data-fs-membership="diamond"]'),false,'Diamond must not reskin the storefront');
assert.equal(css.includes('@keyframes fsRankRibbonGlint'),false,'legacy rank sweep must stay retired');
assert.equal(css.includes('@keyframes fsDiamondHeroSweep'),false,'legacy Diamond hero sweep must stay retired');
assert.equal(css.includes('will-change'),false,'Rank status must not pin compositor layers');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
console.log('R170: membership status-only presentation contract PASS');
