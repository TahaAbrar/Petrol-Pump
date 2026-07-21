import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useSiteContent } from "@/lib/content";

export function FaqSection() {
  const { data: SITE } = useSiteContent();
  const faqs = (SITE.faqs ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (!faqs.length) return null;

  return (
    <section className="bg-mesh py-20 md:py-28">
      <div className="container-x max-w-3xl">
        <Reveal className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {faqs.map((item, i) => (
            <FaqItem key={`${item.question}-${i}`} question={item.question} answer={item.answer} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <Reveal delay={index * 0.04}>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold md:text-base">{question}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden"
            >
              <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}
