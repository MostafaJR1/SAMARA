import { AdminDashboard, type AdminOrder, type AdminPack, type AdminProduct } from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { createPrivatePageMetadata } from "@/lib/seo";

export const metadata = createPrivatePageMetadata(
  "لوحة الإدارة",
  "واجهة خاصة بإدارة متجر سمارة.",
);

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();

  const [initialProductsResult, initialPacksResult, ordersResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, image, media, price, old_price, discount, rating, badge, description, stock, shipping, is_active, is_featured, is_coupon_eligible, colors, features")
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

  let products: AdminProduct[] | null = initialProductsResult.data;
  let productsError = initialProductsResult.error;
  if (productsError) {
    const legacyResult = await supabase
      .from("products")
      .select("id, name, category, image, price, old_price, discount, rating, badge, description, stock, shipping, is_active, is_featured, colors, features")
      .order("created_at", { ascending: false });
    products = legacyResult.data?.map((product) => ({ ...product, is_coupon_eligible: true })) ?? null;
    productsError = legacyResult.error;
  }
  if (productsError) {
    const oldestResult = await supabase
      .from("products")
      .select("id, name, category, image, price, old_price, discount, rating, badge, description, stock, shipping, is_active, colors, features")
      .order("created_at", { ascending: false });
    products = oldestResult.data?.map((product) => ({ ...product, is_featured: false, is_coupon_eligible: true })) ?? null;
    productsError = oldestResult.error;
  }

  let packs: AdminPack[] | null = initialPacksResult.data;
  let packsError = initialPacksResult.error;
  if (packsError) {
    const legacyResult = await supabase
      .from("packs")
      .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity)")
      .order("created_at", { ascending: false });
    packs = legacyResult.data?.map((pack) => ({
      ...pack,
      pack_items: pack.pack_items.map((item) => ({ ...item, product_url: null })),
    })) ?? null;
    packsError = legacyResult.error;
  }
  if (packsError) {
    const oldestResult = await supabase
      .from("packs")
      .select("id, name, slug, description, image, price, original_price, pack_items(product_id, quantity)")
      .order("created_at", { ascending: false });
    packs = oldestResult.data?.map((pack) => ({
      ...pack,
      is_active: true,
      colors: [],
      pack_items: pack.pack_items.map((item) => ({ ...item, product_url: null })),
    })) ?? null;
    packsError = oldestResult.error;
  }

  if (productsError || packsError || ordersResult.error) {
    const message =
      productsError?.message ??
      packsError?.message ??
      ordersResult.error?.message ??
      "تعذر تحميل بيانات لوحة التحكم";
    throw new Error(`تعذر تحميل لوحة التحكم: ${message}`);
  }

  const orders = ordersResult.data ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f1f2f4] text-[#202223] font-sans antialiased selection:bg-[#303030] selection:text-white">
      <AdminDashboard
        userEmail={user.email ?? ""}
        initialProducts={products ?? []}
        initialPacks={packs ?? []}
        initialOrders={orders as AdminOrder[]}
      />
    </div>
  );
}