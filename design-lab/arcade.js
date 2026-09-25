(() => {
  // Keep the Lab's standalone mode when moving between the store and the Arcade.
  const standalone = !new URLSearchParams(location.search).has('panel'); // Lab default = full-screen store; ?panel opens the device-test panel
  const back = './index.html';
  document.querySelectorAll('#backToStore, #backToStoreBottom').forEach(link => { link.href = back; });
  // French Points: the Lab is isolated from v2, so the balance is never simulated here.
  // The production integration should reuse the existing French Points system.
})();
