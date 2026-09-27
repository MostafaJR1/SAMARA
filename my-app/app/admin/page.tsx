import { AdminDashboard, type AdminOrder, type AdminPack, type AdminProduct } from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();

  const [initialProductsResult, initialPacksResult, ordersResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, image, price, old_price, discount, rating, badge, description, stock, shipping, is_active, is_featured, is_coupon_eligible, colors, features")
      .order("created_at", { ascending: false }),
      supabase
        .from("packs")
        .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity, product_url)")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, customer_name, customer_phone, customer_city, coupon_code, subtotal, discount, shipping, total, status, created_at, order_items(id, product_id, product_name, quantity, unit_price, line_total)")
      .order("created_at", { ascending: false }),
  ]);

  let productsResult = initialProductsResult;
  if (productsResult.error) {
    productsResult = await supabase
      .from("products")
      .select("id, name, category, image, price, old_price, discount, rating, badge, description, stock, shipping, is_active, is_featured, colors, features")
      .order("created_at", { ascending: false });
  }
  if (productsResult.error) {
    productsResult = await supabase
      .from("products")
      .select("id, name, category, image, price, old_price, discount, rating, badge, description, stock, shipping, is_active, colors, features")
      .order("created_at", { ascending: false });
  }

  let packsResult = initialPacksResult;
  if (packsResult.error) {
    packsResult = await supabase
      .from("packs")
      .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity)")
      .order("created_at", { ascending: false });
  }
  if (packsResult.error) {
    packsResult = await supabase
      .from("packs")
      .select("id, name, slug, description, image, price, original_price, pack_items(product_id, quantity)")
      .order("created_at", { ascending: false });
  }

  if (productsResult.error || packsResult.error || ordersResult.error) {
    const message =
      productsResult.error?.message ??
      packsResult.error?.message ??
      ordersResult.error?.message ??
      "تعذر تحميل بيانات لوحة التحكم";
    throw new Error(`تعذر تحميل لوحة التحكم: ${message}`);
  }

  const products = productsResult.data ?? [];
  const packs = (packsResult.data ?? []).map((pack) => ({
    ...pack,
    colors: "colors" in pack && Array.isArray(pack.colors) ? pack.colors : [],
  }));
  const orders = ordersResult.data ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f1f2f4] text-[#202223] font-sans antialiased selection:bg-[#303030] selection:text-white">
      <AdminDashboard
        userEmail={user.email ?? ""}
        initialProducts={products as AdminProduct[]}
        initialPacks={packs as AdminPack[]}
        initialOrders={orders as AdminOrder[]}
      />
    </div>
  );
}