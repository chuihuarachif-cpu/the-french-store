(() => {
  'use strict';

  const root = document.documentElement;
  const asset = './assets/brand/premium-feature-clash-final-r205.png';
  const selector = [
    '#featuredList [data-r6-feature="Clash Of Clans"]>img',
    '#featuredList [data-r6-feature="Clash of Clans"]>img',
    '#featuredList [data-r6-feature="Clash of Clans (Sin Bonus)"]>img'
  ].join(',');

  function isPremium(){
    const tier = String(root.dataset.fsTier || '').toLowerCase();
    return tier === 'gold' || tier === 'diamond';
  }

  function apply(){
    if (!isPremium()) return;
    document.querySelectorAll(selector).forEach((img) => {
      const desired = new URL(asset, document.baseURI).href;
      if (img.src !== desired) img.src = asset;
      img.dataset.fsR205Clash = '1';
      img.removeAttribute('data-r8-official-logo');
    });
  }

  const observer = new MutationObserver(apply);
  const start = () => {
    const list = document.getElementById('featuredList');
    if (list) observer.observe(list, { childList:true, subtree:true });
    apply();
    setTimeout(apply, 250);
    setTimeout(apply, 1000);
    setTimeout(apply, 2500);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
