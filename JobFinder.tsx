"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Briefcase, ChevronDown, Clock, ExternalLink, Loader2, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { Button } from "@/components/ui/Button";
import { AIError, askAI } from "@/lib/ai";
import { COUNTRIES, DAY_OPTIONS, SOURCES, timeAgo } from "@/lib/jobs";
import { loadProfile } from "@/lib/profile";
import { titlesPrompt } from "@/lib/prompts";
import { addApp } from "@/lib/tracker";
import { cn } from "@/lib/cn";
import type { JobListing } from "@/types";

export function JobFinder() {
  const { resume, openAuth, setUser, user } = useApp();
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [remote, setRemote] = useState(false);
  const [salaryOnly, setSalaryOnly] = useState(false);
  const [days, setDays] = useState(7);
  const [picked, setPicked] = useState<string[]>(["linkedin", "indeed", "glassdoor"]);
  const [chips, setChips] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [thinking, setThinking] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [tracked, setTracked] = useState<string[]>([]);

  // start from the profile: target job title, city, country and remote preference (only once, only empty boxes)
  const prefilled = useRef<string | null>(null);
  useEffect(() => {
    if (!user || prefilled.current === user.id) return;
    prefilled.current = user.id;
    const pr = loadProfile(user.id);
    setTitle((t) => t || pr.headline);
    setLoc((l) => l || pr.city);
    if (pr.country && pr.country in COUNTRIES) setCountry(pr.country);
    if (pr.setting === "remote") setRemote(true);
  }, [user]);

  const track = (j: JobListing) => {
    if (!user) return;
    addApp(user.id, { company: j.company || "Unknown company", title: j.title, url: j.applyOptions[0]?.url ?? "", salary: j.salary, status: "saved" });
    setTracked((t) => (t.includes(j.id) ? t : [...t, j.id]));
  };

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const suggest = async () => {
    if (resume.trim().length < 80) return setStatus("Paste your resume in the form above first.");
    setThinking(true);
    setStatus("Thinking…");
    try {
      const text = await askAI([{ role: "user", content: titlesPrompt(resume.trim()) }]);
      const m = text.match(/\[[\s\S]*\]/);
      const arr = (JSON.parse(m ? m[0] : "[]") as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 6);
      setChips(arr);
      if (arr.length && !title.trim()) setTitle(arr[0]);
      setStatus(arr.length ? "Tap a title to search for it." : "No suggestions. Try again.");
    } catch (e) {
      setStatus(e instanceof AIError ? e.message : "Something went wrong. Try again.");
    } finally {
      setThinking(false);
    }
  };

  const search = async () => {
    if (!title.trim()) return setNote("Enter a job title first.");
    if (!picked.length) return setNote("Pick at least one job site.");
    setLoading(true);
    setJobs([]);
    setWarnings([]);
    setOpen(null);
    setNote("Searching…");
    try {
      const qs = new URLSearchParams({
        q: title.trim(),
        loc: loc.trim(),
        country,
        remote: remote ? "1" : "0",
        salary: salaryOnly ? "1" : "0",
        days: String(days),
        sources: picked.join(",")
      });
      const r = await fetch(`/api/jobs?${qs}`);
      const j = (await r.json()) as { jobs?: JobListing[]; warnings?: string[]; error?: string };
      if (r.status === 401) {
        setUser(null);
        openAuth("login");
        throw new Error("Please sign in again.");
      }
      if (!r.ok) throw new Error(j.error || "failed");
      const list = j.jobs ?? [];
      setJobs(list);
      setWarnings(j.warnings ?? []);
      const span = DAY_OPTIONS.find((d) => d.value === days)?.label.toLowerCase();
      setNote(list.length ? `${list.length} job${list.length === 1 ? "" : "s"} posted in the ${span}.` : `No jobs found for the ${span}. Try a wider time range, a broader title, or more sites.`);
    } catch (e) {
      setNote(e instanceof Error && e.message !== "failed" ? e.message : "Jobs could not be loaded right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      id="jobs"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      aria-labelledby="jobsh"
      className="card mt-5 min-w-0 scroll-mt-20"
    >
      <h2 id="jobsh" className="mb-1.5 flex items-center gap-2.5 text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">
        <Briefcase className="text-accent" size={26} /> Find jobs and apply
      </h2>
      <p className="note mb-4 max-w-[70ch]">
        Choose the sites you want and see recent jobs right here, with the salary when the listing shows one. Each Apply button goes straight to that job&apos;s application page.
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[860px]:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]">
        <div>
          <label htmlFor="jtitle" className="label">Job title or keywords</label>
          <input id="jtitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !loading && void search()} placeholder="e.g. Marketing Manager" className="field" />
        </div>
        <div>
          <label htmlFor="jloc" className="label">City (optional)</label>
          <input id="jloc" type="text" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Islamabad" className="field" />
        </div>
        <div>
          <label htmlFor="jcountry" className="label">Country</label>
          <select id="jcountry" value={country} onChange={(e) => setCountry(e.target.value)} className="field !font-sans">
            {Object.keys(COUNTRIES).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="jdays" className="label">Posted</label>
          <select id="jdays" value={days} onChange={(e) => setDays(Number(e.target.value))} className="field !font-sans">
            {DAY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="label">Job sites (pick one or more)</legend>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(s.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  on ? "border-accent bg-accent/15 text-accent" : "border-line bg-panel text-mute hover:border-accent"
                )}
              >
                {on ? "✓ " : ""}{s.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="my-3.5 flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-mute">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} className="h-[18px] w-[18px] accent-[rgb(var(--accent))]" />
          Remote jobs only
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-mute">
          <input type="checkbox" checked={salaryOnly} onChange={(e) => setSalaryOnly(e.target.checked)} className="h-[18px] w-[18px] accent-[rgb(var(--accent))]" />
          Only jobs that show a salary
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button onClick={() => void search()} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search jobs
        </Button>
        <Button variant="ghost" onClick={() => void suggest()} disabled={thinking}>
          {thinking ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Suggest titles from my resume
        </Button>
        <span role="status" className="note">{status}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <motion.button key={c} type="button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -1 }} onClick={() => setTitle(c)} className="chip-soft transition-colors hover:bg-accent/20">
            {c}
          </motion.button>
        ))}
      </div>

      <p role="status" className="note mt-4 font-semibold">{note}</p>
      {warnings.map((w) => (
        <p key={w} role="alert" className="note mt-1 !text-[13px] text-err">{w}</p>
      ))}

      <div className="mt-3 grid gap-3">
        <AnimatePresence>
          {jobs.map((j, i) => {
            const expanded = open === j.id;
            return (
              <motion.article
                key={j.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="rounded-[14px] border border-line bg-panel px-4 py-3.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-bold">{j.title}</h3>
                    <p className="mt-0.5 break-words text-[13px] text-mute">{[j.company, j.type].filter(Boolean).join(" · ")}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-mute">
                      {j.location && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {j.location}</span>}
                      {j.postedAt && <span className="inline-flex items-center gap-1"><Clock size={13} /> {timeAgo(j.postedAt)}</span>}
                      <span className={cn("inline-flex items-center gap-1 font-semibold", j.salary ? "text-accent" : "")}>
                        <Banknote size={13} /> {j.salary || "Salary not listed"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {j.sources.map((s) => <span key={s} className="chip-soft !py-0.5 text-xs">{s}</span>)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {j.applyOptions.slice(0, 3).map((o, k) => (
                      <a
                        key={o.url}
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-xl px-[18px] py-[9px] text-center text-sm font-bold no-underline",
                          k === 0 ? "bg-brand text-accent-ink shadow-glow" : "border border-line bg-panel text-ink hover:border-accent"
                        )}
                      >
                        Apply on {o.publisher} <ExternalLink size={13} />
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={() => track(j)}
                      disabled={tracked.includes(j.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-[18px] py-[9px] text-center text-sm font-bold text-accent hover:bg-soft disabled:opacity-70"
                    >
                      {tracked.includes(j.id) ? "Saved to tracker" : "Save to tracker"}
                    </button>
                  </div>
                </div>

                {j.description && (
                  <>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : j.id)}
                      className="mt-2.5 inline-flex items-center gap-1 text-sm font-bold text-accent"
                    >
                      {expanded ? "Hide details" : "Read details"}
                      <ChevronDown size={15} className={cn("transition-transform", expanded && "rotate-180")} />
                    </button>
                    {expanded && (
                      <p className="mt-2 max-h-[320px] overflow-y-auto whitespace-pre-line break-words text-sm leading-relaxed text-mute">
                        {j.description}
                      </p>
                    )}
                  </>
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="note mt-3.5 !text-[13px]">
        LinkedIn, Indeed and Glassdoor listings come through the JSearch aggregator. Remotive, RemoteOK and Arbeitnow publish open feeds (
        <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">Remotive</a>,{" "}
        <a href="https://remoteok.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">RemoteOK</a>,{" "}
        <a href="https://www.arbeitnow.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">Arbeitnow</a>
        ). Salary is shown only when the employer published it.
      </p>
    </motion.section>
  );
}
