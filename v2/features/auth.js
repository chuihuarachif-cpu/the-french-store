/* THE FRENCH STORE — base authentication/session state.
   Friendly confirmation/recovery UX remains in its dedicated auth modules. */
async function signIn(){
  hideNotice($('loginMessage'));
  const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
  if(!email||!password){showNotice($('loginMessage'),'Completa correo y contraseña.','error');return}
  const{error}=await sb.auth.signInWithPassword({email,password});
  if(error){showNotice($('loginMessage'),'No se pudo iniciar sesión. Revisa tus datos.','error');return}
  closeModal('authModal');
}
async function signUp(){
  hideNotice($('loginMessage'));
  const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
  if(!email||password.length<8){showNotice($('loginMessage'),'Usa un correo válido y una contraseña de al menos 8 caracteres.','error');return}
  const{data,error}=await sb.auth.signUp({email,password});
  if(error){showNotice($('loginMessage'),error.message,'error');return}
  if(data.session)closeModal('authModal');else showNotice($('loginMessage'),'Cuenta creada. Revisa tu correo si se solicita confirmación.','success');
}
async function signOut(){await sb.auth.signOut();navigate('inicio')}
async function refreshSession(newSession=null){
  session=newSession??(await sb.auth.getSession()).data.session;
  profile=null;admin=false;
  if(session){
    const[{data:p},{data:a}]=await Promise.all([
      sb.from('profiles').select('id,email,display_name').eq('id',session.user.id).maybeSingle(),
      sb.rpc('is_admin')
    ]);
    profile=p||{email:session.user.email,display_name:null};admin=a===true;
    $('authButton').textContent=profile.display_name||profile.email||'Mi cuenta';
    $('logoutButton').classList.remove('hidden');
    $('openAdmin').classList.toggle('hidden',!admin);
  }else{
    $('authButton').textContent='Iniciar sesión';
    $('logoutButton').classList.add('hidden');
    $('openAdmin').classList.add('hidden');
  }
  renderProfile();
}
function renderProfile(){
  if(!session){$('profileName').textContent='Cliente';$('profileEmail').textContent='Sin sesión';return}
  $('profileName').textContent=profile?.display_name||'Cliente FRENCH STORE';
  $('profileEmail').textContent=profile?.email||session.user.email||'';
}
