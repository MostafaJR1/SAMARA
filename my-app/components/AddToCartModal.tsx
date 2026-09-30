"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiMinus, FiPlus, FiShoppingBag, FiTag, FiTrash2, FiX } from "react-icons/fi";
import { getPackStock } from "@/lib/packs";
import type { Pack, Product } from "@/types/catalog";
import {
  CART_ITEM_ADDED_EVENT,
  CART_COUPON_STORAGE_KEY,
  CART_UPDATED_EVENT,
  getCartItems,
  removeCartItem,
  resolveCartItems,
  updateCartItem,
  type CartItem,
  type CartItemAddedDetail,
} from "@/lib/cart";

type CartPreviewProduct = Product & { is_coupon_eligible?: boolean };
type ActiveCoupon = {
  code: string;
  value: number;
  appliesToAll: boolean;
  applicableProductIds: string[];
};

export function AddToCartModal({ products: initialProducts, packs: initialPacks }: { products: Product[]; packs: Pack[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedName, setAddedName] = useState("");
  const [products, setProducts] = useState<CartPreviewProduct[]>(initialProducts);
  const [packs, setPacks] = useState<Pack[]>(initialPacks);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<ActiveCoupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState(false);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  useEffect(() => {
    function handleItemAdded(event: Event) {
      const { product, pack } = (event as CustomEvent<CartItemAddedDetail>).detail;

      if (product) {
        setProducts((current) => [
          ...current.filter((item) => item.id !== product.id),
          product,
        ]);
        setAddedName(product.name);
      }
      if (pack) {
        setPacks((current) => [
          ...current.filter((item) => item.id !== pack.id),
          pack,
        ]);
        setAddedName(pack.name);
      }

      setCartItems(getCartItems());
      setIsOpen(true);
    }

    window.addEventListener(CART_ITEM_ADDED_EVENT, handleItemAdded);
    const handleCartUpdated = () => setCartItems(getCartItems());
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => {
      window.removeEventListener(CART_ITEM_ADDED_EVENT, handleItemAdded);
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const resolvedItems = resolveCartItems(cartItems, products, packs);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = resolvedItems.reduce(
    (total, resolved) => total + ("product" in resolved ? resolved.product.price : resolved.pack.price) * resolved.item.quantity,
    0,
  );
  const hasCouponEligibleProduct = resolvedItems.some(
    (resolved) => "product" in resolved && (resolved.product as CartPreviewProduct).is_coupon_eligible !== false,
  );

  function getCouponEligibleSubtotal(activeCoupon: ActiveCoupon) {
    return resolvedItems.reduce((sum, resolved) => {
      if (!("product" in resolved)) return sum;
      const product = resolved.product as CartPreviewProduct;
      const isEligible = product.is_coupon_eligible ?? true;
      const isTargeted = activeCoupon.appliesToAll ||
        activeCoupon.applicableProductIds.map(String).includes(String(product.id));
      return isEligible && isTargeted
        ? sum + product.price * resolved.item.quantity
        : sum;
    }, 0);
  }

  const discount = coupon
    ? Math.round(getCouponEligibleSubtotal(coupon) * (coupon.value / 100))
    : 0;

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsCheckingCoupon(true);
    setCouponMessage("");
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (!response.ok) {
        setCoupon(null);
        sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
        setCouponError(true);
        setCouponMessage(data.error || "رمز القسيمة غير صالح أو منتهي");
        return;
      }

      const validCoupon: ActiveCoupon = {
        code: data.code,
        value: data.discountPercent,
        appliesToAll: data.appliesToAll,
        applicableProductIds: data.applicableProductIds || [],
      };
      if (getCouponEligibleSubtotal(validCoupon) <= 0) {
        setCoupon(null);
        sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
        setCouponError(true);
        setCouponMessage("لا يمكن تطبيق هذه القسيمة على المنتجات الموجودة في سلتك.");
        return;
      }

      setCoupon(validCoupon);
      sessionStorage.setItem(CART_COUPON_STORAGE_KEY, validCoupon.code);
      setCouponError(false);
      setCouponMessage(`تم تفعيل خصم ${validCoupon.value}%`);
    } catch {
      setCouponError(true);
      setCouponMessage("تعذر التحقق من القسيمة حالياً");
    } finally {
      setIsCheckingCoupon(false);
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMessage("");
    setCouponError(false);
    sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-to-cart-overlay"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="fixed inset-0 z-[60] bg-black/45"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <aside
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-preview-title"
              className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <FiX aria-hidden="true" className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 id="cart-preview-title" className="text-sm font-black text-neutral-950">سلتك</h2>
                  <p className="truncate text-[10px] text-neutral-500">{addedName} · {itemCount} قطع</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4">
                {resolvedItems.length > 0 ? (
                  <ul className="divide-y divide-neutral-100">
                    {resolvedItems.map((resolved) => {
                      const isProduct = "product" in resolved;
                      const name = isProduct ? resolved.product.name : resolved.pack.name;
                      const image = isProduct ? resolved.product.image : resolved.pack.image;
                      const price = isProduct ? resolved.product.price : resolved.pack.price;
                      const stock = isProduct ? resolved.product.stock : getPackStock(resolved.pack);
                      const href = isProduct ? `/products/${resolved.product.id}` : `/packs/${resolved.pack.slug}`;

                      return (
                        <li key={`${resolved.item.type}-${isProduct ? resolved.product.id : resolved.pack.id}`} className="flex items-center gap-2.5 py-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-50">
                            <Image src={image} alt={name} fill sizes="48px" className="object-contain p-1" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link href={href} onClick={() => setIsOpen(false)} className="block truncate text-[11px] font-bold text-neutral-900 hover:text-[#8b102f]">{name}</Link>
                            <p className="mt-0.5 text-[10px] font-semibold text-[#8b102f]">{(price * resolved.item.quantity).toLocaleString("ar-MA")} د.م</p>
                            <div className="mt-1.5 inline-flex h-7 items-center overflow-hidden rounded border border-neutral-200">
                              <button type="button" disabled={resolved.item.quantity <= 1} onClick={() => updateCartItem(resolved.item, resolved.item.quantity - 1)} aria-label={`تقليل كمية ${name}`} className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-35">
                                <FiMinus aria-hidden="true" className="h-3 w-3" />
                              </button>
                              <span className="min-w-7 text-center text-[10px] font-bold">{resolved.item.quantity}</span>
                              <button type="button" disabled={resolved.item.quantity >= stock} onClick={() => updateCartItem(resolved.item, Math.min(stock, resolved.item.quantity + 1))} aria-label={`زيادة كمية ${name}`} className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-35">
                                <FiPlus aria-hidden="true" className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeCartItem(resolved.item)} aria-label={`حذف ${name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-neutral-400 transition hover:bg-rose-50 hover:text-rose-700">
                            <FiTrash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-xs text-neutral-500">سلتك فارغة</p>
                )}
              </div>

              <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                {hasCouponEligibleProduct && (
                  <form onSubmit={(event) => { event.preventDefault(); void applyCoupon(); }} className="mb-3">
                    <div className="flex gap-2">
                      <label className="relative min-w-0 flex-1">
                        <FiTag aria-hidden="true" className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                        <input value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="رمز الخصم" aria-label="رمز الخصم" className="h-9 w-full rounded-md border border-neutral-200 bg-white pr-8 pl-2 text-[11px] uppercase outline-none focus:border-[#8b102f]" />
                      </label>
                      <button type="submit" disabled={isCheckingCoupon || !couponInput.trim()} className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 disabled:opacity-45">
                        <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />
                        تحقق
                      </button>
                      {coupon && <button type="button" onClick={clearCoupon} aria-label="إزالة القسيمة" className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><FiX className="h-4 w-4" /></button>}
                    </div>
                    {couponMessage && <p role="status" className={`mt-1 text-[10px] font-semibold ${couponError ? "text-rose-600" : "text-emerald-700"}`}>{couponMessage}</p>}
                  </form>
                )}
                <div className="mb-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-neutral-600"><span>المجموع الفرعي</span><span>{subtotal.toLocaleString("ar-MA")} د.م</span></div>
                  {discount > 0 && <div className="flex items-center justify-between font-bold text-[#8b102f]"><span>الخصم ({coupon?.value}%)</span><span>-{discount.toLocaleString("ar-MA")} د.م</span></div>}
                  <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-black text-neutral-950"><span>الإجمالي</span><span className="text-[#8b102f]">{(subtotal - discount).toLocaleString("ar-MA")} د.م</span></div>
                </div>
                <Link
                  href="/cart"
                  aria-disabled={resolvedItems.length === 0}
                  tabIndex={resolvedItems.length === 0 ? -1 : undefined}
                  onClick={(event) => {
                    if (resolvedItems.length === 0) event.preventDefault();
                    else setIsOpen(false);
                  }}
                  className={`cart-action-button flex h-11 w-full items-center justify-center gap-2 rounded-md text-white ${resolvedItems.length === 0 ? "pointer-events-none opacity-45" : ""}`}
                >
                  <FiShoppingBag aria-hidden="true" className="h-4 w-4" />
                  إتمام الطلب
                </Link>
              </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}