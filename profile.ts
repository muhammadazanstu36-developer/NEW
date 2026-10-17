import type { CV } from "@/lib/cv";
import type { User } from "@/types";

/**
 * The career profile. Like the CV draft and the job tracker, it is kept only in this browser
 * (localStorage, one entry per account). Only the name and password live on the server.
 */
export type Setting = "any" | "remote" | "hybrid" | "onsite";
export type Level = "" | "entry" | "mid" | "senior" | "lead";

export interface Profile {
  /** square JPEG as a data URL */
  photo: string;
  /** the job you are aiming for, e.g. "Marketing Manager" */
  headline: string;
  phone: string;
  city: string;
  country: string;
  setting: Setting;
  level: Level;
  linkedin: string;
  website: string;
  about: string;
  /** comma separated */
  skills: string;
  /** comma separated */
  languages: string;
}

export const EMPTY_PROFILE: Profile = {
  photo: "",
  headline: "",
  phone: "",
  city: "",
  country: "",
  setting: "any",
  level: "",
  linkedin: "",
  website: "",
  about: "",
  skills: "",
  languages: ""
};

export const SETTINGS: { key: Setting; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "remote", label: "Remote" },
  { key: "hybrid", label: "Hybrid" },
  { key: "onsite", label: "On-site" }
];

export const LEVELS: { key: Level; label: string }[] = [
  { key: "", label: "Choose…" },
  { key: "entry", label: "Student / entry level" },
  { key: "mid", label: "Mid level (2 to 5 years)" },
  { key: "senior", label: "Senior (5+ years)" },
  { key: "lead", label: "Lead / manager" }
];

export const ABOUT_MAX = 600;

const KEY = (userId: string) => `jm_profile_${userId}`;
export const PROFILE_EVENT = "jm:profile";

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");

export function normalizeProfile(raw: unknown): Profile {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const photo = typeof o.photo === "string" && o.photo.startsWith("data:image/") && o.photo.length < 400_000 ? o.photo : "";
  const setting = SETTINGS.some((s) => s.key === o.setting) ? (o.setting as Setting) : "any";
  const level = LEVELS.some((l) => l.key === o.level) ? (o.level as Level) : "";
  return {
    photo,
    headline: str(o.headline, 90),
    phone: str(o.phone, 40),
    city: str(o.city, 60),
    country: str(o.country, 60),
    setting,
    level,
    linkedin: str(o.linkedin, 200),
    website: str(o.website, 200),
    about: str(o.about, ABOUT_MAX),
    skills: str(o.skills, 600),
    languages: str(o.languages, 200)
  };
}

export function loadProfile(userId: string): Profile {
  try {
    return normalizeProfile(JSON.parse(localStorage.getItem(KEY(userId)) || "{}"));
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

/** Returns false when the browser refused to save (storage full or blocked). */
export function saveProfile(userId: string, p: Profile): boolean {
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(p));
    window.dispatchEvent(new Event(PROFILE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearProfile(userId: string): void {
  try {
    localStorage.removeItem(KEY(userId));
    window.dispatchEvent(new Event(PROFILE_EVENT));
  } catch {
    /* ignore */
  }
}

/** "a, b ,, c" or one per line -> ["a","b","c"] */
export const skillList = (s: string): string[] =>
  Array.from(new Set(s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean)));

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export interface Completeness {
  pct: number;
  /** short names of what is still empty, in the order worth filling in */
  missing: string[];
}

export function completeness(p: Profile): Completeness {
  const checks: [string, boolean][] = [
    ["a photo", !!p.photo],
    ["your target job title", p.headline.trim().length >= 3],
    ["a phone number", p.phone.trim().length >= 5],
    ["your city or country", !!(p.city.trim() || p.country.trim())],
    ["a short about-me", p.about.trim().length >= 60],
    ["3 or more skills", skillList(p.skills).length >= 3],
    ["a LinkedIn or website link", !!(p.linkedin.trim() || p.website.trim())],
    ["your experience level", !!p.level]
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([n]) => n) };
}

/** The fields of a CV that a profile can fill in. */
export function profileToCv(p: Profile, user: Pick<User, "name" | "email">): Partial<CV> {
  const where = [p.city.trim(), p.country.trim()].filter(Boolean).join(", ");
  const links = [p.linkedin.trim(), p.website.trim()].filter(Boolean).join("\n");
  const out: Partial<CV> = {
    name: user.name,
    email: user.email,
    title: p.headline.trim(),
    phone: p.phone.trim(),
    location: where,
    links,
    summary: p.about.trim(),
    skills: skillList(p.skills).join(", "),
    languages: p.languages.trim(),
    photo: p.photo
  };
  return out;
}

export const hasProfileData = (p: Profile): boolean =>
  !!(p.photo || p.headline || p.phone || p.city || p.country || p.linkedin || p.website || p.about || p.skills || p.languages);
