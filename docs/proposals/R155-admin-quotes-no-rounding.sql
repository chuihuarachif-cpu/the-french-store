-- THE FRENCH STORE — R155 REVIEW-ONLY PROPOSAL
--
-- PURPOSE
--   Remove ONLY the obsolete Admin quotation round-up-to-Bs-0.50 step while
--   preserving the approved stepped margin function and all authorization/FX
--   behavior.
--
-- SAFETY
--   This file ALWAYS ends in ROLLBACK. It is intentionally not a migration and
--   must not be used as the production apply file. It exists so the replacement
--   function can be reviewed and syntax-validated without persisting a change.
--
-- CURRENT AUTHORITATIVE RULE
--   sale = cost_bob + store_competitive_margin_from_cost(cost_bob), rounded only
--   to two monetary decimals. No commercial rounding to Bs 0.50.

begin;

-- Fail closed if production no longer has the historical behavior this proposal
-- was written to replace.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.admin_app_quote_sale_price(numeric,text)'::regprocedure)
    into v_def;
  if position('ceil(v_sale_base * 2)' in v_def) = 0 then
    raise exception 'R155_PRECONDITION_FAILED: historical quote rounding not found';
  end if;
end $$;

create or replace function public.admin_app_quote_sale_price(p_cost numeric, p_currency text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_currency text := upper(trim(coalesce(p_currency,'')));
  v_fx numeric(12,6) := 1;
  v_raw numeric(12,6) := null;
  v_source text := 'DIRECT_BS';
  v_cost_bob numeric(14,4);
  v_margin numeric(14,4);
  v_sale_base numeric(14,2);
  v_sale numeric(14,2);
begin
  if not public.admin_app_is_allowed() then
    raise exception 'ADMIN_APP_FORBIDDEN';
  end if;

  if p_cost is null or p_cost <= 0 or p_cost > 10000 then
    raise exception 'INVALID_COST';
  end if;

  if v_currency in ('BS','BOB') then
    v_currency := 'BS';
    v_fx := 1;
    v_source := 'DIRECT_BS';
  elsif v_currency = 'USD' then
    select t.valor
      into v_fx
      from public.tipos_cambio t
     where t.fuente='BINANCE_P2P'
       and t.par='USDT/BOB'
       and t.valido=true
     limit 1;

    select t.valor
      into v_raw
      from public.tipos_cambio t
     where t.fuente='BINANCE_P2P_RAW'
       and t.par='USDT/BOB'
       and t.valido=true
     limit 1;

    if v_fx is null or v_fx <= 0 then
      raise exception 'USD_RATE_UNAVAILABLE';
    end if;

    v_source := 'BINANCE_P2P';
  else
    raise exception 'UNSUPPORTED_CURRENCY';
  end if;

  v_cost_bob := round((p_cost * v_fx)::numeric,4);
  v_margin := public.store_competitive_margin_from_cost(v_cost_bob);
  v_sale_base := round((v_cost_bob + v_margin)::numeric,2);

  -- R155: preserve cents exactly; no ceil/up-to-0.50 commercial rounding.
  v_sale := v_sale_base;

  return jsonb_build_object(
    'ok',true,
    'currency',v_currency,
    'input_cost',round(p_cost::numeric,4),
    'fx',v_fx,
    'fx_raw',v_raw,
    'fx_buffer',case when v_currency='USD' and v_raw is not null then round((v_fx-v_raw)::numeric,2) else 0 end,
    'fx_source',v_source,
    'cost_bob',v_cost_bob,
    'margin',v_margin,
    -- Kept for backwards-compatible response shape. With no commercial rounding
    -- it intentionally equals sale_price.
    'sale_price_before_rounding',v_sale_base,
    'sale_price',v_sale,
    'pricing_mode','STORE_COMPETITIVE_MARGIN',
    'rounding_mode','NONE'
  );
end;
$function$;

-- Definition guards inside this transaction.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.admin_app_quote_sale_price(numeric,text)'::regprocedure)
    into v_def;

  if position('ceil(v_sale_base * 2)' in v_def) > 0 then
    raise exception 'R155_PROPOSAL_FAILED: historical ceil rounding still present';
  end if;

  if position('v_sale := v_sale_base' in v_def) = 0 then
    raise exception 'R155_PROPOSAL_FAILED: cent-preserving assignment missing';
  end if;
end $$;

-- Pure arithmetic regression checks. These do not need an Admin session and do
-- not write data.
do $$
declare
  v_bad integer;
begin
  with costs(v, expected) as (
    values
      (9.99::numeric, 10.99::numeric),
      (19.99::numeric, 21.99::numeric),
      (49.99::numeric, 54.99::numeric),
      (99.99::numeric, 108.99::numeric),
      (499.99::numeric, 548.99::numeric),
      (500::numeric, 550.00::numeric),
      (750::numeric, 800.00::numeric)
  ), calc as (
    select v, expected,
           round((v + public.store_competitive_margin_from_cost(v))::numeric,2) as sale
      from costs
  )
  select count(*) into v_bad from calc where sale <> expected;

  if v_bad <> 0 then
    raise exception 'R155_PROPOSAL_FAILED: stepped-margin cent regression';
  end if;
end $$;

-- REVIEW-ONLY: deliberately leave production unchanged.
rollback;
