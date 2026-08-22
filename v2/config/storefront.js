/* THE FRENCH STORE — public storefront configuration.
   Presentation/config only. Prices, provider routing and availability remain in Supabase/backend. */
const STOREFRONT_CONFIG = Object.freeze({
  whatsapp: '59177057379',
  categories: Object.freeze(['Recargas por ID','Recargas por Cuenta','Streaming','Gift Cards']),
  featuredPriority: Object.freeze(['Mobile Legends','Free Fire','PUBG','Clash','Wuthering']),
  gameIcons: Object.freeze({
    arenabreakout:'assets/apps/arena-breakout.webp',
    asphaltlegends:'assets/apps/asphalt-legends.webp',
    bloodstrike:'assets/apps/blood-strike.webp',
    deltaforce:'assets/apps/delta-force.webp',
    freefire:'assets/apps/free-fire.webp',
    genshinimpact:'assets/apps/genshin-impact.webp',
    honkaistarrail:'assets/apps/honkai-star-rail.webp',
    honorofkings:'assets/apps/honor-of-kings.webp',
    magicchess:'assets/apps/magic-chess.webp',
    mobilelegendsbangbang:'assets/apps/mobile-legends.webp',
    pubgmobile:'assets/apps/pubg-mobile.webp',
    wutheringwaves:'assets/apps/wuthering-waves.webp',
    zenlesszonezero:'assets/apps/zenless-zone-zero.webp',
    clashofclans:'assets/apps/clash-of-clans.webp',
    clashroyale:'assets/apps/clash-royale.webp',
    fortnite:'assets/apps/fortnite.webp',
    roblox:'assets/apps/roblox.webp',
    tiktok:'assets/apps/tiktok.webp',
    steam:'assets/apps/steam.webp',
    minecraft:'assets/apps/minecraft.webp',
    standoff2:'assets/apps/standoff-2.webp',
    teamfighttactics:'assets/apps/teamfight-tactics.webp'
  })
});
window.FSStorefrontConfig = STOREFRONT_CONFIG;
