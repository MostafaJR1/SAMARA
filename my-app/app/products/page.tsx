import { ProductsCatalog } from "@/components/ProductsCatalog";
import { getProductsFromDatabase } from "@/lib/products-server";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const products = await getProductsFromDatabase();
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <ProductsCatalog key={category ?? "all"} products={products} initialCategory={category} />
    </div>
  );
}
