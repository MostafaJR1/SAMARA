"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiTruck, FiUser, FiX } from "react-icons/fi";
import { CART_UPDATED_EVENT, getCartItems, pruneCartItems } from "@/lib/cart";
import { getServerWishlistSnapshot, getWishlistIds, getWishlistSnapshot, pruneWishlist, subscribeToWishlist } from "@/lib/wishlist";
import { rankProducts } from "../lib/product-search";
import type { Pack, Product } from "@/types/catalog";

const navigation = [
  { label: "الرئيسية", href: "/" },
  { label: "العروض", href: "/offers" },
  { label: "الأكثر مبيعًا", href: "/best-sellers" },
  { label: "الباقات", href: "/packs" },
  { label: "المنتجات", href: "/products" },
];

function subscribeToCart(onChange: () => void) {
  window.addEventListener(CART_UPDATED_EVENT, onChange);
  return () => window.removeEventListener(CART_UPDATED_EVENT, onChange);
}

function getCartCount(productIds: ReadonlySet<string>, packIds: ReadonlySet<string>) {
  return getCartItems().reduce((total, item) => {
    const isAvailable = item.type === "product"
      ? productIds.has(item.productId)
      : packIds.has(item.packId);
    return total + (isAvailable ? item.quantity : 0);
  }, 0);
}

function getServerCartCount() {
  return 0;
}

