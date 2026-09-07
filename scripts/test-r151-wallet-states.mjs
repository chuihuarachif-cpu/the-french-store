import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync('v2/features/wallet.js','utf8');
const ids=['walletBalance','walletStatus','topupHistory','walletHistory'];
const elements=Object.fromEntries(ids.map(id=>[id,{textContent:'',innerHTML:'',dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;}}]));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const ok=data=>({data,error:null});
const failure={data:null,error:{message:'PRIVATE_BACKEND_DIAGNOSTIC'}};
let responses,reads=[];
const context=vm.createContext({
  session:{user:{id:'account-a'}},$:id=>elements[id],esc,
  money:n=>'Bs '+Number(n).toFixed(2),dateFmt:()=>'',statusHtml:()=>'',
  document:{querySelectorAll:()=>[]},
  sb:{
    rpc(name){assert.equal(name,'get_my_wallet_balance','No financial writes');reads.push(name);return responses.balance;},
    from(table){assert.ok(['wallet_accounts','wallet_topup_requests','wallet_transactions'].includes(table));const response=responses[table];const q={select(){return q;},eq(k,v){assert.equal(k,'user_id');assert.equal(v,context.session.user.id);return q;},order(){return q;},limit(){return q;},maybeSingle(){return q;},then(a,b){reads.push(table);return Promise.resolve(response).then(a,b);}};return q;}
  }
});
vm.runInContext(source,context);
function defaults(balance=0){responses={balance:ok(balance),wallet_accounts:ok({status:'ACTIVE',currency:'BOB'}),wallet_topup_requests:ok([]),wallet_transactions:ok([])};}
function snapshot(){return JSON.stringify(elements);}
let release;
defaults();responses.balance=new Promise(resolve=>{release=resolve;});
const loading=context.loadWallet();
assert.equal(elements.walletBalance.textContent,'—');
assert.equal(elements.walletBalance.dataset.state,'loading');
assert.equal(elements.walletBalance.attributes['aria-busy'],'true');
assert.equal(elements.walletHistory.dataset.state,'loading');
release(ok(0));await loading;
assert.equal(elements.walletBalance.textContent,'Bs 0.00');
assert.equal(elements.walletBalance.dataset.state,'ready');
assert.equal(elements.walletHistory.dataset.state,'empty');
assert.match(elements.walletHistory.innerHTML,/Aún no tienes movimientos/);
assert.equal(elements.topupHistory.dataset.state,'empty');

defaults('70.30');responses.wallet_transactions=ok([{description:'<img onerror=attack()>',amount:70.30}]);await context.loadWallet();
assert.equal(elements.walletBalance.textContent,'Bs 70.30');
assert.equal(elements.walletHistory.dataset.state,'ready');
assert.match(elements.walletHistory.innerHTML,/&lt;img/);
assert.doesNotMatch(elements.walletHistory.innerHTML,/<img/);

for(const invalid of [failure,ok(null),ok(''),ok(false),ok('not-a-balance'),ok(Infinity)]){
  defaults();responses.balance=invalid;await context.loadWallet();
  assert.equal(elements.walletBalance.textContent,'—');
  assert.equal(elements.walletBalance.dataset.state,'error');
  assert.match(elements.walletStatus.textContent,/No pudimos cargar el saldo/);
  assert.doesNotMatch(snapshot(),/PRIVATE_BACKEND_DIAGNOSTIC/);
}
defaults(12.34);responses.wallet_transactions=failure;responses.wallet_topup_requests=failure;await context.loadWallet();
assert.equal(elements.walletBalance.textContent,'Bs 12.34');
assert.equal(elements.walletHistory.dataset.state,'error');
assert.equal(elements.topupHistory.dataset.state,'error');
assert.doesNotMatch(elements.walletHistory.innerHTML,/Aún no tienes/);
defaults(12.34);responses.wallet_transactions=Promise.reject(new Error('PRIVATE_BACKEND_DIAGNOSTIC'));await context.loadWallet();
assert.equal(elements.walletHistory.dataset.state,'error');
assert.equal(elements.walletBalance.textContent,'Bs 12.34');

defaults(5);responses.wallet_accounts=failure;await context.loadWallet();
assert.equal(elements.walletBalance.textContent,'Bs 5.00');
assert.match(elements.walletStatus.textContent,/No pudimos cargar el estado/);

// Out-of-order reads must never replace a fresher balance or another account.
defaults();responses.balance=new Promise(resolve=>{release=resolve;});const old=context.loadWallet();
defaults(8.76);await context.loadWallet();release(ok(999));await old;
assert.equal(elements.walletBalance.textContent,'Bs 8.76');
defaults();responses.balance=new Promise(resolve=>{release=resolve;});const accountA=context.loadWallet();
context.session={user:{id:'account-b'}};defaults(4.32);await context.loadWallet();release(ok(999));await accountA;
assert.equal(elements.walletBalance.textContent,'Bs 4.32');
defaults();responses.balance=new Promise(resolve=>{release=resolve;});const signedOut=context.loadWallet();
context.session=null;await context.loadWallet();release(ok(999));await signedOut;
assert.equal(elements.walletBalance.textContent,'—');
assert.equal(elements.walletBalance.dataset.state,'unavailable');
assert.equal(elements.walletBalance.attributes['aria-busy'],'false');
assert.ok(reads.length>20);
console.log('R151 Wallet: loading, zero, cents, errors, empty history, escaped rows and stale/Auth races PASS; reads only');
