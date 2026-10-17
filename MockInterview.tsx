"use client";

import { motion } from "framer-motion";
import { Loader2, RotateCcw, Send, Mic } from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { InterviewArt } from "@/components/Illustrations";
import { Button } from "@/components/ui/Button";
import { AIError, askAI } from "@/lib/ai";
import { parseInterviewReply } from "@/lib/parse";
import { INTERVIEW_QUESTIONS, interviewIntro } from "@/lib/prompts";
import type { ChatMessage } from "@/types";

interface Turn {
  id: number;
  role: "bot" | "me";
  text: string;
}

function BotTurn({ text }: { text: string }) {
  const r = parseInterviewReply(text);
  return (
    <div>
      {r.feedback && (
        <div className="my-3 whitespace-pre-wrap break-words rounded-[14px] border border-dashed border-line p-3.5">{r.feedback}</div>
      )}
      {r.question && (
        <div className="my-3 whitespace-pre-wrap break-words rounded-[14px] bg-gradient-to-r from-accent/15 to-soft p-3.5 font-bold shadow-[inset_4px_0_0_rgb(var(--accent))]">
          {r.question}
        </div>
      )}
      {r.summary && (
        <div className="my-3 whitespace-pre-wrap break-words rounded-[14px] border border-dashed border-line p-3.5">
          <b>Summary</b>
          {"\n"}
          {r.summary}
        </div>
      )}
    </div>
  );
}

export function MockInterview() {
  const { job, resume } = useApp();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const hist = useRef<ChatMessage[]>([]);
  const counter = useRef(0);
  const lastUser = useRef(0);

  const run = async (msgs: ChatMessage[]) => {
    const id = ++counter.current;
    setError("");
    setBusy(true);
    setTurns((t) => [...t, { id, role: "bot", text: "" }]);
    try {
      const text = await askAI(msgs, (full) => setTurns((t) => t.map((x) => (x.id === id ? { ...x, text: full } : x))));
      hist.current = [...msgs, { role: "assistant", content: text }];
      if (/SUMMARY:/.test(text)) setDone(true);
    } catch (e) {
      setTurns((t) => t.filter((x) => x.id !== id));
      if (msgs.length === 1) {
        hist.current = [];
        setStarted(false);
      } else {
        hist.current = msgs.slice(0, -1);
        setTurns((t) => t.filter((x) => x.id !== lastUser.current));
        setAnswer(msgs[msgs.length - 1].content);
      }
      setError(e instanceof AIError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    if (job.trim().length < 80 || resume.trim().length < 80) {
      setError("Paste the full job post and your resume in the form first.");
      return;
    }
    setDone(false);
    setTurns([]);
    setStarted(true);
    const first: ChatMessage[] = [{ role: "user", content: interviewIntro(job.trim(), resume.trim()) }];
    hist.current = first;
    void run(first);
  };

  const send = () => {
    const a = answer.trim();
    if (!a || busy) return;
    const id = ++counter.current;
    lastUser.current = id;
    setTurns((t) => [...t, { id, role: "me", text: a }]);
    setAnswer("");
    void run([...hist.current, { role: "user", content: a }]);
  };

  const reset = () => {
    if (busy) return;
    hist.current = [];
    setTurns([]);
    setStarted(false);
    setDone(false);
    setError("");
    setAnswer("");
  };

  return (
    <div>
      {!started && (
        <div className="mb-3">
          <InterviewArt className="mb-3 h-auto w-[150px] max-w-full" />
          <p className="note mb-3">A mock interview built from your job post and resume: {INTERVIEW_QUESTIONS} questions, with feedback after each answer.</p>
          <Button onClick={start}><Mic size={18} /> Start interview</Button>
        </div>
      )}

      <div aria-live="polite">
        {turns.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {t.role === "me" ? (
              <div className="my-3 ml-3 whitespace-pre-wrap break-words rounded-[14px_14px_4px_14px] border border-line bg-panel p-3.5 font-serif sm:ml-6">{t.text}</div>
            ) : t.text ? (
              <BotTurn text={t.text} />
            ) : (
              <div className="my-3 flex items-center gap-2 text-mute"><Loader2 size={16} className="animate-spin" /> Thinking…</div>
            )}
          </motion.div>
        ))}
      </div>

      {started && !done && (
        <div className="mt-2">
          <label htmlFor="answer" className="mb-1.5 block font-bold">Your answer</label>
          <textarea id="answer" rows={4} value={answer} disabled={busy} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer as you would say it" className="field min-h-[110px] resize-y" />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button onClick={send} disabled={busy || !answer.trim()}><Send size={16} /> Send answer</Button>
            <Button variant="ghost" onClick={reset} disabled={busy}><RotateCcw size={15} /> Start over</Button>
          </div>
        </div>
      )}
      {done && (
        <Button variant="ghost" onClick={reset} className="mt-2"><RotateCcw size={15} /> Start over</Button>
      )}
      {error && <p role="alert" className="mt-3 font-semibold text-err">{error}</p>}
    </div>
  );
}
