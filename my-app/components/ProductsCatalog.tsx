"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiChevronDown, FiChevronLeft, FiSearch, FiStar, FiX } from "react-icons/fi";
import { WishlistButton } from "@/components/WishlistButton";
import type { ProductsData } from "@/data/Products";

type Product = (typeof ProductsData)[number];
type SortOption = "relevance" | "rating" | "price-low" | "price-high" | "discount";
type PriceOption = "all" | "under-500" | "500-1000" | "over-1000";
type FilterOption = { value: string; label: string };

function normalize(value: string) {
  return value.toLocaleLowerCase("ar").normalize("NFD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").trim();
}

function searchableText(product: Product) {
  return normalize([product.name, product.category, product.description, product.badge, ...product.features, ...product.colors.map((color) => color.name)].join(" "));
}

function getSearchScore(product: Product, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return product.rating * 10;
  const name = normalize(product.name);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  const text = searchableText(product);
  return (name === normalizedQuery ? 1000 : 0) + (name.includes(normalizedQuery) ? 400 : 0) + words.filter((word) => text.includes(word)).length * 100 + product.rating * 10 + product.discount;
}

function matchesPrice(product: Product, price: PriceOption) {
  if (price === "all") return true;
  if (price === "under-500") return product.price < 500;
  if (price === "500-1000") return product.price >= 500 && product.price <= 1000;
  return product.price > 1000;
}

