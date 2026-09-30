"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { getPackStock } from "@/lib/packs";
import type { Pack, Product } from "@/types/catalog";
import {
  CART_COUPON_STORAGE_KEY,
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  getCartItems,
  removeCartItem,
  resolveCartItems,
  updateCartItem as updateStoredCartItem,
  type CartItem as StoredCartItem,
} from "@/lib/cart";

type CartProduct = Product & {
  is_coupon_eligible?: boolean;
};

type CartItem =
  | { entry: Extract<StoredCartItem, { type: "product" }>; product: CartProduct }
  | { entry: Extract<StoredCartItem, { type: "pack" }>; pack: Pack };

type ActiveCoupon = {
  code: string;
  value: number;
  appliesToAll: boolean;
  applicableProductIds: string[];
} | null;

type CustomerDetails = {
  name: string;
  phone: string;
  city: string;
};

const POPULAR_CITIES = [
  "الدار البيضاء",
  "الرباط",
  "مراكش",
  "طنجة",
  "فاس",
  "أكادير",
];

const CART_CLEARED_KEY = "samara-cart-cleared";

function subscribeToCartState(onChange: () => void) {
  window.addEventListener("samara-cart-cleared", onChange);
  window.addEventListener(CART_UPDATED_EVENT, onChange);
  return () => {
    window.removeEventListener("samara-cart-cleared", onChange);
    window.removeEventListener(CART_UPDATED_EVENT, onChange);
  };
}

function getCartClearedState() {
  return window.sessionStorage.getItem(CART_CLEARED_KEY) === "true";
}

function getServerCartClearedState() {
  return false;
}

function getStoredCartSnapshot() {
  return window.localStorage.getItem(CART_STORAGE_KEY) ?? "";
}

function getServerStoredCartSnapshot() {
  return "";
}

