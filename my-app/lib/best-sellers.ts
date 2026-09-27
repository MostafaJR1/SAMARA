import { ProductsData } from "@/data/Products";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getProductsFromDatabase } from "@/lib/products-server";

type Product = (typeof ProductsData)[number];

type OrderItemRow = {
  product_id: string;
  quantity: number;
  orders: { status: string } | { status: string }[] | null;
};

export type RankedProduct = Product & {
  soldQuantity: number;
  rankScore: number;
};

function orderStatus(item: OrderItemRow) {
  return Array.isArray(item.orders) ? item.orders[0]?.status : item.orders?.status;
}

async function getSoldQuantities() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_items")
      .select("product_id, quantity, orders!inner(status)");

    if (error) throw error;

    return ((data ?? []) as OrderItemRow[]).reduce<Record<string, number>>(
      (totals, item) => {
        if (["confirmed", "shipped", "completed"].includes(orderStatus(item) ?? "")) {
          totals[item.product_id] = (totals[item.product_id] ?? 0) + item.quantity;
        }
        return totals;
      },
      {},
    );
  } catch {
    return {};
  }
}

function coldStartScore(product: Product) {
  const ratingSignal = (product.rating / 5) * 45;
  const badgeText = product.badge ?? "";
  const badgeSignal = /(الأكثر|طلب|مبيع)/.test(badgeText) ? 25 : badgeText.includes("جديد") ? 10 : 0;
  const discountSignal = Math.min(product.discount, 40) * 0.5;
  const stockSignal = product.stock > 0 ? Math.min(product.stock, 20) / 20 * 10 : 0;
  return ratingSignal + badgeSignal + discountSignal + stockSignal;
}

export async function getBestSellingProducts() {
  const [products, soldQuantities] = await Promise.all([
    getProductsFromDatabase(),
    getSoldQuantities(),
  ]);
  const maxSold = Math.max(0, ...Object.values(soldQuantities));
  const hasSales = maxSold > 0;

  return products
    .map<RankedProduct>((product) => {
      const soldQuantity = soldQuantities[product.id] ?? 0;
      const salesSignal = maxSold > 0 ? (Math.log1p(soldQuantity) / Math.log1p(maxSold)) * 100 : 0;
      const fallbackSignal = coldStartScore(product);
      const rankScore = hasSales ? salesSignal * 0.7 + fallbackSignal * 0.3 : fallbackSignal;
      return { ...product, soldQuantity, rankScore };
    })
    .sort((first, second) => second.rankScore - first.rankScore);
}