export function ProductsCatalog({ products, initialCategory }: { products: Product[]; initialCategory?: string }) {
  const categories = Array.from(new Set(products.map((product) => product.category)));
  const requestedCategory = initialCategory && categories.includes(initialCategory) ? initialCategory : "all";
  const [query, setQuery] = useState("");
  const [previewQuery, setPreviewQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState(requestedCategory);
  const [price, setPrice] = useState<PriceOption>("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewQuery(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const activeQuery = appliedQuery.trim();
  const searching = Boolean(query.trim()) && normalize(query) !== normalize(previewQuery);
  const suggestions = [...products].sort((a, b) => getSearchScore(b, previewQuery) - getSearchScore(a, previewQuery)).slice(0, 5);
  const filteredProducts = products
    .filter((product) => category === "all" || product.category === category)
    .filter((product) => matchesPrice(product, price))
    .filter((product) => !activeQuery || getSearchScore(product, activeQuery) >= 100);
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "discount") return b.discount - a.discount;
    return getSearchScore(b, activeQuery) - getSearchScore(a, activeQuery);
  });
  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = sortedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clearFilters() {
    setQuery("");
    setPreviewQuery("");
    setAppliedQuery("");
    setCategory("all");
    setPrice("all");
    setSort("relevance");
    setPage(1);
  }

  function clearSearch() {
    setQuery("");
    setPreviewQuery("");
    setAppliedQuery("");
    setPage(1);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(query.trim());
    setPreviewQuery(query);
    setSearchOpen(false);
    setPage(1);
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-white text-neutral-950">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="mb-4 flex items-end justify-between gap-3 border-b border-neutral-200 pb-4 sm:mb-5 sm:pb-5">
          <div>
            <p className="text-[10px] font-bold text-[#8B102F]">تشكيلة سمارة</p>
            <h1 className="mt-0.5 text-lg font-black text-neutral-950 sm:text-xl">اكتشف منتجاتنا</h1>
          </div>
          <span className="shrink-0 rounded-md bg-[#f7e9ed] px-2.5 py-1.5 text-[10px] font-bold text-[#8B102F] sm:text-xs">
            {filteredProducts.length} منتج
          </span>
        </header>

        <div className="grid w-full grid-cols-2 gap-2 overflow-visible sm:flex sm:flex-wrap sm:items-center">
          <div ref={searchRef} className="relative col-span-2 min-w-0 sm:basis-full sm:flex-1 lg:basis-auto">
            <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <form onSubmit={submitSearch}>
              <input value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} placeholder="ابحث عن منتج..." aria-label="البحث في المنتجات" className="h-11 w-full rounded-md border border-neutral-200 bg-white pl-11 pr-10 text-xs outline-none transition placeholder:text-neutral-400 hover:border-[#8B102F]/40 focus:border-[#8B102F] focus:ring-2 focus:ring-[#8B102F]/10" />
              <button type="submit" aria-label="تنفيذ البحث" className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-[#8B102F] text-white transition hover:bg-[#6f0d26]"><FiSearch className="h-3.5 w-3.5" /></button>
            </form>
            {searchOpen && query && <button type="button" onClick={clearSearch} aria-label="مسح البحث" className="absolute left-10 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"><FiX className="h-3.5 w-3.5" /></button>}
            {searchOpen && <div className="absolute right-0 top-12 z-30 w-full rounded-md border border-neutral-200 bg-white p-2 text-[10px] shadow-lg">
              {searching ? <div className="flex items-center gap-2 px-2 py-3 text-neutral-500"><span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />جاري البحث...</div> : suggestions.length > 0 ? <div className="space-y-2"><p className="px-2 font-bold text-neutral-900">{query ? "اقتراحات البحث" : "الأعلى تقييماً"}</p>{suggestions.map((product) => <Link key={product.id} href={`/products/${product.id}`} onClick={() => setSearchOpen(false)} className="flex items-center justify-between rounded px-2 py-2 text-neutral-900 transition hover:bg-neutral-100"><span className="truncate">{product.name}</span><span className="flex shrink-0 items-center gap-1 text-neutral-500"><FiStar className="h-3 w-3 fill-black text-black" />{product.rating}</span></Link>)}</div> : <p className="px-2 py-3 text-neutral-500">لا توجد منتجات مطابقة لبحثك</p>}
            </div>}
          </div>

          <FilterSelect value={category} options={[{ value: "all", label: "كل الفئات" }, ...categories.map((item) => ({ value: item, label: item }))]} onChange={(value) => { setCategory(value); setPage(1); }} />
          <FilterSelect value={price} options={[{ value: "all", label: "كل الأسعار" }, { value: "under-500", label: "أقل من 500 د.م" }, { value: "500-1000", label: "500 - 1000 د.م" }, { value: "over-1000", label: "أكثر من 1000 د.م" }]} onChange={(value) => { setPrice(value as PriceOption); setPage(1); }} />
          <FilterSelect value={sort} options={[{ value: "relevance", label: "الأكثر صلة" }, { value: "rating", label: "الأعلى تقييماً" }, { value: "price-low", label: "الأقل سعراً" }, { value: "price-high", label: "الأعلى سعراً" }, { value: "discount", label: "أكبر خصم" }]} onChange={(value) => { setSort(value as SortOption); setPage(1); }} />
          {(query || category !== "all" || price !== "all" || sort !== "relevance") && <button type="button" onClick={clearFilters} aria-label="مسح الفلاتر" className="flex h-11 w-11 cursor-pointer items-center justify-center justify-self-start rounded-md border border-neutral-200 bg-white text-neutral-500 transition hover:border-[#8B102F] hover:text-[#8B102F] sm:h-10 sm:w-10"><FiX className="h-4 w-4" /></button>}
        </div>

        <div className="mt-4 flex items-center justify-between border-b border-neutral-100 pb-2 text-[10px] text-neutral-500 sm:text-xs">
          <span>{category !== "all" ? category : "جميع المنتجات"}</span>
          <span>{sortedProducts.length} نتيجة</span>
        </div>

        {visibleProducts.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-5 flex min-h-60 items-center justify-center border border-dashed border-neutral-200"><div className="text-center"><FiSearch className="mx-auto mb-3 h-5 w-5 text-neutral-300" /><p className="text-xs font-bold text-neutral-900">لم نجد منتجات مطابقة</p><button type="button" onClick={clearFilters} className="mt-3 cursor-pointer text-[11px] font-bold text-[#8B102F] underline underline-offset-4 hover:text-[#6f0d26]">عرض كل المنتجات</button></div></div>}

        {pageCount > 1 && <nav aria-label="صفحات المنتجات" className="mt-10 flex items-center justify-center gap-1.5"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-neutral-200 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30" aria-label="الصفحة السابقة"><FiChevronLeft className="h-4 w-4 rotate-180" /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`h-9 min-w-9 cursor-pointer rounded-md px-2 text-xs font-bold ${currentPage === pageNumber ? "bg-neutral-950 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"}`}>{pageNumber}</button>)}<button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-neutral-200 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30" aria-label="الصفحة التالية"><FiChevronLeft className="h-4 w-4" /></button></nav>}
      </div>
    </main>
  );
}

function FilterSelect({ value, options, onChange }: { value: string; options: FilterOption[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return <div ref={containerRef} className="relative h-11 w-full min-w-0 shrink-0 sm:h-10 sm:w-[145px]">
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-full w-full cursor-pointer items-center justify-between rounded-md border border-neutral-200 bg-white px-3 text-[11px] font-semibold text-neutral-800 outline-none transition hover:border-[#8B102F]/50 focus:border-[#8B102F] focus:ring-2 focus:ring-[#8B102F]/10"><span className="truncate">{selectedOption?.label}</span><FiChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#8B102F] transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></button>
    <div role="listbox" aria-hidden={!open} className={`absolute left-0 right-0 top-[calc(100%+6px)] z-40 origin-top rounded-md border border-neutral-200 bg-white p-1 shadow-xl transition-all duration-200 ease-out ${open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0"}`}>
      {options.map((option) => { const selected = option.value === value; return <button key={option.value} type="button" role="option" aria-selected={selected} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full cursor-pointer items-center justify-between rounded px-2.5 py-2 text-right text-[11px] font-semibold transition-colors ${selected ? "bg-[#f7e9ed] text-[#8B102F]" : "bg-white text-neutral-700 hover:bg-[#faf8f9] hover:text-[#8B102F]"}`}><span>{option.label}</span>{selected && <span className="h-1.5 w-1.5 rounded-full bg-[#8B102F]" />}</button>; })}
    </div>
  </div>;
}

function ProductCard({ product }: { product: Product }) {
  const hasOldPrice = product.oldPrice > product.price;
  const savingsPercent = hasOldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`} className="group block overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-[#8B102F]/50">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#faf8f9]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.02] sm:p-2"
        />
        {product.badge && <span className="absolute right-2 top-2 rounded-sm bg-[#8B102F] px-2 py-1 text-[9px] font-bold text-white">{product.badge}</span>}
        <div className="absolute left-2 top-2"><WishlistButton productId={product.id} /></div>
      </div>
      <div className="space-y-1.5 p-2.5 text-right sm:p-3">
        <h2 className="truncate text-xs font-bold text-neutral-900 group-hover:text-[#8B102F]">{product.name}</h2>
        <p className="line-clamp-1 text-[10px] text-neutral-500">{product.description}</p>
        <div className="flex items-baseline justify-between gap-1 pt-1">
          <span className="text-xs font-black text-[#8B102F] sm:text-sm">{product.price.toLocaleString("ar-MA")} د.م</span>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-neutral-600">
            <FiStar className="h-3 w-3 fill-[#8B102F] text-[#8B102F]" />{product.rating}
          </span>
        </div>
        {hasOldPrice && (
          <div className="flex items-center justify-end gap-2 text-[10px]">
            <span className="text-neutral-500 line-through">{product.oldPrice.toLocaleString("ar-MA")} د.م</span>
            {savingsPercent > 0 && <span className="font-bold text-[#8B102F]">-{savingsPercent}%</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
