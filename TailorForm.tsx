"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Tone } from "@/types";

const TONES: { label: string; value: Tone }[] = [
  { label: "Warm", value: "warm and professional" },
  { label: "Formal", value: "formal and concise" },
  { label: "Direct", value: "confident and direct" }
];

export function TailorForm() {
  const { job, setJob, resume, setResume, name, setName, tone, setTone, busy, error, tailor, loadExample } = useApp();

  return (
    <motion.section
      id="tailor"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
      aria-label="Your details"
      className="card min-w-0 scroll-mt-20"
    >
      <div className="mb-4">
        <label htmlFor="job" className="label"><span className="badge">1</span> Job post</label>
        <textarea id="job" rows={7} value={job} onChange={(e) => setJob(e.target.value)} placeholder="Paste the full job description here" className="field min-h-[150px] resize-y" />
      </div>
      <div className="mb-4">
        <label htmlFor="resume" className="label"><span className="badge">2</span> Your resume</label>
        <textarea id="resume" rows={7} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your current resume as plain text" className="field min-h-[150px] resize-y" />
      </div>
      <div className="mb-4">
        <label htmlFor="name" className="label"><span className="badge">3</span> Your name (for the cover letter)</label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="field" />
      </div>
      <div className="mb-5">
        <span id="tone-label" className="label"><span className="badge">4</span> Cover letter tone</span>
        <div role="radiogroup" aria-labelledby="tone-label" className="flex flex-wrap gap-2">
          {TONES.map((t) => {
            const on = tone === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTone(t.value)}
                className={cn(
                  "relative rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  on ? "border-transparent text-accent-ink" : "border-line bg-panel hover:border-accent"
                )}
              >
                {on && <motion.span layoutId="tone-pill" className="absolute inset-0 rounded-full bg-brand shadow-glow" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button onClick={tailor} disabled={busy} className="max-sm:w-full">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {busy ? "Tailoring…" : "Tailor my application"}
        </Button>
        <Button variant="ghost" onClick={loadExample} disabled={busy}>
          <Wand2 size={16} /> Try an example
        </Button>
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-3 font-semibold text-err">
          {error}
        </motion.p>
      )}
    </motion.section>
  );
}
