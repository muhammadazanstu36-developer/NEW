"use client";

import { animate, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { MatchScore } from "@/types";

const C = 2 * Math.PI * 44;

export function ScoreCard({ score }: { score: MatchScore }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const ctl = animate(prev.current, score.score, {
      duration: 1,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => setN(Math.round(v))
    });
    prev.current = score.score;
    return () => ctl.stop();
  }, [score.score]);

  const label = score.score >= 75 ? "Strong match" : score.score >= 55 ? "Good match, room to grow" : "A stretch role";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      className="mb-4 flex flex-col items-start gap-3 rounded-[18px] border border-line bg-panel p-[18px] shadow-[0_1px_2px_var(--shadow),0_18px_36px_-24px_var(--glow)] sm:flex-row sm:items-center sm:gap-[22px]"
    >
      <div className="relative h-[116px] w-[116px] shrink-0 drop-shadow-[0_8px_14px_var(--glow)]">
        <svg viewBox="0 0 110 110" width="116" height="116" role="img" aria-label={`Match score ${score.score} out of 100`}>
          <defs>
            <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "rgb(var(--accent))" }} />
              <stop offset="1" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle cx="55" cy="55" r="44" fill="none" strokeWidth="9" className="stroke-line" />
          <motion.circle
            cx="55" cy="55" r="44" fill="none" stroke="url(#score-grad)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} transform="rotate(-90 55 55)"
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - score.score / 100) }}
            transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center leading-none">
          <b className="text-[34px] font-extrabold tracking-tight">{n}</b>
          <span className="mt-[3px] text-[11px] text-mute">out of 100</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 text-xl font-extrabold tracking-tight">{label}</div>
        <p className="note">An AI estimate of how well your current resume fits this job.</p>
        <div className="mb-1.5 mt-3 text-[13px] font-bold text-mute">Already strong</div>
        <div className="flex flex-wrap gap-1.5">
          {score.matched.map((m) => <span key={m} className="chip-soft">{m}</span>)}
        </div>
        <div className="mb-1.5 mt-3 text-[13px] font-bold text-mute">Worth addressing</div>
        <div className="flex flex-wrap gap-1.5">
          {score.gaps.map((g) => <span key={g} className="rounded-full bg-hl/60 px-3 py-1 text-[13px] font-semibold text-ink">{g}</span>)}
        </div>
      </div>
    </motion.div>
  );
}
