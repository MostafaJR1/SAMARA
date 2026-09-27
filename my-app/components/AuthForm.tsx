"use client";

import { useState } from "react";
import { FiArrowLeft, FiCheck, FiLoader } from "react-icons/fi";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const result = mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });

      if (result.error) throw result.error;
      const next = new URLSearchParams(window.location.search).get("next") ?? "/";
      if (!result.data.session) {
        setMessage("تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.");
      } else {
        window.location.assign(next);
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "تعذر إتمام العملية");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">حساب سامارا</p>
          <h1 className="mt-2 text-2xl font-black">{mode === "sign-in" ? "مرحباً بعودتك" : "أنشئ حسابك"}</h1>
        </div>
        {mode === "sign-up" && <FiCheck className="h-5 w-5 text-neutral-500" />}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "sign-up" && <label className="block"><span className="mb-1.5 block text-xs font-bold">الاسم</span><input required value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950" /></label>}
        <label className="block"><span className="mb-1.5 block text-xs font-bold">البريد الإلكتروني</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold">كلمة المرور</span><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950" /></label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {message && <p className="text-xs font-semibold text-neutral-700">{message}</p>}
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 bg-neutral-950 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50">
          {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : mode === "sign-in" ? "تسجيل الدخول" : "إنشاء الحساب"}
        </button>
      </form>

      <button type="button" onClick={() => { setMode((current) => current === "sign-in" ? "sign-up" : "sign-in"); setError(""); setMessage(""); }} className="mt-5 flex w-full items-center justify-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-950">
        {mode === "sign-in" ? "إنشاء حساب جديد" : "لديك حساب؟ تسجيل الدخول"}
        <FiArrowLeft className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
