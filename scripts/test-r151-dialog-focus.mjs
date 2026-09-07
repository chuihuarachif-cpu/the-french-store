import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Execute the actual focus controller with a small DOM double; real layout and
// keyboard boundary checks also run in the isolated Chrome visual fixtures.
const runtime=readFileSync('v2/core/runtime.js','utf8');
const source=runtime.slice(runtime.indexOf('const modalFocus='),runtime.indexOf('function loadCart()'));
const listeners={};
let confirmation=false;
const document={activeElement:null,body:{children:[]},addEventListener(type,fn){(listeners[type]??=[]).push(fn);},querySelector(){return confirmation?{}:null;}};
function emit(type,event){for(const fn of listeners[type]||[])fn(event);}
class Element{
  constructor(id,tag='DIV',parent=null){this.id=id;this.tagName=tag;this.parent=parent;this.children=[];this.attrs={};this.isConnected=true;this.inert=false;this.disabled=false;this.tabIndex=tag==='BUTTON'?0:-1;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};parent?.children.push(this);}
  setAttribute(k,v){this.attrs[k]=v;}
  contains(el){return el===this||this.children.some(c=>c.contains(el));}
  closest(){return this.inert?this:this.parent?.closest()||null;}
  getClientRects(){return this.attrs['aria-hidden']==='true'||this.parent&&!this.parent.getClientRects().length?[]:[{}];}
  querySelector(selector){return selector==='h2'?this.children.find(c=>c.tagName==='H2'):this.children.find(c=>c.classes.has('modal-card'));}
  querySelectorAll(){return this.children.flatMap(c=>[c,...c.querySelectorAll()]).filter(c=>c.tagName==='BUTTON'||c.tabIndex>=0);}
  focus(){if(this.closest())return;document.activeElement=this;emit('focusin',{target:this});}
}
const background=new Element('main'),opener=new Element('open','BUTTON',background),preInert=new Element('already-inert');preInert.inert=true;
function makeModal(id){const modal=new Element(id);modal.classes.add('modal');modal.setAttribute('aria-hidden','true');const card=new Element(id+'Card','DIV',modal);card.classes.add('modal-card');new Element('','H2',card);const first=new Element(id+'Close','BUTTON',card),last=new Element(id+'Action','BUTTON',card);return {modal,card,first,last};}
const cart=makeModal('cartModal'),qr=makeModal('qrModal');
document.body.children=[background,preInert,cart.modal,qr.modal];
const context=vm.createContext({document,$:id=>document.body.children.find(c=>c.id===id)});vm.runInContext(source,context);
opener.focus();context.openModal('cartModal');
assert.equal(document.activeElement,cart.card);
assert.equal(cart.card.attrs.role,'dialog');assert.equal(cart.card.attrs['aria-labelledby'],'cartModalTitle');
assert.ok(background.inert&&preInert.inert);
function tab(shiftKey=false){const event={key:'Tab',shiftKey,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};emit('keydown',event);return event;}
assert.ok(tab().defaultPrevented);assert.equal(document.activeElement,cart.first);
assert.ok(tab(true).defaultPrevented);assert.equal(document.activeElement,cart.last);
assert.ok(tab().defaultPrevented);assert.equal(document.activeElement,cart.first);
opener.focus();assert.equal(document.activeElement,cart.first,'Background is inert');
context.openModal('cartModal');context.closeModal('cartModal');
assert.equal(document.activeElement,opener);assert.equal(background.inert,false);assert.equal(preInert.inert,true);
context.openModal('cartModal');cart.last.focus();context.openModal('qrModal');
assert.ok(cart.modal.inert);context.closeModal('qrModal');assert.equal(document.activeElement,cart.last);
confirmation=true;assert.equal(tab(true).defaultPrevented,false,'Existing confirmation owns its keyboard trap');confirmation=false;
context.closeModal('cartModal');assert.equal(document.activeElement,opener);
assert.equal(tab().defaultPrevented,false,'No trap remains after close');
assert.equal(listeners.keydown.length,1);assert.equal(listeners.focusin.length,1);
assert.doesNotMatch(source,/setInterval|MutationObserver|requestAnimationFrame/);
console.log('R151 dialogs: initial focus, Tab/Shift+Tab, inert background, nested restore, confirmation coexistence and listener bounds PASS');
