# R155 — final convergence checkpoint

This package is **documentation/review only**. It does not change storefront runtime,
Admin runtime, pricing, Wallet, Auth, BISA, providers, Supabase data or purchase
execution.

## Safe completion state

The production frontend already contains the completed safe packages:

- **R150** — bounded Rank refreshes and compositor-friendly Diamond motion.
- **R151** — Base/Gold/Diamond surfaces, truthful Wallet states and accessible
  storefront dialogs.
- **R153** — numeric 1–99 cart quantities, focus restoration, truthful Orders
  states and immediate checkout progress feedback.
- **R154** — truthful Admin quote read states, stale-result rejection, accessible
  Admin dialogs and safer static Admin caching.
- Worker **R152** updated stale entrypoint guards without changing Worker runtime.

R154 merged to `main` as `18169d1f573e305e3a1bc1757df2ed3987f854af`.
Its PR head passed the existing security, Admin, Rank and browser regression gates;
its browser review covered Admin views at 360/390/412/768/1366 with synthetic,
read-only data.

A final targeted review found no additional high-value **safe** runtime change that
justifies another storefront redesign. The public service worker remains deliberately
minimal and does not intercept/caches prices, Wallet, orders, BISA, Auth or API data.
The R143/R145 security guards remained green on R154.

## Remaining sensitive boundary — Admin quotations rounding

The only confirmed current-rule mismatch left from this completion pass is inside
PostgreSQL function:

`public.admin_app_quote_sale_price(numeric,text)`

Current production behavior still computes:

```sql
v_sale_base := round((v_cost_bob + v_margin)::numeric,2);
v_sale := round((ceil(v_sale_base * 2) / 2)::numeric,2);
```

The current authoritative store rule is **no commercial rounding** because the
dynamic QR supports cents. The approved stepped margin function
`public.store_competitive_margin_from_cost(...)` remains the source of the margin
and must not change.

The Admin frontend does not add another rounding layer; it displays the RPC
`sale_price` value unchanged. Therefore the obsolete rounding is a database/financial
contract change and is intentionally **not applied automatically** by this package.

Examples verified against the current margin function:

| Cost basis | Current rule (cost + margin) | Historical quote result |
| ---: | ---: | ---: |
| Bs 9.99 | Bs 10.99 | Bs 11.00 |
| Bs 19.99 | Bs 21.99 | Bs 22.00 |
| Bs 49.99 | Bs 54.99 | Bs 55.00 |
| Bs 99.99 | Bs 108.99 | Bs 109.00 |
| Bs 499.99 | Bs 548.99 | Bs 549.00 |

The USD path has the same extra rounding after conversion. For example, using the
valid operational rate observed during review, a USD 5 cost produced a current-rule
cent value of Bs 70.60 while the historical quote expression would return Bs 71.00.
The rate itself is volatile and is **not** hard-coded by the proposal.

## Reviewed proposal

`docs/proposals/R155-admin-quotes-no-rounding.sql` contains a review-only transaction
that replaces only the obsolete `ceil(...*2)/2` step with:

```sql
v_sale := v_sale_base;
```

It preserves:

- the function signature;
- `STABLE SECURITY DEFINER`;
- the explicit `search_path`;
- Admin authorization;
- BS/USD validation;
- the existing `BINANCE_P2P` quotation source used by this Admin helper;
- `store_competitive_margin_from_cost`;
- two-decimal money precision;
- existing JSON fields for compatibility.

The proposed metadata changes `rounding_mode` from `UP_TO_0_50_BOB` to `NONE`.
The legacy `sale_price_before_rounding` field is retained for compatibility and is
identical to `sale_price` after the correction.

The proposal was syntax/guard validated inside a PostgreSQL transaction and then
**rolled back**. Regression arithmetic for 9.99, 19.99, 49.99, 99.99, 499.99,
500 and 750 matched the current stepped rule. A subsequent read confirmed the
production function still contains the historical rounding, proving the proposal
was not persisted.

## Approval boundary

Applying the quotation correction requires explicit approval because it changes a
financial RPC result, even though it aligns that helper with the already-authoritative
no-commercial-rounding rule.

When approved, apply it as a dedicated migration, test authenticated Admin BS and USD
quotes, verify cent preservation, re-run Admin/quotation CI and keep rollback as the
previous function definition.

## Explicitly unchanged

This convergence pass does **not** change:

- the stepped margin scale;
- MLBB Weekly Pass (`cost + Bs 0.50` exactly);
- public categories;
- Gift Card manual delivery;
- ID-only public recharge policy / no Zone ID;
- Google-only public Auth;
- BISA financial logic;
- Wallet balances/accounting;
- GamerHub purchase automation (remains OFF);
- provider secrets or purchase execution.
