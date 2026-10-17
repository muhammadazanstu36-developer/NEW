import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export function HeroArt(props: Props) {
  return (
    <svg viewBox="0 0 200 150" role="img" aria-label="A resume with highlighted lines and a check mark" {...props}><rect x="22" y="22" width="100" height="120" rx="10" className="fill-soft stroke-line"/><g transform="rotate(6 110 74)"><rect x="50" y="8" width="112" height="132" rx="10" className="fill-panel stroke-line [stroke-width:1.5]"/><circle cx="76" cy="34" r="11" className="fill-accent"/><rect x="94" y="27" width="50" height="6" rx="3" className="fill-ink"/><rect x="94" y="38" width="32" height="5" rx="2.5" className="fill-line"/><rect x="64" y="62" width="84" height="6" rx="3" className="fill-hl"/><rect x="64" y="76" width="70" height="6" rx="3" className="fill-line"/><rect x="64" y="90" width="84" height="6" rx="3" className="fill-hl"/><rect x="64" y="104" width="56" height="6" rx="3" className="fill-line"/><rect x="64" y="118" width="76" height="6" rx="3" className="fill-line"/></g><circle cx="162" cy="116" r="24" className="fill-accent"/><path d="M151 116l8 8 14-17" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-ink"/></svg>
  );
}

export function EmptyArt(props: Props) {
  return (
    <svg viewBox="0 0 120 90" role="img" aria-label="Empty page waiting for results" {...props}><rect x="30" y="8" width="60" height="76" rx="8" className="fill-soft stroke-line"/><rect x="40" y="22" width="40" height="5" rx="2.5" className="fill-line"/><rect x="40" y="34" width="30" height="5" rx="2.5" className="fill-hl"/><rect x="40" y="46" width="40" height="5" rx="2.5" className="fill-line"/><rect x="40" y="58" width="24" height="5" rx="2.5" className="fill-line"/><path d="M96 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" className="fill-accent"/><path d="M18 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" className="fill-accent opacity-60"/></svg>
  );
}

export function InterviewArt(props: Props) {
  return (
    <svg viewBox="0 0 150 90" role="img" aria-label="Interview conversation" {...props}><rect x="6" y="6" width="84" height="38" rx="12" className="fill-soft stroke-line"/><rect x="18" y="19" width="50" height="5" rx="2.5" className="fill-accent"/><rect x="18" y="29" width="34" height="5" rx="2.5" className="fill-line"/><path d="M24 44l-2 10 12-10z" className="fill-soft"/><rect x="58" y="48" width="86" height="36" rx="12" className="fill-accent"/><rect x="72" y="60" width="52" height="5" rx="2.5" className="fill-accent-ink"/><rect x="72" y="70" width="34" height="5" rx="2.5" className="fill-accent-ink opacity-60"/><path d="M128 84l4 8-14-8z" className="fill-accent"/></svg>
  );
}

export function FeatureTailorArt(props: Props) {
  return (
    <svg viewBox="0 0 220 150" role="img" aria-label="A resume turning into a tailored resume" {...props}><rect x="14" y="26" width="72" height="96" rx="8" className="fill-soft stroke-line"/><rect x="26" y="42" width="40" height="6" rx="3" className="fill-line"/><rect x="26" y="56" width="48" height="5" rx="2.5" className="fill-line"/><rect x="26" y="68" width="36" height="5" rx="2.5" className="fill-line"/><rect x="26" y="80" width="46" height="5" rx="2.5" className="fill-line"/><path d="M96 74h24M114 64l12 10-12 10" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent"/><rect x="138" y="14" width="72" height="108" rx="8" className="fill-panel stroke-accent [stroke-width:2]"/><circle cx="154" cy="34" r="7" className="fill-accent"/><rect x="166" y="30" width="30" height="5" rx="2.5" className="fill-ink"/><rect x="150" y="52" width="48" height="6" rx="3" className="fill-hl"/><rect x="150" y="66" width="38" height="5" rx="2.5" className="fill-line"/><rect x="150" y="78" width="48" height="6" rx="3" className="fill-hl"/><rect x="150" y="92" width="34" height="5" rx="2.5" className="fill-line"/><path d="M202 4l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" className="fill-accent"/></svg>
  );
}

export function FeatureScoreArt(props: Props) {
  return (
    <svg viewBox="0 0 220 150" role="img" aria-label="A match score gauge with skill chips" {...props}><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{stopColor: "rgb(var(--accent))"}}/><stop offset="1" style={{stopColor: "#0ea5e9"}}/></linearGradient></defs><circle cx="110" cy="66" r="46" fill="none" strokeWidth="14" className="stroke-line"/><circle cx="110" cy="66" r="46" fill="none" stroke="url(#fg)" strokeWidth="14" strokeLinecap="round" strokeDasharray="289" strokeDashoffset="78" transform="rotate(-90 110 66)"/><text x="110" y="76" textAnchor="middle" fontSize="28" fontWeight="800" fontFamily="Manrope Variable, sans-serif" className="fill-ink">73</text><rect x="20" y="128" width="56" height="16" rx="8" className="fill-soft"/><rect x="84" y="128" width="48" height="16" rx="8" className="fill-soft"/><rect x="140" y="128" width="60" height="16" rx="8" className="fill-hl opacity-[.85]"/></svg>
  );
}

export function FeatureInterviewArt(props: Props) {
  return (
    <svg viewBox="0 0 220 150" role="img" aria-label="A person answering interview questions and getting feedback" {...props}><circle cx="52" cy="62" r="20" className="fill-accent"/><path d="M14 132c2-28 18-42 38-42s36 14 38 42z" className="fill-soft stroke-line"/><rect x="96" y="14" width="112" height="54" rx="14" className="fill-panel stroke-accent [stroke-width:2]"/><path d="M106 68l-8 14 22-14z" className="fill-panel stroke-accent [stroke-width:2]"/><rect x="110" y="28" width="62" height="6" rx="3" className="fill-ink"/><rect x="110" y="42" width="44" height="6" rx="3" className="fill-line"/><circle cx="188" cy="40" r="9" className="fill-accent"/><path d="M183.500 40l3.200 3.200 5-6" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-ink"/><rect x="112" y="92" width="96" height="42" rx="12" className="fill-accent"/><rect x="124" y="104" width="62" height="6" rx="3" className="fill-accent-ink"/><rect x="124" y="118" width="40" height="6" rx="3" className="fill-accent-ink opacity-60"/></svg>
  );
}

export function LogoMark(props: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><rect width="24" height="24" rx="7" className="fill-accent"/><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-ink"/></svg>
  );
}
