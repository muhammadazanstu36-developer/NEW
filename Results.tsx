"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppContext";
import { EmptyArt } from "@/components/Illustrations";
import { MockInterview } from "@/components/MockInterview";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { plain, splitHighlights } from "@/lib/parse";
import type { TabKey } from "@/types";

const TABS: { key: TabKey; label: string }[] = [
  { key: "resume", label: "Resume" },
  { key: "letter", label: "Cover letter" },
  { key: "fit", label: "Fit notes" },
  { key: "interview", label: "Mock interview" }
];

export function Results() {
  const { tab, setTab, sections, score, busy } = useApp();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  const text = tab === "interview" ? "" : sections[tab];
  const hasAny = Boolean(sections.resume || sections.letter || sections.fit);

  const copy = async () => {
    if (!text) return setNote("Nothing to copy yet.");
    try {
      await navigator.clipboard.writeText(plain(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote("Copy was blocked. Select the text and copy it.");
      setTimeout(() => setNote(""), 2500);
    }
  };

  const download = () => {
    const body = `TAILORED RESUME\n\n${plain(sections.resume)}\n\n----------\n\nCOVER LETTER\n\n${plain(sections.letter)}\n\n----------\n\nFIT NOTES\n\n${plain(sections.fit)}\n`;
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-application.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      id="results"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
      aria-label="Results"
      className="card min-w-0 scroll-mt-20"
    >
      {score && <ScoreCard score={score} />}

      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-accent/10 p-1">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex-1 whitespace-nowrap rounded-[11px] px-3 py-2.5 text-sm font-semibold transition-colors max-sm:flex-none",
                on ? "bg-panel text-accent shadow-[0_1px_3px_var(--shadow)]" : "text-mute hover:text-ink"
              )}
            >
              {t.label}
              {on && (
                <motion.span layoutId="tab-underline" className="absolute inset-x-[28%] bottom-1 h-[3px] rounded bg-brand" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${tab}-${text ? "text" : busy ? "busy" : "empty"}`}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "interview" ? (
            <MockInterview />
          ) : text ? (
            <div className="min-h-[260px] whitespace-pre-wrap break-words rounded-2xl border border-line bg-panel p-4 font-serif text-base leading-[1.65] shadow-[0_1px_2px_var(--shadow),0_18px_36px_-22px_var(--glow)] sm:p-6 sm:text-[17px]">
              {splitHighlights(text).map((p, i) => (p.hl ? <span key={i} className="hl">{p.text}</span> : <span key={i}>{p.text}</span>))}
            </div>
          ) : busy ? (
            <div className="min-h-[260px] py-2">
              <div className="grid gap-3 pb-4">
                {[52, 100, 93, 80, 100, 66, 88].map((w, i) => <i key={i} className="skeleton block" style={{ width: `${w}%` }} />)}
              </div>
              <p className="text-center text-mute">Writing your application…</p>
            </div>
          ) : (
            <div className="grid min-h-[260px] place-content-center justify-items-center gap-3 pt-6 text-center text-mute">
              <EmptyArt className="h-auto w-[140px] drop-shadow-[0_14px_18px_var(--glow)]" />
              <p>Your tailored resume, cover letter and fit notes will appear here.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {tab !== "interview" && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={copy} className="max-sm:flex-1">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy this tab"}
          </Button>
          {hasAny && (
            <Button variant="ghost" onClick={download} className="max-sm:flex-1">
              <Download size={16} /> Download all as text
            </Button>
          )}
          <span role="status" className="note">{note}</span>
        </div>
      )}
    </motion.section>
  );
}
