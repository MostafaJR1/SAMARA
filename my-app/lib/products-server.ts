import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/types/catalog";
type ProductRow = {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  old_price: number | null;
  discount: number;
  rating: number;
  badge: string | null;
  description: string;
  colors: Product["colors"];
  features: string[];
  stock: number;
  shipping: string;
  is_active: boolean;
  is_featured?: boolean;
  is_coupon_eligible?: boolean;
};

export const getProductsFromDatabase = cache(async function getProductsFromDatabase(): Promise<Product[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, image, price, old_price, discount, rating, badge, description, colors, features, stock, shipping, is_active, is_featured, is_coupon_eligible")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    let productRows: ProductRow[] | null = data;
    if (error) {
      const legacyResult = await supabase
        .from("products")
        .select("id, name, category, image, price, old_price, discount, rating, badge, description, colors, features, stock, shipping, is_active, is_featured")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (!legacyResult.error) {
        productRows = legacyResult.data;
      } else {
        const oldestResult = await supabase
          .from("products")
          .select("id, name, category, image, price, old_price, discount, rating, badge, description, colors, features, stock, shipping, is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (oldestResult.error) throw oldestResult.error;
        productRows = oldestResult.data;
      }
    }
    const rows = productRows ?? [];
    return rows.map((row): Product => ({
      id: row.id,
      name: row.name,
      category: row.category,
      image: row.image,
      price: row.price,
      oldPrice: row.old_price ?? row.price,
      discount: row.discount,
      rating: row.rating,
      badge: row.badge ?? "",
      description: row.description,
      colors: row.colors?.length > 0 ? row.colors : [{ id: "default", name: "اللون الأساسي", hex: "#e5e5e5", image: row.image }],
      features: row.features,
      stock: row.stock,
      shipping: row.shipping,
      isFeatured: row.is_featured ?? false,
      is_featured: row.is_featured ?? false,
      is_coupon_eligible: row.is_coupon_eligible ?? true,
    }));
  } catch {
    return [];
  }
});
