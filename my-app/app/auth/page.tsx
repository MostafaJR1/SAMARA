import { AuthForm } from "@/components/AuthForm";
import { createPrivatePageMetadata } from "@/lib/seo";

export const metadata = createPrivatePageMetadata(
  "تسجيل الدخول",
  "تسجيل الدخول إلى حسابك في متجر سمارة.",
);

export default function AuthPage() {
  return (
    <main dir="rtl" className="flex flex-1 items-center justify-center bg-white px-4 py-12 text-neutral-950 sm:py-16">
      <AuthForm />
    </main>
  );
}
