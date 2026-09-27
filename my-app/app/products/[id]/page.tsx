import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/ProductDetails";
import { getProductsFromDatabase } from "@/lib/products-server";
import { getPacksFromDatabase } from "@/lib/packs-server";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const products = await getProductsFromDatabase();
  const product = products.find((item) => item.id === id);
  const packs = await getPacksFromDatabase(products);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <ProductDetails product={product} products={products} packs={packs} />
    </div>
  );
}
