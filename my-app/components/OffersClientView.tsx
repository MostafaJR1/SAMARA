"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiPercent,
  FiTag,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import type { Pack, Product } from "@/types/catalog";
import { WishlistButton } from "@/components/WishlistButton";
import { addProductToCart } from "@/lib/cart";
import { getProductCardMedia } from "@/lib/product-media";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { StoreEmptyState } from "@/components/StoreEmptyState";

type TabFilter = "all" | "products" | "packs";

export function OffersClientView({
  products,
  packs,
}: {
  products: Product[];
  packs: Pack[];
}) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [addedProductId, setAddedProductId] = useState<string | number | null>(null);

  function handleAddToCart(product: Product) {
    addProductToCart(product.id, 1, product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1800);
  }

  const showProducts = activeTab === "all" || activeTab === "products";
  const showPacks = activeTab === "all" || activeTab === "packs";
  const hasVisibleOffers =
    (showPacks && packs.length > 0) || (showProducts && products.length > 0);

  return (
    <div className="space-y-7 sm:space-y-9">
      
      {/* 1. Page Header */}
      <div className="border-b border-neutral-200 pb-4 text-right sm:pb-5">
        <span className="inline-flex items-center gap-1.5 border-r-2 border-[#8B102F] px-2.5 py-1 text-[10px] font-semibold text-[#8B102F]">
          <FiPercent className="h-3.5 w-3.5" />
          تخفيضات وعروض حصرية
        </span>

        <h1 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
          أفضل عروض التوفير
        </h1>

        <p className="mt-1.5 max-w-xl text-xs leading-5 text-neutral-600 sm:text-sm">
          استفد من خصومات استثنائية على منتجاتنا المختارة وباقات التوفير المنسقة، مع شحن مجاني لباب المنزل والدفع عند الاستلام.
        </p>
      </div>

      {/* 3. Filter Navigation Tabs */}
      <div className="border-b border-neutral-200 pb-3">
        <div role="tablist" aria-label="تصفية العروض" className="grid grid-cols-3 border-y border-neutral-200">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`flex min-h-10 items-center justify-center gap-1 border-b-2 px-2 text-[10px] font-semibold transition-colors sm:text-xs ${
              activeTab === "all"
                ? "border-[#8B102F] text-[#8B102F]"
                : "border-transparent text-neutral-600 hover:text-[#8B102F]"
            }`}
          >
            <span>كل العروض</span><span className={activeTab === "all" ? "text-white/75" : "text-neutral-400"}>{products.length + packs.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            className={`flex min-h-10 items-center justify-center gap-1 border-b-2 px-2 text-[10px] font-semibold transition-colors sm:text-xs ${
              activeTab === "products"
                ? "border-[#8B102F] text-[#8B102F]"
                : "border-transparent text-neutral-600 hover:text-[#8B102F]"
            }`}
          >
            <span>المنتجات</span><span className={activeTab === "products" ? "text-white/75" : "text-neutral-400"}>{products.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "packs"}
            onClick={() => setActiveTab("packs")}
            className={`flex min-h-10 items-center justify-center gap-1 border-b-2 px-2 text-[10px] font-semibold transition-colors sm:text-xs ${
              activeTab === "packs"
                ? "border-[#8B102F] text-[#8B102F]"
                : "border-transparent text-neutral-600 hover:text-[#8B102F]"
            }`}
          >
            <span>الباقات</span><span className={activeTab === "packs" ? "text-white/75" : "text-neutral-400"}>{packs.length}</span>
          </button>
        </div>

        <span className="mt-2 block text-right text-[10px] font-medium text-neutral-500 sm:text-xs">
          التوصيل مجاني لجميع العروض
        </span>
      </div>

      {/* 4. Discounted Packs Section */}
      {showPacks && packs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
              باقات العروض المدمجة
            </h2>
            <Link
              href="/packs"
              className="flex items-center gap-1 text-xs font-semibold text-[#8B102F] hover:underline"
            >
              عرض كل الباقات <FiArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
            {packs.map((pack) => {
              const packSavings =
                pack.originalPrice && pack.originalPrice > pack.price
                  ? pack.originalPrice - pack.price
                  : 0;

              return (
                <article
                    key={pack.id}
                    className="grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden border-b border-neutral-200 bg-white sm:grid-cols-[160px_minmax(0,1fr)]"
                  >
                    <div className="relative min-h-32 bg-[#f8f7f6] sm:min-h-40">
                    <Image
                      src={pack.image}
                      alt={pack.name}
                      fill
                        sizes="(max-width: 640px) 112px, 160px"
                        className="object-contain p-2"
                    />
                    {packSavings > 0 && (
                      <span className="absolute right-2 top-2 rounded-sm border border-neutral-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#8B102F]">
                        وفر {packSavings.toLocaleString("ar-MA")} د.م
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col justify-between p-3 text-right sm:p-4">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8B102F]">
                        {pack.items?.length || 2} قطع في الباقة
                      </span>
                      <h3 className="mt-1 text-xs font-black text-neutral-900 sm:text-sm">
                        {pack.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-neutral-600 sm:text-xs sm:leading-5">
                        {pack.description}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-2.5 sm:mt-4 sm:pt-3">
                      <div className="flex flex-nowrap items-baseline gap-2 whitespace-nowrap">
                        <span className="text-sm font-black text-[#8B102F]">
                          {pack.price.toLocaleString("ar-MA")} د.م
                        </span>
                        {pack.originalPrice && pack.originalPrice > pack.price && (
                          <span className="text-[10px] text-neutral-500 line-through">
                            {pack.originalPrice.toLocaleString("ar-MA")} د.م
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/packs/${pack.slug}`}
                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded border border-neutral-300 px-2.5 text-[10px] font-semibold text-neutral-700 transition-colors hover:border-[#8B102F] hover:text-[#8B102F]"
                      >
                        <span>اكتشف الباقة</span>
                        <FiArrowLeft className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Discounted Products Grid */}
      {showProducts && products.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
              المنتجات بتخفيضات مباشرة
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-semibold text-[#8B102F] hover:underline"
            >
              كل المنتجات <FiArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-4">
            {products.map((product) => {
              const hasOld = Boolean(product.oldPrice && product.oldPrice > product.price);
              const saving = hasOld ? product.oldPrice - product.price : 0;
              const discountPercentage = hasOld
                ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                : product.discount || 0;

              const isAdded = addedProductId === product.id;

              return (
                <article
                  key={product.id}
                  className="group min-w-0 border-b border-neutral-200 pb-3"
                >
                  {/* Image Showcase */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f6]">
                    <ProductMediaCarousel slides={getProductCardMedia(product)} name={product.name} objectFit="contain" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="p-1.5 sm:p-2" />
                    <Link href={`/products/${product.id}`} aria-label={`عرض ${product.name}`} className="absolute inset-0 z-10" />

                    {/* Wishlist Button */}
                    <div className="absolute left-1.5 top-1.5 z-30 sm:left-2 sm:top-2">
                      <WishlistButton productId={product.id} />
                    </div>

                    {/* Reduction Percentage Badge */}
                    {discountPercentage > 0 && (
                      <span className="absolute right-1.5 top-1.5 z-30 rounded-sm border border-neutral-200 bg-white px-2 py-1 text-[9px] font-semibold text-[#8B102F] sm:right-2 sm:top-2">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="flex flex-1 flex-col justify-between px-0.5 pt-3 text-right sm:px-1 sm:pt-4">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span>{product.category}</span>
                        <span className="flex items-center gap-0.5 font-semibold text-neutral-600">
                          <FiStar className="h-3 w-3 fill-amber-400 text-amber-500" />
                          {product.rating}
                        </span>
                      </div>

                      <Link href={`/products/${product.id}`}>
                        <h3 className="mt-1 min-h-10 line-clamp-2 text-xs font-semibold leading-5 text-neutral-900 group-hover:text-[#8B102F]">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price & Savings */}
                      <div className="mt-2 flex flex-nowrap items-baseline gap-1.5 whitespace-nowrap">
                        <span className="text-xs font-black text-[#8B102F] sm:text-base">
                          {product.price.toLocaleString("ar-MA")} د.م
                        </span>
                        {hasOld && (
                          <span className="text-[9px] text-neutral-400 line-through sm:text-xs">
                            {product.oldPrice.toLocaleString("ar-MA")} د.م
                          </span>
                        )}
                      </div>

                      {saving > 0 && (
                          <p className="mt-0.5 text-[10px] font-semibold text-[#8B102F]">
                          وفر {saving.toLocaleString("ar-MA")} د.م
                        </p>
                      )}
                    </div>

                    {/* Fast Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="cart-action-button mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded px-2 text-xs text-white"
                    >
                      {isAdded ? (
                        <>
                          <FiCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>أضيف للسلة!</span>
                        </>
                      ) : (
                        <>
                          <FiShoppingBag className="h-3.5 w-3.5" />
                          <span>أضف للسلة</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!hasVisibleOffers && (
        <StoreEmptyState
          icon={<FiTag aria-hidden="true" className="h-5 w-5" />}
          title="لا توجد عروض حالياً"
        >
          <Link
            href="/products"
            className="cart-action-button inline-flex h-10 items-center justify-center gap-2 rounded px-5 text-xs font-semibold text-white"
          >
            تصفح المنتجات <FiArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </StoreEmptyState>
      )}

      {/* 6. Minimal Trust Reassurance Strip */}
      <section
        aria-label="شروط العروض"
        className="grid grid-cols-1 divide-y divide-neutral-200 border-y border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse"
      >
        <div className="flex items-center gap-3 py-3 text-right sm:px-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#8B102F]">
            <FiTruck className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-black text-neutral-900">شحن مجاني</h4>
            <p className="text-[10px] text-neutral-500">يشمل جميع عروض وتخفيضات هذه الصفحة</p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-3 text-right sm:px-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#8B102F]">
            <FiCreditCard className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-black text-neutral-900">الدفع عند الاستلام</h4>
            <p className="text-[10px] text-neutral-500">ادفع نقداً فقط بعد تفحص طلبك ومعاينته</p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-3 text-right sm:px-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#8B102F]">
            <FiShield className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-black text-neutral-900">ضمان الجودة</h4>
            <p className="text-[10px] text-neutral-500">منتجات أصلية مطابقة للصور والوصف</p>
          </div>
        </div>
      </section>

    </div>
  );
}