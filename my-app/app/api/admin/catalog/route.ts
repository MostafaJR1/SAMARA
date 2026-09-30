import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";

const colorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  image: z.string().url(),
  galleryImages: z.array(z.string().url()).optional(),
});

const productSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  image: z.string().url(),
  price: z.number().int().nonnegative(),
  oldPrice: z.number().int().nonnegative().nullable().optional(),
  discount: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  isFeatured: z.boolean().default(false),
  isCouponEligible: z.boolean().default(true),
  badge: z.string().trim().max(80).nullable().optional(),
  description: z.string().trim().max(2000),
  colors: z.array(colorSchema),
  features: z.array(z.string().trim().min(1).max(160)),
  stock: z.number().int().nonnegative(),
  shipping: z.string().trim().max(100),
});

const packSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(120).regex(/^[\p{L}\p{N}][\p{L}\p{N}-]*$/u),
  description: z.string().trim().max(2000),
  image: z.string().url().nullable(),
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative().nullable(),
  isActive: z.boolean(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    productUrl: z.string().trim().nullable().optional().refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return value.startsWith("/") && !value.startsWith("//");
      }
    }),
  })).min(1),
  colors: z.array(colorSchema).default([]),
});

function normalizePackPayload(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const data = value as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "باقة";
  const rawSlug = typeof data.slug === "string" ? data.slug.trim() : "";
  const slug = (rawSlug || name)
    .toLocaleLowerCase("ar")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || `pack-${Date.now()}`;
  const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data.pack_items) ? data.pack_items : [];
  const items = rawItems.map((item) => {
    if (!item || typeof item !== "object") return item;
    const entry = item as Record<string, unknown>;
    const rawProductUrl = entry.productUrl ?? entry.product_url;
    return {
      productId: entry.productId ?? entry.product_id,
      quantity: entry.quantity,
      productUrl: typeof rawProductUrl === "string" && rawProductUrl.trim() ? rawProductUrl.trim() : null,
    };
  });
  return { ...data, name, slug, items, colors: normalizeColors(data.colors) };
}

function normalizeColors(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((color) => {
    if (!color || typeof color !== "object") return [];
    const entry = color as Record<string, unknown>;
    const image = typeof entry.image === "string" ? entry.image.trim() : "";
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name || !/^https?:\/\//i.test(image)) return [];
    return [{
      id: typeof entry.id === "string" && entry.id ? entry.id : `color-${randomUUID()}`,
      name,
      hex: typeof entry.hex === "string" ? entry.hex : "#8B102F",
      image,
      galleryImages: Array.isArray(entry.galleryImages)
        ? entry.galleryImages.flatMap((galleryImage) => {
            if (typeof galleryImage !== "string") return [];
            const normalizedImage = galleryImage.trim();
            return /^https?:\/\//i.test(normalizedImage) ? [normalizedImage] : [];
          })
        : [],
    }];
  });
}

async function requireAdminApi() {
  const context = await getAuthContext();
  if (!context.user) return { response: NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 }) };
  if (context.role !== "admin") return { response: NextResponse.json({ error: "ليس لديك صلاحية الإدارة" }, { status: 403 }) };
  return { supabase: context.supabase };
}

function getCatalogErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const databaseError = error as {
      code?: unknown;
      constraint?: unknown;
      details?: unknown;
      message?: unknown;
    };
    const errorText = [databaseError.constraint, databaseError.details, databaseError.message]
      .filter((value): value is string => typeof value === "string")
      .join(" ");

    if (databaseError.code === "23503" && errorText.includes("pack_items_product_id_fkey")) {
      return "لا يمكن حذف هذا المنتج لأنه مستخدم في باقة أو أكثر. أزل المنتج من الباقات المرتبطة أولاً، ثم أعد المحاولة.";
    }
    if (databaseError.code === "23514" && errorText.includes("order_items_reference_check")) {
      return "تعذر حذف الباقة بسبب ارتباطها بطلب سابق. حدّث قاعدة البيانات لحفظ تفاصيل الطلب بعد حذف الباقة، ثم أعد المحاولة.";
    }
    if (databaseError.code === "23503" && errorText.includes("order_items_pack_id_fkey")) {
      return "لا يمكن حذف الباقة بسبب ارتباطها بطلب سابق. أعد تشغيل تحديث قاعدة البيانات ثم حاول مرة أخرى.";
    }
    if (typeof databaseError.message === "string" && databaseError.message.includes("permission denied for table packs")) {
      return "لا توجد صلاحية لتعديل الباقات أو حذفها في قاعدة البيانات. شغّل تحديث صلاحيات الباقات في Supabase ثم أعد المحاولة.";
    }
    if (typeof databaseError.message === "string" && databaseError.message.includes("permission denied for table products")) {
      return "لا توجد صلاحية لحذف المنتجات في قاعدة البيانات. شغّل تحديث صلاحيات الكتالوج في Supabase ثم أعد المحاولة.";
    }
    if (typeof databaseError.message === "string" && databaseError.message.trim()) {
      return databaseError.message;
    }
  }

  if (error instanceof z.ZodError) return "بيانات المنتج أو الباقة غير مكتملة";
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json() as { kind?: string; data?: unknown };
    if (body.kind === "product") {
      const product = productSchema.parse({ ...(body.data as object), colors: normalizeColors((body.data as { colors?: unknown })?.colors) });
      if (product.isFeatured) {
        const { error: clearError } = await auth.supabase
          .from("products")
          .update({ is_featured: false })
          .eq("is_featured", true);
        if (clearError) throw clearError;
      }
      const { data, error } = await auth.supabase.from("products").insert({
        id: product.id ?? `product-${randomUUID()}`,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.price,
        old_price: product.oldPrice ?? null,
        discount: product.discount,
        rating: product.rating,
        is_featured: product.isFeatured,
        is_coupon_eligible: product.isCouponEligible,
        badge: product.badge ?? null,
        description: product.description,
        colors: product.colors,
        features: product.features,
        stock: product.stock,
        shipping: product.shipping,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    if (body.kind === "pack") {
      const pack = packSchema.parse(normalizePackPayload(body.data));
      const packId = pack.id ?? `pack-${randomUUID()}`;
      const { error: packError } = await auth.supabase.from("packs").insert({ id: packId, name: pack.name, slug: pack.slug, description: pack.description, image: pack.image, price: pack.price, original_price: pack.originalPrice, is_active: pack.isActive, colors: pack.colors });
      if (packError) throw packError;
      const { error: itemError } = await auth.supabase.from("pack_items").insert(pack.items.map((item) => ({ pack_id: packId, product_id: item.productId, quantity: item.quantity, ...(item.productUrl ? { product_url: item.productUrl } : {}) })));
      if (itemError) {
        await auth.supabase.from("packs").delete().eq("id", packId);
        throw itemError;
      }
      return NextResponse.json({ id: packId }, { status: 201 });
    }

    return NextResponse.json({ error: "نوع البيانات غير صالح" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getCatalogErrorMessage(error, "تعذر حفظ البيانات") }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json() as { kind?: string; id?: string; data?: unknown };
    if (!body.id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });

    if (body.kind === "packStatus") {
      const { isActive } = z.object({ isActive: z.boolean() }).parse(body.data);
      const { data, error } = await auth.supabase
        .from("packs")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", body.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    if (body.kind === "featuredProduct") {
      const { data: product, error: productError } = await auth.supabase
        .from("products")
        .select("id, is_active")
        .eq("id", body.id)
        .single();
      if (productError || !product) throw productError ?? new Error("المنتج غير موجود");
      if (!product.is_active) return NextResponse.json({ error: "لا يمكن تمييز منتج غير نشط" }, { status: 400 });

      const { error: clearError } = await auth.supabase
        .from("products")
        .update({ is_featured: false })
        .eq("is_featured", true);
      if (clearError) throw clearError;

      const { error: featureError } = await auth.supabase
        .from("products")
        .update({ is_featured: true })
        .eq("id", body.id);
      if (featureError) throw featureError;
      return NextResponse.json({ ok: true });
    }

    if (body.kind === "product") {
      const product = productSchema.parse({ ...(body.data as object), id: body.id, colors: normalizeColors((body.data as { colors?: unknown })?.colors) });
      if (product.isFeatured) {
        const { error: clearError } = await auth.supabase
          .from("products")
          .update({ is_featured: false })
          .eq("is_featured", true)
          .neq("id", body.id);
        if (clearError) throw clearError;
      }
      const { error } = await auth.supabase.from("products").update({ name: product.name, category: product.category, image: product.image, price: product.price, old_price: product.oldPrice ?? null, discount: product.discount, rating: product.rating, is_featured: product.isFeatured, is_coupon_eligible: product.isCouponEligible, badge: product.badge ?? null, description: product.description, colors: product.colors, features: product.features, stock: product.stock, shipping: product.shipping, updated_at: new Date().toISOString() }).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.kind === "pack") {
      const pack = packSchema.parse({ ...(normalizePackPayload(body.data) as object), id: body.id });
      const { data: existingItems, error: existingItemsError } = await auth.supabase
        .from("pack_items")
        .select("product_id, quantity, product_url")
        .eq("pack_id", body.id);
      if (existingItemsError) throw existingItemsError;

      const storedItems = (existingItems ?? [])
        .map((item) => ({ productId: item.product_id, quantity: item.quantity, productUrl: item.product_url ?? null }))
        .sort((first, second) => first.productId.localeCompare(second.productId));
      const submittedItems = pack.items
        .map((item) => ({ productId: item.productId, quantity: item.quantity, productUrl: item.productUrl ?? null }))
        .sort((first, second) => first.productId.localeCompare(second.productId));
      const packItemsChanged = storedItems.length !== submittedItems.length ||
        storedItems.some((item, index) => {
          const submittedItem = submittedItems[index];
          return item.productId !== submittedItem.productId ||
            item.quantity !== submittedItem.quantity ||
            item.productUrl !== submittedItem.productUrl;
        });

      const { error: packError } = await auth.supabase.from("packs").update({ name: pack.name, slug: pack.slug, description: pack.description, image: pack.image, price: pack.price, original_price: pack.originalPrice, is_active: pack.isActive, colors: pack.colors, updated_at: new Date().toISOString() }).eq("id", body.id);
      if (packError) throw packError;
      if (packItemsChanged) {
        const { error: deleteError } = await auth.supabase.from("pack_items").delete().eq("pack_id", body.id);
        if (deleteError) throw deleteError;
        const { error: itemError } = await auth.supabase.from("pack_items").insert(pack.items.map((item) => ({ pack_id: body.id, product_id: item.productId, quantity: item.quantity, ...(item.productUrl ? { product_url: item.productUrl } : {}) })));
        if (itemError) throw itemError;
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "نوع البيانات غير صالح" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getCatalogErrorMessage(error, "تعذر تحديث البيانات") }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;
  const body = await request.json() as { kind?: string; id?: string };
  if (!body.id || (body.kind !== "product" && body.kind !== "pack")) return NextResponse.json({ error: "بيانات الحذف غير صالحة" }, { status: 400 });

  if (body.kind === "pack") {
    const { data: orderItems, error: orderItemsError } = await auth.supabase
      .from("order_items")
      .select("id")
      .eq("pack_id", body.id)
      .limit(1);

    if (orderItemsError) {
      return NextResponse.json({ error: "تعذر التحقق من الطلبات المرتبطة بالباقة. لم يتم حذفها." }, { status: 500 });
    }
    if (orderItems?.length) {
      return NextResponse.json({
        error: "لا يمكن حذف هذه الباقة لأنها مرتبطة بطلب سابق. عطّل الباقة بدلاً من حذفها للحفاظ على سجل الطلبات.",
      }, { status: 409 });
    }
  }

  const table = body.kind === "product" ? "products" : "packs";
  const { error } = await auth.supabase.from(table).delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: getCatalogErrorMessage(error, "تعذر الحذف") }, { status: 409 });
  return NextResponse.json({ ok: true });
}
