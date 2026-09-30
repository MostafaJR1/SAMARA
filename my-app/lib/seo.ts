import type { Metadata } from "next";

const configuredOrigin =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
  process.env.VERCEL_URL?.trim();

function normalizeOrigin(value: string | undefined) {
  if (!value) return undefined;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export const siteOrigin =
  normalizeOrigin(configuredOrigin) ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined);

export const metadataBase = siteOrigin ? new URL(siteOrigin) : undefined;
export const siteName = "سمارة";
export const siteLocale = "ar_MA";
export const siteLanguage = "ar-MA";
const indexingAllowed =
  Boolean(siteOrigin) &&
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL_ENV !== "preview";

export function absoluteUrl(path: string) {
  try {
    return new URL(path, siteOrigin).toString();
  } catch {
    return undefined;
  }
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  robots?: Metadata["robots"];
};

export function createPageMetadata({
  title,
  description,
  path,
  image = "/SAMARA-LOGO.png",
  imageAlt = siteName,
  robots,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const normalizedDescription = description.replace(/\s+/g, " ").trim();
  const searchDescription = normalizedDescription.length > 160
    ? `${normalizedDescription.slice(0, 157).trimEnd()}...`
    : normalizedDescription;

  return {
    title,
    description: searchDescription,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title,
      description: searchDescription,
      siteName,
      locale: siteLocale,
      type: "website",
      ...(canonical ? { url: canonical } : {}),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: imageAlt }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: searchDescription,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: imageAlt }] } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}

export function createPrivatePageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export function createBreadcrumbList(items: Array<{ name: string; path: string }>) {
  const itemListElement = items.map((item, index) => {
    const url = absoluteUrl(item.path);
    return url
      ? { "@type": "ListItem", position: index + 1, name: item.name, item: url }
      : null;
  });

  if (itemListElement.some((item) => item === null)) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export const defaultRobots: Metadata["robots"] = {
  index: indexingAllowed,
  follow: indexingAllowed,
  googleBot: {
    index: indexingAllowed,
    follow: indexingAllowed,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export function absoluteImageUrl(image: string) {
  return absoluteUrl(image);
}