export function Header({ accountHref, accountLabel, products, packs }: { accountHref: string; accountLabel: string; products: Product[]; packs: Pack[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const productIds = new Set(products.map((product) => product.id));
  const packIds = new Set(packs.map((pack) => pack.id));
  const productIdsKey = JSON.stringify([...productIds]);
  const packIdsKey = JSON.stringify([...packIds]);
  const cartCount = useSyncExternalStore(
    subscribeToCart,
    () => getCartCount(productIds, packIds),
    getServerCartCount,
  );
  const wishlistSnapshot = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const wishlistCount = getWishlistIds(wishlistSnapshot).filter((id) => productIds.has(id)).length;
  const results = rankProducts(products, query).slice(0, 6);

  useEffect(() => {
    const validProductIds = new Set(JSON.parse(productIdsKey) as string[]);
    const validPackIds = new Set(JSON.parse(packIdsKey) as string[]);
    pruneCartItems(validProductIds, validPackIds);
    pruneWishlist(validProductIds);
  }, [productIdsKey, packIdsKey]);

  return (
    <>
      <header dir="rtl" className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="flex min-h-7 items-center justify-center gap-1.5 bg-[#8B102F] px-3 py-1 text-center text-[10px] text-white sm:min-h-7">
          <FiTruck aria-hidden="true" className="h-3 w-3 shrink-0" />
          <span>الشحن مجاني على جميع الطلبات</span>
        </div>
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-12 lg:px-8">
          <div className="flex items-center gap-2 lg:gap-6">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="فتح القائمة" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 lg:hidden">
              <FiMenu className="h-4 w-4" />
            </button>
            <Link href="/" aria-label="سمارة - الرئيسية" className="flex h-16 w-16 items-center justify-center lg:hidden">
              <Image src="/SAMARA-LOGO.png" alt="سمارة" width={72} height={72} loading="eager" className="h-16 w-16 object-contain" />
            </Link>
            <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
              <ul className="flex items-center gap-4 text-xs font-semibold">
                {navigation.map((item) => <li key={item.href}><Link href={item.href} className="text-neutral-600 transition hover:text-neutral-950">{item.label}</Link></li>)}
              </ul>
            </nav>
          </div>
          <Link href="/" aria-label="سمارة - الرئيسية" className="absolute left-1/2 hidden h-12 w-12 -translate-x-1/2 items-center justify-center lg:flex">
            <Image src="/SAMARA-LOGO.png" alt="سمارة" width={52} height={52} loading="eager" className="h-12 w-12 object-contain" />
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="البحث" className="hidden h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 lg:flex"><FiSearch className="h-4 w-4" /></button>
            <Link href="/wishlist" aria-label={`المفضلة (${wishlistCount})`} className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"><FiHeart className="h-4 w-4" />{wishlistCount > 0 && <span className="absolute -left-0.5 -top-0.5 rounded-full bg-[#8B102F] px-1 text-[8px] text-white">{wishlistCount}</span>}</Link>
            <Link href={accountHref} aria-label={accountLabel} title={accountLabel} className="hidden h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 lg:flex"><FiUser className="h-4 w-4" /></Link>
            <Link href="/cart" aria-label="السلة" className="relative flex h-7 w-7 items-center justify-center rounded-md text-neutral-900 hover:bg-neutral-100"><FiShoppingBag className="h-4 w-4" /><span className="absolute -left-0.5 -top-0.5 rounded-full bg-[#8B102F] px-1 text-[8px] text-white">{cartCount}</span></Link>
          </div>
        </div>
      </header>

      {searchOpen && <div className="fixed inset-0 z-50 bg-black/40 p-4 pt-14" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <section dir="rtl" role="dialog" aria-modal="true" aria-label="البحث عن المنتجات" className="mx-auto max-h-[75vh] max-w-lg overflow-hidden rounded-md border border-neutral-200 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-200 p-3"><FiSearch className="h-4 w-4 text-neutral-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن منتج..." className="flex-1 text-xs outline-none" /><button type="button" onClick={() => setSearchOpen(false)} aria-label="إغلاق"><FiX className="h-4 w-4" /></button></div>
          <div className="max-h-[calc(75vh-3.5rem)] overflow-y-auto p-2">
            <p className="px-2 pb-1 text-[10px] font-bold text-neutral-500">{query.trim() ? "نتائج مقترحة" : "اقتراحات لك"}</p>
            {results.length > 0 ? (
              <ul aria-label="اقتراحات المنتجات" className="divide-y divide-neutral-100">
                {results.map((product: Product) => (
                  <li key={product.id}>
                    <Link href={`/products/${product.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded p-2 text-right transition hover:bg-neutral-50">
                      <Image src={product.image} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded bg-neutral-50 object-contain p-1" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-neutral-900">{product.name}</span>
                        <span className="mt-1 block truncate text-[10px] text-neutral-500">{product.category}</span>
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-[#8B102F]">{product.price.toLocaleString("ar-MA")} د.م</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-6 text-center text-xs text-neutral-500">لم نعثر على منتجات مطابقة.</p>
            )}
          </div>
        </section>
      </div>}

      <div
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-out motion-reduce:transition-none lg:hidden ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside
          id="mobile-navigation"
          dir="rtl"
          className={`absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col border-l border-neutral-200 bg-white p-4 transition-transform duration-300 ease-out motion-reduce:transition-none ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-sm font-bold text-neutral-900">القائمة</span>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"><FiX /></button>
          </div>
          <div className="relative mt-4">
            <FiSearch aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              readOnly
              onFocus={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
              placeholder="ابحث عن منتج..."
              aria-label="البحث عن المنتجات"
              aria-haspopup="dialog"
              className="h-9 w-full rounded border border-neutral-300 bg-white pl-3 pr-10 text-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-[#8b102f]"
            />
            {query.trim() && (
              <ul aria-label="اقتراحات المنتجات" className="mt-2 max-h-56 divide-y divide-neutral-100 overflow-y-auto border-y border-neutral-100">
                {results.length > 0 ? results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      onClick={() => { setMobileMenuOpen(false); setQuery(""); }}
                      className="flex items-center gap-2.5 py-2 text-right"
                    >
                      <Image src={product.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 bg-neutral-50 object-contain p-1" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-neutral-900">{product.name}</span>
                        <span className="mt-0.5 block text-[10px] text-[#8b102f]">{product.price.toLocaleString("ar-MA")} د.م</span>
                      </span>
                    </Link>
                  </li>
                )) : (
                  <li className="py-4 text-center text-xs text-neutral-500">لم نعثر على منتجات مطابقة.</li>
                )}
              </ul>
            )}
          </div>
          <nav className="mt-3 flex-1 overflow-y-auto"><ul className="space-y-1">{navigation.map((item) => <li key={item.href}><Link href={item.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2.5 text-xs font-semibold hover:bg-neutral-50">{item.label}</Link></li>)}</ul></nav>
          <Link
            href={accountHref}
            onClick={() => setMobileMenuOpen(false)}
            className="mt-4 flex min-h-10 shrink-0 items-center justify-center gap-2 rounded bg-neutral-950 px-4 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <FiUser aria-hidden="true" className="h-4 w-4" />
            {accountLabel}
          </Link>
        </aside>
      </div>
    </>
  );
}
