"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiCheck,
  FiChevronLeft,
  FiMinus,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import { addPackToCart } from "@/lib/cart";
import { getPackSavings, getPackStock } from "@/lib/packs";
import type { Pack } from "@/types/catalog";

export function PackDetails({ pack }: { pack: Pack }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  
  const stock = getPackStock(pack);
  const savings = getPackSavings(pack);
  const total = pack.price * quantity;

  // Accurate reduction percentage calculation
  const discountPercentage =
    pack.originalPrice && pack.originalPrice > pack.price
      ? Math.round(((pack.originalPrice - pack.price) / pack.originalPrice) * 100)
      : 0;

  function addToCart() {
    addPackToCart(pack, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-white text-neutral-950 selection:bg-neutral-950 selection:text-white"
    >
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8 lg:pb-24 lg:pt-6">
        
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="مسار التنقل"
          className="mb-6 flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-semibold text-neutral-400"
        >
          <Link href="/" className="transition-colors hover:text-neutral-950">
            الرئيسية
          </Link>
          <FiChevronLeft className="h-3 w-3" />
          <Link href="/packs" className="transition-colors hover:text-neutral-950">
            الباقات
          </Link>
          <FiChevronLeft className="h-3 w-3" />
          <span className="max-w-[200px] truncate text-neutral-900 font-bold">
            {pack.name}
          </span>
        </nav>

        {/* 2-Column Product Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14 lg:[direction:ltr]">
          
          {/* =====================================================
              PACK IMAGE SHOWCASE
          ====================================================== */}
          <section dir="rtl" className="w-full">
            <div className="relative aspect-square w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
              {pack.image ? (
                <Image
                  src={pack.image}
                  alt={pack.name}
                  fill
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                  لا توجد صورة
                </div>
              )}

              {/* Reduction Percentage Badge */}
              {discountPercentage > 0 && (
                <span className="absolute right-3 top-3 rounded-xs bg-[#8B102F] px-2.5 py-1 text-[11px] font-black text-white shadow-xs">
                  -{discountPercentage}%
                </span>
              )}

              {/* Tag */}
              <span className="absolute left-3 top-3 rounded-xs border border-neutral-200 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-neutral-900 shadow-2xs backdrop-blur-xs">
                باقة توفير ({pack.items.length} قطع)
              </span>
            </div>

            {/* Availability Indicator */}
            <div className="mt-3 flex items-center justify-between px-1 text-[11px]">
              <span className={`flex items-center gap-1.5 font-bold ${stock > 0 ? "text-emerald-700" : "text-red-700"}`}>
                <span className={`h-2 w-2 rounded-full ${stock > 0 ? "bg-emerald-600" : "bg-red-700"}`} />
                {stock > 0 ? "متوفر في المخزون" : "نفدت الباقة"}
              </span>
              <span className="text-neutral-500">
                متبقي <strong className="text-neutral-900">{stock}</strong> باقات فقط
              </span>
            </div>
          </section>

          {/* =====================================================
              PACK DETAILS & CHECKOUT SECTION
          ====================================================== */}
          <section dir="rtl" className="w-full lg:sticky lg:top-6 text-right">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B102F]">
                باقة حصرية
              </span>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl lg:text-4xl leading-snug">
                {pack.name}
              </h1>

              {/* Pricing & Savings */}
              <div className="mt-4 flex flex-wrap items-baseline gap-3 border-b border-neutral-100 pb-5">
                <span className="text-3xl font-black text-[#8B102F]">
                  {pack.price.toLocaleString("ar-MA")}
                  <span className="mr-1 text-sm font-bold text-neutral-600">د.م</span>
                </span>

                {pack.originalPrice && pack.originalPrice > pack.price && (
                  <span className="text-sm font-semibold text-neutral-400 line-through">
                    {pack.originalPrice.toLocaleString("ar-MA")} د.م
                  </span>
                )}

                {savings > 0 && (
                  <span className="rounded-xs bg-[#f7e9ed] px-2 py-0.5 text-xs font-black text-[#8B102F]">
                    وفر {savings.toLocaleString("ar-MA")} د.م
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-xs leading-6 text-neutral-600 sm:text-sm">
                {pack.description ||
                  "احصل على المجموعة المتكاملة بسعر مخفض مع ضمان الجودة وتوصيل مباشر لباب بيتك."}
              </p>

              {/* Included Items Details */}
              <div className="mt-6 rounded-md border border-neutral-200 bg-neutral-50/60 p-4">
                <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
                  <h2 className="text-xs font-black text-neutral-900">
                    محتويات هذه الباقة ({pack.items.length} قطع)
                  </h2>
                  <span className="text-[10px] text-neutral-500 font-semibold">
                    شاملة في العرض
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {pack.items.map((item) => (
                    <Link
                      key={item.product.id}
                      href={item.productUrl || `/products/${item.product.id}`}
                      target={item.productUrl?.startsWith("http") ? "_blank" : undefined}
                      rel={item.productUrl?.startsWith("http") ? "noreferrer" : undefined}
                      className="group flex items-center justify-between rounded-md border border-neutral-200/70 bg-white p-2 transition hover:border-[#8B102F]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-11 shrink-0 overflow-hidden rounded-xs border border-neutral-200 bg-neutral-100">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="48px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div>
                          <p className="line-clamp-1 text-xs font-bold text-neutral-900 group-hover:text-[#8B102F]">
                            {item.product.name}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {item.product.price.toLocaleString("ar-MA")} د.م (سعر منفرد)
                          </p>
                        </div>
                      </div>

                      <span className="rounded-xs bg-neutral-100 px-2 py-0.5 text-[10px] font-black text-neutral-700">
                        {item.quantity}×
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-6">
                <span className="mb-2 block text-xs font-bold text-neutral-900">عدد الباقات</span>
                <div className="flex w-fit items-center rounded-md border border-neutral-200 bg-white">
                  <button
                    type="button"
                    aria-label="تقليل الكمية"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <FiMinus className="h-3.5 w-3.5" />
                  </button>

                  <span className="w-10 text-center text-sm font-black text-neutral-950">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="زيادة الكمية"
                    disabled={quantity >= stock}
                    onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Primary Add to Cart Button (Burgundy -> Hover Black) */}
              <button
                type="button"
                onClick={addToCart}
                disabled={stock < 1}
                className="cart-action-button mt-6 flex h-13 w-full cursor-pointer items-center justify-center gap-3 rounded-md px-6 text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {added ? (
                  <>
                    <FiCheck className="h-5 w-5" />
                    <span>تمت إضافة الباقة إلى السلة</span>
                  </>
                ) : (
                  <>
                    <FiShoppingBag className="h-5 w-5" />
                    <span>أضف الباقة إلى السلة</span>
                    <span className="h-4 w-px bg-white/30" />
                    <span>{total.toLocaleString("ar-MA")} د.م</span>
                  </>
                )}
              </button>

              {/* Trust Badges Bar */}
              <div className="mt-7 grid grid-cols-2 divide-x divide-x-reverse divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-50/70 py-3.5">
                <div className="flex items-center gap-2.5 px-3">
                  <FiTruck className="h-5 w-5 shrink-0 text-[#8B102F]" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">شحن مجاني شامل</p>
                    <p className="text-[10px] text-neutral-500">توصيل سريع لباب بيتك</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3">
                  <FiShield className="h-5 w-5 shrink-0 text-[#8B102F]" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">الدفع عند الاستلام</p>
                    <p className="text-[10px] text-neutral-500">تفحص باقتك قبل الأداء</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>

      </div>
    </main>
  );
}