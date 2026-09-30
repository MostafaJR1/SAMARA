"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiPercent,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import type { Pack, Product } from "@/types/catalog";
import { WishlistButton } from "@/components/WishlistButton";
import { addProductToCart } from "@/lib/cart";

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

  return (
    <div className="space-y-7 sm:space-y-8">
      
      {/* 1. Page Header */}
      <div className="border-b border-neutral-200 pb-5 text-right sm:pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#f7e9ed] px-2 py-1 text-[10px] font-bold text-[#8B102F]">
          <FiPercent className="h-3.5 w-3.5" />
          تخفيضات وعروض حصرية
        </span>

        <h1 className="mt-2 text-xl font-black text-neutral-950 sm:text-2xl lg:text-3xl">
          أفضل عروض التوفير
        </h1>

        <p className="mt-1.5 max-w-xl text-xs leading-5 text-neutral-600 sm:text-sm sm:leading-6">
          استفد من خصومات استثنائية على منتجاتنا المختارة وباقات التوفير المنسقة، مع شحن مجاني لباب المنزل والدفع عند الاستلام.
        </p>
      </div>

      {/* 3. Filter Navigation Tabs */}
      <div className="border-b border-neutral-200 pb-3">
        <div role="tablist" aria-label="تصفية العروض" className="grid grid-cols-3 gap-1.5 rounded-md bg-neutral-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[10px] font-bold transition sm:text-xs ${
              activeTab === "all"
                ? "bg-[#8B102F] text-white shadow-sm"
                : "text-neutral-600 hover:bg-white hover:text-[#8B102F]"
            }`}
          >
            <span>كل العروض</span><span className={activeTab === "all" ? "text-white/75" : "text-neutral-400"}>{products.length + packs.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            className={`flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[10px] font-bold transition sm:text-xs ${
              activeTab === "products"
                ? "bg-[#8B102F] text-white shadow-sm"
                : "text-neutral-600 hover:bg-white hover:text-[#8B102F]"
            }`}
          >
            <span>المنتجات</span><span className={activeTab === "products" ? "text-white/75" : "text-neutral-400"}>{products.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "packs"}
            onClick={() => setActiveTab("packs")}
            className={`flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[10px] font-bold transition sm:text-xs ${
              activeTab === "packs"
                ? "bg-[#8B102F] text-white shadow-sm"
                : "text-neutral-600 hover:bg-white hover:text-[#8B102F]"
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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-neutral-950 sm:text-lg">
              باقات العروض المدمجة
            </h2>
            <Link
              href="/packs"
              className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#8B102F]"
            >
              عرض كل الباقات <FiArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {packs.map((pack) => {
              const packSavings =
                pack.originalPrice && pack.originalPrice > pack.price
                  ? pack.originalPrice - pack.price
                  : 0;

              return (
                <article
                    key={pack.id}
                    className="grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-[#8B102F] sm:grid-cols-[130px_minmax(0,1fr)]"
                  >
                    <div className="relative min-h-32 bg-[#faf8f9] sm:min-h-36">
                    <Image
                      src={pack.image}
                      alt={pack.name}
                      fill
                        sizes="(max-width: 640px) 96px, 130px"
                        className="object-contain p-1.5"
                    />
                    {packSavings > 0 && (
                      <span className="absolute top-2 right-2 rounded-xs bg-[#8B102F] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        وفر {packSavings.toLocaleString("ar-MA")} د.م
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col justify-between p-3 text-right sm:p-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#8B102F]">
                        {pack.items?.length || 2} قطع في الباقة
                      </span>
                      <h3 className="mt-1 text-xs font-black text-neutral-900 sm:text-sm">
                        {pack.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-neutral-600 sm:text-xs sm:leading-5">
                        {pack.description}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 sm:mt-4 sm:pt-3">
                      <div className="flex items-baseline gap-2">
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
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-neutral-200 px-2 text-[10px] font-bold text-neutral-700 transition-colors hover:border-[#8B102F] hover:text-[#8B102F]"
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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-neutral-950 sm:text-lg">
              المنتجات بتخفيضات مباشرة
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#8B102F]"
            >
              كل المنتجات <FiArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
                  className="group relative flex flex-col overflow-hidden rounded-md border border-neutral-200 bg-white p-2 transition hover:border-[#8B102F] sm:p-2.5"
                >
                  {/* Image Showcase */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#faf8f9]">
                    <Link href={`/products/${product.id}`} className="relative block h-full w-full">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-1.5 transition duration-300 group-hover:scale-[1.02] sm:p-2"
                      />
                    </Link>

                    {/* Wishlist Button */}
                    <div className="absolute left-2 top-2 z-10">
                      <WishlistButton productId={product.id} />
                    </div>

                    {/* Reduction Percentage Badge */}
                    {discountPercentage > 0 && (
                      <span className="absolute right-2 top-2 z-10 rounded-xs bg-[#8B102F] px-1.5 py-0.5 text-[10px] font-black text-white">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="flex flex-1 flex-col justify-between pt-2.5 text-right">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{product.category}</span>
                        <span className="flex items-center gap-0.5 font-bold text-neutral-700">
                          <FiStar className="h-3 w-3 fill-[#8B102F] text-[#8B102F]" />
                          {product.rating}
                        </span>
                      </div>

                      <Link href={`/products/${product.id}`}>
                        <h3 className="mt-1 truncate text-xs font-black text-neutral-900 group-hover:text-[#8B102F]">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price & Savings */}
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-sm font-black text-[#8B102F]">
                          {product.price.toLocaleString("ar-MA")} د.م
                        </span>
                        {hasOld && (
                          <span className="text-xs text-neutral-400 line-through">
                            {product.oldPrice.toLocaleString("ar-MA")} د.م
                          </span>
                        )}
                      </div>

                      {saving > 0 && (
                          <p className="mt-0.5 text-[10px] font-bold text-[#8B102F]">
                          وفرت {saving.toLocaleString("ar-MA")} د.م
                        </p>
                      )}
                    </div>

                    {/* Fast Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="cart-action-button mt-3 flex h-8.5 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md text-white active:scale-98"
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

      {/* 6. Minimal Trust Reassurance Strip */}
      <section
        aria-label="شروط العروض"
        className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-8 sm:grid-cols-3"
      >
        <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3.5 text-right">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f7e9ed] text-[#8B102F]">
            <FiTruck className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-black text-neutral-900">شحن مجاني</h4>
            <p className="text-[10px] text-neutral-500">يشمل جميع عروض وتخفيضات هذه الصفحة</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3.5 text-right">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f7e9ed] text-[#8B102F]">
            <FiCreditCard className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-black text-neutral-900">الدفع عند الاستلام</h4>
            <p className="text-[10px] text-neutral-500">ادفع نقداً فقط بعد تفحص طلبك ومعاينته</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3.5 text-right">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f7e9ed] text-[#8B102F]">
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