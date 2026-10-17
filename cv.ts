export interface Exp {
  id: string;
  role: string;
  company: string;
  start: string;
  end: string;
  /** one achievement per line */
  bullets: string;
}

export interface Edu {
  id: string;
  degree: string;
  school: string;
  start: string;
  end: string;
}

export type TemplateKey = "modern" | "classic" | "banner";

export interface CV {
  /** square JPEG as a data URL. It stays in the browser and is never uploaded. */
  photo: string;
  photoShape: "circle" | "square";
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  /** one link per line */
  links: string;
  summary: string;
  experience: Exp[];
  education: Edu[];
  /** comma separated */
  skills: string;
  languages: string;
  certs: string;
}

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const newExp = (): Exp => ({ id: uid(), role: "", company: "", start: "", end: "", bullets: "" });
export const newEdu = (): Edu => ({ id: uid(), degree: "", school: "", start: "", end: "" });

export const EMPTY_CV: CV = {
  photo: "",
  photoShape: "circle",
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  links: "",
  summary: "",
  experience: [newExp()],
  education: [newEdu()],
  skills: "",
  languages: "",
  certs: ""
};

export const SAMPLE_CV: CV = {
  ...EMPTY_CV,
  name: "Ayesha Khan",
  title: "Marketing Executive",
  email: "ayesha.khan@example.com",
  phone: "+92 300 0000000",
  location: "Islamabad, Pakistan",
  links: "linkedin.com/in/example",
  summary:
    "Marketing executive with three years of experience running social media and email campaigns for retail brands. Comfortable with analytics, content planning and working to tight deadlines.",
  experience: [
    {
      id: uid(),
      role: "Marketing Executive",
      company: "Sample Retail Co.",
      start: "2023",
      end: "Present",
      bullets: "Planned and published weekly social media content across three channels\nRan monthly email campaigns and reported results to the team\nWorked with designers to launch seasonal promotions"
    },
    {
      id: uid(),
      role: "Marketing Intern",
      company: "Sample Media",
      start: "2022",
      end: "2023",
      bullets: "Researched competitors and summarised findings for managers\nHelped schedule posts and reply to customer comments"
    }
  ],
  education: [{ id: uid(), degree: "BBA, Marketing", school: "Sample University", start: "2019", end: "2023" }],
  skills: "Social media, Email marketing, Canva, Google Analytics, Copywriting",
  languages: "English, Urdu",
  certs: "Google Analytics Certification"
};

export const TEMPLATES: { key: TemplateKey; label: string }[] = [
  { key: "modern", label: "Modern" },
  { key: "classic", label: "Classic" },
  { key: "banner", label: "Banner" }
];

export const COLORS: { value: string; name: string }[] = [
  { value: "#4f46e5", name: "Indigo" },
  { value: "#0f766e", name: "Teal" },
  { value: "#be123c", name: "Rose" },
  { value: "#1d4ed8", name: "Blue" },
  { value: "#b45309", name: "Amber" },
  { value: "#111827", name: "Charcoal" }
];

/* ---------- helpers used by the templates ---------- */
export const linesOf = (s: string): string[] => s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
export const bulletsOf = (s: string): string[] => linesOf(s).map((x) => x.replace(/^[-•*·–]\s*/, ""));
export const listOf = (s: string): string[] => s.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);
export const dates = (a: string, b: string): string => [a, b].filter(Boolean).join(" – ");

