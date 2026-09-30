import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { getProductsFromDatabase } from "@/lib/products-server";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);

  return createPageMetadata({
    title: "الباقات المنسقة",
    description: `استعرض ${packs.length} من الباقات المتاحة في متجر سمارة، مع تفاصيل المنتجات وسعر كل باقة.`,
    path: "/packs",
  });
}

export default async function PacksPage() {
  const products = await getProductsFromDatabase();
  const packs = await getPacksFromDatabase(products);

  return (
    <div className="min-h-screen bg-white text-neutral-950">

      <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              تشكيلات خاصة
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">الباقات المنسقة</h1>
            <p className="mt-2 max-w-lg text-xs leading-6 text-neutral-500">
              مجموعات مختارة معًا لتمنحك قيمة أفضل وتوفيراً أكبر مقارنة بالشراء الفردي.
            </p>
          </div>

          <span className="text-xs font-semibold text-neutral-500">
            {packs.length} {packs.length === 1 ? "باقة متاحة" : "باقات متاحة"}
          </span>
        </div>

        {/* Packs Grid */}
        {packs.length === 0 ? (
          <div className="mt-12 rounded-md border border-neutral-200 py-16 text-center">
            <p className="text-sm font-bold text-neutral-800">لا توجد باقات متاحة حالياً</p>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#8B102F] hover:underline"
            >
              تصفح كل المنتجات <FiArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {packs.map((pack) => {
              const savings =
                pack.originalPrice && pack.originalPrice > pack.price
                  ? pack.originalPrice - pack.price
                  : 0;

              return (
                <Link
                  key={pack.id}
                  href={`/packs/${pack.slug}`}
                  className="group flex flex-col overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-[#8B102F] sm:grid sm:grid-cols-[1fr_1.15fr]"
                >
                  {/* Pack Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 sm:aspect-auto sm:h-full">
                    <Image
                      src={pack.image}
                      alt={pack.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-103"
                    />

                    {savings > 0 && (
                      <span className="absolute top-3 right-3 rounded-sm bg-[#8B102F] px-2 py-0.5 text-[10px] font-bold text-white">
                        وفر {savings.toLocaleString("ar-MA")} د.م
                      </span>
                    )}
                  </div>

                  {/* Pack Details */}
                  <div className="flex flex-1 flex-col justify-between p-5 text-right sm:p-6">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#8B102F]">
                          {pack.items?.length || 2} قطع في الباقة
                        </span>
                      </div>

                      <h2 className="mt-2 text-lg font-black text-neutral-900 transition group-hover:text-[#8B102F] sm:text-xl">
                        {pack.name}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">
                        {pack.description}
                      </p>

                      {/* Mini Preview of Included Items */}
                      {pack.items && pack.items.length > 0 && (
                        <div className="mt-4 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
                          <span className="text-[10px] font-semibold text-neutral-400">تشمل:</span>
                          <span className="line-clamp-1 text-[11px] font-medium text-neutral-700">
                            {pack.items.map((it) => it.product.name).join(" + ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="mt-6 flex items-baseline justify-between border-t border-neutral-100 pt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-neutral-950">
                          {pack.price.toLocaleString("ar-MA")} د.م
                        </span>
                        {pack.originalPrice && pack.originalPrice > pack.price && (
                          <span className="text-xs text-neutral-400 line-through">
                            {pack.originalPrice.toLocaleString("ar-MA")} د.م
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 transition group-hover:text-[#8B102F]">
                        اكتشف الباقة
                        <FiArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}