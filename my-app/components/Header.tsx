"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiTruck, FiUser, FiX } from "react-icons/fi";
import { ProductsData } from "@/data/Products";
import { CART_UPDATED_EVENT, getCartItems } from "@/lib/cart";
import { getServerWishlistSnapshot, getWishlistIds, getWishlistSnapshot, subscribeToWishlist } from "@/lib/wishlist";

const navigation = [
  { label: "الرئيسية", href: "/" },
  { label: "العروض", href: "/offers" },
  { label: "الأكثر مبيعًا", href: "/best-sellers" },
  { label: "المنتجات", href: "/products" },
];

function subscribeToCart(onChange: () => void) {
  window.addEventListener(CART_UPDATED_EVENT, onChange);
  return () => window.removeEventListener(CART_UPDATED_EVENT, onChange);
}

function getCartCount() {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

function getServerCartCount() {
  return 0;
}

export function Header({ accountHref, accountLabel }: { accountHref: string; accountLabel: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const cartCount = useSyncExternalStore(subscribeToCart, getCartCount, getServerCartCount);
  const wishlistSnapshot = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const wishlistCount = getWishlistIds(wishlistSnapshot).length;
  const results = ProductsData.filter((product) => `${product.name} ${product.category}`.includes(query)).slice(0, 5);

  return (
    <>
      <header dir="rtl" className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="flex min-h-8 items-center justify-center gap-2 bg-[#8B102F] px-3 py-1 text-center text-[12px] text-white sm:min-h-9">
          <FiTruck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span>الشحن مجاني على جميع الطلبات</span>
        </div>
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-3 px-4 sm:h-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-6">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="فتح القائمة" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 lg:hidden">
              <FiMenu className="h-4 w-4" />
            </button>
            <Link href="/" className="font-ruwudu text-lg font-black text-neutral-950 sm:text-xl">سمارة</Link>
            <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
              <ul className="flex items-center gap-4 text-xs font-semibold">
                {navigation.map((item) => <li key={item.href}><Link href={item.href} className="text-neutral-600 transition hover:text-neutral-950">{item.label}</Link></li>)}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="البحث" className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"><FiSearch className="h-4 w-4" /></button>
            <Link href="/wishlist" aria-label={`المفضلة (${wishlistCount})`} className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"><FiHeart className="h-4 w-4" />{wishlistCount > 0 && <span className="absolute -left-0.5 -top-0.5 rounded-full bg-[#8B102F] px-1 text-[8px] text-white">{wishlistCount}</span>}</Link>
            <Link href={accountHref} aria-label={accountLabel} title={accountLabel} className="hidden h-7 w-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 sm:flex"><FiUser className="h-4 w-4" /></Link>
            <Link href="/cart" aria-label="السلة" className="relative flex h-7 w-7 items-center justify-center rounded-md text-neutral-900 hover:bg-neutral-100"><FiShoppingBag className="h-4 w-4" /><span className="absolute -left-0.5 -top-0.5 rounded-full bg-[#8B102F] px-1 text-[8px] text-white">{cartCount}</span></Link>
          </div>
        </div>
      </header>

      {searchOpen && <div className="fixed inset-0 z-50 bg-black/40 p-4 pt-14" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <section dir="rtl" className="mx-auto max-w-lg overflow-hidden rounded-md bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-200 p-3"><FiSearch className="h-4 w-4 text-neutral-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن منتج..." className="flex-1 text-xs outline-none" /><button type="button" onClick={() => setSearchOpen(false)} aria-label="إغلاق"><FiX className="h-4 w-4" /></button></div>
          <div className="p-2">{results.map((product) => <Link key={product.id} href={`/products/${product.id}`} onClick={() => setSearchOpen(false)} className="block rounded p-2 text-xs hover:bg-neutral-50">{product.name}</Link>)}</div>
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
          className={`absolute right-0 top-0 h-full w-[80%] max-w-xs bg-white p-4 shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4"><span className="font-ruwudu text-lg font-black">سمارة</span><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق"><FiX /></button></div>
          <nav className="mt-4"><ul className="space-y-1">{navigation.map((item) => <li key={item.href}><Link href={item.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-xs font-bold hover:bg-neutral-50">{item.label}</Link></li>)}</ul></nav>
        </aside>
      </div>
    </>
  );
}
