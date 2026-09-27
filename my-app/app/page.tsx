import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiCreditCard,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import { HomeProductCard } from "@/components/HomeProductCard";
import { HomePackButton } from "@/components/HomePackButton";
import { FAQAccordion } from "@/components/FAQAccordion";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getProductsFromDatabase } from "@/lib/products-server";
import { getPacksFromDatabase } from "@/lib/packs-server";

export default async function Home() {
  const products = await getProductsFromDatabase();
  const featuredProduct = products.find((product) => product.isFeatured) ?? products[0];
  const featuredProductSavings =
    featuredProduct && featuredProduct.oldPrice > featuredProduct.price
      ? featuredProduct.oldPrice - featuredProduct.price
      : 0;
  const packs = await getPacksFromDatabase(products);
  const featuredPack = packs[0];

  const packProducts =
    featuredPack?.items.map((item) => item.product) ?? products.slice(0, 2);
  const packOriginalPrice =
    featuredPack?.originalPrice ??
    packProducts.reduce((total, product) => total + product.price, 0);
  const packPrice = featuredPack?.price ?? packOriginalPrice;
  const packSavings = Math.max(0, packOriginalPrice - packPrice);

  const secondaryProducts = products
    .filter((product) => product.id !== featuredProduct?.id)
    .sort((first, second) => {
      const firstFeatured = first.badge?.includes("الأكثر") ? 1 : 0;
      const secondFeatured = second.badge?.includes("الأكثر") ? 1 : 0;
      return secondFeatured - firstFeatured || second.rating - first.rating;
    });

  if (!featuredProduct) return null;

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-neutral-950 selection:text-white">
      <main dir="rtl" className="overflow-hidden pb-16 sm:pb-0">
        
        {/* ========================================================
            SECTION 1: HERO SHOWCASE (Framed Container with Depth)
        ======================================================== */}
        <ScrollReveal>
        <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-6 lg:px-8">
              <div className="relative grid aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-950 text-white lg:aspect-auto lg:grid-cols-[minmax(0,1fr)_380px]" dir="ltr">
                <div className="absolute inset-0 overflow-hidden bg-neutral-100 lg:relative lg:order-2 lg:aspect-square lg:w-full">
              <Image
                src={featuredProduct.image}
                alt={featuredProduct.name}
                fill
                priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
              />
                </div>

                <div className="relative z-10 order-2 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 text-right sm:p-6 lg:order-1 lg:justify-center lg:bg-none lg:p-10" dir="rtl">
                  <h1 className="text-xl font-black leading-snug text-white sm:text-3xl">
                    {featuredProduct.features[0] || featuredProduct.name}
                  </h1>

                  <p className="mt-3 line-clamp-1 text-xs leading-5 text-neutral-200 sm:mt-4 sm:text-sm">
                    {featuredProduct.name}: {featuredProduct.description}
                  </p>

                  {featuredProduct.features.length > 1 && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-white sm:mt-4 sm:text-xs">
                      {featuredProduct.features.slice(1, 3).map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5">
                          <FiCheck aria-hidden="true" className="h-3 w-3 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 sm:mt-5">
                    <span className="text-3xl font-black text-white sm:text-4xl">
                      {featuredProduct.price.toLocaleString("ar-MA")} د.م
                    </span>
                    {featuredProductSavings > 0 && (
                      <>
                        <del className="text-xs font-medium text-neutral-300 sm:text-sm">
                          {featuredProduct.oldPrice.toLocaleString("ar-MA")} د.م
                        </del>
                        <span className="rounded-sm bg-[#8B102F] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          وفر {featuredProductSavings.toLocaleString("ar-MA")} د.م
                        </span>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/products/${featuredProduct.id}`}
                    className="cart-action-button mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-6 text-white sm:w-auto sm:min-w-48"
                  >
                    اطلب الآن <FiArrowLeft className="h-3.5 w-3.5" />
                  </Link>

                  <p className="mt-2 text-[10px] font-semibold text-neutral-200 sm:text-xs">
                    الدفع عند الاستلام <span className="mx-1.5">·</span> توصيل مجاني في المغرب
                  </p>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ========================================================
            SECTION 2: TRUST SIGNALS (Subtle Warm Slate Tone)
        ======================================================== */}
        <ScrollReveal>
        <section className="mt-6 border-y border-neutral-200/80 bg-[#fbf9fa] py-5 sm:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <TrustItem
                icon={FiTruck}
                title="توصيل في المغرب"
                text="إلى باب منزلك"
              />
              <TrustItem
                icon={FiTruck}
                title="الشحن مجاني"
                text="على جميع الطلبات"
              />
              <TrustItem
                icon={FiCreditCard}
                title="الدفع عند الاستلام"
                text="أرسل طلبك دون بطاقة بنكية"
              />
              <TrustItem
                icon={FiCheck}
                title="طلب واضح"
                text="السعر والخصائص قبل الإضافة للسلة"
              />
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ========================================================
            SECTION 6: PRODUCT SPOTLIGHT (Soft Tinted Card Stage)
        ======================================================== */}
        <ScrollReveal>
        <section id="featured-offer" className="scroll-mt-24 border-y border-neutral-200/80 bg-[#f7f4f5] py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-md border border-neutral-200 bg-white p-5 sm:p-8">
              <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
                {/* Image Showcase */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-100">
                  <Image
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {featuredProduct.rating > 0 && (
                    <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-xs bg-white px-2 py-1 text-[10px] font-bold text-neutral-900">
                      <FiStar className="h-3 w-3 fill-amber-400 text-amber-500" />
                      {featuredProduct.rating} / 5
                    </span>
                  )}
                </div>

                {/* Minimalist Key Benefits List */}
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B102F]">
                    لماذا هذا المنتج؟
                  </span>

                  <h2 className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">
                    {featuredProduct.name}
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-neutral-600">{featuredProduct.description}</p>

                  <ul className="mt-4 grid gap-2 text-xs font-semibold text-neutral-700 sm:grid-cols-2">
                    {featuredProduct.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-xs bg-[#f7e9ed] text-[#8B102F]">
                        <FiCheck className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                    ))}
                  </ul>

                  {/* Pricing and Action */}
                  <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
                    <Link
                      href={`/products/${featuredProduct.id}`}
                      className="cart-action-button inline-flex h-11 items-center justify-center gap-1.5 rounded-md px-7 text-white"
                    >
                      اطلب الآن <FiShoppingBag className="h-3.5 w-3.5" />
                    </Link>
                    <div className="text-right">
                      <span className="block text-[10px] font-medium text-neutral-500">الشحن مجاني والدفع عند الاستلام</span>
                      {featuredProductSavings > 0 && (
                        <>
                          <del className="ml-2 text-sm font-medium text-neutral-500">{featuredProduct.oldPrice.toLocaleString("ar-MA")} د.م</del>
                          <span className="ml-2 text-[10px] font-bold text-[#8B102F]">وفرت {featuredProductSavings.toLocaleString("ar-MA")} د.م</span>
                        </>
                      )}
                      <span className="text-2xl font-black text-[#8B102F]">
                        {featuredProduct.price.toLocaleString("ar-MA")} د.م
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ========================================================
    SECTION 7: BUNDLE VALUE OFFER (Samara Store Match)
======================================================== */}
{featuredPack && (
  <ScrollReveal>
  <section className="bg-white py-8 sm:py-10" dir="rtl">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      
      {/* Container: Matches the store's subtle border & sharp/soft radius */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6">
        
        {/* Images Grid with subtle '+' connector */}
        <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* Minimalist Plus Symbol */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-neutral-200 text-xs font-bold text-neutral-500 shadow-xs">
            +
          </div>

          {packProducts.map((product) => (
            <div key={product.id} className="flex flex-col">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-neutral-50 border border-neutral-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 300px"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-2 text-center text-xs font-bold text-neutral-800 line-clamp-1">
                {product.name}
              </h3>
            </div>
          ))}
        </div>

        {/* Offer Details: Title + Price + Savings Badge */}
        <div className="mt-5 border-t border-neutral-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900">
                {featuredPack.name}
              </h2>
              
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#8B102F]">
                  {packPrice.toLocaleString("ar-MA")}{" "}
                  <span className="text-xs font-bold">د.م</span>
                </span>
                {packOriginalPrice > packPrice && (
                  <span className="text-xs font-semibold text-neutral-400 line-through">
                    {packOriginalPrice.toLocaleString("ar-MA")} د.م
                  </span>
                )}
              </div>
            </div>

            {/* Savings Badge - Identical to store badges */}
            {packSavings > 0 && (
              <span className="shrink-0 rounded-xs bg-[#8B102F] px-2.5 py-1 text-[11px] font-bold text-white">
                وفر {packSavings.toLocaleString("ar-MA")} د.م
              </span>
            )}
          </div>

          {/* Action Button: Matches "أضف للسلة" full-width style */}
          <div className="mt-4 w-full">
            <HomePackButton pack={featuredPack} />
          </div>
        </div>

      </div>

    </div>
  </section>
  </ScrollReveal>
)}

        {secondaryProducts.length > 0 && (
          <ScrollReveal>
          <section className="bg-[#faf9f8] py-7 sm:py-9">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-3 flex items-end justify-between gap-3 text-right">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500">تشكيلة سمارة</span>
                  <h2 className="mt-0.5 text-lg font-black text-neutral-900 sm:text-xl">اكتشف منتجات أخرى</h2>
                </div>
                <Link href="/products" className="shrink-0 text-[10px] font-bold text-[#8B102F] hover:underline">
                  كل المنتجات <FiChevronLeft className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {secondaryProducts.slice(0, 4).map((product) => (
                  <HomeProductCard key={`other-${product.id}`} product={product} />
                ))}
              </div>
            </div>
          </section>
          </ScrollReveal>
        )}

        {/* ========================================================
            SECTION 9: FAQ SECTION (Clean White Background)
        ======================================================== */}
        <ScrollReveal>
        <section id="faq" className="scroll-mt-24 bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                إجابات مباشرة
              </span>
              <h2 className="mt-0.5 text-lg font-black text-neutral-900 sm:text-xl">
                الأسئلة المتكررة
              </h2>
            </div>
            <FAQAccordion />
          </div>
        </section>
        </ScrollReveal>

        {/* ========================================================
            SECTION 10: BOTTOM FINAL CONVERSION BANNER
        ======================================================== */}
        <ScrollReveal>
        <section className="border-t border-neutral-200 bg-[#f7f4f5] py-7 sm:py-9">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-8 lg:gap-12">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-md bg-white sm:mx-0 sm:aspect-[5/3]">
                <Image
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 45vw"
                  className="object-contain p-3 sm:p-5"
                />
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-[#8B102F]">جاهز للطلب</span>
                <h2 className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">
                  {featuredProduct.name}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-600 sm:text-sm">
                  {featuredProduct.description}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-2xl font-black text-[#8B102F] sm:text-3xl">
                    {featuredProduct.price.toLocaleString("ar-MA")} د.م
                  </span>
                  {featuredProductSavings > 0 && (
                    <>
                      <del className="text-xs text-neutral-500">
                        {featuredProduct.oldPrice.toLocaleString("ar-MA")} د.م
                      </del>
                      <span className="text-[10px] font-bold text-[#8B102F]">
                        وفر {featuredProductSavings.toLocaleString("ar-MA")} د.م
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <Link
                    href={`/products/${featuredProduct.id}`}
                    className="cart-action-button inline-flex h-11 items-center justify-center gap-2 rounded-md px-7 text-white sm:min-w-44"
                  >
                    اطلب الآن <FiArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-center text-[10px] font-semibold text-neutral-600 sm:text-right sm:text-xs">
                    شحن مجاني في المغرب <span className="mx-1">·</span> الدفع عند الاستلام
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3" dir="rtl">
          <div className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold text-neutral-500">{featuredProduct.name}</span>
            <span className="text-sm font-black text-[#8B102F]">{featuredProduct.price.toLocaleString("ar-MA")} د.م</span>
          </div>
          <Link href={`/products/${featuredProduct.id}`} className="cart-action-button inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-white">
            اطلب الآن <FiArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FiTruck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-neutral-200/80 bg-white p-3 text-right">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-[#f7e9ed] text-[#8B102F]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <h3 className="text-[11px] font-black text-neutral-900">{title}</h3>
        <p className="mt-0.5 text-[9px] leading-4 text-neutral-500">{text}</p>
      </div>
    </div>
  );
}