export function CartPage({ products, packs }: { products: Product[]; packs: Pack[] }) {
  const router = useRouter();

  // Cart Sync
  const cartCleared = useSyncExternalStore(
    subscribeToCartState,
    getCartClearedState,
    getServerCartClearedState,
  );
  const storedCartSnapshot = useSyncExternalStore(
    subscribeToCartState,
    getStoredCartSnapshot,
    getServerStoredCartSnapshot,
  );

  const storedItems = storedCartSnapshot ? getCartItems() : [];
  const items: CartItem[] = storedCartSnapshot
    ? resolveCartItems(storedItems, products, packs).map((resolved) =>
        "product" in resolved
          ? { entry: resolved.item, product: resolved.product }
          : { entry: resolved.item, pack: resolved.pack },
      )
    : [];

  // Form & Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<ActiveCoupon>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState(false);
  const couponRestoreStarted = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    phone: "",
    city: "",
  });
  const [customerErrors, setCustomerErrors] = useState<Partial<CustomerDetails>>({});
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const cartItems = cartCleared ? [] : items;

  useEffect(() => {
    const code = window.sessionStorage.getItem(CART_COUPON_STORAGE_KEY);
    if (!code || couponRestoreStarted.current) return;
    couponRestoreStarted.current = true;

    async function restoreCoupon() {
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (!response.ok) {
          window.sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
          return;
        }

        const restoredCoupon: Exclude<ActiveCoupon, null> = {
          code: data.code,
          value: data.discountPercent,
          appliesToAll: data.appliesToAll,
          applicableProductIds: data.applicableProductIds || [],
        };
        const eligibleSubtotal = resolveCartItems(getCartItems(), products, packs).reduce((sum, resolved) => {
          if (!("product" in resolved)) return sum;
          const product = resolved.product as Product;
          const isEligible = product.is_coupon_eligible ?? true;
          const isTargeted = restoredCoupon.appliesToAll ||
            restoredCoupon.applicableProductIds.map(String).includes(String(product.id));
          return isEligible && isTargeted
            ? sum + product.price * resolved.item.quantity
            : sum;
        }, 0);

        if (eligibleSubtotal <= 0) {
          window.sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
          return;
        }

        setCoupon(restoredCoupon);
        setCouponInput(restoredCoupon.code);
        setCouponError(false);
        setCouponMessage(`تم تفعيل خصم ${restoredCoupon.value}% على المنتجات المؤهلة فقط`);
      } catch {
        window.sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
      }
    }

    void restoreCoupon();
  }, [storedCartSnapshot, products, packs]);

  function getCouponEligibleSubtotal(activeCoupon: Exclude<ActiveCoupon, null>) {
    return cartItems.reduce((sum, item) => {
      if (!("product" in item)) return sum;

      const isEligible = item.product.is_coupon_eligible ?? true;
      const isTargeted = activeCoupon.appliesToAll ||
        activeCoupon.applicableProductIds.map(String).includes(String(item.product.id));
      return isEligible && isTargeted
        ? sum + item.product.price * item.entry.quantity
        : sum;
    }, 0);
  }

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      ("product" in item ? item.product.price : item.pack.price) *
        item.entry.quantity,
    0,
  );

  // Targeted Discount Calculation: Applied ONLY to coupon-eligible products
  const discount = (() => {
    if (!coupon) return 0;

    return Math.round(getCouponEligibleSubtotal(coupon) * (coupon.value / 100));
  })();

  const shipping = 0;
  const total = subtotal - discount + shipping;

  const itemCount = cartItems.reduce(
    (sum, item) => sum + item.entry.quantity,
    0,
  );

  function updateQuantity(item: CartItem, amount: number) {
    const stock = "product" in item ? item.product.stock : getPackStock(item.pack);
    updateStoredCartItem(
      item.entry,
      Math.min(stock, Math.max(1, item.entry.quantity + amount)),
    );
  }

  function removeItem(item: CartItem) {
    removeCartItem(item.entry);
  }

  async function applyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCoupon(null);
        setCouponError(true);
        setCouponMessage(data.error || "رمز القسيمة غير صالح أو منتهي");
        return;
      }

      const validCoupon: Exclude<ActiveCoupon, null> = {
        code: data.code,
        value: data.discountPercent,
        appliesToAll: data.appliesToAll,
        applicableProductIds: data.applicableProductIds || [],
      };
      const eligibleSubtotal = getCouponEligibleSubtotal(validCoupon);
      if (eligibleSubtotal <= 0) {
        const singleIneligibleProduct = cartItems.length === 1 &&
          "product" in cartItems[0] &&
          cartItems[0].product.is_coupon_eligible === false;
        setCoupon(null);
        setCouponError(true);
        setCouponMessage(singleIneligibleProduct
          ? "هذا المنتج لا يقبل كوبونات الخصم."
          : "لا يمكن تطبيق هذه القسيمة على المنتجات الموجودة في سلتك.");
        return;
      }

      setCoupon(validCoupon);
      window.sessionStorage.setItem(CART_COUPON_STORAGE_KEY, validCoupon.code);
      setCouponError(false);
      setCouponMessage(`تم تفعيل خصم ${data.discountPercent}% على المنتجات المؤهلة فقط`);
    } catch {
      setCouponError(true);
      setCouponMessage("تعذر التحقق من القسيمة حالياً");
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMessage("");
    setCouponError(false);
    window.sessionStorage.removeItem(CART_COUPON_STORAGE_KEY);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: Partial<CustomerDetails> = {};
    const trimmedName = customer.name.trim();
    const normalizedPhone = customer.phone.replace(/[\s-]/g, "");

    if (trimmedName.length < 2) errors.name = "أدخل الاسم الكامل";
    if (!/^(?:\+212|0)[5-7][0-9]{8}$/.test(normalizedPhone) && !/^\+?[0-9]{8,15}$/.test(normalizedPhone)) {
      errors.phone = "أدخل رقم هاتف صحيح";
    }
    if (customer.city.trim().length < 2) errors.city = "أدخل المدينة";

    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    const orderPayload = {
      customer: {
        name: trimmedName,
        phone: normalizedPhone,
        city: customer.city.trim(),
      },
      items: cartItems.map((item) =>
        "product" in item
          ? {
              type: "product" as const,
              productId: item.product.id,
              quantity: item.entry.quantity,
            }
          : {
              type: "pack" as const,
              packId: item.pack.id,
              quantity: item.entry.quantity,
            },
      ),
      coupon: coupon?.code ?? null,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        setIsSubmitting(false);
        setCustomerErrors({ name: "حدث خطأ أثناء حفظ الطلب. يرجى المحاولة ثانية." });
        return;
      }

      const result = (await response.json()) as { orderId?: string };
      if (!result.orderId) {
        setIsSubmitting(false);
        setCustomerErrors({ name: "تعذر تأكيد الطلب." });
        return;
      }

      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.sessionStorage.setItem(CART_CLEARED_KEY, "true");
      window.dispatchEvent(new Event("samara-cart-cleared"));
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      setOrderSubmitted(true);
      router.push("/order-success");
    } catch {
      setIsSubmitting(false);
      setCustomerErrors({ name: "خطأ في الاتصال بالخادم." });
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-white text-neutral-950 pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Bar */}
        <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
          <h1 className="text-xl font-black sm:text-2xl">سلة الشراء وإتمام الطلب</h1>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-950"
          >
            <FiArrowRight className="h-3.5 w-3.5" />
            <span>متابعة التسوق</span>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-12">
            
            {/* SECTION 1: PRODUCTS LIST (7 Cols on Desktop) */}
            <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <h2 className="text-sm font-black text-neutral-900">
                  المنتجات المضافة ({itemCount})
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700">
                  توصيل مجاني لجميع المنتجات
                </span>
              </div>

              <div className="divide-y divide-neutral-200">
                {cartItems.map((item) => (
                  <CartItemRow
                    key={`${item.entry.type}-${
                      item.entry.type === "product"
                        ? item.entry.productId
                        : item.entry.packId
                    }`}
                    item={item}
                    onIncrease={() => updateQuantity(item, 1)}
                    onDecrease={() => updateQuantity(item, -1)}
                    onRemove={() => removeItem(item)}
                  />
                ))}
              </div>
            </section>

            {/* SECTION 2: FORM INPUTS & SUMMARY (5 Cols on Desktop) */}
            <section className="rounded-md border border-neutral-200 bg-neutral-50/50 p-5 sm:p-6 lg:sticky lg:top-6 lg:col-span-5">
              <h2 className="text-sm font-black border-b border-neutral-200 pb-3 text-neutral-900">
                بيانات التوصيل والطلب
              </h2>

              <form onSubmit={submitOrder} className="mt-4 space-y-3.5">
                {/* Name */}
                <CustomerField
                  label="الاسم الكامل"
                  name="name"
                  value={customer.name}
                  placeholder="مثال: يوسف الإدريسي"
                  error={customerErrors.name}
                  onChange={(val) => setCustomer((c) => ({ ...c, name: val }))}
                />

                {/* Phone */}
                <CustomerField
                  label="رقم الهاتف"
                  name="phone"
                  value={customer.phone}
                  placeholder="06 00 00 00 00"
                  inputMode="tel"
                  error={customerErrors.phone}
                  onChange={(val) => setCustomer((c) => ({ ...c, phone: val }))}
                />

                {/* City */}
                <div>
                  <CustomerField
                    label="المدينة"
                    name="city"
                    value={customer.city}
                    placeholder="مثال: الدار البيضاء"
                    error={customerErrors.city}
                    onChange={(val) => setCustomer((c) => ({ ...c, city: val }))}
                  />

                  {/* Quick City Pills */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setCustomer((c) => ({ ...c, city }))}
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                          customer.city === city
                            ? "bg-[#8B102F] text-white"
                            : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-neutral-200 pt-3">
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                      <span>كوبون {coupon.code} (-{coupon.value}%)</span>
                      <button type="button" onClick={clearCoupon} aria-label="إزالة القسيمة">
                        <FiX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="رمز الخصم"
                          className="h-9 w-full rounded-md border border-neutral-200 bg-white pr-8 pl-2 text-xs uppercase outline-none focus:border-[#8B102F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => applyCoupon(e as unknown as FormEvent<HTMLFormElement>)}
                        className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
                      >
                        تطبيق
                      </button>
                    </div>
                  )}

                  {couponMessage && (
                    <span
                      className={`mt-1 block text-[10px] ${
                        couponError ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"
                      }`}
                    >
                      {couponMessage}
                    </span>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-2 border-t border-neutral-200 pt-3 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>المجموع الفرعي</span>
                    <span className="font-bold text-neutral-900">
                      {subtotal.toLocaleString("ar-MA")} د.م
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>الشحن</span>
                    <span className="font-bold text-emerald-700">مجاني</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between font-bold text-[#8B102F]">
                      <span>الخصم ({coupon?.value}%)</span>
                      <span>-{discount.toLocaleString("ar-MA")} د.م</span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between border-t border-neutral-200 pt-2 text-sm">
                    <span className="font-black text-neutral-900">المجموع الصافي</span>
                    <span className="text-xl font-black text-[#8B102F]">
                      {total.toLocaleString("ar-MA")} د.م
                    </span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || orderSubmitted}
                  className="cart-action-button mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "جاري التأكيد..." : "تأكيد الطلب الآن (الدفع عند الاستلام)"}
                </button>

                <p className="text-center text-[10px] text-neutral-500">
                  الدفع نقداً عند استلام ومعاينة طلبيتك
                </p>
              </form>
            </section>

          </div>
        )}
      </div>
    </main>
  );
}

