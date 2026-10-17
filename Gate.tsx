"use client";

import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "@/components/AppContext";
import { Button } from "@/components/ui/Button";

/** Shows the tools only to signed-in people. Everyone else sees a sign-up prompt. */
export function Gate({ children, silent = false }: { children: ReactNode; silent?: boolean }) {
  const { user, authReady, openAuth } = useApp();

  if (silent) return user ? <>{children}</> : null;
  if (!authReady) {
    return (
      <div className="card mt-5 grid place-items-center py-16" id="tailor">
        <Loader2 className="animate-spin text-accent" />
      </div>
    );
  }
  if (!user) {
    return (
      <section id="tailor" className="card mt-5 flex flex-col items-center gap-3 py-14 text-center">
        <Lock className="text-accent" size={30} />
        <h2 className="text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">Create a free account to continue</h2>
        <p className="note max-w-[52ch]">
          Register to tailor your resume and cover letter, practice interviews, build a CV and search recent jobs.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Button onClick={() => openAuth("register")}>Sign up</Button>
          <Button variant="ghost" onClick={() => openAuth("login")}>I already have an account</Button>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}
