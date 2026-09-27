grant update (status) on table public.orders to authenticated;

drop policy if exists orders_admin_update_status on public.orders;
create policy orders_admin_update_status on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant delete on table public.orders to authenticated;

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
  for delete to authenticated
  using (public.is_admin());