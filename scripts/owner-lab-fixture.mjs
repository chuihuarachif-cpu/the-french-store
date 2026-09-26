// Builds an isolated copy of the storefront for the owner-lab browser tests.
// It reuses build-visual-fixture.mjs (synthetic Supabase double that rejects all
// writes) and teaches the double three extra read-only behaviours:
//   ?email=...     signed-in account email (default: the QA account)
//   ?verify=...    Supabase Auth getUser(): ok | error | other | slow
//   ?accounts=...  cuentas_en_venta rows: some (default) | none | error
// Never point this at production; it only serves local files.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function buildOwnerLabFixture(output) {
  const repo = path.resolve(new URL('..', import.meta.url).pathname);
  execFileSync(process.execPath, [path.join(repo, 'scripts/build-visual-fixture.mjs'), repo, output], { stdio: 'pipe' });
  const clientPath = path.join(output, 'v2', '__qa-client.js');
  let client = await readFile(clientPath, 'utf8');
  const patches = [
    [
      "const user={id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',",
      "const user={id:'00000000-0000-4000-8000-000000000001',email:params.get('email')||'qa@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z',"
    ],
    [
      'getUser:()=>result({user})',
      "getUser:(token)=>{counters.getUser=(counters.getUser||0)+1;const v=params.get('verify')||'ok';" +
        "if(!currentSession||token!==currentSession.access_token)return result({user:null},{message:'invalid JWT'});" +
        "if(v==='error')return result({user:null},{message:'invalid JWT'});" +
        "if(v==='other')return result({user:{...user,email:'someone@example.invalid'}});" +
        "if(v==='slow')return new Promise(r=>setTimeout(()=>r({data:{user},error:null}),1500));" +
        'return result({user});}'
    ],
    [
      'const tableData={productos:products,',
      "const accountRows=[{id:'qa-acc-1',juego:'Free Fire',titulo:'Cuenta veterana nivel 70',descripcion:'Cuenta de prueba',destacados:[],precio_bs:2800,fotos:['qa/ff-1.webp','qa/ff-2.webp'],estado:'DISPONIBLE',orden:1},{id:'qa-acc-2',juego:'Clash of Clans',titulo:'Ayuntamiento 15',descripcion:'',destacados:[],precio_bs:950,fotos:[],estado:'VENDIDA',orden:2}];" +
      "const tableData={cuentas_en_venta:params.get('accounts')==='none'?[]:accountRows,productos:products,"
    ]
  ];
  for (const [from, to] of patches) {
    if (!client.includes(from)) throw new Error(`Owner-lab fixture patch failed: ${from.slice(0, 60)}`);
    client = client.replace(from, to);
  }
  client = client.replace('const counters={},errors=[]', 'const counters=window.__qaCounters={},errors=[]');
  // Chainable no-op filters used by cuentas-venta.js (neq) plus an error switch.
  client = client.replace('select(){return this;}', "select(){return this;} neq(k,v){this.filters.push(x=>x[k]!==v);return this;}");
  client = client.replace("then(a,b){counters['table:'+this.table]", "then(a,b){if(this.table==='cuentas_en_venta'&&params.get('accounts')==='error')return Promise.resolve({data:null,error:{message:'QA_READ_ERROR'}}).then(a,b);counters['table:'+this.table]");
  // Expose the auth double so tests can emit sign-in/sign-out events.
  client = client.replace('onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})', "onAuthStateChange:(fn)=>{(window.__qaAuthListeners||=[]).push(fn);return {data:{subscription:{unsubscribe(){}}}};}");
  client = client.replace('signOut:async()=>{currentSession=null;return result(null);}', "signOut:async()=>{currentSession=null;(window.__qaAuthListeners||[]).forEach(fn=>fn('SIGNED_OUT',null));return result(null);}");
  for (const marker of ['window.__qaCounters={}', 'neq(k,v)', 'QA_READ_ERROR\'}}).then(a,b)', '__qaAuthListeners||=[]', "fn('SIGNED_OUT',null)"]) {
    if (!client.includes(marker)) throw new Error(`Owner-lab fixture patch failed: ${marker}`);
  }
  await writeFile(clientPath, client);
  return path.join(output, 'v2');
}
