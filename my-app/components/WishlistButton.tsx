"use client";

import { useSyncExternalStore } from "react";
import { FiHeart } from "react-icons/fi";
import {
  getServerWishlistSnapshot,
  getWishlistIds,
  getWishlistSnapshot,
  subscribeToWishlist,
  toggleWishlist,
} from "@/lib/wishlist";

export function WishlistButton({ productId }: { productId: string }) {
  const snapshot = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const saved = getWishlistIds(snapshot).includes(productId);

  return (
    <button
      type="button"
      aria-label={saved ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(productId);
      }}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#8B102F]/30 bg-white/95 text-[#8B102F] shadow-sm backdrop-blur transition hover:border-[#8B102F]/50"
    >
      <FiHeart className={`h-4 w-4 ${saved ? "fill-[#8B102F]" : ""}`} />
    </button>
  );
}
