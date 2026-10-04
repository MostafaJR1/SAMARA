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
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#8B102F]/30 bg-white text-[#8B102F] transition-colors hover:border-[#8B102F]/50 hover:bg-[#f7e9ed]"
    >
      <FiHeart className={`h-4 w-4 ${saved ? "fill-[#8B102F]" : ""}`} />
    </button>
  );
}
