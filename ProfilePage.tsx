"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Camera, Check, Download, FileText, KeyRound, Loader2, LogOut, Lock, Plus, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { squarePhoto } from "@/lib/image";
import { COUNTRIES } from "@/lib/jobs";
import {
  ABOUT_MAX, EMPTY_PROFILE, LEVELS, SETTINGS, clearProfile, completeness, loadProfile, saveProfile, skillList,
  type Level, type Profile, type Setting
} from "@/lib/profile";
import { loadApps } from "@/lib/tracker";
import type { User } from "@/types";

const input = "field !font-sans";

/** POSTs JSON and reads the answer even when the server sends something that is not JSON. */
async function post(url: string, body: unknown): Promise<{ ok: boolean; error: string; data: Record<string, unknown> }> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const text = await r.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = {};
    }
    const error = r.ok ? "" : typeof data.error === "string" ? data.error : "The server could not complete this request. Please try again.";
    return { ok: r.ok, error, data };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again.", data: {} };
  }
}

function Field({ id, label, hint, className, children }: { id: string; label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">{label}</label>
      {children}
      {hint && <p className="note mt-1">{hint}</p>}
    </div>
  );
}

function Notice({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p role={ok ? "status" : "alert"} className={cn("mt-2.5 flex items-start gap-1.5 text-sm font-semibold", ok ? "text-accent" : "text-err")}>
      {ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <X size={16} className="mt-0.5 shrink-0" />} <span className="min-w-0">{children}</span>
    </p>
  );
}

export function ProfilePage() {
  const { user, authReady, openAuth } = useApp();

  if (!authReady) {
    return (
      <div className="card grid min-h-[260px] place-items-center">
        <Loader2 className="animate-spin text-accent" />
      </div>
    );
  }
  if (!user) {
    return (
      <section className="card mx-auto flex max-w-xl flex-col items-center gap-3 py-14 text-center">
        <Lock className="text-accent" size={30} />
        <h1 className="text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">Sign in to see your profile</h1>
        <p className="note max-w-[46ch]">Your profile keeps your photo, job target and skills in one place, and fills them into your CV and job search.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Button onClick={() => openAuth("login")}>Sign in</Button>
          <Button variant="ghost" onClick={() => openAuth("register")}>Create an account</Button>
        </div>
      </section>
    );
  }
  return <Profile user={user} />;
}

