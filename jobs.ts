export const COUNTRIES: Record<string, string> = {
  Pakistan: "pk",
  "United States": "us",
  "United Kingdom": "gb",
  "United Arab Emirates": "ae",
  "Saudi Arabia": "sa",
  India: "in",
  Canada: "ca",
  Australia: "au"
};

export interface SourceDef {
  id: string;
  name: string;
  /** "board" sources come from the paid-free JSearch aggregator; "open" ones are free public feeds. */
  kind: "board" | "open";
}

export const SOURCES: SourceDef[] = [
  { id: "linkedin", name: "LinkedIn", kind: "board" },
  { id: "indeed", name: "Indeed", kind: "board" },
  { id: "glassdoor", name: "Glassdoor", kind: "board" },
  { id: "remotive", name: "Remotive", kind: "open" },
  { id: "remoteok", name: "RemoteOK", kind: "open" },
  { id: "arbeitnow", name: "Arbeitnow", kind: "open" }
];

export const DAY_OPTIONS = [
  { value: 1, label: "Last 24 hours" },
  { value: 3, label: "Last 3 days" },
  { value: 7, label: "Last 7 days" }
];

export function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (!t) return "";
  const h = Math.max(0, Math.round((Date.now() - t) / 3_600_000));
  if (h < 1) return "Just now";
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
