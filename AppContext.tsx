"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AIError, askAI } from "@/lib/ai";
import { parseScore, parseSections } from "@/lib/parse";
import { tailorPrompt } from "@/lib/prompts";
import { SAMPLE_JOB, SAMPLE_NAME, SAMPLE_RESUME } from "@/lib/sample";
import type { MatchScore, Sections, TabKey, Tone, User } from "@/types";

const EMPTY: Sections = { score: "", resume: "", letter: "", fit: "" };

interface AppState {
  job: string;
  setJob: (v: string) => void;
  resume: string;
  setResume: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  tone: Tone;
  setTone: (v: Tone) => void;
  sections: Sections;
  score: MatchScore | null;
  busy: boolean;
  error: string;
  tab: TabKey;
  setTab: (t: TabKey) => void;
  tailor: () => Promise<void>;
  loadExample: () => void;
  helpOpen: boolean;
  setHelpOpen: (fn: (o: boolean) => boolean) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  authReady: boolean;
  authOpen: boolean;
  authMode: "login" | "register";
  openAuth: (mode?: "login" | "register") => void;
  closeAuth: () => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState("");
  const [resume, setResume] = useState("");
  const [name, setName] = useState("");
  const [tone, setTone] = useState<Tone>("warm and professional");
  const [sections, setSections] = useState<Sections>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("resume");
  const [helpOpen, setHelpOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const abort = useRef<AbortController | null>(null);

  // use the account name for the cover letter until the person types another
  useEffect(() => {
    if (user) setName((n) => n || user.name);
  }, [user]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { user?: User | null }) => setUser(j.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setAuthReady(true));
  }, []);

  const openAuth = useCallback((mode: "login" | "register" = "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* the cookie is cleared by the server on success; ignore network errors */
    }
    setUser(null);
    setSections(EMPTY);
  }, []);

  const loadExample = useCallback(() => {
    setJob(SAMPLE_JOB);
    setResume(SAMPLE_RESUME);
    setName(SAMPLE_NAME);
    setError("");
  }, []);

  const tailor = useCallback(async () => {
    if (job.trim().length < 80 || resume.trim().length < 80) {
      setError("Paste the full job post and your full resume (at least a few lines each).");
      return;
    }
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setError("");
    setSections(EMPTY);
    setBusy(true);
    try {
      const text = await askAI(
        [{ role: "user", content: tailorPrompt(job.trim(), resume.trim(), name.trim(), tone) }],
        (t) => setSections(parseSections(t)),
        ctl.signal
      );
      setSections(parseSections(text));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof AIError ? e.message : "Something went wrong. Try again.");
    } finally {
      if (abort.current === ctl) setBusy(false);
    }
  }, [job, resume, name, tone]);

  const score = useMemo(() => parseScore(sections.score), [sections.score]);

  const value: AppState = {
    job, setJob, resume, setResume, name, setName, tone, setTone,
    sections, score, busy, error, tab, setTab, tailor, loadExample,
    helpOpen, setHelpOpen,
    user, setUser, authReady, authOpen, authMode, openAuth, closeAuth, logout
  };

  return (
    <MotionConfig reducedMotion="user">
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </MotionConfig>
  );
}
