"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY = "jm_install_hidden_at";
const HIDE_DAYS = 14;

const remember = () => {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

/**
 * "Get the app" banner for phones. This installs the website as an app on the home screen
 * (a Progressive Web App). It is not a Play Store or App Store download.
 */
export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"native" | "ios" | "other">("other");
  const [steps, setSteps] = useState(false);
  const saved = useRef<InstallEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const installed =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installed) return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const phone = ios || /Android|Mobile/i.test(ua) || (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900);
    if (!phone) return;

    try {
      const t = Number(localStorage.getItem(KEY));
      if (t && Date.now() - t < HIDE_DAYS * 86_400_000) return;
    } catch {
      /* ignore */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      saved.current = e as InstallEvent;
      setMode("native");
    };
    const onInstalled = () => {
      setShow(false);
      remember();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setMode(ios ? "ios" : "other");
    const timer = setTimeout(() => setShow(true), 1200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    setShow(false);
    remember();
  };

  const install = async () => {
    const ev = saved.current;
    if (mode === "native" && ev) {
      try {
        await ev.prompt();
        const choice = await ev.userChoice;
        saved.current = null;
        if (choice.outcome === "accepted") return close();
      } catch {
        /* fall through to the written steps */
      }
    }
    setSteps(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Install the JobMatch AI app"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[55] mx-auto max-w-[460px] rounded-2xl border border-line bg-panel p-3.5 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <b className="block leading-tight">Get the JobMatch AI app</b>
              <p className="note mt-0.5 !text-[13px] leading-snug">Install it on your phone for one-tap access. Free, and no app store needed.</p>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="-m-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-mute hover:bg-soft hover:text-ink">
              <X size={18} />
            </button>
          </div>

          {steps && (
            <p role="status" className="mt-3 rounded-xl bg-soft p-3 text-sm leading-relaxed">
              {mode === "ios"
                ? "In Safari, tap the Share button (the square with an arrow), then choose “Add to Home Screen”."
                : "Open your browser menu (the three dots), then tap “Install app” or “Add to Home screen”."}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <Button onClick={() => void install()} className="flex-1 !py-2.5 text-sm">
              <Download size={16} /> {steps ? "Got it" : "Install app"}
            </Button>
            <Button variant="ghost" onClick={close} className="!py-2.5">Not now</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
