import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "يرجى إدخال رمز القسيمة" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = getSupabaseAdminClient();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, code, discount_percent, is_active, applies_to_all, applicable_product_ids")
      .ilike("code", cleanCode)
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: "رمز القسيمة غير صالح أو منتهي الصلاحية" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discount_percent,
      appliesToAll: coupon.applies_to_all,
      applicableProductIds: (coupon.applicable_product_ids as string[]) || [],
    });
  } catch {
    return NextResponse.json({ error: "تعذر التحقق من القسيمة" }, { status: 500 });
  }
}