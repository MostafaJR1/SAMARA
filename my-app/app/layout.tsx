import type { Metadata } from "next";
import { Alexandria, Ruwudu, Tajawal } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AddToCartModal } from "../components/AddToCartModal";
import { getAuthContext } from "@/lib/auth";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/JsonLd";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { getProductsFromDatabase } from "@/lib/products-server";
import {
  absoluteUrl,
  defaultRobots,
  metadataBase,
  siteLanguage,
  siteLocale,
  siteName,
} from "@/lib/seo";

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const tajawalFont = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

const ruwudu = Ruwudu({
  variable: "--font-ruwudu",
  subsets: ["arabic", "latin"],
  weight: ["500"],
})

const homeTitle = "متجر سمارة المغربي للمنتجات المنزلية";
const homeDescription = "اكتشف منتجات منزلية وباقات مختارة في متجر سمارة، مع الشحن المجاني والدفع عند الاستلام في المغرب.";
const logoUrl = absoluteUrl("/SAMARA-LOGO.png");

export const metadata: Metadata = {
  metadataBase,
  applicationName: siteName,
  title: {
    default: homeTitle,
    template: "%s | سمارة",
  },
  description: homeDescription,
  robots: defaultRobots,
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    siteName,
    locale: siteLocale,
    type: "website",
    ...(logoUrl ? { images: [{ url: logoUrl, alt: siteName }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    ...(logoUrl ? { images: [{ url: logoUrl, alt: siteName }] } : {}),
  },
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/favicon.png",
    apple: "/SAMARA-LOGO.png",
  },
};

const organizationId = absoluteUrl("/#organization");
const organizationUrl = absoluteUrl("/");
const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      ...(organizationId ? { "@id": organizationId } : {}),
      ...(organizationUrl ? { url: organizationUrl } : {}),
      name: siteName,
      ...(logoUrl ? { logo: { "@type": "ImageObject", url: logoUrl } } : {}),
      areaServed: { "@type": "Country", name: "المغرب" },
    },
    {
      "@type": "WebSite",
      ...(organizationUrl ? { "@id": `${organizationUrl}#website`, url: organizationUrl } : {}),
      name: siteName,
      inLanguage: siteLanguage,
      publisher: organizationId
        ? { "@id": organizationId }
        : { "@type": "Organization", name: siteName },
    },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  let accountHref = "/auth";
  let accountLabel = "تسجيل الدخول";

  try {
    const { user } = await getAuthContext();
    if (user) {
      accountHref = "/admin";
      accountLabel = "لوحة الإدارة";
    }
  } catch {
    // Keep the account entry usable as a login link when auth is unavailable.
  }

  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);

  return (
    <html
      lang={siteLanguage}
      className={`${alexandria.className} ${tajawalFont.variable} ${ruwudu.variable} bg-white h-full antialiased`}
    >
      <body className="min-h-full w-full overflow-x-hidden flex flex-col">
        <JsonLd data={siteStructuredData} />
        <SpeedInsights />
        <Header accountHref={accountHref} accountLabel={accountLabel} products={products} packs={packs} />
        <AddToCartModal products={products} packs={packs} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
