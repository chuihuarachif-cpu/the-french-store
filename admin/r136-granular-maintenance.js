/* THE FRENCH STORE — R141 maintenance compatibility layer.
   The main Admin app already owns the Maintenance panel and its authenticated Supabase client.
   This file intentionally does NOT create a second client or overwrite #maintenanceList.
   It only preserves the existing R137 price-overrides loader. */
(() => {
  'use strict';
  if(document.querySelector('script[data-r137-price-overrides]'))return;
  const script=document.createElement('script');
  script.src='./r137-price-overrides.js?v=20260902-r137';
  script.defer=true;
  script.dataset.r137PriceOverrides='1';
  script.addEventListener('error',()=>console.warn('FRENCH STORE R137 price controls did not load; core Admin remains available.'),{once:true});
  document.head.appendChild(script);
})();
