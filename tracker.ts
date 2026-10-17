export type Status = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface App {
  id: string;
  company: string;
  title: string;
  url: string;
  salary: string;
  status: Status;
  /** YYYY-MM-DD */
  date: string;
  notes: string;
}

export const STATUSES: { key: Status; label: string; color: string }[] = [
  { key: "saved", label: "Saved", color: "#64748b" },
  { key: "applied", label: "Applied", color: "#4f46e5" },
  { key: "interview", label: "Interview", color: "#d97706" },
  { key: "offer", label: "Offer", color: "#16a34a" },
  { key: "rejected", label: "Rejected", color: "#dc2626" }
];

const KEY = (userId: string) => `jm_apps_${userId}`;
export const EVENT = "jm:apps";

export const uid = (): string => Math.random().toString(36).slice(2, 10);
export const todayStr = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const isStatus = (v: unknown): v is Status => STATUSES.some((s) => s.key === v);
const s = (v: unknown, max = 600): string => (typeof v === "string" ? v.slice(0, max) : "");

export function loadApps(userId: string): App[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY(userId)) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => {
      const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
      return {
        id: s(o.id, 40) || uid(),
        company: s(o.company, 120),
        title: s(o.title, 160),
        url: s(o.url, 800),
        salary: s(o.salary, 80),
        status: isStatus(o.status) ? o.status : "applied",
        date: /^\d{4}-\d{2}-\d{2}$/.test(s(o.date, 10)) ? s(o.date, 10) : todayStr(),
        notes: s(o.notes, 2000)
      };
    });
  } catch {
    return [];
  }
}

/** Returns false when the browser would not store it (private mode or full storage). */
export function saveApps(userId: string, apps: App[]): boolean {
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(apps));
    return true;
  } catch {
    return false;
  }
}

/** Used by the job search: adds one job and tells the tracker to reload. Skips duplicates. */
export function addApp(userId: string, a: Partial<App> & { company: string; title: string }): boolean {
  const list = loadApps(userId);
  const dup = list.some((x) => (a.url && x.url === a.url) || (x.company.toLowerCase() === a.company.toLowerCase() && x.title.toLowerCase() === a.title.toLowerCase()));
  if (dup) return false;
  list.unshift({ id: uid(), url: "", salary: "", status: "saved", date: todayStr(), notes: "", ...a });
  const ok = saveApps(userId, list);
  if (ok && typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
  return ok;
}

export interface Stats {
  counts: Record<Status, number>;
  total: number;
  sent: number;
  interviewRate: number;
  weeks: { label: string; n: number }[];
}

const parse = (d: string): Date => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
};

export function stats(apps: App[], now = new Date()): Stats {
  const counts: Record<Status, number> = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  for (const a of apps) counts[a.status] += 1;
  const sent = counts.applied + counts.interview + counts.offer + counts.rejected;
  const interviewRate = sent ? Math.round(((counts.interview + counts.offer) / sent) * 100) : 0;

  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weeks: { label: string; n: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(monday);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const n = apps.filter((a) => a.status !== "saved" && parse(a.date) >= start && parse(a.date) < end).length;
    weeks.push({ label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), n });
  }
  return { counts, total: apps.length, sent, interviewRate, weeks };
}
