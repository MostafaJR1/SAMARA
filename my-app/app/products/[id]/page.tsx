import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ProductDetails } from "@/components/ProductDetails";
import { getProductsFromDatabase } from "@/lib/products-server";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { absoluteImageUrl, absoluteUrl, createBreadcrumbList, createPageMetadata } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = (await getProductsFromDatabase()).find((item) => item.id === id);
  if (!product) {
    return { title: "المنتج غير موجود", robots: { index: false, follow: false } };
  }

  const path = `/products/${id}`;
  return createPageMetadata({
    title: `شراء ${product.name}`,
    description: product.description,
    path,
    image: product.image,
    imageAlt: product.name,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const products = await getProductsFromDatabase();
  const product = products.find((item) => item.id === id);
  const packs = await getPacksFromDatabase(products);

  if (!product) {
    notFound();
  }

  const path = `/products/${id}`;
  const productUrl = absoluteUrl(path);
  const productImages = Array.from(new Set([
    product.image,
    ...product.colors.map((color) => color.image),
    ...(product.media ?? []).filter((slide) => slide.type === "image").map((slide) => slide.url),
  ]))
    .map(absoluteImageUrl)
    .filter((image): image is string => Boolean(image));
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    ...(productUrl ? { "@id": `${productUrl}#product`, url: productUrl } : {}),
    name: product.name,
    productID: product.id,
    ...(product.description ? { description: product.description } : {}),
    ...(productImages.length > 0 ? { image: productImages } : {}),
    offers: {
      "@type": "Offer",
      ...(productUrl ? { url: productUrl } : {}),
      priceCurrency: "MAD",
      price: product.price,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  const breadcrumbStructuredData = createBreadcrumbList([
    { name: "الرئيسية", path: "/" },
    { name: product.category, path: `/products?category=${encodeURIComponent(product.category)}` },
    { name: product.name, path },
  ]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <JsonLd data={productStructuredData} />
      {breadcrumbStructuredData && <JsonLd data={breadcrumbStructuredData} />}
      <ProductDetails product={product} products={products} packs={packs} />
    </div>
  );
}
