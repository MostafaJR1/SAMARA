import Link from "next/link";
import { FiArrowLeft, FiTrendingUp } from "react-icons/fi";
import { HomeProductCard } from "@/components/HomeProductCard";
import { getBestSellingProducts } from "@/lib/best-sellers";

export const metadata = {
  title: "الأكثر مبيعاً | سمارة",
  description: "اكتشف المنتجات الأكثر طلباً في متجر سمارة.",
};

export default async function BestSellersPage() {
  const products = await getBestSellingProducts();

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf9f8] text-neutral-950">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="text-right">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B102F]">
              <FiTrendingUp className="h-3.5 w-3.5" /> اختيارات سمارة
            </p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">الأكثر مبيعاً</h1>
            <p className="mt-1 max-w-lg text-[10px] leading-4 text-neutral-600 sm:text-xs sm:leading-5">
              ترتيب يعتمد على الطلبات المؤكدة وتقييمات وبيانات المنتجات المتاحة.
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[#f7e9ed] px-2.5 py-1.5 text-[10px] font-bold text-[#8B102F] sm:text-xs">
            {products.length} منتجات
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product, index) => (
              <div key={product.id} className="flex min-w-0 flex-col gap-1.5">
                <span className="self-start rounded-sm bg-[#f7e9ed] px-2 py-0.5 text-[9px] font-bold text-[#8B102F]">
                  الترتيب {index + 1}
                </span>
                <HomeProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t border-neutral-200 py-16 text-center sm:py-20">
            <h2 className="text-base font-black sm:text-lg">لا توجد منتجات متاحة حالياً</h2>
            <Link href="/products" className="cart-action-button mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-white">
              تصفح المنتجات <FiArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}