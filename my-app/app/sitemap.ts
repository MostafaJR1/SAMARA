import type { MetadataRoute } from "next";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { getProductsFromDatabase } from "@/lib/products-server";
import { absoluteImageUrl, absoluteUrl, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteOrigin) return [];

  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);
  const staticPaths = ["/", "/products", "/packs", "/offers", "/best-sellers"];
  const staticPages = staticPaths.map((path) => ({ url: new URL(path, siteOrigin).toString() }));

  const categories = Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean)));
  const categoryPages = categories.flatMap((category) => {
    const url = absoluteUrl(`/products?category=${encodeURIComponent(category)}`);
    return url ? [{ url }] : [];
  });

  const productPages = products.flatMap((product) => {
    const url = absoluteUrl(`/products/${product.id}`);
    if (!url) return [];

    const images = Array.from(new Set([product.image, ...product.colors.map((color) => color.image)]))
      .map(absoluteImageUrl)
      .filter((image): image is string => Boolean(image));

    return [{ url, ...(images.length > 0 ? { images } : {}) }];
  });

  const packPages = packs.flatMap((pack) => {
    const url = absoluteUrl(`/packs/${encodeURIComponent(pack.slug)}`);
    const image = absoluteImageUrl(pack.image);
    return url ? [{ url, ...(image ? { images: [image] } : {}) }] : [];
  });

  return [...staticPages, ...categoryPages, ...productPages, ...packPages];
}