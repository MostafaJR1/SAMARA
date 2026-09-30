-- Apply after supabase/orders_setup.sql.
-- This migration makes the current catalog relational so packs and orders can be authoritative.

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  image text not null,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packs (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image text,
  price integer not null check (price >= 0),
  original_price integer check (original_price is null or original_price >= price),
  colors jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null references public.packs(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (pack_id, product_id)
);

alter table public.pack_items add column if not exists product_url text;

create index if not exists pack_items_pack_id_idx on public.pack_items(pack_id);
create index if not exists pack_items_product_id_idx on public.pack_items(product_id);
create index if not exists packs_active_idx on public.packs(is_active);

alter table public.order_items alter column product_id drop not null;
alter table public.order_items add column if not exists item_type text not null default 'product';
alter table public.order_items add column if not exists pack_id text references public.packs(id) on delete set null;
alter table public.order_items add column if not exists pack_name text;
alter table public.order_items add column if not exists pack_contents jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_items_item_type_check') then
    alter table public.order_items add constraint order_items_item_type_check check (item_type in ('product', 'pack'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'order_items_reference_check') then
    alter table public.order_items add constraint order_items_reference_check check (
      (item_type = 'product' and product_id is not null and pack_id is null)
      or (item_type = 'pack' and product_id is null and pack_name is not null)
    );
  end if;
end;
$$;

create index if not exists order_items_pack_id_idx on public.order_items(pack_id);

alter table public.products enable row level security;
alter table public.packs enable row level security;
alter table public.pack_items enable row level security;
revoke all on table public.products from anon, authenticated;
revoke all on table public.packs from anon, authenticated;
revoke all on table public.pack_items from anon, authenticated;
grant select on table public.products, public.packs, public.pack_items to anon, authenticated;
grant update on table public.packs to authenticated;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (is_active = true);

drop policy if exists packs_public_read on public.packs;
create policy packs_public_read on public.packs for select to anon, authenticated using (is_active = true);

drop policy if exists pack_items_public_read on public.pack_items;
create policy pack_items_public_read on public.pack_items for select to anon, authenticated using (
  exists (select 1 from public.packs where packs.id = pack_items.pack_id and packs.is_active = true)
);

drop function if exists public.create_order(jsonb);
create or replace function public.create_order(p_order jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item jsonb;
  pack_item record;
  product_record public.products%rowtype;
  pack_record public.packs%rowtype;
  pack_snapshot jsonb;
  item_type text;
  item_quantity integer;
  item_unit_price integer;
  computed_subtotal integer := 0;
  computed_discount integer := 0;
  computed_shipping integer := 0;
  coupon_code text;
begin
  for item in select value from jsonb_array_elements(p_order -> 'items')
  loop
    item_type := coalesce(item ->> 'type', 'product');
    item_quantity := (item ->> 'quantity')::integer;

    if item_type = 'product' then
      select * into product_record
      from public.products
      where id = item ->> 'productId' and is_active = true
      for update;

      if not found or product_record.stock < item_quantity then
        raise exception 'PRODUCT_UNAVAILABLE';
      end if;

      computed_subtotal := computed_subtotal + product_record.price * item_quantity;
    elsif item_type = 'pack' then
      select * into pack_record
      from public.packs
      where id = item ->> 'packId' and is_active = true
      for update;

      if not found then
        raise exception 'PACK_UNAVAILABLE';
      end if;

      for pack_item in
        select pi.product_id, pi.quantity, p.stock
        from public.pack_items pi
        join public.products p on p.id = pi.product_id
        where pi.pack_id = pack_record.id and p.is_active = true
        for update of p
      loop
        if pack_item.stock < pack_item.quantity * item_quantity then
          raise exception 'PACK_UNAVAILABLE';
        end if;
      end loop;

      computed_subtotal := computed_subtotal + pack_record.price * item_quantity;
    else
      raise exception 'INVALID_ITEM_TYPE';
    end if;
  end loop;

  coupon_code := nullif(upper(trim(p_order ->> 'coupon')), '');
  computed_discount := least(computed_subtotal, greatest(0, coalesce((p_order ->> 'discount')::integer, 0)));

  insert into public.orders (
    customer_name, customer_phone, customer_city, coupon_code,
    subtotal, discount, shipping, total
  ) values (
    p_order #>> '{customer,name}',
    p_order #>> '{customer,phone}',
    p_order #>> '{customer,city}',
    coupon_code,
    computed_subtotal,
    computed_discount,
    computed_shipping,
    computed_subtotal - computed_discount + computed_shipping
  ) returning id into new_order_id;

  for item in select value from jsonb_array_elements(p_order -> 'items')
  loop
    item_type := coalesce(item ->> 'type', 'product');
    item_quantity := (item ->> 'quantity')::integer;

    if item_type = 'product' then
      select * into product_record from public.products where id = item ->> 'productId' for update;
      insert into public.order_items (order_id, item_type, product_id, product_name, quantity, unit_price, line_total)
      values (new_order_id, 'product', product_record.id, product_record.name, item_quantity, product_record.price, item_quantity * product_record.price);
      update public.products set stock = stock - item_quantity, updated_at = now() where id = product_record.id;
    else
      select * into pack_record from public.packs where id = item ->> 'packId' for update;
      select coalesce(jsonb_agg(jsonb_build_object('productId', p.id, 'productName', p.name, 'quantity', pi.quantity)), '[]'::jsonb)
      into pack_snapshot
      from public.pack_items pi join public.products p on p.id = pi.product_id
      where pi.pack_id = pack_record.id;

      insert into public.order_items (order_id, item_type, product_name, pack_id, pack_name, pack_contents, quantity, unit_price, line_total)
      values (new_order_id, 'pack', pack_record.name, pack_record.id, pack_record.name, pack_snapshot, item_quantity, pack_record.price, item_quantity * pack_record.price);

      for pack_item in select product_id, quantity from public.pack_items where pack_id = pack_record.id
      loop
        update public.products set stock = stock - (pack_item.quantity * item_quantity), updated_at = now() where id = pack_item.product_id;
      end loop;
    end if;
  end loop;

  return new_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
