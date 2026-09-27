"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiEdit2,
  FiImage,
  FiLayers,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiSave,
  FiSearch,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast, Toaster } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type AdminPack = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  price: number;
  original_price: number | null;
  is_active: boolean;
  pack_items: Array<{ product_id: string; quantity: number; product_url: string | null }>;
  colors: Array<{ id: string; name: string; hex: string; image: string }>;
};

// 1. Add Coupon types to your types section:
export type AdminCoupon = {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  applies_to_all: boolean;
  applicable_product_ids: string[];
  created_at?: string;
};

type AdminProductColor = {
  id: string;
  name: string;
  hex: string;
  image: string;
  galleryImages?: string[];
};

// 2. Extend AdminProduct type:
export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  old_price: number | null;
  discount: number;
  rating: number;
  badge: string | null;
  description: string;
  stock: number;
  shipping: string;
  is_active: boolean;
  is_featured?: boolean;
  is_coupon_eligible?: boolean; // <-- NEW
  colors: AdminProductColor[];
  features: string[];
};

export type AdminOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "completed" | "cancelled";
  created_at: string;
  order_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

type TabType = "orders" | "products" | "packs";
type DeleteRequest = {
  kind: "product" | "pack" | "coupon" | "orders";
  ids: string[];
  label: string;
};

const emptyProduct = (): AdminProduct => ({
  id: "",
  name: "",
  category: "",
  image: "",
  price: 0,
  old_price: null,
  discount: 0,
  rating: 5,
  badge: null,
  description: "",
  stock: 10,
  shipping: "شحن مجاني",
  is_active: true,
  is_featured: false,
  colors: [],
  features: [],
});

const emptyPack = (productId = ""): AdminPack => ({
  id: "",
  name: "",
  slug: "",
  description: "",
  image: null,
  price: 0,
  original_price: null,
  is_active: true,
  pack_items: productId ? [{ product_id: productId, quantity: 1, product_url: null }] : [],
  colors: [],
});

function getPackContentSnapshot(pack: AdminPack) {
  return JSON.stringify({
    id: pack.id,
    name: pack.name,
    slug: pack.slug,
    description: pack.description,
    image: pack.image,
    price: pack.price,
    original_price: pack.original_price,
    pack_items: pack.pack_items,
    colors: pack.colors,
  });
}

function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return str.startsWith("/");
  }
}

function isValidRedirectUrl(str: string) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return str.startsWith("/") && !str.startsWith("//");
  }
}

