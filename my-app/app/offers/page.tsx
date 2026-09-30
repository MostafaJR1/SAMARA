import type { Metadata } from "next";
import { getProductsFromDatabase } from "@/lib/products-server";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { OffersClientView } from "@/components/OffersClientView";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);
  const discountedProducts = products.filter(
    (product) => product.oldPrice > product.price || product.discount > 0,
  );
  const discountedPacks = packs.filter((pack) => pack.originalPrice > pack.price);
  const productCount = discountedProducts.length;
  const packCount = discountedPacks.length;

  return createPageMetadata({
    title: "العروض والتخفيضات",
    description: `تعرّف على ${productCount} من عروض المنتجات و${packCount} من الباقات المتاحة في متجر سمارة، مع الشحن المجاني والدفع عند الاستلام.`,
    path: "/offers",
  });
}

export default async function OffersPage() {
  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);

  // Filter products that have discounts or previous prices
  const discountedProducts = products.filter(
    (product) =>
      (product.oldPrice && product.oldPrice > product.price) ||
      (product.discount && product.discount > 0)
  );

  const finalProducts = discountedProducts;

  // Filter packs with real savings
  const discountedPacks = packs.filter(
    (pack) => pack.originalPrice && pack.originalPrice > pack.price
  );
  const finalPacks = discountedPacks;

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-neutral-950 selection:text-white">
      <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <OffersClientView products={finalProducts} packs={finalPacks} />
      </main>
    </div>
  );
}