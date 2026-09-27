import { PacksData, type Pack } from "@/data/Packs";
import { ProductsData } from "@/data/Products";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type PackRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  price: number;
  original_price: number | null;
  is_active: boolean;
  colors: Pack["colors"];
  pack_items: Array<{ product_id: string; quantity: number; product_url?: string | null }>;
};

export async function getPacksFromDatabase(products = ProductsData): Promise<Pack[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return PacksData.filter((pack) => pack.isActive);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("packs")
      .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity, product_url)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    let rows: PackRow[] = data ?? [];
    if (error) {
      const legacyResult = await supabase
        .from("packs")
        .select("id, name, slug, description, image, price, original_price, is_active, colors, pack_items(product_id, quantity)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (legacyResult.error) return [];
      rows = legacyResult.data ?? [];
    }

    const databasePacks = rows.flatMap((row) => {
      const items = row.pack_items.flatMap((item) => {
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