export function AdminDashboard({
  userEmail,
  initialProducts,
  initialPacks,
  initialOrders,
}: {
  userEmail: string;
  initialProducts: AdminProduct[];
  initialPacks: AdminPack[];
  initialOrders: AdminOrder[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [products, setProducts] = useState(initialProducts);
  const [packs, setPacks] = useState(initialPacks);
  const [orders, setOrders] = useState(initialOrders);

  const [searchQuery, setSearchQuery] = useState("");
  const [productEditor, setProductEditor] = useState<AdminProduct | null>(null);
  const [featuredProductSaving, setFeaturedProductSaving] = useState<string | null>(null);
  const [orderStatusSaving, setOrderStatusSaving] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [packEditor, setPackEditor] = useState<AdminPack | null>(null);
  const originalPackSnapshots = useRef(new Map<string, string>());
  const [packColorsEditor, setPackColorsEditor] = useState<AdminPack | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const knownOrderIds = useRef(new Set(initialOrders.map((order) => order.id)));

  // In AdminDashboard state:
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [couponEditor, setCouponEditor] = useState<AdminCoupon | null>(null);

  // Fetch coupons on mount
  useEffect(() => {
    fetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons) setCoupons(data.coupons);
      })
      .catch(() => {});
  }, []);

  // Live polling for incoming orders
  useEffect(() => {
    let active = true;
    async function refreshOrders() {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as { orders?: AdminOrder[] };
        if (!active || !result.orders) return;

        const newOrders = result.orders.filter((order) => !knownOrderIds.current.has(order.id));
        result.orders.forEach((order) => knownOrderIds.current.add(order.id));
        setOrders(result.orders);

        newOrders.forEach((order) => {
          toast.success(`طلب جديد: ${order.customer_name}`, {
            description: `${order.total.toLocaleString("ar-MA")} د.م • ${order.customer_city}`,
          });
        });
      } catch {
        // Quiet network error
      }
    }

    const intervalId = window.setInterval(refreshOrders, 8000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Smart Validation & Save
  async function save(kind: "product" | "pack") {
    setEditorError(null);

    if (kind === "product") {
      if (!productEditor) return;
      if (!productEditor.name.trim()) {
        setEditorError("يرجى إدخال اسم المنتج");
        return;
      }
      if (productEditor.price <= 0) {
        setEditorError("سعر المنتج يجب أن يكون أكبر من 0 د.م");
        return;
      }
      if (productEditor.image && !isValidUrl(productEditor.image)) {
        setEditorError("رابط الصورة غير صالح. يرجى إدخال رابط URL صحيح");
        return;
      }

      setBusy(true);
      try {
        const cleanedFeatures = productEditor.features.map((feature) => feature.trim()).filter(Boolean);
        const payload = {
          ...productEditor,
          features: cleanedFeatures,
          id: productEditor.id || undefined,
          oldPrice: productEditor.old_price,
          isActive: productEditor.is_active,
          isFeatured: productEditor.is_featured ?? false,
          isCouponEligible: productEditor.is_coupon_eligible ?? true,
        };

        const response = await fetch("/api/admin/catalog", {
          method: productEditor.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "product", id: productEditor.id || undefined, data: payload }),
        });

        const result = (await response.json()) as { error?: string; data?: { id?: string } };
        if (!response.ok || result.error) {
          throw new Error(result.error ?? "تعذر حفظ المنتج");
        }

        // Update local state without full reload
        const savedProduct = {
          ...productEditor,
          features: cleanedFeatures,
          is_featured: productEditor.is_featured ?? false,
        };
        if (productEditor.id) {
          setProducts((curr) => curr.map((product) => {
            if (product.id === productEditor.id) return savedProduct;
            return savedProduct.is_featured ? { ...product, is_featured: false } : product;
          }));
          toast.success("تم تحديث بيانات المنتج بنجاح");
        } else {
          setProducts((curr) => [
            { ...savedProduct, id: result.data?.id || `p-${Date.now()}` },
            ...curr.map((product) => savedProduct.is_featured ? { ...product, is_featured: false } : product),
          ]);
          toast.success("تمت إضافة المنتج الجديد بنجاح");
        }

        setProductEditor(null);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ";
        setEditorError(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    }

    if (kind === "pack") {
      if (!packEditor) return;
      const originalPackSnapshot = packEditor.id
        ? originalPackSnapshots.current.get(packEditor.id)
        : undefined;
      const packHasNoUnsavedChanges = Boolean(
        originalPackSnapshot &&
        getPackContentSnapshot(packEditor) === originalPackSnapshot &&
        packs.find((pack) => pack.id === packEditor.id)?.is_active === packEditor.is_active,
      );

      if (packHasNoUnsavedChanges) {
        setEditorError(null);
        setPackEditor(null);
        return;
      }

      if (!packEditor.name.trim()) {
        setEditorError("يرجى إدخال اسم الباقة");
        return;
      }
      if (!packEditor.slug.trim()) {
        setEditorError("يرجى إدخال معرّف الرابط (Slug)");
        return;
      }
      if (packEditor.price <= 0) {
        setEditorError("سعر الباقة يجب أن يكون أكبر من 0 د.م");
        return;
      }
      if (packEditor.pack_items.length === 0) {
        setEditorError("يجب أن تحتوي الباقة على منتج واحد على الأقل");
        return;
      }
      if (packEditor.image && !isValidUrl(packEditor.image)) {
        setEditorError("رابط صورة الباقة غير صالح");
        return;
      }
      if (packEditor.pack_items.some((item) => item.product_url && !isValidRedirectUrl(item.product_url))) {
        setEditorError("يرجى إدخال روابط المنتجات بصيغة URL صحيحة أو مسار داخلي يبدأ بـ /");
        return;
      }

      setBusy(true);
      try {
        const payload = {
          ...packEditor,
          id: packEditor.id || undefined,
          originalPrice: packEditor.original_price,
          isActive: packEditor.is_active,
          items: packEditor.pack_items,
        };

        const response = await fetch("/api/admin/catalog", {
          method: packEditor.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "pack", id: packEditor.id || undefined, data: payload }),
        });

        const result = (await response.json()) as { error?: string; pack?: AdminPack };
        if (!response.ok || result.error) {
          throw new Error(result.error ?? "تعذر حفظ الباقة");
        }

        if (packEditor.id) {
          setPacks((curr) =>
            curr.map((p) => (p.id === packEditor.id ? { ...packEditor } : p))
          );
          toast.success("تم تحديث الباقة بنجاح");
        } else {
          setPacks((curr) => [{ ...packEditor, id: result.pack?.id || `pk-${Date.now()}` }, ...curr]);
          toast.success("تم إنشاء الباقة بنجاح");
        }

        setPackEditor(null);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الباقة";
        setEditorError(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    }
  }

  async function updatePackStatus(packId: string, isActive: boolean) {
    setBusy(true);
    setEditorError(null);
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "packStatus", id: packId, data: { isActive } }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok || result.error) throw new Error(result.error ?? "تعذر تحديث حالة الباقة");

      setPacks((current) => current.map((pack) =>
        pack.id === packId ? { ...pack, is_active: isActive } : pack,
      ));
      setPackEditor((current) => current?.id === packId
        ? { ...current, is_active: isActive }
        : current,
      );
      toast.success(isActive ? "تم تفعيل الباقة في المتجر" : "تم إخفاء الباقة من المتجر");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تحديث حالة الباقة";
      setEditorError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(kind: DeleteRequest["kind"], ids: string[], label: string) {
    setDeleteError(null);
    setDeleteRequest({ kind, ids, label });
  }

  async function confirmDelete() {
    if (!deleteRequest || deleting) return;
    setDeleting(true);
    try {
      let response: Response;
      if (deleteRequest.kind === "orders") {
        response = await fetch("/api/admin/orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: deleteRequest.ids }),
        });
      } else if (deleteRequest.kind === "coupon") {
        response = await fetch(`/api/admin/coupons?id=${encodeURIComponent(deleteRequest.ids[0])}`, { method: "DELETE" });
      } else {
        response = await fetch("/api/admin/catalog", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: deleteRequest.kind, id: deleteRequest.ids[0] }),
        });
      }

      const result = await response.json() as { error?: string };
      if (!response.ok || result.error) throw new Error(result.error ?? "تعذر الحذف");

      if (deleteRequest.kind === "product") {
        setProducts((current) => current.filter((product) => !deleteRequest.ids.includes(product.id)));
      } else if (deleteRequest.kind === "pack") {
        setPacks((current) => current.filter((pack) => !deleteRequest.ids.includes(pack.id)));
      } else if (deleteRequest.kind === "coupon") {
        setCoupons((current) => current.filter((coupon) => coupon.id !== deleteRequest.ids[0]));
      } else {
        const deletedIds = new Set(deleteRequest.ids);
        setOrders((current) => current.filter((order) => !deletedIds.has(order.id)));
        setSelectedOrderIds((current) => current.filter((id) => !deletedIds.has(id)));
        deleteRequest.ids.forEach((id) => knownOrderIds.current.delete(id));
      }

      toast.success(deleteRequest.kind === "orders" ? `تم حذف ${deleteRequest.ids.length} طلبات` : "تم الحذف بنجاح");
      setDeleteRequest(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر الحذف";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  async function setFeaturedProduct(id: string) {
    setFeaturedProductSaving(id);
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "featuredProduct", id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok || result.error) throw new Error(result.error ?? "تعذر اختيار المنتج المميز");

      setProducts((current) => current.map((product) => ({ ...product, is_featured: product.id === id })));
      toast.success("تم تحديث المنتج المميز في الصفحة الرئيسية");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر اختيار المنتج المميز");
    } finally {
      setFeaturedProductSaving(null);
    }
  }

  async function updateOrderStatus(orderId: string, status: AdminOrder["status"]) {
    setOrderStatusSaving(orderId);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      const result = (await response.json()) as { error?: string; order?: { id: string; status: AdminOrder["status"] } };
      if (!response.ok || !result.order) throw new Error(result.error ?? "تعذر تحديث حالة الطلب");

      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: result.order!.status } : order));
      toast.success("تم تحديث حالة الطلب");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث حالة الطلب");
    } finally {
      setOrderStatusSaving(null);
    }
  }

  function toggleOrderSelection(orderId: string, selected: boolean) {
    setSelectedOrderIds((current) => selected
      ? current.includes(orderId) ? current : [...current, orderId]
      : current.filter((id) => id !== orderId));
  }

  function toggleVisibleOrderSelection(orderIds: string[], selected: boolean) {
    setSelectedOrderIds((current) => {
      const visibleIds = new Set(orderIds);
      const remaining = current.filter((id) => !visibleIds.has(id));
      return selected ? [...remaining, ...orderIds] : remaining;
    });
  }

  async function savePackColors(pack: AdminPack) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "pack",
          id: pack.id,
          data: {
            ...pack,
            originalPrice: pack.original_price,
            isActive: pack.is_active,
            items: pack.pack_items,
            colors: pack.colors,
          },
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok || result.error) throw new Error(result.error ?? "تعذر الحفظ");

      setPacks((curr) => curr.map((p) => (p.id === pack.id ? { ...pack } : p)));
      setPackColorsEditor(null);
      toast.success("تم حفظ ألوان الباقة بنجاح");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ الألوان");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/");
  }

  // Filtered queries
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.customer_city.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const filteredPacks = useMemo(() => {
    if (!searchQuery.trim()) return packs;
    const q = searchQuery.toLowerCase();
    return packs.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [packs, searchQuery]);
  const completedRevenue = orders.reduce(
    (total, order) => total + (order.status === "completed" ? order.total : 0),
    0,
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Toaster dir="rtl" position="top-left" richColors closeButton />

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full shrink-0 border-b border-[#e1e3e5] bg-[#ebebeb] p-4 lg:w-60 lg:border-b-0 lg:border-l lg:p-3">
        <div className="flex items-center justify-between px-2 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#303030] text-xs font-black text-white">
              س
            </div>
            <div>
              <p className="text-xs font-black text-[#202223]">متجر سمارة</p>
              <p className="text-[10px] text-[#6d7175]">لوحة القيادة</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex h-7 w-7 items-center justify-center rounded text-[#6d7175] hover:bg-[#dfdfdf]"
            title="زيارة المتجر"
          >
            <FiArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <nav className="mt-2 space-y-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              setSearchQuery("");
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 transition ${
              activeTab === "orders" ? "bg-white text-[#202223] shadow-xs" : "text-[#4a4d50] hover:bg-[#e1e3e5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiShoppingBag className="h-4 w-4" />
              <span>الطلبات</span>
            </div>
            <span className="rounded-full bg-[#dfdfdf] px-1.5 py-0.5 text-[10px] font-bold text-[#202223]">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("products");
              setSearchQuery("");
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 transition ${
              activeTab === "products" ? "bg-white text-[#202223] shadow-xs" : "text-[#4a4d50] hover:bg-[#e1e3e5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiPackage className="h-4 w-4" />
              <span>المنتجات</span>
            </div>
            <span className="rounded-full bg-[#dfdfdf] px-1.5 py-0.5 text-[10px] font-bold text-[#202223]">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("packs");
              setSearchQuery("");
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 transition ${
              activeTab === "packs" ? "bg-white text-[#202223] shadow-xs" : "text-[#4a4d50] hover:bg-[#e1e3e5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiLayers className="h-4 w-4" />
              <span>الباقات المنسقة</span>
            </div>
            <span className="rounded-full bg-[#dfdfdf] px-1.5 py-0.5 text-[10px] font-bold text-[#202223]">
              {packs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("coupons" as TabType);
              setSearchQuery("");
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 transition ${
              activeTab === ("coupons" as TabType)
                ? "bg-white text-[#202223] shadow-xs"
                : "text-[#4a4d50] hover:bg-[#e1e3e5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiTag className="h-4 w-4" />
              <span>القسائم والخصومات</span>
            </div>
            <span className="rounded-full bg-[#dfdfdf] px-1.5 py-0.5 text-[10px] font-bold text-[#202223]">
              {coupons.length}
            </span>
          </button>
        </nav>

        <div className="mt-8 border-t border-[#d8d9db] pt-3 lg:mt-auto">
          <div className="px-2 py-1">
            <p className="truncate text-[11px] font-bold text-[#202223]">{userEmail}</p>
            <p className="text-[10px] text-[#6d7175]">مسؤول المتجر</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-[#8B102F] hover:bg-rose-50"
          >
            <FiLogOut className="h-3.5 w-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#202223]">
                {activeTab === "orders" && "إدارة الطلبات"}
                {activeTab === "products" && "كتالوج المنتجات"}
                {activeTab === "packs" && "باقات العروض التوفيرية"}
              </h1>
              <p className="text-xs text-[#6d7175]">
                {activeTab === "orders" && "تحديث حي ومباشر لكافة طلبات الدفع عند الاستلام."}
                {activeTab === "products" && "إدارة الأسعار، الروابط، وتفاصيل المنتجات."}
                {activeTab === "packs" && "حزم المنتجات المدمجة بأسعار تفضيلية."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "products" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditorError(null);
                    setProductEditor(emptyProduct());
                  }}
                  className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-[#8B102F] px-3.5 text-xs font-bold text-white transition hover:bg-[#6f0d26] active:scale-98"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  <span>إضافة منتج</span>
                </button>
              )}

              {activeTab === "packs" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditorError(null);
                    setPackEditor(emptyPack(products[0]?.id));
                  }}
                  className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-[#8B102F] px-3.5 text-xs font-bold text-white transition hover:bg-[#6f0d26] active:scale-98"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  <span>إنشاء باقة جديدة</span>
                </button>
              )}
            </div>

            {/* RENDER IN MAIN WORKSPACE WHEN activeTab === 'coupons' */}
            {activeTab === ("coupons" as TabType) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#202223]">قائمة قسائم الخصم</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setCouponEditor({
                        id: "",
                        code: "",
                        discount_percent: 10,
                        is_active: true,
                        applies_to_all: true,
                        applicable_product_ids: [],
                      })
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#8B102F] px-3 text-xs font-bold text-white hover:bg-[#6f0d26]"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    <span>إنشاء قسيمة جديدة</span>
                  </button>
                </div>

                <div className="overflow-hidden rounded-md border border-[#e1e3e5] bg-white shadow-2xs">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-[#e1e3e5] bg-[#fafbfb] text-[11px] font-bold text-[#6d7175]">
                      <tr>
                        <th className="p-3">رمز القسيمة</th>
                        <th className="p-3">نسبة الخصم</th>
                        <th className="p-3">تطبيق الخصم على</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f3]">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-[#f6f6f7]">
                          <td className="p-3 font-bold text-[#202223] font-mono tracking-wider">
                            {coupon.code}
                          </td>
                          <td className="p-3 font-black text-[#8B102F]">
                            {coupon.discount_percent}%
                          </td>
                          <td className="p-3 text-[#6d7175]">
                            {coupon.applies_to_all
                              ? "جميع المنتجات المؤهلة"
                              : `${coupon.applicable_product_ids?.length || 0} منتجات مخصصة`}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                coupon.is_active
                                  ? "bg-[#d7f1eb] text-[#00705a]"
                                  : "bg-[#e4e5e7] text-[#6d7175]"
                              }`}
                            >
                              {coupon.is_active ? "نشطة" : "معطلة"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => requestDelete("coupon", [coupon.id], coupon.code)}
                              className="p-1 text-[#8c9196] hover:text-rose-600"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {coupons.length === 0 && (
                    <div className="p-8 text-center text-xs text-[#6d7175]">لا توجد قسائم حتى الآن.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ShopifyMetric
              title="إجمالي الإيرادات"
              value={`${completedRevenue.toLocaleString("ar-MA")} د.م`}
              note="الطلبات المكتملة فقط"
            />
            <ShopifyMetric
              title="الطلبات المسجلة"
              value={orders.length.toLocaleString("ar-MA")}
              note="محدث باستمرار"
            />
            <ShopifyMetric
              title="المنتجات النشطة"
              value={products.filter((product) => product.is_active).length.toLocaleString("ar-MA")}
              note="في الكتالوج"
            />
            <ShopifyMetric
              title="الباقات المتاحة"
              value={packs.filter((pack) => pack.is_active).length.toLocaleString("ar-MA")}
              note="حزم جاهزة"
            />
          </div>

          {/* Search Bar */}
          <div className="rounded-md border border-[#e1e3e5] bg-white p-3 shadow-2xs">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c9196]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedOrderIds([]);
                }}
                placeholder={
                  activeTab === "orders"
                    ? "ابحث باسم الزبون، المدينة، أو رقم الهاتف..."
                    : activeTab === "products"
                    ? "ابحث باسم المنتج أو الفئة..."
                    : "ابحث باسم الباقة..."
                }
                className="h-9 w-full rounded-md border border-[#c9cccf] pr-9 pl-3 text-xs outline-none focus:border-[#8B102F] focus:ring-1 focus:ring-[#8B102F]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedOrderIds([]);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6d7175]"
                >
                  مسح
                </button>
              )}
            </div>
          </div>

          {/* Resource Views */}
          {activeTab === "orders" && (
            <>
              {filteredOrders.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e1e3e5] bg-white px-3 py-2.5">
                  <span className="text-[11px] font-semibold text-[#6d7175]">
                    {selectedOrderIds.length > 0 ? `تم تحديد ${selectedOrderIds.length} طلب` : `${filteredOrders.length} طلبات معروضة`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleVisibleOrderSelection(filteredOrders.map((order) => order.id), !filteredOrders.every((order) => selectedOrderIds.includes(order.id)))}
                      className="h-8 rounded-md border border-[#8B102F]/25 px-3 text-[11px] font-bold text-[#8B102F] transition hover:bg-[#f7e9ed]"
                    >
                      {filteredOrders.every((order) => selectedOrderIds.includes(order.id)) ? "إلغاء تحديد الكل" : "تحديد الكل"}
                    </button>
                    {selectedOrderIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => requestDelete("orders", selectedOrderIds, `${selectedOrderIds.length} طلب`)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#8B102F] px-3 text-[11px] font-bold text-white transition hover:bg-[#6f0d26]"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" /> حذف المحدد
                      </button>
                    )}
                  </div>
                </div>
              )}
              <ShopifyOrdersTable
                orders={filteredOrders}
                selectedOrderIds={selectedOrderIds}
                onToggleOrder={toggleOrderSelection}
                onToggleVisibleOrders={toggleVisibleOrderSelection}
                savingOrderId={orderStatusSaving}
                onStatusChange={updateOrderStatus}
              />
            </>
          )}

          {activeTab === "products" && (
            <ShopifyProductsTable
              products={filteredProducts}
              onEdit={(p) => {
                setEditorError(null);
                setProductEditor(p);
              }}
              onFeature={setFeaturedProduct}
              featuredProductSaving={featuredProductSaving}
              onRemove={(product) => requestDelete("product", [product.id], product.name)}
            />
          )}

          {activeTab === "packs" && (
            <ShopifyPacksTable
              packs={filteredPacks}
              onEdit={(pk) => {
                setEditorError(null);
                originalPackSnapshots.current.set(pk.id, getPackContentSnapshot(pk));
                setPackEditor(pk);
              }}
              onColors={setPackColorsEditor}
              onRemove={(pack) => requestDelete("pack", [pack.id], pack.name)}
            />
          )}
        </div>
      </main>

      {/* EDITORS & MODALS */}
      {productEditor && (
        <ProductEditorModal
          value={productEditor}
          error={editorError}
          busy={busy}
          onChange={setProductEditor}
          onSave={() => save("product")}
          onClose={() => {
            setEditorError(null);
            setProductEditor(null);
          }}
        />
      )}

      {packEditor && (
        <PackEditorModal
          value={packEditor}
          error={editorError}
          products={products}
          busy={busy}
          onChange={setPackEditor}
          onToggleActive={(isActive) => {
            if (packEditor.id) {
              void updatePackStatus(packEditor.id, isActive);
            } else {
              setPackEditor({ ...packEditor, is_active: isActive });
            }
          }}
          onSave={() => save("pack")}
          onClose={() => {
            setEditorError(null);
            setPackEditor(null);
          }}
        />
      )}

      {packColorsEditor && (
        <PackColorsEditorModal
          value={packColorsEditor}
          busy={busy}
          onChange={setPackColorsEditor}
          onSave={() => savePackColors(packColorsEditor)}
          onClose={() => setPackColorsEditor(null)}
        />
      )}

      {couponEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div dir="rtl" className="w-full max-w-lg rounded-lg border border-[#e1e3e5] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e1e3e5] pb-3">
              <h3 className="text-sm font-bold text-[#202223]">إنشاء قسيمة خصم جديدة</h3>
              <button type="button" onClick={() => setCouponEditor(null)}>
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#202223]">رمز القسيمة *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponEditor.code}
                    onChange={(e) =>
                      setCouponEditor({ ...couponEditor, code: e.target.value.toUpperCase() })
                    }
                    placeholder="مثال: SALE20"
                    className="h-9 flex-1 rounded-md border border-[#c9cccf] px-3 font-mono text-xs uppercase outline-none focus:border-[#8B102F]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const random = "SAMARA" + Math.floor(1000 + Math.random() * 9000);
                      setCouponEditor({ ...couponEditor, code: random });
                    }}
                    className="rounded-md border border-[#c9cccf] bg-[#f6f6f7] px-3 text-xs font-semibold hover:bg-neutral-200"
                  >
                    توليد عشوائي
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#202223]">نسبة الخصم (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={couponEditor.discount_percent}
                  onChange={(e) =>
                    setCouponEditor({
                      ...couponEditor,
                      discount_percent: Math.min(100, Math.max(1, Number(e.target.value))),
                    })
                  }
                  className="h-9 w-full rounded-md border border-[#c9cccf] px-3 text-xs outline-none focus:border-[#8B102F]"
                />
              </div>

              {/* Scope selector */}
              <div>
                <label className="mb-1.5 block font-bold text-[#202223]">تطبيق الخصم على:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="coupon_scope"
                      checked={couponEditor.applies_to_all}
                      onChange={() => setCouponEditor({ ...couponEditor, applies_to_all: true })}
                      className="accent-[#8B102F]"
                    />
                    <span>جميع المنتجات المؤهلة في المتجر</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="coupon_scope"
                      checked={!couponEditor.applies_to_all}
                      onChange={() => setCouponEditor({ ...couponEditor, applies_to_all: false })}
                      className="accent-[#8B102F]"
                    />
                    <span>منتجات مخصصة فقط</span>
                  </label>
                </div>
              </div>

              {/* Multi-Product Selector if custom */}
              {!couponEditor.applies_to_all && (
                <div className="max-h-44 overflow-y-auto rounded-md border border-[#c9cccf] p-2 space-y-1 bg-[#fafbfb]">
                  <span className="block text-[11px] font-bold text-[#6d7175] mb-1">
                    اختر المنتجات المشمولة:
                  </span>
                  {products.map((prod) => {
                    const selected = couponEditor.applicable_product_ids?.includes(prod.id);
                    return (
                      <label
                        key={prod.id}
                        className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = couponEditor.applicable_product_ids || [];
                            const next = e.target.checked
                              ? [...current, prod.id]
                              : current.filter((id) => id !== prod.id);
                            setCouponEditor({ ...couponEditor, applicable_product_ids: next });
                          }}
                          className="accent-[#8B102F]"
                        />
                        <span className="truncate">{prod.name} ({prod.price} د.م)</span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-[#e1e3e5] pt-3">
                <button
                  type="button"
                  onClick={() => setCouponEditor(null)}
                  className="h-8 rounded-md border border-[#c9cccf] px-3 font-semibold text-[#202223]"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!couponEditor.code.trim()) {
                      toast.error("يرجى إدخال رمز القسيمة");
                      return;
                    }
                    const res = await fetch("/api/admin/coupons", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(couponEditor),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      toast.error(data.error || "فشل حفظ القسيمة");
                      return;
                    }
                    setCoupons((c) => [data.coupon, ...c]);
                    setCouponEditor(null);
                    toast.success("تم إنشاء القسيمة بنجاح");
                  }}
                  className="h-8 rounded-md bg-[#8B102F] px-4 font-bold text-white hover:bg-[#6f0d26]"
                >
                  حفظ القسيمة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteRequest && (
        <DeleteConfirmationDialog
          request={deleteRequest}
          error={deleteError}
          busy={deleting}
          onCancel={() => {
            if (deleting) return;
            setDeleteRequest(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function DeleteConfirmationDialog({
  request,
  error,
  busy,
  onCancel,
  onConfirm,
}: {
  request: DeleteRequest;
  error: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isBulkOrderDelete = request.kind === "orders";
  const subject = isBulkOrderDelete ? `${request.ids.length} طلب` : `«${request.label}»`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]" role="presentation">
      <section
        dir="rtl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f7e9ed] text-[#8B102F]">
            <FiAlertCircle className="h-4 w-4" />
          </span>
          <div>
            <h2 id="delete-confirmation-title" className="text-sm font-black text-neutral-950">تأكيد الحذف</h2>
            <p id="delete-confirmation-description" className="mt-1 text-xs leading-5 text-neutral-600">
              هل تريد حذف {subject}؟ لا يمكن التراجع عن هذا الإجراء.{isBulkOrderDelete ? " سيتم حذف عناصر الطلبات المحددة أيضاً." : ""}
            </p>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-md bg-[#f7e9ed] px-3 py-2 text-xs font-semibold text-[#8B102F]">{error}</p>}
        <div className="mt-5 flex items-center justify-start gap-2 border-t border-neutral-100 pt-4">
          <button type="button" onClick={onCancel} disabled={busy} className="h-9 rounded-md border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 disabled:opacity-50">
            إلغاء
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#8B102F] px-4 text-xs font-bold text-white transition hover:bg-[#6f0d26] disabled:cursor-wait disabled:opacity-60">
            <FiTrash2 className="h-3.5 w-3.5" /> {busy ? "جارٍ الحذف..." : "تأكيد الحذف"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ShopifyMetric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-md border border-[#e1e3e5] bg-white p-3.5 shadow-2xs">
      <p className="text-[11px] font-semibold text-[#6d7175]">{title}</p>
      <p className="mt-1 text-lg font-bold text-[#202223]">{value}</p>
      <p className="mt-0.5 text-[10px] text-[#8c9196]">{note}</p>
    </div>
  );
}

function ShopifyOrdersTable({
  orders,
  selectedOrderIds,
  onToggleOrder,
  onToggleVisibleOrders,
  savingOrderId,
  onStatusChange,
}: {
  orders: AdminOrder[];
  selectedOrderIds: string[];
  onToggleOrder: (orderId: string, selected: boolean) => void;
  onToggleVisibleOrders: (orderIds: string[], selected: boolean) => void;
  savingOrderId: string | null;
  onStatusChange: (orderId: string, status: AdminOrder["status"]) => void;
}) {
  const allVisibleSelected = orders.length > 0 && orders.every((order) => selectedOrderIds.includes(order.id));

  return (
    <div className="overflow-hidden rounded-md border border-[#e1e3e5] bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-right text-xs">
          <thead className="border-b border-[#e1e3e5] bg-[#fafbfb] text-[11px] font-bold text-[#6d7175]">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  aria-label="تحديد جميع الطلبات المعروضة"
                  checked={allVisibleSelected}
                  disabled={orders.length === 0}
                  onChange={(event) => onToggleVisibleOrders(orders.map((order) => order.id), event.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#8B102F] disabled:cursor-not-allowed"
                />
              </th>
              <th className="p-3">رقم / العميل</th>
              <th className="p-3">المدينة</th>
              <th className="p-3">العناصر المشتراة</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3">حالة الطلب</th>
              <th className="p-3">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f2f3]">
            {orders.map((order) => {
              const date = new Date(order.created_at);
              const formattedDate = `${date.toLocaleDateString("ar-MA")} ${date.toLocaleTimeString("ar-MA", {
                hour: "2-digit",
                minute: "2-digit",
              })}`;

              return (
                <tr key={order.id} className={`transition hover:bg-[#fdf8fa] ${selectedOrderIds.includes(order.id) ? "bg-[#fdf8fa]" : ""}`}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`تحديد طلب ${order.customer_name}`}
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={(event) => onToggleOrder(order.id, event.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-[#8B102F]"
                    />
                  </td>
                  <td className="p-3 font-semibold text-[#202223]">
                    <span>{order.customer_name}</span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="block text-[11px] font-normal text-[#8B102F] hover:underline"
                    >
                      {order.customer_phone}
                    </a>
                  </td>

                  <td className="p-3 text-[#4a4d50]">{order.customer_city}</td>

                  <td className="p-3">
                    <div className="max-w-[260px] space-y-0.5 text-[11px] text-[#202223]">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="truncate">
                          <span className="font-bold">{item.quantity}×</span> {item.product_name}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 font-black text-[#202223]">{order.total.toLocaleString("ar-MA")} د.م</td>

                  <td className="p-3">
                    <select
                      aria-label={`حالة طلب ${order.customer_name}`}
                      value={order.status}
                      disabled={savingOrderId !== null}
                      onChange={(event) => onStatusChange(order.id, event.target.value as AdminOrder["status"])}
                      className="h-8 max-w-36 rounded-md border border-[#8B102F]/25 bg-[#fdf8fa] px-2 text-[10px] font-bold text-[#8B102F] outline-none transition focus:border-[#8B102F] focus:ring-2 focus:ring-[#8B102F]/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      <option value="pending">قيد المعالجة</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="shipped">قيد الشحن</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغى</option>
                    </select>
                  </td>

                  <td className="p-3 text-[11px] text-[#6d7175]">{formattedDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="p-12 text-center text-xs text-[#6d7175]">لا توجد طلبات مطابقة للبحث حالياً.</div>
      )}
    </div>
  );
}

function ShopifyProductsTable({
  products,
  onEdit,
  onFeature,
  featuredProductSaving,
  onRemove,
}: {
  products: AdminProduct[];
  onEdit: (product: AdminProduct) => void;
  onFeature: (id: string) => void;
  featuredProductSaving: string | null;
  onRemove: (product: AdminProduct) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#e1e3e5] bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-xs">
          <thead className="border-b border-[#e1e3e5] bg-[#fafbfb] text-[11px] font-bold text-[#6d7175]">
            <tr>
              <th className="p-3">المنتج</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">المخزون</th>
              <th className="p-3">السعر</th>
              <th className="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f2f3]">
            {products.map((p) => (
              <tr key={p.id} className="transition hover:bg-[#f6f6f7]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[#e1e3e5] bg-[#fafbfb]">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <FiImage className="m-auto h-4 w-4 text-[#8c9196]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#202223]">{p.name}</p>
                      <p className="text-[10px] text-[#6d7175]">{p.category || "بدون تصنيف"}</p>
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  {p.is_active ? (
                    <span className="rounded-full bg-[#d7f1eb] px-2 py-0.5 text-[10px] font-bold text-[#00705a]">
                      نشط
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e4e5e7] px-2 py-0.5 text-[10px] font-bold text-[#6d7175]">
                      مسودة
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <span
                    className={`font-semibold ${
                      p.stock <= 0 ? "text-rose-600" : p.stock < 5 ? "text-amber-600" : "text-[#202223]"
                    }`}
                  >
                    {p.stock} متوفرة
                  </span>
                </td>

                <td className="p-3 font-bold text-[#202223]">{p.price.toLocaleString("ar-MA")} د.م</td>

                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onFeature(p.id)}
                      disabled={p.is_featured || featuredProductSaving !== null || !p.is_active}
                      className={`rounded p-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${p.is_featured ? "text-amber-600" : "text-[#6d7175] hover:bg-amber-50 hover:text-amber-600"}`}
                      title={p.is_featured ? "المنتج المميز في الصفحة الرئيسية" : "اختيار كمنتج مميز للصفحة الرئيسية"}
                      aria-label={p.is_featured ? `${p.name} هو المنتج المميز` : `اختيار ${p.name} كمنتج مميز`}
                    >
                      <FiStar className={`h-4 w-4 ${p.is_featured ? "fill-current" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="rounded p-1.5 text-[#6d7175] hover:bg-[#e1e3e5] hover:text-[#202223]"
                      title="تعديل المنتج"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(p)}
                      className="rounded p-1.5 text-[#6d7175] hover:bg-rose-50 hover:text-rose-600"
                      title="حذف"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="p-12 text-center text-xs text-[#6d7175]">لا توجد منتجات مسجلة حتى الآن.</div>
      )}
    </div>
  );
}

function ShopifyPacksTable({
  packs,
  onEdit,
  onColors,
  onRemove,
}: {
  packs: AdminPack[];
  onEdit: (pack: AdminPack) => void;
  onColors: (pack: AdminPack) => void;
  onRemove: (pack: AdminPack) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#e1e3e5] bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-xs">
          <thead className="border-b border-[#e1e3e5] bg-[#fafbfb] text-[11px] font-bold text-[#6d7175]">
            <tr>
              <th className="p-3">الباقة</th>
              <th className="p-3">المحتويات</th>
              <th className="p-3">السعر الإجمالي</th>
              <th className="p-3">الحالة</th>
              <th className="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f2f3]">
            {packs.map((pk) => (
              <tr key={pk.id} className="transition hover:bg-[#f6f6f7]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[#e1e3e5] bg-[#fafbfb]">
                      {pk.image ? (
                        <Image src={pk.image} alt={pk.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <FiPackage className="m-auto h-4 w-4 text-[#8c9196]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#202223]">{pk.name}</p>
                      <p className="text-[10px] text-[#6d7175]">/{pk.slug}</p>
                    </div>
                  </div>
                </td>

                <td className="p-3 text-[#4a4d50]">{pk.pack_items.length} قطع مدمجة</td>

                <td className="p-3 font-bold text-[#202223]">{pk.price.toLocaleString("ar-MA")} د.م</td>

                <td className="p-3">
                  {pk.is_active ? (
                    <span className="rounded-full bg-[#d7f1eb] px-2 py-0.5 text-[10px] font-bold text-[#00705a]">
                      معروضة
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e4e5e7] px-2 py-0.5 text-[10px] font-bold text-[#6d7175]">
                      معطلة
                    </span>
                  )}
                </td>

                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onColors(pk)}
                      className="rounded p-1.5 text-[#6d7175] hover:bg-[#f7e9ed] hover:text-[#8B102F]"
                      title="تنويعات الألوان"
                    >
                      <FiImage className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(pk)}
                      className="rounded p-1.5 text-[#6d7175] hover:bg-[#e1e3e5] hover:text-[#202223]"
                      title="تعديل"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(pk)}
                      className="rounded p-1.5 text-[#6d7175] hover:bg-rose-50 hover:text-rose-600"
                      title="حذف"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {packs.length === 0 && (
        <div className="p-12 text-center text-xs text-[#6d7175]">لا توجد باقات حالياً.</div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PRODUCT EDITOR (URL LINK ONLY + SMART VALIDATION)
// -------------------------------------------------------------
// -------------------------------------------------------------
// PRODUCT EDITOR (IMAGE LINKS WITH COLORS + FIRST AS PRIMARY)
// -------------------------------------------------------------
function ProductEditorModal({
  value,
  error,
  busy,
  onChange,
  onSave,
  onClose,
}: {
  value: AdminProduct;
  error: string | null;
  busy: boolean;
  onChange: (val: AdminProduct) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = (key: keyof AdminProduct, next: string | number | boolean | null) =>
    onChange({ ...value, [key]: next });

  // Update color/image list and keep the first item as value.image
  const handleMediaColorsChange = (
    newColors: AdminProductColor[]
  ) => {
    const primaryImg = newColors.length > 0 && newColors[0].image ? newColors[0].image : value.image;
    onChange({
      ...value,
      colors: newColors,
      image: primaryImg,
    });
  };

  return (
    <PolarisModalShell
      title={value.id ? `تعديل المنتج: ${value.name}` : "إضافة منتج جديد للمتجر"}
      error={error}
      busy={busy}
      onSave={onSave}
      onClose={onClose}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PolarisInput
          label="اسم المنتج *"
          value={value.name}
          onChange={(v) => set("name", v)}
          placeholder="مثال: ناموسية أطفال قابلة للطي"
        />
        <PolarisInput
          label="التصنيف / الفئة"
          value={value.category}
          onChange={(v) => set("category", v)}
          placeholder="مثال: مستلزمات الأطفال"
        />

        <PolarisInput
          label="سعر البيع (د.م) *"
          type="number"
          value={value.price}
          onChange={(v) => set("price", Number(v))}
        />
        <PolarisInput
          label="السعر المقارن قبل الخصم (اختياري)"
          type="number"
          value={value.old_price ?? ""}
          onChange={(v) => set("old_price", v ? Number(v) : null)}
        />

        <PolarisInput
          label="الكمية في المخزون"
          type="number"
          value={value.stock}
          onChange={(v) => set("stock", Number(v))}
        />
        <PolarisInput
          label="شارة المنتج (مثال: الأكثر طلباً، جديد)"
          value={value.badge ?? ""}
          onChange={(v) => set("badge", v || null)}
        />

        {/* UNIFIED IMAGES & COLORS SECTION */}
        <ProductImageMediaManager
          colors={value.colors}
          primaryImage={value.image}
          onChange={handleMediaColorsChange}
          onSetPrimaryDirect={(imgUrl) => set("image", imgUrl)}
        />

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-[#202223]">الوصف</label>
          <textarea
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="تفاصيل ومميزات المنتج..."
            className="w-full rounded-md border border-[#c9cccf] p-2.5 text-xs outline-none focus:border-[#8B102F] focus:ring-1 focus:ring-[#8B102F]"
          />
        </div>

        <div className="sm:col-span-2 rounded-md border border-[#e1e3e5] bg-[#fafbfb] p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#202223]">مميزات المنتج</span>
              <p className="mt-0.5 text-[10px] text-[#6d7175]">أضف كل ميزة كنقطة مستقلة.</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, features: [...value.features, ""] })}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-[#8B102F]/30 bg-white px-2.5 py-1 text-xs font-bold text-[#8B102F] transition hover:bg-[#f7e9ed]"
            >
              <FiPlus className="h-3.5 w-3.5" />
              <span>إضافة نقطة</span>
            </button>
          </div>
          {value.features.length > 0 ? (
            <ul className="space-y-2">
              {value.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B102F]" />
                  <textarea
                    rows={1}
                    value={feature}
                    onChange={(event) => {
                      const input = event.target.value;
                      const separator = /[\r\n;؛|]+/;
                      if (separator.test(input)) {
                        const splitFeatures = input.split(separator).map((item) => item.trim()).filter(Boolean);
                        if (/[\r\n;؛|]\s*$/.test(input)) splitFeatures.push("");
                        onChange({
                          ...value,
                          features: [
                            ...value.features.slice(0, index),
                            ...splitFeatures,
                            ...value.features.slice(index + 1),
                          ],
                        });
                      } else {
                        onChange({
                          ...value,
                          features: value.features.map((item, itemIndex) => itemIndex === index ? input : item),
                        });
                      }
                    }}
                    placeholder={`الميزة ${index + 1}`}
                    aria-label={`الميزة ${index + 1}`}
                    className="min-h-9 min-w-0 flex-1 resize-none rounded border border-[#c9cccf] bg-white px-2.5 py-2 text-xs leading-4 outline-none focus:border-[#8B102F] focus:ring-1 focus:ring-[#8B102F]"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, features: value.features.filter((_, itemIndex) => itemIndex !== index) })}
                    aria-label={`حذف الميزة ${index + 1}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#6d7175] transition hover:bg-red-50 hover:text-red-700"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded border border-dashed border-[#c9cccf] bg-white px-3 py-4 text-center text-[11px] text-[#6d7175]">
              لم تتم إضافة أي مميزات بعد.
            </p>
          )}
        </div>

        <div className="sm:col-span-2 flex items-center justify-between border-t border-[#e1e3e5] pt-3">
          <label className="flex items-center gap-2 text-xs font-bold text-[#202223]">
            <input
              type="checkbox"
              checked={value.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="rounded accent-[#8B102F]"
            />
            <span>نشر المنتج في المتجر وجعله متاحاً للزبائن</span>
          </label>

          {/* NEW: Coupon Eligibility Toggle */}
          <label className="flex items-center gap-2 text-xs font-bold text-[#202223]">
            <input
              type="checkbox"
              checked={value.is_coupon_eligible ?? true}
              onChange={(e) => set("is_coupon_eligible", e.target.checked)}
              className="rounded accent-[#8B102F]"
            />
            <span className="text-[#8B102F]">قبول كوبونات الخصم على هذا المنتج</span>
          </label>
        </div>
      </div>
    </PolarisModalShell>
  );
}

// -------------------------------------------------------------
// PRODUCT IMAGE & COLOR MEDIA MANAGER
// -------------------------------------------------------------
function ProductImageMediaManager({
  colors,
  primaryImage,
  onChange,
  onSetPrimaryDirect,
}: {
  colors: AdminProductColor[];
  primaryImage: string;
  onChange: (items: AdminProductColor[]) => void;
  onSetPrimaryDirect: (imgUrl: string) => void;
}) {
  // If the product has a primary image but no colors array yet, initialize with the primary image
  const mediaList =
    colors.length > 0
      ? colors
      : primaryImage
      ? [{ id: "media-1", name: "اللون الأساسي", hex: "#8B102F", image: primaryImage, galleryImages: [] }]
      : [];

  const handleAddImage = () => {
    const nextIndex = mediaList.length + 1;
    const newItem = {
      id: `color-${Date.now()}-${nextIndex}`,
      name: nextIndex === 1 ? "اللون الأساسي" : `لون ${nextIndex}`,
      hex: "#8B102F",
      image: "",
      galleryImages: [],
    };
    onChange([...mediaList, newItem]);
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    const itemToPromote = mediaList[index];
    const remaining = mediaList.filter((_, i) => i !== index);
    const updated = [itemToPromote, ...remaining];
    onChange(updated);
    if (itemToPromote.image) {
      onSetPrimaryDirect(itemToPromote.image);
    }
  };

  const handleUpdateItem = (
    index: number,
    field: "name" | "hex" | "image",
    val: string
  ) => {
    const updated = mediaList.map((item, i) =>
      i === index ? { ...item, [field]: val } : item
    );
    onChange(updated);
  };

  const handleUpdateGalleryImages = (colorIndex: number, galleryImages: string[]) => {
    onChange(mediaList.map((item, index) => index === colorIndex ? { ...item, galleryImages } : item));
  };

  const handleUpdateGalleryImage = (colorIndex: number, imageIndex: number, image: string) => {
    const galleryImages = [...(mediaList[colorIndex].galleryImages ?? [])];
    galleryImages[imageIndex] = image;
    handleUpdateGalleryImages(colorIndex, galleryImages);
  };

  const handleRemoveItem = (index: number) => {
    const updated = mediaList.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="sm:col-span-2 rounded-md border border-[#e1e3e5] bg-[#fafbfb] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#202223]">
            صور المنتج وتنوعات الألوان
          </span>
          <p className="mt-0.5 text-[10px] text-[#6d7175]">
            الصورة الأولى تعتبر دائماً هي **الصورة الرئيسية** التي تظهر في بطاقة المنتج.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddImage}
          className="inline-flex items-center gap-1 rounded border border-[#8B102F]/30 bg-white px-2.5 py-1 text-xs font-bold text-[#8B102F] transition hover:bg-[#f7e9ed]"
        >
          <FiPlus className="h-3.5 w-3.5" />
          <span>إضافة صورة ولون</span>
        </button>
      </div>

      {mediaList.length === 0 ? (
        <div className="rounded border border-dashed border-[#c9cccf] bg-white p-5 text-center">
          <FiImage className="mx-auto h-7 w-7 text-[#8c9196]" />
          <p className="mt-2 text-xs font-bold text-[#202223]">لم تتم إضافة أي صور بعد</p>
          <p className="mt-1 text-[11px] text-[#6d7175]">
            انقر على زر &quot;إضافة صورة ولون&quot; بالبريد أو الرابط المباشر.
          </p>
          <button
            type="button"
            onClick={handleAddImage}
            className="mt-3 inline-flex items-center gap-1 rounded bg-[#8B102F] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#6f0d26]"
          >
            <FiPlus className="h-3.5 w-3.5" />
            <span>إضافة الصورة الأولى</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {mediaList.map((item, index) => {
            const isPrimary = index === 0;

            return (
              <div
                key={item.id || index}
                className={`rounded-md border p-2.5 transition ${
                  isPrimary
                    ? "border-[#8B102F] bg-white shadow-2xs ring-1 ring-[#8B102F]/20"
                    : "border-[#e1e3e5] bg-white"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Primary Tag & Thumbnail Preview */}
                <div className="flex items-center gap-2">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#e1e3e5] bg-[#fafbfb]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name || "معاينة"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <FiImage className="h-4 w-4 text-[#8c9196]" />
                    )}
                  </div>

                  {isPrimary ? (
                    <span className="shrink-0 rounded bg-[#d7f1eb] px-1.5 py-0.5 text-[9px] font-black text-[#00705a]">
                      الصورة الرئيسية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(index)}
                      className="shrink-0 rounded border border-[#c9cccf] bg-[#f6f6f7] px-1.5 py-0.5 text-[9px] font-bold text-[#4a4d50] hover:border-[#202223] hover:text-[#202223]"
                    >
                      تعيين كرئيسية
                    </button>
                  )}
                </div>

                {/* Color Hex Picker */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={item.hex || "#8B102F"}
                    onChange={(e) => handleUpdateItem(index, "hex", e.target.value)}
                    title="اختر درجة اللون"
                    className="h-8 w-8 cursor-pointer rounded border border-[#c9cccf] p-0.5"
                  />
                  <input
                    type="text"
                    value={item.name}
                    placeholder="اسم اللون (أزرق، أسود...)"
                    onChange={(e) => handleUpdateItem(index, "name", e.target.value)}
                    className="h-8 w-28 rounded border border-[#c9cccf] px-2 text-xs outline-none focus:border-[#8B102F]"
                  />
                </div>

                {/* Image URL Link Input */}
                <div className="flex-1">
                  <input
                    type="url"
                    value={item.image}
                    placeholder="رابط الصورة (https://...)"
                    onChange={(e) => handleUpdateItem(index, "image", e.target.value)}
                    className="h-8 w-full rounded border border-[#c9cccf] px-2.5 text-xs outline-none focus:border-[#8B102F]"
                  />
                </div>

                {/* Delete Variant Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  title="حذف هذا اللون والصورة"
                  className="self-end rounded p-1 text-[#8c9196] hover:bg-rose-50 hover:text-rose-600 sm:self-auto"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
                </div>

                <div className="mt-2 border-t border-neutral-100 pt-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#6d7175]">صور إضافية لهذا اللون</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateGalleryImages(index, [...(item.galleryImages ?? []), ""])}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B102F] hover:underline"
                    >
                      <FiPlus className="h-3 w-3" />
                      إضافة صورة
                    </button>
                  </div>
                  {(item.galleryImages ?? []).map((galleryImage, galleryIndex) => (
                    <div key={galleryIndex} className="mb-1.5 flex items-center gap-2 last:mb-0">
                      <input
                        type="url"
                        value={galleryImage}
                        placeholder={`رابط الصورة الإضافية ${galleryIndex + 1}`}
                        onChange={(event) => handleUpdateGalleryImage(index, galleryIndex, event.target.value)}
                        className="h-8 min-w-0 flex-1 rounded border border-[#c9cccf] px-2.5 text-xs outline-none focus:border-[#8B102F]"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateGalleryImages(index, (item.galleryImages ?? []).filter((_, imageIndex) => imageIndex !== galleryIndex))}
                        aria-label={`حذف الصورة الإضافية ${galleryIndex + 1}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#8c9196] hover:bg-rose-50 hover:text-rose-600"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PACK EDITOR (URL LINK ONLY + SMART VALIDATION)
// -------------------------------------------------------------
function PackEditorModal({
  value,
  error,
  products,
  busy,
  onChange,
  onToggleActive,
  onSave,
  onClose,
}: {
  value: AdminPack;
  error: string | null;
  products: AdminProduct[];
  busy: boolean;
  onChange: (val: AdminPack) => void;
  onToggleActive: (isActive: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = (key: keyof AdminPack, next: string | number | boolean | null) =>
    onChange({ ...value, [key]: next });
  const [uploadingImage, setUploadingImage] = useState(false);

  async function uploadPackImage(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "تعذر رفع صورة الباقة");
      set("image", result.url);
      toast.success("تم رفع صورة الباقة");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "تعذر رفع صورة الباقة");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <PolarisModalShell
      title={value.id ? `تعديل الباقة: ${value.name}` : "إنشاء باقة ترويجية جديدة"}
      error={error}
      busy={busy || uploadingImage}
      onSave={onSave}
      onClose={onClose}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PolarisInput
          label="اسم الباقة *"
          value={value.name}
          onChange={(v) => set("name", v)}
          placeholder="مثال: باقة الراحة"
        />
        <PolarisInput
          label="المعرّف الرابط (Slug) *"
          value={value.slug}
          onChange={(v) => set("slug", v)}
          placeholder="مثال: comfort-pack"
        />

        <PolarisInput
          label="سعر الباقة (د.م) *"
          type="number"
          value={value.price}
          onChange={(v) => set("price", Number(v))}
        />
        <PolarisInput
          label="السعر الأصلي للمقارنة (اختياري)"
          type="number"
          value={value.original_price ?? ""}
          onChange={(v) => set("original_price", v ? Number(v) : null)}
        />

        {/* One cover image for the entire pack */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-[#202223]">
            صورة الباقة (صورة واحدة)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="url"
              value={value.image ?? ""}
              onChange={(e) => set("image", e.target.value || null)}
              placeholder="https://example.com/pack-cover.jpg"
              aria-label="رابط صورة الباقة"
              className="h-9 min-w-48 flex-1 rounded-md border border-[#c9cccf] bg-white px-3 text-xs outline-none focus:border-[#8B102F] focus:ring-1 focus:ring-[#8B102F]"
            />
            <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-[#c9cccf] bg-white px-3 text-xs font-bold text-[#202223] hover:bg-[#f6f6f7]">
              {uploadingImage ? "جارٍ الرفع..." : "رفع صورة"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingImage || busy}
                onChange={(event) => {
                  void uploadPackImage(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
                className="sr-only"
              />
            </label>
            {value.image && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-[#e1e3e5] bg-neutral-100">
                <Image src={value.image} alt="معاينة صورة الباقة" fill sizes="56px" className="object-cover" />
              </div>
            )}
          </div>
          <p className="mt-1 text-[10px] text-[#6d7175]">JPG أو PNG أو WEBP، بحد أقصى 5MB.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-[#202223]">وصف الباقة</label>
          <textarea
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-[#c9cccf] p-2.5 text-xs outline-none focus:border-[#8B102F]"
          />
        </div>

        {/* Included Items Selector */}
        <div className="sm:col-span-2 rounded-md border border-[#e1e3e5] bg-[#fafbfb] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#202223]">المنتجات المدمجة في هذه الباقة *</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  pack_items: [...value.pack_items, { product_id: products[0]?.id ?? "", quantity: 1, product_url: null }],
                })
              }
              className="text-xs font-bold text-[#8B102F] hover:underline"
            >
              + إضافة عنصر
            </button>
          </div>

          <div className="space-y-2">
            {value.pack_items.map((it, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_auto]">
                <select
                  value={it.product_id}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      pack_items: value.pack_items.map((p, i) =>
                        i === idx ? { ...p, product_id: e.target.value } : p
                      ),
                    })
                  }
                  className="h-9 min-w-0 rounded-md border border-[#c9cccf] bg-white px-2.5 text-xs"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.price} د.م)
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      pack_items: value.pack_items.map((p, i) =>
                        i === idx ? { ...p, quantity: Math.max(1, Number(e.target.value)) } : p
                      ),
                    })
                  }
                  className="h-9 w-full rounded-md border border-[#c9cccf] bg-white text-center text-xs"
                />

                <input
                  type="text"
                  value={it.product_url ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      pack_items: value.pack_items.map((p, i) =>
                        i === idx ? { ...p, product_url: e.target.value || null } : p
                      ),
                    })
                  }
                  placeholder="رابط المنتج (اختياري)"
                  aria-label={`رابط المنتج ${idx + 1} (اختياري)`}
                  className="h-9 min-w-0 rounded-md border border-[#c9cccf] bg-white px-2.5 text-xs"
                />

                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      pack_items: value.pack_items.filter((_, i) => i !== idx),
                    })
                  }
                  className="p-1 text-[#8c9196] hover:text-rose-600"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-xs font-bold text-[#202223]">
            <input
              type="checkbox"
              checked={value.is_active}
              disabled={busy}
              onChange={(e) => onToggleActive(e.target.checked)}
              className="rounded accent-[#8B102F]"
            />
            <span>تفعيل الباقة وعرضها في المتجر</span>
          </label>
        </div>
      </div>
    </PolarisModalShell>
  );
}

// -------------------------------------------------------------
// PACK COLORS EDITOR MODAL
// -------------------------------------------------------------
function PackColorsEditorModal({
  value,
  busy,
  onChange,
  onSave,
  onClose,
}: {
  value: AdminPack;
  busy: boolean;
  onChange: (val: AdminPack) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <PolarisModalShell
      title={`تنويعات الألوان للباقة: ${value.name}`}
      busy={busy}
      onSave={onSave}
      onClose={onClose}
    >
      <VariationUrlEditor
        colors={value.colors}
        onChange={(colors) => onChange({ ...value, colors })}
      />
    </PolarisModalShell>
  );
}

// -------------------------------------------------------------
// VARIATION URL EDITOR (URL INPUT ONLY)
// -------------------------------------------------------------
function VariationUrlEditor({
  colors,
  onChange,
}: {
  colors: Array<{ id: string; name: string; hex: string; image: string }>;
  onChange: (val: Array<{ id: string; name: string; hex: string; image: string }>) => void;
}) {
  return (
    <div className="sm:col-span-2 rounded-md border border-[#e1e3e5] bg-[#fafbfb] p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-[#202223]">تنوعات الألوان وروابط الصور</span>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...colors,
              { id: `color-${colors.length + 1}`, name: "", hex: "#8B102F", image: "" },
            ])
          }
          className="text-xs font-bold text-[#8B102F] hover:underline"
        >
          + إضافة لون
        </button>
      </div>

      {colors.length === 0 ? (
        <p className="py-2 text-center text-[11px] text-[#8c9196]">لا توجد تنويعات ألوان مخصصة.</p>
      ) : (
        <div className="space-y-2">
          {colors.map((c, i) => (
            <div
              key={c.id || i}
              className="grid items-center gap-2 rounded-md border border-[#e1e3e5] bg-white p-2 sm:grid-cols-[1fr_60px_1.5fr_36px_auto]"
            >
              <input
                value={c.name}
                placeholder="اسم اللون (مثال: أزرق)"
                onChange={(e) =>
                  onChange(colors.map((item, idx) => (idx === i ? { ...item, name: e.target.value } : item)))
                }
                className="h-8 rounded border border-[#c9cccf] px-2 text-xs"
              />

              <input
                type="color"
                value={c.hex}
                onChange={(e) =>
                  onChange(colors.map((item, idx) => (idx === i ? { ...item, hex: e.target.value } : item)))
                }
                className="h-8 w-full cursor-pointer rounded border border-[#c9cccf] p-0.5"
              />

              <input
                type="url"
                value={c.image}
                placeholder="رابط صورة اللون (https://...)"
                onChange={(e) =>
                  onChange(colors.map((item, idx) => (idx === i ? { ...item, image: e.target.value } : item)))
                }
                className="h-8 rounded border border-[#c9cccf] px-2 text-xs"
              />

              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-[#e1e3e5] bg-neutral-50">
                {c.image ? (
                  <Image src={c.image} alt={c.name} width={32} height={32} className="object-cover" />
                ) : (
                  <FiImage className="h-3.5 w-3.5 text-[#8c9196]" />
                )}
              </div>

              <button
                type="button"
                onClick={() => onChange(colors.filter((_, idx) => idx !== i))}
                className="p-1 text-[#8c9196] hover:text-rose-600"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// REUSABLE POLARIS HELPERS
// -------------------------------------------------------------
function PolarisModalShell({
  title,
  error,
  busy,
  onSave,
  onClose,
  children,
}: {
  title: string;
  error?: string | null;
  busy: boolean;
  onSave: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div
        dir="rtl"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-[#e1e3e5] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-3.5">
          <h3 className="text-sm font-bold text-[#202223]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#6d7175] hover:bg-[#f1f2f3]">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-semibold text-rose-700">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e1e3e5] bg-[#fafbfb] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-[#c9cccf] bg-white px-4 text-xs font-bold text-[#202223] hover:bg-[#f6f6f7]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="flex h-8 items-center gap-1.5 rounded-md bg-[#8B102F] px-4 text-xs font-bold text-white transition hover:bg-[#6f0d26] disabled:opacity-50"
          >
            <FiSave className="h-3.5 w-3.5" />
            <span>{busy ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PolarisInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-[#202223]">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-[#c9cccf] bg-white px-3 text-xs outline-none focus:border-[#8B102F] focus:ring-1 focus:ring-[#8B102F]"
      />
    </div>
  );
}