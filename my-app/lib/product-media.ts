import type { Product, ProductMedia } from "@/types/catalog";

function getMediaType(url: string): ProductMedia["type"] {
  return /\/video\/upload\/|\.(?:mp4|m4v|mov|webm)(?:[?#]|$)/i.test(url) ? "video" : "image";
}

export function getProductMedia(product: Pick<Product, "image" | "media" | "colors">): ProductMedia[] {
  const media = product.media
    ?.filter((item) => item.url)
    .map((item) => ({ type: getMediaType(item.url), url: item.url })) ?? [];
  const slides = media.length > 0
    ? [...media]
    : [{ type: getMediaType(product.image), url: product.image }];

  for (const color of product.colors ?? []) {
    for (const url of [color.image, ...(color.galleryImages ?? [])]) {
      if (url && !slides.some((slide) => slide.url === url)) {
        slides.push({ type: getMediaType(url), url });
      }
    }
  }

  if (product.image && !slides.some((slide) => slide.url === product.image)) {
    slides.unshift({ type: getMediaType(product.image), url: product.image });
  }

  return slides;
}

export function getProductCardMedia(product: Pick<Product, "image" | "media" | "colors">): ProductMedia[] {
  const slides = getProductMedia(product);
  return [...slides.filter((slide) => slide.type === "video"), ...slides.filter((slide) => slide.type === "image")];
}