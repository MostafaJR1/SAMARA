export const WISHLIST_KEY = "samara-wishlist";
export const WISHLIST_EVENT = "samara-wishlist-changed";

export function subscribeToWishlist(onChange: () => void) {
  window.addEventListener(WISHLIST_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getWishlistSnapshot() {
  return window.localStorage.getItem(WISHLIST_KEY) ?? "[]";
}

export function getServerWishlistSnapshot() {
  return "[]";
}

export function getWishlistIds(snapshot: string) {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export function pruneWishlist(validProductIds: ReadonlySet<string>) {
  const ids = getWishlistIds(getWishlistSnapshot());
  const activeIds = ids.filter((id) => validProductIds.has(id));
  if (activeIds.length !== ids.length) {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(activeIds));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  }
}

export function toggleWishlist(productId: string) {
  const ids = getWishlistIds(getWishlistSnapshot());
  const nextIds = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}
