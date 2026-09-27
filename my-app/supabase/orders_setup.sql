create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_city text not null,
  coupon_code text,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  shipping integer not null default 0 check (shipping >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;

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
begin
  insert into public.orders (
    customer_name,
    customer_phone,
    customer_city,
    coupon_code,
    subtotal,
    discount,
    shipping,
    total
  ) values (
    p_order #>> '{customer,name}',
    p_order #>> '{customer,phone}',
    p_order #>> '{customer,city}',
    nullif(p_order ->> 'coupon', ''),
    (p_order ->> 'subtotal')::integer,
    (p_order ->> 'discount')::integer,
    (p_order ->> 'shipping')::integer,
    (p_order ->> 'total')::integer
  )
  returning id into new_order_id;

  for item in select value from jsonb_array_elements(p_order -> 'items')
  loop
    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      line_total
    ) values (
      new_order_id,
      item ->> 'productId',
      item ->> 'productName',
      (item ->> 'quantity')::integer,
      (item ->> 'unitPrice')::integer,
      ((item ->> 'quantity')::integer * (item ->> 'unitPrice')::integer)
    );
  end loop;

  return new_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
