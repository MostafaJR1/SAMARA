"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type CategoryItem = {
  href: string;
  label: string;
  meta: string;
  variant?: "primary" | "dark" | "default";
};

export function CategoryScroller({ items }: { items: CategoryItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateState = () => {
      const containerRect = el.getBoundingClientRect();
      const tolerance = 3;

      const children = Array.from(el.children) as HTMLElement[];

      if (!children.length) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      const leftmost = Math.min(
        ...children.map((child) => child.getBoundingClientRect().left)
      );

      const rightmost = Math.max(
        ...children.map((child) => child.getBoundingClientRect().right)
      );

      // Has content sticking out past the physical left edge
      const hasContentOutsideLeft = leftmost < containerRect.left - tolerance;

      // Has content sticking out past the physical right edge
      const hasContentOutsideRight = rightmost > containerRect.right + tolerance;

      setCanScrollLeft(hasContentOutsideLeft);
      setCanScrollRight(hasContentOutsideRight);
    };

    const frame = requestAnimationFrame(updateState);

    el.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    const resizeObserver = new ResizeObserver(updateState);
    resizeObserver.observe(el);
    Array.from(el.children).forEach((child) => resizeObserver.observe(child));

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
      resizeObserver.disconnect();
    };
  }, [items]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.max(el.clientWidth * 0.8, 220);
    // In both LTR and modern standard RTL, -amount scrolls left, +amount scrolls right
    const delta = direction === "left" ? -amount : amount;

    el.scrollBy({
      left: delta,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Left button: physically pinned to the left edge */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="التمرير إلى اليسار"
          onClick={() => scrollByAmount("left")}
          className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-md transition hover:border-[#8B102F] hover:text-[#8B102F]"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right button: physically pinned to the right edge */}
      {canScrollRight && (
        <button
          type="button"
          aria-label="التمرير إلى اليمين"
          onClick={() => scrollByAmount("right")}
          className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-md transition hover:border-[#8B102F] hover:text-[#8B102F]"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto pb-1 pl-12 pr-12"
      >
        {items.map((item) => {
          const isPrimary = item.variant === "primary";
          const isDark = item.variant === "dark";

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={[
                "min-w-[120px] text-nowrap md:min-w-[180px] rounded-md border px-5 py-5 text-right transition",
                isPrimary && "border-[#8B102F] bg-[#f7e9ed]",
                isDark &&
                  "border-neutral-950 bg-neutral-950 text-white hover:bg-[#8B102F]",
                !isPrimary &&
                  !isDark &&
                  "border-neutral-200 bg-neutral-50 hover:border-[#8B102F]",
              ].join(" ")}
            >
              <span
                className={[
                  "block text-sm font-black",
                  isPrimary && "text-[#8B102F]",
                  isDark && "text-white",
                  !isPrimary && !isDark && "text-neutral-950",
                ].join(" ")}
              >
                {item.label}
              </span>

              <span
                className={[
                  "mt-2 block text-[10px]",
                  isDark ? "text-neutral-300" : "text-neutral-500",
                ].join(" ")}
              >
                {item.meta}
              </span>

              <FiChevronLeft
                className={[
                  "mt-5 h-4 w-4",
                  isDark ? "text-neutral-300" : "text-neutral-500",
                  isPrimary && "text-[#8B102F]",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}