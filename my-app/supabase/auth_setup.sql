-- Apply after supabase/packs_setup.sql.
-- Auth uses Supabase Auth users plus a small profile/role table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.products
  add column if not exists old_price integer,
  add column if not exists discount integer not null default 0 check (discount >= 0),
  add column if not exists rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  add column if not exists badge text,
  add column if not exists description text not null default '',
  add column if not exists colors jsonb not null default '[]'::jsonb,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists shipping text not null default 'شحن مجاني',
  add column if not exists is_coupon_eligible boolean not null default true;

alter table public.packs
  add column if not exists colors jsonb not null default '[]'::jsonb;

update public.products
set old_price = 1199,
    discount = 25,
    rating = 4.8,
    badge = 'الأكثر مبيعًا',
    description = 'كنبة مريحة وقابلة للنفخ، مناسبة للمنزل والاسترخاء.',
    colors = jsonb_build_array(
      jsonb_build_object('id', 'beige', 'name', 'بيج', 'hex', '#d8c8b4', 'image', image),
      jsonb_build_object('id', 'orange', 'name', 'برتقالي', 'hex', '#e9783f', 'image', image),
      jsonb_build_object('id', 'light-blue', 'name', 'أزرق فاتح', 'hex', '#a8d5e8', 'image', image),
      jsonb_build_object('id', 'purple', 'name', 'بنفسجي', 'hex', '#bba9d3', 'image', image)
    ),
    features = jsonb_build_array('قابلة للنفخ', 'مريحة', 'سهلة النقل', 'تصميم عصري')
where id = 'product-001';

update public.products
set old_price = 649,
    discount = 23,
    rating = 4.7,
    badge = 'جديد',
    description = 'كرسي جلوس مريح بتصميم عصري، مزود بمقعد مبطن باللون الأحمر وقاعدة معدنية متينة بتصميم منحني.',
    colors = jsonb_build_array(jsonb_build_object('id', 'red', 'name', 'أحمر', 'hex', '#c93632', 'image', image)),
    features = jsonb_build_array('مقعد مبطن ومريح', 'قاعدة معدنية متينة', 'تصميم عصري وأنيق', 'مناسب لغرفة المعيشة أو المكتب', 'سهل التنظيف')
where id = 'product-002';

-- Admin catalog permissions.
grant select, insert, update, delete on table public.products, public.packs, public.pack_items to authenticated;

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists packs_admin_write on public.packs;
create policy packs_admin_write on public.packs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists pack_items_admin_write on public.pack_items;
create policy pack_items_admin_write on public.pack_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on table public.orders, public.order_items to authenticated;
grant update (status) on table public.orders to authenticated;
grant delete on table public.orders to authenticated;
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
drop policy if exists orders_admin_update_status on public.orders;
create policy orders_admin_update_status on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders for delete to authenticated using (public.is_admin());
drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do update set public = true;

drop policy if exists catalog_admin_insert on storage.objects;
create policy catalog_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'catalog' and public.is_admin());
drop policy if exists catalog_admin_update on storage.objects;
create policy catalog_admin_update on storage.objects for update to authenticated using (bucket_id = 'catalog' and public.is_admin()) with check (bucket_id = 'catalog' and public.is_admin());
drop policy if exists catalog_admin_delete on storage.objects;
create policy catalog_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'catalog' and public.is_admin());

-- After creating a user in Supabase Auth, promote that user explicitly.
-- The profile role protects database operations; app_metadata.role lets the
-- middleware reject non-admin /admin requests without a database query.
-- Run both statements, then sign out and sign in again to refresh the JWT:
-- update public.profiles set role = 'admin', updated_at = now() where id = '<AUTH_USER_UUID>';
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where id = '<AUTH_USER_UUID>';
