"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiCheck, FiShoppingBag, FiStar } from "react-icons/fi";
import { addProductToCart } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";
import type { ProductsData } from "@/data/Products";

type Product = (typeof ProductsData)[number];

export function HomeProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const hasRealOldPrice = product.oldPrice > product.price;
  const savingsPercent = hasRealOldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function addToCart() {
    addProductToCart(product.id, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group rounded-md border border-[#8B102F]/20 bg-white p-2.5 transition hover:border-[#8B102F]/50 sm:p-3">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#faf8f9]">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-1.5 transition duration-300 group-hover:scale-[1.02] sm:p-2" />
          <span className="absolute right-2 top-2 rounded-md bg-[#8B102F] px-2 py-1 text-[9px] font-bold text-white">{product.badge || "متوفر"}</span>
          <div className="absolute left-2 top-2"><WishlistButton productId={product.id} /></div>
        </div>
      </Link>
      <div className="pt-3 text-right">
        <Link href={`/products/${product.id}`} className="block truncate text-xs font-bold text-neutral-950 hover:underline">{product.name}</Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#8B102F]"><FiStar className="h-3 w-3 fill-[#8B102F] text-[#8B102F]" />{product.rating}</span>
          <span className="text-sm font-black text-[#8B102F]">{product.price.toLocaleString("ar-MA")} د.م</span>
        </div>
        {hasRealOldPrice && (
          <div className="mt-1 flex items-center justify-end gap-2 text-[10px]">
            <span className="text-neutral-400 line-through">{product.oldPrice.toLocaleString("ar-MA")} د.م</span>
            {savingsPercent > 0 && <span className="font-bold text-[#8B102F]">-{savingsPercent}%</span>}
          </div>
        )}
        <button type="button" onClick={addToCart} disabled={product.stock < 1} className="cart-action-button mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-white disabled:cursor-not-allowed disabled:opacity-40">
          {added ? <><FiCheck className="h-3.5 w-3.5" /> تمت الإضافة</> : <><FiShoppingBag className="h-3.5 w-3.5" /> أضف للسلة</>}
        </button>
      </div>
    </article>
  );
}
