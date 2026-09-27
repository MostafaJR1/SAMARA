import { CartPage } from "@/components/CartPage";
import { getProductsFromDatabase } from "@/lib/products-server";
import { getPacksFromDatabase } from "@/lib/packs-server";

export default async function CartRoute() {
  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <CartPage products={products} packs={packs} />
    </div>
  );
}
