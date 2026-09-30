import { WishlistPage } from "@/components/WishlistPage";
import { getProductsFromDatabase } from "@/lib/products-server";
import { createPrivatePageMetadata } from "@/lib/seo";

export const metadata = createPrivatePageMetadata(
  "قائمة المفضلة",
  "المنتجات التي حفظتها في قائمة المفضلة.",
);

export default async function WishlistRoute() {
  const products = await getProductsFromDatabase();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <WishlistPage products={products} />
    </div>
  );
}
