begin;

alter table public.order_items
  drop constraint if exists order_items_pack_id_fkey,
  drop constraint if exists order_items_reference_check;

alter table public.order_items
  add constraint order_items_pack_id_fkey
  foreign key (pack_id) references public.packs(id) on delete set null;

alter table public.order_items
  add constraint order_items_reference_check check (
    (item_type = 'product' and product_id is not null and pack_id is null)
    or (item_type = 'pack' and product_id is null and pack_name is not null)
  );

commit;