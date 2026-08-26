/* THE FRENCH STORE — navigation only.
   R92: the old storefront Admin view is retired; /admin/ is the only administrative UI. */
function navigate(view){
  if(view==='admin')view='perfil';
  if(['wallet','pedidos','perfil'].includes(view)&&!session){openModal('authModal');return}
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target=$(`view-${view}`);
  if(target)target.classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
  window.scrollTo({top:0,behavior:'auto'});
  if(view==='wallet')loadWallet();
  if(view==='pedidos')loadOrders();
  if(view==='perfil')renderProfile();
}
