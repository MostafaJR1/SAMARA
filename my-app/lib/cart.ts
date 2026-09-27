import type { Pack } from "@/data/Packs";
import type { ProductsData } from "@/data/Products";

export type Product = (typeof ProductsData)[number];

export type ProductCartItem = {
  type: "product";
  productId: string;
  quantity: number;
};

export type PackCartItem = {
  type: "pack";
  packId: string;
  quantity: number;
};

export type CartItem = ProductCartItem | PackCartItem;
export type ResolvedCartItem =
  | { item: ProductCartItem; product: Product }
  | { item: PackCartItem; pack: Pack };

export const CART_STORAGE_KEY = "samara-cart";
export const CART_COUPON_STORAGE_KEY = "samara-cart-coupon";
export const CART_UPDATED_EVENT = "samara-cart-updated";
export const CART_ITEM_ADDED_EVENT = "samara-cart-item-added";

export type CartItemAddedDetail = {
  item: CartItem;
  product?: Product;
  pack?: Pack;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    (item.type === "product" && typeof item.productId === "string" && typeof item.quantity === "number") ||
    (item.type === "pack" && typeof item.packId === "string" && typeof item.quantity === "number")
  ) && Number.isInteger(item.quantity) && item.quantity > 0;
}

export function getCartItems() {
  if (typeof window === "undefined") return [] as CartItem[];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [] as CartItem[];
  }
}

function saveCartItems(items: CartItem[]) {
  window.sessionStorage.removeItem("samara-cart-cleared");
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("samara-cart-cleared"));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addProductToCart(productId: string, quantity: number, product?: Product) {
  const items = getCartItems();
  const existing = items.find((item) => item.type === "product" && item.productId === productId);
  if (existing?.type === "product") existing.quantity += quantity;
  else items.push({ type: "product", productId, quantity });
  saveCartItems(items);
  window.dispatchEvent(new CustomEvent<CartItemAddedDetail>(CART_ITEM_ADDED_EVENT, {
    detail: { item: { type: "product", productId, quantity }, product },
  }));
}

export function addPackToCart(pack: Pack, quantity: number) {
  const items = getCartItems();
  const existing = items.find((item) => item.type === "pack" && item.packId === pack.id);
  if (existing?.type === "pack") existing.quantity += quantity;
  else items.push({ type: "pack", packId: pack.id, quantity });
  saveCartItems(items);
  window.dispatchEvent(new CustomEvent<CartItemAddedDetail>(CART_ITEM_ADDED_EVENT, {
    detail: { item: { type: "pack", packId: pack.id, quantity }, pack },
  }));
}

export function updateCartItem(item: CartItem, quantity: number) {
  const items = getCartItems().map((current) => {
    const sameItem = item.type === current.type && (item.type === "product" ? current.type === "product" && item.productId === current.productId : current.type === "pack" && item.packId === current.packId);
    return sameItem ? { ...current, quantity } : current;
  });
  saveCartItems(items.filter((current) => current.quantity > 0));
}

export function removeCartItem(item: CartItem) {
  const items = getCartItems().filter((current) => !(item.type === current.type && (item.type === "product" ? current.type === "product" && item.productId === current.productId : current.type === "pack" && item.packId === current.packId)));
  saveCartItems(items);
}

export function resolveCartItems(items: CartItem[], products: Product[], packs: Pack[]): ResolvedCartItem[] {
  return items.flatMap((item): ResolvedCartItem[] => {
    if (item.type === "product") {
      const product = products.find((candidate) => candidate.id === item.productId);
      return product ? [{ item, product }] : [];
    }
    const pack = packs.find((candidate) => candidate.id === item.packId && candidate.isActive);
    return pack ? [{ item, pack }] : [];
  });
}
