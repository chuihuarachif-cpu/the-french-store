/* THE FRENCH STORE — public storefront configuration.
   Presentation/config only. Prices, provider routing and availability remain in Supabase/backend.
   R124: local artwork URLs carry a revision token so mobile browsers do not keep stale 404/image responses. */
const STOREFRONT_ASSET_REVISION = '20260829-r124';
const storefrontAppAsset = (filename) => `assets/apps/${filename}.webp?v=${STOREFRONT_ASSET_REVISION}`;

const STOREFRONT_CONFIG = Object.freeze({
  whatsapp: '59177057379',
  categories: Object.freeze(['Recargas por ID','Recargas por Cuenta','Streaming','Gift Cards']),
  featuredPriority: Object.freeze(['Mobile Legends','Free Fire','PUBG','Clash','Wuthering']),
  assetRevision: STOREFRONT_ASSET_REVISION,
  gameIcons: Object.freeze({
    arenabreakout:storefrontAppAsset('arena-breakout'),
    asphaltlegends:storefrontAppAsset('asphalt-legends'),
    bloodstrike:storefrontAppAsset('blood-strike'),
    deltaforce:storefrontAppAsset('delta-force'),
    freefire:storefrontAppAsset('free-fire'),
    genshinimpact:storefrontAppAsset('genshin-impact'),
    honkaistarrail:storefrontAppAsset('honkai-star-rail'),
    honorofkings:storefrontAppAsset('honor-of-kings'),
    magicchess:storefrontAppAsset('magic-chess'),
    mobilelegendsbangbang:storefrontAppAsset('mobile-legends'),
    pubgmobile:storefrontAppAsset('pubg-mobile'),
    wutheringwaves:storefrontAppAsset('wuthering-waves'),
    zenlesszonezero:storefrontAppAsset('zenless-zone-zero'),
    clashofclans:storefrontAppAsset('clash-of-clans'),
    clashroyale:storefrontAppAsset('clash-royale'),
    fortnite:storefrontAppAsset('fortnite'),
    roblox:storefrontAppAsset('roblox'),
    tiktok:storefrontAppAsset('tiktok'),
    steam:storefrontAppAsset('steam'),
    minecraft:storefrontAppAsset('minecraft'),
    standoff2:storefrontAppAsset('standoff-2'),
    teamfighttactics:storefrontAppAsset('teamfight-tactics')
  })
});
window.FSStorefrontConfig = STOREFRONT_CONFIG;
