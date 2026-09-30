import type { Pack } from "@/types/catalog";

export function getPackStock(pack: Pack) {
  if (pack.items.length === 0) return 0;
  return Math.min(...pack.items.map((item) => Math.floor(item.product.stock / item.quantity)));
}

export function getPackSavings(pack: Pack) {
  return Math.max(0, pack.originalPrice - pack.price);
}