function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  const isPack = "pack" in item;
  const name = isPack ? item.pack.name : item.product.name;
  const image = isPack ? item.pack.image : item.product.image;
  const price = isPack ? item.pack.price : item.product.price;
  const stock = isPack ? getPackStock(item.pack) : item.product.stock;
  const totalPrice = price * item.entry.quantity;

  return (
    <article className="flex items-center gap-3.5 py-4 sm:gap-4">
      {/* Thumbnail */}
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 sm:h-22 sm:w-20">
        {image ? (
          <Image src={image} alt={name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
            لا صورة
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-[#8B102F]">
              {isPack ? "باقة خاصة" : item.product.category}
            </span>
            <h3 className="line-clamp-1 text-xs font-black text-neutral-900 sm:text-sm">
              {name}
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              {price.toLocaleString("ar-MA")} د.م
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`حذف ${name}`}
            className="text-neutral-400 hover:text-neutral-900"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper + Subtotal */}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex h-7 items-center rounded-md border border-neutral-200">
            <button
              type="button"
              onClick={onDecrease}
              disabled={item.entry.quantity <= 1}
              className="flex h-full w-7 items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-25"
            >
              <FiMinus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-xs font-bold">{item.entry.quantity}</span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={item.entry.quantity >= stock}
              className="flex h-full w-7 items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-25"
            >
              <FiPlus className="h-3 w-3" />
            </button>
          </div>

          <span className="text-xs font-black text-neutral-900 sm:text-sm">
            {totalPrice.toLocaleString("ar-MA")} د.م
          </span>
        </div>
      </div>
    </article>
  );
}

function CustomerField({
  label,
  name,
  value,
  placeholder,
  inputMode,
  error,
  onChange,
}: {
  label: string;
  name: keyof CustomerDetails;
  value: string;
  placeholder: string;
  inputMode?: "text" | "tel";
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold text-neutral-800">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={name === "name" ? "name" : name === "phone" ? "tel" : "address-level2"}
        className={`h-10 w-full rounded-md border bg-white px-3 text-xs outline-none transition focus:border-[#8B102F] ${
          error ? "border-[#8B102F]" : "border-neutral-200"
        }`}
      />
      {error && <span className="mt-1 block text-[10px] font-bold text-[#8B102F]">{error}</span>}
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="w-full mx-auto flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 py-16 text-center">
      <FiShoppingBag className="h-8 w-8 text-neutral-400" />
      <h2 className="mt-4 text-base font-black text-neutral-950">سلتك فارغة</h2>
      <p className="mt-1 text-xs text-neutral-500">
        لم تضف أي منتجات إلى سلتك بعد.
      </p>
      <Link
        href="/products"
        className="mt-5 rounded-md bg-[#8B102F] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#6f0d26]"
      >
        تصفح المنتجات
      </Link>
    </div>
  );
}