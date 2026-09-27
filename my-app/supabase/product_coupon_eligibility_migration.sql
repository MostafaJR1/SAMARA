alter table public.products
  add column if not exists is_coupon_eligible boolean not null default true;