(() => {
  // Keep the Lab's standalone mode when moving between the store and the Arcade.
  const standalone = new URLSearchParams(location.search).has('standalone');
  const back = standalone ? './index.html?standalone=1' : './index.html';
  document.querySelectorAll('#backToStore, #backToStoreBottom').forEach(link => { link.href = back; });
  // French Points: the Lab is isolated from v2, so the balance is never simulated here.
  // The production integration should reuse the existing French Points system.
})();
