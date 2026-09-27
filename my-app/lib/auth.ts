import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "client" | "admin";

export async function getAuthContext() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, role: null as AppRole | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: (profile?.role === "admin" ? "admin" : "client") as AppRole,
  };
}

export async function requireAdmin() {
  const context = await getAuthContext();
  if (!context.user) redirect("/auth?next=/admin");
  if (context.role !== "admin") redirect("/");
  return context;
}
