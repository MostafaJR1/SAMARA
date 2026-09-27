import { WishlistPage } from "@/components/WishlistPage";
import { getProductsFromDatabase } from "@/lib/products-server";

export default async function WishlistRoute() {
  const products = await getProductsFromDatabase();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <WishlistPage products={products} />
    </div>
  );
}
