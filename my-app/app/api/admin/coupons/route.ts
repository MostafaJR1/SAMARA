import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanCode = String(body.code || "").trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ error: "رمز القسيمة مطلوب" }, { status: 400 });
    }

    const percent = Number(body.discount_percent);
    if (!percent || percent <= 0 || percent > 100) {
      return NextResponse.json({ error: "النسبة المئوية يجب أن تكون بين 1 و 100" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: cleanCode,
        discount_percent: percent,
        is_active: body.is_active ?? true,
        applies_to_all: body.applies_to_all ?? true,
        applicable_product_ids: body.applicable_product_ids ?? [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ coupon: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء القسيمة" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const context = await getAuthContext();
  if (!context.user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  if (context.role !== "admin") return NextResponse.json({ error: "ليس لديك صلاحية الإدارة" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف القسيمة مطلوب" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}