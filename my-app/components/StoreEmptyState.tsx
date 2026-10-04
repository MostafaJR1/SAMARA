import Image from "next/image";
import type { ReactNode } from "react";

export function StoreEmptyState({
  icon,
  illustrationSrc,
  title,
  children,
}: {
  icon?: ReactNode;
  illustrationSrc?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex min-h-52 w-full min-w-0 flex-col items-center justify-center overflow-hidden px-4 py-10 text-center sm:min-h-60 sm:px-5">
      {illustrationSrc ? (
        <Image
          src={illustrationSrc}
          alt="صندوق فارغ"
          width={220}
          height={176}
          className="h-28 w-36 object-contain sm:h-36 sm:w-44"
        />
      ) : icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8B102F]/10 text-[#8B102F]">
          {icon}
        </span>
      ) : null}
      <h2 className="mt-4 text-sm font-semibold text-neutral-800 sm:text-base">{title}</h2>
      {children && <div className="mt-4 flex w-full max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1">{children}</div>}
    </section>
  );
}
