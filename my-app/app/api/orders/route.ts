import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { createOrderSchema, type CreateOrderInput } from "@/lib/orders";
import { ProductsData } from "@/data/Products";
import { PacksData } from "@/data/Packs";

type DbProduct = {
  id: string | number;
  name: string;
  price: number;
  stock?: number | null;
  is_active?: boolean;
  is_coupon_eligible?: boolean;
};

type DbPack = {
  id: string | number;
  name: string;
  price: number;
  is_active?: boolean;
  pack_items?: Array<{ product_id: string | number; quantity: number }>;
};

type DbCoupon = {
  code: string;
  discount_percent: number;
  is_active: boolean;
  applies_to_all: boolean;
  applicable_product_ids: string[];
};

async function buildAuthoritativeOrder(
  input: CreateOrderInput,
  supabase: ReturnType<typeof getSupabaseAdminClient>
) {
  const productIds = input.items
    .filter((item): item is Extract<typeof item, { type: "product" }> => item.type === "product")
    .map((item) => String(item.productId));

  const packIds = input.items
    .filter((item): item is Extract<typeof item, { type: "pack" }> => item.type === "pack")
    .map((item) => String(item.packId));

  // 1. Fetch live product and pack records from Supabase
  const [dbProductsRes, dbPacksRes] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, name, price, stock, is_active, is_coupon_eligible")
          .in("id", productIds)
      : Promise.resolve({ data: [] }),
    packIds.length > 0
      ? supabase
          .from("packs")
          .select("id, name, price, is_active, pack_items(product_id, quantity)")
          .in("id", packIds)
      : Promise.resolve({ data: [] }),
  ]);

  const dbProducts = (dbProductsRes.data ?? []) as DbProduct[];
  const dbPacks = (dbPacksRes.data ?? []) as DbPack[];

  // 2. Resolve authoritative items (DB first, then static mock fallback)
  const items = input.items.map((item) => {
    if (item.type === "product") {
      const dbProduct = dbProducts.find((p) => String(p.id) === String(item.productId));
      const staticProduct = ProductsData.find((p) => String(p.id) === String(item.productId));
      const product = dbProduct || staticProduct;

      if (!product) {
        if ("productName" in item && "unitPrice" in item && item.unitPrice > 0) {
          return {
            type: "product" as const,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          };
        }
        throw new Error(`PRODUCT_UNAVAILABLE: ${item.productId}`);
      }

      return {
        type: "product" as const,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    }

    // Pack resolution
    const dbPack = dbPacks.find((p) => String(p.id) === String(item.packId));
    if (dbPack && dbPack.is_active === false) {
      throw new Error(`PACK_UNAVAILABLE: ${item.packId}`);
    }
    const staticPack = PacksData.find((p) => String(p.id) === String(item.packId));
    const pack = dbPack || staticPack;

    const packName = pack?.name ?? ("packName" in item ? item.packName : "باقة خاصة");
    const unitPrice = pack?.price ?? ("unitPrice" in item ? item.unitPrice : 0);

    const contents =
      pack && "pack_items" in pack && Array.isArray(pack.pack_items)
        ? pack.pack_items.map((pi) => ({ productId: pi.product_id, quantity: pi.quantity }))
        : pack && "items" in pack && Array.isArray(pack.items)
        ? pack.items.map((pi) => ({ productId: pi.product.id, quantity: pi.quantity }))
        : "contents" in item && Array.isArray(item.contents)
        ? item.contents
        : [];

    return {
      type: "pack" as const,
      packId: item.packId,
      packName,
      quantity: item.quantity,
      unitPrice,
      contents,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // 3. Authoritative Coupon Verification
  let discount = 0;
  const couponCode = input.coupon?.trim().toUpperCase() || null;

  if (couponCode) {
    const { data: dbCoupon } = await supabase
      .from("coupons")
      .select("code, discount_percent, is_active, applies_to_all, applicable_product_ids")
      .ilike("code", couponCode)
      .eq("is_active", true)
      .single();

    if (dbCoupon) {
      const coupon = dbCoupon as DbCoupon;

      // Calculate discount solely on coupon-eligible products
      const eligibleAmount = items.reduce((sum, item) => {
        if (item.type === "product") {
          const prod = dbProducts.find((p) => String(p.id) === String(item.productId));
          const isEligible = prod?.is_coupon_eligible ?? true;
          const isTargeted =
            coupon.applies_to_all ||
            (coupon.applicable_product_ids || []).map(String).includes(String(item.productId));

          if (isEligible && isTargeted) {
            return sum + item.unitPrice * item.quantity;
          }
        }
        return sum;
      }, 0);

      discount = Math.round((eligibleAmount * coupon.discount_percent) / 100);
    }
  }

  const shipping = 0;
  const total = Math.max(0, subtotal - discount + shipping);

  return {
    ...input,
    items,
    coupon: couponCode,
    subtotal,
    discount,
    shipping,
    total,
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات الطلب غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const authoritativeOrder = await buildAuthoritativeOrder(parsed.data, supabase);

    // 1. Direct Table Insertion (Bypasses potential RPC issues)
    const { data: newOrder, error: insertOrderError } = await supabase
      .from("orders")
      .insert({
        customer_name: authoritativeOrder.customer.name,
        customer_phone: authoritativeOrder.customer.phone,
        customer_city: authoritativeOrder.customer.city,
        coupon_code: authoritativeOrder.coupon,
        subtotal: authoritativeOrder.subtotal,
        discount: authoritativeOrder.discount,
        shipping: authoritativeOrder.shipping,
        total: authoritativeOrder.total,
        status: "pending",
      })
      .select("id")
      .single();

    if (!insertOrderError && newOrder?.id) {
      const orderItemsPayload = authoritativeOrder.items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.type === "product" ? item.productId : null,
        product_name: item.type === "product" ? item.productName : item.packName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
      if (itemsError) {
        console.warn("Notice: order_items insert warning:", itemsError.message);
      }

      return NextResponse.json({ orderId: newOrder.id }, { status: 201 });
    }

    // 2. Fallback to RPC procedure if direct insert encounters an error
    console.warn("Direct insert failed, attempting RPC create_order:", insertOrderError?.message);
    const { data: rpcOrderId, error: rpcError } = await supabase.rpc("create_order", {
      p_order: authoritativeOrder,
    });

    if (!rpcError && rpcOrderId) {
      return NextResponse.json({ orderId: rpcOrderId }, { status: 201 });
    }

    console.error("Order Insertion Error:", { insertOrderError, rpcError });
    return NextResponse.json(
      { error: "تعذر حفظ الطلب في قاعدة البيانات", details: insertOrderError?.message },
      { status: 500 }
    );
  } catch (error) {
    console.error("Order API Error:", error);

    if (error instanceof Error && error.message.includes("UNAVAILABLE")) {
      return NextResponse.json(
        { error: "أحد المنتجات أو الباقات لم يعد متاحاً", details: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب", details: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}