function Profile({ user }: { user: User }) {
  const { setUser, logout } = useApp();
  const [p, setP] = useState<Profile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [skillDraft, setSkillDraft] = useState("");
  const [photoMsg, setPhotoMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // account
  const [nm, setNm] = useState(user.name);
  const [nmBusy, setNmBusy] = useState(false);
  const [nmMsg, setNmMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // data on this device
  const [stats, setStats] = useState({ apps: 0, cv: false });
  const [dataMsg, setDataMsg] = useState("");

  const refreshStats = () => {
    try {
      setStats({ apps: loadApps(user.id).length, cv: !!localStorage.getItem(`jm_cv_${user.id}`) });
    } catch {
      setStats({ apps: 0, cv: false });
    }
  };

  useEffect(() => {
    setP(loadProfile(user.id));
    setLoaded(true);
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => setNm(user.name), [user.name]);

  // autosave (kept only in this browser)
  const first = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => setSaveState(saveProfile(user.id, p) ? "saved" : "failed"), 500);
    return () => clearTimeout(t);
  }, [p, loaded, user.id]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const skills = useMemo(() => skillList(p.skills), [p.skills]);
  const done = useMemo(() => completeness(p), [p]);

  const addSkills = (raw: string) => {
    const add = skillList(raw);
    if (!add.length) return;
    set("skills", skillList([...skills, ...add].join(",")).slice(0, 30).join(", "));
    setSkillDraft("");
  };
  const removeSkill = (s: string) => set("skills", skills.filter((x) => x !== s).join(", "));

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    setPhotoMsg("");
    try {
      set("photo", await squarePhoto(f, 360));
    } catch (e) {
      setPhotoMsg(e instanceof Error ? e.message : "Could not use that picture.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveName = async () => {
    setNmMsg(null);
    const name = nm.trim().replace(/\s+/g, " ");
    if (name.length < 2) return setNmMsg({ ok: false, text: "Enter your name (at least 2 letters)." });
    if (name === user.name) return setNmMsg({ ok: true, text: "That is already your name." });
    setNmBusy(true);
    const r = await post("/api/auth/update", { name });
    setNmBusy(false);
    if (!r.ok) return setNmMsg({ ok: false, text: r.error });
    const u = r.data.user as User | undefined;
    if (u) setUser(u);
    setNmMsg({ ok: true, text: "Name updated." });
  };

  const savePassword = async () => {
    setPwMsg(null);
    if (!cur) return setPwMsg({ ok: false, text: "Enter your current password." });
    if (nw.length < 8) return setPwMsg({ ok: false, text: "The new password must be at least 8 characters." });
    if (nw !== nw2) return setPwMsg({ ok: false, text: "The two new passwords do not match." });
    setPwBusy(true);
    const r = await post("/api/auth/password", { current: cur, next: nw });
    setPwBusy(false);
    if (!r.ok) return setPwMsg({ ok: false, text: r.error });
    setCur("");
    setNw("");
    setNw2("");
    setPwMsg({ ok: true, text: "Password changed. Use the new one next time you sign in." });
  };

  const download = () => {
    let cvDraft: unknown = null;
    try {
      cvDraft = JSON.parse(localStorage.getItem(`jm_cv_${user.id}`) || "null");
    } catch {
      cvDraft = null;
    }
    const data = {
      exportedAt: new Date().toISOString(),
      account: { name: user.name, email: user.email },
      profile: p,
      cvDraft,
      applications: loadApps(user.id)
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobmatch-my-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDataMsg("Your data was downloaded.");
  };

  const clearAll = () => {
    if (!window.confirm("Remove your profile, CV draft and tracked jobs from this device? Your account stays. This cannot be undone.")) return;
    try {
      localStorage.removeItem(`jm_cv_${user.id}`);
      localStorage.removeItem(`jm_apps_${user.id}`);
    } catch {
      /* ignore */
    }
    clearProfile(user.id);
    first.current = true;
    setP({ ...EMPTY_PROFILE });
    setSaveState("idle");
    refreshStats();
    setDataMsg("Removed from this device.");
  };

  const statusText =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved on this device" : saveState === "failed" ? "Could not save (browser storage is full or blocked)" : "Changes save automatically";

  return (
    <div className="mx-auto max-w-[1160px]">
      <a href="/" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-accent no-underline hover:underline">
        <ArrowLeft size={16} /> Back to the tools
      </a>

      {/* ------------ header ------------ */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} aria-label="Your profile" className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar photo={p.photo} name={user.name} size={84} />
            <div className="min-w-0">
              <h1 className="break-words text-[clamp(22px,4vw,30px)] font-extrabold leading-tight tracking-tight">{user.name}</h1>
              <p className="truncate text-sm font-semibold text-mute">{user.email}</p>
              {p.headline && <p className="mt-0.5 truncate text-sm font-bold text-accent">{p.headline}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <a href="/#cv" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-accent-ink no-underline shadow-glow max-sm:flex-1">
              <FileText size={16} /> Build my CV
            </a>
            <a href="/#jobs" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-panel px-3.5 py-2.5 text-sm font-semibold text-ink no-underline hover:border-accent hover:bg-soft max-sm:flex-1">
              <Briefcase size={16} /> Find jobs
            </a>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-bold">Profile complete</span>
            <span className="font-extrabold text-accent">{done.pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-accent/15" role="progressbar" aria-valuenow={done.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${done.pct}%` }} />
          </div>
          <p className="note mt-2">
            {done.missing.length === 0 ? "Your profile is complete. It will fill your CV and job search automatically." : `Next: add ${done.missing.slice(0, 3).join(", ")}.`}
          </p>
        </div>
      </motion.section>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-5 min-[900px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* ------------ career profile ------------ */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} aria-labelledby="careerh" className="card min-w-0">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <h2 id="careerh" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
              <UserRound className="shrink-0 text-accent" size={22} /> Career profile
            </h2>
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold", saveState === "failed" ? "bg-err/10 text-err" : "bg-accent/10 text-accent")} aria-live="polite">
              {statusText}
            </span>
          </div>

          {/* photo */}
          <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-soft/40 p-3.5">
            <Avatar photo={p.photo} name={user.name} size={72} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Profile photo</p>
              <p className="note mb-2">A clear head-and-shoulders picture. It is cropped to a square and stays on this device.</p>
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="pphoto" onChange={(e) => void onPhoto(e.target.files?.[0])} />
                <Button variant="ghost" onClick={() => fileRef.current?.click()}><Camera size={15} /> {p.photo ? "Change photo" : "Upload photo"}</Button>
                {p.photo && <Button variant="ghost" onClick={() => set("photo", "")}><Trash2 size={15} /> Remove</Button>}
              </div>
              {photoMsg && <Notice ok={false}>{photoMsg}</Notice>}
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 sm:grid-cols-2">
            <Field id="p-headline" label="Target job title" className="sm:col-span-2" hint="The job you are looking for. It fills the job search and the title on your CV.">
              <input id="p-headline" className={input} value={p.headline} maxLength={90} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Marketing Manager" />
            </Field>
            <Field id="p-phone" label="Phone">
              <input id="p-phone" type="tel" inputMode="tel" autoComplete="tel" className={input} value={p.phone} maxLength={40} onChange={(e) => set("phone", e.target.value)} placeholder="+92 300 1234567" />
            </Field>
            <Field id="p-level" label="Experience level">
              <select id="p-level" className={input} value={p.level} onChange={(e) => set("level", e.target.value as Level)}>
                {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </Field>
            <Field id="p-city" label="City">
              <input id="p-city" autoComplete="address-level2" className={input} value={p.city} maxLength={60} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Islamabad" />
            </Field>
            <Field id="p-country" label="Country">
              <select id="p-country" autoComplete="country-name" className={input} value={p.country} onChange={(e) => set("country", e.target.value)}>
                <option value="">Choose…</option>
                {Object.keys(COUNTRIES).map((c) => <option key={c}>{c}</option>)}
                {p.country && !(p.country in COUNTRIES) && <option>{p.country}</option>}
              </select>
            </Field>

            <div className="min-w-0 sm:col-span-2">
              <span id="p-setting-l" className="mb-1 block text-sm font-bold">Where you want to work</span>
              <div role="radiogroup" aria-labelledby="p-setting-l" className="flex flex-wrap gap-2">
                {SETTINGS.map((s) => {
                  const on = p.setting === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set("setting", s.key as Setting)}
                      className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-colors", on ? "border-transparent bg-brand text-accent-ink shadow-glow" : "border-line bg-panel text-ink hover:border-accent hover:bg-soft")}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field id="p-linkedin" label="LinkedIn">
              <input id="p-linkedin" type="url" inputMode="url" className={input} value={p.linkedin} maxLength={200} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/your-name" />
            </Field>
            <Field id="p-web" label="Website or portfolio">
              <input id="p-web" type="url" inputMode="url" className={input} value={p.website} maxLength={200} onChange={(e) => set("website", e.target.value)} placeholder="yourname.com" />
            </Field>

            <Field id="p-about" label="About me" className="sm:col-span-2" hint={`${p.about.length} / ${ABOUT_MAX}. Two or three sentences about your work and what you are good at.`}>
              <textarea id="p-about" rows={4} className={cn(input, "min-h-[110px] resize-y")} value={p.about} maxLength={ABOUT_MAX} onChange={(e) => set("about", e.target.value)} placeholder="e.g. Marketing specialist with 4 years of email and social media experience." />
            </Field>

            <div className="min-w-0 sm:col-span-2">
              <label htmlFor="p-skill" className="mb-1 block text-sm font-bold">Skills</label>
              <div className="flex gap-2">
                <input
                  id="p-skill"
                  className={cn(input, "min-w-0 flex-1")}
                  value={skillDraft}
                  maxLength={60}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSkills(skillDraft);
                    }
                  }}
                  placeholder="Type a skill, then press Enter"
                />
                <Button variant="ghost" onClick={() => addSkills(skillDraft)} aria-label="Add skill" className="shrink-0"><Plus size={16} /> Add</Button>
              </div>
              {skills.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Your skills">
                  {skills.map((s) => (
                    <li key={s} className="chip-soft inline-flex max-w-full items-center gap-1.5 !py-1.5 pl-3 pr-1.5">
                      <span className="min-w-0 break-words">{s}</span>
                      <button type="button" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`} className="grid h-5 w-5 shrink-0 place-items-center rounded-full hover:bg-accent/20">
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Field id="p-lang" label="Languages" className="sm:col-span-2" hint="Separate with commas.">
              <input id="p-lang" className={input} value={p.languages} maxLength={200} onChange={(e) => set("languages", e.target.value)} placeholder="e.g. English, Urdu" />
            </Field>
          </div>
        </motion.section>

        {/* ------------ right column ------------ */}
        <div className="min-w-0 space-y-5">
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} aria-labelledby="acch" className="card">
            <h2 id="acch" className="mb-4 flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
              <KeyRound className="shrink-0 text-accent" size={22} /> Account
            </h2>

            <Field id="a-name" label="Your name">
              <div className="flex gap-2">
                <input id="a-name" className={cn(input, "min-w-0 flex-1")} value={nm} maxLength={80} autoComplete="name" onChange={(e) => setNm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !nmBusy && void saveName()} />
                <Button onClick={() => void saveName()} disabled={nmBusy} className="shrink-0 !px-4 !py-2.5 text-sm">
                  {nmBusy ? <Loader2 size={15} className="animate-spin" /> : "Save"}
                </Button>
              </div>
            </Field>
            {nmMsg && <Notice ok={nmMsg.ok}>{nmMsg.text}</Notice>}

            <Field id="a-email" label="Email" className="mt-3.5" hint="Your sign-in email cannot be changed here.">
              <input id="a-email" className={cn(input, "cursor-not-allowed opacity-70")} value={user.email} readOnly disabled />
            </Field>

            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-3 text-base font-extrabold">Change password</h3>
              <div className="space-y-3">
                <Field id="a-cur" label="Current password">
                  <input id="a-cur" type={showPw ? "text" : "password"} autoComplete="current-password" className={input} value={cur} onChange={(e) => setCur(e.target.value)} />
                </Field>
                <Field id="a-new" label="New password" hint="At least 8 characters.">
                  <input id="a-new" type={showPw ? "text" : "password"} autoComplete="new-password" className={input} value={nw} onChange={(e) => setNw(e.target.value)} />
                </Field>
                <Field id="a-new2" label="Repeat the new password">
                  <input id="a-new2" type={showPw ? "text" : "password"} autoComplete="new-password" className={input} value={nw2} onChange={(e) => setNw2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !pwBusy && void savePassword()} />
                </Field>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-mute">
                  <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} className="h-[18px] w-[18px] accent-[rgb(var(--accent))]" /> Show passwords
                </label>
                <Button onClick={() => void savePassword()} disabled={pwBusy} className="w-full">
                  {pwBusy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Update password
                </Button>
              </div>
              {pwMsg && <Notice ok={pwMsg.ok}>{pwMsg.text}</Notice>}
            </div>

            <Button variant="ghost" onClick={() => void logout().then(() => { window.location.href = "/"; })} className="mt-5 w-full">
              <LogOut size={15} /> Log out
            </Button>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} aria-labelledby="datah" className="card">
            <h2 id="datah" className="mb-1.5 text-xl font-extrabold tracking-tight">Your data</h2>
            <p className="note mb-3">Your profile, CV draft and tracked jobs are saved only in this browser, not on our server. Download a copy before you clear your browser or switch devices.</p>
            <ul className="mb-3.5 space-y-1.5 text-sm">
              <li className="flex justify-between gap-3 rounded-lg bg-soft/50 px-3 py-2"><span className="text-mute">Tracked jobs</span><span className="font-bold">{stats.apps}</span></li>
              <li className="flex justify-between gap-3 rounded-lg bg-soft/50 px-3 py-2"><span className="text-mute">CV draft</span><span className="font-bold">{stats.cv ? "Saved" : "None yet"}</span></li>
            </ul>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" onClick={download}><Download size={15} /> Download my data</Button>
              <Button variant="ghost" onClick={clearAll} className="!text-err hover:!border-err"><Trash2 size={15} /> Clear data on this device</Button>
            </div>
            {dataMsg && <Notice ok>{dataMsg}</Notice>}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
