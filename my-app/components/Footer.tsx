import Image from "next/image";
import Link from "next/link";
import { FiMail, FiMapPin, FiMessageCircle, FiPhone } from "react-icons/fi";

const footerLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "كل المنتجات", href: "/products" },
  { label: "الباقات والعروض", href: "/packs" },
  { label: "العروض والتخفيضات", href: "/offers" },
  { label: "الأكثر طلباً", href: "/best-sellers" },
  { label: "المفضلة", href: "/wishlist" },
  { label: "سلة التسوق", href: "/cart" },
  { label: "الأسئلة الشائعة", href: "/#faq" },
];

export function Footer() {
  return (
    <footer dir="rtl" className="border-t border-neutral-200 bg-neutral-50 pb-14 text-neutral-600 sm:pb-0">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-7 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-10 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Link href="/" aria-label="سمارة - الرئيسية" className="inline-flex w-fit shrink-0 items-center">
            <Image src="/SAMARA-LOGO.png" alt="سمارة" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
          <p className="max-w-md text-xs leading-6 text-neutral-500">
            منتجات منزلية وباقات مختارة، مع الشحن المجاني والدفع عند الاستلام في المغرب.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
          <nav aria-label="روابط المتجر" className="col-span-2 sm:col-span-1">
            <h2 className="text-xs font-bold text-neutral-900">روابط المتجر</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-1">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-[#8B102F]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 sm:col-span-2">
            <h2 className="text-xs font-bold text-neutral-900">تواصل معنا</h2>
            <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <FiPhone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8B102F]" />
                <a href="tel:0612557789" dir="ltr" className="hover:text-[#8B102F]">0612557789</a>
              </li>
              <li className="flex items-center gap-2">
                <FiMail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8B102F]" />
                <a href="mailto:samara.contact.us@gmail.com" className="hover:text-[#8B102F]">samara.contact.us@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 sm:col-span-2">
                <FiMapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B102F]" />
                <span>التوصيل يغطي جميع مدن المغرب</span>
              </li>
            </ul>
            <a
              href="https://wa.me/212612557789"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#8B102F] hover:underline"
            >
              <FiMessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
              تواصل معنا عبر واتساب
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-100 py-3">
        <p className="mx-auto max-w-7xl px-4 text-center text-[10px] text-neutral-400 sm:px-6 sm:text-right lg:px-8">
          © {new Date().getFullYear()} سمارة. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
