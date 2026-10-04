"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { FiChevronLeft, FiCheck, FiShoppingBag, FiStar } from "react-icons/fi";
import type { Product } from "@/types/catalog";
import { getServerWishlistSnapshot, getWishlistIds, getWishlistSnapshot, subscribeToWishlist } from "@/lib/wishlist";
import { addProductToCart } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";
import { getProductCardMedia } from "@/lib/product-media";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { StoreEmptyState } from "@/components/StoreEmptyState";


export function WishlistPage({ products }: { products: Product[] }) {
  const snapshot = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const savedIds = getWishlistIds(snapshot);
  const savedProducts = savedIds.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));

  return (
    <main dir="rtl" className="min-h-[calc(100vh-80px)] w-full min-w-0 overflow-x-clip bg-[#faf9f8] text-neutral-950">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        {savedProducts.length === 0 ? (
          <StoreEmptyState
            illustrationSrc="/empty-box.png"
            title="المفضلة فارغة"
          >
            <Link href="/products" className="text-[#8B102F] bg-[#8B102F]/5 rounded-md border border-dashed border-[#8B102F]/30 inline-flex min-h-9 items-center gap-1 px-3 text-xs font-semibold">
              اكتشف المنتجات <FiChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </StoreEmptyState>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {savedProducts.map((product) => <WishlistCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function WishlistCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const hasOldPrice = product.oldPrice > product.price;
  const savingsPercent = hasOldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function addToCart() {
    addProductToCart(product.id, 1, product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group min-w-0 overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-[#8B102F]/40">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#faf8f9]">
        <ProductMediaCarousel slides={getProductCardMedia(product)} name={product.name} objectFit="contain" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="p-1.5 sm:p-2" />
        <Link href={`/products/${product.id}`} aria-label={`عرض ${product.name}`} className="absolute inset-0 z-10" />
        {product.badge && <span className="absolute right-2 top-2 z-30 rounded-sm bg-[#8B102F] px-2 py-1 text-[9px] font-bold text-white">{product.badge}</span>}
        {hasOldPrice && savingsPercent > 0 && <span className="absolute left-2 top-2 z-30 rounded-sm bg-white/95 px-1.5 py-1 text-[9px] font-bold text-[#8B102F]">-{savingsPercent}%</span>}
        <div className="absolute bottom-2 left-2 z-30"><WishlistButton productId={product.id} /></div>
      </div>
      <div className="space-y-2 p-2.5 text-right sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><Link href={`/products/${product.id}`} className="block truncate text-xs font-bold text-neutral-900 hover:text-[#8B102F]">{product.name}</Link><p className="mt-1 text-[10px] text-neutral-500">{product.category}</p></div>
        </div>
        <div className="flex items-center justify-between gap-1 pt-0.5"><div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5"><span className="text-xs font-black text-[#8B102F]">{product.price.toLocaleString("ar-MA")} د.م</span>{hasOldPrice && <span className="text-[9px] text-neutral-500 line-through">{product.oldPrice.toLocaleString("ar-MA")} د.م</span>}</div><span className="flex shrink-0 items-center gap-1 text-[10px] text-neutral-600"><FiStar className="h-3 w-3 fill-[#8B102F] text-[#8B102F]" />{product.rating}</span></div>
        <button type="button" onClick={addToCart} disabled={product.stock < 1} className="cart-action-button flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md text-white disabled:cursor-not-allowed disabled:opacity-40">
          {added ? <><FiCheck className="h-3.5 w-3.5" /> تمت الإضافة</> : <><FiShoppingBag className="h-3.5 w-3.5" /> أضف للسلة</>}
        </button>
      </div>
    </article>
  );
}
