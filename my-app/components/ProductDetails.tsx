"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiCheck,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiShield,
  FiChevronLeft,
  FiArrowLeft,
  FiVideo,
} from "react-icons/fi";
import type { Pack, Product, ProductColor } from "@/types/catalog";
import { WishlistButton } from "@/components/WishlistButton";
import { getPackSavings, getPackStock } from "@/lib/packs";
import { addPackToCart, addProductToCart } from "@/lib/cart";
import { getProductMedia } from "@/lib/product-media";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";

function getRecommendedProducts(product: Product, products: Product[]) {
  return products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      const sharedFeatures = candidate.features.filter((feature) =>
        product.features.includes(feature)
      ).length;
      const sharedColors = candidate.colors.filter((color) =>
        product.colors.some((productColor) => productColor.id === color.id)
      ).length;
      const sameCategory = candidate.category === product.category;
      const priceDistance = Math.abs(candidate.price - product.price) / product.price;

      const score =
        (sameCategory ? 40 : 0) +
        sharedFeatures * 12 +
        sharedColors * 4 +
        candidate.rating * 3 +
        candidate.discount * 0.25 -
        priceDistance * 10;

      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ candidate }) => candidate);
}

export function ProductDetails({
  product,
  products,
  packs,
}: {
  product: Product;
  products: Product[];
  packs: Pack[];
}) {
  const [quantity, setQuantity] = useState(1);
  const fallbackColor =
    product.colors[0] ?? {
      id: "default",
      name: "اللون الأساسي",
      hex: "#e5e5e5",
      image: product.image,
    };
  const [selectedColor, setSelectedColor] = useState(fallbackColor);
  const gallerySlides = getProductMedia(product);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [added, setAdded] = useState(false);

  function selectColor(color: ProductColor) {
    setSelectedColor(color);
    const colorSlideIndex = gallerySlides.findIndex((slide) => slide.url === color.image);
    if (colorSlideIndex >= 0) setSelectedSlideIndex(colorSlideIndex);
  }

  const total = product.price * quantity;
  const hasOldPrice = Boolean(product.oldPrice && product.oldPrice > product.price);
  const saving = hasOldPrice ? product.oldPrice - product.price : 0;

  // Accurate reduction percentage calculation
  const calculatedDiscount = hasOldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : product.discount || 0;

  const recommendedProducts = getRecommendedProducts(product, products);
  const relatedPacks = packs.filter(
    (pack) => pack.isActive && pack.items.some((item) => item.product.id === product.id)
  );

  function addToCart() {
    addProductToCart(product.id, quantity, product);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

  return (
    <main
      dir="rtl"
      className="product-detail-density min-h-screen bg-white pb-16 text-neutral-950 selection:bg-[#8B102F] selection:text-white"
    >
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-3 sm:px-6 lg:px-8 lg:pb-12 lg:pt-5">
        
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="مسار التنقل"
          className="mb-4 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[10px] font-semibold text-neutral-500 sm:mb-5 sm:text-xs"
        >
          <Link href="/" className="transition-colors hover:text-neutral-950">
            الرئيسية
          </Link>
          <FiChevronLeft className="h-3 w-3" />
          <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="transition-colors hover:text-neutral-950">
            {product.category}
          </Link>
          <FiChevronLeft className="h-3 w-3" />
          <span className="max-w-[200px] truncate text-neutral-900 font-bold">
            {product.name}
          </span>
        </nav>

        {/* =====================================================
            PRODUCT SECTION (2 COLUMNS)
        ====================================================== */}
        <div className="grid grid-cols-1 items-start gap-5 sm:gap-7 lg:grid-cols-2 lg:gap-10 lg:[direction:ltr] xl:gap-12">

          {/* =====================================================
              PRODUCT GALLERY & MEDIA
          ====================================================== */}
          <section dir="rtl" className="mx-auto w-full max-w-full sm:max-w-[400px] lg:max-w-[440px]">
            <div className="relative w-full overflow-hidden rounded-lg border border-neutral-200 bg-[#faf8f9]">
              
              {/* Dynamic Accurate Discount Badge */}
              {calculatedDiscount > 0 && (
                <div className="absolute right-3 top-3 z-10 rounded-lg bg-[#8B102F] px-2 py-1 text-[10px] font-bold text-white">
                  -{calculatedDiscount}%
                </div>
              )}

              {/* Product Badge */}
              {product.badge && (
                <div className="absolute left-3 top-3 z-10 rounded-lg border border-neutral-200 bg-white/95 px-2 py-1 text-[10px] font-bold text-neutral-800">
                  {product.badge}
                </div>
              )}

              {/* Active image or video slide */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#faf8f9]">
                <ProductMediaCarousel
                  slides={gallerySlides}
                  name={`${product.name} - ${selectedColor.name}`}
                  index={selectedSlideIndex}
                  onIndexChange={setSelectedSlideIndex}
                  objectFit="cover"
                  mediaClassName="scale-100"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Stock Availability */}
            <div className="mt-2 flex items-center justify-between px-1 text-[10px] sm:text-[11px]">
              <span className={`flex items-center gap-1.5 font-bold ${product.stock > 0 ? "text-[#8B102F]" : "text-red-700"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? "bg-[#8B102F]" : "bg-red-700"}`} />
                {product.stock > 0 ? "متوفر في المخزون" : "نفد المخزون"}
              </span>
              <span className="text-neutral-500">
                متبقي <strong className="text-neutral-900">{product.stock}</strong> قطع فقط
              </span>
            </div>

            {/* Thumbnail Variant Selector */}
            {gallerySlides.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallerySlides.map((slide, index) => {
                  const selected = selectedSlideIndex === index;
                  return (
                    <button
                      key={`${slide.url}-${index}`}
                      type="button"
                      onClick={() => setSelectedSlideIndex(index)}
                      aria-label={`عرض ${slide.type === "video" ? "الفيديو" : "الصورة"} ${index + 1} للون ${selectedColor.name}`}
                      aria-pressed={selected}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-[#faf8f9] transition-all ${
                        selected
                          ? "border-[#8B102F] ring-1 ring-[#8B102F]/20"
                          : "border-neutral-200 hover:border-[#8B102F]/50"
                      }`}
                    >
                      {slide.type === "video" ? (
                        <>
                          <video src={slide.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                          <FiVideo className="absolute bottom-1 right-1 h-4 w-4 rounded-sm bg-black/60 p-0.5 text-white" />
                        </>
                      ) : (
                        <Image src={slide.url} alt={`${product.name} - ${index + 1}`} fill sizes="72px" className="object-cover" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* =====================================================
              PRODUCT DETAILS & CHECKOUT CTA
          ====================================================== */}
          <section dir="rtl" className="w-full lg:sticky lg:top-5">
            <div className="w-full">
              
              {/* Category, Rating & Wishlist */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#8B102F]">
                    {product.category}
                  </span>
                  <span className="text-neutral-300">•</span>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-700">
                      <FiStar className="h-3 w-3 fill-[#8B102F] text-[#8B102F]" />
                      <span>{product.rating}</span>
                    </div>
                  )}
                </div>

                <WishlistButton productId={product.id} />
              </div>

              {/* Title */}
              <h1 className="text-xl font-black leading-snug text-neutral-950 sm:text-2xl lg:text-3xl">
                {product.name}
              </h1>

              {/* Price & Savings */}
              <div className="mt-3 flex flex-wrap items-baseline gap-2.5 border-b border-neutral-100 pb-3.5">
                <span className="text-2xl font-black text-[#8B102F] sm:text-3xl">
                  {product.price.toLocaleString("ar-MA")}
                  <span className="mr-1 text-xs font-medium text-neutral-600">د.م</span>
                </span>

                {hasOldPrice && (
                  <span className="text-xs font-medium text-neutral-500 line-through">
                    {product.oldPrice.toLocaleString("ar-MA")} د.م
                  </span>
                )}

                {saving > 0 && (
                  <span className="rounded-lg bg-[#f7e9ed] px-2 py-0.5 text-[10px] font-bold text-[#8B102F]">
                    وفر {saving.toLocaleString("ar-MA")} د.م
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-5 text-neutral-600">
                {product.description}
              </p>

              {/* Color Options */}
              {product.colors.length > 0 && (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-900">
                      اللون المحدد: <span className="text-[#8B102F]">{selectedColor.name}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const selected = selectedColor.id === color.id;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => selectColor(color)}
                          aria-label={`اختيار اللون ${color.name}`}
                          aria-pressed={selected}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                            selected
                              ? "border-[#8B102F] bg-[#f7e9ed]/50 text-[#8B102F]"
                              : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8B102F]/50"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                          {selected && <FiCheck className="h-3.5 w-3.5 text-[#8B102F]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="mt-4">
                <span className="mb-2 block text-[11px] font-bold text-neutral-900">الكمية</span>
                <div className="flex w-fit items-center rounded-lg border border-neutral-200 bg-white">
                  <button
                    type="button"
                    aria-label="تقليل الكمية"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center text-neutral-600 transition hover:bg-[#f7e9ed] hover:text-[#8B102F] disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <FiMinus className="h-3.5 w-3.5" />
                  </button>

                  <span className="w-10 text-center text-sm font-black text-neutral-950">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="زيادة الكمية"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center text-neutral-600 transition hover:bg-[#f7e9ed] hover:text-[#8B102F] disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Primary cart action */}
              <button
                type="button"
                onClick={addToCart}
                className="cart-action-button mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg px-5 text-white active:scale-[0.99]"
              >
                {added ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    <span>تمت الإضافة إلى السلة بنجاح</span>
                  </>
                ) : (
                  <>
                    <FiShoppingBag className="h-4 w-4" />
                    <span>أضف إلى السلة</span>
                    <span className="h-4 w-px bg-white/30" />
                    <span>{total.toLocaleString("ar-MA")} د.م</span>
                  </>
                )}
              </button>

              {/* Shipping & Payment Trust Badges */}
              <div className="mt-3 grid grid-cols-2 divide-x divide-x-reverse divide-neutral-200 border-y border-neutral-200 py-3">
                <div className="flex items-center gap-2 px-2.5">
                  <FiTruck className="h-4 w-4 shrink-0 text-[#8B102F]" />
                  <div>
                    <p className="text-[11px] font-bold text-neutral-900">{product.shipping}</p>
                    <p className="text-[10px] text-neutral-500">في المغرب</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2.5">
                  <FiShield className="h-4 w-4 shrink-0 text-[#8B102F]" />
                  <div>
                    <p className="text-[11px] font-bold text-neutral-900">الدفع عند الاستلام</p>
                    <p className="text-[10px] text-neutral-500">تفحص طلبك قبل الدفع</p>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              {product.features?.length > 0 && (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <h2 className="mb-2.5 text-[11px] font-black text-neutral-900">
                    مميزات المنتج
                  </h2>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {product.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 border-b border-neutral-100 py-2 text-[11px] font-medium leading-4 text-neutral-700"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-lg bg-[#f7e9ed] text-[#8B102F]">
                          <FiCheck className="h-3 w-3 stroke-[3]" />
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </section>
        </div>

        {/* =====================================================
            BUNDLE OFFER (IF PRODUCT IS PART OF A PACK)
        ====================================================== */}
        {relatedPacks.length > 0 && (
          <section className="mt-9 border-t border-neutral-200 pt-6" aria-labelledby="product-packs">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B102F]">
                  عرض التوفير
                </span>
                <h2 id="product-packs" className="mt-1 text-lg font-black text-neutral-900">
                  متوفر ضمن باقة توفير
                </h2>
              </div>
              <FiShoppingBag className="h-5 w-5 text-neutral-400" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedPacks.map((pack) => {
                const packSavings = getPackSavings(pack);
                return (
                  <article key={pack.id} className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-[#8B102F]">
                    <Link href={`/packs/${pack.slug}`} className="flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <Image src={pack.image} alt={pack.name} fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="min-w-0 text-right">
                        {packSavings > 0 && <span className="rounded-lg bg-[#f7e9ed] px-1.5 py-0.5 text-[10px] font-bold text-[#8B102F]">
                            وفر {packSavings.toLocaleString("ar-MA")} د.م
                          </span>}
                          <h3 className="mt-1 truncate text-xs font-black text-neutral-900">{pack.name}</h3>
                          <p className="mt-1 text-xs font-black text-[#8B102F]">
                          {pack.price.toLocaleString("ar-MA")} د.م
                        </p>
                      </div>
                    </Link>

                    {/* Pack Action Button: Burgundy -> Hover to Black */}
                    <button
                      type="button"
                      onClick={() => addPackToCart(pack, 1)}
                      disabled={getPackStock(pack) < 1}
                      className="cart-action-button mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      أضف الباقة إلى السلة
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================
            RECOMMENDED PRODUCTS
        ====================================================== */}
        {recommendedProducts.length > 0 && (
          <section className="mt-9 border-t border-neutral-200 pt-6" aria-labelledby="recommended-products">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  تشكيلة مشابهة
                </span>
                <h2 id="recommended-products" className="mt-0.5 text-lg font-black text-neutral-900">
                  قد يعجبك أيضًا
                </h2>
              </div>

              <Link
                href="/products"
                className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 transition hover:text-[#8B102F]"
              >
                <span>عرض الكل</span>
                <FiArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {recommendedProducts.map((recommendedProduct) => (
                <Link
                  key={recommendedProduct.id}
                  href={`/products/${recommendedProduct.id}`}
                  className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white p-2.5 transition hover:border-[#8B102F]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xs bg-neutral-100">
                    <Image
                      src={recommendedProduct.image}
                      alt={recommendedProduct.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute left-2 top-2">
                      <WishlistButton productId={recommendedProduct.id} />
                    </div>
                    {recommendedProduct.badge && (
                      <span className="absolute right-2 top-2 rounded-xs bg-[#8B102F] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {recommendedProduct.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-right">
                    <h3 className="truncate text-xs font-medium text-neutral-900 group-hover:text-[#8B102F]">
                      {recommendedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#8B102F]">
                        {recommendedProduct.price.toLocaleString("ar-MA")} د.م
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-neutral-500">
                        <FiStar className="h-3 w-3 fill-[#8B102F] text-[#8B102F]" />
                        {recommendedProduct.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            MOBILE STICKY CART BAR (Burgundy -> Hover to Black)
        ====================================================== */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-neutral-500">
                {product.name}
              </p>
              <p className="text-base font-black text-[#8B102F]">
                {total.toLocaleString("ar-MA")} د.م
              </p>
            </div>

            <button
              type="button"
              onClick={addToCart}
              className="cart-action-button flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg text-white active:scale-[0.98]"
            >
              {added ? (
                <>
                  <FiCheck className="h-4 w-4" />
                  <span>تمت الإضافة</span>
                </>
              ) : (
                <>
                  <FiShoppingBag className="h-4 w-4" />
                  <span>أضف إلى السلة</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}