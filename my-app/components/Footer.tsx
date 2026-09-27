import Link from "next/link";
import {
  FiClock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiShield,
  FiTruck,
} from "react-icons/fi";

const quickLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "كل المنتجات", href: "/products" },
  { label: "الباقات والعروض", href: "/packs" },
  { label: "الأكثر طلباً", href: "/best-sellers" },
  { label: "قائمة المفضلة", href: "/wishlist" },
  { label: "سلة التسوق", href: "/cart" },
];

const customerServiceLinks = [
  { label: "الأسئلة الشائعة", href: "/#faq" },
  { label: "سياسة التوصيل والدفع", href: "/shipping-policy" },
  { label: "سياسة الاستبدال والضمان", href: "/returns-policy" },
  { label: "تأكيد الطلب والمعاينة", href: "/inspection" },
  { label: "شروط الخدمة والخصوصية", href: "/privacy" },
];

export function Footer() {
  return (
    <footer dir="rtl" className="border-t border-neutral-800 bg-neutral-950 pb-14 text-neutral-300 sm:pb-0">
      
      {/* 1. Value Guarantee Strip */}
      {/* <div className="border-b border-neutral-800/80 bg-neutral-900/60 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            
            <div className="flex items-center gap-3 text-right">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#8B102F]/15 text-[#8B102F]">
                <FiTruck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">توصيل سريع ومجاني</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">إلى باب منزلك في مختلف مدن المغرب</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#8B102F]/15 text-[#8B102F]">
                <FiShield className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">الدفع بعد المعاينة</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">افحص طلبيتك أولاً ثم ادفع نقداً بكل راحة</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#8B102F]/15 text-[#8B102F]">
                <FiClock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">خدمة زبناء سريعة</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">فريق متواجد للإجابة على جميع استفساراتكم</p>
              </div>
            </div>

          </div>
        </div>
      </div> */}

      {/* 2. Main Navigation Columns */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-10 text-right">
          
          {/* Column 1: Brand & Bio */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-2xl font-black font-ruwudu tracking-wider text-white"
            >
              <span>سمارة</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B102F]" />
            </Link>

            <p className="mt-3 text-xs leading-6 text-neutral-400">
              متجركم المغربي لتسوق تشكيلات منسقة بعناية تجمع بين الجودة، الراحة، وأفضل قيمة، مع توصيل مباشر والدفع عند الاستلام.
            </p>

            <div className="mt-5">
              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3.5 text-xs font-bold text-white transition hover:border-[#8B102F] hover:bg-neutral-800"
              >
                <FiMessageCircle className="h-4 w-4 text-emerald-400" />
                <span>تواصل معنا عبر واتساب</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              روابط سريعة
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              خدمة الزبناء
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Coverage */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              معلومات الاتصال
            </h3>
            
            <ul className="mt-4 space-y-3 text-xs text-neutral-400">
              <li className="flex items-center gap-2.5">
                <FiPhone className="h-4 w-4 shrink-0 text-[#8B102F]" />
                <span dir="ltr">+212 6 00 00 00 00</span>
              </li>

              <li className="flex items-center gap-2.5">
                <FiMail className="h-4 w-4 shrink-0 text-[#8B102F]" />
                <span>contact@samara.ma</span>
              </li>

              <li className="flex items-start gap-2.5">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8B102F]" />
                <span>التوصيل يغطي جميع مدن المغرب (الدار البيضاء، الرباط، مراكش، طنجة، فاس...)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Bottom Legal Bar */}
      <div className="border-t border-neutral-900 bg-black/60 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 lg:px-8">
          <p className="text-[11px] text-neutral-500">
            © {new Date().getFullYear()} سمارة. جميع الحقوق محفوظة.
          </p>

          <p className="text-[11px] text-neutral-400">
            الدفع نقداً عند استلام ومعاينة طلبيتك • تجربة شراء آمنة 100%
          </p>
        </div>
      </div>

    </footer>
  );
}