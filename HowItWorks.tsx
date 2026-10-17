"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/components/AppContext";

export function HowItWorks() {
  const { helpOpen } = useApp();
  return (
    <AnimatePresence initial={false}>
      {helpOpen && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
          aria-label="How it works"
        >
          <div className="card mb-5">
            <b>How it works</b>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-mute">
              <li>Paste the job post and your resume, then press Tailor my application.</li>
              <li>Read the tailored resume, cover letter and fit notes. Highlights show what changed.</li>
              <li>Practice with the mock interview, then copy or download your results.</li>
            </ol>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
