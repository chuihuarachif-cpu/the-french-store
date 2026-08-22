/* THE FRENCH STORE — navigation only. */
function navigate(view){
  if(['wallet','pedidos','perfil'].includes(view)&&!session){openModal('authModal');return}
  if(view==='admin'&&!admin)return;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target=$(`view-${view}`);
  if(target)target.classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
  window.scrollTo({top:0,behavior:'auto'});
  if(view==='wallet')loadWallet();
  if(view==='pedidos')loadOrders();
  if(view==='perfil')renderProfile();
  if(view==='admin')loadAdmin();
}
