"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { HeroArt } from "@/components/Illustrations";

const CHIPS = ["Never invents experience", "Cover letter in your tone", "Mock interview practice"];

export function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.2, 0.7, 0.2, 1] }}
      className="mb-7 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="min-w-0">
        <h1 className="bg-brand bg-clip-text pb-[0.08em] text-[clamp(30px,8vw,58px)] font-extrabold leading-[1.05] tracking-[-0.035em] text-transparent">
          JobMatch AI
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-base leading-relaxed text-mute sm:text-lg">
          Paste a job post and your resume. Get a resume and cover letter rewritten for that role, using only what your resume actually says.
        </p>
        <ul className="mt-[18px] flex flex-wrap gap-2">
          {CHIPS.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-2 rounded-full border border-line bg-panel/80 py-[7px] pl-2.5 pr-3.5 text-sm font-semibold shadow-[0_1px_2px_var(--shadow)] backdrop-blur-sm"
            >
              <Check size={15} className="text-accent" strokeWidth={3} /> {c}
            </motion.li>
          ))}
        </ul>
      </div>
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 1.2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="hidden shrink-0 drop-shadow-[0_22px_28px_var(--glow)] sm:block"
      >
        <HeroArt className="h-auto w-[130px] sm:w-[min(230px,34vw)]" />
      </motion.div>
    </motion.section>
  );
}
