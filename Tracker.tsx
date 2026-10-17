"use client";

import { motion } from "framer-motion";
import { ClipboardList, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EVENT, STATUSES, loadApps, saveApps, stats, todayStr, uid, type App, type Status } from "@/lib/tracker";

type Draft = Omit<App, "id">;
const blank = (): Draft => ({ company: "", title: "", url: "", salary: "", status: "applied", date: todayStr(), notes: "" });
const input = "field !font-sans";
const info = (k: Status) => STATUSES.find((s) => s.key === k) ?? STATUSES[1];
const safe = (u: string) => (/^https?:\/\//i.test(u) ? u : "");

function Dot({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}

export function Tracker() {
  const { user } = useApp();
  const [apps, setApps] = useState<App[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [form, setForm] = useState<{ id: string | null; d: Draft } | null>(null);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");

  const uidKey = user?.id ?? null;

  useEffect(() => {
    if (!uidKey) return;
    const read = () => setApps(loadApps(uidKey));
    read();
    setLoaded(true);
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, [uidKey]);

  const commit = (next: App[]) => {
    setApps(next);
    if (uidKey && !saveApps(uidKey, next)) setWarn("Your browser would not save this. Private mode or full storage can cause that.");
    else setWarn("");
  };

  const st = useMemo(() => stats(apps), [apps]);
  const max = Math.max(1, ...st.weeks.map((w) => w.n));
  const shown = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  const submit = () => {
    if (!form) return;
    const d = { ...form.d, company: form.d.company.trim(), title: form.d.title.trim(), url: form.d.url.trim(), salary: form.d.salary.trim() };
    if (!d.company || !d.title) return setErr("Enter the company and the job title.");
    if (d.url && !/^https?:\/\//i.test(d.url)) d.url = `https://${d.url}`;
    setErr("");
    commit(form.id ? apps.map((a) => (a.id === form.id ? { ...d, id: a.id } : a)) : [{ ...d, id: uid() }, ...apps]);
    setForm(null);
  };

  const setStatus = (id: string, status: Status) => commit(apps.map((a) => (a.id === id ? { ...a, status } : a)));
  const remove = (a: App) => {
    if (window.confirm(`Delete "${a.title}" at ${a.company}?`)) commit(apps.filter((x) => x.id !== a.id));
  };
  const upd = <K extends keyof Draft>(k: K, v: Draft[K]) => setForm((f) => (f ? { ...f, d: { ...f.d, [k]: v } } : f));

  return (
    <motion.section
      id="tracker"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      aria-labelledby="trh"
      className="card mt-5 min-w-0 scroll-mt-20"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="trh" className="mb-1.5 flex items-center gap-2.5 text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">
            <ClipboardList className="shrink-0 text-accent" size={26} /> Job tracker
          </h2>
          <p className="note max-w-[64ch]">Keep every application in one place and see how your search is going. Use “Save to tracker” on any job in Find jobs.</p>
        </div>
        <Button onClick={() => { setErr(""); setForm({ id: null, d: blank() }); }} className="max-sm:w-full"><Plus size={17} /> Add application</Button>
      </div>

      {/* ---------------- dashboard ---------------- */}
      <div className="grid grid-cols-2 gap-3 min-[700px]:grid-cols-5">
        {[
          ["Total", st.total],
          ["Applied", st.sent],
          ["Interviews", st.counts.interview],
          ["Offers", st.counts.offer],
          ["Interview rate", `${st.interviewRate}%`]
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-line bg-panel px-3.5 py-3">
            <div className="text-[13px] font-semibold text-mute">{label}</div>
            <div className="text-2xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 min-[860px]:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-line bg-panel p-4">
          <h3 className="label">Where your applications are</h3>
          {st.total ? (
            <>
              <div className="flex h-3.5 overflow-hidden rounded-full bg-soft" role="img" aria-label="Applications by status">
                {STATUSES.map((s) => (st.counts[s.key] ? <div key={s.key} title={`${s.label}: ${st.counts[s.key]}`} style={{ width: `${(st.counts[s.key] / st.total) * 100}%`, background: s.color }} /> : null))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                {STATUSES.map((s) => (
                  <li key={s.key} className="flex items-center gap-2"><Dot color={s.color} /> {s.label} <b className="ml-auto">{st.counts[s.key]}</b></li>
                ))}
              </ul>
            </>
          ) : <p className="note">Add your first application to see this.</p>}
        </div>

        <div className="min-w-0 rounded-2xl border border-line bg-panel p-4">
          <h3 className="label">Applications sent per week</h3>
          <div className="flex h-[110px] items-end gap-1.5 sm:gap-2" role="img" aria-label="Applications sent in each of the last 8 weeks">
            {st.weeks.map((w, i) => (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[11px] font-bold">{w.n || ""}</span>
                <div className="w-full rounded-t-md bg-brand" style={{ height: `${Math.max(w.n ? 6 : 2, (w.n / max) * 78)}px`, opacity: w.n ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5 sm:gap-2">
            {st.weeks.map((w, i) => <span key={i} className="min-w-0 flex-1 truncate text-center text-[10px] text-mute">{w.label}</span>)}
          </div>
        </div>
      </div>
      <p className="note mt-2 !text-[13px]">Interview rate counts applications now marked Interview or Offer, out of all you have sent. Your list is saved in this browser only.</p>
      {warn && <p role="alert" className="mt-1 text-sm font-semibold text-err">{warn}</p>}

      {/* ---------------- add / edit ---------------- */}
      {form && (
        <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-3.5 sm:p-4">
          <h3 className="mb-3 text-lg font-extrabold">{form.id ? "Edit application" : "Add application"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="t-co" className="mb-1 block text-sm font-bold">Company</label><input id="t-co" className={input} value={form.d.company} onChange={(e) => upd("company", e.target.value)} /></div>
            <div><label htmlFor="t-ti" className="mb-1 block text-sm font-bold">Job title</label><input id="t-ti" className={input} value={form.d.title} onChange={(e) => upd("title", e.target.value)} /></div>
            <div><label htmlFor="t-st" className="mb-1 block text-sm font-bold">Status</label>
              <select id="t-st" className={input} value={form.d.status} onChange={(e) => upd("status", e.target.value as Status)}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select></div>
            <div><label htmlFor="t-dt" className="mb-1 block text-sm font-bold">Date</label><input id="t-dt" type="date" className={input} value={form.d.date} onChange={(e) => upd("date", e.target.value || todayStr())} /></div>
            <div><label htmlFor="t-sa" className="mb-1 block text-sm font-bold">Salary (optional)</label><input id="t-sa" className={input} value={form.d.salary} onChange={(e) => upd("salary", e.target.value)} /></div>
            <div><label htmlFor="t-ur" className="mb-1 block text-sm font-bold">Link to the job (optional)</label><input id="t-ur" className={input} value={form.d.url} onChange={(e) => upd("url", e.target.value)} placeholder="https://" /></div>
          </div>
          <div className="mt-3"><label htmlFor="t-no" className="mb-1 block text-sm font-bold">Notes (optional)</label><textarea id="t-no" rows={3} className={cn(input, "resize-y")} value={form.d.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Contact name, interview date, follow-up plan" /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <Button onClick={submit} className="max-sm:flex-1">{form.id ? "Save changes" : "Add to tracker"}</Button>
            <Button variant="ghost" onClick={() => { setForm(null); setErr(""); }} className="max-sm:flex-1">Cancel</Button>
            {err && <span role="alert" className="text-sm font-semibold text-err">{err}</span>}
          </div>
        </div>
      )}

      {/* ---------------- list ---------------- */}
      <div role="radiogroup" aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2">
        {([{ key: "all", label: `All (${st.total})` }, ...STATUSES.map((s) => ({ key: s.key, label: `${s.label} (${st.counts[s.key]})` }))] as { key: Status | "all"; label: string }[]).map((f) => (
          <button
            key={f.key}
            type="button"
            role="radio"
            aria-checked={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors", filter === f.key ? "border-accent bg-accent/15 text-accent" : "border-line bg-panel text-mute hover:border-accent")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3">
        {loaded && !shown.length && (
          <p className="note rounded-2xl border border-dashed border-line p-5 text-center">
            {apps.length ? "Nothing with this status yet." : "No applications yet. Add one, or save a job from Find jobs."}
          </p>
        )}
        {shown.map((a) => {
          const s = info(a.status);
          const link = safe(a.url);
          return (
            <article key={a.id} className="rounded-[14px] border border-line bg-panel px-4 py-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-bold">{a.title}</h3>
                  <p className="break-words text-[13px] text-mute">{a.company}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-mute">
                    <span>{a.date}</span>
                    {a.salary && <span className="font-semibold text-accent">{a.salary}</span>}
                    {link && <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-accent">Open job <ExternalLink size={12} /></a>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Dot color={s.color} />
                  <label className="sr-only" htmlFor={`st-${a.id}`}>Status for {a.title}</label>
                  <select id={`st-${a.id}`} value={a.status} onChange={(e) => setStatus(a.id, e.target.value as Status)} className="field !w-auto !py-1.5 !font-sans text-sm">
                    {STATUSES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                  </select>
                </div>
              </div>
              {a.notes && <p className="mt-2 whitespace-pre-line break-words text-sm text-mute">{a.notes}</p>}
              <div className="mt-2.5 flex gap-2">
                <Button variant="ghost" aria-label={`Edit ${a.title}`} onClick={() => { setErr(""); const { id, ...d } = a; setForm({ id, d }); document.getElementById("tracker")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><Pencil size={14} /> Edit</Button>
                <Button variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => remove(a)}><Trash2 size={14} /> Delete</Button>
              </div>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
