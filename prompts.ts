import type { Tone } from "@/types";

export const MARK = {
  score: "===SCORE===",
  resume: "===RESUME===",
  letter: "===COVER LETTER===",
  fit: "===FIT NOTES==="
} as const;

export const INTERVIEW_QUESTIONS = 5;

export function tailorPrompt(job: string, resume: string, name: string, tone: Tone): string {
  return (
    "You tailor job applications. Use ONLY facts present in the resume below. Never invent employers, titles, dates, degrees, metrics or skills. " +
    "If the job wants something the resume lacks, do not claim it; list it under gaps.\n\n" +
    `Output exactly four sections, each starting with its marker on its own line, in this order:\n${MARK.score}\n` +
    'One line of JSON only, no code fence: {"score":<0-100, an honest estimate of how well the ORIGINAL resume matches the job>,' +
    '"matched":[up to 6 short skills or requirements the resume clearly meets],' +
    '"gaps":[up to 4 short requirements the resume lacks or shows only weakly]}. Do not inflate the score.\n' +
    `${MARK.resume}\nThe resume rewritten for this job: plain text, reorder and rephrase bullets so the most relevant experience leads, ` +
    "mirror the job's keywords where truthful, keep it to what fits one to two pages. Wrap each phrase you added or reworded to match the job " +
    "in [[double square brackets]] (a few per section, not whole lines).\n" +
    `${MARK.letter}\nA cover letter of 250-330 words in a ${tone} tone${name ? ", signed by " + name : ""}. ` +
    "Reference specific details from the job post and two or three concrete achievements from the resume. No cliches like 'I am writing to apply'.\n" +
    `${MARK.fit}\nShort plain-text notes: 1) Strong matches (3-5 lines), 2) Gaps or missing requirements and how to address them honestly, ` +
    "3) Three things to double-check before sending.\n\nNo other text, no markdown headings.\n\n" +
    `JOB POST:\n${job}\n\nRESUME:\n${resume}`
  );
}

export function interviewIntro(job: string, resume: string): string {
  return (
    "You are a hiring manager interviewing me for the job below. Ask a mix of behavioral and role-specific questions drawn from the job post and my resume, one at a time.\n\n" +
    "Rules: on this first turn reply with ONLY the first question, no preamble. After each answer I give, reply in exactly this format:\n" +
    "FEEDBACK: 2-4 sentences covering what worked, what was missing, 'Score: n/5', and one stronger way to phrase it using only facts from my resume.\n" +
    "NEXT QUESTION: the next question.\n" +
    `After my ${INTERVIEW_QUESTIONS}th answer, write FEEDBACK as above, then instead of NEXT QUESTION write SUMMARY: followed by three short bullets of overall advice.\n\n` +
    `JOB POST:\n${job}\n\nRESUME:\n${resume}\n\nAsk the first question.`
  );
}

export function titlesPrompt(resume: string): string {
  return (
    "Read this resume and suggest 6 realistic job titles this person could apply for now, best fit first. " +
    "Reply with ONLY a JSON array of short strings, no code fence.\n\nRESUME:\n" +
    resume.slice(0, 8000)
  );
}
