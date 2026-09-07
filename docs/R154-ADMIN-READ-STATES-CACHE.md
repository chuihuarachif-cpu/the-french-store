# R154 — private Admin read states, keyboard access and static cache

Separate from R153 and from the pending database quotations rounding correction.
No SQL, pricing formula, financial RPC, auth gate, balance or provider changes.

## Findings and corrections

- `Number(null)` made an unloaded USD rate look valid and prevented its initial
  read. Missing/error rates now have explicit presentation, concurrent reads
  coalesce, and revisiting Cotizaciones refreshes the header instead of retaining
  a rate indefinitely. A genuine zero buffer remains valid.
- Editing or clearing a cost invalidates in-flight quote results immediately,
  including the debounce interval. Missing financial fields cannot become a zero
  price. The UI preserves the existing RPC's cent value and does no calculation.
- Private Admin confirm/detail dialogs contain keyboard focus, restore their
  opener and route Escape through the existing Cancel/Close handlers. The helper
  observes only the two dialog visibility classes. It never confirms an action.
- Shared Admin focus, 44 px touch controls, visited links and reduced motion are
  clearer. No new decorative assets, continuous effects or framework.
- The old service worker cached unsuccessful responses and could return the HTML
  shell for a missing JavaScript asset. The replacement is network-first for an
  explicit set of static files, checks HTTP success and content type, keeps exact
  query versions, and only falls back to HTML for equivalent root navigation.
  Private API, JSON data, unknown paths and mutations are excluded. A cache failure
  still permits a successful network response. Updates discard only older Admin
  caches; storefront caches and live financial data are untouched.
- The post-R153 production artwork check still expected the R129 bootstrap URL.
  Production browser inspection confirmed R153 was already loaded. The check now
  derives the expected URL from the tested checkout, retaining the release-pair
  test and all artwork assertions instead of pinning a superseded release.

## Validation and rollback

`scripts/test-r154-admin.mjs` executes actual quotation functions and service-worker
handlers with in-memory responses. It covers null/zero/error USD, freshness,
coalescing, cent preservation, stale results, the exact read-only RPC allowlist,
offline JS, wrong MIME, HTTP failures, unavailable Cache Storage and cache cleanup.

The new browser workflow compares against the R153 merge with synthetic Admin
data at 360, 390, 412, 768 and 1366. It covers overview, Orders, Wallet, maintenance,
cost editor, quotes normal/loading/error, guest/denied access and both dialogs.
Dialog tests cancel confirmations and never invoke mutation RPCs. Unapproved
requests, browser errors and overflow fail the run. Manual image review is a
merge gate. Existing storefront/Rank/Wallet/security/SEO CI remains required.

Rollback: revert the R154 squash commit and redeploy. The prior service-worker
script reactivates its prior cache namespace on update. No database rollback or
financial reconciliation is needed because this package writes no financial data.

## Quotes database boundary

Current `admin_app_quote_sale_price(numeric,text)` is an authorized, read-only
SECURITY DEFINER helper but still applies `ceil(v_sale_base*2)/2` in PostgreSQL.
The frontend displays `sale_price` unchanged. Correcting the database function is
kept out of this frontend PR and requires its own reviewed change and approval.
The existing `store_competitive_margin_from_cost` scale must remain unchanged.
