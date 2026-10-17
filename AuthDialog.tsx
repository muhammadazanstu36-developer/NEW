"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types";

export function AuthDialog() {
  const { authOpen, authMode, openAuth, closeAuth, setUser } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const register = authMode === "register";

  useEffect(() => {
    if (!authOpen) return;
    setError("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => first.current?.focus(), 80);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [authOpen, authMode, closeAuth]);

  const submit = async () => {
    setError("");
    if (register && name.trim().length < 2) return setError("Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      const r = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      });
      const j = (await r.json().catch(() => ({}))) as { user?: User; error?: string };
      if (!r.ok || !j.user) throw new Error(j.error || `The server did not answer properly (code ${r.status}). Please try again later.`);
      setUser(j.user);
      setPassword("");
      closeAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(10,16,32,0.55)] p-3 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && closeAuth()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="max-h-[calc(100dvh-24px)] w-full max-w-[440px] overflow-y-auto rounded-[22px] bg-panel bg-gradient-to-b from-accent/10 to-transparent to-[140px] p-[22px] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2.5">
              <h2 id="auth-title" className="text-2xl font-extrabold tracking-tight">
                {register ? "Create your account" : "Welcome back"}
              </h2>
              <Button variant="icon" aria-label="Close" onClick={closeAuth}><X size={18} /></Button>
            </div>
            <p className="note mb-4">
              {register ? "Register once to use the resume tailor, CV maker, mock interview and job search." : "Sign in to continue."}
            </p>

            <div onKeyDown={(e) => e.key === "Enter" && !busy && void submit()}>
              {register && (
                <div className="mb-4">
                  <label htmlFor="aname" className="label">Name</label>
                  <input ref={first} id="aname" type="text" maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="aemail" className="label">Email</label>
                <input ref={register ? undefined : first} id="aemail" type="email" maxLength={120} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
              </div>
              <div className="mb-4">
                <label htmlFor="apass" className="label">Password</label>
                <input id="apass" type="password" maxLength={128} autoComplete={register ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
                {register && <p className="note mt-1 !text-[13px]">At least 8 characters.</p>}
              </div>
              <Button onClick={() => void submit()} disabled={busy} className="w-full">
                {busy && <Loader2 size={16} className="animate-spin" />} {register ? "Create account" : "Sign in"}
              </Button>
            </div>

            {error && <p role="alert" className="mt-3 font-semibold text-err">{error}</p>}

            <p className="note mt-4 text-center">
              {register ? "Already have an account?" : "New here?"}{" "}
              <button type="button" onClick={() => openAuth(register ? "login" : "register")} className="font-bold text-accent">
                {register ? "Sign in" : "Create an account"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
