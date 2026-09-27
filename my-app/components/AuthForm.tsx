"use client";

import { useState } from "react";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
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
    <section className="w-full max-w-md overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
      <div className="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p aria-hidden="true" className="font-ruwudu text-4xl leading-none text-[#8B102F]">س</p>
          <h1 className="mt-2 font-tajawal text-xl font-bold text-neutral-950">
            {mode === "sign-in" ? "مرحباً بك في حسابك" : "إنشاء حساب جديد"}
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "sign-up" && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-neutral-700">الاسم</span>
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-sm border border-neutral-300 bg-white px-3 text-[13px] outline-none transition placeholder:text-neutral-400 focus:border-[#8B102F] focus:ring-2 focus:ring-[#8B102F]/10"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-neutral-700">البريد الإلكتروني</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-sm border border-neutral-300 bg-white px-3 text-[13px] outline-none transition placeholder:text-neutral-400 focus:border-[#8B102F] focus:ring-2 focus:ring-[#8B102F]/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-neutral-700">كلمة المرور</span>
            <input
              required
              minLength={6}
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-sm border border-neutral-300 bg-white px-3 text-[13px] outline-none transition placeholder:text-neutral-400 focus:border-[#8B102F] focus:ring-2 focus:ring-[#8B102F]/10"
            />
          </label>
          {error && <p role="alert" className="text-[11px] leading-4 text-red-700">{error}</p>}
          {message && <p role="status" className="text-[11px] leading-4 text-[#8B102F]">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#8B102F] text-[11px] font-bold text-white transition hover:bg-[#740D28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B102F] disabled:cursor-wait disabled:opacity-60"
          >
            {loading && <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" />}
            {mode === "sign-in" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </button>
        </form>
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/70 px-6 py-4 text-center sm:px-8">
        <button
          type="button"
          onClick={() => {
            setMode((current) => current === "sign-in" ? "sign-up" : "sign-in");
            setError("");
            setMessage("");
          }}
          disabled={loading}
          className="disabled:cursor-not-allowed disabled:opacity-60 inline-flex items-center cursor-pointer justify-center gap-2 text-[11px] font-bold text-[#8B102F] transition hover:text-[#650B22] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B102F]"
        >
          {mode === "sign-in" ? "إنشاء حساب جديد" : "لديك حساب؟ تسجيل الدخول"}
          <FiArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
