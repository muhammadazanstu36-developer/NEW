/**
 * Simple ATS-style keyword check. It compares the words in a job post with the words in a resume.
 * It is NOT the score any real applicant tracking system gives; those work differently.
 */

const STOP = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just may me might more most must my no nor not of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours`.split(/\s+/)
);
const GENERIC = new Set(
  `ability able across applicants apply benefits candidate candidates company compensation description duties employer employment equal excellent experience experienced including include includes job join looking opportunity paid plus position preferred qualifications required requirements responsibilities responsible role salary seeking skills strong team teams time understanding well work working years year etc new using use based related ensure help support need needs want wants seek good great nice senior junior build design write maintain run define partner present report reports mentor promote degree bachelor bachelors masters`.split(/\s+/)
);

const TOKEN = /[a-z][a-z0-9+#]*(?:[./-][a-z0-9+#]+)*/g;
const SPLIT = /[\n\r;:,!?()[\]{}•·|]+|\.(?=\s|$)|\s[-–—]\s/;

/** Text -> phrases -> lowercase words (words never join across commas, bullets or sentence ends). */
export function segments(text: string): string[][] {
  return text
    .toLowerCase()
    .split(SPLIT)
    .map((seg) => (seg.match(TOKEN) ?? []).map((t) => t.replace(/\.+$/, "")))
    .filter((a) => a.length > 0);
}

export const stem = (t: string): string => (t.length > 4 ? t.replace(/(ing|ed|es|s)$/, "") : t);
const usable = (t: string): boolean => t.length >= 2 && !STOP.has(t) && !GENERIC.has(t) && !/^\d+$/.test(t);

interface Stat {
  word: string;
  n: number;
  score: number;
  first: number;
}

export function extractKeywords(job: string, max = 30): string[] {
  const uni = new Map<string, Stat>();
  const bi = new Map<string, Stat>();
  let pos = 0;
  // tool names are usually capitalised in the middle of a sentence ("... such as Jira")
  const proper = new Set<string>();
  for (const m of job.matchAll(/[a-z,;:)]\s+([A-Z][A-Za-z0-9+#]*)/g)) proper.add(m[1].toLowerCase());
  const bump = (m: Map<string, Stat>, key: string, word: string, short: boolean, extra = 0) => {
    const s = m.get(key) ?? { word, n: 0, score: 0, first: pos };
    s.n += 1;
    s.score += 1 + (short ? 1 : 0) + extra; // short lists, tool-like names and capitalised names count extra
    m.set(key, s);
  };
  for (const seg of segments(job)) {
    const short = seg.length <= 3;
    for (let i = 0; i < seg.length; i++) {
      pos += 1;
      const t = seg[i];
      if (usable(t)) bump(uni, stem(t), t, short, (/[+#./]/.test(t) ? 1 : 0) + (proper.has(t) ? 1 : 0));
      if (i > 0 && usable(seg[i - 1]) && usable(t)) bump(bi, `${stem(seg[i - 1])} ${stem(t)}`, `${seg[i - 1]} ${t}`, short);
    }
  }
  const pick = (m: Map<string, Stat>) => [...m.entries()].filter(([, s]) => s.score >= 2);
  const bigrams = pick(bi);
  const chosenBi = bigrams.sort((a, b) => b[1].score * 1.5 - a[1].score * 1.5 || a[1].first - b[1].first).slice(0, 10);
  const inBi = new Map<string, number>();
  for (const [k, s] of chosenBi) for (const part of k.split(" ")) inBi.set(part, Math.max(inBi.get(part) ?? 0, s.n));
  const unigrams = pick(uni).filter(([k]) => !inBi.has(k)); // a word already inside a chosen phrase is not listed twice
  const all = [
    ...chosenBi.map(([, s]) => ({ w: s.word, v: s.score * 1.5, first: s.first })),
    ...unigrams.map(([, s]) => ({ w: s.word, v: s.score, first: s.first }))
  ];
  all.sort((a, b) => b.v - a.v || a.first - b.first);
  return all.slice(0, max).map((x) => x.w);
}

function hasKeyword(resume: string[][], kw: string): boolean {
  const parts = kw.split(" ").map(stem);
  for (const seg of resume) {
    const st = seg.map(stem);
    for (let i = 0; i + parts.length <= st.length; i++) {
      if (parts.every((p, j) => st[i + j] === p)) return true;
    }
  }
  return false;
}

export interface Check {
  label: string;
  ok: boolean;
  tip: string;
}

export interface AtsResult {
  pct: number;
  found: string[];
  missing: string[];
  checks: Check[];
}

export function formatChecks(resume: string): Check[] {
  const words = (resume.match(/\S+/g) ?? []).length;
  const lines = resume.split(/\r?\n/);
  const bullets = lines.filter((l) => /^\s*[-•*·–]\s+\S/.test(l)).length;
  const numbers = (resume.match(/\d[\d,.]*\s?%?/g) ?? []).length;
  return [
    { label: "Email address", ok: /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(resume), tip: "Put your email near the top." },
    { label: "Phone number", ok: /\+?\d[\d\s().-]{7,}\d/.test(resume), tip: "Add a phone number near the top." },
    { label: "Work experience heading", ok: /^\s*(professional |work )?(experience|employment( history)?|work history)\b/im.test(resume), tip: "Use a plain heading such as “Experience” on its own line." },
    { label: "Education heading", ok: /^\s*education\b/im.test(resume), tip: "Use a plain heading such as “Education” on its own line." },
    { label: "Skills heading", ok: /^\s*(technical |key |core )?skills\b/im.test(resume), tip: "Add a “Skills” section so keywords are easy to find." },
    { label: "A sensible length (250 to 900 words)", ok: words >= 250 && words <= 900, tip: words < 250 ? "Your resume looks short. Add more detail about your results." : "Your resume looks long. Aim for one or two pages." },
    { label: "Bullet points for achievements", ok: bullets >= 4, tip: "Start lines with “-” or “•” to list what you achieved." },
    { label: "Numbers that show results", ok: numbers >= 3, tip: "Add figures where true, such as team size, percentages or amounts." }
  ];
}

export function analyze(job: string, resume: string): AtsResult {
  const kws = extractKeywords(job);
  const rs = segments(resume);
  const found: string[] = [];
  const missing: string[] = [];
  for (const k of kws) (hasKeyword(rs, k) ? found : missing).push(k);
  const pct = kws.length ? Math.round((found.length / kws.length) * 100) : 0;
  return { pct, found, missing, checks: formatChecks(resume) };
}
