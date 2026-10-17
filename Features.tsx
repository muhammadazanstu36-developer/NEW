"use client";

import { motion } from "framer-motion";
import { FeatureInterviewArt, FeatureScoreArt, FeatureTailorArt } from "@/components/Illustrations";

const FEATURES = [
  { Art: FeatureTailorArt, title: "Tailored resume and cover letter", text: "Rewritten for the role. Changed phrases are highlighted, and nothing is added that your resume does not say." },
  { Art: FeatureScoreArt, title: "An honest match score", text: "See how well you fit, what you already cover, and what to address before you apply." },
  { Art: FeatureInterviewArt, title: "Interview practice", text: "Answer five questions built from the job and get feedback on each one." }
];

export function Features() {
  return (
    <section aria-labelledby="feath" className="mt-9">
      <h2 id="feath" className="mb-4 text-[clamp(22px,3vw,30px)] font-extrabold tracking-tight">Everything for one application</h2>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] min-[860px]:grid-cols-3">
        {FEATURES.map(({ Art, title, text }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="card"
          >
            <Art className="mx-auto mb-3.5 block h-auto w-full max-w-[200px] drop-shadow-[0_14px_18px_var(--glow)] min-[860px]:max-w-[230px]" />
            <h3 className="mb-1.5 text-lg font-bold tracking-tight">{title}</h3>
            <p className="text-[15px] text-mute">{text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
