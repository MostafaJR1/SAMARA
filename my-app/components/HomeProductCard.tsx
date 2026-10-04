"use client";

import Link from "next/link";
import { useState } from "react";
import { FiCheck, FiShoppingBag, FiStar } from "react-icons/fi";
import { addProductToCart } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";
import type { Product } from "@/types/catalog";
import { getProductCardMedia } from "@/lib/product-media";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";

export function HomeProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const hasRealOldPrice = product.oldPrice > product.price;
  const savingsPercent = hasRealOldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function addToCart() {
    addProductToCart(product.id, 1, product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="min-w-0 border-b border-neutral-200 pb-3">
      <div className="relative aspect-square overflow-hidden bg-[#f8f7f6]">
        <ProductMediaCarousel slides={getProductCardMedia(product)} name={product.name} objectFit="contain" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="p-1.5 sm:p-2" />
        <Link href={`/products/${product.id}`} aria-label={`عرض ${product.name}`} className="absolute inset-0 z-10" />
        {product.badge && (
          <span className="absolute right-1.5 top-1.5 z-30 max-w-[70%] truncate rounded-sm border border-neutral-200 bg-white px-2 py-1 text-[9px] font-semibold text-neutral-800 sm:right-2 sm:top-2">
            {product.badge}
          </span>
        )}
        <div className="absolute left-1.5 top-1.5 z-30 sm:left-2 sm:top-2"><WishlistButton productId={product.id} /></div>
      </div>
      <div className="px-0.5 pt-3 text-right sm:px-1 sm:pt-4">
        <Link href={`/products/${product.id}`} className="block min-h-10 line-clamp-2 text-xs font-semibold leading-5 text-neutral-900 hover:text-[#8B102F] sm:min-h-10 sm:text-sm">{product.name}</Link>
        <div className="mt-2 flex min-w-0 flex-nowrap items-baseline justify-between gap-1">
          <div className="flex min-w-0 flex-nowrap items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-xs font-black text-[#8B102F] sm:text-base">{product.price.toLocaleString("ar-MA")} د.م</span>
            {hasRealOldPrice && (
              <del className="text-[9px] text-neutral-400 sm:text-xs">{product.oldPrice.toLocaleString("ar-MA")} د.م</del>
            )}
          </div>
          {product.rating > 0 && (
            <span aria-label={`التقييم ${product.rating} من 5`} className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-neutral-600">
              <FiStar aria-hidden="true" className="h-3 w-3 fill-amber-400 text-amber-500" />{product.rating}
            </span>
          )}
        </div>
        <button type="button" onClick={addToCart} disabled={product.stock < 1} className="cart-action-button mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded px-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40 sm:mt-4 sm:h-10 sm:gap-2">
          {added ? (
            <><FiCheck aria-hidden="true" className="h-3.5 w-3.5" /> تمت الإضافة</>
          ) : (
            <>
              <FiShoppingBag aria-hidden="true" className="h-3.5 w-3.5" />
              <span>أضف للسلة</span>
              {hasRealOldPrice && savingsPercent > 0 && (
                <span dir="ltr" className="border-r border-white/40 pr-1.5 text-[10px]">-{savingsPercent}%</span>
              )}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
