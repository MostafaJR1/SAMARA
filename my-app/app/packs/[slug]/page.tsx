import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PackDetails } from "@/components/PackDetails";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { getProductsFromDatabase } from "@/lib/products-server";
import { getPackStock } from "@/lib/packs";
import { absoluteImageUrl, absoluteUrl, createBreadcrumbList, createPageMetadata } from "@/lib/seo";

type PackPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PackPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProductsFromDatabase();
  const pack = (await getPacksFromDatabase(products)).find((candidate) => candidate.slug === slug && candidate.isActive);
  if (!pack) {
    return { title: "الباقة غير موجودة", robots: { index: false, follow: false } };
  }

  return createPageMetadata({
    title: pack.name,
    description: pack.description || `تفاصيل ${pack.name} وسعرها ومحتوياتها في متجر سمارة.`,
    path: `/packs/${pack.slug}`,
    image: pack.image,
    imageAlt: pack.name,
  });
}

export default async function PackPage({ params }: PackPageProps) {
  const { slug } = await params;
  const products = await getProductsFromDatabase();
  const pack = (await getPacksFromDatabase(products)).find((candidate) => candidate.slug === slug && candidate.isActive);
  if (!pack) notFound();

  const path = `/packs/${pack.slug}`;
  const packUrl = absoluteUrl(path);
  const packImage = absoluteImageUrl(pack.image);
  const packStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    ...(packUrl ? { "@id": `${packUrl}#product`, url: packUrl } : {}),
    name: pack.name,
    productID: pack.id,
    ...(pack.description ? { description: pack.description } : {}),
    ...(packImage ? { image: [packImage] } : {}),
    offers: {
      "@type": "Offer",
      ...(packUrl ? { url: packUrl } : {}),
      priceCurrency: "MAD",
      price: pack.price,
      availability: getPackStock(pack) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  const breadcrumbStructuredData = createBreadcrumbList([
    { name: "الرئيسية", path: "/" },
    { name: "الباقات", path: "/packs" },
    { name: pack.name, path },
  ]);

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <JsonLd data={packStructuredData} />
      {breadcrumbStructuredData && <JsonLd data={breadcrumbStructuredData} />}
      <PackDetails pack={pack} />
    </div>
  );
}
