/* THE FRENCH STORE — public storefront configuration.
   Presentation/config only. Prices, provider routing and availability remain in Supabase/backend.
   R135: add Steam Wallet account-topup identity and local Gemini artwork without changing category contracts. */
const STOREFRONT_ASSET_REVISION = '20260902-r135';
const storefrontAppAsset = (filename) => `assets/apps/${filename}.webp?v=${STOREFRONT_ASSET_REVISION}`;

const STOREFRONT_CONFIG = Object.freeze({
  whatsapp: '59177057379',
  categories: Object.freeze(['Recargas por ID','Recargas por Cuenta','Streaming','Gift Cards']),
  featuredPriority: Object.freeze(['Mobile Legends','Free Fire','PUBG','Clash','Wuthering']),
  assetRevision: STOREFRONT_ASSET_REVISION,
  gameSubtitles: Object.freeze({
    steamwallet:'💵 Saldo Steam · recarga por cuenta',
    geminipro:'🤖 IA de Google · activación asistida'
  }),
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
    steamwallet:storefrontAppAsset('steam'),
    geminipro:storefrontAppAsset('gemini'),
    minecraft:storefrontAppAsset('minecraft'),
    standoff2:storefrontAppAsset('standoff-2'),
    teamfighttactics:storefrontAppAsset('teamfight-tactics')
  })
});
window.FSStorefrontConfig = STOREFRONT_CONFIG;
