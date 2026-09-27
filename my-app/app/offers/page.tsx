import { getProductsFromDatabase } from "@/lib/products-server";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { OffersClientView } from "@/components/OffersClientView";

export const metadata = {
  title: "العروض والتخفيضات | متجر سمارة",
  description: "استفد من أقوى العروض والتخفيضات الحصرية على منتجات وباقات سمارة مع شحن مجاني والدفع عند الاستلام.",
};

export default async function OffersPage() {
  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);

  // Filter products that have discounts or previous prices
  const discountedProducts = products.filter(
    (product) =>
      (product.oldPrice && product.oldPrice > product.price) ||
      (product.discount && product.discount > 0)
  );

  // Fallback to all products if none have oldPrice set
  const finalProducts = discountedProducts.length > 0 ? discountedProducts : products.slice(0, 4);

  // Filter packs with real savings
  const discountedPacks = packs.filter(
    (pack) => pack.originalPrice && pack.originalPrice > pack.price
  );
  const finalPacks = discountedPacks.length > 0 ? discountedPacks : packs;

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-neutral-950 selection:text-white">
      <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <OffersClientView products={finalProducts} packs={finalPacks} />
      </main>
    </div>
  );
}