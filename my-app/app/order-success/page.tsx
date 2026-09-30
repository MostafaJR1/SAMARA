import Link from "next/link";
import { OrderConfetti } from "@/components/OrderConfetti";
import { createPrivatePageMetadata } from "@/lib/seo";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiMessageCircle,
  FiPackage,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

export const metadata = createPrivatePageMetadata(
  "تأكيد الطلب",
  "تأكيد استلام طلبك من متجر سمارة.",
);

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50/40 text-neutral-950 selection:bg-neutral-950 selection:text-white">
      <OrderConfetti />

      <main
        dir="rtl"
        className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <section className="w-full max-w-xl rounded-md border border-neutral-200 bg-white p-6 text-center sm:p-10">
          
          {/* Animated Success Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f7e9ed] text-[#8B102F]">
            <FiCheck className="h-8 w-8 stroke-[2.5]" />
          </div>

          <span className="mt-5 inline-block rounded-xs bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            تم استلام طلبك بنجاح
          </span>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
            شكراً لثقتك بمتجر سمارة
          </h1>

          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-neutral-500 sm:text-sm">
            تم تسجيل طلبك في نظامنا بنجاح. سيتواصل معك أحد ممثلي خدمة الزبناء هاتفياً أو عبر واتساب لتأكيد العنوان وموعد التسليم.
          </p>

          {/* Steps Roadmap */}
          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-neutral-150 pt-6 text-center">
            
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                <FiClock className="h-4 w-4" />
              </span>
              <p className="mt-2 text-xs font-bold text-neutral-900">1. الاتصال للتأكيد</p>
              <p className="mt-0.5 text-[10px] text-neutral-500">خلال ساعات العمل</p>
            </div>

            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                <FiPackage className="h-4 w-4" />
              </span>
              <p className="mt-2 text-xs font-bold text-neutral-900">2. تجهيز الشحنة</p>
              <p className="mt-0.5 text-[10px] text-neutral-500">تغليف محكم وآمن</p>
            </div>

            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                <FiTruck className="h-4 w-4" />
              </span>
              <p className="mt-2 text-xs font-bold text-neutral-900">3. الدفع بعد المعاينة</p>
              <p className="mt-0.5 text-[10px] text-neutral-500">نقداً عند الاستلام</p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#8B102F] px-7 text-xs font-bold text-white transition hover:bg-black"
            >
              <span>متابعة التسوق</span>
              <FiArrowLeft className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-6 text-xs font-bold text-neutral-800 transition hover:border-neutral-400"
            >
              <span>الصفحة الرئيسية</span>
              <FiShoppingBag className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* WhatsApp Support Link */}
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <a
              href="https://wa.me/212600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 transition hover:text-emerald-700"
            >
              <FiMessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>هل ترغب في تعديل طلبك أو لديك استفسار؟ راسلنا عبر واتساب</span>
            </a>
          </div>

        </section>
      </main>
    </div>
  );
}