/** Fills in anything missing so an old saved draft can never crash the page. */
export function normalizeCV(c: Partial<CV> | null | undefined): CV {
  const x = c ?? {};
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const exp = Array.isArray(x.experience) ? x.experience : [];
  const edu = Array.isArray(x.education) ? x.education : [];
  return {
    photo: s(x.photo).startsWith("data:image/") ? s(x.photo) : "",
    photoShape: x.photoShape === "square" ? "square" : "circle",
    name: s(x.name),
    title: s(x.title),
    email: s(x.email),
    phone: s(x.phone),
    location: s(x.location),
    links: s(x.links),
    summary: s(x.summary),
    experience: exp.map((e) => ({ id: s(e?.id) || uid(), role: s(e?.role), company: s(e?.company), start: s(e?.start), end: s(e?.end), bullets: s(e?.bullets) })),
    education: edu.map((e) => ({ id: s(e?.id) || uid(), degree: s(e?.degree), school: s(e?.school), start: s(e?.start), end: s(e?.end) })),
    skills: s(x.skills),
    languages: s(x.languages),
    certs: s(x.certs)
  };
}

/* ---------- AI helpers ---------- */
export function cvPrompt(text: string): string {
  return `You turn the text below into data for a CV. Use ONLY facts that are in the text. Never invent employers, job titles, dates, degrees, numbers, skills or contact details. If something is not in the text, use an empty string. You may tidy wording and start each achievement with a verb, but do not add new facts.

Return ONLY one JSON object, with no markdown and no commentary, in exactly this shape:
{"name":"","title":"","email":"","phone":"","location":"","links":["..."],"summary":"2 to 3 sentences using only facts from the text","experience":[{"role":"","company":"","start":"","end":"","bullets":["..."]}],"education":[{"degree":"","school":"","start":"","end":""}],"skills":["..."],"languages":["..."],"certs":["..."]}

Put the newest job first. Keep at most 8 jobs and 5 education entries.

TEXT:
${text.slice(0, 12000)}`;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const joined = (v: unknown, sep: string): string => (Array.isArray(v) ? v.map(str).filter(Boolean).join(sep) : str(v));

/** Reads the AI answer. Returns null when it is not usable. */
export function cvFromAI(text: string): Omit<CV, "photo" | "photoShape"> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
  const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
  const exp = (Array.isArray(j.experience) ? j.experience : []).slice(0, 8).map((e) => {
    const r = rec(e);
    return { id: uid(), role: str(r.role), company: str(r.company), start: str(r.start), end: str(r.end), bullets: joined(r.bullets, "\n") };
  });
  const edu = (Array.isArray(j.education) ? j.education : []).slice(0, 5).map((e) => {
    const r = rec(e);
    return { id: uid(), degree: str(r.degree), school: str(r.school), start: str(r.start), end: str(r.end) };
  });
  const out = {
    name: str(j.name),
    title: str(j.title),
    email: str(j.email),
    phone: str(j.phone),
    location: str(j.location),
    links: joined(j.links, "\n"),
    summary: str(j.summary),
    experience: exp.length ? exp : [newExp()],
    education: edu.length ? edu : [newEdu()],
    skills: joined(j.skills, ", "),
    languages: joined(j.languages, ", "),
    certs: joined(j.certs, ", ")
  };
  const anything = out.name || out.summary || out.skills || exp.length || edu.length;
  return anything ? out : null;
}

/** Plain-text version of what the person typed, used to ask the AI for a summary. */
export function cvFacts(cv: CV): string {
  const parts: string[] = [];
  if (cv.title) parts.push(`Target role: ${cv.title}`);
  cv.experience
    .filter((e) => e.role || e.company)
    .forEach((e) => parts.push(`Job: ${e.role} at ${e.company} (${dates(e.start, e.end)})\n${bulletsOf(e.bullets).map((b) => `- ${b}`).join("\n")}`));
  cv.education.filter((e) => e.degree || e.school).forEach((e) => parts.push(`Education: ${e.degree}, ${e.school} (${dates(e.start, e.end)})`));
  if (cv.skills) parts.push(`Skills: ${cv.skills}`);
  return parts.join("\n");
}

export function summaryPrompt(facts: string): string {
  return `Write a professional CV summary of 2 to 3 sentences (under 60 words) for the person described below. Use ONLY the facts given. Do not invent numbers, employers or skills. Write in the first person without using the word "I". Return only the summary text, with no quotes and no heading.

${facts.slice(0, 6000)}`;
}
