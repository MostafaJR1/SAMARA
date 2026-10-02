import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);

export async function POST(request: Request) {
  const context = await getAuthContext();
  if (!context.user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  if (context.role !== "admin") return NextResponse.json({ error: "ليس لديك صلاحية الإدارة" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  const isImage = file instanceof File && file.type.startsWith("image/");
  const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxSize) {
    return NextResponse.json({ error: "اختر صورة JPG أو PNG أو WEBP أقل من 5MB، أو فيديو MP4 أو WEBM أقل من 50MB" }, { status: 400 });
  }

  const extension = file.type.split("/")[1];
  const path = `catalog/${randomUUID()}.${extension}`;
  const { error } = await context.supabase.storage.from("catalog").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = context.supabase.storage.from("catalog").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
