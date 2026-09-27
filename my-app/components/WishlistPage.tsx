"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { FiArrowRight, FiCheck, FiHeart, FiShoppingBag, FiStar } from "react-icons/fi";
import type { ProductsData } from "@/data/Products";
import { getServerWishlistSnapshot, getWishlistIds, getWishlistSnapshot, subscribeToWishlist } from "@/lib/wishlist";
import { addProductToCart } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";

type Product = (typeof ProductsData)[number];

export function WishlistPage({ products }: { products: Product[] }) {
  const snapshot = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const savedIds = getWishlistIds(snapshot);
  const savedProducts = savedIds.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));

  return (
    <main dir="rtl" className="min-h-[calc(100vh-80px)] bg-[#faf9f8] text-neutral-950">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="mb-5 flex items-end justify-between gap-3 border-b border-neutral-200 bg-white px-4 pb-4 pt-4 sm:mb-6 sm:px-5 sm:pb-5">
          <div>
            <p className="text-[10px] font-bold text-[#8B102F]">اختياراتك المحفوظة</p>
            <h1 className="mt-0.5 text-xl font-black sm:text-2xl">المفضلة</h1>
            <Link href="/products" className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-500 transition hover:text-[#8B102F]">
              <FiArrowRight className="h-3 w-3" /> متابعة التسوق
            </Link>
          </div>
          <span className="shrink-0 rounded-md bg-[#f7e9ed] px-2.5 py-1.5 text-[10px] font-bold text-[#8B102F] sm:text-xs">{savedProducts.length} منتجات</span>
        </header>

        {savedProducts.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7e9ed] text-[#8B102F]"><FiHeart className="h-5 w-5" /></div>
            <h2 className="mt-4 text-base font-black">المفضلة فارغة</h2>
            <p className="mt-1.5 max-w-xs text-xs leading-5 text-neutral-600">احفظ المنتجات التي تهمك لتعود إليها هنا بسهولة.</p>
            <Link href="/products" className="cart-action-button mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-white">تصفح المنتجات <FiArrowRight className="h-4 w-4 rotate-180" /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
    <article className="group overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-[#8B102F]/40">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#faf8f9]">
        <Link href={`/products/${product.id}`} aria-label={`عرض ${product.name}`} className="relative block h-full w-full">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.02] sm:p-2" />
        </Link>
        {product.badge && <span className="absolute right-2 top-2 rounded-sm bg-[#8B102F] px-2 py-1 text-[9px] font-bold text-white">{product.badge}</span>}
        {hasOldPrice && savingsPercent > 0 && <span className="absolute left-2 top-2 rounded-sm bg-white/95 px-1.5 py-1 text-[9px] font-bold text-[#8B102F]">-{savingsPercent}%</span>}
        <div className="absolute bottom-2 left-2"><WishlistButton productId={product.id} /></div>
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
