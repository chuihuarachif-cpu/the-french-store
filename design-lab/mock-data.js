window.FS_LAB_DATA = Object.freeze({
  categories: [
    { id: "recargas-id", icon: "🎮", code: "01", tag: "GAMING", accentRgb: "74,229,255", name: "Recargas por ID", subtitle: "Directo al jugador" },
    { id: "recargas-cuenta", icon: "👤", code: "02", tag: "ASISTIDO", accentRgb: "76,166,255", name: "Recargas por Cuenta", subtitle: "Entrega asistida" },
    { id: "giftcards", icon: "🎁", code: "03", tag: "CÓDIGOS", accentRgb: "151,128,255", name: "Gift Cards", subtitle: "Códigos digitales" },
    { id: "streaming", icon: "📺", code: "04", tag: "STREAM", accentRgb: "70,238,211", name: "Plataformas de Streaming", subtitle: "Series, música y más" },
    { id: "cuentas", icon: "🪪", code: "05", tag: "CUENTAS", accentRgb: "103,201,255", name: "Venta de Cuentas", subtitle: "Cuentas listas para usar" },
    { id: "paginas", icon: "💻", code: "06", tag: "WEB", accentRgb: "126,143,255", name: "Venta de Páginas", subtitle: "Diseño web a medida" }
  ],
  products: [
    { id: "p1", icon: "◇", name: "Diamantes Nova · 500", category: "Recargas", price: 49.90, featured: true },
    { id: "p2", icon: "🔥", name: "Fire Coins · 310", category: "Recargas", price: 24.90, featured: true },
    { id: "p3", icon: "▶", name: "Stream Plus · 1 mes", category: "Streaming", price: 35.00, featured: true },
    { id: "p4", icon: "✦", name: "Gift Card · 10 USD", category: "Gift Cards", price: 78.00, featured: true },
    { id: "p5", icon: "⚔", name: "Battle Pass · Elite", category: "Recargas", price: 67.50, featured: false },
    { id: "p6", icon: "♫", name: "Music Premium · 1 mes", category: "Streaming", price: 19.90, featured: false },
    { id: "p7", icon: "◈", name: "Créditos Arena · 1000", category: "Recargas", price: 89.00, featured: false },
    { id: "p8", icon: "▣", name: "Store Card · 15 USD", category: "Gift Cards", price: 114.00, featured: false },
    { id: "p9", icon: "🪪", name: "Cuenta Gaming · Demo", category: "Cuentas", price: 99.00, featured: false },
    { id: "p10", icon: "💻", name: "Landing Page · Demo", category: "Páginas Web", price: 690.00, featured: false }
  ],
  checkout: [
    { icon: "◇", name: "Diamantes Nova · 500", detail: "ID 123456789 · Zona 1234", price: 49.90 },
    { icon: "🔥", name: "Fire Coins · 310", detail: "ID 987654321", price: 24.90 }
  ]
});
