-- FRENCH STORE — Rank Pass QR payment intents
-- Applied to production Supabase on 2026-09-18.
-- The QR rail reuses the existing BISA French Wallet top-up flow. Bank-confirmed
-- funds are credited to Wallet first, then consumed atomically by the existing
-- purchase_my_loyalty_pass() contract. finalize_loyalty_pass_qr() is idempotent.

create table if not exists public.loyalty_pass_qr_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topup_request_id uuid not null unique references public.wallet_topup_requests(id) on delete restrict,
  plan_code text not null references public.loyalty_pass_plans(code) on delete restrict,
  quoted_price_bob numeric(12,2) not null check (quoted_price_bob > 0),
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','SUPERSEDED')),
  before_plan_code text null references public.loyalty_pass_plans(code) on delete restrict,
  before_ends_at timestamptz null,
  result jsonb null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists loyalty_pass_qr_intents_user_status_idx
  on public.loyalty_pass_qr_intents(user_id,status,created_at desc);

alter table public.loyalty_pass_qr_intents enable row level security;
revoke all on table public.loyalty_pass_qr_intents from anon, authenticated;

create or replace function public.request_loyalty_pass_qr(p_plan_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_plan public.loyalty_pass_plans%rowtype;
  v_member public.loyalty_memberships%rowtype;
  v_existing record;
  v_topup jsonb;
  v_request_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_plan
  from public.loyalty_pass_plans
  where code = upper(trim(coalesce(p_plan_code,''))) and active = true;
  if not found then raise exception 'PASS_NOT_FOUND'; end if;

  select * into v_member
  from public.loyalty_memberships
  where user_id = v_uid;

  if found and v_member.ends_at > now() and v_member.plan_code <> v_plan.code then
    raise exception 'ACTIVE_PASS_CHANGE_AFTER_EXPIRY';
  end if;

  select i.topup_request_id,t.status as topup_status,t.payment_reference,t.amount,t.expires_at
  into v_existing
  from public.loyalty_pass_qr_intents i
  join public.wallet_topup_requests t on t.id = i.topup_request_id
  where i.user_id = v_uid
    and i.plan_code = v_plan.code
    and i.status = 'PENDING'
    and (
      t.status = 'APPROVED'
      or (t.status = 'PENDING' and coalesce(t.expires_at, now() + interval '1 minute') > now())
    )
  order by i.created_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'ok',true,'request_id',v_existing.topup_request_id,
      'payment_reference',v_existing.payment_reference,'amount',v_existing.amount,
      'expires_at',v_existing.expires_at,'request_status',v_existing.topup_status,
      'context','RANK_PASS','plan_code',v_plan.code,'plan_name',v_plan.public_name,
      'duration_days',v_plan.duration_days
    );
  end if;

  v_topup := public.request_wallet_topup_v2(v_plan.price_bob);
  v_request_id := (v_topup->>'request_id')::uuid;

  insert into public.loyalty_pass_qr_intents(
    user_id,topup_request_id,plan_code,quoted_price_bob,before_plan_code,before_ends_at
  ) values (
    v_uid,v_request_id,v_plan.code,v_plan.price_bob,
    case when v_member.user_id is not null and v_member.ends_at > now() then v_member.plan_code else null end,
    case when v_member.user_id is not null and v_member.ends_at > now() then v_member.ends_at else null end
  );

  return v_topup || jsonb_build_object(
    'request_status','PENDING','context','RANK_PASS',
    'plan_code',v_plan.code,'plan_name',v_plan.public_name,'duration_days',v_plan.duration_days
  );
end;
$function$;

create or replace function public.finalize_loyalty_pass_qr(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_intent public.loyalty_pass_qr_intents%rowtype;
  v_topup public.wallet_topup_requests%rowtype;
  v_plan public.loyalty_pass_plans%rowtype;
  v_member public.loyalty_memberships%rowtype;
  v_purchase jsonb;
  v_superseded boolean := false;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_request_id is null then raise exception 'INVALID_REQUEST_ID'; end if;

  select * into v_intent
  from public.loyalty_pass_qr_intents
  where topup_request_id = p_request_id and user_id = v_uid
  for update;
  if not found then raise exception 'LOYALTY_QR_INTENT_NOT_FOUND'; end if;

  if v_intent.status in ('COMPLETED','SUPERSEDED') and v_intent.result is not null then
    return v_intent.result;
  end if;

  select * into v_topup
  from public.wallet_topup_requests
  where id = p_request_id and user_id = v_uid
  for update;
  if not found then raise exception 'TOPUP_NOT_FOUND'; end if;
  if v_topup.status <> 'APPROVED' then raise exception 'TOPUP_NOT_APPROVED'; end if;

  select * into v_plan
  from public.loyalty_pass_plans
  where code = v_intent.plan_code and active = true;
  if not found then raise exception 'PASS_NOT_FOUND'; end if;

  if round(v_topup.amount,2) <> round(v_intent.quoted_price_bob,2) then
    raise exception 'TOPUP_AMOUNT_MISMATCH';
  end if;
  if round(v_plan.price_bob,2) <> round(v_intent.quoted_price_bob,2) then
    v_result := jsonb_build_object(
      'ok',true,'superseded',true,'reason','PASS_PRICE_CHANGED','wallet_kept',true,
      'payment_method','QR','topup_request_id',p_request_id,'plan_code',v_intent.plan_code,
      'quoted_price_bob',v_intent.quoted_price_bob,'current_price_bob',v_plan.price_bob
    );
    update public.loyalty_pass_qr_intents
    set status='SUPERSEDED',result=v_result,completed_at=now()
    where id=v_intent.id;
    return v_result;
  end if;

  select * into v_member
  from public.loyalty_memberships
  where user_id = v_uid
  for update;

  if v_intent.before_plan_code is null then
    if found and v_member.ends_at > now() then v_superseded := true; end if;
  else
    if not found
       or v_member.plan_code is distinct from v_intent.before_plan_code
       or v_member.ends_at is distinct from v_intent.before_ends_at then
      v_superseded := true;
    end if;
  end if;

  if v_superseded then
    v_result := jsonb_build_object(
      'ok',true,'superseded',true,'reason','PASS_ALREADY_CHANGED_AFTER_QR_REQUEST',
      'wallet_kept',true,'payment_method','QR',
      'topup_request_id',p_request_id,'plan_code',v_intent.plan_code
    );
    update public.loyalty_pass_qr_intents
    set status='SUPERSEDED',result=v_result,completed_at=now()
    where id=v_intent.id;
    return v_result;
  end if;

  v_purchase := public.purchase_my_loyalty_pass(v_intent.plan_code);
  v_result := v_purchase || jsonb_build_object('payment_method','QR','topup_request_id',p_request_id);

  update public.loyalty_pass_qr_intents
  set status='COMPLETED',result=v_result,completed_at=now()
  where id=v_intent.id;

  return v_result;
end;
$function$;

revoke all on function public.request_loyalty_pass_qr(text) from public, anon;
revoke all on function public.finalize_loyalty_pass_qr(uuid) from public, anon;
grant execute on function public.request_loyalty_pass_qr(text) to authenticated;
grant execute on function public.finalize_loyalty_pass_qr(uuid) to authenticated;
