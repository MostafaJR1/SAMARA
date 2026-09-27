import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <main dir="rtl" className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
        <AuthForm />
      </main>
    </div>
  );
}
