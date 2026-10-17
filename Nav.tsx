"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, ChevronDown, ClipboardList, FileText, ListChecks, LogOut, Mail, Menu, Mic, Target, UserPlus, UserRound, Wand2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { PROFILE_EVENT, loadProfile } from "@/lib/profile";
import type { TabKey } from "@/types";

const TOOLS = [
  { id: "resume", label: "Resume", Icon: FileText },
  { id: "letter", label: "Cover letter", Icon: Mail },
  { id: "fit", label: "Fit notes", Icon: Target },
  { id: "interview", label: "Mock interview", Icon: Mic },
  { id: "ats", label: "ATS check", Icon: ListChecks },
  { id: "cv", label: "CV maker", Icon: Wand2 },
  { id: "jobs", label: "Find jobs", Icon: Briefcase },
  { id: "tracker", label: "Job tracker", Icon: ClipboardList }
] as const;

const TABS: string[] = ["resume", "letter", "fit", "interview"];
const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function Nav() {
  const { setTab, setHelpOpen, user, authReady, openAuth, logout } = useApp();
  const pathname = usePathname();
  const home = pathname === "/";
  const onProfile = pathname === "/profile";
  const [photo, setPhoto] = useState("");
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState(false); // desktop "Free tools" dropdown
  const [toolsM, setToolsM] = useState(false); // same list inside the phone menu
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) {
        setOpen(false);
        setTools(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setTools(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // the profile photo shown next to the name (it lives in this browser)
  useEffect(() => {
    if (!user) return setPhoto("");
    const read = () => setPhoto(loadProfile(user.id).photo);
    read();
    window.addEventListener(PROFILE_EVENT, read);
    return () => window.removeEventListener(PROFILE_EVENT, read);
  }, [user]);

  // arriving from another page with #cv, #jobs ...: scroll once the tools are on screen
  useEffect(() => {
    if (!home || !authReady || !user || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    const t = setTimeout(() => scrollToId(id), 400);
    return () => clearTimeout(t);
  }, [home, authReady, user]);

  const go = (id: string) => {
    setOpen(false);
    setTools(false);
    if (id === "help") {
      if (!home) {
        window.location.href = "/";
        return;
      }
      setHelpOpen((o) => !o);
      return window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (!user) return openAuth("register");
    if (!home) {
      // from the profile page: open the home page at that tool
      window.location.href = `/#${TABS.includes(id) ? "results" : id}`;
      return;
    }
    if (TABS.includes(id)) {
      setTab(id as TabKey);
      return scrollToId("results");
    }
    scrollToId(id);
  };

  return (
    <header
      ref={box}
      className="fixed inset-x-0 top-0 z-40 border-b border-line bg-panel pt-[env(safe-area-inset-top)] shadow-[0_10px_24px_-18px_var(--shadow)]"
    >
      <div className="mx-auto flex h-[60px] max-w-[1160px] items-center gap-3.5 px-3 sm:px-5">
        <a
          href={home ? "#" : "/"}
          onClick={(e) => {
            if (!home) return;
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight no-underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg" />
          <span className="bg-brand bg-clip-text text-transparent">JobMatch AI</span>
        </a>

        <nav aria-label="Main menu" className="ml-auto hidden items-center gap-0.5 nav:flex">
          <button type="button" onClick={() => go("tailor")} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-mute transition-colors hover:bg-soft hover:text-accent">
            Tailor
          </button>

          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={tools}
              onClick={() => setTools((o) => !o)}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-soft hover:text-accent ${tools ? "bg-soft text-accent" : "text-mute"}`}
            >
              Free tools <ChevronDown size={15} className={`transition-transform ${tools ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {tools && (
                <motion.div
                  role="menu"
                  aria-label="Free tools"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full z-50 mt-2 w-[220px] rounded-2xl border border-line bg-panel p-1.5 shadow-[0_24px_40px_-18px_rgba(0,0,0,0.4)]"
                >
                  {TOOLS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      onClick={() => go(id)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-soft hover:text-accent"
                    >
                      <Icon size={16} className="shrink-0 text-accent" /> {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button type="button" onClick={() => go("help")} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-mute transition-colors hover:bg-soft hover:text-accent">
            How it works
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2 nav:ml-0">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/profile"
                title="My profile"
                aria-label="My profile"
                aria-current={onProfile ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm font-semibold no-underline transition-colors hover:bg-soft nav:pr-3 ${onProfile ? "bg-soft text-accent" : "text-mute"}`}
              >
                <Avatar photo={photo} name={user.name} size={32} />
                <span className="hidden max-w-[120px] truncate nav:inline">{user.name}</span>
              </Link>
              <Button variant="ghost" onClick={() => void logout()} className="hidden nav:inline-flex">
                <LogOut size={15} /> Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => openAuth("login")} className="hidden nav:inline-flex">
                Sign in
              </Button>
              <Button onClick={() => openAuth("register")} className="hidden !px-[18px] !py-2 text-sm nav:inline-flex">
                <UserPlus size={16} /> Sign up
              </Button>
            </>
          )}
          <Button
            variant="icon"
            className="nav:hidden"
            aria-label="Menu"
            title="Menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "bars"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid place-items-center"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-76px)] overflow-y-auto border-b border-line bg-panel px-3 py-2 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.35)] nav:hidden"
          >
            <button type="button" onClick={() => go("tailor")} className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink transition-colors hover:bg-soft hover:text-accent">
              Tailor
            </button>

            <button
              type="button"
              aria-expanded={toolsM}
              aria-controls="mobile-tools"
              onClick={() => setToolsM((o) => !o)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink transition-colors hover:bg-soft hover:text-accent"
            >
              Free tools <ChevronDown size={18} className={`transition-transform ${toolsM ? "rotate-180" : ""}`} />
            </button>
            {toolsM && (
              <div id="mobile-tools" className="mb-1 ml-3 border-l-2 border-accent/30 pl-1.5">
                {TOOLS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => go(id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-3 text-left text-base font-semibold text-ink transition-colors hover:bg-soft hover:text-accent"
                  >
                    <Icon size={17} className="shrink-0 text-accent" /> {label}
                  </button>
                ))}
              </div>
            )}

            <button type="button" onClick={() => go("help")} className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink transition-colors hover:bg-soft hover:text-accent">
              How it works
            </button>
            <div className="mt-1 border-t border-line pt-1">
              {user && (
                <Link href="/profile" onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink no-underline transition-colors hover:bg-soft hover:text-accent">
                  <UserRound size={18} className="shrink-0 text-accent" /> My profile
                </Link>
              )}
              {user ? (
                <button type="button" onClick={() => { setOpen(false); void logout(); }} className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink hover:bg-soft hover:text-accent">
                  Log out ({user.name})
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => { setOpen(false); openAuth("login"); }} className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink hover:bg-soft hover:text-accent">Sign in</button>
                  <button type="button" onClick={() => { setOpen(false); openAuth("register"); }} className="block w-full rounded-lg px-3 py-3.5 text-left text-base font-semibold text-ink hover:bg-soft hover:text-accent">Sign up</button>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
