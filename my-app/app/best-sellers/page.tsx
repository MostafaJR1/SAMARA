import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft, FiShoppingBag, FiTrendingUp } from "react-icons/fi";
import { HomeProductCard } from "@/components/HomeProductCard";
import { getBestSellingProducts } from "@/lib/best-sellers";
import { createPageMetadata } from "@/lib/seo";
import { StoreEmptyState } from "@/components/StoreEmptyState";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getBestSellingProducts();

  return createPageMetadata({
    title: "المنتجات الأكثر مبيعاً",
    description: `تعرّف على المنتجات الأكثر طلباً في متجر سمارة، وتصفح ${products.length} من المنتجات المتاحة وفق بيانات الطلبات الحالية.`,
    path: "/best-sellers",
  });
}

export default async function BestSellersPage() {
  const products = await getBestSellingProducts();

  return (
    <main dir="rtl" className="min-h-screen bg-white text-neutral-950">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-7 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
        <header className="border-b border-neutral-200 pb-4 text-right sm:pb-5">
          <span className="inline-flex items-center gap-1.5 border-r-2 border-[#8B102F] px-2.5 py-1 text-[10px] font-semibold text-[#8B102F]">
            <FiTrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
            اختيارات سمارة
          </span>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-950 sm:text-2xl">الأكثر مبيعاً</h1>
              <p className="mt-1.5 max-w-xl text-xs leading-5 text-neutral-600 sm:text-sm">
                ترتيب يعتمد على الطلبات المؤكدة وتقييمات وبيانات المنتجات المتاحة.
              </p>
            </div>
            <span className="shrink-0 pb-1 text-[10px] font-medium text-neutral-500 sm:text-xs">
              {products.length} منتجات
            </span>
          </div>
        </header>

        {products.length > 0 ? (
          <section aria-label="المنتجات الأكثر مبيعاً" className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-4">
            {products.map((product, index) => (
              <div key={product.id} className="flex min-w-0 flex-col">
                <span className="mb-1.5 self-start text-[9px] font-semibold text-neutral-500">
                  الترتيب {index + 1}
                </span>
                <HomeProductCard product={product} />
              </div>
            ))}
          </section>
        ) : (
          <StoreEmptyState
            icon={<FiShoppingBag aria-hidden="true" className="h-5 w-5" />}
            title="لا توجد منتجات حالياً"
          >
            <Link href="/products" className="cart-action-button inline-flex h-10 items-center justify-center gap-2 rounded px-5 text-xs font-semibold text-white">
              تصفح المنتجات <FiArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </StoreEmptyState>
        )}
      </div>
    </main>
  );
}