import { MARK } from "@/lib/prompts";
import type { MatchScore, Sections } from "@/types";

const KEYS = ["score", "resume", "letter", "fit"] as const;

/** Splits the model's reply into its four sections. Works on partial text while it streams. */
export function parseSections(text: string): Sections {
  const out: Sections = { score: "", resume: "", letter: "", fit: "" };
  const pos = KEYS.map((k) => text.indexOf(MARK[k]));
  KEYS.forEach((k, i) => {
    if (pos[i] < 0) return;
    const start = pos[i] + MARK[k].length;
    let end = text.length;
    pos.forEach((p) => {
      if (p > pos[i] && p < end) end = p;
    });
    out[k] = text.slice(start, end).trim();
  });
  return out;
}

export function parseScore(raw: string): MatchScore | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw.replace(/```json|```/g, "").trim()) as Partial<MatchScore>;
    const n = Math.round(Number(j.score));
    if (Number.isNaN(n)) return null;
    const list = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : [];
    return { score: Math.max(0, Math.min(100, n)), matched: list(j.matched), gaps: list(j.gaps) };
  } catch {
    return null;
  }
}

export function splitHighlights(text: string): { text: string; hl: boolean }[] {
  const parts: { text: string; hl: boolean }[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hl: false });
    parts.push({ text: m[1], hl: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hl: false });
  return parts;
}

export const plain = (t: string) => t.replace(/\[\[(.+?)\]\]/g, "$1");

export interface InterviewReply {
  feedback: string;
  question: string;
  summary: string;
}

export function parseInterviewReply(t: string): InterviewReply {
  const f = t.indexOf("FEEDBACK:");
  const nq = t.indexOf("NEXT QUESTION:");
  const sm = t.indexOf("SUMMARY:");
  if (f < 0) return { feedback: "", question: t.trim(), summary: "" };
  const cuts = [nq, sm].filter((i) => i >= 0);
  const end = cuts.length ? Math.min(...cuts) : t.length;
  return {
    feedback: t.slice(f + 9, end).trim(),
    question: nq >= 0 ? t.slice(nq + 14, sm >= 0 && sm > nq ? sm : t.length).trim() : "",
    summary: sm >= 0 ? t.slice(sm + 8).trim() : ""
  };
}
