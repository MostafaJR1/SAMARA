import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "shipped", "completed", "cancelled"]),
});

const deleteOrdersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function GET() {
  const context = await getAuthContext();

  if (!context.user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  if (context.role !== "admin") return NextResponse.json({ error: "ليس لديك صلاحية الإدارة" }, { status: 403 });

  const { data, error } = await context.supabase
    .from("orders")
    .select("id, customer_name, customer_phone, customer_city, coupon_code, subtotal, discount, shipping, total, status, created_at, order_items(id, product_id, product_name, quantity, unit_price, line_total)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "تعذر تحميل الطلبات" }, { status: 500 });

  return NextResponse.json({ orders: data ?? [] }, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

export async function PATCH(request: Request) {
  const context = await getAuthContext();

  if (!context.user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  if (context.role !== "admin") return NextResponse.json({ error: "ليس لديك صلاحية الإدارة" }, { status: 403 });

  const parsed = updateStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات تحديث الحالة غير صالحة" }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: `تعذر تحديث حالة الطلب: ${error.message}` }, { status: 500 });
  return NextResponse.json({ order: data });
}

export async function DELETE(request: Request) {
  const context = await getAuthContext();

  if (!context.user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  if (context.role !== "admin") return NextResponse.json({ error: "ليس لديك صلاحية الإدارة" }, { status: 403 });

  const parsed = deleteOrdersSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "حدد طلباً واحداً على الأقل للحذف (بحد أقصى 100 طلب)" }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("orders")
    .delete()
    .in("id", parsed.data.ids)
    .select("id");

  if (error) return NextResponse.json({ error: `تعذر حذف الطلبات: ${error.message}` }, { status: 500 });
  return NextResponse.json({ deletedIds: (data ?? []).map((order) => order.id) });
}
