"use client";

import { useState } from "react";
import { FiCheck, FiShoppingBag } from "react-icons/fi";
import { addPackToCart } from "@/lib/cart";
import type { Pack } from "@/types/catalog";

export function HomePackButton({ pack }: { pack: Pack }) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    addPackToCart(pack, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return <button type="button" onClick={addToCart} className="cart-action-button mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded px-5 text-white">{added ? <><FiCheck className="h-4 w-4" /> تمت الإضافة</> : <><FiShoppingBag className="h-4 w-4" /> أضف الباقة للسلة</>}</button>;
}
