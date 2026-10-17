"use client";

import { motion } from "framer-motion";
import { Eye, FileText, ImagePlus, Loader2, Pencil, Plus, RotateCcw, Sparkles, Trash2, UserRound, Wand2, Download } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/components/AppContext";
import { CVPage, PAGE_W } from "@/components/CVPage";
import { Button } from "@/components/ui/Button";
import { AIError, askAI } from "@/lib/ai";
import { cn } from "@/lib/cn";
import { squarePhoto } from "@/lib/image";
import { hasProfileData, loadProfile, profileToCv } from "@/lib/profile";
import {
  COLORS, EMPTY_CV, SAMPLE_CV, TEMPLATES, cvFacts, cvFromAI, cvPrompt, newEdu, newExp, normalizeCV, summaryPrompt,
  type CV, type Edu, type Exp, type TemplateKey
} from "@/lib/cv";

/** Draws the A4 page at full size and scales it to fit the width of its box. */
function ScaledPage({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [h, setH] = useState(1123);

  useEffect(() => {
    const b = box.current;
    const n = inner.current;
    if (!b || !n) return;
    const update = () => {
      if (b.clientWidth > 0) setScale(Math.min(1, b.clientWidth / PAGE_W));
      setH(n.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(b);
    ro.observe(n);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="w-full overflow-hidden rounded-xl border border-line bg-white shadow-card" style={{ height: h * scale }}>
      <div ref={inner} style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}

function Field({ id, label, className, children }: { id: string; label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">{label}</label>
      {children}
    </div>
  );
}

const input = "field !font-sans";


export function CVMaker() {
  const { user, resume, name: formName } = useApp();
  const [cv, setCv] = useState<CV>(EMPTY_CV);
  const [template, setTemplate] = useState<TemplateKey>("modern");
  const [color, setColor] = useState(COLORS[0].value);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [sumBusy, setSumBusy] = useState(false);
  const [sumMsg, setSumMsg] = useState("");
  const [photoMsg, setPhotoMsg] = useState("");
  const [printMsg, setPrintMsg] = useState("");
  const [profMsg, setProfMsg] = useState<{ empty: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const key = user ? `jm_cv_${user.id}` : null;

  useEffect(() => setMounted(true), []);


  // load the saved draft (kept only in this browser)
  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw) as { cv?: Partial<CV>; template?: string; color?: string };
        if (d.cv) setCv(normalizeCV(d.cv));
        if (d.template === "modern" || d.template === "classic" || d.template === "banner") setTemplate(d.template);
        if (d.color && COLORS.some((c) => c.value === d.color)) setColor(d.color);
      }
    } catch {
      /* ignore a broken draft */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!key || !loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ cv, template, color }));
      } catch {
        /* storage full or blocked: the CV still works, it just will not be remembered */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [cv, template, color, key, loaded]);

  const set = <K extends keyof CV>(k: K, v: CV[K]) => setCv((c) => ({ ...c, [k]: v }));
  const setExp = (id: string, p: Partial<Exp>) => setCv((c) => ({ ...c, experience: c.experience.map((e) => (e.id === id ? { ...e, ...p } : e)) }));
  const setEdu = (id: string, p: Partial<Edu>) => setCv((c) => ({ ...c, education: c.education.map((e) => (e.id === id ? { ...e, ...p } : e)) }));

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    setPhotoMsg("");
    try {
      set("photo", await squarePhoto(f));
    } catch (e) {
      setPhotoMsg(e instanceof Error ? e.message : "Could not use that picture.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const buildWithAI = async () => {
    const text = aiText.trim();
    if (text.length < 60) return setAiMsg("Add a little more: paste your resume, or write a few lines about your work, studies and skills.");
    setAiBusy(true);
    setAiMsg("");
    try {
      const out = await askAI([{ role: "user", content: cvPrompt(text) }]);
      const p = cvFromAI(out);
      if (!p) throw new AIError("The AI answer could not be read. Please try again.");
      setCv((c) => ({ ...c, ...p }));
      setAiMsg("Your CV is filled in. Read every field below and correct anything that is wrong.");
    } catch (e) {
      setAiMsg(e instanceof AIError ? e.message : "Something went wrong. Try again.");
    } finally {
      setAiBusy(false);
    }
  };

  const writeSummary = async () => {
    const facts = cvFacts(cv);
    if (facts.length < 50) return setSumMsg("Fill in your experience, education or skills first.");
    setSumBusy(true);
    setSumMsg("");
    try {
      const out = await askAI([{ role: "user", content: summaryPrompt(facts) }]);
      set("summary", out.trim().replace(/^["“]|["”]$/g, ""));
      setSumMsg("Written from what you typed. Edit it so it sounds like you.");
    } catch (e) {
      setSumMsg(e instanceof AIError ? e.message : "Something went wrong. Try again.");
    } finally {
      setSumBusy(false);
    }
  };

  const downloadCv = () => {
    if (!cv.name.trim()) {
      setPrintMsg("Add your name first.");
      setView("edit");
      return;
    }
    setPrintMsg("");
    const old = document.title;
    document.title = `${cv.name.trim()} - CV`;
    const restore = () => {
      document.title = old;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  /** Copies the profile into the CV, but only into fields that are still empty. */
  const fillFromProfile = () => {
    if (!user) return;
    const prof = loadProfile(user.id);
    if (!hasProfileData(prof)) {
      setProfMsg({ empty: true, text: "Your profile is empty." });
      return;
    }
    const from = profileToCv(prof, user) as Record<string, unknown>;
    setCv((c) => {
      const next = { ...c } as Record<string, unknown>;
      for (const k of Object.keys(from)) {
        const v = from[k];
        if (typeof v === "string" && v && !String((c as unknown as Record<string, unknown>)[k] ?? "").trim()) next[k] = v;
      }
      return next as unknown as CV;
    });
    setProfMsg({ empty: false, text: "Filled the empty fields from your profile. Anything you already wrote was left as it is." });
  };

  const clearAll = () => {
    if (!window.confirm("Clear your whole CV? This cannot be undone.")) return;
    setCv({ ...EMPTY_CV, experience: [newExp()], education: [newEdu()] });
    setAiText("");
    setAiMsg("");
  };

  return (
    <motion.section
      id="cv"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      aria-labelledby="cvh"
      className="card mt-5 min-w-0 scroll-mt-20"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="cvh" className="mb-1.5 flex items-center gap-2.5 text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">
            <FileText className="shrink-0 text-accent" size={26} /> CV maker
          </h2>
          <p className="note max-w-[64ch]">
            Build a clean CV with your photo. Type your details, or paste your resume and let the AI fill the form. Then download it as a PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={fillFromProfile}><UserRound size={15} /> From profile</Button>
          <Button variant="ghost" onClick={() => setCv(normalizeCV(SAMPLE_CV))}><Wand2 size={15} /> Example</Button>
          <Button variant="ghost" onClick={clearAll}><RotateCcw size={15} /> Clear</Button>
        </div>
      </div>

      {profMsg && (
        <p role="status" className="note mb-3 font-semibold">
          {profMsg.text}{" "}
          {profMsg.empty && <a href="/profile" className="font-bold text-accent">Fill in your profile</a>}
        </p>
      )}

      {/* phone: switch between the form and the preview */}
      <div role="tablist" aria-label="CV view" className="mb-4 flex gap-1 rounded-2xl bg-accent/10 p-1 min-[960px]:hidden">
        {([["edit", "Edit", Pencil], ["preview", "Preview", Eye]] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-[11px] px-3 py-2.5 text-sm font-semibold transition-colors", view === k ? "bg-panel text-accent shadow-[0_1px_3px_var(--shadow)]" : "text-mute")}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 min-[960px]:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        {/* ---------------- form ---------------- */}
        <div className={cn("min-w-0 space-y-5", view === "preview" && "max-[959px]:hidden")}>
          <div className="rounded-2xl border border-accent/25 bg-accent/5 p-3.5 sm:p-4">
            <label htmlFor="ai-src" className="label !mb-1"><Sparkles size={16} className="text-accent" /> Let the AI fill it in</label>
            <p className="note mb-2">Paste your resume or write a few lines about your jobs, studies and skills. The AI uses only what you write.</p>
            <textarea id="ai-src" rows={5} value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="Paste your resume or notes here" className={cn(input, "min-h-[110px] resize-y")} />
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Button onClick={() => void buildWithAI()} disabled={aiBusy} className="max-sm:w-full">
                {aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Build my CV
              </Button>
              <Button variant="ghost" onClick={() => setAiText(resume)} disabled={!resume.trim()} className="max-sm:w-full">Use my resume from above</Button>
            </div>
            {aiMsg && <p role="status" className="mt-2 text-sm font-semibold">{aiMsg}</p>}
          </div>

          <fieldset>
            <legend className="label">Look</legend>
            <div role="radiogroup" aria-label="Template" className="mb-3 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={template === t.key}
                  onClick={() => setTemplate(t.key)}
                  className={cn("rounded-full border px-4 py-2 text-sm font-bold transition-colors", template === t.key ? "border-accent bg-accent/15 text-accent" : "border-line bg-panel text-mute hover:border-accent")}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColor(c.value)}
                  style={{ background: c.value }}
                  className={cn("h-9 w-9 rounded-full border-2 border-white shadow transition-transform", color === c.value ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-panel" : "hover:scale-105")}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Photo</legend>
            <div className="flex flex-wrap items-center gap-3.5">
              <div className={cn("grid h-[84px] w-[84px] shrink-0 place-items-center overflow-hidden border border-line bg-soft text-mute", cv.photoShape === "circle" ? "rounded-full" : "rounded-xl")}>
                {cv.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cv.photo} alt="Your photo" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus size={26} />
                )}
              </div>
              <div className="flex min-w-0 flex-wrap gap-2">
                <input ref={fileRef} id="cv-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
                <Button variant="ghost" onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> {cv.photo ? "Change photo" : "Add photo"}</Button>
                {cv.photo && <Button variant="ghost" onClick={() => set("photo", "")}><Trash2 size={15} /> Remove</Button>}
                <Button variant="ghost" onClick={() => set("photoShape", cv.photoShape === "circle" ? "square" : "circle")}>{cv.photoShape === "circle" ? "Make square" : "Make round"}</Button>
              </div>
            </div>
            <p className="note mt-2 !text-[13px]">Use a clear photo with your face in the middle. It is cropped to a square and stays in your browser. In the US, UK and Canada employers usually prefer a CV without a photo, so check what fits the country you apply to.</p>
            {photoMsg && <p role="alert" className="mt-1 text-sm font-semibold text-err">{photoMsg}</p>}
          </fieldset>

          <fieldset>
            <legend className="label">About you</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="cv-name" label="Full name"><input id="cv-name" className={input} autoComplete="name" value={cv.name} onChange={(e) => set("name", e.target.value)} placeholder={formName || "Your name"} /></Field>
              <Field id="cv-title" label="Job title"><input id="cv-title" className={input} value={cv.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Marketing Executive" /></Field>
              <Field id="cv-email" label="Email"><input id="cv-email" type="email" className={input} autoComplete="email" value={cv.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field id="cv-phone" label="Phone"><input id="cv-phone" type="tel" className={input} autoComplete="tel" value={cv.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field id="cv-loc" label="City, country"><input id="cv-loc" className={input} value={cv.location} onChange={(e) => set("location", e.target.value)} /></Field>
              <Field id="cv-links" label="Links (one per line)"><textarea id="cv-links" rows={2} className={cn(input, "resize-y")} value={cv.links} onChange={(e) => set("links", e.target.value)} placeholder="linkedin.com/in/yourname" /></Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Profile summary</legend>
            <textarea id="cv-sum" aria-label="Profile summary" rows={4} className={cn(input, "min-h-[100px] resize-y")} value={cv.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Two or three sentences about you" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => void writeSummary()} disabled={sumBusy}>
                {sumBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Write it for me
              </Button>
              {sumMsg && <span role="status" className="note">{sumMsg}</span>}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Work experience</legend>
            <div className="space-y-3">
              {cv.experience.map((e, i) => (
                <div key={e.id} className="rounded-2xl border border-line bg-panel p-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id={`x-role-${e.id}`} label="Job title"><input id={`x-role-${e.id}`} className={input} value={e.role} onChange={(ev) => setExp(e.id, { role: ev.target.value })} /></Field>
                    <Field id={`x-co-${e.id}`} label="Company"><input id={`x-co-${e.id}`} className={input} value={e.company} onChange={(ev) => setExp(e.id, { company: ev.target.value })} /></Field>
                    <Field id={`x-st-${e.id}`} label="From"><input id={`x-st-${e.id}`} className={input} value={e.start} onChange={(ev) => setExp(e.id, { start: ev.target.value })} placeholder="e.g. Jan 2023" /></Field>
                    <Field id={`x-en-${e.id}`} label="To"><input id={`x-en-${e.id}`} className={input} value={e.end} onChange={(ev) => setExp(e.id, { end: ev.target.value })} placeholder="e.g. Present" /></Field>
                  </div>
                  <Field id={`x-bu-${e.id}`} label="What you did (one achievement per line)" className="mt-3">
                    <textarea id={`x-bu-${e.id}`} rows={4} className={cn(input, "resize-y")} value={e.bullets} onChange={(ev) => setExp(e.id, { bullets: ev.target.value })} />
                  </Field>
                  {cv.experience.length > 1 && (
                    <Button variant="ghost" className="mt-2.5" aria-label={`Remove job ${i + 1}`} onClick={() => set("experience", cv.experience.filter((x) => x.id !== e.id))}><Trash2 size={15} /> Remove this job</Button>
                  )}
                </div>
              ))}
            </div>
            {cv.experience.length < 8 && <Button variant="ghost" className="mt-2.5" onClick={() => set("experience", [...cv.experience, newExp()])}><Plus size={15} /> Add a job</Button>}
          </fieldset>

          <fieldset>
            <legend className="label">Education</legend>
            <div className="space-y-3">
              {cv.education.map((e, i) => (
                <div key={e.id} className="rounded-2xl border border-line bg-panel p-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id={`e-dg-${e.id}`} label="Degree or course"><input id={`e-dg-${e.id}`} className={input} value={e.degree} onChange={(ev) => setEdu(e.id, { degree: ev.target.value })} /></Field>
                    <Field id={`e-sc-${e.id}`} label="School or university"><input id={`e-sc-${e.id}`} className={input} value={e.school} onChange={(ev) => setEdu(e.id, { school: ev.target.value })} /></Field>
                    <Field id={`e-st-${e.id}`} label="From"><input id={`e-st-${e.id}`} className={input} value={e.start} onChange={(ev) => setEdu(e.id, { start: ev.target.value })} /></Field>
                    <Field id={`e-en-${e.id}`} label="To"><input id={`e-en-${e.id}`} className={input} value={e.end} onChange={(ev) => setEdu(e.id, { end: ev.target.value })} /></Field>
                  </div>
                  {cv.education.length > 1 && (
                    <Button variant="ghost" className="mt-2.5" aria-label={`Remove education ${i + 1}`} onClick={() => set("education", cv.education.filter((x) => x.id !== e.id))}><Trash2 size={15} /> Remove</Button>
                  )}
                </div>
              ))}
            </div>
            {cv.education.length < 5 && <Button variant="ghost" className="mt-2.5" onClick={() => set("education", [...cv.education, newEdu()])}><Plus size={15} /> Add education</Button>}
          </fieldset>

          <fieldset>
            <legend className="label">Skills, languages, certificates</legend>
            <div className="grid gap-3">
              <Field id="cv-skills" label="Skills (separate with commas)"><textarea id="cv-skills" rows={2} className={cn(input, "resize-y")} value={cv.skills} onChange={(e) => set("skills", e.target.value)} /></Field>
              <Field id="cv-lang" label="Languages (separate with commas)"><input id="cv-lang" className={input} value={cv.languages} onChange={(e) => set("languages", e.target.value)} /></Field>
              <Field id="cv-cert" label="Certificates (separate with commas)"><input id="cv-cert" className={input} value={cv.certs} onChange={(e) => set("certs", e.target.value)} /></Field>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2.5 min-[960px]:hidden">
            <Button onClick={() => { setView("preview"); document.getElementById("cv")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="max-sm:w-full"><Eye size={17} /> See my CV</Button>
          </div>
        </div>

        {/* ---------------- preview ---------------- */}
        <div className={cn("min-w-0 min-[960px]:sticky min-[960px]:top-[76px]", view === "edit" && "max-[959px]:hidden")}>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <Button onClick={downloadCv} className="max-sm:w-full"><Download size={17} /> Download CV</Button>
            {printMsg && <span role="alert" className="text-sm font-semibold text-err">{printMsg}</span>}
          </div>
          <ScaledPage>
            <CVPage cv={cv} template={template} color={color} />
          </ScaledPage>
          <p className="note mt-3 !text-[13px]">
            In the window that opens, choose Save as PDF. One page is best; very long CVs run onto a second page.
          </p>
        </div>
      </div>

      {/* hidden on screen; the browser prints only this copy (see globals.css) */}
      {mounted && createPortal(<div id="cv-print-root"><CVPage cv={cv} template={template} color={color} /></div>, document.body)}

    </motion.section>
  );
}
