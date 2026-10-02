"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { ProductMedia } from "@/types/catalog";

export function ProductMediaCarousel({
  slides,
  name,
  autoPlay = false,
  interval = 4500,
  index,
  onIndexChange,
  objectFit = "cover",
  mediaClassName = "scale-[0.92] sm:scale-[0.88] lg:scale-[0.84]",
  sizes = "100vw",
  indicatorPlacement = "bottom-center",
  controls = true,
  className = "",
}: {
  slides: ProductMedia[];
  name: string;
  autoPlay?: boolean;
  interval?: number;
  index?: number;
  onIndexChange?: (index: number) => void;
  objectFit?: "cover" | "contain";
  mediaClassName?: string;
  sizes?: string;
  indicatorPlacement?: "bottom-center" | "raised-center";
  controls?: boolean;
  className?: string;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeIndex = index ?? internalIndex;
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (activeSlide?.type !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    void video.play().catch(() => {});
  }, [activeSlide?.type, activeSlide?.url]);

  function selectSlide(nextIndex: number) {
    const normalizedIndex = (nextIndex + slides.length) % slides.length;
    setInternalIndex(normalizedIndex);
    onIndexChange?.(normalizedIndex);
  }

  useEffect(() => {
    if (!autoPlay || slides.length < 2 || activeSlide?.type === "video") return;
    const timer = window.setTimeout(() => {
      setInternalIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % slides.length;
        onIndexChange?.(nextIndex);
        return nextIndex;
      });
    }, interval);
    return () => window.clearTimeout(timer);
  }, [activeIndex, activeSlide?.type, autoPlay, interval, onIndexChange, slides.length]);

  if (!activeSlide) return null;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div key={`${activeSlide.type}:${activeSlide.url}`} className="absolute inset-0 animate-[product-media-enter_450ms_ease-out]">
        {activeSlide.type === "video" ? (
          <video
            ref={videoRef}
            src={activeSlide.url}
            poster={slides.find((slide) => slide.type === "image")?.url}
            aria-label={`${name} - مقطع ${activeIndex + 1}`}
            autoPlay
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noremoteplayback"
            loop={!autoPlay}
            preload="metadata"
            onCanPlay={(event) => {
              event.currentTarget.muted = true;
              event.currentTarget.defaultMuted = true;
              event.currentTarget.volume = 0;
              void event.currentTarget.play().catch(() => {});
            }}
            onEnded={() => autoPlay && slides.length > 1 && selectSlide(activeIndex + 1)}
            className={`h-full w-full ${objectFit === "contain" ? "object-contain" : "object-cover"} ${mediaClassName}`}
          />
        ) : (
          <Image
            src={activeSlide.url}
            alt={`${name} - صورة ${activeIndex + 1}`}
            fill
            sizes={sizes}
            className={`${objectFit === "contain" ? "object-contain" : "object-cover"} ${mediaClassName}`}
          />
        )}
      </div>

      {controls && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); selectSlide(activeIndex - 1); }}
            aria-label="الشريحة السابقة"
            className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); selectSlide(activeIndex + 1); }}
            aria-label="الشريحة التالية"
            className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
          <div role="group" aria-label="شرائح المنتج" className={`absolute z-20 flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-sm ${indicatorPlacement === "raised-center" ? "bottom-7 left-1/2 -translate-x-1/2 gap-1 px-2 py-0.5" : "bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-2"}`}>
            {slides.map((slide, slideIndex) => (
              <button
                key={`${slide.url}-${slideIndex}`}
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); selectSlide(slideIndex); }}
                aria-label={`عرض ${slide.type === "video" ? "الفيديو" : "الصورة"} ${slideIndex + 1}`}
                aria-current={activeIndex === slideIndex ? "true" : undefined}
                className={`rounded-full transition-all ${indicatorPlacement === "raised-center" ? "h-1.5" : "h-2"} ${activeIndex === slideIndex ? `${indicatorPlacement === "raised-center" ? "w-4" : "w-5"} bg-white` : `${indicatorPlacement === "raised-center" ? "w-1.5" : "w-2"} bg-white/60 hover:bg-white`}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}