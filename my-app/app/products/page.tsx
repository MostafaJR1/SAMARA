import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ProductsCatalog } from "@/components/ProductsCatalog";
import { getProductsFromDatabase } from "@/lib/products-server";
import { createBreadcrumbList, createPageMetadata } from "@/lib/seo";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const requestedCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const products = await getProductsFromDatabase();
  const categories = new Set(products.map((product) => product.category));

  if (requestedCategory && categories.has(requestedCategory)) {
    return createPageMetadata({
      title: `منتجات ${requestedCategory}`,
      description: `تصفح ${products.filter((product) => product.category === requestedCategory).length} من منتجات ${requestedCategory} المتاحة في متجر سمارة.`,
      path: `/products?category=${encodeURIComponent(requestedCategory)}`,
    });
  }

  if (requestedCategory) {
    return {
      ...createPageMetadata({
        title: "اكتشف منتجاتنا",
        description: "تصفح المنتجات المتاحة في متجر سمارة واختر ما يناسب احتياجاتك.",
        path: "/products",
      }),
      robots: { index: false, follow: true },
    };
  }

  return createPageMetadata({
    title: "المنتجات",
    description: `تصفح ${products.length} من المنتجات المتاحة في متجر سمارة مع الشحن المجاني والدفع عند الاستلام.`,
    path: "/products",
  });
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const products = await getProductsFromDatabase();
  const validCategory = category && products.some((product) => product.category === category);
  const breadcrumbStructuredData = validCategory
    ? createBreadcrumbList([
        { name: "الرئيسية", path: "/" },
        { name: "المنتجات", path: "/products" },
        { name: category, path: `/products?category=${encodeURIComponent(category)}` },
      ])
    : null;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {breadcrumbStructuredData && <JsonLd data={breadcrumbStructuredData} />}
      <ProductsCatalog key={category ?? "all"} products={products} initialCategory={category} />
    </div>
  );
}
