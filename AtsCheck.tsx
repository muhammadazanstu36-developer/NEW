"use client";

import { motion } from "framer-motion";
import { Check, ListChecks, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppContext";
import { Button } from "@/components/ui/Button";
import { AIError, askAI } from "@/lib/ai";
import { analyze, type AtsResult } from "@/lib/ats";
import { cn } from "@/lib/cn";

const field = "field !font-sans min-h-[140px] resize-y";

export function AtsCheck() {
  const { job, setJob, resume, setResume } = useApp();
  const [res, setRes] = useState<AtsResult | null>(null);
  const [msg, setMsg] = useState("");
  const [tips, setTips] = useState("");
  const [busy, setBusy] = useState(false);

  const run = () => {
    setTips("");
    if (job.trim().length < 60) return setMsg("Paste the full job post first.");
    if (resume.trim().length < 80) return setMsg("Paste your resume as plain text first.");
    setMsg("");
    setRes(analyze(job, resume));
  };

  const suggest = async () => {
    if (!res || !res.missing.length) return;
    setBusy(true);
    setTips("");
    try {
      const out = await askAI([
        {
          role: "user",
          content:
            "A job post asks for these keywords that are missing from the resume below: " +
            res.missing.join(", ") +
            ".\n\nFor each keyword, say honestly whether the resume shows related experience. If it does, give one short example line the person could add, using ONLY facts already in the resume. If it does not, say 'Skip: the resume does not show this' and do not invent anything. Plain text, short hyphen lists, under 200 words.\n\nRESUME:\n" +
            resume.slice(0, 8000)
        }
      ]);
      setTips(out.trim());
    } catch (e) {
      setTips(e instanceof AIError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const tone = !res ? "" : res.pct >= 70 ? "text-[#16a34a]" : res.pct >= 40 ? "text-accent" : "text-err";

  return (
    <motion.section
      id="ats"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      aria-labelledby="atsh"
      className="card mt-5 min-w-0 scroll-mt-20"
    >
      <h2 id="atsh" className="mb-1.5 flex items-center gap-2.5 text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">
        <ListChecks className="shrink-0 text-accent" size={26} /> ATS keyword check
      </h2>
      <p className="note mb-4 max-w-[68ch]">
        Many employers filter resumes with software that looks for the words in the job post. See which keywords your resume has and which it is missing.
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 min-[860px]:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="ats-job" className="label">Job post</label>
          <textarea id="ats-job" value={job} onChange={(e) => setJob(e.target.value)} placeholder="Paste the full job description" className={field} />
        </div>
        <div className="min-w-0">
          <label htmlFor="ats-resume" className="label">Your resume</label>
          <textarea id="ats-resume" value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume as plain text" className={field} />
        </div>
      </div>
      <p className="note mt-1.5 !text-[13px]">These are the same boxes as in the Tailor form, so what you type here shows there too.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button onClick={run} className="max-sm:w-full"><ListChecks size={17} /> Check my resume</Button>
        {msg && <span role="alert" className="text-sm font-semibold text-err">{msg}</span>}
      </div>

      {res && (
        <div className="mt-5 space-y-5" aria-live="polite">
          <div className="rounded-2xl border border-line bg-panel p-4">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className={cn("text-5xl font-extrabold leading-none", tone)}>{res.pct}%</span>
              <span className="pb-1 text-sm font-semibold text-mute">
                of the job post&apos;s keywords are in your resume ({res.found.length} of {res.found.length + res.missing.length})
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-soft" role="img" aria-label={`${res.pct} percent keyword match`}>
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${res.pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 min-[860px]:grid-cols-2">
            <div className="min-w-0">
              <h3 className="label">Keywords you have</h3>
              <div className="flex flex-wrap gap-1.5">
                {res.found.length ? res.found.map((k) => <span key={k} className="chip-soft"><Check size={13} className="mr-1 inline" />{k}</span>) : <span className="note">None yet.</span>}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="label">Keywords to consider</h3>
              <div className="flex flex-wrap gap-1.5">
                {res.missing.length
                  ? res.missing.map((k) => <span key={k} className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-err">{k}</span>)
                  : <span className="note">Nothing missing. Nice.</span>}
              </div>
              {res.missing.length > 0 && (
                <>
                  <p className="note mt-2 !text-[13px]">Only add a keyword if it is true for you.</p>
                  <Button variant="ghost" onClick={() => void suggest()} disabled={busy} className="mt-2.5 max-sm:w-full">
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Show honest ways to add them
                  </Button>
                </>
              )}
            </div>
          </div>

          {tips && <p className="whitespace-pre-line break-words rounded-2xl bg-soft p-4 text-sm leading-relaxed">{tips}</p>}

          <div>
            <h3 className="label">Resume format</h3>
            <ul className="grid gap-2 min-[860px]:grid-cols-2">
              {res.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2.5 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm">
                  {c.ok ? <Check size={17} className="mt-0.5 shrink-0 text-[#16a34a]" /> : <X size={17} className="mt-0.5 shrink-0 text-err" />}
                  <span className="min-w-0">
                    <b className="block">{c.label}</b>
                    {!c.ok && <span className="text-mute">{c.tip}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="note !text-[13px]">
            This compares words only. It is not the score any real applicant tracking system gives, because each system works differently. Use it as a guide, and write for people first.
          </p>
        </div>
      )}
    </motion.section>
  );
}
