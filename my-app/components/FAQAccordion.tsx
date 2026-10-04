"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const faqItems = [
  {
    question: "هل توجد رسوم للتوصيل؟",
    answer: "الشحن مجاني على جميع الطلبات دون حد أدنى.",
  },
  {
    question: "متى يصل طلبي؟",
    answer: "يتم تأكيد مدة التوصيل معك عند التواصل لتأكيد الطلب.",
  },
  {
    question: "هل يمكن الدفع عند الاستلام؟",
    answer: "نعم، يمكنك الدفع عند استلام طلبك.",
  },
  {
    question: "هل يمكن الاستبدال؟",
    answer: "تفاصيل سياسة الاستبدال غير منشورة حالياً؛ تواصل مع خدمة العملاء قبل الطلب.",
  },
  {
    question: "ما الذي يتضمنه الطلب؟",
    answer: "يتضمن المنتج أو الباقة الموضحة في صفحة التفاصيل فقط.",
  },
  {
    question: "ما هي أبعاد المنتج؟",
    answer: "الأبعاد غير متوفرة في بيانات المنتج الحالية؛ تواصل معنا قبل الطلب للتأكد.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className="overflow-hidden transition-colors"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8b102f]"
            >
              <span className="text-xs font-bold text-neutral-900 sm:text-sm">{item.question}</span>

              <motion.span
                aria-hidden="true"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex h-6 w-6 shrink-0 items-center justify-center text-neutral-500"
              >
                <FiChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="pb-4 text-xs leading-6 text-neutral-600">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
