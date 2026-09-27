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
    <div className="space-y-2">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-md border border-neutral-200 bg-white"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
            >
              <span className="text-xs font-bold text-neutral-900">{item.question}</span>

              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-600"
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
                  <p className="px-5 pb-4 text-xs leading-6 text-neutral-500">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
