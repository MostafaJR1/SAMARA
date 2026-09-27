import { PacksData, type Pack } from "@/data/Packs";
import { ProductsData } from "@/data/Products";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getPacksFromDatabase(products = ProductsData): Promise<Pack[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return PacksData.filter((pack) => pack.isActive);
  }

  try {
    const supabase = await getSupabaseServerClient();
    let { data, error } = await supabase
      .from("packs")
      .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity, product_url)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      const legacyResult = await supabase
        .from("packs")
        .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      data = legacyResult.data;
      error = legacyResult.error;
    }
    if (error) return [];

    const databasePacks = (data ?? []).flatMap((row) => {
      const items = (row.pack_items as Array<{ product_id: string; quantity: number; product_url?: string | null }>).flatMap((item) => {
        const product = products.find((candidate) => candidate.id === item.product_id);
        return product ? [{ product, quantity: item.quantity, productUrl: item.product_url ?? null }] : [];
      });
      if (items.length === 0) return [];

      return [{
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        image: row.image ?? items[0].product.image,
        price: row.price,
        originalPrice: row.original_price ?? items.reduce((total, item) => total + item.product.price * item.quantity, 0),
        isActive: row.is_active,
        items,
        colors: (row.colors as Pack["colors"]) ?? [],
      }];
    });

    return databasePacks;
  } catch {
    return [];
  }
}

export async function getPackFromDatabase(slug: string) {
  const packs = await getPacksFromDatabase();
  return packs.find((pack) => pack.slug === slug && pack.isActive);
}
