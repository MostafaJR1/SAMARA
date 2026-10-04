import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  FiCreditCard,
  FiChevronLeft,
  FiMapPin,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import { FAQAccordion } from "@/components/FAQAccordion";
import { HomePackButton } from "@/components/HomePackButton";
import { HomeProductCard } from "@/components/HomeProductCard";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getBestSellingProducts } from "@/lib/best-sellers";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { getProductMedia } from "@/lib/product-media";
import { getProductsFromDatabase } from "@/lib/products-server";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProductsFromDatabase();
  const featuredProduct = products.find((product) => product.isFeatured) ?? products[0];

  return createPageMetadata({
    title: "متجر سمارة المغربي للمنتجات المنزلية",
    description: featuredProduct
      ? `تعرّف على ${featuredProduct.name} واكتشف منتجات منزلية وباقات مختارة في متجر سمارة، مع الشحن المجاني والدفع عند الاستلام في المغرب.`
      : "اكتشف منتجات منزلية وباقات مختارة في متجر سمارة، مع الشحن المجاني والدفع عند الاستلام في المغرب.",
    path: "/",
    ...(featuredProduct ? { image: featuredProduct.image, imageAlt: featuredProduct.name } : {}),
  });
}

export default async function Home() {
  const products = await getProductsFromDatabase();
  const featuredProduct = products.find((product) => product.isFeatured) ?? products[0];

  if (!featuredProduct) return null;

  const [packs, bestSellingProducts] = await Promise.all([
    getPacksFromDatabase(products),
    getBestSellingProducts(),
  ]);
  const featuredPack = packs[0];
  const featuredProductSavings = Math.max(0, featuredProduct.oldPrice - featuredProduct.price);
  const packSavings = featuredPack
    ? Math.max(0, featuredPack.originalPrice - featuredPack.price)
    : 0;
  const featuredProductIds = new Set([featuredProduct.id]);
  const bestSellers = bestSellingProducts
    .filter((product) => !featuredProductIds.has(product.id))
    .slice(0, 4);
  for (const product of bestSellers) featuredProductIds.add(product.id);
  const collectionProducts = products
    .filter((product) => !featuredProductIds.has(product.id))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-[#8b102f] selection:text-white">
      <main dir="rtl" className="pb-12 sm:pb-16">
        <ScrollReveal>
          <section className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8">
            <div className="grid overflow-hidden border border-neutral-200 bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
              <div className="relative order-1 aspect-[4/3] overflow-hidden bg-[#f4f2ef] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[500px]">
                <ProductMediaCarousel
                  slides={getProductMedia(featuredProduct)}
                  name={featuredProduct.name}
                  autoPlay
                  interval={4500}
                  objectFit="contain"
                  mediaClassName="p-1 sm:p-2"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="absolute inset-0"
                />
              </div>

              <div className="order-2 flex flex-col justify-center bg-[#f8f7f5] px-5 py-5 text-neutral-950 sm:px-8 sm:py-7 lg:px-9 lg:py-12 xl:px-12">
                <span className="text-xs font-semibold text-[#8b102f]">
                  {featuredProduct.category}
                </span>
                <h1 className="mt-2 text-xl font-bold leading-snug sm:text-2xl lg:text-3xl">
                  {featuredProduct.name || featuredProduct.features[0]}
                </h1>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600 sm:text-sm">
                  {featuredProduct.description || featuredProduct.features[1] || "اكتشف هذا المنتج الرائع الآن!"}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 lg:mt-7 lg:flex-col lg:items-start">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="flex flex-nowrap items-baseline gap-x-2 whitespace-nowrap">
                      <span className="text-xl font-bold text-[#8b102f] sm:text-2xl">
                        {featuredProduct.price.toLocaleString("ar-MA")} د.م
                      </span>
                      {featuredProductSavings > 0 && (
                        <del className="text-xs text-neutral-500">
                          {featuredProduct.oldPrice.toLocaleString("ar-MA")} د.م
                        </del>
                      )}
                    </span>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <Link
                      href={`/products/${featuredProduct.id}`}
                      className="cart-action-button inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded px-4 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b102f] sm:min-w-40"
                    >
                      <span>اطلب الآن</span>
                      {featuredProductSavings > 0 && (
                        <span className="border-r border-white/40 pr-2 text-[10px]">
                          وفر {featuredProductSavings.toLocaleString("ar-MA")} د.م
                        </span>
                      )}
                      <FiShoppingBag aria-hidden="true" className="h-4 w-4 shrink-0" />
                    </Link>
                    <Link
                      href="/products"
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-dashed border-[#8b102f] bg-transparent px-4 text-xs font-semibold text-[#8b102f] transition hover:border-neutral-400 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b102f]"
                    >
                      تصفح المنتجات
                      <FiChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section aria-label="مزايا التسوق" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
            <div className="grid grid-cols-3 border-y border-neutral-200">
              <TrustItem icon={FiTruck} title="شحن مجاني" text="على جميع الطلبات" />
              <TrustItem className="border-r border-neutral-200" icon={FiCreditCard} title="الدفع عند الاستلام" text="ادفع عند وصول طلبك" />
              <TrustItem className="border-r border-neutral-200" icon={FiMapPin} title="توصيل داخل المغرب" text="إلى جميع المدن" />
            </div>
          </section>
        </ScrollReveal>

        {bestSellers.length > 0 && (
          <ScrollReveal>
            <section id="best-selling-products" className="scroll-mt-24 mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
              <SectionHeading
                eyebrow="الأكثر طلباً"
                title="الأكثر مبيعاً"
                linkHref="/best-sellers"
                linkLabel="عرض الكل"
              />
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-4">
                {bestSellers.map((product) => (
                  <HomeProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {collectionProducts.length > 0 && (
          <ScrollReveal>
            <section id="products" className="scroll-mt-24 mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
              <SectionHeading
                eyebrow="تشكيلة المتجر"
                title="تسوق حسب احتياجك"
                linkHref="/products"
                linkLabel="كل المنتجات"
              />
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-4">
                {collectionProducts.map((product) => (
                  <HomeProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {featuredPack && (
          <ScrollReveal>
            <section id="featured-offer" className="scroll-mt-24 mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-11 lg:px-8">
              <div className="grid border-y border-neutral-200 lg:grid-cols-2">
                <div className="relative aspect-[4/3] bg-[#f8f7f6] lg:aspect-auto lg:min-h-[340px]">
                  <Image
                    src={featuredPack.image}
                    alt={featuredPack.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-4 sm:p-7"
                  />
                </div>
                <div className="flex flex-col items-start justify-center p-5 sm:p-9 lg:p-12">
                  <span className="border-r-2 border-[#8b102f] px-2.5 py-1 text-xs font-bold text-[#8b102f]">
                    باقة مختارة
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-neutral-950 sm:text-2xl">
                    {featuredPack.name}
                  </h2>
                  {featuredPack.description && (
                    <p className="mt-3 text-sm leading-7 text-neutral-600">
                      {featuredPack.description}
                    </p>
                  )}
                  {featuredPack.items.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {featuredPack.items.slice(0, 3).map(({ product, quantity }) => (
                        <li key={product.id} className="border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600">
                          {product.name}{quantity > 1 ? ` × ${quantity}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl font-black text-[#8b102f]">
                      {featuredPack.price.toLocaleString("ar-MA")} د.م
                    </span>
                    {featuredPack.originalPrice > featuredPack.price && (
                      <del className="text-sm font-medium text-neutral-500">
                        {featuredPack.originalPrice.toLocaleString("ar-MA")} د.م
                      </del>
                    )}
                    {packSavings > 0 && (
                      <span className="text-xs font-bold text-[#8b102f]">
                        وفر {packSavings.toLocaleString("ar-MA")} د.م
                      </span>
                    )}
                  </div>
                  <HomePackButton pack={featuredPack} />
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-11 lg:px-8">
            <div className="mb-4 text-right sm:mb-5">
              <p className="text-xs font-bold text-[#8b102f]">معلومات تهمك</p>
              <h2 className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">
                الأسئلة المتكررة
              </h2>
            </div>
            <FAQAccordion />
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-11 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-5 bg-[#8b102f] px-5 py-6 text-white sm:flex-row sm:items-center sm:px-8 sm:py-7">
              <div className="text-right">
                <p className="text-xs font-semibold text-white/75">خطوتك التالية</p>
                <h2 className="mt-1 text-lg font-bold sm:text-xl">اختر ما يناسبك من منتجات سمارة</h2>
                <p className="mt-1.5 text-xs leading-5 text-white/80 sm:text-sm">
                  تسوّق التشكيلة كاملة، مع الشحن المجاني والدفع عند الاستلام.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded border border-white bg-white px-6 text-sm font-bold text-[#8b102f] transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                تسوق المنتجات <FiChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  linkHref,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-neutral-200 pb-2.5 text-right sm:mb-4">
      <div>
        <p className="text-[11px] font-semibold text-neutral-500">{eyebrow}</p>
        <h2 className="mt-0.5 text-lg font-bold text-neutral-950 sm:text-xl">{title}</h2>
      </div>
      <Link href={linkHref} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#8b102f] hover:underline">
        {linkLabel}
        <FiChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  text,
  className = "",
}: {
  icon: typeof FiTruck;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 px-1.5 py-3 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-4 sm:py-4 sm:text-right ${className}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[#8b102f] sm:h-8 sm:w-8">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold text-neutral-900 sm:text-xs">{title}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-neutral-500 sm:text-[11px]">{text}</span>
      </span>
    </div>
  );
}
