/* THE FRENCH STORE — base authentication/session state.
   R145: Google OAuth is the only public sign-in path. Legacy email/password sign-in
   and sign-up are intentionally not implemented in storefront code. Session state,
   sign-out and profile rendering remain here; Google OAuth lives in auth-google.js.
   R92: the storefront no longer exposes an Admin entry point; administration lives
   only in /admin/. */

function publicGoogleAuthOnlyNotice(){
  const message=$('loginMessage');
  if(message)showNotice(message,'Para ingresar a FRENCH STORE usa “Continuar con Google”.','error');
  try{window.FSGoogleAuth?.refresh?.()}catch{}
}

// Compatibility guards for any stale cached markup/listeners. They fail closed instead
// of ever invoking password authentication or account creation from the public store.
async function signIn(){publicGoogleAuthOnlyNotice()}
async function signUp(){publicGoogleAuthOnlyNotice()}

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
    $('openAdmin')?.classList.add('hidden');
  }else{
    $('authButton').textContent='Iniciar sesión';
    $('logoutButton').classList.add('hidden');
    $('openAdmin')?.classList.add('hidden');
  }
  renderProfile();
}

function renderProfile(){
  if(!session){$('profileName').textContent='Cliente';$('profileEmail').textContent='Sin sesión';return}
  $('profileName').textContent=profile?.display_name||'Cliente FRENCH STORE';
  $('profileEmail').textContent=profile?.email||session.user.email||'';
}
