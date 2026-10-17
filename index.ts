export type Tone = "warm and professional" | "formal and concise" | "confident and direct";
export type TabKey = "resume" | "letter" | "fit" | "interview";

export interface Sections {
  score: string;
  resume: string;
  letter: string;
  fit: string;
}

export interface MatchScore {
  score: number;
  matched: string[];
  gaps: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApplyOption {
  publisher: string;
  url: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  /** ISO date string of when the job was posted ("" if unknown) */
  postedAt: string;
  /** Human readable salary range, "" when the listing does not show one */
  salary: string;
  type: string;
  /** Plain-text description (HTML removed, shortened) */
  description: string;
  /** Where the listing was found, e.g. LinkedIn, Indeed, Remotive */
  sources: string[];
  /** Direct apply links (one per site that lists the job) */
  applyOptions: ApplyOption[];
}
