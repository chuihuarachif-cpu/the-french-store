window.FS_LAB_DATA = Object.freeze({
  categories: [
    { id: "recargas-id", icon: "🎮", name: "Recargas por ID", subtitle: "Diamantes, monedas y pases" },
    { id: "recargas-cuenta", icon: "👤", name: "Recargas por Cuenta", subtitle: "Flujos asistidos de ejemplo" },
    { id: "streaming", icon: "📺", name: "Streaming", subtitle: "Entretenimiento y música" },
    { id: "giftcards", icon: "🎁", name: "Gift Cards", subtitle: "Códigos digitales de muestra" }
  ],
  products: [
    { id: "p1", icon: "◇", name: "Diamantes Nova · 500", category: "Recargas", price: 49.90, featured: true },
    { id: "p2", icon: "🔥", name: "Fire Coins · 310", category: "Recargas", price: 24.90, featured: true },
    { id: "p3", icon: "▶", name: "Stream Plus · 1 mes", category: "Streaming", price: 35.00, featured: true },
    { id: "p4", icon: "✦", name: "Gift Card · 10 USD", category: "Gift Cards", price: 78.00, featured: true },
    { id: "p5", icon: "⚔", name: "Battle Pass · Elite", category: "Recargas", price: 67.50, featured: false },
    { id: "p6", icon: "♫", name: "Music Premium · 1 mes", category: "Streaming", price: 19.90, featured: false },
    { id: "p7", icon: "◈", name: "Créditos Arena · 1000", category: "Recargas", price: 89.00, featured: false },
    { id: "p8", icon: "▣", name: "Store Card · 15 USD", category: "Gift Cards", price: 114.00, featured: false }
  ],
  checkout: [
    { icon: "◇", name: "Diamantes Nova · 500", detail: "ID 123456789 · Zona 1234", price: 49.90 },
    { icon: "🔥", name: "Fire Coins · 310", detail: "ID 987654321", price: 24.90 }
  ]
});
